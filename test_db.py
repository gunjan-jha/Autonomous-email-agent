import traceback
from sqlalchemy import text
from app.db.database import engine

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT current_database(), current_user"))
        print("Connection successful!")
        print(result.fetchone())
except Exception:
    traceback.print_exc()