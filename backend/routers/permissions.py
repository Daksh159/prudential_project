from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(tags=["permissions"])


@router.get("/permissions", response_model=list[schemas.PermissionOut])
def list_permissions(db: Session = Depends(get_db)):
    return db.query(models.Permission).all()


@router.post("/permissions", response_model=schemas.PermissionOut)
def create_permission(
    data: schemas.PermissionCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    existing = (
        db.query(models.Permission)
        .filter(models.Permission.action == data.action, models.Permission.resource == data.resource)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Permission already exists")
    perm = models.Permission(**data.model_dump())
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


@router.post("/roles/{role_id}/permissions/{permission_id}")
def assign_permission(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    perm = db.query(models.Permission).filter(models.Permission.id == permission_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")
    existing = (
        db.query(models.RolePermission)
        .filter(
            models.RolePermission.role_id == role_id,
            models.RolePermission.permission_id == permission_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Permission already assigned to role")
    rp = models.RolePermission(role_id=role_id, permission_id=permission_id)
    db.add(rp)
    db.commit()
    return {"message": "Permission assigned"}


@router.delete("/roles/{role_id}/permissions/{permission_id}")
def remove_permission(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    rp = (
        db.query(models.RolePermission)
        .filter(
            models.RolePermission.role_id == role_id,
            models.RolePermission.permission_id == permission_id,
        )
        .first()
    )
    if not rp:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(rp)
    db.commit()
    return {"message": "Permission removed from role"}
