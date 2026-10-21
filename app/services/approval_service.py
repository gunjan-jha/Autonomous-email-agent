import re
from sqlalchemy.orm import Session
from app.db.models.email import EmailRecord
from app.db.models.email_account import EmailAccount
from app.graph.graph import graph
from langgraph.types import Command
from app.integrations.email.gmail.provider import GmailProvider

def dispatch_approved_reply(record: EmailRecord, db: Session) -> dict:
    """
    Sends the approved draft to the original sender via the Gmail API.
    If no Gmail account is connected, falls back gracefully to dry run.
    """
    account = None
    if getattr(record, "account_id", None):
        account = db.get(EmailAccount, record.account_id)
    if not account:
        account = db.query(EmailAccount).filter_by(provider="gmail").first()

    if not account:
        print(f"[SEND] No connected Gmail account found for email {record.email_id}. Marking dry_run_success.", flush=True)
        return {
            "status": "dry_run_success",
            "message": "No connected Gmail account found; email recorded as dry run success."
        }

    # Extract pure email from sender header (e.g., 'Gunjan Jha <gkjha20016@gmail.com>' -> 'gkjha20016@gmail.com')
    match = re.search(r'<([^>]+)>', record.sender)
    to_email = match.group(1) if match else record.sender.strip()

    try:
        provider = GmailProvider(account_id=account.id, db=db)
        provider.connect_sync()

        print(f"[SEND] Dispatching email via Gmail to {to_email} (Subject: Re: {record.subject})...", flush=True)

        sent_msg_id = provider.send_email_sync(
            to_email=to_email,
            subject=record.subject,
            body=record.draft or "",
            thread_id=record.thread_id,
            in_reply_to=record.provider_message_id,
        )

        print(f"[SEND] Successfully sent via Gmail! Message ID: {sent_msg_id}", flush=True)
        return {
            "status": "sent",
            "provider_message_id": sent_msg_id,
            "message": f"Email successfully sent to {to_email} via Gmail."
        }
    except Exception as exc:
        print(f"[SEND ERROR] Failed to send email via Gmail: {exc}", flush=True)
        raise RuntimeError(f"Gmail send failed: {exc}") from exc


def decide_approval(
        email_id: str,
        approved: bool,
        feedback: str,
        db: Session,
        edited_draft: str | None = None,
) -> dict:
        record = (
            db.query(EmailRecord)
            .filter(EmailRecord.email_id == email_id)
            .first()
        )

        if record is None:
            raise ValueError("Email record not found")

        if record.human_decision in ("approved", "rejected"):
            raise ValueError("A decision has already been recorded")

        if edited_draft:
            record.draft = edited_draft

        config = {"configurable": {"thread_id": email_id}}
        checkpoint = graph.get_state(config)

        if checkpoint.values and checkpoint.next and "require_approval" in checkpoint.next:
            decision = {
                "approved": approved,
                "feedback": feedback,
                "draft": edited_draft or record.draft,
            }

            result = graph.invoke(
                Command(resume=decision),
                config=config,
            )

            record.human_decision = "approved" if approved else "rejected"
            record.human_feedback = feedback
            record.send_status = result.get("send_status", "approved_for_sending")
        else:
            # Workflow finished or was flagged during verification: record decision directly
            record.human_decision = "approved" if approved else "rejected"
            record.human_feedback = feedback
            record.send_status = "approved_for_sending" if approved else "rejected"

        # Dispatch real email via Gmail when approved (if not already sent by send_reply node)
        if approved and record.send_status not in ("sent", "dry_run_success"):
            try:
                send_result = dispatch_approved_reply(record, db)
                record.send_status = send_result["status"]
            except Exception as send_err:
                record.send_status = "send_failed"
                db.commit()
                db.refresh(record)
                raise ValueError(str(send_err))

        db.commit()
        db.refresh(record)

        return {
            "email_id": record.email_id,
            "human_decision": record.human_decision,
            "send_status": record.send_status,
        }
