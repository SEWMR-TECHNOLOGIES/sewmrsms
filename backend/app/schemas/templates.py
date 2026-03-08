"""Pydantic schemas for SMS template routes."""
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class CreateTemplateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    sample_message: str = Field(..., min_length=1, max_length=2000)
    column_count: int = Field(..., ge=1)

    @field_validator("name", "sample_message")
    @classmethod
    def strip_field(cls, v: str) -> str:
        return v.strip()


class EditTemplateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    sample_message: str = Field(..., min_length=1, max_length=2000)
    column_count: int = Field(..., ge=1)

    @field_validator("name", "sample_message")
    @classmethod
    def strip_field(cls, v: str) -> str:
        return v.strip()


class AddColumnRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    position: int = Field(..., ge=1)
    is_phone_column: bool = False

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class AdminLoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()
