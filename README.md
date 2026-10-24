# Team information
Team: MLP
Challenge: Aiversecity Future-Ready Workforce
Domain: Domain 1 — Skillcast
SDG-Track(1-17): 4 — Quality Education,8 — Decent Work and Economic Growth,10 — Reduced Inequalities
Team Leader: Omirzak Aiym
University: Xiament University Malaysia 
Number of members: 5

# Links
GitHub Repository: https://github.com/azamat-zh/MLP---Domain-1---Survive-AI
Replit project:https://replit.com/t/mlp/repls/MLP-Domain-1-Survive-AI
Live Demo: https://skillcast-tau.vercel.app/
Runpod endpoint: https://api.runpod.ai/v2/3sz0imio0udhna/runsync
Slide deck: https://canva.link/sexmhkzmvoduxpe
Demo video:

## How We Used Replit and RunPod

**Replit:** We used Replit’s development environment and AI agent extensively to generate and edit application code, implement interfaces, and debug the prototype. The team directed development and tested the resulting user journeys.

**RunPod:** We deployed Qwen2.5-7B-Instruct through vLLM on a serverless GPU endpoint. The model supports two application functions:
- Extracting proposed profile information from de-identified CV text.
- Explaining career-match results using supplied scores and facts.
Users review and confirm extracted profile information. Matching scores, skill gaps and Harada plans are calculated through deterministic rules. Rule-based extraction and template explanations provide fallbacks when model inference is unavailable.
Supporting evidence is available in the [submission folder](./submission/).


# SkillCast

A weather forecast for your career in the AI era. SkillCast is a proof-of-concept (POC) built for the Aiversecity Future-Ready Workforce challenge (SDG "Survive AI" domain). It tracks live job-market signals, predicts rising and declining skills, matches a profile to future roles with explainable scores, builds a Duolingo-style reskilling pathway from curated courses, and maps every role to the UN SDGs.

Key characteristics:

- Deterministic core: all scoring and matching math is published, client-side, and deterministic. The LLM is used only for narration and CV-extraction proposals, always behind a deterministic fallback and a human confirm step.
- Synthetic data only: profiles, team and sample CV are fabricated (competition rule); live signals come from four free job APIs (Remotive, Arbeitnow, Greenhouse, Ashby — see `docs/ai-call-sites.md`), with curated fallback sources.
- Privacy by design: the uploaded CV is scrubbed in the browser; only de-identified text reaches the self-hosted extraction endpoint (on a run-of-the-mill GPU cloud, no prompt persistence), and save in profile and progress to localStorage.

## Features

- Live skill signals from Remotive + Arbeitnow with a Skill Momentum Index (SMI) per skill
- Explainable role matching with a published formula (overlap, transferable, experience, interest)
- AI-assisted CV extraction into a strict JSON schema (self-hosted Qwen on RunPod, deterministic in-browser fallback, human confirmation)
- Reskilling pathway planner from curated courses (course hours vs weekly budget)
- Personalised Harada roadmap with eight learning areas, practical tasks, curated course links, progress tracking and study-time estimates.
- UN SDG ledger mapping every role to SDG targets
- i18n: English, Bahasa Malaysia, Chinese, Russian
- Dark theme by default, light one click away

## Tech Stack and Dependencies

| Dependency | Purpose | Required |
| --- | --- | --- |
| Bun >= 1.x | Runtime and package manager (only `bun.lock` is present; `npm start` will not work) | yes |
| Next.js 16 (App Router) | Web framework, standalone output | via bun.lock |
| React 19, TypeScript | UI and types | via bun.lock |
| Tailwind CSS 4 + shadcn/ui | Styling and component library | via bun.lock |
| Prisma 6 + SQLite | Persistence (`db/custom.db`) | via bun.lock |
| zustand | Client state (view + profile, localStorage persistence) | via bun.lock |
| next-themes | Dark-first theming | via bun.lock |
| Caddy | Production reverse proxy (port 81 -> 3000) | production only |
| Python 3.12 + uv | Optional Python runtime for deployment packaging | deployment only |

