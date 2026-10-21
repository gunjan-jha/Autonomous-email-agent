import re
from app.graph.state import EmailState
from app.db.database import SessionLocal
from app.db.models.email_account import EmailAccount
from app.integrations.email.gmail.provider import GmailProvider
from app.utils.utils import extract_text


def _is_truthy(val) -> bool:
    if isinstance(val, str):
        return val.strip().lower() in ("true", "1", "yes")
    return bool(val)


def send_reply(state: EmailState):
    """
    Sends the reply email once verification is approved.
    - If human approval is required, ensures human approval has been granted.
    - If human approval is NOT required, autonomously dispatches the email.
    - If a connected Gmail account is found, dispatches via Gmail API.
    - If no Gmail account is connected, falls back gracefully to dry_run_success.
    """
    verification = state.get("verification_result", {})
    is_verified = _is_truthy(verification.get("approved"))

    if not is_verified:
        print(
            f"[NODE: send_reply] Blocked: verification not approved for email {state.get('email_id')}",
            flush=True,
        )
        return {
            "send_status": "blocked_verification_failed"
        }

    requires_human = (
        _is_truthy(state.get("requires_approval"))
        or _is_truthy(verification.get("requires_human"))
    )

    if requires_human and state.get("human_decision") != "approved":
        print(
            f"[NODE: send_reply] Blocked: human approval required but not granted for email {state.get('email_id')}",
            flush=True,
        )
        return {
            "send_status": "blocked_approval_missing"
        }

    raw_draft = state.get("draft")
    draft = extract_text(raw_draft) if raw_draft else ""
    if not draft or not draft.strip():
        print(
            f"[NODE: send_reply] Blocked: empty draft for email {state.get('email_id')}",
            flush=True,
        )
        return {
            "send_status": "blocked_empty_draft"
        }

    db = SessionLocal()
    try:
        account = None
        account_id = state.get("account_id")
        if account_id:
            account = db.get(EmailAccount, account_id)
        if not account and state.get("recipient"):
            account = (
                db.query(EmailAccount)
                .filter(
                    EmailAccount.account_email == state["recipient"],
                    EmailAccount.provider == "gmail",
                )
                .first()
            )
        if not account:
            account = db.query(EmailAccount).filter_by(provider="gmail").first()

        if not account:
            print(
                f"[NODE: send_reply] No connected Gmail account found for email {state.get('email_id')}. "
                "Marking as dry_run_success.",
                flush=True,
            )
            return {
                "send_status": "dry_run_success"
            }

        sender_header = state.get("sender", "")
        match = re.search(r'<([^>]+)>', sender_header)
        to_email = match.group(1) if match else sender_header.strip()

        print(
            f"[NODE: send_reply] Dispatching reply via Gmail to {to_email} "
            f"(sender={account.account_email}, subject=Re: {state.get('subject')})...",
            flush=True,
        )

        provider = GmailProvider(account_id=account.id, db=db)
        provider.connect_sync()

        sent_msg_id = provider.send_email_sync(
            to_email=to_email,
            subject=state.get("subject", ""),
            body=draft,
            thread_id=state.get("thread_id"),
            in_reply_to=state.get("provider_message_id") or state.get("email_id"),
        )

        print(
            f"[NODE: send_reply] Email reply successfully sent via Gmail! "
            f"Message ID: {sent_msg_id}",
            flush=True,
        )
        return {
            "send_status": "sent"
        }

    except Exception as exc:
        print(f"[NODE: send_reply ERROR] Failed to send email via Gmail: {exc}", flush=True)
        return {
            "send_status": "send_failed"
        }
    finally:
        db.close()