"""Pydantic schemas for admin routes — shown in /docs automatically."""
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from utils.validation import validate_email


class AdminLoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=255, description="Admin email address")
    password: str = Field(..., min_length=1, max_length=128, description="Admin password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class CreateAdminRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=255, description="New admin email")
    username: str = Field(..., min_length=1, max_length=100, description="New admin username")
    password: str = Field(..., min_length=6, max_length=128, description="New admin password")
    first_name: str = Field("", max_length=100, description="First name")
    last_name: str = Field("", max_length=100, description="Last name")
    role: str = Field("admin", description="Role: admin or moderator")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not validate_email(v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("username")
    @classmethod
    def strip_username(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("admin", "moderator"):
            raise ValueError("Role must be 'admin' or 'moderator'")
        return v


class ApproveRejectRequest(BaseModel):
    remarks: str = Field("", max_length=1000, description="Admin remarks")


class UpdatePropagationRequest(BaseModel):
    status: str = Field(..., description="New status: pending, propagated, or failed")
    details: str = Field("", max_length=500, description="Additional details")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("pending", "propagated", "failed"):
            raise ValueError("Status must be pending, propagated, or failed")
        return v


class UpdateSenderStatusRequest(BaseModel):
    status: str = Field(..., description="New status: active, inactive, or pending")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("active", "inactive", "pending"):
            raise ValueError("Status must be active, inactive, or pending")
        return v


class AdjustSubscriptionRequest(BaseModel):
    add_sms: int = Field(0, description="Number of SMS credits to add")
    status: Optional[str] = Field(None, description="New subscription status")


class UpdateOrderStatusRequest(BaseModel):
    status: str = Field(..., description="New status: pending, completed, failed, or cancelled")
    remarks: str = Field("", max_length=1000, description="Admin remarks")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("pending", "completed", "failed", "cancelled"):
            raise ValueError("Status must be pending, completed, failed, or cancelled")
        return v


class CreateNetworkRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Network name")
    color_code: str = Field("#000000", max_length=7, description="Hex color code")

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class UpdateNetworkRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100, description="Network name")
    color_code: Optional[str] = Field(None, max_length=7, description="Hex color code")


class UpdatePackageRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=200, description="Package name")
    price_per_sms: Optional[float] = Field(None, gt=0, description="Price per SMS")
    start_sms_count: Optional[int] = Field(None, ge=0, description="Starting SMS count for tier")
    best_for: Optional[str] = Field(None, max_length=500, description="Best for description")


class UpdateSettingRequest(BaseModel):
    value: str = Field(..., description="New setting value")
