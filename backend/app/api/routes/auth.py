from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.models import User
from app.db.session import get_db
from app.schemas.user import Token, User as UserSchema
from app.services.email import send_verification_email

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)) -> Any:
    """
    Verify email address
    """
    # In a real implementation, you would decode the token and verify the user
    # For simplicity, we'll just assume the token is the user ID
    user = db.query(User).filter(User.id == token).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = True
    db.commit()
    return {"message": "Email verified successfully"}


@router.post("/request-verification")
def request_verification_email(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Request a new verification email
    """
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Send verification email
    send_verification_email(current_user.email, str(current_user.id))
    return {"message": "Verification email sent"}


@router.post("/reset-password", response_model=UserSchema)
def reset_password(
    new_password: str = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Reset password
    """
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    return current_user 