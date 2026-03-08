# backend/app/api/admin_auth.py
from fastapi import Cookie, Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional
from api.deps import get_db
from models.admin_user import AdminUser
from utils.security import verify_access_token


async def get_current_admin(
    admin_session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> AdminUser:
    """Extract and validate admin from JWT token (cookie or Bearer header)."""
    token = None

    if admin_session_token:
        token = admin_session_token
    elif authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required"
        )

    try:
        payload = verify_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin session"
        )

    admin_uuid = payload.get("sub")
    is_admin = payload.get("is_admin", False)

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not an admin token"
        )

    admin = db.query(AdminUser).filter(AdminUser.uuid == admin_uuid).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found"
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is deactivated"
        )

    return admin
