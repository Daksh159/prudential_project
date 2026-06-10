from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import ai_engine
from auth import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/generate-policy")
def generate_policy(
    body: schemas.GeneratePolicyRequest,
    _: models.User = Depends(get_current_user),
):
    rules = ai_engine.generate_policy(body.text)
    return {"rules": rules}


@router.post("/recommend-permissions")
def recommend_permissions(
    body: schemas.RecommendPermissionsRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    existing_roles = [r.name for r in db.query(models.Role).all()]
    result = ai_engine.recommend_permissions(body.role_name, existing_roles)
    return result


@router.post("/detect-risks")
def detect_risks(
    body: schemas.DetectRisksRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    role = db.query(models.Role).filter(models.Role.id == body.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    perms = [
        {"action": rp.permission.action, "resource": rp.permission.resource}
        for rp in role.permissions
    ]
    risks = ai_engine.detect_risks(role.name, perms)
    return {"role": role.name, "risks": risks}


@router.post("/explain-access")
def explain_access(
    body: schemas.ExplainAccessRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_roles = [ur.role for ur in user.roles]
    role_names = [r.name for r in user_roles]
    all_permissions = set()
    for role in user_roles:
        for rp in role.permissions:
            all_permissions.add(f"{rp.permission.action}_{rp.permission.resource}")

    allowed = (body.action, body.resource) in {
        (rp.permission.action, rp.permission.resource)
        for role in user_roles
        for rp in role.permissions
    }

    explanation = ai_engine.explain_access(
        body.user_id, body.action, body.resource, allowed, role_names, list(all_permissions)
    )
    return {"allowed": allowed, "explanation": explanation}
