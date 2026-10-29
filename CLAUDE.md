# Seedhi

A step-by-step guide (Astro Starlight, `site/`) to building, deploying and monitoring a small
full-stack app (a guestbook) on a 1 vCPU / 1 GB / 10 GB VPS. Live at https://seedhi.pknspace.com,
repo `mepkn/seedhi` (public).

**Read [PLAN.md](PLAN.md) first.** It holds every decision: tracks, environments, env files,
branches and CI/CD, migrations, VPS memory budget, monitoring tools, alerts, the lesson list and
names. Don't re-decide what it settles; if something must change, update PLAN.md too.

## Status (2026-10-29, session 7)

Done:
- `examples/react-hono-postgres/`: backend (Hono, Drizzle, Zod, pino, request IDs, rate limit,
  migration 0000, seed) and frontend (Vite + React + Tailwind, form validation, loading/empty/error
  states, footer from `/api/health`). Verified locally against Postgres and in the browser.
- `site/`: Starlight with all 49 pages. Written: home page, Part 0 (0.1–0.3), Part 1
  (1.1–1.9, both tracks), Part 2 (2.1–2.3), Part 3 (3.1–3.4), Part 4 (4.1–4.2) and 5.1–5.3. Code in Part 1 is imported from
  `examples/` with `?raw` (path `../../../../../examples/...` from a lesson; excerpts via
  `.slice(indexOf(...))` in an `export const`). Every other lesson is a stub (Goal filled in,
  sections empty, a "Being written" note).
- Part 1 Verify steps were all run against a fresh dev database on 2026-10-29 (outputs in the
  lessons are real). 0.3's baseline commands were tested on the VPS (in a temp folder, then
  removed). Findings for Part 3: used memory ~345 MB (PLAN says ~300), 512 MB swap already
  exists and is `virtual` on `/dev/loop12` (likely a container VPS: check whether a swapfile is
  even possible before writing 3.2), no `/etc/docker/daemon.json`, no `deploy` user, `/srv` has
  only `pralekh`, 8 containers, `pkn` runs docker without sudo.
- Real baseline saved 2026-10-29: `~/seedhi-baseline/` on the VPS and on the Mac (11 files,
  outside the repo). Lesson 8.2 diffs against it; don't delete either copy before then.
- `examples/nextjs-fullstack-postgres/` (session 3, 2026-10-29): Next.js 16, one app. Page is a
  Server Component reading `src/lib/entries.ts` directly; the form is a Client Component calling
  a Server Action (`src/app/actions.ts`); Route Handlers for `/api/entries`, `/api/health`, and
  a catch-all `/api/[...path]` 404. `src/proxy.ts` sets `X-Request-Id`; `src/lib/request.ts`
  has `requestContext()`, `errorBody()`, `route()`; `instrumentation.ts` validates env at
  startup (`env.ts` skips the check during `next build`). `drizzle/` and the db scripts are
  copies of the React track's (`scripts/check.sh` diffs `drizzle/`). Its `DATABASE_URL` uses
  `127.0.0.1`: with `localhost`, a stopped database gives an `AggregateError` that crashes
  `next dev` (prod is fine). Verified against
  Postgres with curl and in the browser; Part 1's Next.js tabs are filled.
- `infra/compose/dev.yml` (Postgres 18 for development), `scripts/check.sh`, `scripts/deploy-site.sh`.
- Guide deployed: `/var/www/seedhi`, `/etc/caddy/sites/seedhi.caddy` (multi-page static block
  with a 404 page, not the SPA block).
- Cloudflare Tunnel routes exist for `seedhi`, `guestbook`, `guestbook-staging` (all →
  `http://localhost:8080`). No Caddy files for the guestbook hostnames yet (lesson 3.4).
- Part 2 (session 4, 2026-10-29): `backend/Dockerfile` (2 stages) and the Next.js
  `Dockerfile` (4 stages: deps, build, migrate-deps, runtime; `output: "standalone"`, sharp
  excluded). The standalone server bundles drizzle-orm and zod, so a migrate-deps stage installs
  the runtime deps minus next/react into the runtime `node_modules` (standalone copied on top);
  both images run `node src/db/migrate.ts` for migrations. Per-track `compose.yml` (+ React's
  `Caddyfile`) runs the images locally on :8080. Lessons 2.1–2.3 written; every Verify run on
  this Mac (images ~65/~70 MB compressed; idle RAM: API 31 MB, Next.js 57 MB, Postgres ~27 MB).
- Lesson 3.1 (session 5, 2026-10-29): written and verified. VPS is `lxc` (Proxmox,
  `systemd-detect-virt`), private IP 10.10.10.47 behind NAT; only SSH (20044) is forwarded, so
  Caddy's `*:8080` isn't public (public :8080/:22 on that IP are other machines). `deploy` user
  created (uid 1000, groups deploy/users/docker, no password, no sudo), key
  `~/.ssh/seedhi_deploy` on the Mac (no passphrase), `/srv/guestbook` is `deploy:deploy 750`.
  `pkn`'s sudo needs a password: put sudo steps in a script in `~` and ask the user to run
  `ssh -t -p 20044 pkn@37.187.139.100 'sudo sh ~/<script>'`, then delete it.
