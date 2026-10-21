from app.db.database import Base
from datetime import datetime
from sqlalchemy import (
    DateTime,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column


class EmailAccount(Base):
    __tablename__ = "email_accounts"

    __table_args__ = (
        UniqueConstraint(
            "provider",
            "account_email",
            name="uq_email_account_provider_email",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    account_email: Mapped[str] = mapped_column(String, nullable=False)

    #Encrypted JSON containing OAuth credentials.
    credentials_encrypted:Mapped[str]=mapped_column(
        Text,nullable=False
    )

    #Provider-specific synchronozation cursor e.g Gmail historyId.
    sync_cursor:Mapped[str | None]=mapped_column(
        String(200),nullable=True
    )

    created_at:Mapped[datetime]=mapped_column(
        DateTime(timezone=True),
        server_default = func.now(),
        nullable =False,
    )

    updated_at:Mapped[datetime]=mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
