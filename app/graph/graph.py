from app.graph.state import EmailState
from langgraph.graph import StateGraph,START,END
from app.nodes.analyze_email import analyze_email
from app.nodes.handlers import handle_spam,draft_reply,handle_verification_failure
from app.nodes.handlers import handle_rejection
from app.nodes.verify import verify_reply
from app.nodes.approval import require_approval
from app.nodes.send import send_reply
from langgraph.checkpoint.memory import MemorySaver
from app.core.config import LANGRAPH_DATABASE_URL
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from langgraph.checkpoint.postgres import PostgresSaver
import os

# 1. Decide where to go after analyzing this email
def route_after_analysis(state: EmailState):
    is_spam = state.get("is_spam")
    if is_spam is True or str(is_spam).lower() == "true":
        print(f"[ROUTING] Email {state.get('email_id')} is classified as SPAM. Ending workflow without drafting reply.", flush=True)
        return "spam"
    
    print(f"[ROUTING] Email {state.get('email_id')} is legitimate ({state.get('email_category')}). Routing to draft_reply.", flush=True)
    return "draft_reply"

#Decide what to after verifying the email.
def route_after_verification(state:EmailState):
    result = state.get('verification_result',{})

    approved = result.get("approved") is True or str(result.get("approved")).lower() == "true"
    #The draft failed verification.
    if not approved:
        if state.get("verification_attempts",0) < 2:
            return "retry"
        return "failed"

    #A human must approve before sending.
    requires_human = (
        state.get("requires_approval") is True
        or str(state.get("requires_approval")).lower() == "true"
        or result.get("requires_human") is True
        or str(result.get("requires_human")).lower() == "true"
    )
    if requires_human:
        return "approval"

    return "send"


#Decide what to do after human approval.
def route_after_approval(state:EmailState):
    if state.get("human_decision") =="approved":
        return "send"
    return "rejected"

#build the graph

builder= StateGraph(EmailState)
builder.add_node("analyze_email",analyze_email)
builder.add_node("handle_spam",handle_spam)
builder.add_node("draft_reply",draft_reply)
builder.add_node("verify_reply",verify_reply)
builder.add_node("require_approval",require_approval)
builder.add_node("send_reply",send_reply)

builder.add_node(
    "handle_verification_failure",
    handle_verification_failure
)
builder.add_node("handle_rejection",handle_rejection)

#Entry point.
builder.add_edge(START,"analyze_email")

#analysis routing

builder.add_conditional_edges(
    "analyze_email",
    route_after_analysis,{
        "spam":"handle_spam",
        "draft_reply":"draft_reply"
    }
)

#Main processing pipleline.
builder.add_edge("draft_reply","verify_reply")

#verification routing.
builder.add_conditional_edges(
    "verify_reply",
    route_after_verification,{
        "retry":"draft_reply",
        "failed":"handle_verification_failure",
        "approval":"require_approval",
        "send":"send_reply"
    }
)

#human approval routing.
builder.add_conditional_edges(
    "require_approval",
    route_after_approval,
    {
        "send":"send_reply",
        "rejected":"handle_rejection",
    },
)

#Terminal nodes.
builder.add_edge("handle_spam",END)
builder.add_edge("handle_verification_failure",END)
builder.add_edge("handle_rejection",END)
builder.add_edge("send_reply",END)

#checkpointing allows interrupted executions to resume.
checkpoint_db_url = LANGRAPH_DATABASE_URL
if not checkpoint_db_url:
    raise RuntimeError("LANGGRAPH_DATABASE_URL is missing from .env")

pool = ConnectionPool(
    conninfo=checkpoint_db_url,
    min_size=1,
    max_size=10,
    kwargs={
        "autocommit":True,
        "row_factory": dict_row,
    },
    open=False,
)
checkpointer =PostgresSaver(pool)
graph = builder.compile(checkpointer=checkpointer)

def ensure_checkpointer_ready():
    """Ensure connection pool is opened and checkpoint tables exist."""
    try:
        pool.open(wait=True)
    except Exception:
        pass  # already open
    checkpointer.setup()

# Backward compatibility alias
setup_checkpointer = ensure_checkpointer_ready



