"""Shared auth helpers for resolving user from JWT or API token."""
import uuid as _uuid
from typing import Optional, Tuple

from fastapi import Header, HTTPException
from sqlalchemy.orm import Session

from models.sender_id import SenderId
from models.user import User
from utils.security import verify_api_token


def resolve_user(
    current_user: Optional[User],
    authorization: Optional[str],
    db: Session,
) -> User:
    """Return the authenticated user from JWT or fall back to API token."""
    if current_user is not None:
        return current_user
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization. Provide JWT or API token.")
    raw_token = authorization.split(" ", 1)[1].strip()
    user = verify_api_token(db, raw_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired API token")
    return user


def resolve_sender(
    sender_id_input: str,
    user_id: int,
    db: Session,
) -> SenderId:
    """Resolve sender by UUID or alias, ensuring ownership."""
    try:
        sender_uuid = _uuid.UUID(str(sender_id_input))
        sender = db.query(SenderId).filter(
            SenderId.uuid == sender_uuid,
            SenderId.user_id == user_id,
        ).first()
    except ValueError:
        alias = str(sender_id_input).strip()
        if not alias:
            raise HTTPException(status_code=400, detail="sender_id alias cannot be empty")
        sender = db.query(SenderId).filter(
            SenderId.alias == alias,
            SenderId.user_id == user_id,
        ).first()

    if not sender:
        raise HTTPException(status_code=404, detail="Sender ID not found or not owned by user")
    return sender
