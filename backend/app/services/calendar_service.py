from typing import Dict
from datetime import datetime
from sqlalchemy.orm import Session
import requests
from ..db.calendar_connection import CalendarConnection
from ..db.oauth_settings import OAuthSettings

async def get_oauth_url(db: Session, provider: str) -> str:
    settings = db.query(OAuthSettings).filter(
        OAuthSettings.provider == provider,
        OAuthSettings.is_active == True
    ).first()
    
    if not settings:
        raise ValueError(f"No active settings for provider {provider}")
    
    # Provider-specific OAuth URL generation
    if provider == "google":
        return f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.client_id}&redirect_uri=http://localhost:8000/calendars/callback/google&response_type=code&scope=https://www.googleapis.com/auth/calendar"
    elif provider == "outlook":
        return f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={settings.client_id}&redirect_uri=http://localhost:8000/calendars/callback/outlook&response_type=code&scope=Calendars.ReadWrite"
    
    raise ValueError(f"Unsupported provider: {provider}")

async def exchange_code_for_tokens(db: Session, provider: str, code: str) -> Dict[str, str]:
    settings = db.query(OAuthSettings).filter(
        OAuthSettings.provider == provider,
        OAuthSettings.is_active == True
    ).first()
    
    if not settings:
        raise ValueError(f"No active settings for provider {provider}")
    
    if provider == "google":
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id": settings.client_id,
            "client_secret": settings.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": "http://localhost:8000/calendars/callback/google"
        }
    elif provider == "outlook":
        token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        payload = {
            "client_id": settings.client_id,
            "client_secret": settings.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": "http://localhost:8000/calendars/callback/outlook"
        }
    else:
        raise ValueError(f"Unsupported provider: {provider}")
    
    response = requests.post(token_url, data=payload)
    response_data = response.json()
    
    if response.status_code != 200:
        raise ValueError(f"Failed to exchange code for tokens: {response_data}")
    
    return {
        "access_token": response_data["access_token"],
        "refresh_token": response_data.get("refresh_token"),
        "expires_in": response_data["expires_in"]
    }

async def handle_oauth_callback(
    db: Session,
    provider: str,
    code: str,
    user_id: int
) -> CalendarConnection:
    # Exchange code for tokens
    tokens = await exchange_code_for_tokens(db, provider, code)
    
    # Create or update calendar connection
    connection = CalendarConnection(
        user_id=user_id,
        provider=provider,
        access_token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
        expires_at=datetime.utcnow() + tokens["expires_in"]
    )
    
    db.add(connection)
    db.commit()
    db.refresh(connection)
    
    return connection