Node.js is not required to run the app; Bun executes the scripts. The `npx`-based tooling referenced in `docs/` (Prisma CLI via `bunx`) uses Bun's built-in package runner.

## Getting Started

Prerequisites: Bun installed (verify with `bun --version`), and Git.

```bash
git clone https://github.com/azamat-zh/MLP---Domain-1---Survive-AI.git
cd MLP---Domain-1---Survive-AI
bun install
bun run db:generate
bun run db:push       # create/update the SQLite schema in db/custom.db
bun run dev            # http://localhost:3000
```

Open http://localhost:3000. The onboarding flow (landing -> CV upload -> dashboard) is the main golden path; it can also be exercised with the bundled sample CV. Otherwise we can just directly open our website using link above.

### Environment Variables

Create `.env.local` (or edit `.env`) with at least:

```
DATABASE_URL=file:../db/custom.db
```

- `DATABASE_URL` (optional): SQLite file URL. A relative (or missing) value resolves at startup in `src/lib/db.ts` to the repository's `db/custom.db` — this works identically in dev and the standalone production build. Use an absolute path (e.g. `file:/app/db/custom.db`) to point elsewhere.
- `.env` and `db/custom.db` are gitignored runtime state. A leftover local `.env` may carry an invalid sandbox path (`file:/home/z/my-project/db/custom.db`); put your real values in `.env.local` (`bun run setup:runpod` does this). First run: `bun run db:push` creates the local database; the signals view falls back to the seeded snapshot until a live refresh.
- Troubleshooting: if the signals view errors with `Unable to open the database file`, check for an inherited `DATABASE_URL` environment variable — an exported or IDE-injected value overrides every `.env` file. `echo $DATABASE_URL` (or `env | grep DATABASE_URL`) reveals one; unset it or start with `DATABASE_URL=file:../db/custom.db bun run dev`.
- `RUNPOD_API_KEY` (optional): API key used server-side to call the self-hosted vLLM endpoint for AI-assisted CV extraction. Without it, onboarding falls back to deterministic in-browser extraction. Keep it in `.env.local` (gitignored).
- `RUNPOD_ENDPOINT_ID` (optional): Runpod serverless endpoint id; defaults to the deployed `skillcast-qwen` endpoint.
- Optional: `PORT` (default 3000), `HOSTNAME` (default 0.0.0.0), `NEXT_TELEMETRY_DISABLED`.
- `CRON_SECRET` (optional): Secret for the scheduled-signal-ingest endpoint (`/api/signals/cron`).
  If set, the cron route requires `Authorization: Bearer <secret>`. See "Scheduled signal ingest" below.

### Scheduled signal ingest

The signals pipeline can be triggered on a schedule (e.g. every 30 minutes) via the
`/api/signals/cron` endpoint. It force-refreshes live signals, writes a changelog
entry, and prunes old runs — the same as a manual POST to `/api/signals` but without
the 60-second in-process cooldown.

Set `CRON_SECRET` in your environment (`.env` or `.env.local`):

```
CRON_SECRET=your-long-random-secret
```

Then configure a cron job to call the endpoint every 30 minutes:

```cron
*/30 * * * * curl -fsS -H "Authorization: Bearer your-long-random-secret" https://your-app.example.com/api/signals/cron
```

Without the correct `Authorization` header the endpoint returns 401.
Without `CRON_SECRET` set, the endpoint returns 501 (Not Implemented).

### Connect Runpod (optional — AI-assisted CV extraction)

Runpod powers /api/extract-cv and  /api/coach call site in the app: CV → structured profile extraction
(`/api/extract-cv`), served by the shared team endpoint `skillcast-qwen`
(self-hosted Qwen2.5-7B-Instruct on vLLM, region EU-RO-1). Without a key the app
is fully functional — onboarding falls back to deterministic in-browser skill
extraction.

