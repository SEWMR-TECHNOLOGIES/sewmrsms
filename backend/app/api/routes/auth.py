# backend/app/api/auth.py
"""Auth routes with Pydantic validation for cleaner, more efficient request handling."""

from datetime import datetime, timedelta
import hashlib
import secrets
from typing import Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import ValidationError
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from uuid import uuid4

from api.deps import get_db
from api.user_auth import get_current_user
from core.config import COOKIE_DOMAIN, IS_PRODUCTION, MAX_COOKIE_AGE
from models.api_access_tokens import ApiAccessToken
from models.contact import Contact
from models.enums import SmsDeliveryStatusEnum
from models.password_reset_tokens import PasswordResetToken
from models.scheduled_message import SmsScheduledMessage
from models.sent_messages import SentMessage
from models.sms_callback import SmsCallback
from models.sms_schedule import SmsSchedule
from models.user import User
from models.user_outage_notification import UserOutageNotification
from models.user_subscription import UserSubscription
from schemas.auth import (
    GenerateApiTokenRequest,
    OutageNotificationRequest,
    PasswordResetRequestSchema,
    ResetPasswordSchema,
    SigninRequest,
    SignupRequest,
)
from utils.responses import fail, ok
from utils.security import Hasher, create_access_token, verify_access_token
from utils.send_password_reset_email import send_password_reset_email
from utils.timezone import now_eat
from utils.validation import validate_email, validate_phone

router = APIRouter()


@router.post("/signup", summary="Create a new user account")
async def signup_user(payload: SignupRequest, db: Session = Depends(get_db)):

    # Check duplicates in a single query
    dup = db.query(User).filter(
        or_(
            User.email == payload.email,
            User.username == payload.username,
            User.phone == payload.phone,
        )
    ).first()
    if dup:
        if dup.email == payload.email:
            return fail("Email already registered")
        if dup.username == payload.username:
            return fail("Username already registered")
        return fail("Phone number already registered")

    now = now_eat()
    new_user = User(
        uuid=uuid4(),
        email=payload.email,
        username=payload.username,
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        password_hash=Hasher.hash_password(payload.password),
        created_at=now,
        updated_at=now,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return ok(
        f"Dear {payload.first_name}, your account has been created successfully. Welcome to SEWMR SMS! To proceed, please log in.",
        {
            "id": new_user.id,
            "uuid": str(new_user.uuid),
            "email": new_user.email,
            "username": new_user.username,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "phone": new_user.phone,
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        },
    )


@router.post("/signin", summary="Sign in with email/username/phone + password")
async def signin_user(payload: SigninRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        or_(
            User.email == payload.identifier,
            User.username == payload.identifier,
            User.phone == payload.identifier,
        )
    ).first()

    if not user or not Hasher.verify_password(payload.password, user.password_hash):
        return fail("Invalid credentials")

    access_token = create_access_token({"sub": str(user.uuid)})

    response = JSONResponse(ok("Signed in successfully", {
        "id": user.id,
        "uuid": str(user.uuid),
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
    }))
    response.set_cookie(
        key="session_token",
        value=access_token,
        domain=COOKIE_DOMAIN,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=MAX_COOKIE_AGE,
    )
    return response


@router.post("/request-password-reset", summary="Request a password reset link")
async def password_reset_request(payload: PasswordResetRequestSchema, request: Request, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        or_(
            User.email == payload.identifier,
            User.username == payload.identifier,
            User.phone == payload.identifier,
        )
    ).first()

    # Security: always return success to avoid user enumeration
    if not user or not user.email:
        return ok("If the identifier exists, a reset link has been sent to the associated email")

    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = now_eat()
    expires_at = now + timedelta(minutes=15)

    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        created_at=now,
        expires_at=expires_at,
        used=False,
    ))
    db.commit()

    backend_host = f"{request.url.scheme}://{request.url.hostname}"
    if request.url.port:
        backend_host += f":{request.url.port}"
    reset_link = f"{backend_host}/api/v1/auth/accept-reset?{urlencode({'token': raw_token})}"

    send_password_reset_email(user.email, reset_link, user.first_name)

    return ok("If the identifier exists, a reset link has been sent to the associated email")


