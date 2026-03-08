"""Pydantic schemas for subscription routes."""
from pydantic import BaseModel, Field, field_validator


class PurchaseSmsRequest(BaseModel):
    number_of_messages: int = Field(..., gt=0)

    @field_validator("number_of_messages")
    @classmethod
    def must_be_int(cls, v: int) -> int:
        if not isinstance(v, int):
            raise ValueError("number_of_messages must be an integer")
        return v
