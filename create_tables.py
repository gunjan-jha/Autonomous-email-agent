from app.db.database import Base,engine
from app.db.models.email import EmailRecord
from app.db.models.email_account import EmailAccount

Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")
