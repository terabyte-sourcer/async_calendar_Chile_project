from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.user import User


class TeamBase(BaseModel):
    name: str


class TeamCreate(TeamBase):
    member_ids: Optional[List[int]] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = None


class TeamInDBBase(TeamBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class Team(TeamInDBBase):
    pass


class TeamWithMembers(Team):
    members: List[User] = []


class TeamMemberUpdate(BaseModel):
    member_ids: List[int] 