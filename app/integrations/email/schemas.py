from pydantic import BaseModel,Field
from datetime import datetime

class EmailMessage(BaseModel):
    provider:str
    account_id:str

    provider_message_id:str
    provider_thread_id:str | None = None

    sender:str
    recipient:str
    subject:str
    body:str

    received_at:datetime | None = None
    in_reply_to:str | None = None
    metadata: dict =Field(default_factory=dict)