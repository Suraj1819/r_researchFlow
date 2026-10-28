# ResearchFlow

**Student Project Management, Collaboration, Documentation and Academic Review Platform**

ResearchFlow helps college students independently create, register, plan, develop, document, manage and showcase academic or personal projects. Authorized faculty, coordinators and administrators can review projects, provide feedback and monitor progress.

> Students can create projects from scratch. The Project Ideas Library is optional inspiration, not a required starting point.

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React + Vite, JavaScript/JSX, Tailwind CSS      |
| Data       | TanStack Query, React Hook Form + Zod           |
| Icons/UI   | Lucide React, Sonner (toasts), Recharts         |
| Backend    | Node.js + Express (ES modules)                  |
| Auth / DB  | Supabase Auth + PostgreSQL + RLS                |
| Storage    | Supabase Storage (private bucket + signed URLs) |
| Deploy     | Vercel (client) · Render (server) · Supabase    |

## Prerequisites

- Node.js 20+
- npm 10+
- A free [Supabase](https://supabase.com) project

## Local Setup

### 1. Clone & install

```bash
cd researchflow
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project.
2. In the SQL Editor, run the migration file:
   `supabase/migrations/20241022000001_initial_schema.sql`
3. Copy your project URL, anon key and service-role key from **Project Settings → API**.

### 3. Environment variables

```bash
# Client
cp client/.env.example client/.env

# Server
cp server/.env.example server/.env
```

Fill in the values:

**client/.env**
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

**server/.env**
```
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server only!
```

### 4. Run

```bash
# From repo root (runs both client & server)
npm run dev

# Or separately:
npm run dev:client   # http://localhost:5173
npm run dev:server   # http://localhost:4000
```

### 5. First admin (manual)

Public registration only creates `student` accounts (enforced by the signup trigger).

To promote a user to admin after they have registered:

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

Never hard-code production admin passwords in seed scripts.

## Project Structure

```
researchflow/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # UI, layout, feature components
│   │   ├── features/       # Auth, profile, projects, etc.
│   │   ├── pages/          # Route-level pages
│   │   ├── lib/            # Supabase client, utils, theme
│   │   └── ...
│   └── ...
├── server/                 # Express API
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/     # Auth, error handling
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── ...
│   └── ...
├── supabase/
│   └── migrations/         # SQL schema + RLS + seed
└── docs/                   # Architecture & API notes
```

## Current Status (Phase 1)

✅ Monorepo scaffolding  
✅ Client: Vite + React + Tailwind + routing + auth UI  
✅ Auth flows: register, login, logout, forgot/reset password, email verification redirect  
✅ Protected routes + role-aware layout  
✅ Student dashboard & basic profile view  
✅ Server: Express skeleton, health check, `/api/v1/me`  
✅ Initial database migration (profiles, departments, projects core, members, invitations, technologies, RLS)  
✅ Environment templates & README  

**Next (Phase 2):** Project draft creation, 6-step registration wizard, team invitations, submission enforcement.

## Scripts

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`      | Start client + server concurrently   |
| `npm run dev:client` | Frontend only                      |
| `npm run dev:server` | Backend only                       |
| `npm run build`    | Production build                     |
| `npm test`         | Run server tests                     |

## Security Notes

- Service-role key is **never** exposed to the client.
- Role elevation is blocked in the signup trigger and in the profile update endpoint.
- RLS is enabled on all public tables; policies will be expanded as features are added.
- Private project files will use a private Storage bucket + short-lived signed URLs.

## License

Private / institutional use. Adjust as needed for your college.


### Phase 5 — Hardening & deploy ✅
- `DATABASE_URL` in `server/.env.example` (Supabase Postgres URI)
- Phase 5 migration: extra RLS policies, review-queue indexes
- `supabase/README.md` — ordered migration + keys guide
- `docs/deployment.md` — Vercel + Render + production checklist
- Basic API tests (`server/tests/health.test.js`)
- Config warns if `DATABASE_URL` missing
