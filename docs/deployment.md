# Deployment

## Environment variables

### Client (Vercel)

| Variable | Notes |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key only |
| `VITE_API_BASE_URL` | Public URL of API, e.g. `https://api.example.com/api/v1` |

Never set `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL` on the client.

### Server (Render / Railway / Fly)

| Variable | Notes |
|----------|--------|
| `PORT` | Provided by host or `4000` |
| `NODE_ENV` | `production` |
| `CLIENT_ORIGIN` | Exact frontend origin, e.g. `https://app.example.com` |
| `SUPABASE_URL` | Same as client |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** |
| `DATABASE_URL` | Postgres URI from Supabase Database settings (optional for app runtime; useful for tooling) |

## Frontend — Vercel

```bash
cd client
npm install
npm run build
# Deploy dist/ or connect the client/ folder as the Vercel root
```

Build command: `npm run build`  
Output directory: `dist`  
Root directory: `client`

Set env vars in Vercel → Project → Settings → Environment Variables.

## Backend — Render

1. New **Web Service**, connect repo, root `server/`
2. Build: `npm install`
3. Start: `npm start`
4. Set env vars listed above
5. Health check path: `/api/v1/health`

## Supabase

1. Run all migrations (see `supabase/README.md`)
2. Create private bucket `project-files`
3. Promote first admin via SQL after they register

## CORS

`CLIENT_ORIGIN` must match the deployed frontend origin exactly (scheme + host, no trailing slash).

## Production checklist

- [ ] All 5 SQL migrations applied  
- [ ] `project-files` private bucket exists  
- [ ] Service role key only on server  
- [ ] `CLIENT_ORIGIN` locked to production frontend  
- [ ] At least one `admin` profile created  
- [ ] Health endpoint returns 200  
- [ ] Auth register/login works end-to-end  
