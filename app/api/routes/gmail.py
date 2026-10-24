import os
import secrets
from app.db.database import get_db
from app.db.models.email_account import EmailAccount
from app.integrations.email.gmail.oauth import create_oauth_flow
from app.integrations.email.token_security import encrypt_token
from dotenv import load_dotenv
from fastapi import APIRouter,Depends,HTTPException,Request
from itsdangerous import BadSignature,URLSafeTimedSerializer
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from app.services.gmail_service import (poll_gmail_accounts,NoGmailAccountFound,GmailSyncCursorExpired,)
import json
from app.integrations.email.token_security import decrypt_token
import httpx
from app.db.models.email_account import EmailAccount
from app.db.models.email import EmailRecord
from sqlalchemy import text
from app.services.gmail_service import delete_user_data
load_dotenv()
gmail_router = APIRouter(
    prefix="/integrations/gmail",
    tags=["Gmail Integration"]
)

serializer= URLSafeTimedSerializer(
    os.environ["APP_SECRET_KEY"],
    salt="gmail-oauth-state"
)


def _is_production() -> bool:
    frontend_url = os.environ.get("FRONTEND_URL", "")
    return bool(
        os.environ.get("RENDER")
        or os.environ.get("ENVIRONMENT") == "production"
        or frontend_url.startswith("https://")
        or "netlify.app" in frontend_url
    )


@gmail_router.get("/connect")
def connect_gmail():
    flow = create_oauth_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true"
    )
    response = RedirectResponse(authorization_url)
    is_prod = _is_production()
    response.set_cookie(
        key="gmail_oauth_state",
        value=serializer.dumps({
            "state": state,
            "code_verifier": flow.code_verifier,
        }),
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        max_age=600,
    )
    return response

@gmail_router.get("/callback")
def gmail_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    error = request.query_params.get("error")
    if error:
        raise HTTPException(
            status_code=400,
            detail="Gmail authorization was not completed.",
        )

    code = request.query_params.get("code")
    state = request.query_params.get("state")
    signed_state = request.cookies.get("gmail_oauth_state")

    print("OAuth callback debug:")
    print("code received:", bool(code))
    print("state received:", bool(state))
    print("state cookie received:", bool(signed_state))
    print("callback URL:", str(request.url))

    if not code or not state or not signed_state:
        raise HTTPException(
            status_code=400,
            detail="Missing OAuth callback parameters.",
        )
    
    try:
        oauth_data = serializer.loads(
            signed_state,
            max_age=600,
        )
    except BadSignature:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OAuth state.",
        )

    expected_state = oauth_data["state"]
    code_verifier = oauth_data["code_verifier"]

    if not secrets.compare_digest(state, expected_state):
        raise HTTPException(
            status_code=400,
            detail="OAuth state validation failed.",
        )

    flow = create_oauth_flow(state=state)
    flow.code_verifier = code_verifier
    flow.fetch_token(code=code)
    credentials = flow.credentials

    gmail = build(
        "gmail",
        "v1",
        credentials=credentials,
        cache_discovery=False,
    )
    profile = gmail.users().getProfile(userId="me").execute()
    account_email = profile["emailAddress"]

    record = (
        db.query(EmailAccount)
        .filter(
            EmailAccount.provider == "gmail",
            EmailAccount.account_email == account_email,
        )
        .first()
    )

    encrypted_credentials = encrypt_token(credentials.to_json())

    if record:
        record.credentials_encrypted = encrypted_credentials
        record.sync_cursor = profile.get("historyId", record.sync_cursor)
    else:
        record = EmailAccount(
            provider="gmail",
            account_email=account_email,
            credentials_encrypted=encrypted_credentials,
            sync_cursor=profile.get("historyId"),
        )
        db.add(record)

    db.commit()
    #1.Generate the session token for this user
    session_token =serializer.dumps({
        "account_id": record.id, 
        "email": record.account_email
        })

    # Redirect to frontend console after successful OAuth connection
    frontend_url = os.environ.get(
        "FRONTEND_URL",
        "http://localhost:5173/?connected=true&view=console"
    )
    if frontend_url and not frontend_url.startswith(("http://", "https://")):
        frontend_url = f"https://{frontend_url}"
    response = RedirectResponse(
        url=frontend_url,
        status_code=303,
    )
    is_prod = _is_production()
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        max_age=60 * 60 * 24 * 30,
    )
    # Clean up the temporary state cookie
    response.delete_cookie(
        "gmail_oauth_state",
        secure=is_prod,
        samesite="none" if is_prod else "lax",
    )
    return response

@gmail_router.get("/accounts")
def list_connected_gmail_accounts(
    request: Request,
    db: Session = Depends(get_db),
):
    """List connected Gmail account for the currently authenticated user."""
    from app.api.routes.deps import get_current_user_optional
    current_user = get_current_user_optional(request, db)
    if not current_user:
        return []

    return [
        {
            "id": current_user.id,
            "provider": current_user.provider,
            "account_email": current_user.account_email,
            "has_sync_cursor": bool(current_user.sync_cursor),
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None,
        }
    ]


@gmail_router.delete("/accounts/{account_id}")
def disconnect_gmail_account(
    account_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Disconnect and remove a linked Gmail account."""
    from app.api.routes.deps import get_current_user
    from fastapi.responses import JSONResponse

    current_user = get_current_user(request, db)
    if current_user.id != account_id:
        raise HTTPException(status_code=403, detail="Not authorized to disconnect this account.")

    account_email = current_user.account_email
    db.delete(current_user)
    db.commit()

    response = JSONResponse(
        content={"status": "success", "message": f"Account {account_email} disconnected."}
    )
    response.delete_cookie("session_token")
    return response


@gmail_router.post("/poll")
async def poll_gmail(
    request: Request,
    limit: int = 1,
    db: Session = Depends(get_db),
):
    from app.api.routes.deps import get_current_user

    current_user = get_current_user(request, db)
    print(f"[POLL] Starting poll for authenticated user: {current_user.account_email}", flush=True)

    try:
        return await poll_gmail_accounts(
            db=db,
            account_id=current_user.id,
            limit=limit,
        )
    except NoGmailAccountFound as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
    except GmailSyncCursorExpired as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc


@gmail_router.delete("/accounts/{account_id}/data")
async def delete_account_and_data(
    account_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Permanently deletes a user's account, all emails, AI drafts, and LangGraph states."""
    from app.api.routes.deps import get_current_user
    from fastapi.responses import JSONResponse

    current_user = get_current_user(request, db)
    if current_user.id != account_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this account data.")

    try:
        result = await delete_user_data(account_id=current_user.id, db=db)
        response = JSONResponse(content=result)
        response.delete_cookie("session_token")
        return response
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))