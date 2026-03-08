# backend/app/api/routes/admin.py
"""
Admin management routes for full system control:
- Users management
- Sender ID requests (approve/reject/review)
- Sender ID propagation management
- Subscriptions & payments
- SMS logs
- Networks
- Packages
- System settings
- Activity logs
- Dashboard stats
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case, literal_column
from sqlalchemy.sql import text
from api.deps import get_db
from api.admin_auth import get_current_admin
from models.admin_user import AdminUser, AdminRoleEnum
from models.admin_activity_log import AdminActivityLog
from models.system_setting import SystemSetting
from models.user import User
from models.sender_id_request import SenderIdRequest
from models.sender_id import SenderId
from models.sender_id_propagation import SenderIdPropagation
from models.network import Network
from models.enums import (
    SenderIdRequestStatusEnum, SenderStatusEnum, PropagationStatusEnum,
    PaymentStatusEnum, SubscriptionStatusEnum
)
from models.user_subscription import UserSubscription
from models.subscription_order import SubscriptionOrder
from models.order_payment import OrderPayment
from models.sent_messages import SentMessage
from models.sms_callback import SmsCallback
from models.sms_package import SmsPackage
from models.contact import Contact
from models.contact_group import ContactGroup
from datetime import datetime, timedelta

router = APIRouter()


def log_activity(db, admin_id, action, entity_type, entity_id=None, details=None, ip=None):
    log = AdminActivityLog(
        admin_id=admin_id, action=action, entity_type=entity_type,
        entity_id=entity_id, details=details, ip_address=ip
    )
    db.add(log)


# ========== DASHBOARD STATS ==========

@router.get("/dashboard/stats")
async def admin_dashboard_stats(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive admin dashboard statistics."""
    total_users = db.query(func.count(User.id)).scalar()
    total_sms_sent = db.query(func.count(SentMessage.id)).scalar()
    pending_requests = db.query(func.count(SenderIdRequest.id)).filter(
        SenderIdRequest.status == SenderIdRequestStatusEnum.pending
    ).scalar()
    in_review_requests = db.query(func.count(SenderIdRequest.id)).filter(
        SenderIdRequest.status == SenderIdRequestStatusEnum.in_review
    ).scalar()
    active_subscriptions = db.query(func.count(UserSubscription.id)).filter(
        UserSubscription.status == SubscriptionStatusEnum.active
    ).scalar()
    total_revenue = db.query(func.coalesce(func.sum(OrderPayment.amount), 0)).filter(
        OrderPayment.status == PaymentStatusEnum.completed
    ).scalar()
    pending_payments = db.query(func.count(SubscriptionOrder.id)).filter(
        SubscriptionOrder.payment_status == PaymentStatusEnum.pending
    ).scalar()
    total_contacts = db.query(func.count(Contact.id)).scalar()

    # Recent 7 days SMS volume
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_sms = db.query(func.count(SentMessage.id)).filter(
        SentMessage.sent_at >= seven_days_ago
    ).scalar()

    # New users this month
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_month = db.query(func.count(User.id)).filter(
        User.created_at >= month_start
    ).scalar()

    return {
        "success": True,
        "data": {
            "total_users": total_users,
            "new_users_this_month": new_users_month,
            "total_sms_sent": total_sms_sent,
            "sms_last_7_days": recent_sms,
            "pending_sender_requests": pending_requests,
            "in_review_sender_requests": in_review_requests,
            "active_subscriptions": active_subscriptions,
            "total_revenue": float(total_revenue),
            "pending_payments": pending_payments,
            "total_contacts": total_contacts
        }
    }


# ========== USER MANAGEMENT ==========

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all users with pagination and search."""
    query = db.query(User)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) |
            (User.username.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term)) |
            (User.phone.ilike(search_term))
        )
    total = query.count()
    users = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [{
            "id": u.id, "uuid": str(u.uuid), "email": u.email,
            "username": u.username, "first_name": u.first_name,
            "last_name": u.last_name, "phone": u.phone,
            "created_at": str(u.created_at)
        } for u in users],
        "pagination": {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    }


@router.get("/users/{user_uuid}")
async def get_user_detail(
    user_uuid: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed user info with subscription, sender IDs, etc."""
    user = db.query(User).filter(User.uuid == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == user.id,
        UserSubscription.status == SubscriptionStatusEnum.active
    ).first()

    sender_ids = db.query(SenderId).filter(SenderId.user_id == user.id).all()
    total_messages = db.query(func.count(SentMessage.id)).filter(SentMessage.user_id == user.id).scalar()
    total_contacts = db.query(func.count(Contact.id)).filter(Contact.user_id == user.id).scalar()

    return {
        "success": True,
        "data": {
            "id": user.id, "uuid": str(user.uuid), "email": user.email,
            "username": user.username, "first_name": user.first_name,
            "last_name": user.last_name, "phone": user.phone,
            "created_at": str(user.created_at),
            "subscription": {
                "total_sms": subscription.total_sms,
                "used_sms": subscription.used_sms,
                "remaining_sms": subscription.remaining_sms,
                "status": subscription.status.value
            } if subscription else None,
            "sender_ids": [{"uuid": str(s.uuid), "alias": s.alias, "status": s.status.value} for s in sender_ids],
            "total_messages": total_messages,
            "total_contacts": total_contacts
        }
    }


