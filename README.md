# Test Ops Console

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

## Docker Compose (Postgres + backend + frontend)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- The backend image bakes `engine/` in at build time, including
  `npx playwright install --with-deps`, so the container is self-contained. Rebuild
  (`docker compose build backend`) whenever `engine/` or its dependencies change.

## API reference (backend)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/runs` | Trigger a run. Body: `RunRequest` (tags, browser, headless, parallelWorkers, screenshot/video/traceMode, baseUrl, apiBaseUrl) |
| `POST` | `/api/runs/{id}/cancel` | Forcibly kill an in-progress run |
| `GET` | `/api/runs?status=&tag=&from=&to=&page=&size=` | Paginated run history |
| `GET` | `/api/runs/{id}?status=&tag=&search=` | Run detail + filtered scenario list |
| `GET` | `/api/runs/{id}/stream` | SSE live console (replays backlog on connect) |
| `GET` | `/api/attachments/{id}` | Decoded screenshot/binary attachment |
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
  beyond a local/trusted network.
- **Multi-run concurrency** — one run executes at a time (see above). Running multiple engine
  checkouts in parallel would remove this constraint if you need it later.
- **Trace/video file browsing** — screenshots are decoded into Postgres and viewable in the UI;
  trace `.zip` and video `.webm` files are written to `engine/reports/run-<id>/` on disk but
  aren't yet surfaced as downloads in the UI. A good follow-up: add a
  `GET /api/runs/{id}/artifacts` endpoint that lists/serves files from `reportDirectory`.
