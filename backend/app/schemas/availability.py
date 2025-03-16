from datetime import time
from typing import List, Optional

from pydantic import BaseModel, Field, validator


class AvailabilityBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time

    @validator("end_time")
    def end_time_must_be_after_start_time(cls, v, values):
        if "start_time" in values and v <= values["start_time"]:
            raise ValueError("end_time must be after start_time")
        return v


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityUpdate(BaseModel):
    start_time: Optional[time] = None
    end_time: Optional[time] = None


class AvailabilityInDBBase(AvailabilityBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True


class Availability(AvailabilityInDBBase):
    pass


class UserAvailability(BaseModel):
    availabilities: List[Availability] 