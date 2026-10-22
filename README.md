<div align="center">

# 📬 Mailroom — Autonomous Email Agent

**An intelligent, human-in-the-loop AI email assistant and inbox copilot powered by LangGraph, Google Gemini, FastAPI, and React.**

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph-orange.svg)](https://langchain-ai.github.io/langgraph/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.8%20Flash-4285F4.svg)](https://aistudio.google.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

[Features](#-key-features) • [Architecture](#-agent-workflow--architecture) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start-guide) • [API Reference](#-api-endpoints) • [Deployment](#-deployment)

</div>

---

## 🌟 Overview

**Mailroom** is an autonomous email agent designed to triage, summarize, draft, and dispatch email communications with strict safety guardrails. Built on **LangGraph**'s cyclical state machine and backed by **PostgreSQL checkpointing**, Mailroom ensures you never lose state during complex asynchronous workflows, while always keeping humans firmly in the loop before sensitive actions are taken.

Whether connected directly to your live Gmail account via Google OAuth 2.0 or running in simulation sandbox mode, Mailroom helps you reach **Inbox Zero** in minutes without compromising security or tone.

---

## ✨ Key Features

- **🛡️ Intelligent Triage & Spam Defense**: Automatically identifies spam, promotional junk, and phishing attempts using Gemini, cataloging reasons and isolating them safely without drafting replies.
- **✍️ Grounded Draft Generation**: Analyzes context, category, urgency, and prior history to author polite, professional, and context-accurate drafts without hallucinating unverified commitments.
- **🔍 Safety & Policy Guardrails**: Every draft passes through an independent verification node checking for unauthorized promises, confidential data leaks, and tone mismatches.
- **🔄 Auto-Retry Loop**: If a draft fails verification criteria, the agent automatically retries drafting with feedback (up to 2 iterations) before escalating to a human.
- **👤 Human-in-the-Loop (HITL) Checkpoints**: LangGraph halts execution at the approval checkpoint, allowing users to review drafts, edit text with live diff inspection, provide feedback, approve, or reject.
- **📬 Native Gmail OAuth 2.0 Integration**:
  - Offline access support with automated token refresh.
  - End-to-end symmetric encryption (**Fernet AES-128-CBC**) for all stored OAuth tokens at rest.
  - Signed HMAC state tokens with time expiration for CSRF protection.
  - Delta synchronization using Gmail history cursors.
- **🧪 Interactive Simulation Sandbox**: Test hypothetical incoming emails in a live preview sandbox to observe node-by-node agent execution without sending real emails.
- **💻 Modern React 19 Frontend**: Real-time console featuring categorized inbox queues, agent timeline visualizer, theme switcher (Light / Dark mode), and toast notifications.
- **🚀 Production-Grade Deployment**: Docker multi-stage build, container health checks, and turnkey deployment configuration via Render Blueprints.

---

## 📐 Agent Workflow & Architecture

Mailroom models email handling as a directed state graph with persistent checkpointing:

```mermaid
flowchart TD
    START([Incoming Email]) --> A[analyze_email]
    
    A -->|Spam Detected| S[handle_spam]
    S --> END1([End: Spam Logged])
    
    A -->|Legitimate| D[draft_reply]
    D --> V[verify_reply]
    
    V -->|Failed Verification & Attempts < 2| D
    V -->|Failed Verification & Max Attempts| VF[handle_verification_failure]
    VF --> END2([End: Flagged for Review])
    
    V -->|Requires Human Approval| RA[require_approval\nCheckpoint Interruption]
    V -->|Safe & Auto-Approved| SND[send_reply]
    
    RA -->|User Approves| SND
    RA -->|User Rejects| REJ[handle_rejection]
    
    SND --> END3([End: Email Sent via Gmail API])
    REJ --> END4([End: Rejected])
```

### State Graph Breakdown

| Node | Purpose |
| :--- | :--- |
| `analyze_email` | Classifies email (category, urgency, priority, risk level) and checks for spam. |
| `handle_spam` | Isolates spam, skips draft generation, and records classification metadata. |
| `draft_reply` | Leverages Gemini 3.8 Flash to write a grounded response adhering to strict factual guardrails. |
| `verify_reply` | Validates the draft against safety rules, factual accuracy, and policy compliance. |
| `require_approval` | LangGraph interrupt checkpoint. Persists graph state to PostgreSQL awaiting human decision. |
| `send_reply` | Authenticates with the user's stored Gmail credentials and dispatches the email reply. |
| `handle_verification_failure` | Handles edge cases where drafts cannot pass safety constraints. |
| `handle_rejection` | Records rejection feedback and closes the thread cleanly. |

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/)
- **Orchestration**: [LangGraph](https://langchain-ai.github.io/langgraph/) + [LangChain](https://www.langchain.com/)
- **Checkpointer**: `langgraph-checkpoint-postgres` with `psycopg_pool`
- **LLM**: Google Gemini 3.8 Flash (`langchain-google-genai`)
- **Database & ORM**: PostgreSQL + SQLAlchemy
- **Security**: `cryptography` (Fernet token encryption) & `itsdangerous` (OAuth CSRF cookies)
- **Integrations**: Google APIs Client (`google-api-python-client`, `google-auth`)

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS (Tailored Design System with CSS variables and responsive glassmorphism)
- **Tooling**: Oxlint

---

## 📁 Project Structure

```text
Autonomous-email-agent/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── approvals.py         # Human-in-the-loop approval endpoints
│   │       ├── deps.py              # Auth & session dependencies
│   │       ├── emails.py            # Email inbox listing & statistics
│   │       ├── gmail.py             # Gmail OAuth, sync, and account management
│   │       └── integrations.py      # Provider integration interfaces
│   ├── core/
│   │   └── config.py                # Database URLs & environment configuration
│   ├── db/
│   │   ├── database.py              # SQLAlchemy engine & session factory
│   │   └── models/
│   │       ├── email.py             # EmailRecord ORM schema
│   │       └── email_account.py     # Connected GmailAccount ORM schema
│   ├── graph/
│   │   ├── graph.py                 # LangGraph StateGraph, routing, & checkpointer
│   │   └── state.py                 # Pydantic schemas & EmailState TypedDict
│   ├── integrations/
│   │   └── email/
│   │       ├── gmail/               # Google OAuth & Gmail API client provider
│   │       └── token_security.py    # Fernet encryption/decryption utilities
│   ├── nodes/
│   │   ├── analyze_email.py         # Email analysis node
│   │   ├── approval.py              # Human approval state handler
│   │   ├── handlers.py              # Drafting, spam, and fallback handlers
│   │   ├── send.py                  # Gmail sending node
│   │   └── verify.py                # Safety verification guardrail node
│   ├── schemas/                     # FastAPI request & response schemas
│   ├── services/                    # Business logic (approval, email, sync services)
│   └── main.py                      # FastAPI application entrypoint & middleware
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActionBar.jsx        # Quick action controls
│   │   │   ├── AgentTimeline.jsx    # Visual state machine execution tracer
│   │   │   ├── EmailDetail.jsx      # Draft editor, diffs, and email viewer
│   │   │   ├── EmailList.jsx        # Categorized message lists
│   │   │   ├── GmailHome.jsx        # Landing page, account sync & connect
│   │   │   ├── Sidebar.jsx          # Queue navigation & account switcher
│   │   │   └── SimulationModal.jsx  # Interactive email sandbox modal
│   │   ├── App.jsx                  # Main application container
│   │   └── index.css                # Global styles & design tokens
│   ├── package.json
│   └── vite.config.js
├── create_tables.py                 # Database initialization script
├── Dockerfile                       # Multi-stage production container
├── render.yaml                      # Render Blueprint deployment spec
├── requirements.txt                 # Python dependencies
└── .env.example                     # Environment template
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.12 or newer
- **Node.js**: 18.x or newer (npm or pnpm)
- **PostgreSQL**: Local instance or cloud database (Neon, Supabase, Render Postgres)
- **Google Cloud Console**: Project with Gmail API enabled & OAuth 2.0 Web Client credentials
- **Google AI Studio**: Gemini API key

---

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd Autonomous-email-agent
```

---

### Step 2: Configure Environment Variables

Copy the template to `.env`:

```bash
cp .env.example .env
```

Generate security keys:
```bash
# Generate APP_SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate EMAIL_TOKEN_ENCRYPTION_KEY
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Fill in your `.env` values:

```ini
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mailroom
LANGGRAPH_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mailroom

# Google Gemini API
GOOGLE_API_KEY=AIzaSy...

# Google Cloud OAuth (Web Application)
client_id=your_client_id.apps.googleusercontent.com
client_secret=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/integrations/gmail/callback
FRONTEND_URL=http://localhost:5173

# Security Keys
APP_SECRET_KEY=<generated_secret_string>
EMAIL_TOKEN_ENCRYPTION_KEY=<generated_fernet_key>

PORT=8000
```

---

### Step 3: Set Up Backend

1. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize the database tables**:
   ```bash
   python create_tables.py
   ```

4. **Start the FastAPI backend server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

Backend will be running at [http://localhost:8000](http://localhost:8000). Interactive API docs are at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Step 4: Set Up Frontend

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```

Frontend will be available at [http://localhost:5173](http://localhost:5173).

---

## 🔑 Google Cloud OAuth Setup

To enable live Gmail connectivity:

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Gmail API** under *APIs & Services* > *Library*.
3. Go to *APIs & Services* > *OAuth consent screen*:
   - Set User Type to **External** (or Internal for Google Workspace).
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/userinfo.email`
   - In Testing mode, add your Gmail account to **Test Users**.
4. Go to *APIs & Services* > *Credentials*:
   - Create **OAuth client ID** > **Web application**.
   - Add Authorized JavaScript Origins:
     - `http://localhost:5173`
     - `http://localhost:8000`
   - Add Authorized redirect URIs:
     - `http://localhost:8000/integrations/gmail/callback`
5. Copy the **Client ID** and **Client Secret** into your `.env`.

---

## 📡 API Endpoints

### 📧 Email Operations
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/emails/process` | Ingests and processes an email through the LangGraph pipeline |
| `GET` | `/emails` | Lists processed emails with status, category, and statistics |

### 👤 Human Approval & Decision
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/approvals/pending` | Lists emails awaiting human approval |
| `POST` | `/approvals/decide` | Submits approval, rejection, or draft revision to resume the graph |

### 📬 Gmail Integration
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/integrations/gmail/connect` | Initiates Google OAuth 2.0 flow |
| `GET` | `/integrations/gmail/callback` | OAuth redirect callback handler |
| `POST` | `/integrations/gmail/sync` | Triggers inbox synchronization for new emails |
| `GET` | `/integrations/gmail/accounts` | Lists connected Gmail accounts |
| `DELETE`| `/integrations/gmail/accounts/{id}` | Disconnects an account and revokes tokens |

### 🩺 System & Compliance
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint for Docker & load balancers |
| `GET` | `/privacy` | Google verification compliant privacy policy redirect |
| `GET` | `/terms` | Google verification compliant terms of service redirect |

---

## 🐳 Docker Deployment

### Build the Image
```bash
docker build -t mailroom-api .
```

### Run the Container
```bash
docker run -d \
  --name mailroom-api \
  -p 8000:10000 \
  --env-file .env \
  mailroom-api
```

---

## ☁️ Deployment on Render

This repository includes a [`render.yaml`](./render.yaml) Blueprint configuration:

1. Push your code to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), choose **Blueprints** > **New Blueprint Instance**.
3. Connect your repository.
4. Render will automatically detect the `render.yaml` specification and configure:
   - Python 3.12 Docker Web Service
   - Health check path `/health`
   - Environment variables prompt
5. Provide your production environment variables (database connection, Gemini API key, encryption keys).

---

## 🔒 Security Best Practices

- **Token Protection**: Refresh tokens and access credentials are never stored in plaintext. They are encrypted using symmetric authenticated Fernet encryption before being written to PostgreSQL.
- **CSRF Immunity**: State parameters during OAuth flows are cryptographically signed using `itsdangerous` URLSafeTimedSerializer with HttpOnly cookies.
- **Prompt Injection Defense**: Incoming email bodies and drafts are strictly demarcated as untrusted input in the verification node to mitigate prompt injection.
- **Least Privilege**: The container runs under an unprivileged `appuser` (UID 1001) in production.

---

## 📄 License

This project is licensed under the MIT License.
