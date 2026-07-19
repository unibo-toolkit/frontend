# Local dev environment

Runs the whole UniPlanner stack locally: Postgres + Redis + migrations + the three
backend services (`:dev` images from GHCR) behind a Caddy gateway, with the Next.js
frontend on the host. Google sign-in works locally; Apple is intentionally not wired.

## Topology

```
browser ─▶ frontend (host :3000)
                 │  /api/v1/* proxy  (adds Bearer + X-User-* in dev)
                 ▼
           gateway  Caddy :8080  ──┬─▶ auth-service      :8081   /api/v1/auth,/users
                                   ├─▶ scraper-service    :8083   /api/v1/courses,preview,timetable
                                   └─▶ calendar-manager   :8082   /api/v1/calendars, /cal/*.ics
                                          │
                          Postgres :5432 ─┴─ Redis :6379
```

- **Migrations** run as a prod-like pre-hook: `db-clone` fresh-clones the `databases`
  repo, `migrate` applies `up`, and no backend starts until it finishes.
- **Identity**: in prod Istio validates the JWT cookie and injects `X-User-Id/X-Email/X-Roles`.
  Locally there is no Istio, so the frontend `/api/v1/[...]` proxy decodes the `access_token`
  cookie and injects those headers **in dev only**. Caddy is a pure path router.

## First-time setup

1. **Docker** running, plus this repo's `npm install` done.

2. **Generate keys + env scaffolding:**
   ```bash
   make dev-setup
   ```
   This creates a dev JWT keypair, `dev/auth.env`, and `.env.development.local`
   (frontend dev overrides — only used by `next dev`, your prod `.env.local` is untouched).

3. **Create a LOCAL Google OAuth app** (separate from prod so nothing conflicts):
   - Google Cloud Console → *APIs & Services* → *Credentials* → *Create OAuth client ID* → *Web application*
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback`
     (Google redirects straight to the frontend callback page, which exchanges the
     code via `/api/v1/auth/exchange` and sets the cookies.)
   - Put the client id/secret into `dev/auth.env`:
     ```
     GOOGLE_CLIENT_ID=...apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=...
     ```

4. **Go:**
   ```bash
   make dev
   ```
   Backend stack comes up (first boot the scraper warms the UniBo course cache — can take a
   few minutes), then the frontend starts on http://localhost:3000.

## Commands

| Command | What |
|---|---|
| `make dev-setup` | one-time keys + env scaffolding |
| `make dev` | backend stack (`--wait`) + `npm run dev` |
| `make dev-up` | backend stack only |
| `make dev-pull` | pull latest `:dev` images |
| `make dev-logs` | tail backend logs |
| `make dev-down` | stop (keeps DB + scraped data) |
| `make dev-reset` | **wipe everything** incl. DB volumes |

## Notes

- All API goes through the gateway at `http://localhost:8080`; you can curl it directly
  (e.g. `curl 'http://localhost:8080/api/v1/courses?q=informatica&lang=it'`).
- Cookies are host-only, non-secure (`COOKIE_SECURE=false`, no `COOKIE_DOMAIN`) so they work on `localhost`.
- Apple sign-in is not available locally (Apple requires a public HTTPS redirect).
- `dev/auth.env` and `dev/keys/` hold secrets and are gitignored.
