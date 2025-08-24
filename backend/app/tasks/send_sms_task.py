
# backend/app/tasks/send_sms_task.py
import datetime
import asyncio
from sqlalchemy.orm import Session
from api.deps import SessionLocal
from models.sms_job import SMSJob
from models.sender_id import SenderId
from models.user_subscription import UserSubscription
from models.sent_messages import SentMessage
from services.sms_gateway_service import SmsGatewayService
from models.enums import MessageStatusEnum
from core.config import SMS_CALLBACK_URL
from core.worker_config import redis_conn
from rq import Queue

def _maybe_run_async(fn, *args, **kwargs):
    """Run async functions if coroutine, else normal function."""
    try:
        res = fn(*args, **kwargs)
        if asyncio.iscoroutine(res):
            return asyncio.run(res)
        return res
    except TypeError:
        return asyncio.run(fn(*args, **kwargs))


def send_sms_task(sms_job_id: int):
    """Worker function to send SMS from queued job."""
    db: Session = SessionLocal()
    try:
        # Fetch the job
        job = db.query(SMSJob).filter(SMSJob.id == sms_job_id).first()
        if not job:
            return {"success": False, "error": "SMS job not found"}

        if job.status != MessageStatusEnum.pending.value:
            return {"success": False, "error": f"Job status is {job.status}"}

        # Fetch sender & subscription
        sender = db.query(SenderId).filter(SenderId.id == job.sender_id).first()
        subscription = db.query(UserSubscription).filter(
            UserSubscription.user_id == job.user_id,
            UserSubscription.status == "active"
        ).first()

        if not sender or not subscription or subscription.remaining_sms <= 0:
            job.status = MessageStatusEnum.failed.value
            job.error_message = "Sender missing or insufficient SMS balance"
            job.updated_at = datetime.datetime.utcnow()
            db.add(job)
            db.commit()
            return {"success": False, "error": job.error_message}

        sms_service = SmsGatewayService(sender.alias)

        # Calculate SMS parts
        parts_needed, _, _ = sms_service.get_sms_parts_and_length(job.message)
        if parts_needed > subscription.remaining_sms:
            job.status = MessageStatusEnum.failed.value
            job.error_message = "Insufficient balance at send time"
            job.updated_at = datetime.datetime.utcnow()
            db.add(job)
            db.commit()
            return {"success": False, "error": job.error_message}

        # Build callback
        callback_url = f"{SMS_CALLBACK_URL}?id={job.user_id}" if SMS_CALLBACK_URL else None

        # Send SMS
        try:
            result = _maybe_run_async(
                sms_service.send_sms_with_parts_check,
                job.phone_number,
                job.message,
                callback_url=callback_url
            )
        except AttributeError:
            result = _maybe_run_async(sms_service.send_sms, job.phone_number, job.message)

        now = datetime.datetime.utcnow()
        success = result.get("success", False) if isinstance(result, dict) else False
        gateway_data = result.get("data", {}) if isinstance(result, dict) else {}

        if success:
            job.status = MessageStatusEnum.sent.value
            job.sent_at = now
            job.error_message = None
            db.add(job)

            # Log sent message
            db.add(SentMessage(
                sender_alias=sender.alias,
                user_id=job.user_id,
                phone_number=job.phone_number,
                message=job.message,
                message_id=str(gateway_data.get("message_id")) if gateway_data else None,
                number_of_parts=parts_needed,
                sent_at=now
            ))

            db.commit()
            return {"success": True}

        else:
            # Mark failed, increase retries
            job.status = MessageStatusEnum.failed.value
            job.error_message = gateway_data.get("message") if gateway_data else str(result)
            job.retries = (job.retries or 0) + 1
            job.updated_at = now
            db.add(job)
            db.commit()

            # Requeue if retries left
            if job.retries < (job.max_retries or 3):
                q = Queue("sms_queue", connection=redis_conn)
                q.enqueue(send_sms_task, job.id)

            return {"success": False, "error": job.error_message}

    except Exception as e:
        # Fallback failure marking
        try:
            job.status = MessageStatusEnum.failed.value
            job.error_message = str(e)
            job.updated_at = datetime.datetime.utcnow()
            db.add(job)
            db.commit()
        except Exception:
            pass
        return {"success": False, "error": str(e)}

    finally:
        db.close()
