# backend/app/api/user.py
import os
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import or_
from api.user_auth import get_current_user
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
from datetime import datetime
import pytz
import json
import uuid
import httpx

UPLOAD_SERVICE_URL = "https://data.sewmrtechnologies.com/handle-file-uploads.php"
MAX_FILE_SIZE = 0.5 * 1024 * 1024

router = APIRouter()

@router.post("/signup")
async def signup_user(request: Request, db: Session = Depends(get_db)):
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

@router.post("/request-sender-id")
async def request_sender_id(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        data = await request.json()
    except Exception:
        return {"success": False, "message": "Invalid JSON", "data": None}

    alias = data.get("alias", "").strip().upper()
    sample_message = data.get("sample_message", "").strip()
    company_name = data.get("company_name", "").strip()

    if not alias:
        return {"success": False, "message": "Alias is required", "data": None}
    if not sample_message:
        return {"success": False, "message": "Sample message is required", "data": None}
    if not company_name:
        return {"success": False, "message": "Company name is required", "data": None}

    if not validate_sender_alias(alias):
        return {
            "success": False,
            "message": "Alias must be 3 to 11 characters long and contain only uppercase letters, digits, and spaces",
            "data": None
        }

    # Check if alias already exists for this user in SenderIdRequests (pending/approved)
    exists = db.query(SenderIdRequest).filter(
        SenderIdRequest.user_id == current_user.id,
        SenderIdRequest.sender_alias == alias,
        or_(
            SenderIdRequest.status == SenderIdRequestStatusEnum.pending.value,
            SenderIdRequest.status == SenderIdRequestStatusEnum.approved.value
        )
    ).first()

    if exists:
        return {"success": False, "message": "Alias already requested or approved", "data": None}

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    new_request = SenderIdRequest(
        user_id=current_user.id,
        sender_alias=alias,
        sample_message=sample_message,
        company_name=company_name,
        status=SenderIdRequestStatusEnum.pending.value,
        created_at=now,
        updated_at=now
    )
    try:
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
    except Exception as e:
        print(f"DB error on sender ID request creation: {e}")
        return {"success": False, "message": "Database error", "data": None}

    return {
        "success": True,
        "message": "Sender ID request submitted successfully",
        "data": {
            "id": new_request.id,
            "uuid": str(new_request.uuid),
            "sender_alias": new_request.sender_alias,
            "status": new_request.status,
            "sample_message": new_request.sample_message,
            "company_name": new_request.company_name,
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.post("/upload-signed-sender-id-agreement")
async def upload_sender_id_document(
    sender_request_uuid: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate UUID format
    try:
        sender_uuid = uuid.UUID(sender_request_uuid)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid sender_request_uuid")

    sender_req = db.query(SenderIdRequest).filter(
        SenderIdRequest.uuid == sender_uuid,
        SenderIdRequest.user_id == current_user.id,
        SenderIdRequest.status == SenderIdRequestStatusEnum.pending.value
    ).first()
    if not sender_req:
        raise HTTPException(status_code=404, detail="Sender ID request not found or not pending")

    # Check MIME type & extension (basic check)
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    _, ext = os.path.splitext(file.filename)
    if ext.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="File extension must be .pdf")

    # Read file content and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must be less than 0.5 MB")

    # Prepare unique filename
    unique_filename = f"{uuid.uuid4()}.pdf"

    # Prepare target path for PHP upload
    target_path = "sewmrsms/uploads/sender-id-requests/"

    # Prepare multipart for upload
    files = {'file': (unique_filename, content, 'application/pdf')}
    data = {'target_path': target_path}

    async with httpx.AsyncClient() as client:
        response = await client.post(UPLOAD_SERVICE_URL, data=data, files=files)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Upload service error")

    result = response.json()
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Upload failed"))

    # Update DB with document URL
    sender_req.document_path = result["data"]["url"]
    sender_req.updated_at = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    try:
        db.commit()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update sender ID request")

    return {
        "success": True,
        "message": "Sender ID agreement uploaded successfully",
        "data": {
            "uuid": str(sender_req.uuid),
            "document_path": sender_req.document_path
        }
    }