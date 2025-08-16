# backend/app/api/auth.py


from datetime import datetime, timedelta
import hashlib
import json
import secrets
from typing import Optional
from urllib.parse import urlencode
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
import pytz
from uuid import uuid4
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from api.deps import get_db
from api.user_auth import get_current_user
from models.user_subscription import UserSubscription
from models.api_access_tokens import ApiAccessToken
from models.password_reset_tokens import PasswordResetToken
from models.user import User
from utils import send_password_reset_email
from sqlalchemy.exc import SQLAlchemyError
from utils.validation import (
    validate_email, validate_name, validate_phone,
    validate_password_confirmation, validate_password_strength, validate_sender_alias
)
from utils.security import Hasher, create_access_token, verify_access_token
from utils.validation import validate_password_strength
from utils.send_password_reset_email import send_password_reset_email
from core.config import COOKIE_DOMAIN, IS_PRODUCTION, MAX_COOKIE_AGE

router = APIRouter()

@router.post("/signup")
async def signup_user(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type.lower():
        return {
            "success": False,
            "message": "Invalid content type. Expected application/json",
            "data": None
        }

    try:
        data = await request.json()
    except json.JSONDecodeError:
        return {"success": False, "message": "Invalid JSON", "data": None}

    # extract and normalize username early (do not use data[...] directly)
    username = data.get("username", "").strip()
    if not username:
        return {"success": False, "message": "Username is required", "data": None}

    email = data.get("email", "").strip()
    if not email or not validate_email(email):
        return {"success": False, "message": "Valid email required", "data": None}

    phone = data.get("phone", "").strip()
    if not phone:
        return {
            "success": False,
            "message": "Phone number is required",
            "data": None
        }
    if phone and not validate_phone(phone):
        return {
            "success": False,
            "message": "Phone must be in format 255XXXXXXXXX (start with 255 then 6 or 7, then 8 digits)",
            "data": None
        }

    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    if not password or not validate_password_confirmation(password, confirm_password):
        return {"success": False, "message": "Passwords do not match", "data": None}

    if not validate_password_strength(password):
        return {
            "success": False,
            "message": "Password must be at least 8 characters, include uppercase, lowercase, digit, and special character.",
            "data": None
        }

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    if not first_name or not last_name:
        return {"success": False, "message": "First name and last name are required", "data": None}
    # Validate names using your new function
    if not validate_name(first_name):
        return {"success": False, "message": "First name is invalid", "data": None}

    if not validate_name(last_name):
        return {"success": False, "message": "Last name is invalid", "data": None}
    try:
        # check email or username duplicates
        if db.query(User).filter((User.email == email) | (User.username == username)).first():
            return {"success": False, "message": "Email or username already registered", "data": None}

        # check phone duplicate separately (if provided)
        if phone and db.query(User).filter(User.phone == phone).first():
            return {"success": False, "message": "Phone number already registered", "data": None}

        password_hash = Hasher.hash_password(password)
        now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

        new_user = User(
            uuid=uuid4(),
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            phone=phone if phone else None,
            password_hash=password_hash,
            created_at=now,
            updated_at=now
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "success": True,
            "message": f"Dear {first_name}, your account has been created successfully. Welcome to SEWMR SMS! To proceed, please log in.",
            "data": {
                "id": new_user.id,
                "uuid": str(new_user.uuid),
                "email": new_user.email,
                "username": new_user.username,
                "first_name": new_user.first_name,
                "last_name": new_user.last_name,
                "phone": new_user.phone,
                "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
            }
        }
    except SQLAlchemyError as e:
        print(f"DB error: {e}")
        return {"success": False, "message": "Database error", "data": None}
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {"success": False, "message": "Internal server error", "data": None}

@router.post("/signin")
async def signin_user(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type.lower():
        return {
            "success": False,
            "message": "Invalid content type. Expected application/json",
            "data": None
        }
    
    try:
        data = await request.json()
    except json.JSONDecodeError:
        return {"success": False, "message": "Invalid JSON", "data": None}

    identifier = data.get("identifier", "").strip()
    password = data.get("password", "")

    if not identifier:
        return {"success": False, "message": "Username, email, or phone is required", "data": None}
    if not password:
        return {"success": False, "message": "Password is required", "data": None}

    try:
        user = db.query(User).filter(
            or_(
                User.email == identifier,
                User.username == identifier,
                User.phone == identifier
            )
        ).first()

        if not user or not Hasher.verify_password(password, user.password_hash):
            return {"success": False, "message": "Invalid credentials", "data": None}

        access_token = create_access_token({"sub": str(user.uuid)})

        response = JSONResponse({
            "success": True,
            "message": "Signed in successfully",
            "data": {
                "id": user.id,
                "uuid": str(user.uuid),
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone
            }
        })

        response.set_cookie(
            key="session_token",
            value=access_token,
            domain=COOKIE_DOMAIN,  
            httponly=True,
            secure=IS_PRODUCTION,              
            samesite="lax",         
            max_age=MAX_COOKIE_AGE    
        )

        return response

    except SQLAlchemyError as e:
        print(f"DB error: {e}")
        return {"success": False, "message": "Database error", "data": None}
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {"success": False, "message": "Internal server error", "data": None}
    
@router.post("/request-password-reset")
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
    reset_link = f"{backend_host}/api/v1/auth/accept-reset?{params}"

    # Send password reset email
    send_password_reset_email(user.email, reset_link, user.first_name)

    return {
        "success": True,
        "message": "If the identifier exists, a reset link has been sent to the associated email",
        "data": None
    }

@router.get("/accept-reset")
async def accept_reset(token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    now = datetime.utcnow()

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now
    ).first()

    if not reset_token:
        return JSONResponse({"success": False, "message": "Invalid or expired reset token"}, status_code=400)

    frontend_password_reset_url = "https://app.sewmrsms.co.tz/reset-password"

    # create RedirectResponse and set cookie on it (not on the unrelated `response` param)
    redirect = RedirectResponse(frontend_password_reset_url)

    redirect.set_cookie(
        key="reset_token",
        value=token,
        domain=COOKIE_DOMAIN,
        path="/", 
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=15 * 60
    )

    return redirect

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

@router.get("/validate-token")
async def validate_token(session_token: str = Cookie(None), db: Session = Depends(get_db)):
    if not session_token:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"success": False, "message": "No session token", "data": None}
        )

    try:
        payload = verify_access_token(session_token)
        user_uuid = payload.get("sub")
        if not user_uuid:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"success": False, "message": "Invalid token payload", "data": None}
            )

        user = db.query(User).filter(User.uuid == user_uuid).first()
        if not user:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"success": False, "message": "User not found", "data": None}
            )

        return {
            "success": True,
            "message": "Token is valid",
            "data": {
                "user": {
                    "uuid": str(user.uuid),
                    "email": user.email,
                    "username": user.username,
                    "first_name": user.first_name,
                    "phone": user.phone
                }
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"success": False, "message": str(e), "data": None}
        )

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        "session_token",
        domain=COOKIE_DOMAIN,
        path="/"                  
    )
    return {
        "success": True,
        "message": "Logged out successfully",
        "data": None
    }

@router.post("/generate-api-token")
async def generate_api_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw_token = secrets.token_urlsafe(40)
    token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
    expires_at = now + timedelta(days=30)

    access_token = ApiAccessToken(
        user_id=current_user.id,
        token_hash=token_hash,
        created_at=now,
        expires_at=expires_at,
        revoked=False
    )
    db.add(access_token)
    db.commit()
    db.refresh(access_token)

    return {
        "success": True,
        "message": "API access token generated successfully",
        "data": {
            "access_token": raw_token,
            "expires_at": expires_at.isoformat()
        }
    }

@router.get("/me")
async def get_current_user_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the authenticated user's information based on session cookie or Bearer token.
    """
    # Sum remaining_sms across all subscriptions
    total_remaining_sms = db.query(
        func.coalesce(func.sum(UserSubscription.remaining_sms), 0)
    ).filter(UserSubscription.user_id == current_user.id).scalar()

    return {
        "success": True,
        "message": "User authenticated",
        "data": {
            "id": current_user.id,
            "uuid": str(current_user.uuid),
            "email": current_user.email,
            "username": current_user.username,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "phone": current_user.phone,
            "remaining_sms": total_remaining_sms
        }
    }