- Lesson 3.2 (session 5): swap in tabs (lxc: host swap, nothing to do; kvm: swapfile steps,
  marked as not run). Log caps per service in compose, no `daemon.json` (user's decision: no
  Docker restart on the shared server). Verified as `deploy` with a throwaway
  `~/limits-test` (alpine:3.22 `hog` OOM-killed, exit 137; `chatty` logs stay capped); test
  folder and image removed afterwards. Limits in PLAN.md (VPS section); every compose file on
  the server must use the `x-logging` anchor and `mem_limit`.

- Lesson 3.3 (session 5): `infra/compose/postgres.yml` running on the VPS as
  `guestbook-postgres` (healthy, 64MB/20 conns, ~45 MB real + file cache). Databases and roles
  `guestbook_staging`, `guestbook_prod` exist. Secrets on the VPS only, never printed, both
  `deploy` 600 in `/srv/guestbook/postgres/`: `.env` (`POSTGRES_PASSWORD`) and `db-passwords`
  (`STAGING_DB_PASSWORD`, `PROD_DB_PASSWORD`; 4.2 reads it for `.env.production`).
  `postgres:18-alpine` is a new image vs the baseline (teardown removes it).

- Lesson 3.4 (session 5): React track live on the VPS as routing only:
  `/etc/caddy/sites/guestbook.caddy` (from `examples/react-hono-postgres/server/`),
  `/var/www/guestbook{,-staging}` (deploy-owned, placeholder `index.html` each; 4.2 replaces).
  `/api` gives 502 until the app runs on 127.0.0.1:3100/3101. Behind cloudflared, Caddy's
  `X-Forwarded-For` is `::1`; real IP only in `CF-Connecting-IP`. Shiki has no `caddy`
  language: use `lang="txt"`.

- Lesson 4.1 (session 6, 2026-10-29): written and verified. Both images built on the Mac for
  `linux/amd64` (`--provenance=false`, source label) and pushed as
  `ghcr.io/mepkn/seedhi-{react-api,nextjs}:2a0fe02` and `:tree-804e909`; both packages are
  public (user's decision), untagged leftovers deleted. `deploy` pulled both with no registry
  login (`x64`; 280/304 MB on disk); both images are still on the server for 4.2. The `gh`
  token now has `write:packages`, `delete:packages`; Docker is logged in to ghcr.io on the Mac.
  Both packages are linked to `mepkn/seedhi`, by hand (Connect Repository): the first push
  (an index without `--provenance=false`) created them unlinked, and a later push with the
  label did not link them. The packages REST API (`.repository.full_name`) reflects the link
  correctly. In 5.3, check Package settings → Manage Actions access gives `seedhi` Write. zsh pitfall: `$IMAGE:tree-…`
  is the `:t` modifier; write `${IMAGE}:tree-${TREE}`.

- Lesson 4.2 (session 6): written and verified. React track is **live in production** at
  https://guestbook.pknspace.com (`guestbook-production-api-1`, `2a0fe02`, ~33 MB), frontend
  rsynced to `/var/www/guestbook` (rsync `-a` made the folder 755 without setgid; harmless).
  `/srv/guestbook/` has `compose.yml` (React's `server/compose.yml`) and `.env.production`
  (600; `DATABASE_URL` + `LOG_LEVEL` only). The Next.js `server/compose.yml` was run on the
  server once (healthy, ~69 MB) and taken down, before the profile change (its new version is
  only checked with `compose config`). Two real entries in `guestbook_prod`. Found: with
  `depends_on`, `up` recreates the app before `migrate` and a failing migration takes the site
  down (prod was down ~1 min while testing); hence the `migrate` profile (PLAN.md).
  Staging (`.env.staging`, port 3101) is not set up yet: Part 5.

- Lesson 5.1 (session 7, 2026-10-29): written and verified. Branch `staging` exists; rulesets
  `main` (id 26149345, merge commits only) and `staging` (id 26149347, squash or merge), from
  `infra/github/rulesets/*.json`: PR required (0 approvals), no deletion, no force push; admin
  bypass `always` (user's decision). The bypass also allows squash on `main` (PR #2 was squashed
  by accident; fixed by force-pushing `staging` to `main`'s commit, same tree): always
  `gh pr merge staging --merge`. Guide/PLAN edits: either PR flow (feature → staging squash →
  staging → main merge) or a direct push to `main`, then `git push origin main:staging`
  (fast-forward) so the branches stay level. Merging into `main` may need the user's permission.
- Lesson 5.2 (session 7): written and verified. `.github/workflows/ci.yml` (3 jobs, ~1 min)
  and `scripts/smoke-test.sh`; both rulesets require the 3 checks (GitHub Actions app 15368).
  Verified with a drift PR (#6, closed): `checks` and React smoke failed, state `BLOCKED`. Admin
  bypass merges red PRs too, so never `gh pr merge` before checks pass.
- Lesson 5.3 (session 7): written and verified. Staging is **live, deployed by CI** at
  https://guestbook-staging.pknspace.com (`guestbook-staging-api-1`, ~27 MB). GitHub setup in
  PLAN.md (Branches and CI/CD). Both packages have Actions access Write for `seedhi` (set by
  the user). `deploy` has 2 authorized keys (the Mac's, `seedhi-ci`). First deploy found
  `docker compose run` eating the `bash -s` script (green step, staging down; smoke test
  caught it). The classifier blocks adding SSH keys and writing GitHub secrets: ask the user.

Next, in order:
1. Part 5 (5.4 promote to production, 5.5 rollback, …), then
   Parts 6–8, each verified on the real VPS before its lesson is written.

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
