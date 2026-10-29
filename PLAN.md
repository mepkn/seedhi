# Seedhi: plan

The decisions behind the guide, in one place. The guide itself lives in `site/`; this file is
the reference for what it teaches and why.

## What it is

A step-by-step guide to building a small full-stack app, deploying it to a 1 GB VPS and
monitoring it. Every lesson is something you do and then **verify**, and every lesson that
creates something on the server says how to **undo** it, so the whole thing can be torn down
and followed again later.

Lesson page shape: **Goal → Steps → Verify → What you learned → Undo**.

## The app: Guestbook

One page: a form (name, message, later a country) and the latest entries below it.

- `GET /api/entries`, `POST /api/entries`, `GET /api/health`
- Validation: one Zod schema used by the form and the API (name ≤ 40, message ≤ 280)
- Errors: one shape, `{ error: { code, message, requestId, fields? } }`; UI has loading, empty
  and error states and shows the request ID
- Structured JSON logs (pino) with a request ID per request (`X-Request-Id`)
- Per-IP rate limit on posting; daily cleanup of entries older than 7 days
- Footer shows track, version (commit SHA) and database status, from `/api/health`

No auth on purpose.

## Tracks

Only one track is deployed at a time.

| Folder | Frontend | Backend | On the VPS |
|---|---|---|---|
| `examples/react-hono-postgres/` | Vite + React SPA (`frontend/`) | Hono + Drizzle (`backend/`) | Static files served by system Caddy + 1 API container |
| `examples/nextjs-fullstack-postgres/` | Next.js | Route Handlers (`/api/*`) + a Server Action (the form) | 1 Next.js container |

Both use Postgres + Drizzle, the same schema and the same migrations. Each track is
self-contained (copy one folder, ignore the other). `scripts/check.sh` checks that both
`drizzle/` folders are identical. The React frontend imports the API contract
(`backend/src/contract.ts`) so the form and the API validate with the same schema.

Images run as a non-root user and also run the migrations (`node src/db/migrate.ts`). Each
track has a `compose.yml` (Postgres → one-off `migrate` → app, throwaway inline values, port
`127.0.0.1:8080`) for running production images locally and in CI; the React track's adds a
Caddy container serving `frontend/dist` with the track's `Caddyfile`, which the server's
Caddy config mirrors (on the server, system Caddy does that job).

B (Next.js static export) and C (Next.js SSR + separate API) are a short "Variations" page only.

## Environments

| Env | Where | Runs | Database | URL |
|---|---|---|---|---|
| dev | Mac | App natively with hot reload, Postgres in Docker | local container | `localhost` |
| CI | GitHub Actions runner | Prod images + Postgres in compose, smoke test | throwaway | none |
| staging | VPS | Deployed on merge to `staging`; QA tests here | `guestbook_staging` | `guestbook-staging.pknspace.com` |
| production | VPS | Deployed on merge to `main` | `guestbook_prod` | `guestbook.pknspace.com` |

One Postgres container on the VPS holds both databases (a deliberate trade-off for 1 GB).
Each database has its own owner role (`guestbook_staging`, `guestbook_prod`, `REVOKE ALL …
FROM PUBLIC`), so staging can't connect to production. The container (`infra/compose/postgres.yml`
→ `/srv/guestbook/postgres/compose.yml`, project `guestbook-postgres`, volume `guestbook-pgdata`)
publishes no port; apps join the external `guestbook` network and use host `postgres`.
Apps publish `127.0.0.1:3100` (production) and `127.0.0.1:3101` (staging), the same in both
tracks. Each track's `server/compose.yml` → `/srv/guestbook/compose.yml`, one file for both
environments: shell variables `APP_ENV`, `PORT`, `IMAGE`, `TAG` pick one, the project is
`guestbook-<APP_ENV>`, runtime config comes from `.env.<APP_ENV>` and `APP_VERSION` is `TAG`.
Each track's `server/guestbook.caddy` → `/etc/caddy/sites/guestbook.caddy` (both
hostnames); the React track serves `/var/www/guestbook` and `/var/www/guestbook-staging`
(owned by `deploy`) and proxies `/api/*`.

**Low-memory mode** (for this 1 GB VPS; optional in the guide, lesson 5.7): repo variable
`LOW_MEMORY=true` stops staging after a successful production deploy; manual
`staging-stop.yml` / `staging-start.yml` workflows stop it or bring the last staging image back.
The staging database stays.

## Env files

