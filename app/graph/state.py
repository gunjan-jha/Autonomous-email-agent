from typing import TypedDict
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
from typing import TypedDict,List,Dict,Any,Optional
from pydantic import BaseModel,Field
load_dotenv()

from typing import TypedDict


class EmailState(TypedDict):
    # Incoming email
    email_id: str
    thread_id: str
    sender: str
    recipient: str
    subject: str
    body: str
    account_id: Optional[int]
    provider_message_id: Optional[str]

    # Analysis
    is_spam: bool
    spam_reason: str
    email_category: str
    priority: str
    risk_level: str
    requires_approval: bool

    # Later stages
    conversation_history: list
    context: list

    #Draft and verification
    draft: str
    verification_result: dict
    verification_attempts: int

    # Human approval
    human_decision: str
    human_feedback: str

    # Execution
    send_status: str


class EmailAnalysis(BaseModel):
    is_spam:bool=Field(
        description="Whether the email is spam"
    )
    spam_reason:str=Field(
        description="Why the email is considered legitimate or spam"
    )
    email_category:str=Field(
        description="Category such as inquiry, complaint,thank_you,scheduling,sales,etc."
    )
    priority:str=Field(
        description="Priority: low,medium or high"
    )

    risk_level:str=Field(
        description="Risk level:low ,medium or high"
    )
    requires_approval:bool=Field(
        description="whether a human must approve the response before sending."
    )

def analyze_email(state:EmailState):
    """
    analyze the email
    """
    model = ChatGoogleGenerativeAI(
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
    structured_model = model.with_structured_output(EmailAnalysis)
    response=structured_model.invoke(prompt)

    #Return state updates
    return {
       "is_spam": response.is_spam,
        "spam_reason": response.spam_reason,
        "email_category": response.email_category,
        "priority": response.priority,
        "risk_level": response.risk_level,
        "requires_approval": response.requires_approval,
    }
    
def route_after_analysis(state:EmailState):
    if state["is_spam"]:
        return  "spam"
    if state["requires_approval"]:
        return "approval"
    return "auto"


initial_state={
    "email_id":"email-001",
    "thread_id":"thread-001",
    "sender":"john@example.com",
    "recipient":"gunjan@example.com",
    "subject":"Meeting tomorrow",
    "body":"Hi, gunjan can we move our meeting from 3pm to 5pm?"
}