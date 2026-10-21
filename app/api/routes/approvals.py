from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.database import get_db
from app.db.models.email import EmailRecord
from app.db.models.email_account import EmailAccount
from app.schemas.approval import ApprovalRequest
from app.services.approval_service import decide_approval
from app.api.routes.deps import get_current_user

approval_router = APIRouter(prefix="/approvals", tags=["Approvals"])


@approval_router.get("/pending")
def get_pending_approvals(
    current_user: EmailAccount = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(EmailRecord)
        .filter(
            EmailRecord.account_id == current_user.id,
            or_(
                EmailRecord.human_decision.is_(None),
                EmailRecord.human_decision == "",
            ),
            or_(
                EmailRecord.is_spam.is_(False),
                EmailRecord.is_spam.is_(None),
            ),
        )
        .order_by(EmailRecord.created_at.desc())
        .all()
    )

    pending_records = [
        r for r in records
        if r.requires_approval
        or r.send_status == "pending_approval"
        or (r.verification_result and r.verification_result.get("requires_human") is True)
    ]

    return {
        "count": len(pending_records),
        "approvals": [
            {
                "email_id": record.email_id,
                "sender": record.sender,
                "recipient": record.recipient,
                "subject": record.subject,
                "body": record.body,
                "draft": record.draft,
                "risk_level": record.risk_level,
                "priority": record.priority,
                "verification": record.verification_result,
                "send_status": record.send_status,
                "created_at": record.created_at,
            }
            for record in pending_records
        ],
    }


@approval_router.post("/emails/{email_id}/approve")
def approve_email(
    email_id: str,
    request: ApprovalRequest,
    current_user: EmailAccount = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(EmailRecord)
        .filter(
            EmailRecord.email_id == email_id,
            EmailRecord.account_id == current_user.id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Email record not found")

    try:
        return decide_approval(
            email_id=email_id,
            approved=True,
            feedback=request.feedback,
            edited_draft=request.edited_draft,
            db=db,
        )
    except ValueError as exc:
        message = str(exc)
        status_code = 404 if message == "Email record not found" else 409
        raise HTTPException(status_code=status_code, detail=message)


@approval_router.post("/emails/{email_id}/reject")
def reject_email(
    email_id: str,
    request: ApprovalRequest,
    current_user: EmailAccount = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(EmailRecord)
        .filter(
            EmailRecord.email_id == email_id,
            EmailRecord.account_id == current_user.id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Email record not found")

    try:
        return decide_approval(
            email_id=email_id,
            approved=False,
            feedback=request.feedback,
            db=db,
        )
    except ValueError as exc:
        message = str(exc)
        status_code = 404 if message == "Email record not found" else 409
        raise HTTPException(status_code=status_code, detail=message)      