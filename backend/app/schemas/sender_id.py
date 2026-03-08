"""Pydantic schemas for sender ID routes."""
from pydantic import BaseModel, Field, field_validator
from utils.validation import validate_sender_alias


class RequestSenderIdSchema(BaseModel):
    alias: str = Field(..., min_length=3, max_length=11)
    sample_message: str = Field(..., min_length=1, max_length=500)
    company_name: str = Field(..., min_length=1, max_length=200)

    @field_validator("alias")
    @classmethod
    def validate_alias(cls, v: str) -> str:
        v = v.strip().upper()
        if not validate_sender_alias(v):
            raise ValueError(
                "Alias must be 3 to 11 characters long and contain only uppercase letters, digits, and spaces"
            )
        return v

    @field_validator("sample_message", "company_name")
    @classmethod
    def strip_field(cls, v: str) -> str:
        return v.strip()