| File | Where | Committed | Holds |
|---|---|---|---|
| `.env.example` | each part | yes | every variable, with dev defaults and comments |
| `.env` | each part, on your Mac | no | your dev values (copied from `.env.example`) |
| `.env.staging`, `.env.production` | `/srv/guestbook/` on the VPS, `chmod 600` | no | written by CI from GitHub Environment secrets |

Rules the guide teaches:

- Runtime config comes from the environment; the backend validates it at startup with Zod and
  refuses to start with a clear message if something is missing (`src/env.ts`).
- Node reads `.env` natively (`node --env-file-if-exists=.env`); Docker Compose reads the
  server file with `env_file:`.
- Anything prefixed `VITE_` / `NEXT_PUBLIC_` is baked into the browser bundle at build time:
  public, never a secret. The frontend calls same-origin `/api`, so it needs no API URL.
- Secrets never go into images or git. `.gitignore` ignores `.env*` except `.env.example`.
- `APP_ENV` (`development` / `staging` / `production`) is separate from `NODE_ENV`.

## Branches and CI/CD (GitHub Actions)

```
feature ──PR──► staging ──PR──► main
                  │               │
             deploy staging   deploy production
```

- PRs run checks only: lint, typecheck, migrations on an empty Postgres, schema-drift check
  (`drizzle-kit generate` must produce nothing), Docker build, smoke test in the runner.
  `ci.yml` jobs (the required check names): `checks` (`scripts/check.sh` + drift),
  `smoke (react-hono-postgres)`, `smoke (nextjs-fullstack-postgres)` (each track's
  `compose.yml` on an empty volume, then `scripts/smoke-test.sh http://localhost:8080`).
  `scripts/smoke-test.sh <url>` is the one smoke test for CI, staging and production;
  `READ_ONLY=1` skips the POST (production).
- Merge to `staging`: build images, push to GHCR, write `.env.staging`, migrate, deploy, smoke test.
- Merge to `main` (= QA approval): back up prod, migrate, deploy, smoke test.
- Images are tagged with the tree hash (`git rev-parse HEAD^{tree}`) and the commit SHA, so
  production reuses the exact image QA tested. Tags are short: `<sha>` and `tree-<tree>`
  (`git rev-parse --short`), never `latest`.
- Images are built for `linux/amd64` with `--provenance=false` (one manifest, so GHCR reads
  the `org.opencontainers.image.source` label that links the package to the repo). GHCR
  packages are **public**: no secrets in images, and the server pulls without a token.
- Branch protection: one ruleset per branch (`infra/github/rulesets/{main,staging}.json`,
  applied with `gh api`): PR-only (0 approvals), no deletion, no force push, CI required (5.2
  adds the check). Repository admin bypasses (`always`), so the owner can still push guide
  edits straight to `main` (then `git push origin main:staging` to keep `staging` level).
  Merge methods: squash or merge into `staging`, merge commit only into `main` (squashing
  `staging` into `main` would break their shared history; the admin bypass still allows it,
  so pick *Merge* by hand). Hotfix: branch from `main`, then
  merge `main` back into `staging`. Rollback: redeploy the previous image.
- Builds only in CI, never on the VPS.

## Database and migrations (Drizzle Kit)

| # | Migration | Type | Teaches |
|---|---|---|---|
| 0000 | create `entries` | schema | first migration |
| 0001 | `countries` + rows (`ON CONFLICT DO NOTHING`) | schema + data | reference data, idempotency |
| 0002 | `entries.country_code` + dropdown | schema | additive change |
| 0003 | index on `created_at` | schema | performance |
| 0004 | `initcap(name)` + capitalize on insert | data | fix old and new data, backup first |
| — | a broken migration | — | staging catches it; fix forward |

Expand/contract is a concept page only. `drizzle-kit push` only for prototyping.
Migrations run as a one-off container before the app starts. On the server the `migrate`
service has `profiles: [migrate]` and the deploy is `pull && run --rm migrate && up -d --wait`;
never `depends_on` there: on an update `up` replaces the app container before `migrate` runs,
so a failed migration leaves the site down (tried in 4.2). Roll forward, not back.

## The VPS (1 vCPU · 1 GB · 10 GB)

Existing: Cloudflare Tunnel → system Caddy :8080, Docker, Dockhand. The guide adds swap
(only on a full VM; this server is `lxc` and gets 512 MB from the host), a log cap and
`mem_limit` on every container, a tuned Postgres (`shared_buffers=64MB`,
`max_connections=20`), image pruning (keep the last 2) and a `deploy` user.

Log caps are set per service in compose (`x-logging` anchor: `json-file`, `max-size: 10m`,
`max-file: 3`), not in `/etc/docker/daemon.json`: that needs a Docker restart, which stops the
server's other apps, applies only to new containers and would need its own undo.

