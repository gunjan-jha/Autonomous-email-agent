from langgraph.types import Command
from app.graph.graph import graph
from app.utils.pretty_print import print_email_result

initial_state = {
    "email_id": "test-email-001",
    "thread_id": "test-thread-001",
    "sender": "customer@example.com",
    "recipient": "support@example.com",
    "subject": "Regarding refund of payment",
    "body": (
       "I ask you refund my paymnet otherwise i will file a complaint against your company in consumer court. So please refund my paymant as soon as possible."
    ),
    "conversation_history": [],
    "context": [],
    "verification_attempts": 0,
    "human_decision": "",
    "human_feedback": "",
    "send_status": "pending",
}

config={
    "configurable":{
        "thread_id":"test-email-001"
    }
}

#start the graph
result = graph.invoke(initial_state,config=config)

#if the graph paused for approval, resume the same execution.
if result.get("__interrupt__"):
    decision =input("Approve this reply? (yes/no): ").strip().lower()
    feedback =input("Feedback (optional): ").strip()
    resume_value ={
        "approved":decision == "yes",
        "feedback":feedback,
    }

    result =graph.invoke(
        Command(resume=resume_value),
        config=config,
    )
print("Final state:")
print_email_result(result)
print("Send status:",result.get('send_status'))