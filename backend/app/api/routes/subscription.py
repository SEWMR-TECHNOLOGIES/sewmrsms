# backend/app/api/subscription.py
"""Subscription routes with Pydantic validation."""

from datetime import datetime
import math
import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Path, Request, UploadFile
import httpx
from pydantic import ValidationError
from sqlalchemy.orm import Session

from api.deps import get_db
from api.user_auth import get_current_user
from core.config import MAX_FILE_SIZE, UPLOAD_SERVICE_URL
from models.bank_payment import BankPayment
from models.enums import PaymentMethodEnum, PaymentStatusEnum, SenderStatusEnum, SubscriptionStatusEnum
from models.mobile_payment import MobilePayment
from models.order_payment import OrderPayment
from models.sender_id import SenderId
from models.subscription_order import SubscriptionOrder
from models.user import User
from models.user_subscription import UserSubscription
from schemas.sms import MobilePaymentRequest
from schemas.subscription import PurchaseSmsRequest
from services.payment_service import PaymentGateway
from utils.helpers import get_package_by_sms_count
from utils.responses import fail, ok
from utils.timezone import now_eat

router = APIRouter()
gateway = PaymentGateway()


@router.post("/purchase-sms", summary="Purchase SMS credits")
async def purchase_subscription(
    payload: PurchaseSmsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    active_sender = db.query(SenderId).filter(
        SenderId.user_id == current_user.id,
        SenderId.status == SenderStatusEnum.active,
    ).first()
    if not active_sender:
        return fail("You must have at least one active sender ID to purchase SMS")

    package = get_package_by_sms_count(db, payload.number_of_messages)
    if not package:
        return fail("No suitable SMS package found for the requested number of messages")

    total_amount = float(package.price_per_sms) * payload.number_of_messages
    min_amount = 1000
    min_sms_needed = int(math.ceil(min_amount / package.price_per_sms))

    if total_amount < min_amount:
        return fail(f"Minimum order amount is TZS {min_amount:,}. You need at least {min_sms_needed} messages.")

    now = now_eat()
    new_order = SubscriptionOrder(
        package_id=package.id,
        user_id=current_user.id,
        amount=total_amount,
        total_sms=payload.number_of_messages,
        payment_status=PaymentStatusEnum.pending.value,
        created_at=now,
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return ok(
        "Subscription order created successfully. Please complete payment to activate your subscription.",
        {
            "uuid": str(new_order.uuid),
            "package_uuid": str(package.uuid),
            "package_name": package.name,
            "amount": total_amount,
            "total_sms": payload.number_of_messages,
            "payment_status": new_order.payment_status.value,
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        },
    )


@router.post("/{subscription_order_uuid}/payments/bank")
async def submit_bank_payment(
    request: Request,
    subscription_order_uuid: uuid.UUID = Path(...),
    transaction_reference: str = Form(...),
    bank_name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if "multipart/form-data" not in request.headers.get("content-type", "").lower():
        return fail("Invalid content type. Expected multipart/form-data")

    subscription_order = db.query(SubscriptionOrder).filter(
        SubscriptionOrder.uuid == subscription_order_uuid,
        SubscriptionOrder.payment_status == PaymentStatusEnum.pending,
    ).first()
    if not subscription_order:
        return fail("No pending subscription order found for this UUID")
    if subscription_order.user_id != current_user.id:
        return fail("Not authorized to submit payment for this order")

    allowed_content_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_content_types:
        return fail("Invalid file type. Allowed: PDF, JPEG, PNG")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        return fail("File size must be less than 0.5 MB")

    order_payment = db.query(OrderPayment).filter(
        OrderPayment.order_id == subscription_order.id,
        OrderPayment.status == PaymentStatusEnum.pending.value,
    ).first()

    now = now_eat()
    if not order_payment:
        order_payment = OrderPayment(
            order_id=subscription_order.id,
            amount=subscription_order.amount,
            method=PaymentMethodEnum.bank.value,
            status=PaymentStatusEnum.pending.value,
            paid_at=now,
        )
        db.add(order_payment)
        db.flush()

    bank_payment = db.query(BankPayment).filter(
        BankPayment.order_payment_id == order_payment.id
    ).first()

    _, ext = os.path.splitext(file.filename)
    ext = ext.lower() if ext else ".pdf"
    unique_filename = f"{uuid.uuid4()}{ext}"

    target_path = "sewmrsms/uploads/subscriptions/bank-slips/"
    data = {"target_path": target_path}
    if bank_payment and bank_payment.slip_path:
        data["old_attachment"] = bank_payment.slip_path

    files = {"file": (unique_filename, content, file.content_type)}

    async with httpx.AsyncClient() as client:
        response = await client.post(UPLOAD_SERVICE_URL, data=data, files=files)

    if response.status_code != 200:
        return fail("Upload service error")

    result = response.json()
    if not result.get("success"):
        return fail(result.get("message", "Upload failed"))

    slip_url = result["data"]["url"]

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
            paid_at=now,
        )
        db.add(bank_payment)

    order_payment.paid_at = now
    db.commit()

    return ok(
        "Your subscription bank payment details have been received and are pending review.",
        {
            "subscription_order_uuid": str(subscription_order.uuid),
            "order_payment_uuid": str(order_payment.uuid),
            "bank_payment_uuid": str(bank_payment.uuid),
            "bank_name": bank_payment.bank_name,
            "transaction_reference": bank_payment.transaction_reference,
            "slip_path": bank_payment.slip_path,
            "payment_status": subscription_order.payment_status.value,
        },
    )


@router.post("/{subscription_order_uuid}/payments/mobile")
async def submit_mobile_payment(
    request: Request,
    subscription_order_uuid: uuid.UUID = Path(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        data = await request.json()
        payload = MobilePaymentRequest(**data)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.errors()[0]["msg"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    subscription_order = db.query(SubscriptionOrder).filter(
        SubscriptionOrder.uuid == subscription_order_uuid
    ).first()
    if not subscription_order:
        raise HTTPException(status_code=400, detail="Subscription order not found")

    completed_payment_exists = db.query(OrderPayment).filter(
        OrderPayment.order_id == subscription_order.id,
        OrderPayment.status == PaymentStatusEnum.completed,
    ).first()
    if subscription_order.payment_status == PaymentStatusEnum.completed or completed_payment_exists:
        raise HTTPException(status_code=400, detail="Payment has already been made for this subscription")

    now = now_eat()

    # Delete pending mobile payments
    pending_order_payment_ids = db.query(OrderPayment.id).filter(
        OrderPayment.order_id == subscription_order.id,
        OrderPayment.status == PaymentStatusEnum.pending.value,
    ).subquery()
    db.query(MobilePayment).filter(
        MobilePayment.order_payment_id.in_(pending_order_payment_ids)
    ).delete(synchronize_session=False)
    db.flush()

    order_payment = db.query(OrderPayment).filter(
        OrderPayment.order_id == subscription_order.id,
        OrderPayment.status == PaymentStatusEnum.pending.value,
        OrderPayment.method == PaymentMethodEnum.mobile.value,
    ).first()

    if not order_payment:
        order_payment = OrderPayment(
            order_id=subscription_order.id,
            amount=subscription_order.amount,
            method=PaymentMethodEnum.mobile.value,
            status=PaymentStatusEnum.pending.value,
            paid_at=now,
        )
        db.add(order_payment)
        db.flush()

    network = gateway._identify_network(payload.mobile_number)
    gateway_name = "MIXX BY YAS" if network == "TIGO" else network

    mobile_payment = MobilePayment(
        order_payment_id=order_payment.id,
        gateway=gateway_name,
        merchant_request_id="",
        checkout_request_id="",
        transaction_reference="",
        amount=order_payment.amount,
        reason="Subscription payment via mobile",
        paid_at=now,
    )
    db.add(mobile_payment)
    db.flush()

    try:
        payment_resp = await gateway.request_payment(
            phone_number=payload.mobile_number,
            amount=float(order_payment.amount),
            description="Subscription payment",
            merchant_request_id=str(mobile_payment.uuid),
        )
    except HTTPException as e:
        db.rollback()
        raise HTTPException(status_code=e.status_code, detail=f"Gateway error: {e.detail}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected gateway error: {str(e)}")

    mobile_payment.merchant_request_id = payment_resp.get("MerchantRequestID", "")
    mobile_payment.checkout_request_id = payment_resp.get("CheckoutRequestID", "")
    mobile_payment.transaction_reference = payment_resp.get("TransactionReference", "")
    db.commit()

    return ok("Payment Request made successfully.", {
        "subscription_order_uuid": str(subscription_order.uuid),
        "order_payment_uuid": str(order_payment.uuid),
        "mobile_payment_uuid": str(mobile_payment.uuid),
        "mobile_number": payload.mobile_number,
        "payment_status": subscription_order.payment_status.value,
        "checkout_request_id": mobile_payment.checkout_request_id,
    })


@router.get("/{subscription_order_uuid}/payments/{checkout_request_id}/status")
async def get_payment_status(
    subscription_order_uuid: uuid.UUID = Path(...),
    checkout_request_id: uuid.UUID = Path(...),
    request: Request = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    status = await gateway.check_transaction_status(str(checkout_request_id))

    if status != "PAID":
        return fail("Payment still pending", checkout_request_id=str(checkout_request_id), status=status)

    mobile_payment = db.query(MobilePayment).filter(
        MobilePayment.checkout_request_id == str(checkout_request_id)
    ).first()
    if not mobile_payment:
        raise HTTPException(status_code=404, detail="Mobile payment record not found")

    order_payment = db.query(OrderPayment).filter(
        OrderPayment.id == mobile_payment.order_payment_id
    ).first()
    if not order_payment:
        raise HTTPException(status_code=404, detail="Order payment record not found")

    subscription_order = db.query(SubscriptionOrder).filter(
        SubscriptionOrder.id == order_payment.order_id
    ).first()
    if not subscription_order:
        raise HTTPException(status_code=404, detail="Subscription order not found")

    if subscription_order.uuid != subscription_order_uuid:
        raise HTTPException(status_code=400, detail="Subscription UUID mismatch")

    if subscription_order.payment_status == PaymentStatusEnum.completed:
        return fail(
            f"Subscription already completed. You have purchased {subscription_order.total_sms} SMS.",
            subscription_order_uuid=str(subscription_order.uuid),
        )

    now = now_eat()
    order_payment.status = PaymentStatusEnum.completed.value
    order_payment.paid_at = now
    subscription_order.payment_status = PaymentStatusEnum.completed.value

    user_subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == subscription_order.user_id
    ).first()

    if user_subscription:
        user_subscription.total_sms += subscription_order.total_sms
        user_subscription.status = SubscriptionStatusEnum.active.value
    else:
        user_subscription = UserSubscription(
            user_id=subscription_order.user_id,
            total_sms=subscription_order.total_sms,
            used_sms=0,
            status=SubscriptionStatusEnum.active.value,
            subscribed_at=now,
        )
        db.add(user_subscription)

    db.commit()

    return ok(
        f"Congratulations, you have purchased {subscription_order.total_sms} SMS.",
        subscription_order_uuid=str(subscription_order.uuid),
        user_subscription_uuid=str(user_subscription.uuid),
    )
