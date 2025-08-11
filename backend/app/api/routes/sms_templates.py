# backend/app/api/sms_templates.py
from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import pytz
from models.template_column import TemplateColumn
from models.sms_template import SmsTemplate
from models.user import User
from api.deps import get_db
from api.user_auth import get_current_user

router = APIRouter()

@router.post("/create-sms-template")
async def create_sms_template(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    name = data.get("name", "").strip()
    sample_message = data.get("sample_message", "").strip()
    column_count = data.get("column_count")

    # Validate required fields
    if not name:
        return {"success": False, "message": "Template name is required", "data": None}
    if not sample_message:
        return {"success": False, "message": "Sample message is required", "data": None}
    if not column_count or not isinstance(column_count, int):
        return {"success": False, "message": "Column count is required and must be an integer", "data": None}

    # Check for duplicate name per user (case-insensitive)
    existing_template = db.query(SmsTemplate).filter(
        SmsTemplate.user_id == current_user.id,
        func.lower(SmsTemplate.name) == func.lower(name)
    ).first()

    if existing_template:
        return {"success": False, "message": "Template name already exists", "data": None}

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    new_template = SmsTemplate(
        user_id=current_user.id,
        name=name,
        sample_message=sample_message,
        column_count=column_count,
        created_at=now,
        updated_at=now
    )

    try:
        db.add(new_template)
        db.commit()
        db.refresh(new_template)
    except Exception as e:
        print(f"DB error on SMS template creation: {e}")
        return {"success": False, "message": "Database error", "data": None}

    return {
        "success": True,
        "message": "SMS template created successfully",
        "data": {
            "id": new_template.id,
            "uuid": str(new_template.uuid),
            "name": new_template.name,
            "sample_message": new_template.sample_message,
            "column_count": new_template.column_count,
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.get("/sms-templates")
def list_sms_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    templates = db.query(SmsTemplate).filter(
        SmsTemplate.user_id == current_user.id
    ).order_by(SmsTemplate.created_at.desc()).all()

    return {
        "success": True,
        "message": f"Found {len(templates)} SMS template(s)",
        "data": [
            {
                "id": t.id,
                "uuid": str(t.uuid),
                "name": t.name,
                "sample_message": t.sample_message,
                "column_count": t.column_count,
                "created_at": t.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": t.updated_at.strftime("%Y-%m-%d %H:%M:%S")
            }
            for t in templates
        ]
    }

@router.post("/add-template-column")
async def add_template_column(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    template_uuid = data.get("template_uuid", "").strip()
    column_name = data.get("name", "").strip()
    column_position = data.get("position")
    is_phone_column = data.get("is_phone_column", False)

    # Validate required fields
    if not template_uuid:
        return {"success": False, "message": "Template UUID is required", "data": None}
    if not column_name:
        return {"success": False, "message": "Column name is required", "data": None}
    if column_position is None or not isinstance(column_position, int):
        return {"success": False, "message": "Column position is required and must be an integer", "data": None}

    # Ensure template exists and belongs to the user
    template = db.query(SmsTemplate).filter(
        SmsTemplate.uuid == template_uuid,
        SmsTemplate.user_id == current_user.id
    ).first()

    if not template:
        return {"success": False, "message": "Template not found or you do not have permission", "data": None}

    # Ensure unique column name within this template (case-insensitive)
    name_exists = db.query(TemplateColumn).filter(
        TemplateColumn.template_id == template.id,
        func.lower(TemplateColumn.name) == func.lower(column_name)
    ).first()
    if name_exists:
        return {"success": False, "message": "Column name already exists in this template", "data": None}

    # Ensure unique column position within this template
    position_exists = db.query(TemplateColumn).filter(
        TemplateColumn.template_id == template.id,
        TemplateColumn.position == column_position
    ).first()
    if position_exists:
        return {"success": False, "message": "Column position already exists in this template", "data": None}

    # If this is the phone column, revoke any existing phone column for this template
    if is_phone_column:
        db.query(TemplateColumn).filter(
            TemplateColumn.template_id == template.id,
            TemplateColumn.is_phone_column == True
        ).update({"is_phone_column": False})

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    new_column = TemplateColumn(
        template_id=template.id,
        name=column_name,
        position=column_position,
        is_phone_column=is_phone_column,
        created_at=now,
        updated_at=now
    )

    try:
        db.add(new_column)
        db.commit()
        db.refresh(new_column)
    except Exception as e:
        print(f"DB error on template column creation: {e}")
        return {"success": False, "message": "Database error", "data": None}

    return {
        "success": True,
        "message": "Column added to template successfully",
        "data": {
            "id": new_column.id,
            "uuid": str(new_column.uuid),
            "template_uuid": template_uuid,
            "name": new_column.name,
            "position": new_column.position,
            "is_phone_column": new_column.is_phone_column,
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.get("/sms-template/{template_uuid}")
def get_sms_template(
    template_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch template with matching UUID and belonging to current user
    template = db.query(SmsTemplate).filter(
        SmsTemplate.uuid == template_uuid,
        SmsTemplate.user_id == current_user.id
    ).first()

    if not template:
        return {
            "success": False,
            "message": "Template not found or you do not have permission",
            "data": None
        }

    # Fetch template columns
    columns = db.query(TemplateColumn).filter(
        TemplateColumn.template_id == template.id
    ).order_by(TemplateColumn.position.asc()).all()

    return {
        "success": True,
        "message": "Template details retrieved successfully",
        "data": {
            "id": template.id,
            "uuid": str(template.uuid),
            "name": template.name,
            "sample_message": template.sample_message,
            "column_count": template.column_count,
            "created_at": template.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": template.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            "columns": [
                {
                    "id": c.id,
                    "uuid": str(c.uuid),
                    "name": c.name,
                    "position": c.position,
                    "is_phone_column": c.is_phone_column,
                    "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": c.updated_at.strftime("%Y-%m-%d %H:%M:%S")
                }
                for c in columns
            ]
        }
    }
