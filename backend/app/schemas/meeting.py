from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, validator

from app.db.models import MeetingType, RouteTime


class RouteTimeEventBase(BaseModel):
    is_before: bool = True
    duration: int


class RouteTimeEventCreate(RouteTimeEventBase):
    pass


class RouteTimeEventInDBBase(RouteTimeEventBase):
    id: int
    meeting_id: int
    user_id: int
    start_time: datetime
    end_time: datetime
    provider_event_id: Optional[str] = None

    class Config:
        orm_mode = True


class RouteTimeEvent(RouteTimeEventInDBBase):
    pass


class MeetingBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    meeting_type: MeetingType
    location: Optional[str] = None
    virtual_meeting_provider: Optional[str] = None
    virtual_meeting_url: Optional[str] = None

    @validator("end_time")
    def end_time_must_be_after_start_time(cls, v, values):
        if "start_time" in values and v <= values["start_time"]:
            raise ValueError("end_time must be after start_time")
        return v

    @validator("location")
    def location_required_for_in_person(cls, v, values):
        if (
            "meeting_type" in values
            and values["meeting_type"] == MeetingType.IN_PERSON
            and not v
        ):
            raise ValueError("location is required for in-person meetings")
        return v

    @validator("virtual_meeting_provider", "virtual_meeting_url")
    def virtual_meeting_info_required_for_virtual(cls, v, values):
        if (
            "meeting_type" in values
            and values["meeting_type"] == MeetingType.VIRTUAL
            and not v
        ):
            raise ValueError(
                "virtual_meeting_provider and virtual_meeting_url are required for virtual meetings"
            )
        return v


class MeetingCreate(MeetingBase):
    calendar_id: int
    team_id: Optional[int] = None
    attendees: Optional[List[int]] = None  # List of user IDs
    add_route_time: bool = False
    route_time_duration: Optional[RouteTime] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    meeting_type: Optional[MeetingType] = None
    location: Optional[str] = None
    virtual_meeting_provider: Optional[str] = None
    virtual_meeting_url: Optional[str] = None
    calendar_id: Optional[int] = None
    team_id: Optional[int] = None


class MeetingInDBBase(MeetingBase):
    id: int
    creator_id: int
    calendar_id: int
    team_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    provider_event_id: Optional[str] = None

    class Config:
        orm_mode = True


class Meeting(MeetingInDBBase):
    route_times: List[RouteTimeEvent] = []


class MeetingWithAttendees(Meeting):
    attendees: List[int] = []  # List of user IDs


class AvailabilitySlot(BaseModel):
    start_time: datetime
    end_time: datetime


class TeamAvailability(BaseModel):
    user_id: int
    user_name: str
    available_slots: List[AvailabilitySlot] 