import os
from dotenv import load_dotenv

load_dotenv()


def _normalize_db_url(url: str | None) -> str | None:
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


DATABASE_URL = _normalize_db_url(os.getenv("DATABASE_URL"))
LANGRAPH_DATABASE_URL = _normalize_db_url(
    os.getenv("LANGGRAPH_DATABASE_URL") or os.getenv("DATABASE_URL")
)

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing from environment variables or .env")

if not LANGRAPH_DATABASE_URL:
    raise RuntimeError("LANGGRAPH_DATABASE_URL is missing from environment variables or .env")


