# backend/app/api/messaging.py
from typing import Optional
from fastapi import APIRouter, Request, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
import pytz
from api.deps import get_db
from api.user_auth import get_current_user_optional
from utils.security import verify_api_token
from utils.validation import validate_phone
from models.user import User
from models.sender_id import SenderId
from models.user_subscription import UserSubscription
from services.sms_gateway_service import SmsGatewayService

router = APIRouter()

@router.post("/send-sms")
async def send_sms(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Send SMS endpoint supporting:
      - Logged-in user (JWT bearer token)
      - API access token (also provided as Bearer <token> in Authorization header)
    """
    # Validate content type
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type.lower():
        raise HTTPException(status_code=415, detail="Invalid content type. Expected application/json")

    data = await request.json()
    sender_alias = data.get("sender_id")
    phone_number = data.get("phone_number")
    message = data.get("message")

    # Validate inputs
    if not sender_alias:
        raise HTTPException(status_code=400, detail="sender_id is required")
    if not phone_number:
        raise HTTPException(status_code=400, detail="phone_number is required")
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    if not validate_phone(phone_number):
        raise HTTPException(
            status_code=400,
            detail="Phone must be in format 255XXXXXXXXX (start with 255 then 6 or 7, then 8 digits)",
        )

    # Determine user: prefer logged-in user (JWT), else verify api token
    user = current_user
    if user is None:
        # try API token (same Authorization header expected: Bearer <raw_api_token>)
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Missing authorization. Provide JWT or API token.")
        raw_token = authorization.split(" ", 1)[1].strip()
        user = verify_api_token(db, raw_token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired API token")

    # Lookup sender by alias + user_id
    sender = db.query(SenderId).filter(
        SenderId.alias == sender_alias,
        SenderId.user_id == user.id,
    ).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender ID alias not found for this user")

    # Check user subscription SMS balance
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == user.id,
        # If you have Enum objects, use SubscriptionStatusEnum.active.value or compare to enum
        UserSubscription.status == "active"
    ).first()
    if not subscription or subscription.remaining_sms <= 0:
        raise HTTPException(status_code=403, detail="Insufficient SMS balance or no active subscription")

    # Initialize SMS gateway service
    sms_service = SmsGatewayService(sender_alias)

    # Send SMS with parts check
    send_result = await sms_service.send_sms_with_parts_check(phone_number, message)

    if not send_result.get("success"):
        # forward the gateway message
        raise HTTPException(status_code=500, detail="Failed to send SMS: " + send_result.get("message", "Unknown error"))

    # Deduct used SMS parts from subscription
    parts_used = send_result["data"].get("num_parts", 1)
    subscription.used_sms += parts_used
    db.add(subscription)
    db.commit()

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    return {
        "success": True,
        "message": "SMS sent successfully",
        "data": {
            "sender_alias": sender_alias,
            "phone_number": phone_number,
            "message": message,
            "num_parts": parts_used,
            "encoding": send_result["data"].get("encoding"),
            "sent_at": now.isoformat(),
            "sms_gateway_response": send_result.get("data"),
        },
    }
