from app.graph.graph import graph, ensure_checkpointer_ready
from app.utils.utils import content_to_text
from app.db.models.email import EmailRecord
from app.utils.utils import extract_text
import time

def process_email(email_data: dict, db) -> dict:
    """
    Execute the Email Agent workflow for an incoming email.
    """
    start_time = time.perf_counter()
    email_id = email_data["email_id"]

    print(
        f"[EMAIL] Starting process_email | email_id={email_id}",
        flush=True,
    )

    initial_state = {
        **email_data,
        "conversation_history": [],
        "context": [],
        "verification_attempts": 0,
        "human_decision": "",
        "human_feedback": "",
        "send_status": "pending",
    }

    print("[EMAIL] Initial state prepared", flush=True)

    config = {
        "configurable": {
            "thread_id": email_id,
        }
    }

    ensure_checkpointer_ready()
    print("[GRAPH] Calling graph.invoke()", flush=True)
    graph_start = time.perf_counter()

    try:
        result = graph.invoke(initial_state, config=config)

        print(
            f"[GRAPH] graph.invoke() completed in "
            f"{time.perf_counter() - graph_start:.2f}s",
            flush=True,
        )
    except Exception as exc:
        print(
            f"[GRAPH] Execution failed: {type(exc).__name__}: {exc}",
            flush=True,
        )
        raise

    # When graph.invoke() pauses on an interrupt, it returns {"__interrupt__": ...}.
    # The actual accumulated node outputs are saved in the checkpointer snapshot:
    snapshot = graph.get_state(config)
    checkpoint_values = snapshot.values if (snapshot and snapshot.values) else {}
    state_values = {**checkpoint_values, **(result if isinstance(result, dict) else {})}

    is_spam = state_values.get("is_spam") is True or str(state_values.get("is_spam")).lower() == "true"
    is_interrupted = bool(result.get("__interrupt__") or (snapshot and snapshot.next))

    if is_spam:
        send_status = "spam_skipped"
    elif is_interrupted:
        send_status = "pending_approval"
    else:
        send_status = state_values.get("send_status", "processing")

    print("[DB] Preparing EmailRecord", flush=True)

    record = db.query(EmailRecord).filter(EmailRecord.email_id == email_id).first()
    if record is None:
        record = EmailRecord(
            email_id=email_id,
            account_id=email_data.get("account_id"),
            provider_message_id=email_data.get("provider_message_id", email_id),
            thread_id=email_data["thread_id"],
            sender=email_data["sender"],
            recipient=email_data["recipient"],
            subject=email_data["subject"],
            body=email_data["body"],
        )
        db.add(record)
    else:
        if email_data.get("account_id"):
            record.account_id = email_data["account_id"]
        record.provider_message_id = email_data.get("provider_message_id", email_id)
        record.thread_id = email_data["thread_id"]
        record.sender = email_data["sender"]
        record.recipient = email_data["recipient"]
        record.subject = email_data["subject"]
        record.body = email_data["body"]

    record.is_spam = state_values.get("is_spam")
    record.spam_reason = state_values.get("spam_reason")
    record.email_category = state_values.get("email_category")
    record.priority = state_values.get("priority")
    record.risk_level = state_values.get("risk_level")
    record.requires_approval = state_values.get("requires_approval")
    record.draft = extract_text(state_values.get("draft"))
    record.verification_result = state_values.get("verification_result")
    record.human_decision = state_values.get("human_decision")
    record.human_feedback = state_values.get("human_feedback")
    record.send_status = send_status

    print("[DB] Committing record", flush=True)
    db.commit()

    print("[DB] Refreshing record", flush=True)
    db.refresh(record)

    print(
        f"[EMAIL] Completed successfully in "
        f"{time.perf_counter() - start_time:.2f}s",
        flush=True,
    )

    return {
        "email_id": record.email_id,
        "status": record.send_status,
        "draft": record.draft,
        "is_spam": record.is_spam,
        "spam_reason": record.spam_reason,
        "category": record.email_category,
        "priority": record.priority,
        "risk_level": record.risk_level,
        "requires_approval": record.requires_approval,
        "verification": record.verification_result,
        "human_decision": record.human_decision,
    }
