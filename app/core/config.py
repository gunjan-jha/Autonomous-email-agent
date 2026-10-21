import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL= os.getenv("DATABASE_URL")
LANGRAPH_DATABASE_URL=os.getenv("LANGGRAPH_DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing from the .env file")

if not LANGRAPH_DATABASE_URL:
    raise RuntimeError("LANGGRAPH_DATABASE_URL is missing from .env")

