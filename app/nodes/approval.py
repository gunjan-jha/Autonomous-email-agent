from app.graph.state import EmailState
from langgraph.types import interrupt

def require_approval(state: EmailState):
    print(f"[NODE] require_approval triggered for email_id={state['email_id']} - Pausing workflow for human review", flush=True)
    decision = interrupt({
        "email_id": state["email_id"],
        "sender": state["sender"],
        "subject": state["subject"],
        "original_email": state["body"],
        "draft": state.get("draft", ""),
        "reason": (
            state.get("verification_result", {}).get("reason")
            or state.get("spam_reason", "")
            or "This email requires human review."
        ),
        "risk_level": state.get("risk_level", "unknown"),
    })

    if (
        isinstance(decision,dict)
        and decision.get("approved") is True
    ):
        return {
            "human_decision":"approved",
            "human_feedback":decision.get("feedback",""),
            "draft": decision.get("draft") or state.get("draft", ""),
            "send_status":"approved_for_sending",
        }

    return {
        "human_decision":"rejected",
        "human_feedback":decision.get("feedback",""),
        "send_status":"rejected"
    }
