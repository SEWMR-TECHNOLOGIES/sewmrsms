# backend/app/api/routes/admin_auth.py
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from api.deps import get_db
from api.admin_auth import get_current_admin
from models.admin_user import AdminUser, AdminRoleEnum
from models.admin_activity_log import AdminActivityLog
from utils.security import Hasher, create_access_token
from utils.validation import validate_email
from datetime import timedelta

router = APIRouter()


@router.post("/login")
async def admin_login(request: Request, db: Session = Depends(get_db)):
    """Admin login - completely separate from user auth."""
    body = await request.json()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    admin = db.query(AdminUser).filter(AdminUser.email == email).first()
    if not admin or not Hasher.verify_password(password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Update last login
    admin.last_login = func.now()
    db.commit()

    # Create admin token with is_admin flag
    token = create_access_token(
        data={"sub": str(admin.uuid), "is_admin": True, "role": admin.role.value},
        expires_delta=timedelta(hours=8)
    )

    # Log activity
    log = AdminActivityLog(
        admin_id=admin.id,
        action="login",
        entity_type="admin_user",
        entity_id=admin.id,
        ip_address=request.client.host if request.client else None
    )
    db.add(log)
    db.commit()

    response = JSONResponse(content={
        "success": True,
        "message": "Login successful",
        "data": {
            "uuid": str(admin.uuid),
            "email": admin.email,
            "username": admin.username,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "role": admin.role.value
        }
    })
    response.set_cookie(
        key="admin_session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=8 * 3600
    )
    return response


@router.get("/me")
async def admin_me(admin: AdminUser = Depends(get_current_admin)):
    """Get current admin profile."""
    return {
        "success": True,
        "data": {
            "uuid": str(admin.uuid),
            "email": admin.email,
            "username": admin.username,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "role": admin.role.value,
            "is_active": admin.is_active,
            "last_login": str(admin.last_login) if admin.last_login else None
        }
    }


@router.post("/logout")
async def admin_logout():
    """Admin logout."""
    response = JSONResponse(content={"success": True, "message": "Logged out"})
    response.delete_cookie("admin_session_token")
    return response


@router.post("/create-admin")
async def create_admin(
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new admin user. Only superadmins can do this."""
    if admin.role != AdminRoleEnum.superadmin:
        raise HTTPException(status_code=403, detail="Only superadmins can create admin accounts")

    body = await request.json()
    email = body.get("email", "").strip().lower()
    username = body.get("username", "").strip().lower()
    password = body.get("password", "")
    first_name = body.get("first_name", "").strip()
    last_name = body.get("last_name", "").strip()
    role = body.get("role", "admin")

    if not email or not username or not password:
        raise HTTPException(status_code=400, detail="Email, username, and password are required")

    if not validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    if role not in ['admin', 'moderator']:
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'moderator'")

    # Check duplicates
    if db.query(AdminUser).filter(AdminUser.email == email).first():
        raise HTTPException(status_code=409, detail="Email already exists")
    if db.query(AdminUser).filter(AdminUser.username == username).first():
        raise HTTPException(status_code=409, detail="Username already exists")

    new_admin = AdminUser(
        email=email,
        username=username,
        password_hash=Hasher.hash_password(password),
        first_name=first_name,
        last_name=last_name,
        role=AdminRoleEnum[role]
    )
    db.add(new_admin)
    db.flush()

    # Log
    log = AdminActivityLog(
        admin_id=admin.id,
        action="create_admin",
        entity_type="admin_user",
        entity_id=new_admin.id,
        details={"email": email, "role": role},
        ip_address=request.client.host if request.client else None
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Admin created successfully",
        "data": {"uuid": str(new_admin.uuid), "email": new_admin.email, "role": role}
    }