@router.delete("/users/{user_uuid}")
async def delete_user(
    user_uuid: str,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a user account. Superadmin only."""
    if admin.role not in [AdminRoleEnum.superadmin]:
        raise HTTPException(status_code=403, detail="Only superadmins can delete users")

    user = db.query(User).filter(User.uuid == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log_activity(db, admin.id, "delete_user", "user", user.id,
                 {"email": user.email}, request.client.host if request.client else None)
    db.delete(user)
    db.commit()

    return {"success": True, "message": "User deleted successfully"}


# ========== SENDER ID REQUEST MANAGEMENT ==========

@router.get("/sender-id-requests")
async def list_sender_id_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all sender ID requests with filters."""
    query = db.query(SenderIdRequest, User).join(User, SenderIdRequest.user_id == User.id)
    if status:
        try:
            status_enum = SenderIdRequestStatusEnum[status]
            query = query.filter(SenderIdRequest.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    total = query.count()
    results = query.order_by(desc(SenderIdRequest.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [{
            "id": r.id, "uuid": str(r.uuid), "sender_alias": r.sender_alias,
            "status": r.status.value, "sample_message": r.sample_message,
            "company_name": r.company_name, "document_path": r.document_path,
            "remarks": r.remarks, "is_student_request": r.is_student_request,
            "student_id_path": r.student_id_path,
            "created_at": str(r.created_at), "updated_at": str(r.updated_at),
            "user": {"uuid": str(u.uuid), "email": u.email, "username": u.username,
                     "first_name": u.first_name, "last_name": u.last_name}
        } for r, u in results],
        "pagination": {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    }


@router.post("/sender-id-requests/{request_uuid}/approve")
async def approve_sender_id_request(
    request_uuid: str,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve a sender ID request — creates the sender ID and propagation entries."""
    body = await request.json() if request.headers.get("content-type") == "application/json" else {}
    remarks = body.get("remarks", "Approved by admin")

    sid_req = db.query(SenderIdRequest).filter(SenderIdRequest.uuid == request_uuid).first()
    if not sid_req:
        raise HTTPException(status_code=404, detail="Request not found")

    if sid_req.status == SenderIdRequestStatusEnum.approved:
        raise HTTPException(status_code=400, detail="Request already approved")

    sid_req.status = SenderIdRequestStatusEnum.approved
    sid_req.remarks = remarks

    # Create the sender ID for the user
    new_sender = SenderId(
        user_id=sid_req.user_id,
        alias=sid_req.sender_alias,
        status=SenderStatusEnum.active
    )
    db.add(new_sender)
    db.flush()

    # Create propagation entries for all networks
    networks = db.query(Network).all()
    for network in networks:
        prop = SenderIdPropagation(
            request_id=sid_req.id,
            network_id=network.id,
            status=PropagationStatusEnum.pending,
            details="Pending propagation"
        )
        db.add(prop)

    log_activity(db, admin.id, "approve_sender_id", "sender_id_request", sid_req.id,
                 {"alias": sid_req.sender_alias, "remarks": remarks},
                 request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": f"Sender ID '{sid_req.sender_alias}' approved and propagation initiated"}


@router.post("/sender-id-requests/{request_uuid}/reject")
async def reject_sender_id_request(
    request_uuid: str,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Reject a sender ID request."""
    body = await request.json()
    remarks = body.get("remarks", "")

    if not remarks:
        raise HTTPException(status_code=400, detail="Rejection remarks are required")

    sid_req = db.query(SenderIdRequest).filter(SenderIdRequest.uuid == request_uuid).first()
    if not sid_req:
        raise HTTPException(status_code=404, detail="Request not found")

    sid_req.status = SenderIdRequestStatusEnum.rejected
    sid_req.remarks = remarks

    log_activity(db, admin.id, "reject_sender_id", "sender_id_request", sid_req.id,
                 {"alias": sid_req.sender_alias, "remarks": remarks},
                 request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": f"Sender ID request '{sid_req.sender_alias}' rejected"}


@router.post("/sender-id-requests/{request_uuid}/set-in-review")
async def set_request_in_review(
    request_uuid: str,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Set a sender ID request to 'in_review'."""
    sid_req = db.query(SenderIdRequest).filter(SenderIdRequest.uuid == request_uuid).first()
    if not sid_req:
        raise HTTPException(status_code=404, detail="Request not found")

    sid_req.status = SenderIdRequestStatusEnum.in_review
    log_activity(db, admin.id, "set_in_review", "sender_id_request", sid_req.id,
                 {"alias": sid_req.sender_alias},
                 request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": "Request marked as in review"}


# ========== PROPAGATION MANAGEMENT ==========

@router.get("/propagations")
async def list_propagations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all propagation entries."""
    query = db.query(SenderIdPropagation, SenderIdRequest, Network).join(
        SenderIdRequest, SenderIdPropagation.request_id == SenderIdRequest.id
    ).join(Network, SenderIdPropagation.network_id == Network.id)

    if status:
        try:
            status_enum = PropagationStatusEnum[status]
            query = query.filter(SenderIdPropagation.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    total = query.count()
    results = query.order_by(desc(SenderIdPropagation.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [{
            "id": p.id, "uuid": str(p.uuid), "status": p.status.value, "details": p.details,
            "created_at": str(p.created_at), "updated_at": str(p.updated_at),
            "request": {"uuid": str(r.uuid), "sender_alias": r.sender_alias, "status": r.status.value},
            "network": {"id": n.id, "name": n.name, "color_code": n.color_code}
        } for p, r, n in results],
        "pagination": {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    }


@router.put("/propagations/{propagation_uuid}")
async def update_propagation(
    propagation_uuid: str,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a propagation status."""
    body = await request.json()
    new_status = body.get("status")
    details = body.get("details", "")

    if new_status not in ["pending", "propagated", "failed"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    prop = db.query(SenderIdPropagation).filter(SenderIdPropagation.uuid == propagation_uuid).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propagation not found")

    prop.status = PropagationStatusEnum[new_status]
    if details:
        prop.details = details

    log_activity(db, admin.id, "update_propagation", "sender_id_propagation", prop.id,
                 {"status": new_status, "details": details},
                 request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": "Propagation updated"}


# ========== SENDER ID MANAGEMENT ==========

@router.get("/sender-ids")
async def list_all_sender_ids(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all sender IDs across all users."""
    query = db.query(SenderId, User).join(User, SenderId.user_id == User.id)
    total = query.count()
    results = query.order_by(desc(SenderId.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [{
            "id": s.id, "uuid": str(s.uuid), "alias": s.alias, "status": s.status.value,
            "created_at": str(s.created_at),
            "user": {"uuid": str(u.uuid), "email": u.email, "username": u.username}
        } for s, u in results],
        "pagination": {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    }


@router.put("/sender-ids/{sender_uuid}/status")
async def update_sender_id_status(
    sender_uuid: str,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Activate/deactivate a sender ID."""
    body = await request.json()
    new_status = body.get("status")

    if new_status not in ["active", "inactive", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    sender = db.query(SenderId).filter(SenderId.uuid == sender_uuid).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender ID not found")

    sender.status = SenderStatusEnum[new_status]
    log_activity(db, admin.id, "update_sender_status", "sender_id", sender.id,
                 {"alias": sender.alias, "status": new_status},
                 request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": f"Sender ID status updated to {new_status}"}


# ========== SUBSCRIPTION & PAYMENT MANAGEMENT ==========

@router.get("/subscriptions")
async def list_subscriptions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all user subscriptions."""
    query = db.query(UserSubscription, User).join(User, UserSubscription.user_id == User.id)
    if status:
        try:
            query = query.filter(UserSubscription.status == SubscriptionStatusEnum[status])
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    total = query.count()
    results = query.order_by(desc(UserSubscription.subscribed_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [{
            "id": sub.id, "uuid": str(sub.uuid), "total_sms": sub.total_sms,
            "used_sms": sub.used_sms, "remaining_sms": sub.remaining_sms,
            "status": sub.status.value, "subscribed_at": str(sub.subscribed_at),
            "user": {"uuid": str(u.uuid), "email": u.email, "username": u.username}
        } for sub, u in results],
        "pagination": {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    }


@router.put("/subscriptions/{sub_uuid}/adjust")
async def adjust_subscription(
    sub_uuid: str,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Manually adjust a user's subscription (add/remove SMS credits, change status)."""
    body = await request.json()
    add_sms = body.get("add_sms", 0)
    new_status = body.get("status")

    sub = db.query(UserSubscription).filter(UserSubscription.uuid == sub_uuid).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if add_sms:
        sub.total_sms += int(add_sms)
    if new_status:
        sub.status = SubscriptionStatusEnum[new_status]

    log_activity(db, admin.id, "adjust_subscription", "user_subscription", sub.id,
                 {"add_sms": add_sms, "new_status": new_status},
                 request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": "Subscription adjusted", "data": {
        "total_sms": sub.total_sms, "used_sms": sub.used_sms,
        "remaining_sms": sub.remaining_sms, "status": sub.status.value
    }}


@router.get("/orders")
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    payment_status: str = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all subscription orders."""
    query = db.query(SubscriptionOrder, User).join(User, SubscriptionOrder.user_id == User.id)
    if payment_status:
        try:
            query = query.filter(SubscriptionOrder.payment_status == PaymentStatusEnum[payment_status])
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {payment_status}")

    total = query.count()
    results = query.order_by(desc(SubscriptionOrder.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [{
            "id": o.id, "uuid": str(o.uuid), "amount": float(o.amount),
            "total_sms": o.total_sms, "payment_status": o.payment_status.value,
            "created_at": str(o.created_at),
            "user": {"uuid": str(u.uuid), "email": u.email, "username": u.username}
        } for o, u in results],
        "pagination": {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    }


@router.put("/orders/{order_uuid}/status")
async def update_order_status(
    order_uuid: str,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update order payment status (e.g., manually confirm a bank payment)."""
    body = await request.json()
    new_status = body.get("status")
    remarks = body.get("remarks", "")

    if new_status not in ["pending", "completed", "failed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    order = db.query(SubscriptionOrder).filter(SubscriptionOrder.uuid == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.payment_status.value
    order.payment_status = PaymentStatusEnum[new_status]

    # If confirming payment, activate subscription
    if new_status == "completed" and old_status != "completed":
        existing_sub = db.query(UserSubscription).filter(
            UserSubscription.user_id == order.user_id,
            UserSubscription.status == SubscriptionStatusEnum.active
        ).first()
        if existing_sub:
            existing_sub.total_sms += order.total_sms
        else:
            new_sub = UserSubscription(
                user_id=order.user_id,
                total_sms=order.total_sms,
                status=SubscriptionStatusEnum.active
            )
            db.add(new_sub)

    # Update order payment records
    order_payment = db.query(OrderPayment).filter(OrderPayment.order_id == order.id).first()
    if order_payment:
        order_payment.status = PaymentStatusEnum[new_status]
        if remarks:
            order_payment.remarks = remarks

    log_activity(db, admin.id, "update_order_status", "subscription_order", order.id,
                 {"old_status": old_status, "new_status": new_status, "remarks": remarks},
                 request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": f"Order status updated to {new_status}"}


# ========== SMS LOGS ==========

@router.get("/sms-logs")
async def list_sms_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user_uuid: str = Query(None),
    sender_alias: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all SMS messages across all users with filters."""
    query = db.query(SentMessage, User).join(User, SentMessage.user_id == User.id)

    if user_uuid:
        user = db.query(User).filter(User.uuid == user_uuid).first()
        if user:
            query = query.filter(SentMessage.user_id == user.id)
    if sender_alias:
        query = query.filter(SentMessage.sender_alias.ilike(f"%{sender_alias}%"))
    if start_date:
        query = query.filter(SentMessage.sent_at >= start_date)
    if end_date:
        query = query.filter(SentMessage.sent_at <= end_date)

    total = query.count()
    results = query.order_by(desc(SentMessage.sent_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [{
            "id": m.id, "uuid": str(m.uuid), "sender_alias": m.sender_alias,
            "phone_number": m.phone_number, "message": m.message,
            "message_id": m.message_id, "number_of_parts": m.number_of_parts,
            "sent_at": str(m.sent_at),
            "user": {"uuid": str(u.uuid), "email": u.email, "username": u.username}
        } for m, u in results],
        "pagination": {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    }


# ========== NETWORK MANAGEMENT ==========

@router.get("/networks")
async def list_networks(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all networks."""
    networks = db.query(Network).all()
    return {
        "success": True,
        "data": [{
            "id": n.id, "uuid": str(n.uuid), "name": n.name,
            "color_code": n.color_code, "created_at": str(n.created_at)
        } for n in networks]
    }


@router.post("/networks")
async def create_network(
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new network."""
    body = await request.json()
    name = body.get("name", "").strip()
    color_code = body.get("color_code", "#000000").strip()

    if not name:
        raise HTTPException(status_code=400, detail="Network name is required")

    network = Network(name=name, color_code=color_code)
    db.add(network)
    db.flush()

    log_activity(db, admin.id, "create_network", "network", network.id,
                 {"name": name}, request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": "Network created", "data": {"uuid": str(network.uuid), "name": name}}


@router.put("/networks/{network_id}")
async def update_network(
    network_id: int,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a network."""
    body = await request.json()
    network = db.query(Network).filter(Network.id == network_id).first()
    if not network:
        raise HTTPException(status_code=404, detail="Network not found")

    if "name" in body:
        network.name = body["name"]
    if "color_code" in body:
        network.color_code = body["color_code"]

    log_activity(db, admin.id, "update_network", "network", network.id,
                 body, request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": "Network updated"}


@router.delete("/networks/{network_id}")
async def delete_network(
    network_id: int,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a network."""
    network = db.query(Network).filter(Network.id == network_id).first()
    if not network:
        raise HTTPException(status_code=404, detail="Network not found")

    log_activity(db, admin.id, "delete_network", "network", network.id,
                 {"name": network.name}, request.client.host if request.client else None)
    db.delete(network)
    db.commit()

    return {"success": True, "message": "Network deleted"}


# ========== PACKAGE MANAGEMENT ==========

@router.get("/packages")
async def list_packages(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all SMS packages."""
    packages = db.query(SmsPackage).order_by(SmsPackage.price_per_sms).all()
    return {
        "success": True,
        "data": [{
            "id": p.id, "uuid": str(p.uuid), "name": p.name,
            "price_per_sms": float(p.price_per_sms),
            "start_sms_count": p.start_sms_count, "best_for": p.best_for
        } for p in packages]
    }


@router.put("/packages/{package_id}")
async def update_package(
    package_id: int,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update an SMS package."""
    body = await request.json()
    pkg = db.query(SmsPackage).filter(SmsPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    if "name" in body:
        pkg.name = body["name"]
    if "price_per_sms" in body:
        pkg.price_per_sms = body["price_per_sms"]
    if "start_sms_count" in body:
        pkg.start_sms_count = body["start_sms_count"]
    if "best_for" in body:
        pkg.best_for = body["best_for"]

    log_activity(db, admin.id, "update_package", "sms_package", pkg.id,
                 body, request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": "Package updated"}


# ========== SYSTEM SETTINGS ==========

@router.get("/settings")
async def list_settings(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all system settings."""
    settings = db.query(SystemSetting).all()
    return {
        "success": True,
        "data": [{
            "id": s.id, "key": s.key, "value": s.value,
            "description": s.description, "updated_at": str(s.updated_at)
        } for s in settings]
    }


@router.put("/settings/{setting_key}")
async def update_setting(
    setting_key: str,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a system setting."""
    if admin.role != AdminRoleEnum.superadmin:
        raise HTTPException(status_code=403, detail="Only superadmins can modify system settings")

    body = await request.json()
    value = body.get("value")

    if value is None:
        raise HTTPException(status_code=400, detail="Value is required")

    setting = db.query(SystemSetting).filter(SystemSetting.key == setting_key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    old_value = setting.value
    setting.value = str(value)
    setting.updated_by = admin.id

    log_activity(db, admin.id, "update_setting", "system_setting", setting.id,
                 {"key": setting_key, "old_value": old_value, "new_value": str(value)},
                 request.client.host if request.client else None)
    db.commit()

    return {"success": True, "message": f"Setting '{setting_key}' updated"}


# ========== ACTIVITY LOGS ==========

@router.get("/activity-logs")
async def list_activity_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    action: str = Query(None),
    admin_id: int = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List admin activity logs."""
    query = db.query(AdminActivityLog, AdminUser).join(
        AdminUser, AdminActivityLog.admin_id == AdminUser.id
    )
    if action:
        query = query.filter(AdminActivityLog.action == action)
    if admin_id:
        query = query.filter(AdminActivityLog.admin_id == admin_id)

    total = query.count()
    results = query.order_by(desc(AdminActivityLog.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [{
            "id": log.id, "uuid": str(log.uuid), "action": log.action,
            "entity_type": log.entity_type, "entity_id": log.entity_id,
            "details": log.details, "ip_address": log.ip_address,
            "created_at": str(log.created_at),
            "admin": {"username": a.username, "email": a.email}
        } for log, a in results],
        "pagination": {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    }
