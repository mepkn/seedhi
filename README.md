# Seedhi

Step-by-step guide to building, deploying and monitoring a full-stack app on a small VPS.

## Features

- A guide (`site/`) that goes from `localhost` to a monitored production app: develop,
  Dockerize, prepare a 1 GB VPS, CI/CD with staging and production, monitoring, schema
  changes, and a teardown that puts the server back the way it was
- The example app it builds, a guestbook, in two tracks: React + Hono, and Next.js
  full-stack, both on Postgres with Drizzle
- Every lesson ends with a check you run yourself and says how to undo it
- The guestbook is public: no sign-in

The decisions behind it are in [PLAN.md](PLAN.md).

## Stack

Astro Starlight · React 19 · Hono · Next.js · TypeScript · Vite · Tailwind CSS v4 · Postgres · Drizzle · Zod · pino · Docker · GitHub Actions

## Development

Node 22.18+ (`.nvmrc`). Postgres runs in Docker for development.

```bash
# Postgres
docker compose -f infra/compose/dev.yml up -d --wait

# React + Hono: API on :3000
cd examples/react-hono-postgres/backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev

# React + Hono: frontend on :5173 (proxies /api to :3000), in a second terminal
cd examples/react-hono-postgres/frontend
npm install
npm run dev

# The guide on :4321
cd site
npm install
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `scripts/check.sh` | Typecheck and lint every part, build the site |
| `scripts/deploy-site.sh` | Check, build and upload the guide (`DRY_RUN=1` previews) |
| `docker compose -f infra/compose/dev.yml up -d --wait` | Start development Postgres |
| `docker compose -f infra/compose/dev.yml down -v` | Stop it and delete its data |
| `docker compose up -d --build --wait` (in a track folder) | Production images + Postgres on `localhost:8080` (React: build `frontend/` first) |
| `docker compose down -v` (in a track folder) | Stop that stack and delete its data |

`examples/react-hono-postgres/backend/`:

| Command | What it does |
|---|---|
| `npm run dev` | API with reload, logs pretty-printed |
| `npm run start` | API as in production (JSON logs) |
| `npm run db:generate -- --name <name>` | Write a migration from changes to `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL` |
| `npm run db:seed` | Add sample entries (development only) |
| `npm run check` | Typecheck and lint |

`examples/react-hono-postgres/frontend/`:

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run check` | Typecheck and lint |

`site/`:

| Command | What it does |
|---|---|
| `npm run dev` | Guide with reload |
| `npm run build` | Static site in `dist/` |
| `npm run check` | `astro check` and build |

## Deployment

`scripts/deploy-site.sh` checks and builds the guide, then rsyncs `site/dist/` to
`/var/www/seedhi` on the VPS (`DRY_RUN=1` previews). Server details are in
`site/.env.prod.local` (git-ignored; see `site/.env.example`). Caddy serves it at
`https://seedhi.pknspace.com` with the standard static block. The guestbook
deploys through GitHub Actions to `guestbook.pknspace.com` and
`guestbook-staging.pknspace.com`, as the guide teaches.

## How it works

Each env var the API reads is listed with comments in `backend/.env.example`; `src/env.ts`
validates them at startup. No sign-in, so there is no `ALLOWED_EMAILS`.

```
PLAN.md                                 decisions: tracks, environments, lessons, names
infra/compose/dev.yml                   development Postgres
examples/react-hono-postgres/
  backend/src/contract.ts               API shapes + Zod schema, imported by the frontend
  backend/src/app.ts                    request IDs, request logs, error responses
  backend/src/routes/                   /api/entries, /api/health
  backend/src/db/                       schema, pool, migrate, seed
  backend/drizzle/                      migrations
  backend/Dockerfile                    API image (also runs the migrations)
  compose.yml, Caddyfile                production images locally and in CI
  frontend/src/                         the guestbook page
examples/nextjs-fullstack-postgres/
  Dockerfile, compose.yml               standalone image (also runs the migrations), local stack
site/src/content/docs/                  the guide, one folder per part
```
