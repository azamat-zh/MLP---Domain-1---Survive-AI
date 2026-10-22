# SkillCast

A weather forecast for your career in the AI era. SkillCast is a proof-of-concept (POC) built for the Aiversecity Future-Ready Workforce challenge (SDG "Survive AI" domain). It tracks live job-market signals, predicts rising and declining skills, matches a profile to future roles with explainable scores, builds a Duolingo-style reskilling pathway from curated courses, and maps every role to the UN SDGs.

Key characteristics:

- Deterministic core: all scoring and matching math is published, client-side, and deterministic. The LLM is used for narration only, with a deterministic fallback.
- Synthetic data only: profiles, team and sample CV are fabricated (competition rule); live signals come from Remotive and Arbeitnow, with curated fallback sources.
- Privacy by design: the uploaded CV is scrubbed and parsed entirely in the browser; the raw text is never sent anywhere.

## Features

- Live skill signals from Remotive + Arbeitnow with a Skill Momentum Index (SMI) per skill
- Explainable role matching with a published formula (overlap, transferable, experience, interest)
- Reskilling pathway planner from curated courses (course hours vs weekly budget)
- Harada transferability matrix and team-gap heatmap (employer view)
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
git clone <repository-url>
cd MLP---Domain-1---Survive-AI
bun install
bun run db:push      # create/update the SQLite schema in db/custom.db
bun run dev          # http://localhost:3000
```

Open http://localhost:3000. The onboarding flow (landing -> CV upload -> dashboard) is the main golden path; it can also be exercised with the bundled sample CV.

### Environment Variables

Create `.env.local` (or edit `.env`) with at least:

```
DATABASE_URL=file:../db/custom.db
```

- `DATABASE_URL` (required): SQLite file URL. Prisma resolves relative `file:` paths against `prisma/schema.prisma`, so the repository database `db/custom.db` is `file:../db/custom.db`. An absolute path works too.
- The committed `.env` carries a sandbox path (`file:/home/z/my-project/db/custom.db`) that is invalid outside that sandbox (for example on Windows). Always override `DATABASE_URL` locally.
- Optional: `PORT` (default 3000), `HOSTNAME` (default 0.0.0.0), `NEXT_TELEMETRY_DISABLED`.

## Available Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Next.js dev server on port 3000 |
| `bun run build` | Production build; copies static and public assets into `.next/standalone/` |
| `bun run start` | Serve the standalone build (`NODE_ENV=production bun .next/standalone/server.js`) |
| `bun run lint` | ESLint over the repo (flat config) |
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

Deployment packaging (Linux sandbox):

- `.zscripts/build.sh` assembles `next-service-dist/` (standalone server, static assets, database, optional Python runtime) and tars it.
- `.zscripts/start.sh` boots the packaged app: standalone server + mini-services, then `exec caddy run --config Caddyfile`.
- `Caddyfile` proxies port 81 to `localhost:3000`; the `?XTransformPort=N` query parameter forwards to `localhost:N`.
- `mini-services/` is reserved for standalone micro-apps (currently empty); each subdirectory is its own Bun project with its own `package.json`.

See `docs/` for architecture, data model, development conventions and the verification workflow.

## Project Structure

```
src/
  app/                 # page.tsx (view switcher), layout.tsx, api/signals, api/coach
  components/skillcast/  # screens: Landing, Onboarding, Dashboard, Employer, SignalsView
  components/ui/       # shadcn/ui primitives
  lib/                 # engines: matching, momentum, cv, i18n, store, db, types, utils
  data/                # static datasets: skills, roles, courses, team, curated, sample-cv
  hooks/               # use-mobile, use-toast
prisma/schema.prisma   # SQLite models: SignalRun, SignalSnapshot, ChangelogEntry
db/custom.db           # local SQLite database (runtime state)
.zscripts/             # lifecycle scripts: dev.sh, start.sh, build.sh
tests/                 # build-tooling shell tests
scripts/               # golden-path verification screenshots (verify-*.png)
docs/                  # documentation
```

## Verification

- `bun run lint` for static checks.
- `bash tests/database-runtime-build.sh` and `bash tests/python-runtime-build.sh` exercise the deployment build tooling (the container variant needs Docker).
- The feature-verification workflow is a manual browser golden path with screenshots in `scripts/verify-*.png`; see `docs/verification.md`.

## Documentation

- `docs/README.md` - index of the documentation pages
- `docs/architecture.md` - system architecture and data flow
- `docs/data-model.md` - database schema, signal pipeline, matching math
- `docs/development.md` - conventions and patterns for contributors
- `docs/verification.md` - how this project is tested and verified
- `AGENTS.md` - concise guidelines for AI assistants working in this repository