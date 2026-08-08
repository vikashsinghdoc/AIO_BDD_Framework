# TestGenie — AI-Powered Test Automation & Intelligence

A one-stop shop for the Playwright + Cucumber BDD engine: trigger runs from a web UI, watch
a live Jenkins-style console while they execute, and browse every past run — scenario grid,
step-level errors, and decoded failure screenshots — from a Postgres-backed history.

```
platform/
├── engine/      the Playwright + Cucumber BDD test framework you already had (lightly patched)
├── backend/     Spring Boot orchestrator: triggers runs, parses cucumber.json, persists to Postgres
├── frontend/    React + Vite + Tailwind console UI
└── docker-compose.yml
```

## How it fits together

1. The UI (`frontend/`) posts a run configuration (tags, browser, parallel workers, headless,
   screenshot/video/trace mode, base URL overrides) to the backend.
2. The backend (`backend/`) spawns the engine's `npm test` as a child process with those values
   mapped onto the same environment variables `engine/.env` already understands
   (`HEADLESS`, `SCREENSHOT`, `VIDEO`, `TRACE`, `PARALLEL_WORKERS`, `BROWSER`, `BASE_URL`,
   `API_BASE_URL`), plus `REPORT_DIR=reports/run-<id>` so each run's `cucumber.json` lands in
   its own folder.
3. Console output is streamed line-by-line back to the UI over Server-Sent Events
   (`GET /api/runs/{id}/stream`), so the run page behaves like a Jenkins console.
4. When the process exits, the backend parses `reports/run-<id>/cucumber.json` — features,
   scenarios, steps, durations, error messages, and any `embeddings` (the base64 screenshots
   your `hooks.ts` already attaches via `this.attach(...)`) — decodes the images, and persists
   everything to Postgres.
5. The dashboard, history table, and run-detail scenario grid all read from Postgres, so a
   run's screenshots and errors are available long after the process has exited.

Runs execute **one at a time** against the single `engine/` checkout (a `QUEUED` run waits for
the current one to finish) — this avoids two processes racing to write the same
`node_modules`/report files. Parallelism *within* a run is still fully configurable via the
`parallelWorkers` field, which maps straight to Cucumber's own `--parallel`.

## Prerequisites

- Java 21+
- Node 20+
- Postgres 15+ (or use the provided `docker-compose.yml`)
- Playwright browsers installed once inside `engine/`:
  ```bash
  cd engine
  npm install
  npx playwright install --with-deps chromium firefox webkit
  ```

Backend build is Gradle, invoked via `./gradlew` (Linux/Mac) or `gradlew.bat` (Windows) —
**no separate Gradle install needed**, the wrapper downloads the right version on first run.
If you're on `docker compose`, you don't even need that: the backend image builds itself
inside an official `gradle:8.10-jdk21` container, so nothing beyond Docker is required.

## Local development (no Docker)

```bash
# 1. Postgres
docker run -d --name test-platform-db -p 5432:5432 \
  -e POSTGRES_DB=test_platform -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  postgres:16-alpine

# 2. Backend (from repo root)
cd backend
./gradlew bootRun
# reads engine.working-directory=../engine by default — see application.yml

# 3. Frontend
cd frontend
npm install
npm run dev
# open http://localhost:5173 (Vite proxies /api to http://localhost:8080)
```

Environment variables the backend understands (all optional, sensible defaults in
`backend/src/main/resources/application.yml`):

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | `localhost` / `5432` / `test_platform` / `postgres` / `postgres` | Postgres connection |
| `ENGINE_DIR` | `../engine` | Path to the engine checkout |
| `ENGINE_COMMAND` | `npm test --` | Command used to invoke the suite |
| `ENGINE_TIMEOUT_MINUTES` | `30` | Hard kill switch for a hung run |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Frontend origin(s) allowed to call the API |
| `ATTACHMENT_ENCRYPTION_KEY` | insecure dev default | AES-256-GCM key for screenshot encryption at rest — see below |

Running Grafana against a locally-installed (non-Docker) Postgres is still just one command —
Grafana itself runs in Docker either way, no separate install needed:

```bash
docker run -d --name test-platform-grafana -p 3000:3000 \
  -e GF_SECURITY_ADMIN_USER=admin -e GF_SECURITY_ADMIN_PASSWORD=admin \
  -e PG_HOST=host.docker.internal -e PG_PORT=5432 -e PG_DATABASE=test_platform \
  -e PG_USER=postgres -e PG_PASSWORD=postgres \
  -v "$(pwd)/grafana/provisioning:/etc/grafana/provisioning" \
  -v "$(pwd)/grafana/dashboards:/var/lib/grafana/dashboards" \
  grafana/grafana-oss:11.2.0
```

(`host.docker.internal` resolves to your Mac's localhost from inside the container — that's how
Grafana reaches the Postgres you installed via Homebrew.)

## Docker Compose (Postgres + backend + frontend + Grafana)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Grafana: http://localhost:3000 (login `admin` / `admin`, change it after first login)
- The backend image bakes `engine/` in at build time, including
  `npx playwright install --with-deps`, so the container is self-contained. Rebuild
  (`docker compose build backend`) whenever `engine/` or its dependencies change.

## Attachment encryption

Screenshots (and any other `this.attach(...)` binary data) are encrypted with **AES-256-GCM**
before they're written to Postgres, and decrypted on the fly when the UI requests them via
`/api/attachments/{id}`. The key is a passphrase (PBKDF2-stretched into a real AES key), set via:

```
ATTACHMENT_ENCRYPTION_KEY=<your-secret>
```

Locally this defaults to an insecure placeholder (`dev-only-insecure-default-change-me`) so
nothing extra needs installing to get started — but **set a real value in any shared or
production environment**, e.g.:

```bash
export ATTACHMENT_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

Changing the key makes previously-stored attachments undecryptable (by design — treat it like
a database password). Back it up somewhere safe if you care about historical screenshots.

## Steps Explorer — the complete grid

Beyond the per-run scenario grid, `/explorer` in the UI (and `GET /api/steps` in the API) is a
single flattened, paginated table of **every step from every scenario across every run ever
recorded**, filterable by any combination of: run status, scenario status, step status, feature
name, scenario name, step text, tag, browser, date range, and "only rows with an error." Each
row expands inline to the full step error message and any screenshots attached to that scenario.

This is backed by two Postgres views (`V2__reporting_views.sql`): `v_scenario_detail` and
`v_step_detail`, which flatten the normalized `test_run` → `feature_result` → `scenario_result`
→ `step_result` tables into query-friendly rows. These views are also what Grafana queries
directly (see below), so the grid and the dashboards are always looking at identical data.

## Grafana

Postgres is the single source of truth — Grafana is provisioned to point straight at it
(`grafana/provisioning/datasources/postgres.yml`), and a starter dashboard
(`grafana/dashboards/test-ops-overview.json`) is auto-loaded on boot with:

- Pass rate (stat) + pass rate over time (time series)
- Run volume by outcome (passed/failed/skipped, time series)
- Total runs, failed scenarios, avg run duration (stat panels)
- Failures by tag (bar chart)
- Step failure hotspots by step keyword (bar chart)
- Recent failed scenarios (table, with error text)

All panels query two more reporting views built for this: `v_run_daily_stats` (daily
pass-rate/volume rollups) and `v_tag_failure_stats` / `v_step_failure_stats` (failure counts
grouped by tag / step keyword per day) — see `V2__reporting_views.sql`.

To extend it: open the dashboard in Grafana, edit/add panels with your own SQL against
`v_step_detail`, `v_scenario_detail`, or the raw tables, then **Save** — with
`allowUiUpdates: true` in the provisioning config, edits persist. Or just add more `.json`
dashboard files to `grafana/dashboards/` and they'll be picked up automatically.

Note: Grafana panels only ever read decoded metadata (status, duration, tags, error text) —
attachment bytes are encrypted at rest and Grafana has no decryption key, so screenshots aren't
(and can't be) rendered inside Grafana. View those in the app's UI instead.

## API reference (backend)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/runs` | Trigger a run. Body: `RunRequest` (tags, browser, headless, parallelWorkers, screenshot/video/traceMode, baseUrl, apiBaseUrl) |
| `POST` | `/api/runs/{id}/cancel` | Forcibly kill an in-progress run |
| `GET` | `/api/runs?status=&tag=&from=&to=&page=&size=` | Paginated run history |
| `GET` | `/api/runs/{id}?status=&tag=&search=` | Run detail + filtered scenario list |
| `GET` | `/api/runs/{id}/stream` | SSE live console (replays backlog on connect) |
| `GET` | `/api/steps?runId=&runStatus=&scenarioStatus=&stepStatus=&feature=&scenario=&step=&tag=&browser=&from=&to=&onlyErrors=&page=&size=` | The complete, filterable step-level grid across all runs |
| `GET` | `/api/attachments/{id}` | Decrypted screenshot/binary attachment |
| `GET` | `/api/scenarios/{id}/attachments` | Attachment metadata (id + mime type) for a scenario |
| `GET` | `/api/tags` | Distinct `@tags` discovered in `engine/features/**/*.feature` |
| `GET` | `/api/dashboard/summary` | Aggregate stats for the Mission Control page |

## Engine changes made for the platform

Two small, backwards-compatible tweaks in `engine/`:

- `cucumber.cjs` — report paths now honor a `REPORT_DIR` env var (default `reports`), so the
  backend can give every run its own `reports/run-<id>/cucumber.json` instead of overwriting a
  single shared file.
- `config/framework.yaml` / `src/support/config.ts` — `browser.name` is now driven by a
  `BROWSER` env var (defaulting to `chromium`) instead of being hardcoded, so the UI's browser
  picker actually takes effect.

Everything else — hooks, steps, locators, world — is untouched. `npm test`, `npm run test:ui`,
etc. still work exactly as before if you run the engine standalone.

## Notes on what's intentionally out of scope for v1

- **Auth** — there's no login; add Spring Security in front of `/api/**` before exposing this
  beyond a local/trusted network. This also means Grafana's own login (`admin`/`admin` by
  default) is your only access control right now — change that password.
- **Multi-run concurrency** — one run executes at a time (see above). Running multiple engine
  checkouts in parallel would remove this constraint if you need it later.
- **Trace/video file browsing** — screenshots are decoded into Postgres and viewable in the UI;
  trace `.zip` and video `.webm` files are written to `engine/reports/run-<id>/` on disk but
  aren't yet surfaced as downloads in the UI. A good follow-up: add a
  `GET /api/runs/{id}/artifacts` endpoint that lists/serves files from `reportDirectory`.
