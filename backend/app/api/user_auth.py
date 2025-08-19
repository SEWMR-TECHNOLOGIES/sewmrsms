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
    If JWT missing or invalid, fall back to API-token verification.
    Updates `last_used` on API token access using Africa/Nairobi timezone.
    """
    token = None

    if session_token:
        token = session_token
    elif authorization:
        if not authorization.startswith("Bearer "):
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
        pass  # JWT invalid or expired, continue to API token

    # 2) try API token
    try:
        import hashlib
        import pytz
        from datetime import datetime
        from models.api_access_tokens import ApiAccessToken

        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        api_token = db.query(ApiAccessToken).filter(
            ApiAccessToken.token_hash == token_hash,
            ApiAccessToken.revoked == False
        ).first()

        if api_token and (not api_token.expires_at or api_token.expires_at > datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)):
            # update last_used in Nairobi timezone
            tz = pytz.timezone("Africa/Nairobi")
            api_token.last_used = datetime.now(tz).replace(tzinfo=None)
            db.commit()
            db.refresh(api_token)

            user = db.query(User).filter(User.id == api_token.user_id).first()
            return user
    except Exception:
        return None

    return None
