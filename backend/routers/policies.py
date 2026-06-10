from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/policies", tags=["policies"])


@router.get("", response_model=list[schemas.PolicyOut])
def list_policies(db: Session = Depends(get_db)):
    return db.query(models.Policy).filter(models.Policy.is_active == True).all()


@router.post("", response_model=schemas.PolicyOut)
def create_policy(
    data: schemas.PolicyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    policy = models.Policy(
        name=data.name,
        natural_language_text=data.natural_language_text,
        structured_rules=data.structured_rules,
        created_by=current_user.id,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.delete("/{policy_id}")
def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    policy = db.query(models.Policy).filter(models.Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    policy.is_active = False
    db.commit()
    return {"message": "Policy deactivated"}
