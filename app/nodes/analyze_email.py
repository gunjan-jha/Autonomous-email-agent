from app.graph.state import EmailState
from app.graph.state import EmailAnalysis
from langchain_google_genai import ChatGoogleGenerativeAI
import os

def analyze_email(state:EmailState):
    """
    analyze the email
    """
    model = ChatGoogleGenerativeAI(
        request_timeout=30.0,
        model="gemini-3.8-flash",
        api_key=os.getenv("GOOGLE_API_KEY")
    )
    prompt=f""" 
    Analyze this email and determine if it is spam or legitimate.
    Email:
    From:{state['sender']}
    Subject:{state['subject']}
    Body:{state['body']}
    First,determine if this email is spam explain why and give reason if it is legitimate catgorize it (inquiry,complaint,thank you etc )
    """
    print("[NODE] Starting analyze_email...", flush=True)
    structured_model = model.with_structured_output(EmailAnalysis)
    response=structured_model.invoke(prompt)
    print(f"[NODE] analyze_email finished | is_spam={response.is_spam}, category={response.email_category}", flush=True)

    #Return state updates
    return {
       "is_spam": response.is_spam,
        "spam_reason": response.spam_reason,
        "email_category": response.email_category,
        "priority": response.priority,
        "risk_level": response.risk_level,
        "requires_approval": response.requires_approval,
    }