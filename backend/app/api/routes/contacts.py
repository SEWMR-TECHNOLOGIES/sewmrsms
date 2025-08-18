# backend/app/api/contact_groups.py
import uuid
from fastapi import APIRouter, Path, Request, Depends, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_
from typing import Dict, List, Optional
from datetime import date, datetime, timedelta
import pytz
from utils.helpers import normalize_str, parse_contacts_csv, parse_contacts_textarea
from utils.validation import validate_email, validate_phone
from models.contact_group import ContactGroup
from models.contact import Contact
from models.user import User
from api.deps import get_db
from api.user_auth import get_current_user

router = APIRouter()

@router.post("/groups/create")
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

@router.put("/groups/edit/{group_uuid}")
async def edit_contact_group(
    group_uuid: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure content type is JSON
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type.lower():
        return {
            "success": False,
            "message": "Invalid content type. Expected application/json",
            "data": None
        }

    data = await request.json()
    name = data.get("name", "").strip()
    description = data.get("description")  # can be None or empty

    if not name:
        return {"success": False, "message": "Contact group name is required", "data": None}

    # Fetch the group
    group = db.query(ContactGroup).filter(
        ContactGroup.uuid == group_uuid,
        ContactGroup.user_id == current_user.id
    ).first()

    if not group:
        return {"success": False, "message": "Contact group not found or no permission", "data": None}

    # Check for duplicate name excluding current group (case-insensitive)
    exists = db.query(ContactGroup).filter(
        ContactGroup.user_id == current_user.id,
        func.lower(ContactGroup.name) == func.lower(name),
        ContactGroup.id != group.id
    ).first()
    if exists:
        return {"success": False, "message": "Another contact group with this name already exists", "data": None}

    # Update fields
    group.name = name
    group.description = description.strip() if description and description.strip() else None
    group.updated_at = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    try:
        db.commit()
        db.refresh(group)
    except Exception as e:
        return {"success": False, "message": f"Database error: {str(e)}", "data": None}

    return {
        "success": True,
        "message": "Contact group updated successfully",
        "data": {
            "id": group.id,
            "uuid": str(group.uuid),
            "name": group.name,
            "description": group.description if group.description else "No description provided",
            "created_at": group.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": group.updated_at.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.get("/grouped")
def get_all_contacts_grouped(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch all contacts for the user
    contacts = db.query(Contact).filter(Contact.user_id == current_user.id).all()

    grouped_contacts: Dict[str, List[Dict]] = {}
    grouped_contacts["all"] = []   # Virtual "all" group
    grouped_contacts["none"] = []  # Virtual "none" group for ungrouped

    for c in contacts:
        contact_dict = {
            "id": c.id,
            "uuid": str(c.uuid),
            "name": c.name,
            "phone": c.phone,
            "email": c.email,
            "group_uuid": str(c.group.uuid) if c.group else None,
            "group_name": c.group.name if c.group else "Ungrouped",
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }

        # Add to virtual "all"
        grouped_contacts["all"].append(contact_dict)

        # Add to actual group if exists
        if c.group:
            gid = str(c.group.uuid)
            if gid not in grouped_contacts:
                grouped_contacts[gid] = []
            grouped_contacts[gid].append(contact_dict)
        else:
            # Add to virtual "none" if ungrouped
            grouped_contacts["none"].append(contact_dict)

    # Convert each group to include count and display name
    grouped_with_count = {}
    for key, lst in grouped_contacts.items():
        if key == "all":
            display_name = "All Contacts"
        elif key == "none":
            display_name = "Ungrouped"
        else:
            # Take first contact's group name as actual name
            display_name = lst[0]["group_name"] if lst else "Unnamed Group"

        grouped_with_count[key] = {
            "count": len(lst),
            "group_name": display_name,
            "contacts": lst
        }

    return {
        "success": True,
        "message": f"Fetched {len(contacts)} contacts grouped",
        "data": grouped_with_count
    }


@router.get("/groups")
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
            "description": g.description if g.description else "No description provided",
            "contact_count": len(contacts),
            "created_at": g.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": g.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
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
    return {
        "success": True,
        "message": f"Found {len(groups)} contact groups",
        "data": data
    }


@router.get("/groups/{group_uuid}")
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
            "description": group.description if group.description else "No description provided",
            "created_at": group.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": group.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            "contact_count": len(contacts),
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
    try:
        content_type = request.headers.get("content-type", "")
        print("Content-Type:", content_type)

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

        group_uuid = None
        contacts_text = ""
        if not file:
            try:
                data = await request.json()
            except Exception as e:
                return {"success": False, "message": "Invalid JSON", "data": None}

            group_uuid = data.get("contact_group_uuid", "").strip()
            contacts_text = data.get("contacts_text", "").strip()
            if not group_uuid:
                return {"success": False, "message": "contact_group_uuid is required", "data": None}
            if not contacts_text:
                return {"success": False, "message": "No contacts_text provided", "data": None}
        else:
            try:
                form = await request.form()
            except Exception as e:
                return {"success": False, "message": "Invalid form data", "data": None}

            group_uuid = form.get("contact_group_uuid")
            if not group_uuid:
                return {"success": False, "message": "contact_group_uuid is required", "data": None}

        # Verify contact group
        contact_group = None
        if group_uuid.lower() != "none":
            contact_group = db.query(ContactGroup).filter(
                ContactGroup.uuid == group_uuid,
                ContactGroup.user_id == current_user.id
            ).first()
            if not contact_group:
                print("Contact group not found or no permission for group_uuid:", group_uuid)
                return {"success": False, "message": "Contact group not found or no permission", "data": None}

        contacts = []
        if file:
            try:
                contents = await file.read()
                contacts = parse_contacts_csv(contents)
            except HTTPException as e:
                return {"success": False, "message": e.detail, "data": None}
            except Exception as e:
                return {"success": False, "message": str(e), "data": None}
        else:
            try:
                contacts = parse_contacts_textarea(contacts_text)
            except Exception as e:
                return {"success": False, "message": str(e), "data": None}

        valid_contacts = []
        errors = []
        now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

        for idx, c in enumerate(contacts, 1):
            try:
                name = normalize_str(c.get("name"))
                phone = normalize_str(c.get("phone"))
                email = normalize_str(c.get("email"))

                if not phone or not validate_phone(phone):
                    errors.append(f"Row {idx}: Invalid phone '{phone}'")
                    continue
                if email and not validate_email(email):
                    errors.append(f"Row {idx}: Invalid email '{email}'")
                    continue

                group_id = contact_group.id if contact_group else None
                duplicate = db.query(Contact).filter(
                    Contact.group_id == group_id,
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
                    group_id=group_id, 
                    created_at=now,
                    updated_at=now
                ))
            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")

        try:
            db.bulk_save_objects(valid_contacts)
            db.commit()
        except Exception as e:
            print("DB commit error:", e)
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

    except Exception as e:
        print("Unhandled error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{contact_uuid}")
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

@router.delete("/groups/{group_uuid}/remove")
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


@router.delete("/groups/{group_uuid}/contacts/{contact_uuid}")
async def remove_contact_from_group(
    group_uuid: uuid.UUID = Path(...),
    contact_uuid: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify group belongs to user
    group = db.query(ContactGroup).filter(
        ContactGroup.uuid == group_uuid,
        ContactGroup.user_id == current_user.id
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Contact group not found or no permission")

    # Verify contact exists and belongs to user
    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found or no permission")

    # Ensure contact is actually in the provided group
    if contact.group_id != group.id:
        raise HTTPException(status_code=400, detail="Contact does not belong to the provided group")

    # Remove from group
    contact.group_id = None
    contact.updated_at = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
    db.add(contact)
    db.commit()
    db.refresh(contact)

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

@router.delete("/{contact_uuid}")
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

@router.get("/")
def get_contacts_overview(current_user: User = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    """
    Returns contacts list, grouped info, and stats for the UI.
    """

    # Fetch all contacts for the user
    contacts = db.query(Contact).filter(Contact.user_id == current_user.id).all()
    
    # Fetch all groups for the user
    groups = db.query(ContactGroup).filter(ContactGroup.user_id == current_user.id).all()
    
    total_contacts = len(contacts)
    active_contacts = len([c for c in contacts if not c.blacklisted])
    
    # Contacts added last month
    today = date.today()
    last_month = (today.replace(day=1) - timedelta(days=1))
    contacts_last_month = len([
        c for c in contacts
        if c.created_at.year == last_month.year and c.created_at.month == last_month.month
    ])
    
    # Contacts added this month
    contacts_this_month = len([
        c for c in contacts
        if c.created_at.year == today.year and c.created_at.month == today.month
    ])
    
    # Percentage active
    active_percentage = round((active_contacts / total_contacts) * 100, 1) if total_contacts else 0

    # Prepare contacts data for table
    contact_list = []
    for c in contacts:
        contact_list.append({
            "id": c.id,
            "uuid": str(c.uuid),
            "name": c.name,
            "phone": c.phone,
            "email": c.email,
            "group_id": c.group_id,
            "group_name": c.group.name if c.group else "Ungrouped",
            "blacklisted": c.blacklisted,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": c.updated_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    
    # Return groups summary
    group_summary = []
    for g in groups:
        group_contacts = [c for c in contacts if c.group_id == g.id]
        group_summary.append({
            "id": g.id,
            "uuid": str(g.uuid),
            "name": g.name,
            "contact_count": len(group_contacts)
        })

    return {
        "success": True,
        "message": f"Fetched {total_contacts} contacts",
        "data": {
            "stats": {
                "total": total_contacts,
                "totalFromLastMonth": contacts_last_month,
                "active": active_contacts,
                "activePercentage": active_percentage,
                "groups": len(groups),
                "thisMonth": contacts_this_month
            },
            "contacts": contact_list,
            "groups": group_summary
        }
    }

@router.put("/{contact_uuid}/edit")
async def edit_contact(
    contact_uuid: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure JSON content type
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type.lower():
        return {"success": False, "message": "Invalid content type. Expected application/json", "data": None}

    data = await request.json()
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip() if data.get("email") else None
    group_uuid = data.get("group_uuid", "").strip() if data.get("group_uuid") else None

    if not name or not phone:
        return {"success": False, "message": "Name and phone are required", "data": None}

    # Validate phone/email
    from utils.validation import validate_email, validate_phone
    if not validate_phone(phone):
        return {"success": False, "message": f"Invalid phone: {phone}", "data": None}
    if email and not validate_email(email):
        return {"success": False, "message": f"Invalid email: {email}", "data": None}

    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id
    ).first()
    if not contact:
        return {"success": False, "message": "Contact not found or no permission", "data": None}

    # Handle group
    group = None
    if group_uuid and group_uuid.lower() != "none":
        group = db.query(ContactGroup).filter(
            ContactGroup.uuid == group_uuid,
            ContactGroup.user_id == current_user.id
        ).first()
        if not group:
            return {"success": False, "message": "Contact group not found or no permission", "data": None}

    # Check duplicate phone/email in same group
    duplicate = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.id != contact.id,
        or_(
            Contact.phone == phone,
            and_(email != "", Contact.email == email)
        ),
        Contact.group_id == (group.id if group else None)
    ).first()
    if duplicate:
        return {"success": False, "message": "Another contact with same phone/email exists in the group", "data": None}

    # Update contact
    contact.name = name
    contact.phone = phone
    contact.email = email
    contact.group_id = group.id if group else None
    contact.updated_at = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    try:
        db.commit()
        db.refresh(contact)
    except Exception as e:
        return {"success": False, "message": f"Database error: {str(e)}", "data": None}

    return {
        "success": True,
        "message": "Contact updated successfully",
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

@router.post("/{contact_uuid}/blacklist")
def blacklist_contact(
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

    contact.blacklisted = True
    contact.updated_at = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
    db.add(contact)
    db.commit()
    db.refresh(contact)

    return {"success": True, "message": f"Contact '{contact.name}' blacklisted successfully", "data": {"uuid": contact_uuid}}

@router.post("/{contact_uuid}/unblacklist")
def unblacklist_contact(
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

    contact.blacklisted = False
    contact.updated_at = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
    db.add(contact)
    db.commit()
    db.refresh(contact)

    return {"success": True, "message": f"Contact '{contact.name}' removed from blacklist", "data": {"uuid": contact_uuid}}