"""Standardized API response helpers."""
from typing import Any, Dict, List, Optional


def ok(message: str = "Success", data: Any = None, **extra) -> Dict:
    resp = {"success": True, "message": message, "data": data}
    resp.update(extra)
    return resp


def fail(message: str = "Error", data: Any = None, **extra) -> Dict:
    resp = {"success": False, "message": message, "data": data}
    resp.update(extra)
    return resp


def paginated(data: List, page: int, limit: int, total: int) -> Dict:
    return {
        "success": True,
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": max(1, (total + limit - 1) // limit),
        },
    }
