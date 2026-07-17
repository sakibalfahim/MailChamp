# [MailChamp](https://mailchamp-tau.vercel.app/)

**AI-assisted email composition with a Gmail-quality archive UI**, backed by a research evaluation pipeline that compares prompting strategies on real scenarios.

MailChamp is **not** an email service provider. There is no SMTP or IMAP. “Sent” is a status transition on drafts you author and store.

| Layer | Technology |
|-------|------------|
| Web | Next.js (App Router), TypeScript, TipTap, Better Auth, Drizzle ORM |
| API | Go 1.22+, Chi, pgx, JWT bridge, Gemini (server-side only) |
| Data | PostgreSQL (Neon-compatible pooled URL) |
| Eval | Python CLI → static Insights report |

## Table of contents

- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Docker (full stack)](#docker-full-stack)
- [Reference production deploy ($0 path)](#reference-production-deploy-0-path)
- [Recommended production shape (GCP-oriented)](#recommended-production-shape-gcp-oriented)
- [GitHub Actions](#github-actions)
- [API specification](#api-specification)
- [Testing](#testing)
- [Security](#security)
- [Configuration reference](#configuration-reference)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Architecture

```
Browser  →  Next.js (auth + UI + BFF proxy)
                │
                ├─ Better Auth / Drizzle  →  PostgreSQL
                │
                └─ short-lived HS256 JWT  →  Go API
                                              ├─ emails CRUD (user-scoped)
                                              └─ Gemini generate (rate-limited)
```

- The browser never receives `GEMINI_API_KEY` or `MAILCHAMP_JWT_SECRET`.
- Folders: **All Mail** / **Drafts** / **Sent** / **Archive**.
- Locales: `en`, `ar`, `bn`, `zh`, `fr`, `ru`, `es` (Arabic is RTL).

---

## Repository layout

```
MailChamp/
  api/                 Go HTTP API (Render / Docker)
  web/                 Next.js app (Vercel / Docker)
  src/                 Python evaluation CLI
  prompts/             Prompt source of truth (sync → api/prompts/)
  data/scenarios.json  Eval scenarios
  results/             Checked-in eval artifacts for Insights
  docs/                API reference + research notes
  render.yaml          Reference Render Blueprint (free Go)
  docker-compose.yml   Local full-stack reproduction
  .github/workflows/   CI
```

---

## Prerequisites

- Node.js 20+
- Go 1.22+
- Python 3.11+ (eval CLI only)
- PostgreSQL 15+ (local Docker Compose, or a hosted Neon project)
- Gemini API key ([Google AI Studio](https://aistudio.google.com/))

---

## Local development

### 1. Database

**Option A — Docker Postgres (recommended for clean reproduction)**

```bash
docker compose up -d db
export DATABASE_URL="postgresql://mailchamp:mailchamp@localhost:5432/mailchamp?sslmode=disable"
```

**Option B — Hosted Neon**

Create a free Neon project and copy the **pooled** connection string into `DATABASE_URL`.

### 2. Secrets

Generate two **different** secrets (≥32 characters each):

```bash
openssl rand -base64 32
openssl rand -base64 32
```

```bash
cp web/.env.example web/.env
cp api/.env.example api/.env
# Set DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, GO_API_URL,
# MAILCHAMP_JWT_SECRET (same value in web/ and api/), GEMINI_API_KEY
```

`BETTER_AUTH_URL=http://localhost:3000`  
`GO_API_URL=http://localhost:8080`

### 3. Schema

```bash
cd web && npm install
npm run db:push                 # Better Auth tables
npm run db:migrate:emails       # emails table (FK → user)
cd ..
```

### 4. API

```bash
cd api
go mod download
go run .
# GET http://localhost:8080/api/v1/health
```

### 5. Web

```bash
cd web
npm run dev
# http://localhost:3000 → /en
```

### 6. Prompt sync (after editing `prompts/`)

```powershell
.\scripts\sync-prompts.ps1
```

```bash
cp prompts/advanced.md api/prompts/advanced.md
cp prompts/naive.md api/prompts/naive.md
```

### 7. Insights JSON (after re-running Python eval)

```bash
cp results/evaluation_report.json web/src/content/evaluation_report.json
```

---

## Docker (full stack)

```bash
cp web/.env.example web/.env
cp api/.env.example api/.env
# Fill GEMINI_API_KEY + JWT/auth secrets (see above).
# DATABASE_URL for compose services is provided by docker-compose.yml.

docker compose up --build
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:8080 |
| Postgres | localhost:5432 |

Stop: `docker compose down -v` (add `-v` only if you intend to wipe the volume).

---

## Reference production deploy ($0 path)

This repository’s battle-tested free-tier path:

1. Push to GitHub.
2. **Render** — Web Service, language Go, **Root Directory `api`**, build `go build -o mailchamp-api .`, start `./mailchamp-api`, health `/api/v1/health`. Env: `DATABASE_URL`, `GEMINI_API_KEY`, `MAILCHAMP_JWT_SECRET`, model defaults from `api/.env.example`. See `render.yaml`.
3. **Vercel** — Import repo, **Root Directory `web`**, Hobby. Env: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (prod URL), `GO_API_URL` (Render URL), `MAILCHAMP_JWT_SECRET` (must match Render).
4. Run migrations against the production DB (`db:push` + `db:migrate:emails`) before first signup.
5. Smoke: signup → compose → generate (allow cold start) → Insights.

Expect free-tier cold starts (Render ~30–50s + DB wake). Client budgets ~90s; Vercel Hobby may clamp serverless duration lower.

---

## Recommended production shape (GCP-oriented)

For teams already on Google Cloud (billing required for most managed services), a conventional production mapping:

| Concern | Suggestion |
|---------|------------|
| Front end | Cloud Run or Firebase Hosting + Cloud Run for Next.js |
| API | Cloud Run (Go container from `api/Dockerfile`) behind Cloud Load Balancing |
| DB | Cloud SQL for PostgreSQL (private IP) + Auth proxy / Connector |
| Secrets | Secret Manager (`GEMINI_API_KEY`, JWT, auth secret) |
| CI/CD | Cloud Build or GitHub Actions → Artifact Registry → Cloud Run |
| Observability | Cloud Logging + Error Reporting; uptime checks on `/api/v1/health` |
| Identity | Keep Better Auth on your Postgres, or migrate to Identity Platform if you need enterprise IdP |

This repo does **not** require GCP to run. Prefer the Render + Vercel path for demos; use the GCP shape when you need VPC, SLOs, and org IAM.

---

## GitHub Actions

CI workflow (`.github/workflows/ci.yml`):

- `go vet` + `go build` for `api/`
- `npm ci` + `npm run lint` + `npm run build` for `web/` (placeholder env vars for compile)

Extend the same workflow to deploy: build/push images to Artifact Registry or deploy Render/Vercel via their CLIs with repository secrets.

---

## API specification

See **[docs/API.md](docs/API.md)** for endpoints, auth, payloads, and error codes.

Summary:

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/health` | No | Liveness + DB ping |
| POST | `/api/v1/emails/generate` | JWT | Gemini compose |
| GET | `/api/v1/emails` | JWT | List (`status=` draft\|sent\|archived\|all) |
| GET | `/api/v1/emails/{id}` | JWT | Detail |
| POST | `/api/v1/emails` | JWT | Create |
| PATCH | `/api/v1/emails/{id}` | JWT | Update |
| DELETE | `/api/v1/emails/{id}` | JWT | Hard delete |

Browser clients call Next.js `/api/proxy/*`, which mints a ≤5 minute JWT after a Better Auth session check.

---

## Testing

### Manual product smoke

1. Health: `curl -s localhost:8080/api/v1/health`
2. Signup / signin (no password-reset in v1 — by design)
3. Compose → Generate → Save Draft → Mark Sent → Archive → Delete
4. Insights charts load while authenticated
5. Theme System/Light/Dark; locale switch including Arabic RTL

### Automated (CI)

```bash
cd api && go vet ./... && go build -o /dev/null .
cd web && npm ci && npm run lint && npm run build
```

### Python eval pipeline

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env        # GEMINI_API_KEY only for CLI
python -m src.generate --batch
python -m src.evaluate
```

Checked-in winner (see `results/evaluation_report.json`): **advanced 0.8783** vs **naive 0.7883**.

---

## Security

- Gemini keys and JWT signing secrets are **server-side only**.
- All email SQL is scoped by `user_id` from a validated HS256 JWT (`exp` required).
- Generate is rate-limited (**10 req / user / minute** per API instance).
- Request bodies capped at **1 MiB**; generate wall-clock timeout **~85s**.
- TipTap HTML is sanitized with DOMPurify before render.
- Insights eval JSON is served via an **authenticated** route (not a public static file).
- Better Auth: email/password, email verification off in v1, rate limiting on; **no forgot-password** (no outbound mail provider).
- CORS on the Go API is closed; intended access is Next.js server proxy only.
- Never commit `.env`. Rotate any secret that was ever pasted into chat or logs.

---

## Configuration reference

**`web/.env.example`:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GO_API_URL`, `MAILCHAMP_JWT_SECRET`

**`api/.env.example`:** `DATABASE_URL`, `GEMINI_API_KEY`, `MAILCHAMP_JWT_SECRET`, `PORT`, `GEMINI_MODEL`, `GEMINI_FALLBACKS`, retry/delay knobs

---

## License

MIT License

---

## Acknowledgments

Evaluation metrics and prompting research live under `src/` and `docs/final_report.md`. The web Insights surface reads the exported JSON; it does not re-implement scoring.
