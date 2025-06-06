from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_verified_user
from app.db.models import Availability, User
from app.db.session import get_db
from app.schemas.availability import (
    Availability as AvailabilitySchema,
    AvailabilityCreate,
    AvailabilityUpdate,
    UserAvailability,
)

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get("", response_model=UserAvailability)
def read_availabilities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Get all availabilities for the current user.
    """
    availabilities = (
        db.query(Availability)
        .filter(Availability.user_id == current_user.id)
        .all()
    )
    return {"availabilities": availabilities}


@router.post("", response_model=AvailabilitySchema)
def create_availability(
    *,
    db: Session = Depends(get_db),
    availability_in: AvailabilityCreate,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Create new availability.
    """
    availability = Availability(
        user_id=current_user.id,
        day_of_week=availability_in.day_of_week,
        start_time=availability_in.start_time,
        end_time=availability_in.end_time,
    )
    db.add(availability)
    db.commit()
    db.refresh(availability)
    return availability


@router.put("/{availability_id}", response_model=AvailabilitySchema)
def update_availability(
    *,
    db: Session = Depends(get_db),
    availability_id: int,
    availability_in: AvailabilityUpdate,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Update an availability.
    """
    availability = (
        db.query(Availability)
        .filter(
            Availability.id == availability_id,
            Availability.user_id == current_user.id,
        )
        .first()
    )
    if not availability:
        raise HTTPException(
            status_code=404,
            detail="The availability with this id does not exist in the system",
        )
    
    if availability_in.start_time is not None:
        availability.start_time = availability_in.start_time
    if availability_in.end_time is not None:
        availability.end_time = availability_in.end_time
    
    db.commit()
    db.refresh(availability)
    return availability


@router.delete("/{availability_id}", response_model=AvailabilitySchema)
def delete_availability(
    *,
    db: Session = Depends(get_db),
    availability_id: int,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Delete an availability.
    """
    availability = (
        db.query(Availability)
        .filter(
            Availability.id == availability_id,
            Availability.user_id == current_user.id,
        )
        .first()
    )
    if not availability:
        raise HTTPException(
            status_code=404,
            detail="The availability with this id does not exist in the system",
        )
    
    db.delete(availability)
    db.commit()
    return availability 