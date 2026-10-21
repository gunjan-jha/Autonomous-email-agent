import asyncio
from sqlalchemy.orm import Session
from app.db.models.email import EmailRecord
from app.db.models.email_account import EmailAccount
from app.integrations.email.gmail.provider import (GmailProvider,HistoryCursorExpired,)
from app.services.email_service import process_email
import json
from app.integrations.email.token_security import decrypt_token
import httpx
from app.db.models.email_account import EmailAccount
from app.db.models.email import EmailRecord
from sqlalchemy import text
from fastapi import APIRouter,Depends,HTTPException,Request
from app.db.database import get_db


class NoGmailAccountFound(Exception):
    """Raised when no connected Gmail account exists."""

class GmailSyncCursorExpired(Exception):
    """Raised when Gmail's history cursor is no longer valid."""


async def poll_gmail_accounts(
    db: Session,
    account_id: int | None = None,
    limit: int = 1,
) -> dict:
    print("[POLL] Starting Gmail poll", flush=True)

    query = db.query(EmailAccount).filter(
        EmailAccount.provider == "gmail"
    )

    if account_id is not None:
        query = query.filter(EmailAccount.id == account_id)

    accounts = query.all()
    print(f"[POLL] Found {len(accounts)} account(s)", flush=True)

    if not accounts:
        raise NoGmailAccountFound(
            "No connected Gmail account found."
        )

    results = []

    for account in accounts:
        print(f"[POLL] Connecting {account.account_email}", flush=True)

        provider = GmailProvider(
            account_id=account.id,
            db=db,
        )

        emails_found = 0
        emails_processed = 0
        emails_skipped = 0

        try:
            await provider.connect()
            print("[POLL] Gmail connected", flush=True)

            async for message in provider.fetch_new_messages():
                emails_found += 1
                print(
                    f"[POLL] Received message "
                    f"{message.provider_message_id}",
                    flush=True,
                )

                existing = (
                    db.query(EmailRecord)
                    .filter(
                        EmailRecord.provider_message_id
                        == message.provider_message_id
                    )
                    .first()
                )

                if existing:
                    emails_skipped += 1
                    continue

                email_data = {
                    "account_id": account.id,
                    "email_id": message.provider_message_id,
                    "provider_message_id": message.provider_message_id,
                    "thread_id": (
                        message.provider_thread_id
                        or message.provider_message_id
                    ),
                    "sender": message.sender,
                    "recipient": message.recipient,
                    "subject": message.subject,
                    "body": message.body,
                }

                print("[POLL] Starting LangGraph processing", flush=True)
                await asyncio.to_thread(process_email, email_data, db)
                print("[POLL] LangGraph processing completed", flush=True)

                emails_processed += 1

                if emails_processed >= limit:
                    print(
                        f"[POLL] Reached limit ({limit} message). Stopping poll.",
                        flush=True,
                    )
                    break

            # Reached only after message iteration finishes successfully.
            if provider.latest_history_id:
                account.sync_cursor = str(
                    provider.latest_history_id
                )
                db.commit()

            results.append({
                "account": account.account_email,
                "status": "success",
                "emails_found": emails_found,
                "emails_processed": emails_processed,
                "emails_skipped": emails_skipped,
            })

        except HistoryCursorExpired as exc:
            db.rollback()
            raise GmailSyncCursorExpired(
                f"Gmail history cursor expired for "
                f"{account.account_email}. "
                "A resynchronization is required."
            ) from exc

        except Exception:
            db.rollback()
            raise

    return {
        "status": "success",
        "accounts_polled": len(results),
        "results": results,
    }

async def delete_user_data(account_id:int,db:Session=Depends(get_db))->dict:
    #Fetch the user's account
    account = db.get(EmailAccount,account_id)
    if not account:
        raise ValueError("Account not found")
    
    #Revoke OAuth token at Google (best-effort)
    try:
        creds_data= json.loads(decrypt_token(account.credentials_encrypted))
        token_to_revoke =creds_data.get("refresh_token") or creds_data.get("token")
        if token_to_revoke:
            async with httpx.AsyncClient() as client:
                await client.post(
                    "https://oauth2.googleapis.com/revoke",
                    params={"token": token_to_revoke},
                    headers={"Content-type":
                    "application/x-www-form-urlencoded"}
                )
    except Exception as e:
        # Logging this error is optional — the important part is deleting local data
        print(f"[CLEANUP] Could not revoke Google token: {e}")
     # 3. Find all email_ids belonging to this user for LangGraph checkpoint cleanup
    user_email_ids = [
        row[0] for row in db.query(EmailRecord.email_id).filter(EmailRecord.account_id == account_id).all()
    ]
    # 4. Clean up LangGraph checkpoints in PostgreSQL
    if user_email_ids:
        # LangGraph stores checkpoints keyed by thread_id
        db.execute(
            text("DELETE FROM checkpoint_blobs WHERE thread_id = ANY(:ids)"),
            {"ids": user_email_ids}
        )
        db.execute(
            text("DELETE FROM checkpoint_writes WHERE thread_id = ANY(:ids)"),
            {"ids": user_email_ids}
        )
        db.execute(
            text("DELETE FROM checkpoints WHERE thread_id = ANY(:ids)"),
            {"ids": user_email_ids}
        )
    # 5. Delete EmailRecords (or let CASCADE handle it)
    db.query(EmailRecord).filter(EmailRecord.account_id == account_id).delete()
    # 6. Delete the EmailAccount record
    db.delete(account)
    db.commit()
    return {
        "status": "success",
        "deleted_account": account.account_email,
        "emails_removed": len(user_email_ids)
    }