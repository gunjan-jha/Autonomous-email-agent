from app.graph.state import EmailState

def gather_context(state:EmailState):
    history= state.get("conversation_history",[])

    context = [
        {
            "source":"incoming_email",
            "content":(
                f"From :{state['sender']}\n"
                f"Subject:{state['subject']}\n"
                f"Body: {state['body']}"
            )
        }
    ]

    for message in history:
        context.append({
            "source":"conversation_history",
            "content":str(message),
        })
    return {
        "context":context
    }