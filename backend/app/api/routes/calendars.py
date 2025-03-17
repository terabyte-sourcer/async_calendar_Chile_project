from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.auth import get_current_user
from ...services.calendar_service import get_oauth_url, handle_oauth_callback
from ...db.session import get_db

router = APIRouter()

@router.get("/connect/{provider}")
async def connect_calendar(
    provider: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        auth_url = await get_oauth_url(db, provider)
        return {"auth_url": auth_url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/callback/{provider}")
async def calendar_callback(
    provider: str,
    code: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        connection = await handle_oauth_callback(db, provider, code, current_user.id)
        return {"message": "Calendar connected successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))