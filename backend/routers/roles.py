from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[schemas.RoleOut])
def list_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()


@router.post("", response_model=schemas.RoleOut)
def create_role(
    data: schemas.RoleCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    if db.query(models.Role).filter(models.Role.name == data.name).first():
        raise HTTPException(status_code=400, detail="Role name already exists")
    role = models.Role(**data.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.put("/{role_id}", response_model=schemas.RoleOut)
def update_role(
    role_id: int,
    data: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(role, field, value)
    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(role)
    db.commit()
    return {"message": "Role deleted"}


@router.get("/{role_id}/permissions", response_model=list[schemas.PermissionOut])
def get_role_permissions(role_id: int, db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return [rp.permission for rp in role.permissions]
