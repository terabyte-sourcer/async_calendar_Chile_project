from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_verified_user
from app.db.models import Team, User
from app.db.session import get_db
from app.schemas.team import (
    Team as TeamSchema,
    TeamCreate,
    TeamMemberUpdate,
    TeamUpdate,
    TeamWithMembers,
)

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("", response_model=List[TeamSchema])
def read_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all teams for the current user.
    """
    teams = (
        db.query(Team)
        .filter(
            (Team.owner_id == current_user.id) | (Team.members.any(id=current_user.id))
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return teams


@router.post("", response_model=TeamSchema)
def create_team(
    *,
    db: Session = Depends(get_db),
    team_in: TeamCreate,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Create new team.
    """
    team = Team(
        name=team_in.name,
        owner_id=current_user.id,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Add members if provided
    if team_in.member_ids:
        members = (
            db.query(User)
            .filter(User.id.in_(team_in.member_ids), User.is_active == True)
            .all()
        )
        team.members = members
        db.commit()
        db.refresh(team)
    
    # Add owner as a member
    if current_user not in team.members:
        team.members.append(current_user)
        db.commit()
        db.refresh(team)
    
    return team


@router.get("/{team_id}", response_model=TeamWithMembers)
def read_team(
    *,
    db: Session = Depends(get_db),
    team_id: int,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Get team by ID.
    """
    team = (
        db.query(Team)
        .filter(
            Team.id == team_id,
            (Team.owner_id == current_user.id) | (Team.members.any(id=current_user.id)),
        )
        .first()
    )
    if not team:
        raise HTTPException(
            status_code=404,
            detail="The team with this id does not exist or you are not a member",
        )
    return team


@router.put("/{team_id}", response_model=TeamSchema)
def update_team(
    *,
    db: Session = Depends(get_db),
    team_id: int,
    team_in: TeamUpdate,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Update team.
    """
    team = (
        db.query(Team)
        .filter(Team.id == team_id, Team.owner_id == current_user.id)
        .first()
    )
    if not team:
        raise HTTPException(
            status_code=404,
            detail="The team with this id does not exist or you are not the owner",
        )
    
    if team_in.name is not None:
        team.name = team_in.name
    
    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", response_model=TeamSchema)
def delete_team(
    *,
    db: Session = Depends(get_db),
    team_id: int,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Delete team.
    """
    team = (
        db.query(Team)
        .filter(Team.id == team_id, Team.owner_id == current_user.id)
        .first()
    )
    if not team:
        raise HTTPException(
            status_code=404,
            detail="The team with this id does not exist or you are not the owner",
        )
    
    db.delete(team)
    db.commit()
    return team


@router.put("/{team_id}/members", response_model=TeamWithMembers)
def update_team_members(
    *,
    db: Session = Depends(get_db),
    team_id: int,
    members_in: TeamMemberUpdate,
    current_user: User = Depends(get_current_verified_user),
) -> Any:
    """
    Update team members.
    """
    team = (
        db.query(Team)
        .filter(Team.id == team_id, Team.owner_id == current_user.id)
        .first()
    )
    if not team:
        raise HTTPException(
            status_code=404,
            detail="The team with this id does not exist or you are not the owner",
        )
    
    members = (
        db.query(User)
        .filter(User.id.in_(members_in.member_ids), User.is_active == True)
        .all()
    )
    
    # Make sure owner is always a member
    if current_user not in members:
        members.append(current_user)
    
    team.members = members
    db.commit()
    db.refresh(team)
    return team 