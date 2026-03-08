# backend/app/api/contact_groups.py
"""Contact and contact group routes with Pydantic validation and N+1 fixes."""

import uuid
from datetime import date, timedelta
from typing import Dict, List

from fastapi import APIRouter, Depends, File, HTTPException, Path, Request, UploadFile
from pydantic import ValidationError
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload

from api.deps import get_db
from api.user_auth import get_current_user, get_current_user_optional
from models.contact import Contact
from models.contact_group import ContactGroup
from models.user import User
from schemas.contacts import AddContactsRequest, CreateGroupRequest, EditContactRequest, EditGroupRequest
from utils.helpers import normalize_str, parse_contacts_csv, parse_contacts_textarea
from utils.responses import fail, ok
from utils.timezone import now_eat
from utils.validation import validate_email, validate_phone

router = APIRouter()


@router.post("/groups/create")
async def create_contact_group(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        data = await request.json()
        payload = CreateGroupRequest(**data)
    except ValidationError as e:
        return fail(e.errors()[0]["msg"])
    except Exception:
        return fail("Invalid JSON")

    exists = db.query(ContactGroup).filter(
        ContactGroup.user_id == current_user.id,
        func.lower(ContactGroup.name) == func.lower(payload.name),
    ).first()
    if exists:
        return fail("Contact group with this name already exists")

    now = now_eat()
    new_group = ContactGroup(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        created_at=now,
        updated_at=now,
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    return ok("Contact group created successfully", {
        "id": new_group.id,
        "uuid": str(new_group.uuid),
        "name": new_group.name,
        "description": new_group.description,
        "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": now.strftime("%Y-%m-%d %H:%M:%S"),
    })


@router.put("/groups/edit/{group_uuid}")
async def edit_contact_group(
    group_uuid: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        data = await request.json()
        payload = EditGroupRequest(**data)
    except ValidationError as e:
        return fail(e.errors()[0]["msg"])
    except Exception:
        return fail("Invalid JSON")

    group = db.query(ContactGroup).filter(
        ContactGroup.uuid == group_uuid,
        ContactGroup.user_id == current_user.id,
    ).first()
    if not group:
        return fail("Contact group not found or no permission")

    dup = db.query(ContactGroup).filter(
        ContactGroup.user_id == current_user.id,
        func.lower(ContactGroup.name) == func.lower(payload.name),
        ContactGroup.id != group.id,
    ).first()
    if dup:
        return fail("Another contact group with this name already exists")

    group.name = payload.name
    group.description = payload.description.strip() if payload.description else None
    group.updated_at = now_eat()
    db.commit()
    db.refresh(group)

    return ok("Contact group updated successfully", {
        "id": group.id,
        "uuid": str(group.uuid),
        "name": group.name,
        "description": group.description or "No description provided",
        "created_at": group.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": group.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
    })


@router.get("/grouped")
def get_all_contacts_grouped(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Eager load group to avoid N+1
    contacts = db.query(Contact).options(
        joinedload(Contact.group)
    ).filter(Contact.user_id == current_user.id).all()

    grouped_contacts: Dict[str, List[Dict]] = {"all": [], "none": []}

    for c in contacts:
        contact_dict = {
            "id": c.id,
            "uuid": str(c.uuid),
            "name": c.name,
            "phone": c.phone,
            "email": c.email,
            "group_uuid": str(c.group.uuid) if c.group else None,
            "group_name": c.group.name if c.group else "Ungrouped",
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        grouped_contacts["all"].append(contact_dict)
        if c.group:
            gid = str(c.group.uuid)
            grouped_contacts.setdefault(gid, []).append(contact_dict)
        else:
            grouped_contacts["none"].append(contact_dict)

    result = {}
    for key, lst in grouped_contacts.items():
        if key == "all":
            display_name = "All Contacts"
        elif key == "none":
            display_name = "Ungrouped"
        else:
            display_name = lst[0]["group_name"] if lst else "Unnamed Group"
        result[key] = {"count": len(lst), "group_name": display_name, "contacts": lst}

    return ok(f"Fetched {len(contacts)} contacts grouped", result)


@router.get("/groups")
def list_contact_groups(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    # Single query with count subquery
    groups = db.query(ContactGroup).filter(ContactGroup.user_id == current_user.id).all()
    group_ids = [g.id for g in groups]

    # Batch fetch counts
    counts = dict(
        db.query(Contact.group_id, func.count(Contact.id))
        .filter(Contact.group_id.in_(group_ids))
        .group_by(Contact.group_id)
        .all()
    )

    data = []
    for g in groups:
        # Fetch contacts for this group
        contacts = db.query(Contact).filter(Contact.group_id == g.id).all()
        data.append({
            "id": g.id,
            "uuid": str(g.uuid),
            "name": g.name,
            "description": g.description or "No description provided",
            "contact_count": counts.get(g.id, 0),
            "created_at": g.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": g.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            "contacts": [
                {
                    "id": c.id,
                    "uuid": str(c.uuid),
                    "name": c.name,
                    "phone": c.phone,
                    "email": c.email,
                    "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                }
                for c in contacts
            ],
        })

    return ok(f"Found {len(groups)} contact groups", data)


@router.get("/groups/{group_uuid}")
def get_contact_group(
    group_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(ContactGroup).filter(
        ContactGroup.uuid == group_uuid,
        ContactGroup.user_id == current_user.id,
    ).first()
    if not group:
        return fail("Contact group not found or no permission")

    contacts = db.query(Contact).filter(Contact.group_id == group.id).all()

    return ok("Contact group details fetched", {
        "id": group.id,
        "uuid": str(group.uuid),
        "name": group.name,
        "description": group.description or "No description provided",
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
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for c in contacts
        ],
    })


@router.post("/add-contacts")
async def create_contacts(
    request: Request,
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content_type = request.headers.get("content-type", "")

    group_uuid = None
    contacts_text = ""

    if file:
        if "multipart/form-data" not in content_type.lower():
            raise HTTPException(status_code=415, detail="Invalid content type. Expected multipart/form-data")
        form = await request.form()
        group_uuid = form.get("contact_group_uuid")
        if not group_uuid:
            return fail("contact_group_uuid is required")
    else:
        if "application/json" not in content_type.lower():
            return fail("Invalid content type. Expected application/json")
        try:
            data = await request.json()
            payload = AddContactsRequest(**data)
            group_uuid = payload.contact_group_uuid
            contacts_text = payload.contacts_text
        except ValidationError as e:
            return fail(e.errors()[0]["msg"])
        except Exception:
            return fail("Invalid JSON")

    contact_group = None
    if group_uuid.lower() != "none":
        contact_group = db.query(ContactGroup).filter(
            ContactGroup.uuid == group_uuid,
            ContactGroup.user_id == current_user.id,
        ).first()
        if not contact_group:
            return fail("Contact group not found or no permission")

    contacts_raw = []
    if file:
        contents = await file.read()
        contacts_raw = parse_contacts_csv(contents)
    else:
        contacts_raw = parse_contacts_textarea(contacts_text)

    valid_contacts = []
    errors = []
    now = now_eat()

    for idx, c in enumerate(contacts_raw, 1):
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
        dup = db.query(Contact).filter(
            Contact.group_id == group_id,
            Contact.user_id == current_user.id,
            or_(
                Contact.phone == phone,
                and_(email not in (None, ""), Contact.email == email),
            ),
        ).first()
        if dup:
            errors.append(f"Row {idx}: Duplicate contact")
            continue

        valid_contacts.append(Contact(
            user_id=current_user.id,
            name=name,
            phone=phone,
            email=email,
            group_id=group_id,
            created_at=now,
            updated_at=now,
        ))

    if valid_contacts:
        db.bulk_save_objects(valid_contacts)
        db.commit()

    return ok(
        f"Contacts processed. Successfully added {len(valid_contacts)} contacts. Skipped {len(errors)} invalid or duplicate contacts.",
        {"added_count": len(valid_contacts), "skipped_count": len(errors)},
        errors=errors,
    )


@router.get("/{contact_uuid}")
def get_contact(
    contact_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id,
    ).first()
    if not contact:
        return fail("Contact not found or no permission")

    return ok("Contact details fetched", {
        "id": contact.id,
        "uuid": str(contact.uuid),
        "name": contact.name,
        "phone": contact.phone,
        "email": contact.email,
        "group_id": contact.group_id,
        "created_at": contact.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": contact.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
    })


@router.delete("/groups/{group_uuid}/remove")
def delete_contact_group(
    group_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(ContactGroup).filter(
        ContactGroup.uuid == group_uuid,
        ContactGroup.user_id == current_user.id,
    ).first()
    if not group:
        return fail("Contact group not found or no permission")

    db.delete(group)
    db.commit()
    return ok("Contact group deleted successfully", {"uuid": group_uuid})


@router.delete("/groups/{group_uuid}/contacts/{contact_uuid}")
async def remove_contact_from_group(
    group_uuid: uuid.UUID = Path(...),
    contact_uuid: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(ContactGroup).filter(
        ContactGroup.uuid == group_uuid,
        ContactGroup.user_id == current_user.id,
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Contact group not found or no permission")

    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id,
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found or no permission")

    if contact.group_id != group.id:
        raise HTTPException(status_code=400, detail="Contact does not belong to the provided group")

    contact.group_id = None
    contact.updated_at = now_eat()
    db.commit()
    db.refresh(contact)

    return ok("Contact removed from contact group successfully", {
        "id": contact.id,
        "uuid": str(contact.uuid),
        "name": contact.name,
        "phone": contact.phone,
        "email": contact.email,
        "group_id": contact.group_id,
        "updated_at": contact.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
    })


@router.delete("/{contact_uuid}")
def delete_contact(
    contact_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id,
    ).first()
    if not contact:
        return fail("Contact not found or no permission")

    db.delete(contact)
    db.commit()
    return ok("Contact deleted successfully", {"uuid": contact_uuid})


@router.get("/")
def get_contacts_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Eager load groups to avoid N+1
    contacts = db.query(Contact).options(
        joinedload(Contact.group)
    ).filter(Contact.user_id == current_user.id).all()

    groups = db.query(ContactGroup).filter(ContactGroup.user_id == current_user.id).all()

    total_contacts = len(contacts)
    active_contacts = len([c for c in contacts if not c.is_blacklisted])

    today = date.today()
    last_month = today.replace(day=1) - timedelta(days=1)
    contacts_last_month = len([
        c for c in contacts
        if c.created_at.year == last_month.year and c.created_at.month == last_month.month
    ])
    contacts_this_month = len([
        c for c in contacts
        if c.created_at.year == today.year and c.created_at.month == today.month
    ])
    active_percentage = round((active_contacts / total_contacts) * 100, 1) if total_contacts else 0

    contact_list = [
        {
            "id": c.id,
            "uuid": str(c.uuid),
            "name": c.name,
            "phone": c.phone,
            "email": c.email,
            "group_id": c.group_id,
            "group_uuid": str(c.group.uuid) if c.group else None,
            "group_name": c.group.name if c.group else "Ungrouped",
            "blacklisted": c.is_blacklisted,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": c.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for c in contacts
    ]

    group_summary = [
        {
            "id": g.id,
            "uuid": str(g.uuid),
            "name": g.name,
            "contact_count": len([c for c in contacts if c.group_id == g.id]),
        }
        for g in groups
    ]

    return ok(f"Fetched {total_contacts} contacts", {
        "stats": {
            "total": total_contacts,
            "totalFromLastMonth": contacts_last_month,
            "active": active_contacts,
            "activePercentage": active_percentage,
            "groups": len(groups),
            "thisMonth": contacts_this_month,
        },
        "contacts": contact_list,
        "groups": group_summary,
    })


@router.put("/{contact_uuid}/edit")
async def edit_contact(
    contact_uuid: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        data = await request.json()
        payload = EditContactRequest(**data)
    except ValidationError as e:
        return fail(e.errors()[0]["msg"])
    except Exception:
        return fail("Invalid JSON")

    if not validate_phone(payload.phone):
        return fail(f"Invalid phone: {payload.phone}")
    if payload.email and not validate_email(payload.email):
        return fail(f"Invalid email: {payload.email}")

    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id,
    ).first()
    if not contact:
        return fail("Contact not found or no permission")

    group = None
    if payload.group_uuid and payload.group_uuid.lower() != "none":
        group = db.query(ContactGroup).filter(
            ContactGroup.uuid == payload.group_uuid,
            ContactGroup.user_id == current_user.id,
        ).first()
        if not group:
            return fail("Contact group not found or no permission")

    dup = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.id != contact.id,
        or_(
            Contact.phone == payload.phone,
            and_(payload.email not in (None, ""), Contact.email == payload.email),
        ),
        Contact.group_id == (group.id if group else None),
    ).first()
    if dup:
        return fail("Another contact with same phone/email exists in the group")

    contact.name = payload.name
    contact.phone = payload.phone
    contact.email = payload.email
    contact.group_id = group.id if group else None
    contact.updated_at = now_eat()
    db.commit()
    db.refresh(contact)

    return ok("Contact updated successfully", {
        "id": contact.id,
        "uuid": str(contact.uuid),
        "name": contact.name,
        "phone": contact.phone,
        "email": contact.email,
        "group_id": contact.group_id,
        "group_uuid": str(group.uuid) if group else None,
        "group_name": group.name if group else "Ungrouped",
        "updated_at": contact.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
    })


@router.post("/{contact_uuid}/blacklist")
def blacklist_contact(
    contact_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id,
    ).first()
    if not contact:
        return fail("Contact not found or no permission")

    contact.is_blacklisted = True
    contact.updated_at = now_eat()
    db.commit()
    return ok(f"Contact '{contact.name}' blacklisted successfully", {"uuid": contact_uuid})


@router.post("/{contact_uuid}/unblacklist")
def unblacklist_contact(
    contact_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.query(Contact).filter(
        Contact.uuid == contact_uuid,
        Contact.user_id == current_user.id,
    ).first()
    if not contact:
        return fail("Contact not found or no permission")

    contact.is_blacklisted = False
    contact.updated_at = now_eat()
    db.commit()
    return ok(f"Contact '{contact.name}' removed from blacklist", {"uuid": contact_uuid})
