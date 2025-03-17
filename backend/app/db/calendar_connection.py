from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from .base import Base

class CalendarConnection(Base):
    __tablename__ = "user_calendar_connections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    provider = Column(String)
    access_token = Column(String)
    refresh_token = Column(String)
    expires_at = Column(DateTime)