from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return db.query(models.User).all()


@router.get("/{user_id}/roles", response_model=list[schemas.RoleOut])
def get_user_roles(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return [ur.role for ur in user.roles]


@router.post("/{user_id}/roles/{role_id}")
def assign_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    existing = (
        db.query(models.UserRole)
        .filter(models.UserRole.user_id == user_id, models.UserRole.role_id == role_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Role already assigned")
    ur = models.UserRole(user_id=user_id, role_id=role_id)
    db.add(ur)
    db.commit()
    return {"message": "Role assigned"}


@router.delete("/{user_id}/roles/{role_id}")
def remove_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    ur = (
        db.query(models.UserRole)
        .filter(models.UserRole.user_id == user_id, models.UserRole.role_id == role_id)
        .first()
    )
    if not ur:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(ur)
    db.commit()
    return {"message": "Role removed from user"}
