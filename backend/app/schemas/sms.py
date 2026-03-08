"""Pydantic schemas for SMS routes."""
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from utils.validation import validate_phone


class SendSmsRequest(BaseModel):
    sender_id: str = Field(..., min_length=1)
    phone_number: str = Field(..., min_length=12, max_length=12)
    message: str = Field(..., min_length=1)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not validate_phone(v):
            raise ValueError("Phone must be in format 255XXXXXXXXX")
        return v


class QuickSendRequest(BaseModel):
    sender_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    recipients: str = Field(..., min_length=1)
    schedule: bool = False
    scheduled_for: Optional[str] = None
    schedule_name: Optional[str] = None

    @field_validator("message", "recipients")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v


class GroupSendRequest(BaseModel):
    sender_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    group_uuid: str = Field(..., min_length=1)
    schedule: bool = False
    scheduled_for: Optional[str] = None
    schedule_name: Optional[str] = None

    @field_validator("message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be blank")
        return v


class MobilePaymentRequest(BaseModel):
    mobile_number: str = Field(..., min_length=12, max_length=12)

    @field_validator("mobile_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not validate_phone(v):
            raise ValueError("Phone must be in format 255XXXXXXXXX")
        return v
