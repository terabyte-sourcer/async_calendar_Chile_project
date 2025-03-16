from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_verified_user
from app.db.models import Calendar, User
from app.db.session import get_db
from app.schemas.calendar import (
    Calendar as CalendarSchema,
    CalendarAuth,
    CalendarCreate,
    CalendarUpdate,
)
from app.services.calendar import (
    get_calendar_auth_url,
    sync_calendar,
    validate_calendar_auth,
)

router = APIRouter(prefix="/calendars", tags=["calendars"])


@router.get("", response_model=List[CalendarSchema])
def read_calendars(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Get all calendars for the current user.
    """
    calendars = db.query(Calendar).filter(Calendar.user_id == current_user.id).all()
    return calendars


@router.post("", response_model=CalendarSchema)
def create_calendar(
    *,
    db: Session = Depends(get_db),
    calendar_in: CalendarCreate,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Create new calendar.
    """
    # Check if this is the first calendar for the user
    is_first = (
        db.query(Calendar).filter(Calendar.user_id == current_user.id).count() == 0
    )
    
    calendar = Calendar(
        user_id=current_user.id,
        name=calendar_in.name,
        provider=calendar_in.provider,
        provider_id=calendar_in.provider_id,
        access_token=calendar_in.access_token,
        refresh_token=calendar_in.refresh_token,
        token_expires_at=calendar_in.token_expires_at,
        is_primary=is_first if calendar_in.is_primary is None else calendar_in.is_primary,
    )
    db.add(calendar)
    db.commit()
    db.refresh(calendar)
    return calendar


@router.get("/auth-url/{provider}")
def get_auth_url(
    provider: str,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Get authentication URL for a calendar provider.
    """
    auth_url = get_calendar_auth_url(provider)
    if not auth_url:
        raise HTTPException(
            status_code=400,
            detail=f"Authentication for provider {provider} is not supported",
        )
    return {"auth_url": auth_url}


@router.post("/auth", response_model=CalendarSchema)
def authenticate_calendar(
    *,
    db: Session = Depends(get_db),
    auth_data: CalendarAuth,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Authenticate with a calendar provider.
    """
    calendar_data = validate_calendar_auth(
        auth_data.provider, auth_data.auth_code, auth_data.redirect_uri
    )
    if not calendar_data:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to authenticate with provider {auth_data.provider}",
        )
    
    # Check if calendar already exists
    calendar = (
        db.query(Calendar)
        .filter(
            Calendar.user_id == current_user.id,
            Calendar.provider == auth_data.provider,
            Calendar.provider_id == calendar_data["provider_id"],
        )
        .first()
    )
    
    if calendar:
        # Update existing calendar
        calendar.access_token = calendar_data["access_token"]
        calendar.refresh_token = calendar_data["refresh_token"]
        calendar.token_expires_at = calendar_data["token_expires_at"]
        db.commit()
        db.refresh(calendar)
    else:
        # Create new calendar
        is_first = (
            db.query(Calendar).filter(Calendar.user_id == current_user.id).count() == 0
        )
        calendar = Calendar(
            user_id=current_user.id,
            name=calendar_data["name"],
            provider=auth_data.provider,
            provider_id=calendar_data["provider_id"],
            access_token=calendar_data["access_token"],
            refresh_token=calendar_data["refresh_token"],
            token_expires_at=calendar_data["token_expires_at"],
            is_primary=is_first,
        )
        db.add(calendar)
        db.commit()
        db.refresh(calendar)
    
    return calendar


@router.put("/{calendar_id}", response_model=CalendarSchema)
def update_calendar(
    *,
    db: Session = Depends(get_db),
    calendar_id: int,
    calendar_in: CalendarUpdate,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Update a calendar.
    """
    calendar = (
        db.query(Calendar)
        .filter(Calendar.id == calendar_id, Calendar.user_id == current_user.id)
        .first()
    )
    if not calendar:
        raise HTTPException(
            status_code=404,
            detail="The calendar with this id does not exist in the system",
        )
    
    # Update calendar attributes
    for field in calendar_in.__dict__:
        if field != "id" and hasattr(calendar, field):
            value = getattr(calendar_in, field)
            if value is not None:
                setattr(calendar, field, value)
    
    # If setting this calendar as primary, unset others
    if calendar_in.is_primary:
        other_calendars = (
            db.query(Calendar)
            .filter(
                Calendar.user_id == current_user.id,
                Calendar.id != calendar_id,
                Calendar.is_primary == True,
            )
            .all()
        )
        for other in other_calendars:
            other.is_primary = False
    
    db.commit()
    db.refresh(calendar)
    return calendar


@router.delete("/{calendar_id}", response_model=CalendarSchema)
def delete_calendar(
    *,
    db: Session = Depends(get_db),
    calendar_id: int,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Delete a calendar.
    """
    calendar = (
        db.query(Calendar)
        .filter(Calendar.id == calendar_id, Calendar.user_id == current_user.id)
        .first()
    )
    if not calendar:
        raise HTTPException(
            status_code=404,
            detail="The calendar with this id does not exist in the system",
        )
    
    db.delete(calendar)
    db.commit()
    return calendar


@router.post("/{calendar_id}/sync", response_model=CalendarSchema)
def sync_calendar_events(
    *,
    db: Session = Depends(get_db),
    calendar_id: int,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Sync calendar events.
    """
    calendar = (
        db.query(Calendar)
        .filter(Calendar.id == calendar_id, Calendar.user_id == current_user.id)
        .first()
    )
    if not calendar:
        raise HTTPException(
            status_code=404,
            detail="The calendar with this id does not exist in the system",
        )
    
    # Sync calendar
    success = sync_calendar(calendar)
    if not success:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to sync calendar {calendar.name}",
        )
    
    db.refresh(calendar)
    return calendar 