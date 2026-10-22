# Architecture

## Overview

SkillCast is an SPA-shaped Next.js 16 (App Router) application. `src/app/page.tsx` is the only `'use client'` root and switches between five views held in a zustand store:

- `landing` - marketing/landing screen
- `onboarding` - CV upload, scrub and skill extraction
- `dashboard` - matches, pathway, Harada matrix, SDG ledger, demand stats (tabs)
- `employer` - team-gap heatmap (reruns matching per synthetic team member)
- `signals` - live signal forecast view

Everything in `src/app` and `src/components` is a client component except `src/app/layout.tsx` (server layout with `next-themes` provider and metadata) and the three API routes.

## Data Flow

```
Onboarding (CV) --scrubCV (in-browser)--> /api/extract-cv --Qwen on RunPod--> Profile (zustand + localStorage)
   (deterministic extractSkills if the LLM call fails)
Profile --> Dashboard --matchAll(profile, momentumMap)--> RoleMatch list (props to tabs)
/api/signals (GET, POST refresh) --ingestLiveSignals--> Prisma/SQLite --> SignalsPayload --> Dashboard
Match facts --POST /api/coach--> Qwen narration on RunPod (or deterministic fallback)
```

### Profile

The raw CV is scrubbed client-side (`scrubCV` in `src/lib/cv.ts`) — personally identifiable information never leaves the browser. The de-identified text is then POSTed to `/api/extract-cv`, which calls the self-hosted vLLM endpoint on RunPod (Qwen2.5-7B-Instruct, strict JSON-object decoding) to extract skills, roles, tenure, education, certifications and languages. If that call fails (no `RUNPOD_API_KEY`, timeout, malformed output), the deterministic keyword extractor (`extractSkills` / `skillsFromCV`) takes over, so onboarding always renders a result. Extracted skill names are mapped onto the 40-skill taxonomy; names outside it are dropped. Only skill levels persist in the profile; the LLM output is a proposal the user confirms and edits in the UI. The profile lives in the zustand store (`useSkillCast` in `src/lib/store.ts`) and persists to `localStorage` under key `skillcast-poc` (transient `view`/`dashTab` fields are excluded via `partialize`).

### Signals

`SignalsProvider` (`src/components/skillcast/shared.tsx`) fetches `/api/signals` once on mount and exposes `refresh()` (POST). The route is the only code path that touches Prisma:

1. `ingestLiveSignals()` (`src/lib/momentum.ts`) fetches postings from four free sources — Remotive, Arbeitnow, Greenhouse boards (Stripe/Datadog/Airbnb) and Ashby boards (Notion/Perplexity/Mux) — with 15-second per-source timeouts and per-source try/catch.
2. A `SignalRun` and `SignalSnapshot`s are persisted (10-minute staleness guard prevents re-ingest).
3. The run is diffed against the previous run; skills whose momentum moved by at least 2 points produce a `ChangelogEntry`.
4. If all live sources fail, `seedSnapshots()` serves curated fallback data (`src/data/curated.ts`).

### Matching

Matching is client-side and deterministic: the Dashboard computes `matchAll(profile, momentumMap)` in a `useMemo` and passes results as props to tab components. `momentumMap` maps skill slug to a 0-100 momentum score from the signals context. See [data-model.md](data-model.md) for the formula.

### Coach

`MatchCard` POSTs deterministic match facts (never CV text) to `/api/coach`. The route calls the shared self-hosted endpoint on RunPod (`runpodChat` in `src/lib/runpod.ts`, Qwen2.5-7B-Instruct, prose); on any failure it returns a deterministic `fallbackNarration` and the UI shows `fallback: true` with disclosure copy. See `ai-call-sites.md` for the full call-site map and rationale.

## API Routes

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/signals` | GET, POST | Read or refresh the signal pipeline; GET returns the `SignalsPayload`, POST triggers a re-ingest |
| `/api/coach` | POST | Narrate deterministic match facts with GLM; falls back to a template |
| `/api/extract-cv` | POST | Extract structured profile data (skills, roles, tenure, education, certs, languages) from de-identified CV text via self-hosted vLLM (Qwen) on RunPod; deterministic fallback on failure |

## Key Modules (`src/lib/`)

| Module | Responsibility | Key exports |
| --- | --- | --- |
| `types.ts` | Shared types | `Profile`, `RoleDef`, `CourseDef`, `SignalsPayload`, `RoleMatch`, `GapItem`, `MatchFactor`, `Lang`, `ScenarioId`, `PathType` |
| `matching.ts` | Matching engine | `FORMULA`, `matchRole`, `matchAll`, `haradaMatrix`, pathway duration math |
| `momentum.ts` | Signal engine | `SMI_WEIGHTS`, `ingestLiveSignals`, `computeMomentum`, `seedSnapshots`, `fetchRemotive`, `fetchArbeitnow` |
| `store.ts` | Client state | `useSkillCast`, `EMPTY_PROFILE`, `PERSONAS`, `INTERESTS`, `View` |
| `i18n.ts` | Translations | `makeT(lang)`, `LANGS`, `SDG_TITLES`, `SDG_COLORS` |
| `cv.ts` | CV processing | `scrubCV`, `extractSkills`, `skillsFromCV` |
| `db.ts` | Database access | `db` (globalThis-cached PrismaClient singleton) |
| `utils.ts` | Helpers | `cn()` (class merging) |

## Static Data (`src/data/`)

- `skills.ts` - 40-skill taxonomy (`SKILLS`, `SKILL_MAP`, `ADJACENCY`)
- `roles.ts` - 16 roles (`ROLES`, `ROLE_MAP`)
- `courses.ts` - 24 reskilling courses (`COURSES`, `COURSE_MAP`)
- `team.ts` - synthetic team (`TEAM`)
- `curated.ts` - fallback signals and live-source citations (`CURATED_SIGNALS`, `LIVE_SOURCES`)
- `sample-cv.ts` - sample CV for onboarding demos (`SAMPLE_CV`)