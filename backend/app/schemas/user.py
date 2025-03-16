from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field

from app.db.models import RouteTime, UserRole


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    route_time_preference: Optional[RouteTime] = None


class UserInDBBase(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    route_time_preference: RouteTime

    class Config:
        orm_mode = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    hashed_password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None


class TokenPayload(BaseModel):
    sub: Optional[int] = None 