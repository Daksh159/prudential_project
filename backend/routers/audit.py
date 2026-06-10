from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=list[schemas.AuditLogOut])
def get_audit_logs(
    user_id: Optional[int] = Query(None),
    resource: Optional[str] = Query(None),
    allowed: Optional[bool] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(models.AuditLog)
    if user_id is not None:
        q = q.filter(models.AuditLog.user_id == user_id)
    if resource:
        q = q.filter(models.AuditLog.resource == resource)
    if allowed is not None:
        q = q.filter(models.AuditLog.allowed == allowed)
    if from_date:
        q = q.filter(models.AuditLog.timestamp >= from_date)
    if to_date:
        q = q.filter(models.AuditLog.timestamp <= to_date)
    return q.order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
