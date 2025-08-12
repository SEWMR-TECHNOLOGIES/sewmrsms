# backend/app/api/auth.py


from datetime import datetime, timedelta
import hashlib
import secrets
from typing import Optional
from urllib.parse import urlencode
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
import pytz
from sqlalchemy import or_
from sqlalchemy.orm import Session
from api.deps import get_db
from models.password_reset_tokens import PasswordResetToken
from models.user import User
from utils import send_password_reset_email
from utils.security import Hasher
from utils.validation import validate_password_strength
from utils.send_password_reset_email import send_password_reset_email
router = APIRouter()

@router.post("/password-reset-request")
async def password_reset_request(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type.lower():
        return {
            "success": False,
            "message": "Invalid content type. Expected application/json",
            "data": None
        }

    try:
        data = await request.json()
    except Exception:
        return {"success": False, "message": "Invalid JSON", "data": None}

    identifier = data.get("identifier", "").strip()
    if not identifier:
        return {"success": False, "message": "Identifier (email, username, or phone) is required", "data": None}

    # Lookup user by email, username, or phone
    user = db.query(User).filter(
        or_(
            User.email == identifier,
            User.username == identifier,
            User.phone == identifier
        )
    ).first()

    if not user or not user.email:
        # Security: do not reveal if user exists or email present
        return {
            "success": True,
            "message": "If the identifier exists, a reset link has been sent to the associated email",
            "data": None
        }

    # Generate secure token and hash it
    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
    expires_at = now + timedelta(minutes=15)

    # Save token in DB
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        created_at=now,
        expires_at=expires_at,
        used=False
    )
    db.add(reset_token)
    db.commit()

    # Build backend reset acceptance link
    params = urlencode({"token": raw_token})
    backend_host = f"{request.url.scheme}://{request.url.hostname}"
    if request.url.port:
        backend_host += f":{request.url.port}"
    reset_link = f"{backend_host}/auth/accept-reset?{params}"

    # Send password reset email
    send_password_reset_email(user.email, reset_link, user.full_name)

    return {
        "success": True,
        "message": "If the identifier exists, a reset link has been sent to the associated email",
        "data": None
    }


@router.get("/accept-reset")
async def accept_reset(token: str, response: Response, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    now = datetime.utcnow()

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now
    ).first()

    if not reset_token:
        return JSONResponse({"success": False, "message": "Invalid or expired reset token"}, status_code=400)

    response.set_cookie(
        key="reset_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=15 * 60,  # 15 minutes
        path="/auth"
    )

    frontend_password_reset_url = "https://app.sewmrsms.co.tz/reset-password"  
    return RedirectResponse(frontend_password_reset_url)

@router.post("/reset-password")
async def reset_password(request: Request, reset_token: Optional[str] = Cookie(None), db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type.lower():
        return {"success": False, "message": "Invalid content type. Expected application/json", "data": None}

    if not reset_token:
        raise HTTPException(status_code=400, detail="Reset token cookie missing")

    try:
        data = await request.json()
    except Exception:
        return {"success": False, "message": "Invalid JSON", "data": None}

    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not new_password or not confirm_password:
        return {"success": False, "message": "New password and confirmation are required", "data": None}

    if new_password != confirm_password:
        return {"success": False, "message": "Passwords do not match", "data": None}

    if not validate_password_strength(new_password):
        return {
            "success": False,
            "message": "Password must be at least 8 characters, include uppercase, lowercase, digit, and special character.",
            "data": None
        }

    token_hash = hashlib.sha256(reset_token.encode("utf-8")).hexdigest()
    now = datetime.utcnow()

    reset_token_obj = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now
    ).first()

    if not reset_token_obj:
        return {"success": False, "message": "Invalid or expired reset token", "data": None}

    user = db.query(User).filter(User.id == reset_token_obj.user_id).first()
    if not user:
        return {"success": False, "message": "User not found", "data": None}

    new_password_hash = Hasher.hash_password(new_password)
    user.password_hash = new_password_hash
    reset_token_obj.used = True

    db.commit()

    return {"success": True, "message": "Password reset successfully", "data": None}
