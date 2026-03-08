"""Pydantic schemas for authentication routes."""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from utils.validation import validate_phone, validate_password_strength, validate_name


class SignupRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=12, max_length=12)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)

    @field_validator("username")
    @classmethod
    def strip_username(cls, v: str) -> str:
        return v.strip()

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        from utils.validation import validate_email
        v = v.strip()
        if not validate_email(v):
            raise ValueError("Valid email required")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone_format(cls, v: str) -> str:
        v = v.strip()
        if not validate_phone(v):
            raise ValueError("Phone must be in format 255XXXXXXXXX (start with 255 then 6 or 7, then 8 digits)")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name_field(cls, v: str) -> str:
        v = v.strip()
        if not validate_name(v):
            raise ValueError("Name is invalid")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not validate_password_strength(v):
            raise ValueError(
                "Password must be at least 8 characters, include uppercase, lowercase, digit, and special character."
            )
        return v


class SigninRequest(BaseModel):
    identifier: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("identifier")
    @classmethod
    def strip_identifier(cls, v: str) -> str:
        return v.strip()


class PasswordResetRequestSchema(BaseModel):
    identifier: str = Field(..., min_length=1, max_length=255)

    @field_validator("identifier")
    @classmethod
    def strip_identifier(cls, v: str) -> str:
        return v.strip()


class ResetPasswordSchema(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not validate_password_strength(v):
            raise ValueError(
                "Password must be at least 8 characters, include uppercase, lowercase, digit, and special character."
            )
        return v


class GenerateApiTokenRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class OutageNotificationRequest(BaseModel):
    phone: Optional[str] = ""
    email: Optional[str] = ""
    notify_before_messages: int = Field(default=1, ge=1)

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, v: str) -> str:
        v = v.strip() if v else ""
        return v

    @field_validator("email")
    @classmethod
    def validate_email_field(cls, v: str) -> str:
        v = v.strip() if v else ""
        return v