1. Create a Runpod account and API key: https://console.runpod.io -> Settings -> API Keys -> Create (General Purpose). Keys start with `rpa_`.
2. Connect in one command:
   ```bash
   bun run setup:runpod        # prompts for your key, writes .env.local
   ```
   The script also sets `DATABASE_URL=file:../db/custom.db` (the committed `.env`
   only carries the Linux sandbox path) and the shared `RUNPOD_ENDPOINT_ID`.
   Manual alternative: copy `.env.example` to `.env.local` and fill in `RUNPOD_API_KEY`.
3. Restart `bun run dev`.
4. Verify: paste a CV in onboarding — you should see "Analysing with AI…" while
   extracting, then the AI-assisted badge. Or:
   ```bash
   curl -X POST http://localhost:3000/api/extract-cv -H "Content-Type: application/json" \
     -d '{"text":"A short CV mentioning Python and machine learning…"}'
   ```
   A response with `"ok": true, "fallback": false` means the endpoint is connected.

Notes:
- Use your own key (billing goes to your account) or a shared team key — either works.
- The endpoint id is shared and already the default; do not deploy your own endpoint.
- First call after ~5 min idle triggers a ~2 min cold start, which outlives the route's
  50 s timeout — that call falls back to deterministic extraction, the next one is fast.
- Privacy: the CV is scrubbed in the browser; only de-identified text reaches Runpod,
  and it is never persisted by the endpoint.

## Available Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Next.js dev server on port 3000 |
| `bun run build` | Production build; copies static and public assets into `.next/standalone/` |
| `bun run start` | Serve the standalone build (`NODE_ENV=production bun .next/standalone/server.js`) |
| `bun run lint` | ESLint over the repo (flat config) |
| `bun run setup:runpod` | Interactive: prompts for a Runpod API key and writes `.env.local` (see Connect Runpod below) |
| `bun run db:push` | Push Prisma schema to the SQLite database (`--accept-data-loss`) |
| `bun run db:generate` | Regenerate the Prisma client |
| `bun run db:migrate` | Create and apply a new migration (`prisma migrate dev`) |
| `bun run db:reset` | Drop and re-migrate the database |

## Production and Deployment

Local production run:

```bash
bun run build
bun run start
```

Deployment packaging for the Linux sandbox is produced by local build tooling outside the repository. Runtime wiring:

- `Caddyfile` proxies port 81 to `localhost:3000`; the `?XTransformPort=N` query parameter forwards to `localhost:N`.
- `mini-services/` is reserved for standalone micro-apps (currently empty); each subdirectory is its own Bun project with its own `package.json`.

See `docs/` for architecture, data model, development conventions and the verification workflow.

## Project Structure

```
src/
  app/                 # page.tsx (view switcher), layout.tsx, api/signals, api/coach, api/extract-cv
  components/skillcast/  # screens: Landing, Onboarding, Dashboard, Employer, SignalsView
  components/ui/       # shadcn/ui primitives
  lib/                 # engines: matching, momentum, cv, i18n, store, db, types, utils
  data/                # static datasets: skills, roles, courses, team, curated, sample-cv
  hooks/               # use-mobile, use-toast
prisma/schema.prisma   # SQLite models: SignalRun, SignalSnapshot, ChangelogEntry
db/custom.db           # local SQLite database (runtime state)
tests/                 # build-tooling shell tests
scripts/               # golden-path verification screenshots (verify-*.png)
docs/                  # documentation
```

## Verification

- `bun run lint` for static checks.
- `bash tests/database-runtime-build.sh` and `bash tests/python-runtime-build.sh` exercise the deployment build tooling (the container variant needs Docker).
- The feature-verification workflow is a manual browser golden path with screenshots in `scripts/verify-*.png`; see `docs/verification.md`.

## Documentation

See the [`docs/`](docs/) folder for architecture, data model, development conventions and the verification workflow. `AGENTS.md` at the repository root is a concise guide for AI assistants working in this repository.