@router.get("/accept-reset")
async def accept_reset(token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    now = datetime.utcnow()

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now,
    ).first()

    if not reset_token:
        return JSONResponse(fail("Invalid or expired reset token"), status_code=400)

    redirect = RedirectResponse("https://app.sewmrsms.co.tz/reset-password")
    redirect.set_cookie(
        key="reset_token",
        value=token,
        domain=COOKIE_DOMAIN,
        path="/",
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=15 * 60,
    )
    return redirect


@router.post("/reset-password", summary="Reset password using token cookie")
async def reset_password(
    payload: ResetPasswordSchema,
    reset_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
):
    if not reset_token:
        raise HTTPException(status_code=400, detail="Reset token cookie missing")

    token_hash = hashlib.sha256(reset_token.encode("utf-8")).hexdigest()
    now = datetime.utcnow()

    reset_token_obj = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now,
    ).first()

    if not reset_token_obj:
        return fail("Invalid or expired reset token")

    user = db.query(User).filter(User.id == reset_token_obj.user_id).first()
    if not user:
        return fail("User not found")

    user.password_hash = Hasher.hash_password(payload.new_password)
    reset_token_obj.used = True
    db.commit()

    return ok("Password reset successfully")


@router.get("/validate-token")
async def validate_token(session_token: str = Cookie(None), db: Session = Depends(get_db)):
    if not session_token:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=fail("No session token"),
        )

    try:
        payload = verify_access_token(session_token)
        user_uuid = payload.get("sub")
        if not user_uuid:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=fail("Invalid token payload"),
            )

        user = db.query(User).filter(User.uuid == user_uuid).first()
        if not user:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=fail("User not found"),
            )

        return ok("Token is valid", {
            "user": {
                "uuid": str(user.uuid),
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "phone": user.phone,
            }
        })
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=fail(str(e)),
        )


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("session_token", domain=COOKIE_DOMAIN, path="/")
    return ok("Logged out successfully")


