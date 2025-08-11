# backend/app/api/contact_groups.py
from fastapi import APIRouter, Request, Depends, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_
from typing import List, Optional
from datetime import datetime
import pytz
from utils.helpers import normalize_str, parse_contacts_csv, parse_contacts_textarea
from utils.validation import validate_email, validate_phone
from models.contact_group import ContactGroup
from models.contact import Contact
from models.user import User
from api.deps import get_db
from api.user_auth import get_current_user

router = APIRouter()

@router.post("/create-contact-group")
async def create_contact_group(
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

    data = await request.json()
    name = data.get("name", "").strip()
    if not name:
        return {"success": False, "message": "Contact group name is required", "data": None}

    # Check duplicate name per user (case-insensitive)
    exists = db.query(ContactGroup).filter(
        ContactGroup.user_id == current_user.id,
        func.lower(ContactGroup.name) == func.lower(name)
    ).first()
    if exists:
        return {"success": False, "message": "Contact group with this name already exists", "data": None}

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
    new_group = ContactGroup(user_id=current_user.id, name=name, created_at=now, updated_at=now)

    try:
        db.add(new_group)
        db.commit()
        db.refresh(new_group)
    except Exception as e:
        return {"success": False, "message": f"Database error: {str(e)}", "data": None}

    return {
        "success": True,
        "message": "Contact group created successfully",
        "data": {
            "id": new_group.id,
            "uuid": str(new_group.uuid),
            "name": new_group.name,
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.get("/contact-groups")
def list_contact_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    groups = db.query(ContactGroup).filter(ContactGroup.user_id == current_user.id).all()
    data = []
    for g in groups:
        contacts = db.query(Contact).filter(Contact.group_id == g.id).all()
        data.append({
            "id": g.id,
            "uuid": str(g.uuid),
            "name": g.name,
            "created_at": g.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "contacts": [
                {
                    "id": c.id,
                    "uuid": str(c.uuid),
                    "name": c.name,
                    "phone": c.phone,
                    "email": c.email,
                    "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
                } for c in contacts
            ]
        })
    return {"success": True, "message": f"Found {len(groups)} contact groups", "data": data}

@router.get("/contact-groups/{group_uuid}")
def get_contact_group(
    group_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(ContactGroup).filter(
        ContactGroup.uuid == group_uuid,
        ContactGroup.user_id == current_user.id
    ).first()
    if not group:
        return {"success": False, "message": "Contact group not found or no permission", "data": None}

    contacts = db.query(Contact).filter(Contact.group_id == group.id).all()
    return {
        "success": True,
        "message": "Contact group details fetched",
        "data": {
            "id": group.id,
            "uuid": str(group.uuid),
            "name": group.name,
            "created_at": group.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "contacts": [
                {
                    "id": c.id,
                    "uuid": str(c.uuid),
                    "name": c.name,
                    "phone": c.phone,
                    "email": c.email,
                    "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
                } for c in contacts
            ]
        }
    }
@router.post("/add-contacts")
async def create_contacts(
    request: Request,
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    if file:
        if "multipart/form-data" not in content_type.lower():
            raise HTTPException(status_code=415, detail="Invalid content type. Expected multipart/form-data")
    else:
        if "application/json" not in content_type.lower():
            return {
                "success": False,
                "message": "Invalid content type. Expected application/json",
                "data": None
            }

    # Extract group UUID from JSON or form data (required)
    group_uuid = None
    if not file:
        try:
            data = await request.json()
        except Exception:
            return {"success": False, "message": "Invalid JSON", "data": None}
        group_uuid = data.get("contact_group_uuid", "").strip()
        contacts_text = data.get("contacts_text", "").strip()
        if not group_uuid:
            return {"success": False, "message": "contact_group_uuid is required", "data": None}
        if not contacts_text:
            return {"success": False, "message": "No contacts_text provided", "data": None}
    else:
        form = await request.form()
        group_uuid = form.get("contact_group_uuid")
        if not group_uuid:
            return {"success": False, "message": "contact_group_uuid is required", "data": None}

    # Verify contact group exists and belongs to user
    contact_group = db.query(ContactGroup).filter(
        ContactGroup.uuid == group_uuid,
        ContactGroup.user_id == current_user.id
    ).first()
    if not contact_group:
        return {"success": False, "message": "Contact group not found or no permission", "data": None}

    contacts = []
    if file:
        contents = await file.read()
        try:
            contacts = parse_contacts_csv(contents)
        except HTTPException as e:
            return {"success": False, "message": e.detail, "data": None}
    else:
        contacts = parse_contacts_textarea(contacts_text)

    valid_contacts = []
    errors = []
    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    for idx, c in enumerate(contacts, 1):
        name = normalize_str(c.get("name"))
        phone = normalize_str(c.get("phone"))
        email = normalize_str(c.get("email"))

        # Validate phone required
        if not phone or not validate_phone(phone):
            errors.append(f"Row {idx}: Invalid phone '{phone}'")
            continue
        # Validate email if provided
        if email and not validate_email(email):
            errors.append(f"Row {idx}: Invalid email '{email}'")
            continue

        # Check duplicates by phone or email within the same group
        duplicate = db.query(Contact).filter(
            Contact.group_id == contact_group.id,
            Contact.user_id == current_user.id,
            or_(
                Contact.phone == phone,
                and_(email != "", Contact.email == email)
            )
        ).first()
        
        if duplicate:
            errors.append(f"Row {idx}: Duplicate contact with phone '{phone}' or email '{email}' in the group")
            continue

        valid_contacts.append(Contact(
            user_id=current_user.id,
            name=name,
            phone=phone,
            email=email,
            group_id=contact_group.id,
            created_at=now,
            updated_at=now
        ))

    try:
        db.bulk_save_objects(valid_contacts)
        db.commit()
    except Exception as e:
        return {"success": False, "message": f"DB error: {str(e)}", "data": None}

    return {
        "success": True,
        "message": f"Contacts processed. Successfully added {len(valid_contacts)} contacts. Skipped {len(errors)} invalid or duplicate contacts.",
        "errors": errors,
        "data": {
            "added_count": len(valid_contacts),
            "skipped_count": len(errors)
        }
    }

@router.get("/contacts/{contact_uuid}")
def get_contact(
    contact_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id
    ).first()
    if not contact:
        return {"success": False, "message": "Contact not found or no permission", "data": None}

    return {
        "success": True,
        "message": "Contact details fetched",
        "data": {
            "id": contact.id,
            "uuid": str(contact.uuid),
            "name": contact.name,
            "phone": contact.phone,
            "email": contact.email,
            "group_id": contact.group_id,
            "created_at": contact.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": contact.updated_at.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.delete("/contact-groups/{group_uuid}")
def delete_contact_group(
    group_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a contact group. Requires the group to belong to the authenticated user.
    Note: contact.group_id has ondelete=SET NULL in the model, so DB will nullify group_id
    if DB-level constraint exists. We also just delete the group here.
    """
    group = db.query(ContactGroup).filter(
        ContactGroup.uuid == group_uuid,
        ContactGroup.user_id == current_user.id
    ).first()

    if not group:
        return {"success": False, "message": "Contact group not found or no permission", "data": None}

    try:
        db.delete(group)
        db.commit()
    except Exception as e:
        return {"success": False, "message": f"Database error: {str(e)}", "data": None}

    return {
        "success": True,
        "message": "Contact group deleted successfully",
        "data": {"uuid": group_uuid}
    }


@router.post("/remove-contact-from-group")
async def remove_contact_from_group(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a contact from a contact group (set contact.group_id to NULL).
    Expects JSON:
    {
      "contact_uuid": "...",
      "contact_group_uuid": "..."
    }
    """
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

    contact_uuid = normalize_str(data.get("contact_uuid"))
    group_uuid = normalize_str(data.get("contact_group_uuid"))

    if not contact_uuid or not group_uuid:
        return {"success": False, "message": "contact_uuid and contact_group_uuid are required", "data": None}

    # Verify group belongs to user
    group = db.query(ContactGroup).filter(
        ContactGroup.uuid == group_uuid,
        ContactGroup.user_id == current_user.id
    ).first()
    if not group:
        return {"success": False, "message": "Contact group not found or no permission", "data": None}

    # Verify contact exists and belongs to user
    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id
    ).first()
    if not contact:
        return {"success": False, "message": "Contact not found or no permission", "data": None}

    # Ensure contact is actually in the provided group
    if contact.group_id != group.id:
        return {
            "success": False,
            "message": "Contact does not belong to the provided contact group",
            "data": None
        }

    # Remove from group
    try:
        contact.group_id = None
        contact.updated_at = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
        db.add(contact)
        db.commit()
        db.refresh(contact)
    except Exception as e:
        return {"success": False, "message": f"Database error: {str(e)}", "data": None}

    return {
        "success": True,
        "message": "Contact removed from contact group successfully",
        "data": {
            "id": contact.id,
            "uuid": str(contact.uuid),
            "name": contact.name,
            "phone": contact.phone,
            "email": contact.email,
            "group_id": contact.group_id,
            "updated_at": contact.updated_at.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.delete("/contacts/{contact_uuid}")
def delete_contact(
    contact_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a contact. Contact must belong to the authenticated user.
    """
    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id
    ).first()

    if not contact:
        return {"success": False, "message": "Contact not found or no permission", "data": None}

    try:
        db.delete(contact)
        db.commit()
    except Exception as e:
        return {"success": False, "message": f"Database error: {str(e)}", "data": None}

    return {
        "success": True,
        "message": "Contact deleted successfully",
        "data": {"uuid": contact_uuid}
    }
