from typing import Any, List

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_superadmin, get_current_verified_user
from app.core.security import get_password_hash
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.user import User as UserSchema
from app.schemas.user import UserCreate, UserUpdate
from app.services.email import send_verification_email

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Update own user.
    """
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
    if user_in.email is not None:
        current_user.email = user_in.email
    if user_in.name is not None:
        current_user.name = user_in.name
    if user_in.route_time_preference is not None:
        current_user.route_time_preference = user_in.route_time_preference
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("", response_model=List[UserSchema])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_superadmin),
) -> Any:
    """
    Retrieve users. Only for superadmins.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.post("", response_model=UserSchema)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_superadmin),
) -> Any:
    """
    Create new user. Only for superadmins.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=get_password_hash(user_in.password),
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send verification email
    send_verification_email(user.email, str(user.id))
    
    return user


@router.get("/{user_id}", response_model=UserSchema)
def read_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_superadmin),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific user by id. Only for superadmins.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    return user


@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_superadmin),
) -> Any:
    """
    Update a user. Only for superadmins.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    
    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.name is not None:
        user.name = user_in.name
    if user_in.route_time_preference is not None:
        user.route_time_preference = user_in.route_time_preference
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=UserSchema)
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_superadmin),
) -> Any:
    """
    Delete a user. Only for superadmins.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    
    db.delete(user)
    db.commit()
    return user 