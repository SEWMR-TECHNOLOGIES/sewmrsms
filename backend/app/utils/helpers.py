# backend/app/utils/helpers.py

import csv
import io
from typing import List, Optional
from fastapi import HTTPException
import openpyxl
from sqlalchemy.orm import Session
from models.sms_package import SmsPackage

def get_package_by_sms_count(db: Session, sms_count: int) -> SmsPackage | None:
    return (
        db.query(SmsPackage)
        .filter(SmsPackage.start_sms_count <= sms_count)
        .order_by(SmsPackage.start_sms_count.desc())
        .first()
    )

def normalize_str(s: Optional[str]) -> Optional[str]:
    if s is None:
        return None
    return s.strip()

def parse_contacts_textarea(text: str) -> List[dict]:
    """
    Parse textarea input where each line is a contact in comma-separated format:
    name,phone,email
    """
    contacts = []
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    for i, line in enumerate(lines, 1):
        parts = [p.strip() for p in next(csv.reader([line]))]  # handle quoted CSV lines properly
        if len(parts) < 2:
            continue  # skip lines without at least phone and name
        name = parts[0] if parts[0] else None
        phone = parts[1] if len(parts) > 1 else None
        email = parts[2] if len(parts) > 2 else None
        contacts.append({"name": name, "phone": phone, "email": email})
    return contacts

def parse_contacts_csv(file_bytes: bytes) -> List[dict]:
    """
    Parse CSV or XLSX file bytes into list of contacts dictionaries.
    Accept both CSV and XLSX formats.
    """
    contacts = []
    # Try CSV first
    try:
        text = file_bytes.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            contacts.append({
                "name": row.get("name") or row.get("Name") or None,
                "phone": row.get("phone") or row.get("Phone") or None,
                "email": row.get("email") or row.get("Email") or None,
            })
        if contacts:
            return contacts
    except Exception:
        pass

    # If CSV parsing failed or empty, try XLSX
    try:
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes))
        ws = wb.active
        headers = [cell.value.lower() if cell.value else "" for cell in next(ws.iter_rows(max_row=1))]
        name_idx = headers.index("name") if "name" in headers else None
        phone_idx = headers.index("phone") if "phone" in headers else None
        email_idx = headers.index("email") if "email" in headers else None

        if phone_idx is None:
            raise ValueError("Missing required 'phone' column in XLSX")

        for row in ws.iter_rows(min_row=2):
            name = row[name_idx].value if name_idx is not None else None
            phone = row[phone_idx].value if phone_idx is not None else None
            email = row[email_idx].value if email_idx is not None else None
            contacts.append({
                "name": str(name).strip() if name else None,
                "phone": str(phone).strip() if phone else None,
                "email": str(email).strip() if email else None,
            })
        return contacts
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file format or content: {str(e)}")
