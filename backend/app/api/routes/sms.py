# backend/app/api/messaging.py
import re
from typing import Optional
import uuid
from fastapi import APIRouter, File, Form, Request, Depends, HTTPException, Header, UploadFile
from sqlalchemy import insert
from sqlalchemy.orm import Session
from datetime import datetime
import pytz
from api.deps import get_db
from api.user_auth import get_current_user_optional
from core.config import SMS_CALLBACK_URL
from models.contact import Contact
from models.contact_group import ContactGroup
from models.models import SmsCallback, SmsTemplate
from models.template_column import TemplateColumn
from utils.helpers import generate_messages, parse_excel_or_csv
from models.sent_messages import SentMessage
from models.enums import MessageStatusEnum, ScheduleStatusEnum
from models.scheduled_message import SmsScheduledMessage
from models.sms_schedule import SmsSchedule
from utils.security import verify_api_token
from utils.validation import validate_phone
from models.user import User
from models.sender_id import SenderId
from models.user_subscription import UserSubscription
from services.sms_gateway_service import SmsGatewayService

PLACEHOLDER_PATTERN = re.compile(r"\{(\w+)\}")

router = APIRouter()

@router.post("/send")
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
@router.post("/quick-send")
async def quick_send_sms(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    try:
        # Validate content type
        content_type = request.headers.get("content-type", "")
        if "application/json" not in content_type.lower():
            raise HTTPException(status_code=415, detail="Invalid content type. Expected application/json")

        data = await request.json()
        sender_id_uuid = data.get("sender_id")
        message = data.get("message")
        recipients_text = data.get("recipients")
        schedule_flag = data.get("schedule", False)
        scheduled_for_str = data.get("scheduled_for")

        # Safe extraction of schedule_name
        raw_schedule_name = data.get("schedule_name", None)
        schedule_name = None
        if schedule_flag:
            if raw_schedule_name is not None:
                schedule_name = str(raw_schedule_name)
                if schedule_name.strip() == "":
                    schedule_name = None


        # Validate required inputs presence
        if not sender_id_uuid:
            raise HTTPException(status_code=400, detail="sender_id is required")
        if not message or not message.strip():
            raise HTTPException(status_code=400, detail="message is required")
        if not recipients_text or not recipients_text.strip():
            raise HTTPException(status_code=400, detail="recipients is required")

        # Parse and validate sender UUID
        try:
            sender_uuid = uuid.UUID(sender_id_uuid)
        except ValueError as e:
            print(f"UUID parsing error: {e}")
            raise HTTPException(status_code=400, detail="sender_id must be a valid UUID")

        # Validate schedule if flagged
        now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
        scheduled_for = None
        if schedule_flag:
            if not scheduled_for_str:
                raise HTTPException(status_code=400, detail="scheduled_for datetime is required when schedule")
            try:
                scheduled_for = datetime.strptime(scheduled_for_str, "%Y-%m-%d %H:%M:%S")
            except ValueError as e:
                print(f"Scheduled datetime parsing error: {e}")
                raise HTTPException(status_code=400, detail="scheduled_for must be in format 'YYYY-MM-DD HH:MM:SS'")

        # Determine user: prefer logged-in user, else API token
        user = current_user
        if user is None:
            if not authorization or not authorization.lower().startswith("bearer "):
                raise HTTPException(status_code=401, detail="Missing authorization. Provide JWT or API token.")
            raw_token = authorization.split(" ", 1)[1].strip()
            user = verify_api_token(db, raw_token)
            if not user:
                raise HTTPException(status_code=401, detail="Invalid or expired API token")

        # Lookup sender by UUID and user_id
        sender = db.query(SenderId).filter(
            SenderId.uuid == sender_uuid,
            SenderId.user_id == user.id
        ).first()
        if not sender:
            raise HTTPException(status_code=404, detail="Sender ID not found or not owned by user")

        # Parse recipients
        raw_recipients = [line.strip() for line in recipients_text.splitlines() if line.strip()]
        valid_recipients = []
        errors = []

        for idx, phone in enumerate(raw_recipients, start=1):
            if not validate_phone(phone):
                errors.append({"recipient": phone, "error": "Invalid phone number format"})
                continue
            valid_recipients.append(phone)

        if not valid_recipients:
            return {
                "success": False,
                "message": "No valid recipients to send SMS",
                "errors": errors,
                "data": None
            }

        # Scheduling path
        if schedule_flag:
            if not schedule_name:
                schedule_name = (message[:50] + "...") if len(message) > 50 else message

            sms_schedule = SmsSchedule(
                user_id=user.id,
                sender_id=sender.id,
                title=schedule_name,
                scheduled_for=scheduled_for,
                status=ScheduleStatusEnum.pending.value,
                created_at=now,
                updated_at=now
            )
            db.add(sms_schedule)
            db.flush()

            for phone in valid_recipients:
                sched_msg = SmsScheduledMessage(
                    schedule_id=sms_schedule.id,
                    phone_number=phone,
                    message=message,
                    status=MessageStatusEnum.pending.value,
                    created_at=now,
                    updated_at=now
                )
                db.add(sched_msg)

            db.commit()

            return {
                "success": True,
                "message": f"Scheduled SMS to {len(valid_recipients)} recipients.",
                "errors": errors,
                "data": {
                    "schedule_uuid": str(sms_schedule.uuid),
                    "scheduled_for": scheduled_for.isoformat(),
                    "total_recipients": len(valid_recipients),
                    "failed_recipients": len(errors)
                }
            }

        # Immediate send path
        subscription = db.query(UserSubscription).filter(
            UserSubscription.user_id == user.id,
            UserSubscription.status == "active"
        ).first()
        if not subscription or subscription.remaining_sms <= 0:
            raise HTTPException(status_code=403, detail="Insufficient SMS balance or no active subscription")

        sms_service = SmsGatewayService(sender.alias)

        sent_count = 0
        total_parts_used = 0
        remaining_sms = subscription.remaining_sms
        sent_messages = []

        callback_url_with_user = f"{SMS_CALLBACK_URL}?id={user.uuid}"

        for phone in valid_recipients:
            try:
                parts_needed, _, _ = sms_service.get_sms_parts_and_length(message)

                if parts_needed > remaining_sms:
                    errors.append({"recipient": phone, "error": "Insufficient SMS balance for message parts"})
                    continue

                now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
                send_result = await sms_service.send_sms_with_parts_check(phone, message, callback_url=callback_url_with_user)

                if not send_result.get("success"):
                    errors.append({"recipient": phone, "error": f"Failed to send SMS: {send_result.get('message', 'Unknown error')}"})
                    continue

                remaining_sms -= parts_needed
                subscription.used_sms += parts_needed
                total_parts_used += parts_needed
                sent_count += 1

                gateway_data = send_result.get("data", {}) or {}
                message_id = gateway_data.get("message_id")

                sent_messages.append({
                    "recipient": phone,
                    "sms_gateway_response": gateway_data
                })

                db.add(SentMessage(
                    sender_alias=sender.alias,
                    user_id=user.id,
                    phone_number=phone,
                    number_of_parts=parts_needed,
                    message=message,
                    message_id=str(message_id) if message_id else None,
                    sent_at=now
                ))

            except Exception as e:
                print(f"Exception sending SMS to {phone}: {e}")
                errors.append({"recipient": phone, "error": str(e)})

        db.add(subscription)
        db.commit()

        return {
            "success": sent_count > 0,
            "message": f"Sent SMS to {sent_count} recipients. {len(errors)} errors.",
            "errors": errors,
            "data": {
                "total_sent": sent_count,
                "total_parts_used": total_parts_used,
                "remaining_sms": remaining_sms,
                "sent_messages": sent_messages
            }
        }

    except Exception as e:
        # Catch any unexpected exception and print it
        import traceback
        print(f"Unexpected exception: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/quick-send/group")
async def quick_send_group_sms(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    # Validate content type
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type.lower():
        raise HTTPException(status_code=415, detail="Invalid content type. Expected application/json")

    data = await request.json()
    sender_id_uuid = data.get("sender_id")
    message_template = data.get("message")
    group_uuid_str = data.get("group_uuid")
    schedule_flag = data.get("schedule", False)
    scheduled_for_str = data.get("scheduled_for")
    schedule_name = data.get("schedule_name", "").strip() if schedule_flag else None

    if not sender_id_uuid:
        raise HTTPException(status_code=400, detail="sender_id is required")
    if not message_template or not message_template.strip():
        raise HTTPException(status_code=400, detail="message is required")
    if not group_uuid_str:
        raise HTTPException(status_code=400, detail="group_uuid is required")

    try:
        sender_uuid = uuid.UUID(sender_id_uuid)
    except ValueError:
        raise HTTPException(status_code=400, detail="sender_id must be a valid UUID")

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
    scheduled_for = None
    if schedule_flag:
        if not scheduled_for_str:
            raise HTTPException(status_code=400, detail="scheduled_for datetime is required when schedule")
        try:
            scheduled_for = datetime.strptime(scheduled_for_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise HTTPException(status_code=400, detail="scheduled_for must be in format 'YYYY-MM-DD HH:MM:SS'")

    # Determine user (JWT or API token)
    user = current_user
    if user is None:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Missing authorization. Provide JWT or API token.")
        raw_token = authorization.split(" ", 1)[1].strip()
        user = verify_api_token(db, raw_token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired API token")

    # Verify sender
    sender = db.query(SenderId).filter(
        SenderId.uuid == sender_uuid,
        SenderId.user_id == user.id
    ).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender ID not found or not owned by user")

    # Fetch contacts
    contacts_query = db.query(Contact).filter(Contact.user_id == user.id, Contact.is_blacklisted == False)
    if group_uuid_str == "all":
        contacts = contacts_query.all()
    elif group_uuid_str == "none":
        contacts = contacts_query.filter(Contact.group_id == None).all()  
    else:
        try:
            group_uuid = uuid.UUID(group_uuid_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="group_uuid must be a valid UUID or 'all'")
        group = db.query(ContactGroup).filter(ContactGroup.uuid == group_uuid, ContactGroup.user_id == user.id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Contact group not found")
        contacts = contacts_query.filter(Contact.group_id == group.id).all()

    if not contacts:
        return {"success": False, "message": "No contacts found in this group", "errors": [], "data": None}

    errors = []
    personalized_messages = []

    for contact in contacts:
        if not validate_phone(contact.phone):
            errors.append({"recipient": contact.phone, "error": "Invalid phone number format"})
            continue

        # Replace placeholders
        personalized_msg = message_template
        placeholders = PLACEHOLDER_PATTERN.findall(message_template)
        for ph in placeholders:
            value = getattr(contact, ph, None)
            personalized_msg = personalized_msg.replace(f"{{{ph}}}", value if value else "")

        personalized_messages.append((contact.phone, personalized_msg))

    if not personalized_messages:
        return {"success": False, "message": "No valid contacts with usable phone numbers", "errors": errors, "data": None}

    # Handle scheduled send
    if schedule_flag:
        if not schedule_name:
            schedule_name = (message_template[:50] + "...") if len(message_template) > 50 else message_template

        sms_schedule = SmsSchedule(
            user_id=user.id,
            sender_id=sender.id,
            title=schedule_name,
            scheduled_for=scheduled_for,
            status=ScheduleStatusEnum.pending.value,
            created_at=now,
            updated_at=now
        )
        db.add(sms_schedule)
        db.flush()

        for phone, msg in personalized_messages:
            sched_msg = SmsScheduledMessage(
                schedule_id=sms_schedule.id,
                phone_number=phone,
                message=msg,
                status=MessageStatusEnum.pending.value,
                created_at=now,
                updated_at=now
            )
            db.add(sched_msg)

        db.commit()
        return {
            "success": True,
            "message": f"Scheduled SMS to {len(personalized_messages)} recipients.",
            "errors": errors,
            "data": {
                "schedule_uuid": str(sms_schedule.uuid),
                "scheduled_for": scheduled_for.isoformat(),
                "total_recipients": len(personalized_messages),
                "failed_recipients": len(errors)
            }
        }

    # Immediate send
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == user.id,
        UserSubscription.status == "active"
    ).first()
    if not subscription or subscription.remaining_sms <= 0:
        raise HTTPException(status_code=403, detail="Insufficient SMS balance or no active subscription")

    sms_service = SmsGatewayService(sender.alias)
    sent_count = 0
    total_parts_used = 0
    remaining_sms = subscription.remaining_sms
    sent_messages = []
    # Build callback URL with user UUID
    callback_url_with_user = f"{SMS_CALLBACK_URL}?id={user.uuid}"
    for phone, msg in personalized_messages:
        parts_needed, _, _ = sms_service.get_sms_parts_and_length(msg)
        if parts_needed > remaining_sms:
            errors.append({"recipient": phone, "error": "Insufficient SMS balance for message parts"})
            continue

        now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
        send_result = await sms_service.send_sms_with_parts_check(phone, msg, callback_url=callback_url_with_user)
        if not send_result.get("success"):
            errors.append({"recipient": phone, "error": f"Failed to send SMS: {send_result.get('message', 'Unknown error')}"})
            continue

        remaining_sms -= parts_needed
        subscription.used_sms += parts_needed
        total_parts_used += parts_needed
        sent_count += 1

        gateway_data = send_result.get("data", {}) or {}
        message_id = gateway_data.get("message_id")

        sent_messages.append({
            "recipient": phone,
            "sms_gateway_response": gateway_data
        })

        db.add(SentMessage(
            sender_alias=sender.alias,
            user_id=user.id,
            phone_number=phone,
            number_of_parts=parts_needed,
            message=msg,
            message_id=str(message_id) if message_id else None,
            sent_at=now
        ))

    db.add(subscription)
    db.commit()

    return {
        "success": sent_count > 0,
        "message": f"Sent SMS to {sent_count} recipients. {len(errors)} errors.",
        "errors": errors,
        "data": {
            "total_sent": sent_count,
            "total_parts_used": total_parts_used,
            "remaining_sms": remaining_sms,
            "sent_messages": sent_messages
        }
    }

@router.post("/send-from-file")
async def quick_send_sms(
    sender_id: str = Form(...),
    message_template: str = Form(...),
    template_uuid: str = Form(...),
    update_template: bool = Form(False),
    schedule: bool = Form(False),
    scheduled_for: Optional[str] = Form(None),
    schedule_name: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_current_user_optional),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    # Determine user: prefer logged-in user, else API token
    user = current_user
    if user is None:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Missing authorization. Provide JWT or API token.")
        raw_token = authorization.split(" ", 1)[1].strip()
        user = verify_api_token(db, raw_token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired API token")

    # Validate sender UUID and ownership
    try:
        sender_uuid = uuid.UUID(sender_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid sender_id UUID")

    sender = db.query(SenderId).filter(
        SenderId.uuid == sender_uuid,
        SenderId.user_id == user.id
    ).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender ID not found or unauthorized")

    # Validate template UUID and ownership
    try:
        tmpl_uuid = uuid.UUID(template_uuid)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid template_uuid")

    template = db.query(SmsTemplate).filter(
        SmsTemplate.uuid == tmpl_uuid,
        SmsTemplate.user_id == user.id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found or unauthorized")

    # Update template sample message if flagged
    if update_template:
        template.sample_message = message_template
        template.updated_at = datetime.utcnow()
        db.add(template)
        db.commit()

    # Get template columns
    columns = db.query(TemplateColumn).filter(
        TemplateColumn.template_id == template.id
    ).all()
    if not columns:
        raise HTTPException(status_code=400, detail="Template has no columns defined")

    # Parse uploaded file rows
    try:
        rows = parse_excel_or_csv(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse uploaded file: {str(e)}")

    if not rows:
        raise HTTPException(status_code=400, detail="Uploaded file contains no data rows")

    # Generate personalized messages and phones
    messages = generate_messages(message_template, columns, rows)

    # Validate phone numbers
    valid_messages = []
    errors = []
    for idx, (msg, phone) in enumerate(messages, start=1):
        if not phone or not validate_phone(phone):
            errors.append({"row": idx, "phone": phone, "error": "Invalid or missing phone number"})
            continue
        valid_messages.append((msg, phone))

    if not valid_messages:
        return {
            "success": False,
            "message": "No valid recipients found after validation",
            "errors": errors,
            "data": None
        }

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    if schedule:
        # Validate scheduled_for datetime
        if not scheduled_for:
            raise HTTPException(status_code=400, detail="scheduled_for is required when schedule is True")
        try:
            scheduled_dt = datetime.strptime(scheduled_for, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise HTTPException(status_code=400, detail="scheduled_for must be 'YYYY-MM-DD HH:MM:SS' format")

        # Trim schedule_name if provided, else fallback
        if schedule_name:
            schedule_name = schedule_name.strip()
        if not schedule_name:
            schedule_name = (message_template[:50] + "...") if len(message_template) > 50 else message_template

        sms_schedule = SmsSchedule(
            user_id=user.id,  # always use 'user.id' now
            sender_id=sender.id,
            title=schedule_name,
            scheduled_for=scheduled_dt,
            status=ScheduleStatusEnum.pending.value,
            created_at=now,
            updated_at=now
        )
        db.add(sms_schedule)
        db.flush()  

        for msg, phone in valid_messages:
            sched_msg = SmsScheduledMessage(
                schedule_id=sms_schedule.id,
                phone_number=phone,
                message=msg,
                status=MessageStatusEnum.pending.value,
                created_at=now,
                updated_at=now
            )
            db.add(sched_msg)

        db.commit()

        return {
            "success": True,
            "message": f"Scheduled {len(valid_messages)} personalized SMS messages.",
            "errors": errors,
            "data": {
                "schedule_uuid": str(sms_schedule.uuid),
                "scheduled_for": scheduled_dt.isoformat(),
                "total_recipients": len(valid_messages),
                "failed_recipients": len(errors)
            }
        }

    # Immediate send path remains unchanged
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == user.id,
        UserSubscription.status == "active"
    ).first()
    if not subscription or subscription.remaining_sms <= 0:
        raise HTTPException(status_code=403, detail="No active subscription or insufficient SMS balance")

    sms_service = SmsGatewayService(sender.alias)
    sent_count = 0
    total_parts_used = 0
    remaining_sms = subscription.remaining_sms
    sent_messages = []
    callback_url_with_user = f"{SMS_CALLBACK_URL}?id={user.uuid}"
    for msg, phone in valid_messages:
        parts_needed, _, _ = sms_service.get_sms_parts_and_length(msg)

        if parts_needed > remaining_sms:
            errors.append({"recipient": phone, "error": "Insufficient SMS balance for message parts"})
            continue

        send_result = await sms_service.send_sms_with_parts_check(phone, msg, callback_url=callback_url_with_user)
        if not send_result.get("success"):
            errors.append({"recipient": phone, "error": f"Failed to send SMS: {send_result.get('message', 'Unknown error')}"})
            continue

        remaining_sms -= parts_needed
        subscription.used_sms += parts_needed
        total_parts_used += parts_needed
        sent_count += 1

        gateway_data = send_result.get("data", {}) or {}
        message_id = gateway_data.get("message_id")

        sent_messages.append({
            "recipient": phone,
            "sms_gateway_response": gateway_data
        })

        db.add(SentMessage(
            sender_alias=sender.alias,
            user_id=user.id,
            phone_number=phone,
            number_of_parts=parts_needed,
            message=msg,
            message_id=str(message_id) if message_id else None,
            sent_at=now
        ))

    db.add(subscription)
    db.commit()

    return {
        "success": sent_count > 0,
        "message": f"Sent {sent_count} SMS messages. {len(errors)} errors.",
        "errors": errors,
        "data": {
            "total_sent": sent_count,
            "total_parts_used": total_parts_used,
            "remaining_sms": remaining_sms,
            "sent_messages": sent_messages
        }
    }


@router.post("/webhook")
async def sms_callback(request: Request, db: Session = Depends(get_db)):
    try:
        # get all query params
        user_uuid = request.query_params.get("id")
        data = await request.json()

        message_id = data.get("message_id")
        phone = data.get("PhoneNumber") or data.get("phone")
        status = data.get("DLRStatus")
        uid = data.get("uid")
        remarks = data.get("Remarks")
        sender_alias = data.get("SenderId")
        full_payload = data

        if not message_id or not phone:
            return {"success": False, "message": "message_id and phone are required", "data": None}

        # Lookup user by UUID
        user_id = None
        if user_uuid:
            user = db.query(User).filter(User.uuid == user_uuid).first()
            if user:
                user_id = user.id

        eat = pytz.timezone("Africa/Nairobi")
        received_at = datetime.now(eat).replace(tzinfo=None)

        stmt = insert(SmsCallback).values(
            message_id=message_id,
            phone=phone,
            status=status,
            uid=uid,
            remarks=remarks,
            sender_alias=sender_alias,
            payload=full_payload,
            user_id=user_id,
            received_at=received_at
        )

        if uid:
            stmt = stmt.on_conflict_do_update(
                index_elements=['uid'],
                set_={
                    'status': stmt.excluded.status,
                    'remarks': stmt.excluded.remarks,
                    'sender_alias': stmt.excluded.sender_alias,
                    'phone': stmt.excluded.phone,
                    'payload': stmt.excluded.payload,
                    'user_id': stmt.excluded.user_id,
                    'received_at': stmt.excluded.received_at
                }
            )

        db.execute(stmt)
        db.commit()

        return {"success": True, "message": "Callback received", "data": data}

    except Exception as e:
        print("Error processing SMS callback:", e)
        return {"success": False, "message": "Internal server error", "data": None}

@router.get("/history")
def get_message_history(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Fetch all SMS history for the logged-in user.
    Uses normal SQL join by message_id (no relationships, no Enum conversion).
    """
    try:
        # Query messages and join callbacks by message_id
        results = (
            db.query(
                SentMessage.id.label("sent_id"),
                SentMessage.uuid.label("sent_uuid"),
                SentMessage.sender_alias,
                SentMessage.phone_number,
                SentMessage.message,
                SentMessage.number_of_parts,
                SentMessage.message_id,
                SentMessage.sent_at,
                SmsCallback.status.label("delivery_status"),  # fetch as string
                SmsCallback.received_at.label("delivered_at"),
                SmsCallback.remarks.label("delivery_remarks"),
            )
            .outerjoin(SmsCallback, SentMessage.message_id == SmsCallback.message_id)
            .filter(SentMessage.user_id == current_user.id)
            .order_by(SentMessage.sent_at.desc())
            .all()
        )

        history = []
        for row in results:
            history.append({
                "sent_id": row.sent_id,
                "uuid": str(row.sent_uuid),
                "sender_alias": row.sender_alias,
                "phone_number": row.phone_number,
                "message": row.message,
                "num_parts": row.number_of_parts,
                "message_id": row.message_id,
                "sent_at": row.sent_at.isoformat() if row.sent_at else None,
                "delivery_status": row.delivery_status,  # string
                "delivered_at": row.delivered_at.isoformat() if row.delivered_at else None,
                "remarks": row.delivery_remarks,
            })

        return {
            "success": True,
            "count": len(history),
            "data": history,
        }

    except Exception as e:
        print("Error fetching message history:", str(e))
        return {
            "success": False,
            "message": f"Internal Server Error: {str(e)}",
            "data": None
        }