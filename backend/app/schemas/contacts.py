"""Pydantic schemas for contacts routes."""
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class CreateGroupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else None


class EditGroupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class AddContactsRequest(BaseModel):
    contact_group_uuid: str = Field(..., min_length=1)
    contacts_text: str = Field(..., min_length=1)

    @field_validator("contact_group_uuid", "contacts_text")
    @classmethod
    def strip_field(cls, v: str) -> str:
        return v.strip()


class EditContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=12, max_length=12)
    email: Optional[str] = None
    group_uuid: Optional[str] = None

    @field_validator("name", "phone")
    @classmethod
    def strip_required(cls, v: str) -> str:
        return v.strip()

    @field_validator("email")
    @classmethod
    def strip_email(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else None

    @field_validator("group_uuid")
    @classmethod
    def strip_group(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else None
