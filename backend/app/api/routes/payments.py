from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.user import User
from models.order_payment import OrderPayment
from models.mobile_payment import MobilePayment
from models.bank_payment import BankPayment
from models.subscription_order import SubscriptionOrder
from api.user_auth import get_current_user
from api.deps import get_db
from models.enums import PaymentMethodEnum, PaymentStatusEnum
from datetime import datetime
import pytz

router = APIRouter()

def get_transaction_type_from_method(method: str):
    if not method:
        return "usage"
    m = method.lower()
    if m in (PaymentMethodEnum.mobile.value, PaymentMethodEnum.bank.value, "mobile", "bank"):
        return "purchase"
    return "usage"

@router.get("/transactions")
def get_user_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # Fetch OrderPayments joined to SubscriptionOrder for current user
        orders = (
            db.query(OrderPayment)
            .join(SubscriptionOrder, OrderPayment.order_id == SubscriptionOrder.id)
            .filter(SubscriptionOrder.user_id == current_user.id)
            .order_by(OrderPayment.paid_at.desc())
            .all()
        )
    except Exception as e:
        print(f"[ERROR] Fetching orders: {e}")
        orders = []

    order_ids = [o.id for o in orders]
    mobile_map = {}
    bank_map = {}

    if order_ids:
        try:
            mobiles = db.query(MobilePayment).filter(MobilePayment.order_payment_id.in_(order_ids)).all()
            for m in mobiles:
                mobile_map.setdefault(m.order_payment_id, m)
        except Exception as e:
            print(f"[ERROR] Fetching mobile payments: {e}")

        try:
            banks = db.query(BankPayment).filter(BankPayment.order_payment_id.in_(order_ids)).all()
            for b in banks:
                bank_map.setdefault(b.order_payment_id, b)
        except Exception as e:
            print(f"[ERROR] Fetching bank payments: {e}")

    transactions = []
    total_spent = 0.0
    total_credits = 0

    for order in orders:
        # numeric amount
        try:
            amount = float(order.amount) if order.amount is not None else 0.0
        except Exception as e:
            print(f"[ERROR] Parsing amount for order {order.id}: {e}")
            amount = 0.0

        # credits from subscription_order
        credits = 0
        try:
            if getattr(order, "subscription_order", None):
                credits = int(order.subscription_order.total_sms or 0)
            else:
                so = db.query(SubscriptionOrder).filter(SubscriptionOrder.id == order.order_id).first()
                credits = int(so.total_sms or 0) if so else 0
        except Exception as e:
            print(f"[ERROR] Fetching credits for order {order.id}: {e}")
            credits = 0

        try:
            transaction_type = get_transaction_type_from_method(order.method)
        except Exception as e:
            print(f"[ERROR] Determining transaction type for order {order.id}: {e}")
            transaction_type = "usage"

        try:
            status = (order.status or "").lower()
        except Exception as e:
            print(f"[ERROR] Normalizing status for order {order.id}: {e}")
            status = "pending"

        if transaction_type == "purchase" and status == "completed":
            total_spent += amount
            total_credits += credits

        payment_ref = ""
        try:
            mp = mobile_map.get(order.id)
            bp = bank_map.get(order.id)
            if mp and getattr(mp, "transaction_reference", None):
                payment_ref = mp.transaction_reference
            elif bp and getattr(bp, "transaction_reference", None):
                payment_ref = bp.transaction_reference
        except Exception as e:
            print(f"[ERROR] Fetching payment reference for order {order.id}: {e}")

        try:
            created_at = None
            if getattr(order, "paid_at", None):
                created_at = order.paid_at
            else:
                so = getattr(order, "subscription_order", None)
                if so and getattr(so, "created_at", None):
                    created_at = so.created_at
                elif getattr(order, "created_at", None):
                    created_at = order.created_at

            created_at_iso = None
            if isinstance(created_at, datetime):
                if created_at.tzinfo is None:
                    try:
                        tz = pytz.timezone("Africa/Nairobi")
                        created_at = tz.localize(created_at)
                    except Exception as e:
                        print(f"[ERROR] Localizing datetime for order {order.id}: {e}")
                created_at_iso = created_at.astimezone(pytz.utc).replace(tzinfo=None).isoformat()
        except Exception as e:
            print(f"[ERROR] Handling created_at for order {order.id}: {e}")
            created_at_iso = None

        transactions.append({
            "id": str(order.uuid),
            "amount": amount,
            "credits": credits,
            "transaction_type": transaction_type,
            "status": status,
            "payment_method": order.method or None,
            "payment_reference": payment_ref or "",
            "created_at": created_at_iso
        })

    return {
        "success": True,
        "data": {
            "transactions": transactions,
            "total_spent": float(total_spent),
            "total_credits": int(total_credits),
            "total_transactions": len(transactions)
        }
    }
