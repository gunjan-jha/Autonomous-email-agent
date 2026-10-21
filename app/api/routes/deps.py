from itsdangerous import BadSignature
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.email_account import EmailAccount
from app.api.routes.gmail import serializer


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
) -> EmailAccount | None:
    """Returns the authenticated EmailAccount if a valid session cookie is present, else None."""
    token = request.cookies.get("session_token")
    if not token:
        return None
    try:
        data = serializer.loads(token, max_age=60 * 60 * 24 * 30)
        return db.get(EmailAccount, data.get("account_id"))
    except Exception:
        return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> EmailAccount:
    """Enforces authentication: returns EmailAccount or raises HTTP 401."""
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Please connect your Gmail account to access this resource.",
        )
    try:
        data = serializer.loads(token, max_age=60 * 60 * 24 * 30)
    except BadSignature:
        raise HTTPException(
            status_code=401,
            detail="Session has expired or is invalid. Please reconnect your account.",
        )

    account = db.get(EmailAccount, data.get("account_id"))
    if not account:
        raise HTTPException(
            status_code=401,
            detail="Connected account not found. Please reconnect your Gmail account.",
        )

    return account