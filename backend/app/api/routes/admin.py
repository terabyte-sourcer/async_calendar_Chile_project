from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_superadmin
from app.core.security import get_password_hash
from app.db.models import Calendar, Meeting, Team, User, UserRole
from app.db.session import get_db
from app.schemas.user import User as UserSchema
from app.schemas.user import UserCreate, UserUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[UserSchema])
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


@router.post("/users", response_model=UserSchema)
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
        is_verified=True,  # Superadmin created users are automatically verified
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users/{user_id}", response_model=UserSchema)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
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


@router.put("/users/{user_id}", response_model=UserSchema)
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


@router.delete("/users/{user_id}", response_model=UserSchema)
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
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own user account",
        )
    
    db.delete(user)
    db.commit()
    return user


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
) -> Any:
    """
    Get system statistics. Only for superadmins.
    """
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    verified_users = db.query(User).filter(User.is_verified == True).count()
    total_calendars = db.query(Calendar).count()
    total_meetings = db.query(Meeting).count()
    total_teams = db.query(Team).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "verified_users": verified_users,
        "total_calendars": total_calendars,
        "total_meetings": total_meetings,
        "total_teams": total_teams,
    }


@router.put("/users/{user_id}/make-admin", response_model=UserSchema)
def make_user_admin(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_superadmin),
) -> Any:
    """
    Make a user a superadmin. Only for superadmins.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    
    user.role = UserRole.SUPER_ADMIN
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/remove-admin", response_model=UserSchema)
def remove_user_admin(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_superadmin),
) -> Any:
    """
    Remove superadmin role from a user. Only for superadmins.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    
    # Prevent removing your own admin rights
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own admin rights",
        )
    
    user.role = UserRole.USER
    db.commit()
    db.refresh(user)
    return user 