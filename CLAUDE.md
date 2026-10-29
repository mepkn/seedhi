# Seedhi

A step-by-step guide (Astro Starlight, `site/`) to building, deploying and monitoring a small
full-stack app (a guestbook) on a 1 vCPU / 1 GB / 10 GB VPS. Live at https://seedhi.pknspace.com,
repo `mepkn/seedhi` (public).

**Read [PLAN.md](PLAN.md) first.** It holds every decision: tracks, environments, env files,
branches and CI/CD, migrations, VPS memory budget, monitoring tools, alerts, the lesson list and
names. Don't re-decide what it settles; if something must change, update PLAN.md too.

## Status (2026-10-29)

Done:
- `examples/react-hono-postgres/`: backend (Hono, Drizzle, Zod, pino, request IDs, rate limit,
  migration 0000, seed) and frontend (Vite + React + Tailwind, form validation, loading/empty/error
  states, footer from `/api/health`). Verified locally against Postgres and in the browser.
- `site/`: Starlight with all 49 pages. Written: home page and 0.1. Every other lesson is a
  stub (Goal filled in, sections empty, a "Being written" note).
- `infra/compose/dev.yml` (Postgres 18 for development), `scripts/check.sh`, `scripts/deploy-site.sh`.
- Guide deployed: `/var/www/seedhi`, `/etc/caddy/sites/seedhi.caddy` (multi-page static block
  with a 404 page, not the SPA block).
- Cloudflare Tunnel routes exist for `seedhi`, `guestbook`, `guestbook-staging` (all →
  `http://localhost:8080`). No Caddy files for the guestbook hostnames yet (lesson 3.4).

Next, in order:
1. Write lessons 0.2, 0.3 and Part 1 (1.1–1.9) against the working React + Hono code, with
   Next.js tabs left as "coming" until that track exists.
2. Build `examples/nextjs-fullstack-postgres/` (Route Handlers for `/api/*`, a Server Action for
   the form, same schema and migrations), add it to `scripts/check.sh` plus the check that both
   `drizzle/` folders are identical. Fill the Next.js tabs in Part 1.
3. Part 2: Dockerfiles for both tracks, compose for running production images locally, the env
   files lesson (2.3).
4. Then Parts 3–8 in order, each verified on the real VPS before its lesson is written.

Later (user's own task): add Seedhi to https://dash.pknspace.com/edit (web + source links).

## Conventions for this repo

- Lesson pages: **Goal → Steps → Verify → What you learned → Undo**. Every lesson that creates
  something on the server lists its undo; Part 8 (`scripts/teardown.sh`) is the sum of them.
  Use Starlight `<Tabs syncKey="track">` with tabs "React + Hono" and "Next.js" where steps
  differ. Use placeholders like `guestbook.<your-domain>` for readers.
- Code in lessons should come from the real files in `examples/` (import with `?raw` and
  Starlight's `<Code>`), so the guide never drifts from code that runs.
- The backend runs TypeScript directly with Node 22.18+ (no build step): `.ts` import
  extensions, erasable syntax only.
- The React frontend imports `@contract` → `backend/src/contract.ts` (shared Zod schema and
  API types); its `zod` resolves from the frontend's own `node_modules`.
- The guestbook uses plain Tailwind, no shadcn, so readers can follow the code.
- The frontend always calls same-origin `/api` (Vite proxy in dev, Caddy on the server).
- Each track is self-contained; only one is deployed at a time.
- Run `scripts/check.sh` before committing. Deploy the guide with `scripts/deploy-site.sh`.

## Local development

```bash
docker compose -f infra/compose/dev.yml up -d --wait
cd examples/react-hono-postgres/backend && npm run dev     # :3000 (.env from .env.example)
cd examples/react-hono-postgres/frontend && npm run dev    # :5173
cd site && npm run dev                                     # :4321
```
