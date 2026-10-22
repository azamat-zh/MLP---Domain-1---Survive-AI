# Verification

## Automated Checks

| Check | Command | Scope |
| --- | --- | --- |
| Lint | `bun run lint` | Whole repo; ESLint 9 flat config (permissive: `no-explicit-any`, `no-unused-vars`, `exhaustive-deps`, `no-console` disabled) |
| Build | `bun run build` | Production standalone build; must succeed before `bun run start` |
| Shell tests | `bash tests/database-runtime-build.sh` | Verifies the DB packaging script copies/initializes `db/custom.db` and invokes `db:push` |
| Shell tests | `bash tests/python-runtime-build.sh` | Verifies Python source packaging rules (`requirements.txt` vs `pyproject.toml`, skip when no Python) |
| Shell tests | `bash tests/python-runtime-container.sh` | Docker-based; loads the built Python runtime in a container and imports a dependency |

There is no JavaScript/TypeScript unit or integration test framework in this repository (no vitest, jest, playwright or testing-library, no `*.test.*` files, no `test` script). Application logic is verified manually.

## Feature Verification (Golden Path)

The established QA workflow is a manual browser walkthrough with screenshots:

1. Start the app: `bun run dev`.
2. Drive the golden path in a browser automation session:
   - Landing -> onboarding (CV upload + scrubber, PII strip) -> dashboard (live postings, charts)
   - Matches (GLM coach narration with fallback guardrail) -> pathway (mark-done, dyslexia reorder)
   - Harada matrix -> SDG ledger -> demand stats -> email dialog
   - Locale switches: BM, ZH, RU
   - Scenario toggle, employer dashboard, signals with live refresh, mobile viewport
3. Capture screenshots at each step as `scripts/verify-*.png` (existing set: `verify-01-landing.png` ... `verify-10-email.png`).

The screenshots are the evidence of record; `worklog.md` documents the canonical run.

## Coverage Expectations

There are no documented coverage thresholds. Practical guidance:

- Deterministic engines (`matching.ts`, `momentum.ts`, `cv.ts`) are the highest-value candidates for tests if a framework is introduced.
- The `SignalsPayload` contract (skill slug -> snapshot) is the cross-cutting seam; tests should pin its shape.
- Do not write tests for wiring, forwarding, or mock echoes; verify behavior through the running app or throwaway scripts.

## Before You Report Done

1. `bun run lint` passes.
2. The changed path was exercised (app run, page visited, output observed) - not just compiled.
3. For behavior changes: screenshots or log evidence of before/after where feasible.
4. The canonical golden path still works for feature work touching the main flow.