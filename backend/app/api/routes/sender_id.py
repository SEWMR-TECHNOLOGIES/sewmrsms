# backend/app/api/sender_id.py
import os
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Path, Request, UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from api.user_auth import get_current_user
from models.network import Network
from models.sender_id_propagation import SenderIdPropagation
from models.sender_id import SenderId
from models.models import SenderIdRequest
from models.enums import PropagationStatusEnum, SenderIdRequestStatusEnum
from models.user import User
from api.deps import get_db
from utils.validation import (validate_sender_alias)
from datetime import datetime
import pytz
import uuid
import httpx
from fastapi.responses import StreamingResponse
from io import BytesIO
from xhtml2pdf import pisa
from io import BytesIO
from core.config import UPLOAD_SERVICE_URL, MAX_FILE_SIZE

router = APIRouter()

@router.post("/request")
async def request_sender_id(
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

    alias = data.get("alias", "").strip().upper()
    sample_message = data.get("sample_message", "").strip()
    company_name = data.get("company_name", "").strip()

    if not alias:
        return {"success": False, "message": "Alias is required", "data": None}
    if not sample_message:
        return {"success": False, "message": "Sample message is required", "data": None}
    if not company_name:
        return {"success": False, "message": "Company name is required", "data": None}

    if not validate_sender_alias(alias):
        return {
            "success": False,
            "message": "Alias must be 3 to 11 characters long and contain only uppercase letters, digits, and spaces",
            "data": None
        }

    # Check if alias already exists for this user in SenderIdRequests (pending/approved/in_review)
    existing_request = db.query(SenderIdRequest).filter(
        SenderIdRequest.user_id == current_user.id,
        SenderIdRequest.sender_alias == alias,
        or_(
            SenderIdRequest.status == SenderIdRequestStatusEnum.pending.value,
            SenderIdRequest.status == SenderIdRequestStatusEnum.approved.value,
            SenderIdRequest.status == SenderIdRequestStatusEnum.in_review.value
        )
    ).first()

    if existing_request:
        status_message = existing_request.status.replace("_", " ").capitalize()
        return {
            "success": False,
            "message": f"Sender ID '{alias}' is already submitted and it is currently {status_message}.",
            "data": None
        }

    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    new_request = SenderIdRequest(
        user_id=current_user.id,
        sender_alias=alias,
        sample_message=sample_message,
        company_name=company_name,
        status=SenderIdRequestStatusEnum.pending.value,
        created_at=now,
        updated_at=now
    )
    try:
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
    except Exception as e:
        print(f"DB error on sender ID request creation: {e}")
        return {"success": False, "message": "Database error", "data": None}

    return {
        "success": True,
        "message": "Sender ID request submitted successfully. Please download, sign, and upload the Sender ID agreement to complete your request.",
        "data": {
            "id": new_request.id,
            "uuid": str(new_request.uuid),
            "sender_alias": new_request.sender_alias,
            "status": new_request.status,
            "sample_message": new_request.sample_message,
            "company_name": new_request.company_name,
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.post("/{sender_request_uuid}/upload-signed-agreement")
async def upload_sender_id_document(
    request: Request,
    sender_request_uuid: uuid.UUID = Path(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type.lower():
        raise HTTPException(
            status_code=415,
            detail="Invalid content type. Expected multipart/form-data"
        )

    # Ensure request exists and belongs to user
    sender_req = db.query(SenderIdRequest).filter(
        SenderIdRequest.uuid == sender_request_uuid,
        SenderIdRequest.user_id == current_user.id,
        SenderIdRequest.status == SenderIdRequestStatusEnum.pending.value
    ).first()
    if not sender_req:
        raise HTTPException(status_code=404, detail="Sender ID request not found or not pending")

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    _, ext = os.path.splitext(file.filename)
    if ext.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="File extension must be .pdf")
    
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must be less than 0.5 MB")

    # Prepare unique filename
    unique_filename = f"{uuid.uuid4()}.pdf"

    # Prepare target path for PHP upload
    target_path = "sewmrsms/uploads/sender-id-requests/agreements/"

    data = {'target_path': target_path}
    if sender_req.document_path:
        data['old_attachment'] = sender_req.document_path

    files = {'file': (unique_filename, content, 'application/pdf')}

    async with httpx.AsyncClient() as client:
        response = await client.post(UPLOAD_SERVICE_URL, data=data, files=files)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Upload service error")

    result = response.json()
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Upload failed"))

    # Update DB with document URL
    sender_req.document_path = result["data"]["url"]
    sender_req.updated_at = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)

    try:
        db.commit()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update sender ID request")

    return {
        "success": True,
        "message": "Sender ID agreement uploaded successfully. We are reviewing your sender ID request and will notify you once it is processed.",
        "data": {
            "uuid": str(sender_req.uuid),
            "document_path": sender_req.document_path
        }
    }

@router.post("/request/student")
async def request_student_sender_id(
    request: Request,
    is_student_request: Optional[bool] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type.lower():
        raise HTTPException(
            status_code=415,
            detail="Invalid content type. Expected multipart/form-data"
        )

    if not is_student_request:
        raise HTTPException(status_code=400, detail="Only student requests are accepted here.")
    
    if not file:
        raise HTTPException(status_code=400, detail="File is required. Please upload a PDF file.")
    
    # Check for existing pending or approved student request
    existing_request = db.query(SenderIdRequest).filter(
        SenderIdRequest.user_id == current_user.id,
        SenderIdRequest.is_student_request.is_(True),
        SenderIdRequest.status.in_([
            SenderIdRequestStatusEnum.pending.value,
            SenderIdRequestStatusEnum.approved.value
        ])
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending or approved student sender ID request.")
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    _, ext = os.path.splitext(file.filename)
    if ext.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="File extension must be .pdf")
    
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must be less than 0.5 MB")
    
    unique_filename = f"{uuid.uuid4()}.pdf"
    target_path = "sewmrsms/uploads/sender-id-requests/student-ids/"
    
    data = {'target_path': target_path}
    files = {'file': (unique_filename, content, 'application/pdf')}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(UPLOAD_SERVICE_URL, data=data, files=files)
    
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Upload service error")
    
    result = response.json()
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Upload failed"))
    
    # Create new sender ID request for student
    now = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None)
    new_request = SenderIdRequest(
        user_id=current_user.id,
        sender_alias="EasyTextAPI",
        sample_message="Hello, this is a test message from EasyTextAPI for your project integration.",
        company_name="SEWMR Technologies",
        status=SenderIdRequestStatusEnum.pending.value,
        remarks=None,
        is_student_request=True,
        student_id_path=result["data"]["url"],
        created_at=now,
        updated_at=now
    )
    
    try:
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {
        "success": True,
        "message": "We have received your student Sender ID request. Once approved, EasyTextAPI will be added to your account. Meanwhile, please download, sign, and upload the Sender ID agreement to complete your request.",
        "data": {
            "id": new_request.id,
            "uuid": str(new_request.uuid),
            "sender_alias": new_request.sender_alias,
            "status": new_request.status,
            "company_name": new_request.company_name,
            "student_id_path": new_request.student_id_path,
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.get("/{sender_request_uuid}/propagation-status")
def get_sender_id_propagation_status(
    sender_request_uuid: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Confirm sender request ownership
    request_obj = db.query(SenderIdRequest).filter(
        SenderIdRequest.uuid == sender_request_uuid,
        SenderIdRequest.user_id == current_user.id
    ).first()

    if not request_obj:
        raise HTTPException(status_code=404, detail="Sender ID request not found or unauthorized")

    # Fetch all networks
    all_networks = db.query(Network).all()

    # Fetch existing propagation records for this request
    existing_propagations = db.query(SenderIdPropagation).filter(
        SenderIdPropagation.request_id == request_obj.id
    ).all()

    # Map network_id -> propagation
    propagation_map = {p.network_id: p for p in existing_propagations}

    data = []
    for network in all_networks:
        propagation = propagation_map.get(network.id)
        data.append({
            "network_name": network.name,
            "network_uuid": str(network.uuid),
            "color_code": network.color_code,  # optional
            "status": propagation.status.value if propagation else PropagationStatusEnum.pending.value,
            "updated_at": propagation.updated_at.strftime("%Y-%m-%d %H:%M:%S") 
                          if propagation and propagation.updated_at else None,
            "details": propagation.details if propagation and propagation.details else "No additional details provided"
        })

    # Compute overall status
    all_statuses = [item["status"] for item in data]
    if all(s == "propagated" for s in all_statuses):
        overall_status = "propagated"
    elif all(s == "failed" for s in all_statuses):
        overall_status = "failed"
    elif any(s == "propagated" for s in all_statuses):
        overall_status = "partial"
    else:
        overall_status = "pending"

    # Last checked timestamp
    last_checked = datetime.now(pytz.timezone("Africa/Nairobi")).replace(tzinfo=None).isoformat()

    return {
        "success": True,
        "message": "Propagation status retrieved successfully",
        "sender_id": request_obj.sender_alias,
        "overall_status": overall_status,
        "last_checked": last_checked,
        "data": data
    }

@router.get("/")
async def get_user_sender_ids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sender_ids = db.query(SenderId).filter(SenderId.user_id == current_user.id).all()

    data = []
    for s in sender_ids:
        data.append({
            "uuid": str(s.uuid),
            "alias": s.alias,
            "status": s.status.value if hasattr(s.status, 'value') else s.status,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else None,
            "updated_at": s.updated_at.strftime("%Y-%m-%d %H:%M:%S") if s.updated_at else None,
        })

    return {
        "success": True,
        "message": f"Sender IDs retrieved for user {current_user.username}",
        "data": data
    }

@router.get("/requests")
async def get_user_sender_id_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requests = db.query(SenderIdRequest).filter(
        SenderIdRequest.user_id == current_user.id
    ).order_by(SenderIdRequest.created_at.desc()).all()

    data = []
    for r in requests:
        data.append({
            "uuid": str(r.uuid),
            "sender_alias": r.sender_alias,
            "status": r.status.value if hasattr(r.status, "value") else r.status,
            "is_student_request": r.is_student_request,
            "student_id_path": r.student_id_path,
            "document_path": r.document_path,
            "company_name": r.company_name,
            "sample_message": r.sample_message,
            "remarks": r.remarks,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else None,
            "updated_at": r.updated_at.strftime("%Y-%m-%d %H:%M:%S") if r.updated_at else None,
        })

    return {
        "success": True,
        "message": f"{len(data)} sender ID requests retrieved for user {current_user.username}",
        "data": data
    }

@router.get("/requests/{sender_request_uuid}/download-agreement")
async def download_sender_id_agreement(
    sender_request_uuid: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Fetch request and verify ownership
    request_obj = db.query(SenderIdRequest).filter(
        SenderIdRequest.uuid == sender_request_uuid,
        SenderIdRequest.user_id == current_user.id
    ).first()

    if not request_obj:
        raise HTTPException(status_code=404, detail="Sender ID request not found or unauthorized")

    # Include student note only if request is a student request
    student_note_html = f"""
    <p><strong>Special student provision</strong></p>
    <div class="note">
    You have provided a verified student ID and are now signing this Agreement. By signing, you confirm that you will use the temporary sender ID <strong>EasyTextAPI</strong> for testing and academic purposes only. This ID is pre-configured for students and intended solely for project or educational use.
    </div>
    """ if request_obj.is_student_request else ""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Sender ID Agreement — SEWMR TECHNOLOGIES</title>
<style>
body {{ font-family: Arial, Helvetica, sans-serif; font-size:12px; line-height:1.45; color:#222; margin:0; padding:0; }}
.wrap {{ width:100%; box-sizing:border-box; }}
.header-table {{ width:100%; border-collapse: collapse; margin-bottom:18px; }}
.header-left {{ vertical-align: top; padding-right: 10px; }}
.header-right {{ text-align:right; vertical-align:top; padding-left:10px; }}
.company-name {{ font-size:18px; font-weight:bold; margin:0 0 4px 0; }}
.company-meta {{ font-size:11px; color:#444; margin:0; }}
.title {{ text-align:center; font-size:16px; font-weight:bold; margin:10px 0 18px 0; text-transform:uppercase; }}
.box {{ width:100%; border: none; padding:12px; margin-bottom:14px; }}
.box .heading {{ font-size:12px; font-weight:bold; margin-bottom:8px; text-decoration:underline; }}
.dl-table {{ width:100%; border-collapse: collapse; margin-top:6px; }}
.dl-table td {{ vertical-align: top; padding:2px 6px; font-size:12px; }}
.dl-key {{ width:30%; font-weight:bold; color:#333; }}
.dl-val {{ width:70%; color:#222; }}
.agreement {{ margin:14px 0; text-align:justify; font-size:12px; }}
.agreement ul {{ margin:8px 0 8px 18px; }}
.agreement li {{ margin:6px 0; }}
.sign-table {{ width:100%; border-collapse: collapse; margin-top:12px; }}
.sign-cell {{ width:50%; padding-top:30px; vertical-align: bottom; text-align:center; font-size:12px; }}
.sig-line {{ display:block; border-top:1px solid #444; width:85%; margin:0 auto 6px auto; height:1px; }}
.sig-caption {{ font-size:11px; color:#444; }}
.footer {{ border-top:1px solid #e6e6e6; margin-top:24px; padding-top:8px; font-size:11px; color:#666; text-align:center; }}
.meta {{ font-size:10px; color:#666; margin-top:6px; }}
.note {{ background:#fff7e6; border:1px solid #f1d6a7; padding:8px; margin-top:10px; font-size:12px; }}
</style>
</head>
<body>
<div class="wrap">

<table class="header-table">
<tr>
<td class="header-left" style="width:65%;">
<div class="company-name">SEWMR TECHNOLOGIES</div>
<p class="company-meta">P.O Box 15961</p>
<p class="company-meta">Nairobi Road, Ngarenaro</p>
<p class="company-meta">Arusha, Tanzania</p>
</td>
<td class="header-right" style="width:35%;">
<img src="https://data.sewmrtechnologies.com/assets/images/sewmrtech-logo.png" style="max-height:50px; display:block; margin-left:auto;">
<p class="company-meta" style="margin-top:6px;">Phone: +255 653 750 805 • Email: support@sewmrsms.co.tz</p>
</td>
</tr>
</table>

<div class="title">SENDER ID REQUEST AGREEMENT</div>

<div class="box" style="border:none;">
  <div class="heading">Service Provider</div>
  <table class="dl-table" style="border:none; border-collapse: collapse;">
    <tr>
      <td class="dl-key" style="border:none;">Business Name</td>
      <td class="dl-val" style="border:none;">SEWMR SMS</td>
    </tr>
    <tr>
      <td class="dl-key" style="border:none;">Company</td>
      <td class="dl-val" style="border:none;">SEWMR TECHNOLOGIES</td>
    </tr>
    <tr>
      <td class="dl-key" style="border:none;">Address</td>
      <td class="dl-val" style="border:none;">P.O Box 15961, Nairobi Road, Ngarenaro, Arusha, Tanzania</td>
    </tr>
  </table>
</div>

<div class="box" style="border:none;">
  <div class="heading">Client</div>
  <table class="dl-table" style="border:none; border-collapse: collapse;">
    <tr>
      <td class="dl-key" style="border:none;">Company / Organization</td>
      <td class="dl-val" style="border:none;">{request_obj.company_name}</td>
    </tr>
    <tr>
      <td class="dl-key" style="border:none;">Requested Sender ID</td>
      <td class="dl-val" style="border:none;">{request_obj.sender_alias}</td>
    </tr>
    <tr>
      <td class="dl-key" style="border:none;">Sample Message</td>
      <td class="dl-val" style="border:none;">{request_obj.sample_message}</td>
    </tr>
  </table>
</div>

<div class="agreement">
<p>This Sender ID Agreement ("Agreement") is entered into by and between 
<strong>SEWMR TECHNOLOGIES, the owner and operator of SEWMR SMS</strong> ("Provider") 
and the Client identified above ("Client"). The Provider agrees to assign 
and enable the requested Sender ID for the Client subject to the terms set out below.</p>

<p><strong>Terms and obligations</strong></p>
<ul>
<li>The Client shall only use the assigned Sender ID for legitimate, lawful communications. The Client must not send unsolicited marketing, phishing, fraudulent, offensive, or otherwise prohibited messages.</li>
<li>The Client is solely responsible for the content of messages sent using the Sender ID and must comply with local and international regulations, carrier policies, and data protection rules.</li>
<li>Provider reserves the right to suspend, revoke, or modify the Sender ID if misuse, abuse, or network non-compliance is detected.</li>
<li>The Client will cooperate with Provider and carriers in any investigations related to message complaints or regulatory inquiries.</li>
<li>This Agreement is governed by the laws of the United Republic of Tanzania and any disputes shall be subject to the competent courts in Tanzania.</li>
</ul>

{student_note_html}

<p style="margin-top:12px;">Both parties agree to the terms above and indicate acceptance by signing below.</p>
</div>

<table class="sign-table">
<tr>
<td class="sign-cell">
<span class="sig-line"></span>
<div class="sig-caption">For SEWMR TECHNOLOGIES — Authorized Signatory</div>
<div class="meta">Name: ______________________ &nbsp;&nbsp; Date: __ / __ / ____</div>
</td>
<td class="sign-cell">
<span class="sig-line"></span>
<div class="sig-caption">For Client — Authorized Signatory</div>
<div class="meta">Name: ______________________ &nbsp;&nbsp; Date: __ / __ / ____</div>
</td>
</tr>
</table>

<div class="footer">
SEWMR TECHNOLOGIES • SEWMR SMS — P.O Box 15961, Nairobi Road, Ngarenaro, Arusha, Tanzania • support@sewmrsms.co.tz
</div>

</div>
</body>
</html>
"""

    pdf_file = BytesIO()
    pisa_status = pisa.CreatePDF(html_content, dest=pdf_file)
    if pisa_status.err:
        raise HTTPException(status_code=500, detail="Error generating PDF")
    pdf_file.seek(0)

    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=sender_id_agreement_{request_obj.sender_alias}.pdf"}
    )