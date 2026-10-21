from pydantic import BaseModel,Field

class ApprovalRequest(BaseModel):
    feedback:str=Field(default="",max_length=2000)
    edited_draft:str | None = Field(default=None, description="Optional user-edited draft reply")