@router.post("/generate-api-token")
async def generate_api_token(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
        payload = GenerateApiTokenRequest(**body)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.errors()[0]["msg"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Check duplicate name
    if db.query(ApiAccessToken).filter(
        ApiAccessToken.user_id == current_user.id,
        ApiAccessToken.name == payload.name,
    ).first():
        raise HTTPException(status_code=400, detail=f"Token name '{payload.name}' already exists.")

    now = now_eat()
    expires_at = now + timedelta(days=30)

    for _ in range(5):
        raw_token = secrets.token_urlsafe(40)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

        db.add(ApiAccessToken(
            user_id=current_user.id,
            name=payload.name,
            token_hash=token_hash,
            created_at=now,
            expires_at=expires_at,
            revoked=False,
        ))
        try:
            db.commit()
            return ok("API access token generated successfully", {
                "access_token": raw_token,
                "expires_at": expires_at.isoformat(),
                "name": payload.name,
            })
        except Exception:
            db.rollback()
            continue

    raise HTTPException(status_code=500, detail="Could not generate a unique API token. Try again later.")


@router.get("/me")
async def get_current_user_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_remaining_sms = db.query(
        func.coalesce(func.sum(UserSubscription.remaining_sms), 0)
    ).filter(UserSubscription.user_id == current_user.id).scalar()

    return ok("User authenticated", {
        "id": current_user.id,
        "uuid": str(current_user.uuid),
        "email": current_user.email,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "remaining_sms": total_remaining_sms,
    })


@router.get("/api-tokens")
async def get_api_tokens(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tokens = db.query(ApiAccessToken).filter(ApiAccessToken.user_id == current_user.id).all()
    token_list = [
        {
            "id": str(t.id),
            "name": getattr(t, "name", f"Token {t.id}"),
            "token_masked": f"****-****-****-{t.token_hash[-6:]}",
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "expires_at": t.expires_at.isoformat() if t.expires_at else None,
            "status": "revoked" if t.revoked else "active",
            "last_used": t.last_used.isoformat() if t.last_used else None,
        }
        for t in tokens
    ]
    return ok("API tokens retrieved", token_list)


@router.post("/api-tokens/{token_id}/revoke")
async def revoke_api_token(
    token_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token = db.query(ApiAccessToken).filter(
        ApiAccessToken.id == token_id,
        ApiAccessToken.user_id == current_user.id,
    ).first()
    if not token:
        return JSONResponse(status_code=404, content=fail("Token not found"))
    if token.revoked:
        return ok("Token is already revoked")

    token.revoked = True
    db.commit()
    return ok("Token revoked successfully")


@router.delete("/api-tokens/{token_id}")
async def delete_api_token(
    token_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token = db.query(ApiAccessToken).filter(
        ApiAccessToken.id == token_id,
        ApiAccessToken.user_id == current_user.id,
    ).first()
    if not token:
        return JSONResponse(status_code=404, content=fail("Token not found"))

    db.delete(token)
    db.commit()
    return ok("Token deleted successfully")


# Constants for delivery status checks
DELIVERED_STATUSES = [
    SmsDeliveryStatusEnum.delivered.value,
    SmsDeliveryStatusEnum.acknowledged.value,
    SmsDeliveryStatusEnum.accepted.value,
]


def _percent_change(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 2)


@router.get("/dashboard/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = now_eat()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    yesterday_end = today_start - timedelta(seconds=1)

    # Messages Sent
    messages_today = db.query(func.count(SentMessage.id)).filter(
        SentMessage.user_id == current_user.id,
        SentMessage.sent_at >= today_start,
    ).scalar() or 0
    messages_yesterday = db.query(func.count(SentMessage.id)).filter(
        SentMessage.user_id == current_user.id,
        SentMessage.sent_at.between(yesterday_start, yesterday_end),
    ).scalar() or 0
    messages_change = _percent_change(messages_today, messages_yesterday)

    # Delivery Rate
    delivered_today = db.query(func.count(SmsCallback.id)).filter(
        SmsCallback.user_id == current_user.id,
        SmsCallback.received_at >= today_start,
        SmsCallback.status.in_(DELIVERED_STATUSES),
    ).scalar() or 0
    total_callbacks_today = db.query(func.count(SmsCallback.id)).filter(
        SmsCallback.user_id == current_user.id,
        SmsCallback.received_at >= today_start,
    ).scalar() or 0
    delivery_rate_today = round((delivered_today / max(total_callbacks_today, 1)) * 100, 2)

    delivered_yesterday = db.query(func.count(SmsCallback.id)).filter(
        SmsCallback.user_id == current_user.id,
        SmsCallback.received_at.between(yesterday_start, yesterday_end),
        SmsCallback.status.in_(DELIVERED_STATUSES),
    ).scalar() or 0
    total_callbacks_yesterday = db.query(func.count(SmsCallback.id)).filter(
        SmsCallback.user_id == current_user.id,
        SmsCallback.received_at.between(yesterday_start, yesterday_end),
    ).scalar() or 0
    delivery_rate_yesterday = round((delivered_yesterday / max(total_callbacks_yesterday, 1)) * 100, 2)
    delivery_change = _percent_change(delivery_rate_today, delivery_rate_yesterday)

    # Contacts
    total_contacts = db.query(func.count(Contact.id)).filter(Contact.user_id == current_user.id).scalar() or 0
    contacts_yesterday = db.query(func.count(Contact.id)).filter(
        Contact.user_id == current_user.id,
        Contact.created_at < today_start,
    ).scalar() or 0
    contacts_change = _percent_change(total_contacts, contacts_yesterday)

    # Credits Remaining
    credits_today = db.query(func.coalesce(func.sum(UserSubscription.remaining_sms), 0)).filter(
        UserSubscription.user_id == current_user.id
    ).scalar() or 0
    used_since_yesterday = db.query(func.coalesce(func.sum(SentMessage.number_of_parts), 0)).filter(
        SentMessage.user_id == current_user.id,
        SentMessage.sent_at >= yesterday_start,
    ).scalar() or 0
    credits_yesterday = credits_today + used_since_yesterday
    credits_change = _percent_change(credits_today, credits_yesterday)

    return {
        "timestamp": now.isoformat(),
        "metrics": {
            "messages_sent_today": {"value": messages_today, "change": messages_change, "trend": "up" if messages_change >= 0 else "down"},
            "delivery_rate": {"value": delivery_rate_today, "change": delivery_change, "trend": "up" if delivery_change >= 0 else "down"},
            "total_contacts": {"value": total_contacts, "change": contacts_change, "trend": "up" if contacts_change >= 0 else "down"},
            "credits_remaining": {"value": credits_today, "change": credits_change, "trend": "up" if credits_change >= 0 else "down"},
        },
    }


@router.get("/dashboard/recent-messages")
def recent_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 5,
):
    schedules = (
        db.query(SmsSchedule)
        .filter(SmsSchedule.user_id == current_user.id)
        .order_by(SmsSchedule.created_at.desc())
        .limit(limit)
        .all()
    )

    results = []
    for schedule in schedules:
        total_messages = db.query(func.count(SmsScheduledMessage.id)).filter(
            SmsScheduledMessage.schedule_id == schedule.id
        ).scalar() or 0

        preview_msg = db.query(SmsScheduledMessage.message).filter(
            SmsScheduledMessage.schedule_id == schedule.id
        ).order_by(SmsScheduledMessage.created_at.asc()).first()

        latest_sent = db.query(func.max(SmsScheduledMessage.sent_at)).filter(
            SmsScheduledMessage.schedule_id == schedule.id
        ).scalar()

        results.append({
            "id": schedule.id,
            "recipient": schedule.title,
            "message": preview_msg[0] if preview_msg else "",
            "status": schedule.status.value if schedule.status else "pending",
            "timestamp": (latest_sent or schedule.created_at).isoformat(),
            "count": total_messages,
        })

    return {"recent_messages": results}


@router.post("/set-outage-notification")
async def set_outage_notification(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        data = await request.json()
        payload = OutageNotificationRequest(**data)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.errors()[0]["msg"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    phone = payload.phone or current_user.phone
    email = payload.email or current_user.email

    if not phone or not validate_phone(phone):
        raise HTTPException(status_code=400, detail="Phone must be in format 255XXXXXXXXX")
    if not email or not validate_email(email):
        raise HTTPException(status_code=400, detail="Valid email is required")

    now = now_eat()
    notification = db.query(UserOutageNotification).filter(
        UserOutageNotification.user_id == current_user.id
    ).first()

    if notification:
        notification.phone = phone
        notification.email = email
        notification.notify_before_messages = payload.notify_before_messages
        notification.updated_at = now
    else:
        notification = UserOutageNotification(
            uuid=uuid4(),
            user_id=current_user.id,
            phone=phone,
            email=email,
            notify_before_messages=payload.notify_before_messages,
            created_at=now,
            updated_at=now,
        )
        db.add(notification)

    db.commit()
    db.refresh(notification)

    return ok("Outage notification preferences saved successfully", {
        "id": notification.id,
        "phone": notification.phone,
        "email": notification.email,
        "notify_before_messages": notification.notify_before_messages,
        "created_at": notification.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": notification.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
    })


@router.get("/get-outage-notification")
async def get_outage_notification(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(UserOutageNotification).filter(
        UserOutageNotification.user_id == current_user.id
    ).first()

    if not notification:
        return ok("No outage notification preferences found. Using account defaults.", {
            "phone": current_user.phone or "",
            "email": current_user.email or "",
            "notify_before_messages": 1,
        })

    return ok("Outage notification preferences retrieved successfully", {
        "phone": notification.phone,
        "email": notification.email,
        "notify_before_messages": notification.notify_before_messages,
        "last_notified_at": notification.last_notified_at.isoformat() if notification.last_notified_at else None,
        "notification_count": notification.notification_count,
    })
