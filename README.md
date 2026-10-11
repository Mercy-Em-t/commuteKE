# commuteKE (Transy)

Real-time public transport dispatch and passenger tracking platform for SACCO operations in Kenya.

## What this project includes

- **Passenger web app** for live trip tracking, schedule viewing, and WhatsApp alerts
- **Operations portals** for admins, drivers, clerks, and system admins
- **FastAPI backend** for provisioning, notifications, analytics, SACCO management, and integrations
- **Supabase/PostgreSQL schemas** for trips, routes, roles, fleet, schedules, analytics, and push subscriptions

## Repository structure

- `/frontend` — React + Vite + PWA frontend and Python API functions (`/frontend/api`)
- `/database` — SQL schema and policy files
- `/docs` — architecture and security notes
- `/legal_templates` — legal and compliance templates
- `/legacy_backup` — older backend reference files

## Core architecture

- Frontend: React (Vite), Leaflet maps, Supabase JS, PWA service worker
- Backend: FastAPI endpoints (in `frontend/api/index.py`)
- Data/Auth: Supabase (Postgres + Auth + Realtime + RLS policies)
- Realtime: Supabase Realtime subscriptions for live trip updates

## Key features

- Live bus status updates and map tracking
- Role-based access control (`ADMIN`, `DRIVER`, `SYSTEM_ADMIN`, `CLERK`)
- OTP-based auth via Supabase
- SACCO lifecycle management and broadcast tooling
- WhatsApp subscription/webhook and notification workflows
- Push subscription support and analytics endpoints

## Prerequisites

- **Node.js** 18+ (recommended)
- **npm**
- **Python** 3.9+
- A configured **Supabase** project (recommended for full functionality)

## Environment variables

### Frontend (`/frontend`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend (`/frontend/api`)

- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TM_SAVANNAH_WEBHOOK_SECRET` (optional; has a local fallback)
- Optional integrations:
  - `MAIL_CLIENT_ID`
  - `MAIL_SECRET`
  - `INQUIRY_INBOX`
  - `WHATSAPP_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_VERIFY_TOKEN`
  - `WHATSAPP_PHONE_ID`
  - `WHATSAPP_ACCESS_TOKEN`

## Local development

### 1) Frontend

```bash
cd /home/runner/work/commuteKE/commuteKE/frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 2) Backend API

```bash
cd /home/runner/work/commuteKE/commuteKE
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn frontend.api.index:app --reload --port 8001
```

API runs on `http://127.0.0.1:8001` (the frontend proxies `/api` to this backend in dev).

### 3) Database setup

Apply SQL files in `/database` to your Supabase/Postgres instance in order:

1. `01_schema.sql`
2. `02_analytics_schema.sql`
3. `03_security_rls.sql`
4. `04_fleet_schema.sql`
5. `05_saccos_schema.sql`
6. `06_schedule_schema.sql`
7. `07_push_subscriptions.sql`

## Available scripts

From `/frontend`:

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — run Oxlint

## API health check

When backend is running:

```bash
curl http://127.0.0.1:8001/health
```

Expected response contains:

- `status: operational`
- `platform: TM Savannah Transport Engine`

## Notes

- The frontend still contains the default Vite README at `/frontend/README.md`; this root README is the project-level guide.
- Several backend routes include local/mock fallbacks when Supabase service credentials are not configured.
