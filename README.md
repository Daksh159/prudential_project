# PHI — AI-Assisted Authorization Platform

> Authorization-as-a-Service with Gemini AI for Prudential Health India

## Live Components

| Component | Stack | Port |
|---|---|---|
| Authorization Server | FastAPI + SQLite | 8000 |
| Admin Portal | React 18 + Vite + TailwindCSS | 5173 |
| Consumer App | React 18 + Vite + TailwindCSS | 5174 |
| TypeScript SDK | TypeScript + Axios | — |

---

## Quick Start (Local)

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # add your GEMINI_API_KEY
python seed.py              # seeds DB with demo data
uvicorn main:app --reload --port 8000
```

### 2. Admin Portal
```bash
cd admin-portal
npm install
npm run dev                 # http://localhost:5173
```

### 3. Consumer App
```bash
cd consumer-app
npm install
npm run dev                 # http://localhost:5174
```

---

## Demo Credentials

| Email | Password | Role |
|---|---|---|
| admin@phi.com | password | Admin |
| customer@phi.com | password | Customer |
| doctor@phi.com | password | Doctor |
| claims@phi.com | password | Claims Officer |

---

## Deploy to Production

### Backend → Render.com

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo, set root directory to `backend/`
4. Set these environment variables:
   ```
   GEMINI_API_KEY=your-key
   SECRET_KEY=change-this-in-production
   ALLOWED_ORIGINS=https://your-admin.vercel.app,https://your-consumer.vercel.app
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```
5. Build command: `pip install -r requirements.txt && python seed.py`
6. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Admin Portal → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import repo
2. Set root directory to `admin-portal/`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

### Consumer App → Vercel

Same as Admin Portal but root directory = `consumer-app/`.

---

## Architecture

```
Consumer App (React :5174)
       │  JWT + POST /check-access
       ▼
Authorization Server (FastAPI :8000)
       │  SQLAlchemy ORM
       ▼
   SQLite / PostgreSQL
       │  REST API
       ▼
  Gemini AI (Policy Engine)

Admin Portal (React :5173)
       │  All CRUD + AI endpoints
       ▼
Authorization Server (FastAPI :8000)
```

### Core Access-Check Flow
```
POST /check-access  { user_id, action, resource }
  1. Load all roles for user_id
  2. Load all permissions across those roles
  3. Check if (action, resource) ∈ permission set
  4. Write to AuditLog (always — allowed or denied)
  5. Return { allowed: bool, reason: str }
```

---

## AI Engine (Gemini)

| Endpoint | Input | Output |
|---|---|---|
| `POST /ai/generate-policy` | Natural language text | `[{role, action, resource, effect}]` |
| `POST /ai/recommend-permissions` | Role name | `{recommended, restricted, reasoning}` |
| `POST /ai/detect-risks` | Role ID | `[{permission, risk_level, reason}]` |
| `POST /ai/explain-access` | user_id + action + resource | Plain English explanation |

---

## Key Design Decisions

**No hardcoded permissions in frontend** — Every UI button calls `/check-access` before rendering. Revoking a permission in the Admin Portal takes effect immediately across all apps.

**AI as policy translator** — Health insurance policies are written in complex regulatory language (IRDAI, etc.). Gemini converts them directly to structured RBAC rules.

**Audit everything** — Every access decision (allowed or denied) is persisted to `AuditLog` with timestamp, IP address, and an AI-generated plain-English explanation.
