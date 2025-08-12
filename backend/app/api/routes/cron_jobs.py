from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import pytz
from api.deps import get_db
from models.sent_messages import SentMessage
from services.sms_gateway_service import SmsGatewayService
from utils.validation import validate_phone
from models.sms_schedule import SmsSchedule
from models.scheduled_message import SmsScheduledMessage
from models.user_subscription import UserSubscription
from models.sender_id import SenderId
from models.enums import ScheduleStatusEnum, MessageStatusEnum

router = APIRouter()

@router.post("/send-scheduled-messages")
async def run_scheduled_sends(db: Session = Depends(get_db)):
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
        # Load pending or failed scheduled messages for this schedule
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
                send_result = await sms_service.send_sms_with_parts_check(sm.phone_number, sm.message)
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
