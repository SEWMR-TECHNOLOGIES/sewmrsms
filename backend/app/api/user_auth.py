from typing import Optional
from fastapi import Cookie, Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from api.deps import get_db
from models.user import User
from utils.security import verify_access_token

async def get_current_user(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    token = None

    if session_token:
        token = session_token
    elif authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header"
            )
        token = authorization[len("Bearer "):]
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is missing"
        )

    try:
        payload = verify_access_token(token)
        user_uuid = payload.get("sub")
        if user_uuid is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing user identifier"
            )
        user = db.query(User).filter(User.uuid == user_uuid).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

async def get_current_user_optional(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Try to authenticate user via JWT bearer token.
    If header missing or JWT invalid, return None instead of raising,
    so endpoint can fall back to API-token verification.
    """
    token = None

    if session_token:
        token = session_token
    elif authorization:
        if not authorization.startswith("Bearer "):
            # not a bearer token — return None so caller can attempt other auth
            return None
        token = authorization[len("Bearer "):].strip()
    else:
        return None

    # 1) try JWT first — if valid return User
    try:
        payload = verify_access_token(token)
        user_uuid = payload.get("sub")
        if user_uuid:
            user = db.query(User).filter(User.uuid == user_uuid).first()
            return user
    except Exception:
        # JWT invalid or expired — swallow and let endpoint try API token
        # Optional: log for debugging
        # traceback.print_exc()
        return None

    return None