from datetime import datetime, timedelta
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_verified_user
from app.db.models import Calendar, Meeting, MeetingType, RouteTimeEvent, Team, User
from app.db.session import get_db
from app.schemas.meeting import (
    AvailabilitySlot,
    Meeting as MeetingSchema,
    MeetingCreate,
    MeetingUpdate,
    MeetingWithAttendees,
    TeamAvailability,
)
from app.services.calendar import (
    create_calendar_event,
    delete_calendar_event,
    get_calendar_events,
    update_calendar_event,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=List[MeetingSchema])
def read_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all meetings for the current user.
    """
    meetings = (
        db.query(Meeting)
        .join(Calendar)
        .filter(Calendar.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return meetings


@router.post("", response_model=MeetingSchema)
def create_meeting(
    *,
    db: Session = Depends(get_db),
    meeting_in: MeetingCreate,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Create new meeting.
    """
    # Check if calendar exists and belongs to user
    calendar = (
        db.query(Calendar)
        .filter(
            Calendar.id == meeting_in.calendar_id,
            Calendar.user_id == current_user.id,
        )
        .first()
    )
    if not calendar:
        raise HTTPException(
            status_code=404,
            detail="The calendar with this id does not exist or does not belong to you",
        )
    
    # Check if team exists
    team = None
    if meeting_in.team_id:
        team = (
            db.query(Team)
            .filter(
                Team.id == meeting_in.team_id,
                (Team.owner_id == current_user.id)
                | (Team.members.any(id=current_user.id)),
            )
            .first()
        )
        if not team:
            raise HTTPException(
                status_code=404,
                detail="The team with this id does not exist or you are not a member",
            )
    
    # Create meeting
    meeting = Meeting(
        title=meeting_in.title,
        description=meeting_in.description,
        start_time=meeting_in.start_time,
        end_time=meeting_in.end_time,
        creator_id=current_user.id,
        calendar_id=meeting_in.calendar_id,
        team_id=meeting_in.team_id,
        meeting_type=meeting_in.meeting_type,
        location=meeting_in.location,
        virtual_meeting_provider=meeting_in.virtual_meeting_provider,
        virtual_meeting_url=meeting_in.virtual_meeting_url,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # Create route time events if needed
    if meeting_in.add_route_time and meeting_in.meeting_type == MeetingType.IN_PERSON:
        route_time_duration = (
            meeting_in.route_time_duration.value
            if meeting_in.route_time_duration
            else current_user.route_time_preference.value
        )
        
        # Before meeting
        before_route = RouteTimeEvent(
            meeting_id=meeting.id,
            user_id=current_user.id,
            is_before=True,
            duration=route_time_duration,
            start_time=meeting.start_time - timedelta(minutes=route_time_duration),
            end_time=meeting.start_time,
        )
        db.add(before_route)
        
        # After meeting
        after_route = RouteTimeEvent(
            meeting_id=meeting.id,
            user_id=current_user.id,
            is_before=False,
            duration=route_time_duration,
            start_time=meeting.end_time,
            end_time=meeting.end_time + timedelta(minutes=route_time_duration),
        )
        db.add(after_route)
        
        db.commit()
        db.refresh(meeting)
    
    # Create event in calendar
    event_data = {
        "title": meeting.title,
        "description": meeting.description,
        "start_time": meeting.start_time,
        "end_time": meeting.end_time,
        "location": meeting.location,
    }
    
    provider_event_id = create_calendar_event(calendar, event_data)
    if provider_event_id:
        meeting.provider_event_id = provider_event_id
        db.commit()
    
    return meeting


@router.get("/{meeting_id}", response_model=MeetingSchema)
def read_meeting(
    *,
    db: Session = Depends(get_db),
    meeting_id: int,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Get meeting by ID.
    """
    meeting = (
        db.query(Meeting)
        .join(Calendar)
        .filter(
            Meeting.id == meeting_id,
            Calendar.user_id == current_user.id,
        )
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="The meeting with this id does not exist or does not belong to you",
        )
    return meeting


@router.put("/{meeting_id}", response_model=MeetingSchema)
def update_meeting(
    *,
    db: Session = Depends(get_db),
    meeting_id: int,
    meeting_in: MeetingUpdate,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Update meeting.
    """
    meeting = (
        db.query(Meeting)
        .join(Calendar)
        .filter(
            Meeting.id == meeting_id,
            Calendar.user_id == current_user.id,
        )
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="The meeting with this id does not exist or does not belong to you",
        )
    
    # Update calendar if changed
    calendar = None
    if meeting_in.calendar_id and meeting_in.calendar_id != meeting.calendar_id:
        calendar = (
            db.query(Calendar)
            .filter(
                Calendar.id == meeting_in.calendar_id,
                Calendar.user_id == current_user.id,
            )
            .first()
        )
        if not calendar:
            raise HTTPException(
                status_code=404,
                detail="The calendar with this id does not exist or does not belong to you",
            )
        meeting.calendar_id = meeting_in.calendar_id
    else:
        calendar = meeting.calendar
    
    # Update team if changed
    if meeting_in.team_id is not None and meeting_in.team_id != meeting.team_id:
        if meeting_in.team_id == 0:
            meeting.team_id = None
        else:
            team = (
                db.query(Team)
                .filter(
                    Team.id == meeting_in.team_id,
                    (Team.owner_id == current_user.id)
                    | (Team.members.any(id=current_user.id)),
                )
                .first()
            )
            if not team:
                raise HTTPException(
                    status_code=404,
                    detail="The team with this id does not exist or you are not a member",
                )
            meeting.team_id = meeting_in.team_id
    
    # Update meeting attributes
    if meeting_in.title is not None:
        meeting.title = meeting_in.title
    if meeting_in.description is not None:
        meeting.description = meeting_in.description
    if meeting_in.start_time is not None:
        meeting.start_time = meeting_in.start_time
    if meeting_in.end_time is not None:
        meeting.end_time = meeting_in.end_time
    if meeting_in.meeting_type is not None:
        meeting.meeting_type = meeting_in.meeting_type
    if meeting_in.location is not None:
        meeting.location = meeting_in.location
    if meeting_in.virtual_meeting_provider is not None:
        meeting.virtual_meeting_provider = meeting_in.virtual_meeting_provider
    if meeting_in.virtual_meeting_url is not None:
        meeting.virtual_meeting_url = meeting_in.virtual_meeting_url
    
    db.commit()
    db.refresh(meeting)
    
    # Update event in calendar
    if meeting.provider_event_id:
        event_data = {
            "title": meeting.title,
            "description": meeting.description,
            "start_time": meeting.start_time,
            "end_time": meeting.end_time,
            "location": meeting.location,
        }
        update_calendar_event(calendar, meeting.provider_event_id, event_data)
    
    return meeting


@router.delete("/{meeting_id}", response_model=MeetingSchema)
def delete_meeting(
    *,
    db: Session = Depends(get_db),
    meeting_id: int,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Delete meeting.
    """
    meeting = (
        db.query(Meeting)
        .join(Calendar)
        .filter(
            Meeting.id == meeting_id,
            Calendar.user_id == current_user.id,
        )
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="The meeting with this id does not exist or does not belong to you",
        )
    
    # Delete event from calendar
    if meeting.provider_event_id:
        delete_calendar_event(meeting.calendar, meeting.provider_event_id)
    
    db.delete(meeting)
    db.commit()
    return meeting


@router.get("/team/{team_id}/availability", response_model=List[TeamAvailability])
def get_team_availability(
    *,
    db: Session = Depends(get_db),
    team_id: int,
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Get availability for all team members.
    """
    team = (
        db.query(Team)
        .filter(
            Team.id == team_id,
            (Team.owner_id == current_user.id) | (Team.members.any(id=current_user.id)),
        )
        .first()
    )
    if not team:
        raise HTTPException(
            status_code=404,
            detail="The team with this id does not exist or you are not a member",
        )
    
    result = []
    for member in team.members:
        # Get user's availability settings
        user_availability = []
        
        # Get user's calendar events
        busy_slots = []
        for calendar in member.calendars:
            if calendar.is_active:
                events = get_calendar_events(calendar, start_date, end_date)
                for event in events:
                    busy_slots.append(
                        AvailabilitySlot(
                            start_time=event["start_time"],
                            end_time=event["end_time"],
                        )
                    )
        
        # Calculate available slots
        available_slots = []
        # This is a simplified version - in a real implementation,
        # you would need to calculate available slots based on user's
        # availability settings and busy slots
        
        result.append(
            TeamAvailability(
                user_id=member.id,
                user_name=member.name,
                available_slots=available_slots,
            )
        )
    
    return result 