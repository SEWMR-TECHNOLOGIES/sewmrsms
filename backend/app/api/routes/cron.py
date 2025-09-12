from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
import pytz
from api.deps import get_db
from models.user_outage_notification import UserOutageNotification
from models.user import User
from core.config import CRON_AUTH_TOKEN, SMS_CALLBACK_URL
from models.sent_messages import SentMessage
from services.sms_gateway_service import SmsGatewayService
from utils.validation import validate_phone
from models.sms_schedule import SmsSchedule
from models.scheduled_message import SmsScheduledMessage
from models.user_subscription import UserSubscription
from models.sender_id import SenderId
from models.enums import ScheduleStatusEnum, MessageStatusEnum

router = APIRouter()

@router.post("/scheduled-messages/send")
async def run_scheduled_sends(
    db: Session = Depends(get_db),
    x_cron_auth: str = Header(None)
):
    if not CRON_AUTH_TOKEN or x_cron_auth != CRON_AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    """
    Cron endpoint (no auth) to process pending schedules whose scheduled_for <= now (EAT).
    Returns a short summary.
    """
    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    processed_schedules = 0
    total_sent = 0
    total_failed = 0
    errors = []

    # Fetch pending schedules that are due (scheduled_for <= now)
    schedules = db.query(SmsSchedule).filter(
        SmsSchedule.status.in_([
            ScheduleStatusEnum.pending.value,
            ScheduleStatusEnum.partial.value,
            ScheduleStatusEnum.failed.value
        ]),
        SmsSchedule.scheduled_for <= now
    ).all()

    for sched in schedules:
        processed_schedules += 1

        # Load pending or failed scheduled messages
        pending_msgs = db.query(SmsScheduledMessage).filter(
            SmsScheduledMessage.schedule_id == sched.id,
            SmsScheduledMessage.status.in_([
                MessageStatusEnum.pending.value,
                MessageStatusEnum.failed.value
            ])
        ).all()

        # Load sender alias and user subscription
        sender = db.query(SenderId).filter(SenderId.id == sched.sender_id).first()
        subscription = db.query(UserSubscription).filter(
            UserSubscription.user_id == sched.user_id,
            UserSubscription.status == "active"
        ).first()

        sms_service = SmsGatewayService(sender.alias) if sender else None

        # Get user UUID from User table
        user = db.query(User).filter(User.id == sched.user_id).first()
        user_uuid = str(user.uuid) if user else None

        # Build callback URL with user UUID
        callback_url_with_user = f"{SMS_CALLBACK_URL}?id={user_uuid}"

        schedule_sent_count = 0
        schedule_failed_count = 0

        for sm in pending_msgs:
            try:
                # refetch subscription freshness (optional)
                if not subscription or subscription.remaining_sms <= 0:
                    # mark failed due to insufficient balance
                    sm.status = MessageStatusEnum.failed.value
                    sm.remarks = "Insufficient SMS balance or no active subscription"
                    sm.updated_at = now
                    db.add(sm)
                    schedule_failed_count += 1
                    total_failed += 1
                    continue

                # Validate phone quickly (optional)
                if not validate_phone(sm.phone_number):
                    sm.status = MessageStatusEnum.failed.value
                    sm.remarks = "Invalid phone number format"
                    sm.updated_at = now
                    db.add(sm)
                    schedule_failed_count += 1
                    total_failed += 1
                    continue

                # compute parts
                parts_needed, _, _ = sms_service.get_sms_parts_and_length(sm.message)

                if parts_needed > subscription.remaining_sms:
                    sm.status = MessageStatusEnum.failed.value
                    sm.remarks = "Insufficient SMS balance for message parts"
                    sm.updated_at = now
                    db.add(sm)
                    schedule_failed_count += 1
                    total_failed += 1
                    continue

                # send
                send_result = await sms_service.send_sms_with_parts_check(sm.phone_number, sm.message, callback_url=callback_url_with_user)
                success = send_result.get("success", False)
                gateway_data = send_result.get("data", {}) or {}

                if not success:
                    sm.status = MessageStatusEnum.failed.value
                    sm.remarks = f"Gateway error: {gateway_data.get('message', 'Unknown')}" if isinstance(gateway_data, dict) else "Gateway error"
                    sm.updated_at = now
                    db.add(sm)
                    schedule_failed_count += 1
                    total_failed += 1
                    continue

                # mark sent
                sm.status = MessageStatusEnum.sent.value
                sm.sent_at = now
                sm.updated_at = now
                sm.remarks = None
                db.add(sm)

                # record gateway response in SentMessage table
                message_id = gateway_data.get("message_id") if isinstance(gateway_data, dict) else None
                db.add(SentMessage(
                    sender_alias=sender.alias if sender else None,
                    user_id=sched.user_id,
                    phone_number=sm.phone_number,
                    number_of_parts=parts_needed,
                    message=sm.message,
                    message_id=str(message_id) if message_id else None,
                    sent_at=now
                ))

                # update subscription counts
                subscription.used_sms = (subscription.used_sms or 0) + parts_needed
                db.add(subscription)

                schedule_sent_count += 1
                total_sent += 1

            except Exception as e:
                sm.status = MessageStatusEnum.failed.value
                sm.remarks = f"Unexpected error: {str(e)}"
                sm.updated_at = now
                db.add(sm)
                schedule_failed_count += 1
                total_failed += 1
                errors.append({"schedule_id": sched.id, "message_id": sm.id, "error": str(e)})

        # After processing pending_msgs (and adding sm updates to session),
        # flush pending changes so subsequent counts are accurate.
        db.flush()

        # Aggregate counts for this schedule (rely only on DB values)
        total_count = db.query(SmsScheduledMessage).filter(
            SmsScheduledMessage.schedule_id == sched.id
        ).count()

        sent_count_db = db.query(SmsScheduledMessage).filter(
            SmsScheduledMessage.schedule_id == sched.id,
            SmsScheduledMessage.status == MessageStatusEnum.sent.value
        ).count()

        failed_count_db = db.query(SmsScheduledMessage).filter(
            SmsScheduledMessage.schedule_id == sched.id,
            SmsScheduledMessage.status == MessageStatusEnum.failed.value
        ).count()

        pending_count_db = db.query(SmsScheduledMessage).filter(
            SmsScheduledMessage.schedule_id == sched.id,
            SmsScheduledMessage.status == MessageStatusEnum.pending.value
        ).count()

        # Decide schedule status using clear rules
        if pending_count_db == 0:
            if sent_count_db == total_count:
                sched.status = ScheduleStatusEnum.sent.value
            elif failed_count_db == total_count:
                sched.status = ScheduleStatusEnum.failed.value
            else:
                # some sent, some failed
                sched.status = ScheduleStatusEnum.partial.value
        else:
            # There are still pending messages
            if sent_count_db > 0 or failed_count_db > 0:
                # some progress was made
                sched.status = ScheduleStatusEnum.partial.value
            else:
                sched.status = ScheduleStatusEnum.pending.value

        sched.updated_at = now
        db.add(sched)
        db.commit()

    return {
        "success": True,
        "message": "Scheduled send process completed.",
        "data": {
            "now": now_str,
            "processed_schedules": processed_schedules,
            "total_sent": total_sent,
            "total_failed": total_failed,
            "errors": errors
        }
    }

