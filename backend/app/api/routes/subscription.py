# backend/app/api/subscription.py

from datetime import datetime
from fastapi import APIRouter, Depends, Request
import pytz
from sqlalchemy.orm import Session, joinedload
from api.user_auth import get_current_user
from models.sender_id import SenderId
from models.enums import PaymentStatusEnum, SenderStatusEnum
from models.user import User
from models.subscription_order import SubscriptionOrder
from utils.helpers import get_package_by_sms_count
from models.sms_package import SmsPackage
from models.package_benefit import PackageBenefit
from models.benefit import Benefit
from api.deps import get_db

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
        "message": "Subscription order created successfully",
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