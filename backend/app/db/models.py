import enum
from datetime import datetime, time
from typing import List

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Table, Time
from sqlalchemy.orm import relationship

from app.db.base import Base


class UserRole(enum.Enum):
    SUPER_ADMIN = "super_admin"
    USER = "user"


class MeetingType(enum.Enum):
    VIRTUAL = "virtual"
    IN_PERSON = "in_person"


class RouteTime(enum.Enum):
    THIRTY = 30
    FORTY_FIVE = 45
    SIXTY = 60


# Association table for team members
team_members = Table(
    "team_members",
    Base.metadata,
    Column("team_id", Integer, ForeignKey("teams.id")),
    Column("user_id", Integer, ForeignKey("users.id")),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    calendars = relationship("Calendar", back_populates="user", cascade="all, delete-orphan")
    availability = relationship("Availability", back_populates="user", cascade="all, delete-orphan")
    meetings_created = relationship("Meeting", back_populates="creator", foreign_keys="Meeting.creator_id")
    teams_owned = relationship("Team", back_populates="owner")
    teams = relationship("Team", secondary=team_members, back_populates="members")
    route_time_preference = Column(Enum(RouteTime), default=RouteTime.THIRTY)


class Calendar(Base):
    __tablename__ = "calendars"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    provider = Column(String, nullable=False)  # google, outlook, apple, mailcow, etc.
    provider_id = Column(String, nullable=True)  # ID from the provider
    access_token = Column(String, nullable=True)
    refresh_token = Column(String, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_synced_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="calendars")
    meetings = relationship("Meeting", back_populates="calendar")


class Availability(Base):
    __tablename__ = "availability"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    day_of_week = Column(Integer, nullable=False)  # 0-6 for Monday-Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Relationships
    user = relationship("User", back_populates="availability")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="teams_owned")
    members = relationship("User", secondary=team_members, back_populates="teams")
    meetings = relationship("Meeting", back_populates="team")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"))
    calendar_id = Column(Integer, ForeignKey("calendars.id"))
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    meeting_type = Column(Enum(MeetingType), default=MeetingType.VIRTUAL)
    location = Column(String, nullable=True)
    virtual_meeting_url = Column(String, nullable=True)
    virtual_meeting_provider = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    provider_event_id = Column(String, nullable=True)  # ID from the calendar provider

    # Relationships
    creator = relationship("User", back_populates="meetings_created", foreign_keys=[creator_id])
    calendar = relationship("Calendar", back_populates="meetings")
    team = relationship("Team", back_populates="meetings")
    route_times = relationship("RouteTimeEvent", back_populates="meeting", cascade="all, delete-orphan")


class RouteTimeEvent(Base):
    __tablename__ = "route_time_events"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    is_before = Column(Boolean, default=True)  # True for before meeting, False for after
    duration = Column(Integer, nullable=False)  # Duration in minutes
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    provider_event_id = Column(String, nullable=True)  # ID from the calendar provider

    # Relationships
    meeting = relationship("Meeting", back_populates="route_times") 