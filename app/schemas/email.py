from fastapi import FastAPI
from pydantic import BaseModel,Field

class EmailRequest(BaseModel):
    email_id:str
    thread_id:str
    sender:str
    recipient:str
    subject:str
    body:str

class EmailResponse(BaseModel):
    email_id:str
    status:str
    is_spam:bool | None = None
    category:str | None = None
    priority:str | None = None
    risk_level: str | None = None
    requires_approval:bool | None =None
    draft:str|None =None