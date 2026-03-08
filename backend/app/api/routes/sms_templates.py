# backend/app/api/sms_templates.py
"""SMS template routes with Pydantic validation and N+1 query fixes."""

import uuid
from fastapi import APIRouter, Path, Request, Depends
from pydantic import ValidationError
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from api.deps import get_db
from api.user_auth import get_current_user
from models.sms_template import SmsTemplate
from models.template_column import TemplateColumn
from models.user import User
from schemas.templates import AddColumnRequest, CreateTemplateRequest, EditTemplateRequest
from utils.responses import fail, ok
from utils.timezone import now_eat

router = APIRouter()


def _serialize_column(c: TemplateColumn) -> dict:
    return {
        "id": c.id,
        "uuid": str(c.uuid),
        "name": c.name,
        "position": c.position,
        "is_phone_column": c.is_phone_column,
        "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": c.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
    }


def _serialize_template(t: SmsTemplate, columns: list) -> dict:
    is_complete = len(columns) == t.column_count
    return {
        "id": t.id,
        "uuid": str(t.uuid),
        "name": t.name,
        "sample_message": t.sample_message,
        "column_count": t.column_count,
        "created_at": t.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": t.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        "is_complete": is_complete,
        "columns": [_serialize_column(c) for c in columns] if is_complete else [],
    }


@router.post("/create", summary="Create a new SMS template")
async def create_sms_template(
    payload: CreateTemplateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    existing = db.query(SmsTemplate).filter(
        SmsTemplate.user_id == current_user.id,
        func.lower(SmsTemplate.name) == func.lower(payload.name),
    ).first()
    if existing:
        return fail("Template name already exists")

    now = now_eat()
    new_template = SmsTemplate(
        user_id=current_user.id,
        name=payload.name,
        sample_message=payload.sample_message,
        column_count=payload.column_count,
        created_at=now,
        updated_at=now,
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return ok("SMS template created successfully", {
        "id": new_template.id,
        "uuid": str(new_template.uuid),
        "name": new_template.name,
        "sample_message": new_template.sample_message,
        "column_count": new_template.column_count,
        "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": now.strftime("%Y-%m-%d %H:%M:%S"),
    })


@router.put("/edit/{template_uuid}", summary="Edit an existing SMS template")
async def edit_sms_template(
    template_uuid: uuid.UUID,
    payload: EditTemplateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    template = db.query(SmsTemplate).filter(
        SmsTemplate.uuid == template_uuid,
        SmsTemplate.user_id == current_user.id,
    ).first()
    if not template:
        return fail("Template not found or no permission")

    dup = db.query(SmsTemplate).filter(
        SmsTemplate.user_id == current_user.id,
        func.lower(SmsTemplate.name) == func.lower(payload.name),
        SmsTemplate.uuid != template_uuid,
    ).first()
    if dup:
        return fail("Another template with this name exists")

    template.name = payload.name
    template.sample_message = payload.sample_message
    template.column_count = payload.column_count
    template.updated_at = now_eat()
    db.commit()
    db.refresh(template)

    columns = db.query(TemplateColumn).filter(
        TemplateColumn.template_id == template.id
    ).order_by(TemplateColumn.position.asc()).all()

    return ok("Template updated successfully", _serialize_template(template, columns))


@router.get("/")
def list_sms_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Eager load columns to avoid N+1
    templates = (
        db.query(SmsTemplate)
        .options(joinedload(SmsTemplate.columns))
        .filter(SmsTemplate.user_id == current_user.id)
        .order_by(SmsTemplate.created_at.desc())
        .all()
    )

    result = []
    for t in templates:
        sorted_cols = sorted(t.columns, key=lambda c: c.position)
        result.append(_serialize_template(t, sorted_cols))

    return ok(f"Found {len(templates)} SMS template(s)", result)


@router.post("/{template_uuid}/columns/add", summary="Add a column to a template")
async def add_template_column(
    payload: AddColumnRequest,
    template_uuid: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    template = db.query(SmsTemplate).filter(
        SmsTemplate.uuid == template_uuid,
        SmsTemplate.user_id == current_user.id,
    ).first()
    if not template:
        return fail("Template not found or you do not have permission")

    name_exists = db.query(TemplateColumn).filter(
        TemplateColumn.template_id == template.id,
        func.lower(TemplateColumn.name) == func.lower(payload.name),
    ).first()
    if name_exists:
        return fail("Column name already exists in this template")

    position_exists = db.query(TemplateColumn).filter(
        TemplateColumn.template_id == template.id,
        TemplateColumn.position == payload.position,
    ).first()
    if position_exists:
        return fail("Column position already exists in this template")

    if payload.is_phone_column:
        db.query(TemplateColumn).filter(
            TemplateColumn.template_id == template.id,
            TemplateColumn.is_phone_column == True,
        ).update({"is_phone_column": False})

    now = now_eat()
    new_column = TemplateColumn(
        template_id=template.id,
        name=payload.name,
        position=payload.position,
        is_phone_column=payload.is_phone_column,
        created_at=now,
        updated_at=now,
    )
    db.add(new_column)
    db.commit()
    db.refresh(new_column)

    return ok("Column added to template successfully", {
        "id": new_column.id,
        "uuid": str(new_column.uuid),
        "template_uuid": str(template_uuid),
        "name": new_column.name,
        "position": new_column.position,
        "is_phone_column": new_column.is_phone_column,
        "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
    })


@router.get("/{template_uuid}")
def get_sms_template(
    template_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = db.query(SmsTemplate).filter(
        SmsTemplate.uuid == template_uuid,
        SmsTemplate.user_id == current_user.id,
    ).first()
    if not template:
        return fail("Template not found or you do not have permission")

    columns = db.query(TemplateColumn).filter(
        TemplateColumn.template_id == template.id
    ).order_by(TemplateColumn.position.asc()).all()

    return ok("Template details retrieved successfully", {
        "id": template.id,
        "uuid": str(template.uuid),
        "name": template.name,
        "sample_message": template.sample_message,
        "column_count": template.column_count,
        "created_at": template.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": template.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        "columns": [_serialize_column(c) for c in columns],
    })


@router.delete("/{template_uuid}")
def delete_sms_template(
    template_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = db.query(SmsTemplate).filter(
        SmsTemplate.uuid == template_uuid,
        SmsTemplate.user_id == current_user.id,
    ).first()
    if not template:
        return fail("Template not found or no permission")

    db.delete(template)
    db.commit()
    return ok("SMS template deleted successfully", {"uuid": template_uuid})


@router.delete("/columns/{column_uuid}")
def delete_template_column(
    column_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    column = db.query(TemplateColumn).join(SmsTemplate).filter(
        TemplateColumn.uuid == column_uuid,
        SmsTemplate.user_id == current_user.id,
    ).first()
    if not column:
        return fail("Template column not found or no permission")

    db.delete(column)
    db.commit()
    return ok("Template column deleted successfully", {"uuid": column_uuid})
