# ResearchFlow Architecture

## Overview

ResearchFlow is a monorepo full-stack application:

- **client/** — React SPA (Vite)
- **server/** — Express REST API
- **supabase/** — PostgreSQL schema, RLS, storage policies, seed data

## Request Flow

```
Browser → Vercel (static SPA)
            ↓ API calls
         Express (Render) → Supabase (Auth / Postgres / Storage)
```

Authentication uses Supabase JWTs. The server verifies the token on every protected request and loads the user's profile (including role).

## Role Model

| Role          | How created                          | Capabilities (high level)                    |
|---------------|--------------------------------------|----------------------------------------------|
| student       | Public registration                  | Create projects, join teams, submit          |
| faculty / reviewer | Admin provisioning               | Review assigned projects                     |
| coordinator   | Admin provisioning                   | Department-level monitoring                  |
| admin         | Manual SQL / secure bootstrap        | Full configuration                           |

Public signup always results in `role = 'student'` (enforced by database trigger).

## Key Design Decisions

1. **ES modules only** — no CommonJS, no TypeScript.
2. **Server is source of truth** for authorization, team size, progress calculation and state transitions.
3. **RLS + application checks** — defense in depth. Even if a client bypasses the UI, RLS and server policies reject unauthorized access.
4. **Transactional submission** — team membership and project status change atomically.
5. **Private files** — metadata in Postgres, blobs in private Storage bucket, access via short-lived signed URLs.

## Phase Roadmap

See README for current status. High-level phases:

1. Foundation (auth, profiles, scaffolding) — **done**
2. Project registration wizard + team invitations + submission
3. Workspace (tasks, modules, files, progress)
4. Faculty review workflow + admin tools
5. Hardening, tests, production deployment
