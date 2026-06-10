from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(tags=["access"])


@router.post("/check-access", response_model=schemas.AccessCheckResponse)
def check_access(
    body: schemas.AccessCheckRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == body.user_id).first()
    if not user or not user.is_active:
        _log(db, body.user_id, body.action, body.resource, False, "User not found or inactive", request)
        return schemas.AccessCheckResponse(allowed=False, reason="User not found or inactive")

    # Collect all roles for this user
    user_roles = [ur.role for ur in user.roles]
    role_names = [r.name for r in user_roles]

    # Collect all permissions across all roles
    all_permissions = set()
    for role in user_roles:
        for rp in role.permissions:
            all_permissions.add((rp.permission.action, rp.permission.resource))

    perm_strings = [f"{a}_{r}" for a, r in all_permissions]
    allowed = (body.action, body.resource) in all_permissions

    if allowed:
        reason = f"Access granted — role(s) [{', '.join(role_names)}] include '{body.action}_{body.resource}'"
    else:
        reason = f"Access denied — none of the user's roles ({', '.join(role_names) or 'none'}) have '{body.action}_{body.resource}'"

    _log(db, body.user_id, body.action, body.resource, allowed, reason, request)

    return schemas.AccessCheckResponse(
        allowed=allowed,
        reason=reason,
        roles=role_names,
        permissions_checked=perm_strings,
    )


def _log(db, user_id, action, resource, allowed, reason, request):
    ip = request.client.host if request.client else None
    log = models.AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        allowed=allowed,
        reason=reason,
        ip_address=ip,
    )
    db.add(log)
    db.commit()