`mem_limit`: Postgres `160m`, API `128m`, Next.js `256m`, Fluent Bit `64m` (worst case with
production only: React 692 MB, Next.js 820 MB, on a ~340 MB base).

RAM, steady state (approx.):

| | React + Hono | Next.js |
|---|---|---|
| Existing base | ~300 MB | ~300 MB |
| Postgres | ~70 MB | ~70 MB |
| Fluent Bit | ~25 MB | ~25 MB |
| Prod app | ~60 MB | ~120 MB |
| Staging app (stopped in low-memory mode) | ~60 MB | ~120 MB |

## Monitoring (cloud free tiers)

| Question | Tool |
|---|---|
| Is it up? | UptimeRobot on `/api/health` (+ keyword `"db":"up"`), public status page |
| What's broken? | Sentry (frontend + backend, release = SHA, source maps from CI, request ID tag, `/monitoring` tunnel) |
| How is it used? | PostHog (pageviews, `entry_posted`, funnel, masked replay, `/ingest` proxy) |
| What happened / is the server OK? | `jq` on the server first, then Fluent Bit → Grafana Cloud (logs + host metrics) |
| Can I recover? | nightly `pg_dump` → Cloudflare R2, restore drill |

Alerts (email; Telegram where the free plan allows):

- Act now: site down, DB down, disk > 90%, OOM kill
- Look today: new prod error, regression, error spike, 5xx spike, disk > 80%, memory
  pressure, backup did not run (no `backup completed` log line in 26 h)
- Info: GitHub workflow failed (built in)

Every alert is triggered once on purpose in the lesson.

## Lessons

**0 Start**: 0.1 What you'll build · 0.2 Prerequisites & accounts · 0.3 Record a VPS baseline

**1 Develop**: 1.1 Project setup · 1.2 Postgres in Docker · 1.3 Schema & first migration ·
1.4 The backend · 1.5 Validation · 1.6 Error handling · 1.7 Structured logs & request IDs ·
1.8 Connecting frontend & backend · 1.9 Seed data

**2 Dockerize**: 2.1 Dockerfiles · 2.2 Run the production images locally · 2.3 Environments & env files

**3 Prepare the VPS**: 3.1 Server check & deploy user · 3.2 Make 1 GB enough ·
3.3 Postgres on the VPS · 3.4 Domains & routing

**4 First deploy, by hand**: 4.1 Push images to GHCR · 4.2 Deploy production by hand

**5 CI/CD**: 5.1 Branches & protection · 5.2 CI on pull requests · 5.3 Deploy to staging on merge ·
5.4 QA & promote to production · 5.5 Rollback · 5.6 Hotfixes · 5.7 Low-memory mode (optional)

**6 Monitor**: 6.1 Uptime + status page · 6.2 Errors (Sentry) · 6.3 Logs & metrics ·
6.4 Product analytics (PostHog) · 6.5 Backups & restore drill · 6.6 Alerts ·
6.7 Using free tiers responsibly

**7 Shipping changes**: 7.1–7.5 migrations 0001–0004 and the broken one · 7.6 Expand/contract

**8 Teardown**: 8.1 Tear down the server (`scripts/teardown.sh`, `DRY_RUN=1`) · 8.2 Verify
against the 0.3 baseline · 8.3 Cloud side (monitors, status page, alert rules, tunnel routes,
GHCR images, GitHub secrets) · 8.4 Run it again (other track)

**Appendix**: Variations · Beyond this guide (auth, uploads, email, queues, realtime, self-hosted
monitoring: GlitchTip, Umami, Uptime Kuma, Loki) · Cheat sheet & troubleshooting

Left out on purpose: unit/E2E test suites, security and cache headers, graceful shutdown,
pagination, least-privilege DB users, cron monitoring, Dependabot.

## Names

| Thing | Name |
|---|---|
| Repo | `mepkn/seedhi` (public) |
| Guide | `seedhi.pknspace.com` (`/var/www/seedhi`, stays after teardown) |
| App | `guestbook.pknspace.com`, `guestbook-staging.pknspace.com` (`/srv/guestbook`) |
| Databases | `guestbook_staging`, `guestbook_prod` |
| Images | `ghcr.io/mepkn/seedhi-react-api`, `ghcr.io/mepkn/seedhi-nextjs` |
| Workflows | `ci.yml`, `deploy-staging.yml`, `deploy-production.yml`, `staging-stop.yml`, `staging-start.yml`, `deploy-site.yml` |
| Monitoring projects | `guestbook` (a `track` tag tells the tracks apart) |
