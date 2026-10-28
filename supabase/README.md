# Supabase setup

## 1. Create project

Create a project at [supabase.com](https://supabase.com).

## 2. Run migrations (in order)

In **SQL Editor**, run each file in order:

1. `migrations/20241022000001_initial_schema.sql` — profiles, projects, members, technologies, RLS seed  
2. `migrations/20241022000002_phase2_tables.sql` — notifications, audit, modules, tasks, milestones, links  
3. `migrations/20241022000003_phase3_files.sql` — project_files  
4. `migrations/20241022000004_phase4_reviews.sql` — reviews, rubrics, ideas  
5. `migrations/20241022000005_phase5_hardening.sql` — extra RLS policies + indexes  

Or use the Supabase CLI:

```bash
supabase db push
# or
supabase migration up
```

## 3. API keys & DATABASE_URL

**Project Settings → API**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (client + server)
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

**Project Settings → Database → Connection string → URI**

```
DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Or direct:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.[ref].supabase.co:5432/postgres
```

Put `DATABASE_URL` only in `server/.env` — never in `VITE_*` client env.

## 4. Storage

1. Storage → New bucket → **project-files** → **Private**  
2. Rely on server signed URLs for upload/download (recommended)

## 5. Bootstrap roles

Public signup always creates `student`. Promote users:

```sql
UPDATE public.profiles SET role = 'faculty' WHERE id = '<uuid>';
UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid>';
```
