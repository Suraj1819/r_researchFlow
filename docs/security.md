# Security notes

## Secrets

| Secret | Where |
|--------|--------|
| `SUPABASE_ANON_KEY` | Client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** |
| `DATABASE_URL` | **Server only** (optional for runtime) |

Never prefix service role or database URL with `VITE_`.

## Authorization layers

1. **Express middleware** — JWT verification, role checks  
2. **Business rules** — team size, leader-only actions, cannot review own project  
3. **RLS** — defense in depth on Postgres  

## Files

- Private Storage bucket `project-files`  
- Metadata in `project_files`  
- Access via short-lived signed URLs issued after membership check  

## Roles

- Public registration → `student` only (DB trigger strips elevation)  
- Faculty/admin via controlled SQL update, not client payload  