@router.post("/send-outage-notifications")
async def send_outage_notifications(
    db: Session = Depends(get_db),
    x_cron_auth: str = Header(None)
):
    if not CRON_AUTH_TOKEN or x_cron_auth != CRON_AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    # Fetch all users with outage notification preferences
    notifications = db.query(UserOutageNotification).all()
    total_sent = 0
    total_failed = 0
    errors = []

    for notif in notifications:
        try:
            user = db.query(User).filter(User.id == notif.user_id).first()
            if not user:
                continue

            # Skip if notified within the last 24 hours
            if notif.last_notified_at and (now - notif.last_notified_at).total_seconds() < 86400:
                continue

            # Get active subscription with remaining SMS
            subscription = db.query(UserSubscription).filter(
                UserSubscription.user_id == user.id,
                UserSubscription.status == "active",
                UserSubscription.remaining_sms > 0
            ).first()

            if not subscription:
                total_failed += 1
                continue

            # Use any active sender ID
            sender = db.query(SenderId).filter(
                SenderId.user_id == user.id,
                SenderId.status == "active"
            ).first()
            if not sender:
                total_failed += 1
                continue

            # Notify only if balance just went under their threshold
            if subscription.remaining_sms > notif.notify_before_messages:
                # Still has enough SMS, skip
                continue

            if notif.last_notified_at is None and subscription.remaining_sms <= notif.notify_before_messages:
                # First time crossing the threshold → allow sending
                pass
            elif notif.last_notified_at and subscription.remaining_sms <= notif.notify_before_messages:
                # Already notified before while still under threshold → skip
                continue
            
            # Prepare to send SMS
            sms_service = SmsGatewayService(sender.alias)

            phone_to_send = notif.phone.strip() or user.phone
            if not validate_phone(phone_to_send):
                total_failed += 1
                continue

            # Build preliminary message in Swahili
            temp_message = f"Habari {user.first_name}, meseji zako zinakaribia kuisha. Salio lako ni {subscription.remaining_sms}. Tafadhali nunua meseji za ziada kuepuka kukosekana kwa huduma."

            # Compute SMS parts
            parts_needed, _, _ = sms_service.get_sms_parts_and_length(temp_message)
            if parts_needed > subscription.remaining_sms:
                total_failed += 1
                continue

            # Compute new remaining SMS after this notification
            remaining_after_send = subscription.remaining_sms - parts_needed

            # Build final message including updated balance
            message = (
                f"Habari {user.first_name}, meseji zako zinakaribia kuisha. "
                f"Salio lako jipya ni {remaining_after_send}. "
                "Tafadhali nunua meseji za ziada kuepuka kukosekana kwa huduma."
            )

            # Send SMS
            send_result = await sms_service.send_sms_with_parts_check(phone_to_send, message)
            success = send_result.get("success", False)
            gateway_data = send_result.get("data", {}) or {}

            if success:
                # Record sent message
                db.add(SentMessage(
                    sender_alias=sender.alias,
                    user_id=user.id,
                    phone_number=phone_to_send,
                    number_of_parts=parts_needed,
                    message=message,
                    message_id=str(gateway_data.get("message_id")) if gateway_data.get("message_id") else None,
                    sent_at=now
                ))

                # Deduct SMS from subscription
                subscription.used_sms = (subscription.used_sms or 0) + parts_needed
                db.add(subscription)

                # Update last_notified_at
                notif.last_notified_at = now

                # Increment notification_count
                notif.notification_count = (notif.notification_count or 0) + 1
                
                db.add(notif)

                total_sent += 1
            else:
                total_failed += 1

        except Exception as e:
            errors.append({"user_id": notif.user_id, "error": str(e)})
            total_failed += 1

    db.commit()

    return {
        "success": True,
        "message": "Outage notification cron completed",
        "data": {
            "total_sent": total_sent,
            "total_failed": total_failed,
            "errors": errors
        }
    }

