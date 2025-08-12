# backend/app/api/user.py
import hashlib
import os
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import or_
from api.user_auth import get_current_user
from models.network import Network
from models.sender_id_propagation import SenderIdPropagation
from models.api_access_tokens import ApiAccessToken
from models.sender_id import SenderId
from models.models import SenderIdRequest
from models.enums import SenderIdRequestStatusEnum
from models.user import User
from api.deps import get_db
from utils.validation import (
    validate_email, validate_phone,
    validate_password_confirmation, validate_password_strength, validate_sender_alias
)
from utils.security import Hasher, create_access_token
from uuid import uuid4
from datetime import datetime, timedelta
import pytz
import json
import uuid
import httpx

from core.config import UPLOAD_SERVICE_URL, MAX_FILE_SIZE

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
    
    if not data.get("username"):
        return {"success": False, "message": "Username is required", "data": None}

    email = data.get("email", "").strip()
    if not email or not validate_email(email):
        return {"success": False, "message": "Valid email required", "data": None}

    phone = data.get("phone", "").strip()
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

    try:
        if db.query(User).filter((User.email == email) | (User.username == data["username"].strip())).first():
            return {"success": False, "message": "Email or username already registered", "data": None}

        password_hash = Hasher.hash_password(password)

        now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

        new_user = User(
            uuid=uuid4(),
            email=email,
            username=data["username"].strip(),
            full_name=data.get("full_name", "").strip(),
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
            "message": "User registered successfully",
            "data": {
                "id": new_user.id,
                "uuid": str(new_user.uuid),
                "email": new_user.email,
                "username": new_user.username,
                "full_name": new_user.full_name,
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

        return {
            "success": True,
            "message": "Signed in successfully",
            "data": {
                "access_token": access_token,
                "token_type": "bearer",
                "id": user.id,
                "uuid": str(user.uuid),
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "phone": user.phone
            }
        }
    except SQLAlchemyError as e:
        print(f"DB error: {e}")
        return {"success": False, "message": "Database error", "data": None}
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {"success": False, "message": "Internal server error", "data": None}

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