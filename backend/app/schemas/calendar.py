from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class CalendarBase(BaseModel):
    name: str
    provider: str
    is_primary: bool = False
    is_active: bool = True


class CalendarCreate(CalendarBase):
    provider_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None


class CalendarUpdate(BaseModel):
    name: Optional[str] = None
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    last_synced_at: Optional[datetime] = None


class CalendarInDBBase(CalendarBase):
    id: int
    user_id: int
    provider_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_synced_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class Calendar(CalendarInDBBase):
    pass


class CalendarInDB(CalendarInDBBase):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None


class CalendarAuth(BaseModel):
    provider: str
    auth_code: str
    redirect_uri: str 