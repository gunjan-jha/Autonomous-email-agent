from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.email import EmailRecord
from app.db.models.email_account import EmailAccount
from app.api.routes.deps import get_current_user

router = APIRouter(prefix="/emails", tags=["Emails"])

@router.get("")
def list_emails(
    status: str | None = None,
    category: str | None = None,
    is_spam: bool | None = None,
    limit: int = 50,
    current_user: EmailAccount = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(EmailRecord).filter(EmailRecord.account_id == current_user.id)
    if status:
        query = query.filter(EmailRecord.send_status == status)
    if category:
        query = query.filter(EmailRecord.email_category == category)
    if is_spam is not None:
        query = query.filter(EmailRecord.is_spam == is_spam)

    records = query.order_by(EmailRecord.created_at.desc()).limit(limit).all()

    # Calculate overall stats scoped to this user
    user_scope = db.query(EmailRecord).filter(EmailRecord.account_id == current_user.id)
    total = user_scope.count()
    pending = user_scope.filter(EmailRecord.send_status == "pending_approval").count()
    spam = user_scope.filter(EmailRecord.is_spam.is_(True)).count()
    approved = user_scope.filter(EmailRecord.human_decision == "approved").count()

    return {
        "stats": {
            "total": total,
            "pending_approval": pending,
            "spam_blocked": spam,
            "approved": approved,
        },
        "emails": [
            {
                "email_id": r.email_id,
                "thread_id": r.thread_id,
                "sender": r.sender,
                "recipient": r.recipient,
                "subject": r.subject,
                "body": r.body,
                "is_spam": r.is_spam,
                "spam_reason": r.spam_reason,
                "category": r.email_category,
                "priority": r.priority,
                "risk_level": r.risk_level,
                "requires_approval": r.requires_approval,
                "draft": r.draft,
                "verification": r.verification_result,
                "human_decision": r.human_decision,
                "human_feedback": r.human_feedback,
                "send_status": r.send_status,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            for r in records
        ],
    }

@router.get("/{email_id}")
def get_email(
    email_id: str,
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

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Email record not found",
        )

    return {
        "email_id":record.email_id,
        "thread_id":record.thread_id,
        "sender":record.sender,
        "recipient":record.recipient,
        "subject":record.subject,
        "body":record.body,
        "is_spam": record.is_spam,
        "spam_reason": record.spam_reason,
        "category": record.email_category,
        "priority": record.priority,
        "risk_level": record.risk_level,
        "requires_approval": record.requires_approval,
        "draft": record.draft,
        "verification": record.verification_result,
        "human_decision": record.human_decision,
        "human_feedback": record.human_feedback,
        "send_status": record.send_status,
        "created_at": record.created_at,
        "updated_at": record.updated_at
    }
