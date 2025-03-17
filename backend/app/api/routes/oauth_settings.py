from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...db.oauth_settings import OAuthSettings
from ...schemas.oauth import OAuthSettingsCreate, OAuthSettings
from ...core.auth import get_current_admin_user
from ...db.session import get_db

router = APIRouter()

@router.post("/oauth/settings", response_model=OAuthSettings)
async def create_oauth_settings(
    settings: OAuthSettingsCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    db_settings = OAuthSettings(**settings.dict())
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings

@router.get("/oauth/settings", response_model=List[OAuthSettings])
async def get_oauth_settings(
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return db.query(OAuthSettings).all()

@router.put("/oauth/settings/{provider}", response_model=OAuthSettings)
async def update_oauth_settings(
    provider: str,
    settings: OAuthSettingsCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    db_settings = db.query(OAuthSettings).filter(OAuthSettings.provider == provider).first()
    if not db_settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    for key, value in settings.dict().items():
        setattr(db_settings, key, value)
    db.commit()
    db.refresh(db_settings)
    return db_settings

@router.delete("/oauth/settings/{provider}", response_model=OAuthSettings)
async def delete_oauth_settings(
    provider: str,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    db_settings = db.query(OAuthSettings).filter(OAuthSettings.provider == provider).first()
    if not db_settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    db.delete(db_settings)
    db.commit()
    return db_settings