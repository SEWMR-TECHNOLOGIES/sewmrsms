from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
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

def _enum_to_str(val):
    """Return string representation for Enum or plain value, safe if None."""
    if val is None:
        return ""
    # If it's an Enum instance use its .value
    if hasattr(val, "value"):
        try:
            return str(val.value)
        except Exception:
            return str(val)
    return str(val)

def get_transaction_type_from_method(method):
    """
    Accept method as Enum instance or string.
    Returns 'purchase' for mobile or bank else 'usage'.
    """
    if not method:
        return "usage"
    m = _enum_to_str(method).lower()
    if m in (PaymentMethodEnum.mobile.value, PaymentMethodEnum.bank.value, "mobile", "bank"):
        return "purchase"
    return "usage"

@router.get("/transactions")
def get_user_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # eager load subscription_order to avoid extra queries
        orders = (
            db.query(OrderPayment)
            .join(SubscriptionOrder, OrderPayment.order_id == SubscriptionOrder.id)
            .options(joinedload(OrderPayment.subscription_order))
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
                mobile_map[m.order_payment_id] = m
        except Exception as e:
            print(f"[ERROR] Fetching mobile payments: {e}")

        try:
            banks = db.query(BankPayment).filter(BankPayment.order_payment_id.in_(order_ids)).all()
            for b in banks:
                bank_map[b.order_payment_id] = b
        except Exception as e:
            print(f"[ERROR] Fetching bank payments: {e}")

    transactions = []
    total_spent = 0.0
    total_credits = 0

    local_tz = pytz.timezone("Africa/Nairobi")
    for order in orders:
        # numeric amount
        try:
            amount = float(order.amount) if order.amount is not None else 0.0
        except Exception as e:
            print(f"[ERROR] Parsing amount for order {order.id}: {e}")
            amount = 0.0

        # credits from subscription_order (use the eager loaded relationship if present)
        credits = 0
        try:
            so = getattr(order, "subscription_order", None)
            if so:
                credits = int(so.total_sms or 0)
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
            status_raw = _enum_to_str(order.status)
            status = status_raw.lower() if status_raw else "pending"
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

        # Handle created_at robustly
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
                    # assume local tz if naive
                    created_at = local_tz.localize(created_at)
                created_at_iso = created_at.astimezone(pytz.utc).isoformat()
            else:
                created_at_iso = None
        except Exception as e:
            print(f"[ERROR] Handling created_at for order {order.id}: {e}")
            created_at_iso = None

        # normalize payment_method to string
        payment_method_val = _enum_to_str(order.method) or None

        transactions.append({
            "id": str(order.uuid),
            "amount": amount,
            "credits": credits,
            "transaction_type": transaction_type,
            "status": status,
            "payment_method": payment_method_val,
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

@router.get("/all-transactions")
def get_all_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch order payments for the user with subscription_order joined
    orders = db.query(OrderPayment).join(SubscriptionOrder).options(joinedload(OrderPayment.subscription_order))\
               .filter(SubscriptionOrder.user_id == current_user.id)\
               .order_by(OrderPayment.paid_at.desc()).all()

    transactions = []

    for order in orders:
        # Base info
        subscription_order_uuid = str(order.subscription_order.uuid) if order.subscription_order else None
        order_uuid = str(order.uuid)
        amount = float(order.amount or 0)
        credits = int(order.subscription_order.total_sms) if order.subscription_order else 0
        status = _enum_to_str(order.status).lower() if order.status else "pending"
        transaction_type = get_transaction_type_from_method(order.method)
        payment_method_val = _enum_to_str(order.method) or None
        created_at = order.paid_at
        created_at_iso = created_at.astimezone(pytz.utc).isoformat() if isinstance(created_at, datetime) else None

        # Mobile payment if exists
        mobile = db.query(MobilePayment).filter(MobilePayment.order_payment_id == order.id).first()
        mobile_data = {}
        if mobile:
            mobile_data = {
                "mobile_uuid": str(mobile.uuid),
                "checkout_request_id": mobile.checkout_request_id,
                "transaction_reference": mobile.transaction_reference,
                "gateway": mobile.gateway,
                "amount": float(mobile.amount or 0)
            }

        # Bank payment if exists
        bank = db.query(BankPayment).filter(BankPayment.order_payment_id == order.id).first()
        bank_data = {}
        if bank:
            bank_data = {
                "bank_uuid": str(bank.uuid),
                "transaction_reference": bank.transaction_reference,
                "bank_name": bank.bank_name,
                "slip_path": bank.slip_path
            }

        transactions.append({
            "subscription_order_uuid": subscription_order_uuid,
            "order_uuid": order_uuid,
            "amount": amount,
            "credits": credits,
            "transaction_type": transaction_type,
            "status": status,
            "payment_method": payment_method_val,
            "created_at": created_at_iso,
            **mobile_data,
            **bank_data
        })

    return {"success": True, "data": {"transactions": transactions, "total_transactions": len(transactions)}}