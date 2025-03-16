import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import google.oauth2.credentials
import googleapiclient.discovery
from caldav import DAVClient
from exchangelib import Account, Credentials, DELEGATE
from google_auth_oauthlib.flow import Flow
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Calendar

logger = logging.getLogger(__name__)


def get_calendar_auth_url(provider: str) -> Optional[str]:
    """
    Get authentication URL for a calendar provider
    """
    if provider == "google":
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=["https://www.googleapis.com/auth/calendar"],
            redirect_uri=f"{settings.SERVER_HOST}/api/calendars/auth/google/callback",
        )
        auth_url, _ = flow.authorization_url(
            access_type="offline", include_granted_scopes="true", prompt="consent"
        )
        return auth_url
    elif provider == "outlook":
        # Implement Outlook OAuth flow
        return None
    elif provider == "apple":
        # Implement Apple Calendar OAuth flow
        return None
    elif provider == "mailcow":
        # Implement Mailcow CalDAV authentication
        return None
    else:
        return None


def validate_calendar_auth(
    provider: str, auth_code: str, redirect_uri: str
) -> Optional[Dict[str, Any]]:
    """
    Validate authentication code and get calendar information
    """
    try:
        if provider == "google":
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=["https://www.googleapis.com/auth/calendar"],
                redirect_uri=redirect_uri,
            )
            flow.fetch_token(code=auth_code)
            credentials = flow.credentials
            
            # Get calendar information
            service = googleapiclient.discovery.build(
                "calendar", "v3", credentials=credentials
            )
            calendar_list = service.calendarList().list().execute()
            primary_calendar = next(
                (
                    cal
                    for cal in calendar_list.get("items", [])
                    if cal.get("primary", False)
                ),
                None,
            )
            
            if not primary_calendar:
                return None
            
            return {
                "name": primary_calendar.get("summary", "Google Calendar"),
                "provider_id": primary_calendar.get("id"),
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_expires_at": datetime.utcnow()
                + timedelta(seconds=credentials.expires_in),
            }
        elif provider == "outlook":
            # Implement Outlook OAuth validation
            return None
        elif provider == "apple":
            # Implement Apple Calendar OAuth validation
            return None
        elif provider == "mailcow":
            # Implement Mailcow CalDAV authentication
            return None
        else:
            return None
    except Exception as e:
        logger.error(f"Error validating calendar auth: {e}")
        return None


def sync_calendar(calendar: Calendar) -> bool:
    """
    Sync calendar events
    """
    try:
        if calendar.provider == "google":
            # Sync Google Calendar
            credentials = google.oauth2.credentials.Credentials(
                token=calendar.access_token,
                refresh_token=calendar.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
            )
            
            service = googleapiclient.discovery.build(
                "calendar", "v3", credentials=credentials
            )
            
            # Get events
            events_result = (
                service.events()
                .list(
                    calendarId=calendar.provider_id,
                    timeMin=datetime.utcnow().isoformat() + "Z",
                    maxResults=100,
                    singleEvents=True,
                    orderBy="startTime",
                )
                .execute()
            )
            
            # Update last synced time
            calendar.last_synced_at = datetime.utcnow()
            
            return True
        elif calendar.provider == "outlook":
            # Implement Outlook Calendar sync
            return False
        elif calendar.provider == "apple":
            # Implement Apple Calendar sync
            return False
        elif calendar.provider == "mailcow":
            # Implement Mailcow CalDAV sync
            return False
        else:
            return False
    except Exception as e:
        logger.error(f"Error syncing calendar: {e}")
        return False


def create_calendar_event(
    calendar: Calendar, event_data: Dict[str, Any]
) -> Optional[str]:
    """
    Create an event in the calendar
    """
    try:
        if calendar.provider == "google":
            credentials = google.oauth2.credentials.Credentials(
                token=calendar.access_token,
                refresh_token=calendar.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
            )
            
            service = googleapiclient.discovery.build(
                "calendar", "v3", credentials=credentials
            )
            
            event = {
                "summary": event_data["title"],
                "description": event_data.get("description", ""),
                "start": {
                    "dateTime": event_data["start_time"].isoformat(),
                    "timeZone": "UTC",
                },
                "end": {
                    "dateTime": event_data["end_time"].isoformat(),
                    "timeZone": "UTC",
                },
            }
            
            if event_data.get("location"):
                event["location"] = event_data["location"]
            
            created_event = (
                service.events().insert(calendarId=calendar.provider_id, body=event).execute()
            )
            
            return created_event.get("id")
        elif calendar.provider == "outlook":
            # Implement Outlook Calendar event creation
            return None
        elif calendar.provider == "apple":
            # Implement Apple Calendar event creation
            return None
        elif calendar.provider == "mailcow":
            # Implement Mailcow CalDAV event creation
            return None
        else:
            return None
    except Exception as e:
        logger.error(f"Error creating calendar event: {e}")
        return None


