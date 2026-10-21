from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase,sessionmaker
from app.core.config import DATABASE_URL
from collections.abc import Generator
from sqlalchemy.orm import Session


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind =engine,
    autoflush=False,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass


def get_db()-> Generator[Session,None,None]:
    db= SessionLocal()
    try:
        yield db
    finally:
        db.close()