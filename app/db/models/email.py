from app.db.database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Boolean,DateTime,Integer,JSON,String,Text,func,ForeignKey
from datetime import datetime

class EmailRecord(Base):
    __tablename__="email_records"
    id:Mapped[int]=mapped_column(Integer,primary_key=True,index=True)
    account_id:Mapped[int]=mapped_column(Integer,ForeignKey("email_accounts.id",ondelete="cascade"),
    nullable=False,index=True)
    email_id:Mapped[str]=mapped_column(
        String(255),unique=True,index=True,nullable=False
    )
    provider_message_id:Mapped[str]=mapped_column(String(255),nullable=False,)
    
    thread_id:Mapped[str]=mapped_column(String(255),nullable=False)
    sender:Mapped[str]=mapped_column(String(320),nullable=False)
    recipient:Mapped[str]=mapped_column(String(320),nullable=False)

    subject:Mapped[str]=mapped_column(String(500),nullable=False)
    body:Mapped[str]=mapped_column(Text,nullable=False)
    is_spam:Mapped[bool | None] = mapped_column(Boolean,nullable=True)
    spam_reason:Mapped[str | None]= mapped_column(Text,nullable=True)
    email_category:Mapped[str | None]= mapped_column(String(50),nullable=True)
    priority:Mapped[str | None] = mapped_column(String(50),nullable=True)

    risk_level:Mapped[str|None] =mapped_column(String(50),nullable=True)
    requires_approval:Mapped[bool | None] =mapped_column(Boolean,nullable=True)
    draft:Mapped[str|None]=mapped_column(Text,nullable=True)
    verification_result:Mapped[dict|None]=mapped_column(JSON,nullable=True)

    human_decision:Mapped[str | None] = mapped_column(String(50),nullable=True)
    human_feedback:Mapped[str| None]= mapped_column(Text,nullable=True)

    send_status:Mapped[str]=mapped_column(
        String(50),default="pending",nullable=False
    )

    created_at:Mapped[datetime]=mapped_column(
        DateTime(timezone=True),server_default=func.now(),
    nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    server_default=func.now(),
    onupdate=func.now(),
    nullable=False,
)