def update_calendar_event(
    calendar: Calendar, event_id: str, event_data: Dict[str, Any]
) -> bool:
    """
    Update an event in the calendar
    """
    try:
        if calendar.provider == "google":
            credentials = google.oauth2.credentials.Credentials(
                token=calendar.access_token,
                refresh_token=calendar.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
            )
            
            service = googleapiclient.discovery.build(
                "calendar", "v3", credentials=credentials
            )
            
            # Get existing event
            event = (
                service.events()
                .get(calendarId=calendar.provider_id, eventId=event_id)
                .execute()
            )
            
            # Update event fields
            if "title" in event_data:
                event["summary"] = event_data["title"]
            if "description" in event_data:
                event["description"] = event_data["description"]
            if "start_time" in event_data:
                event["start"] = {
                    "dateTime": event_data["start_time"].isoformat(),
                    "timeZone": "UTC",
                }
            if "end_time" in event_data:
                event["end"] = {
                    "dateTime": event_data["end_time"].isoformat(),
                    "timeZone": "UTC",
                }
            if "location" in event_data:
                event["location"] = event_data["location"]
            
            updated_event = (
                service.events()
                .update(calendarId=calendar.provider_id, eventId=event_id, body=event)
                .execute()
            )
            
            return True
        elif calendar.provider == "outlook":
            # Implement Outlook Calendar event update
            return False
        elif calendar.provider == "apple":
            # Implement Apple Calendar event update
            return False
        elif calendar.provider == "mailcow":
            # Implement Mailcow CalDAV event update
            return False
        else:
            return False
    except Exception as e:
        logger.error(f"Error updating calendar event: {e}")
        return False


def delete_calendar_event(calendar: Calendar, event_id: str) -> bool:
    """
    Delete an event from the calendar
    """
    try:
        if calendar.provider == "google":
            credentials = google.oauth2.credentials.Credentials(
                token=calendar.access_token,
                refresh_token=calendar.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
            )
            
            service = googleapiclient.discovery.build(
                "calendar", "v3", credentials=credentials
            )
            
            service.events().delete(
                calendarId=calendar.provider_id, eventId=event_id
            ).execute()
            
            return True
        elif calendar.provider == "outlook":
            # Implement Outlook Calendar event deletion
            return False
        elif calendar.provider == "apple":
            # Implement Apple Calendar event deletion
            return False
        elif calendar.provider == "mailcow":
            # Implement Mailcow CalDAV event deletion
            return False
        else:
            return False
    except Exception as e:
        logger.error(f"Error deleting calendar event: {e}")
        return False


def get_calendar_events(
    calendar: Calendar, start_time: datetime, end_time: datetime
) -> List[Dict[str, Any]]:
    """
    Get events from the calendar
    """
    try:
        if calendar.provider == "google":
            credentials = google.oauth2.credentials.Credentials(
                token=calendar.access_token,
                refresh_token=calendar.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
            )
            
            service = googleapiclient.discovery.build(
                "calendar", "v3", credentials=credentials
            )
            
            events_result = (
                service.events()
                .list(
                    calendarId=calendar.provider_id,
                    timeMin=start_time.isoformat() + "Z",
                    timeMax=end_time.isoformat() + "Z",
                    singleEvents=True,
                    orderBy="startTime",
                )
                .execute()
            )
            
            events = []
            for item in events_result.get("items", []):
                start = item["start"].get("dateTime", item["start"].get("date"))
                end = item["end"].get("dateTime", item["end"].get("date"))
                
                events.append(
                    {
                        "id": item["id"],
                        "title": item["summary"],
                        "description": item.get("description", ""),
                        "start_time": start,
                        "end_time": end,
                        "location": item.get("location", ""),
                    }
                )
            
            return events
        elif calendar.provider == "outlook":
            # Implement Outlook Calendar events retrieval
            return []
        elif calendar.provider == "apple":
            # Implement Apple Calendar events retrieval
            return []
        elif calendar.provider == "mailcow":
            # Implement Mailcow CalDAV events retrieval
            return []
        else:
            return []
    except Exception as e:
        logger.error(f"Error getting calendar events: {e}")
        return [] 