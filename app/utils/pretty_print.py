
from pprint import pprint


def print_email_result(state: dict):
    """Print the Email Agent state in a readable format."""

    print("\n" + "=" * 65)
    print("EMAIL AGENT — EXECUTION REPORT")
    print("=" * 65)

    # Incoming email
    print("\n[1] EMAIL DETAILS")
    print("-" * 65)
    print(f"Email ID : {state.get('email_id', 'N/A')}")
    print(f"From     : {state.get('sender', 'N/A')}")
    print(f"To       : {state.get('recipient', 'N/A')}")
    print(f"Subject  : {state.get('subject', 'N/A')}")
    print(f"Body     : {state.get('body', 'N/A')}")

    # Analysis
    print("\n[2] EMAIL ANALYSIS")
    print("-" * 65)
    print(f"Spam             : {state.get('is_spam', 'N/A')}")
    print(f"Spam reason      : {state.get('spam_reason', 'N/A')}")
    print(f"Category         : {state.get('email_category', 'N/A')}")
    print(f"Priority         : {state.get('priority', 'N/A')}")
    print(f"Risk level       : {state.get('risk_level', 'N/A')}")
    print(f"Requires approval: {state.get('requires_approval', 'N/A')}")

    # Context
    print("\n[3] CONTEXT")
    print("-" * 65)
    context = state.get("context", [])

    if context:
        for index, item in enumerate(context, start=1):
            print(f"{index}. {item}")
    else:
        print("No context available.")

    # Draft
    print("\n[4] GENERATED REPLY")
    print("-" * 65)
    print(state.get("draft") or "No draft generated.")

    # Verification
    print("\n[5] VERIFICATION")
    print("-" * 65)
    verification = state.get("verification_result", {})

    if verification:
        print(f"Approved      : {verification.get('approved', 'N/A')}")
        print(f"Reason        : {verification.get('reason', 'N/A')}")
        print(
            f"Requires human: "
            f"{verification.get('requires_human', 'N/A')}"
        )
    else:
        print("No verification result available.")

    print(
        f"Verification attempts: "
        f"{state.get('verification_attempts', 'N/A')}"
    )

    # Human approval
    print("\n[6] HUMAN APPROVAL")
    print("-" * 65)
    print(f"Decision : {state.get('human_decision') or 'Not required / pending'}")
    print(f"Feedback : {state.get('human_feedback') or 'None'}")

    # Final status
    print("\n[7] EXECUTION STATUS")
    print("-" * 65)
    print(f"Status: {state.get('send_status', 'N/A')}")

    if state.get("error"):
        print(f"Error : {state['error']}")

    print("\n" + "=" * 65)
    print("                 END OF REPORT")
    print("=" * 65)