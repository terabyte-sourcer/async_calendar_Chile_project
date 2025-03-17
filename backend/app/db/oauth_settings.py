from sqlalchemy import Column, String, Integer, Boolean
from .base import Base

class OAuthSettings(Base):
    __tablename__ = "oauth_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, unique=True, index=True)
    client_id = Column(String)
    client_secret = Column(String)
    is_active = Column(Boolean, default=True)