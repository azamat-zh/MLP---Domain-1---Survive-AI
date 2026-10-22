# Data Model

## Prisma Schema (`prisma/schema.prisma`)

Datasource: SQLite via `DATABASE_URL`.

### SignalRun

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String (CUID) | Primary key |
| `createdAt` | DateTime | Default `now()` |
| `live` | Boolean | True when live sources were fetched |
| `totalPostings` | Int | Aggregate posting count across sources |
| `sources` | String | JSON array of source names |
| `note` | String? | Optional note |
| `snapshots` | SignalSnapshot[] | Cascade-delete relation |

### SignalSnapshot

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String (CUID) | Primary key |
| `runId` | String | FK -> SignalRun.id |
| `skillSlug` | String | Slug matching the skill taxonomy in `src/data/skills.ts` |
| `postings`, `recentPostings`, `earlierPostings` | Int | Posting counts by period |
| `frequency` | Int | Raw occurrence in this window |
| `trend` | String | e.g. "rising", "declining", "stable" |
| `momentum` | Int | Computed 0-100 score |
| `@@unique([runId, skillSlug])` | | One snapshot per skill per run |

### ChangelogEntry

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String (CUID) | Primary key |
| `createdAt` | DateTime | Default `now()` |
| `version` | Int | Sequential version number |
| `live` | Boolean | Whether the data for this entry came from live sources |
| `summary` | String | Human-readable summary |
| `details` | String | JSON array of mover records |

Movers are skills whose momentum changed by at least 2 (`|delta| >= 2`).

## Signals Ingestion Pipeline

1. **Trigger**: GET `/api/signals` (auto-fetch on mount via `SignalsProvider`) or POST `/api/signals` (manual refresh).
2. **Fetch**: `ingestLiveSignals()` (`src/lib/momentum.ts`) queries Remotive and Arbeitnow APIs with 15-second per-source timeouts. Each source is independently try/caught.
3. **Staleness**: A 10-minute guard prevents re-ingest if the most recent run is newer than 10 minutes.
4. **Compute**: `computeMomentum()` applies the Skill Momentum Index (see below) to compute per-skill momentum.
5. **Persist**: A `SignalRun` and one `SignalSnapshot` per skill are written.
6. **Diff**: Against the previous run's snapshots, skills with `|delta| >= 2` are collected into a `ChangelogEntry.details` JSON array.
7. **Fallback**: If all live sources fail, `seedSnapshots()` reads `CURATED_SIGNALS` from `src/data/curated.ts` and persists a non-live run.

## Skill Momentum Index (SMI)

The momentum score per skill is a weighted combination of three factors (defined in `src/lib/momentum.ts` as `SMI_WEIGHTS`):

| Factor | Weight |
| --- | --- |
| Frequency (normalized posting count) | 0.5 |
| Trend (direction of change) | 0.3 |
| Research horizon (time-window reach) | 0.2 |

## Matching Formula

Defined in `src/lib/matching.ts` as the exported constant `FORMULA`. A role match consists of four components:

| Component | Weight | Source |
| --- | --- | --- |
| Skill overlap | 0.40 | Profile skills that match role requirements exactly |
| Transferable skills | 0.30 | Skills adjacent to required skills (based on `ADJACENCY` in `src/data/skills.ts`) |
| Experience | 0.20 | Seniority bands |
| Interest | 0.10 | Stated interest categories from onboarding |

`matchRole(profile, roleSlug, momentumMap)` returns a `RoleMatch` or `null`. `matchAll(profile, momentumMap)` returns all non-null matches sorted by score.

### Pathway Duration

The re-skilling pathway from current skill levels to target role requirements sums the course hours of gap-covering courses and divides by the weekly budget (defined in `matching.ts`):

```
pathway_weeks = sum(course_hours) / weekly_budget
```

## Client State (`src/lib/store.ts`)

- Zustand store `useSkillCast` manages `view`, `profile` and `dashTab` fields.
- Persistence: `persist` middleware with key `skillcast-poc` in localStorage. `partialize` excludes `view` and `dashTab`.
- `EMPTY_PROFILE` initialises a fresh profile. `PERSONAS` and `INTERESTS` supply onboarding choices.

## i18n (`src/lib/i18n.ts`)

- `makeT(lang)` returns a `(key, vars?) -> string` function with `{var}` interpolation.
- Supported locales (`LANGS`): `en` (English), `bm` (Bahasa Malaysia), `zh` (Chinese), `ru` (Russian).
- UI components consume translations through the `useT()` hook (defined in `src/components/skillcast/shared.tsx`).
- `next-intl` is a dependency but the application uses this custom i18n system, not next-intl.

## Signals Payload Shape

The cross-cutting contract between the signal pipeline and UI components is `SignalsPayload`, which carries a map of `skillSlug -> SkillSnapshot`:

- `SkillSnapshot`: `frequency`, `trend`, `momentum`, `postings`, `recentPostings`, `earlierPostings`

Match and pathway code both consume this shape. The `momentumMap` (skillSlug -> 0-100 integer) is derived from the payload.