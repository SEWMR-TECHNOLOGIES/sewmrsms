"""Common Pydantic models used across all routes."""
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    pages: int


class PaginatedResponse(BaseModel):
    success: bool = True
    data: List[Any]
    pagination: PaginationMeta
