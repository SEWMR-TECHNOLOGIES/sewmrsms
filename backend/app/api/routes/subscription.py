# backend/app/api/subscription.py

from datetime import datetime
import os
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
import httpx
import pytz
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload
from api.user_auth import get_current_user
from models.bank_payment import BankPayment
from models.order_payment import OrderPayment
from models.sender_id import SenderId
from models.enums import PaymentMethodEnum, PaymentStatusEnum, SenderStatusEnum
from models.user import User
from models.subscription_order import SubscriptionOrder
from utils.helpers import get_package_by_sms_count
from models.sms_package import SmsPackage
from models.package_benefit import PackageBenefit
from models.benefit import Benefit
from api.deps import get_db
from core.config import UPLOAD_SERVICE_URL, MAX_FILE_SIZE

router = APIRouter()
@router.get("/packages")
def get_sms_packages(db: Session = Depends(get_db)):
    # Load packages with their benefits using joins
    packages = db.query(SmsPackage).options(
        joinedload(SmsPackage.package_benefits).joinedload(PackageBenefit.benefit)
    ).all()

    result = []
    for pkg in packages:
        # Extract benefits descriptions for each package
        benefits = [pb.benefit.description for pb in pkg.package_benefits]
        result.append({
            "uuid": str(pkg.uuid),
            "name": pkg.name,
            "price_per_sms": float(pkg.price_per_sms),
            "start_sms_count": pkg.start_sms_count,
            "best_for": pkg.best_for,
            "benefits": benefits,
            "created_at": pkg.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": pkg.updated_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    return {
        "success": True,
        "message": "SMS packages loaded successfully",
        "data": result
    }

@router.post("/purchase-sms")
async def purchase_subscription(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check user has at least one active sender id
    active_sender = db.query(SenderId).filter(
        SenderId.user_id == current_user.id,
        SenderId.status == SenderStatusEnum.active
    ).first()

    if not active_sender:
        return {
            "success": False,
            "message": "You must have at least one active sender ID to purchase SMS",
            "data": None
        }

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

    number_of_messages = data.get("number_of_messages")
    if number_of_messages is None:
        return {"success": False, "message": "number_of_messages is required", "data": None}
    if not isinstance(number_of_messages, int):
        return {"success": False, "message": "number_of_messages must be an integer", "data": None}
    if number_of_messages <= 0:
        return {"success": False, "message": "number_of_messages must be greater than zero", "data": None}

    package = get_package_by_sms_count(db, number_of_messages)
    if not package:
        return {"success": False, "message": "No suitable SMS package found for the requested number of messages", "data": None}

    total_amount = float(package.price_per_sms) * number_of_messages
    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    new_order = SubscriptionOrder(
        package_id=package.id,
        user_id=current_user.id,
        amount=total_amount,
        total_sms=number_of_messages,
        payment_status=PaymentStatusEnum.pending.value,
        created_at=now
    )

    try:
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
    except Exception as e:
        print(f"DB error on submitting subscription order request: {e}")
        return {"success": False, "message": "Database error", "data": None}

    return {
        "success": True,
        "message": "Subscription order created successfully. Please complete payment to activate your subscription.",
        "data": {
            "uuid": str(new_order.uuid),
            "package_uuid": str(package.uuid),
            "package_name": package.name,
            "amount": total_amount,
            "total_sms": number_of_messages,
            "payment_status": new_order.payment_status.value,
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        }
    }

@router.post("/submit-bank-payment")
async def submit_bank_payment(
    request: Request,
    current_user: User = Depends(get_current_user),
    subscription_order_uuid: str = Form(None),
    transaction_reference: str = Form(None),
    bank_name: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type.lower():
        raise HTTPException(status_code=415, detail="Invalid content type. Expected multipart/form-data")

    # Explicit required checks with clear messages
    if not subscription_order_uuid:
        raise HTTPException(status_code=400, detail="Subscription reference id (uuid) is required")
    if not transaction_reference:
        raise HTTPException(status_code=400, detail="Transaction reference is required")
    if not bank_name:
        raise HTTPException(status_code=400, detail="Bank name is required")
    if not file:
        raise HTTPException(status_code=400, detail="Bank slip must be attached")

    # Validate UUID format
    try:
        subscription_uuid_obj = uuid.UUID(subscription_order_uuid)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subscription_order_uuid format")

    # Get subscription order, must be pending
    subscription_order = db.query(SubscriptionOrder).filter(
        and_(
            SubscriptionOrder.uuid == subscription_uuid_obj,
            SubscriptionOrder.payment_status == PaymentStatusEnum.pending
        )
    ).first()

    if not subscription_order:
        raise HTTPException(status_code=400, detail="No pending subscription order found for this UUID")

    # Check file type and size
    allowed_content_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_content_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: PDF, JPEG, PNG")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must be less than 0.5 MB")

    # Check if there's an existing OrderPayment for this subscription_order with pending status
    order_payment = db.query(OrderPayment).filter(
        OrderPayment.order_id == subscription_order.id,
        OrderPayment.status == PaymentStatusEnum.pending.value
    ).first()

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    if not order_payment:
        order_payment = OrderPayment(
            order_id=subscription_order.id,
            amount=subscription_order.amount,
            method=PaymentMethodEnum.bank.value,
            status=PaymentStatusEnum.pending.value,
            paid_at=now
        )
        db.add(order_payment)
        db.flush()

    # Check for existing BankPayment for this order_payment
    bank_payment = db.query(BankPayment).filter(
        BankPayment.order_payment_id == order_payment.id
    ).first()

    # Prepare unique filename with extension
    _, ext = os.path.splitext(file.filename)
    ext = ext.lower() if ext else ".pdf"
    unique_filename = f"{uuid.uuid4()}{ext}"

    # Prepare upload data
    target_path = "sewmrsms/uploads/subscriptions/bank-slips/"

    data = {"target_path": target_path}
    if bank_payment and bank_payment.slip_path:
        data["old_attachment"] = bank_payment.slip_path 

    files = {"file": (unique_filename, content, file.content_type)}

    # Upload to external service
    async with httpx.AsyncClient() as client:
        response = await client.post(UPLOAD_SERVICE_URL, data=data, files=files)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Upload service error")

    result = response.json()
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Upload failed"))

    slip_url = result["data"]["url"]

    # Update or create BankPayment
    if bank_payment:
        bank_payment.bank_name = bank_name
        bank_payment.transaction_reference = transaction_reference
        bank_payment.slip_path = slip_url
        bank_payment.paid_at = now
    else:
        bank_payment = BankPayment(
            order_payment_id=order_payment.id,
            bank_name=bank_name,
            transaction_reference=transaction_reference,
            slip_path=slip_url,
            paid_at=now
        )
        db.add(bank_payment)

    order_payment.paid_at = now

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "success": True,
        "message": "Your subscription bank payment details have been received and are pending review. We will notify you once your subscription is approved.",
        "data": {
            "subscription_order_uuid": str(subscription_order.uuid),
            "order_payment_uuid": str(order_payment.uuid),
            "bank_payment_uuid": str(bank_payment.uuid),
            "bank_name": bank_payment.bank_name,
            "transaction_reference": bank_payment.transaction_reference,
            "slip_path": bank_payment.slip_path,
            "payment_status": subscription_order.payment_status.value,
        }
    }