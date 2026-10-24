from fastapi import FastAPI, Depends, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.email import EmailResponse, EmailRequest
from app.services.email_service import process_email
from app.api.routes.emails import router
from app.api.routes.approvals import approval_router
from app.api.routes.gmail import gmail_router
from app.graph.graph import ensure_checkpointer_ready, pool
from fastapi.middleware.cors import CORSMiddleware
import os

app= FastAPI(
    title="Autonomous Email Agent",
    description="AI-powered email analysis and reply generation",
    version="0.1.0"
)

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
frontend_env = os.environ.get("FRONTEND_URL")
if frontend_env:
    clean_url = frontend_env.split("?")[0].rstrip("/")
    if clean_url and not clean_url.startswith(("http://", "https://")):
        clean_url = f"https://{clean_url}"
    if clean_url and clean_url not in allowed_origins:
        allowed_origins.append(clean_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(approval_router)
app.include_router(gmail_router)

@app.get("/health")
def health_check():
    return {"status":"ok"}

@app.post("/emails/process", response_model=EmailResponse)
def process_email_api(
    email: EmailRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    from app.api.routes.deps import get_current_user_optional
    current_user = get_current_user_optional(request, db)

    email_data = email.model_dump()
    if current_user:
        email_data["account_id"] = current_user.id

    result = process_email(email_data, db)
    return result

@app.get("/privacy")
def privacy_policy():
    """Redirect to frontend Privacy Policy page for Google verification compliance."""
    from fastapi.responses import RedirectResponse
    base_fe = os.environ.get("FRONTEND_URL", "http://localhost:5173").split("?")[0].rstrip("/")
    return RedirectResponse(f"{base_fe}/#privacy", status_code=302)

@app.get("/terms")
def terms_of_service():
    """Redirect to frontend Terms of Service page for Google verification compliance."""
    from fastapi.responses import RedirectResponse
    base_fe = os.environ.get("FRONTEND_URL", "http://localhost:5173").split("?")[0].rstrip("/")
    return RedirectResponse(f"{base_fe}/#terms", status_code=302)

@app.on_event("startup")
def startup():
    from app.db.database import Base, engine
    import app.db.models.email
    import app.db.models.email_account
    Base.metadata.create_all(bind=engine)
    ensure_checkpointer_ready()

@app.on_event("shutdown")
def shutdown():
    pool.close()