from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, EmailStr


# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# Role schemas
class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# Permission schemas
class PermissionCreate(BaseModel):
    action: str
    resource: str
    description: Optional[str] = None


class PermissionOut(BaseModel):
    id: int
    action: str
    resource: str
    description: Optional[str]

    model_config = {"from_attributes": True}


# Access check schemas
class AccessCheckRequest(BaseModel):
    user_id: int
    action: str
    resource: str


class AccessCheckResponse(BaseModel):
    allowed: bool
    reason: str
    roles: list[str] = []
    permissions_checked: list[str] = []


# Policy schemas
class PolicyCreate(BaseModel):
    name: str
    natural_language_text: str
    structured_rules: Optional[Any] = None


class PolicyOut(BaseModel):
    id: int
    name: str
    natural_language_text: str
    structured_rules: Optional[Any]
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}


# Audit log schemas
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    resource: str
    allowed: bool
    reason: Optional[str]
    timestamp: datetime
    ip_address: Optional[str]

    model_config = {"from_attributes": True}


# AI schemas
class GeneratePolicyRequest(BaseModel):
    text: str


class RecommendPermissionsRequest(BaseModel):
    role_name: str


class DetectRisksRequest(BaseModel):
    role_id: int


class ExplainAccessRequest(BaseModel):
    user_id: int
    action: str
    resource: str
