# AI Call Sites — what runs on the LLM and why

SkillCast makes a deliberate spine/skin split: **every number is computed
deterministically, the LLM only writes words**. This page records where AI
compute enters the app, what the shared self-hosted endpoint serves, and why
the forecast core deliberately is *not* an AI call site.

## The shared endpoint

One serverless endpoint serves both call sites:

- Id: `skillcast-qwen` (`3sz0imio0udhna`) — self-hosted Qwen2.5-7B-Instruct on
  vLLM, region EU-RO-1, RunPod. Scale-to-zero (min 0 / max 2 workers),
  FlashBoot on, idle timeout 300 s. ~$1.10/hr while a worker is hot, ~$0 idle.
- Transport: `https://api.runpod.ai/v2/{id}/runsync`, sync jobs, Bearer auth
  with `RUNPOD_API_KEY`. Shared caller: `src/lib/runpod.ts` (`runpodChat`).
- No key configured → every route falls back deterministically; the app never
  depends on the LLM being reachable. First call after ~5 min idle pays a
  ~2 min cold start and falls back for that one call.
- Privacy: the CV is scrubbed in the browser; only de-identified text reaches
  the endpoint; nothing is persisted by the worker.

## Call site 1 — CV → structured profile (`/api/extract-cv`, implemented)

- Flow: browser scrub (`scrubCV`) → de-identified text → `/api/extract-cv` →
  RunPod with `response_format: json_object` (strict JSON decoding is the
  anti-injection boundary — malformed output cannot exist) → profile fields →
  user confirms/edits in the UI.
- Output: skills (name + level 0–5), roles, yearsOfExperience, education,
  certifications, languages. Skill names are mapped onto the 40-skill
  taxonomy; names outside it are dropped.
- Fallback: deterministic in-browser keyword extraction (`extractSkills`).

## Call site 2 — narration (`/api/coach`, implemented)

- Flow: match facts (scores, factor breakdown, gaps, demand outlook) → `/api/coach`
  → RunPod (prose, temperature ~0.7, language instructed from the request
  locale) → 3–4 sentence explanation.
- Hard rule in the prompt: use ONLY the provided facts; never invent jobs,
  courses, statistics or sources; never change a score. The LLM cannot invent
  a ranking it was never asked to produce — it receives numbers, not roles.
- Fallback: deterministic template narration. The UI always discloses which
  path ran.

## Not a call site: the forecast core (signals pipeline)

The candidate 3rd call site — map posting text onto the taxonomy, compute
momentum, apply scenario multipliers — **stays deterministic and does not run
on the LLM**. Rationale:

1. **Citability is the product guarantee.** The Skill Momentum Index
   (`SMI_WEIGHTS`) is published, user-facing math. Deterministic
   gazetteer matching against the taxonomy against raw postings is ~90%
   accurate and fully reproducible; LLM classification is neither (sampling
   noise, prompt drift, version churn). Judges can re-run our pipeline; they
   cannot re-run a black box.
2. **Cost and latency shape.** The pipeline ingests ~1–2k postings per run
   (4 live sources) on a daily cron. That is thousands of LLM calls per run —
   seconds of GPU each — versus a free, CPU-bound regex pass in
   milliseconds. Serverless LLM labeling would make a *daily* pipeline the
   biggest line item and the slowest one.
3. **The one honest AI-shaped gap is embeddings for novel skills** — and it
   does not need RunPod or even a GPU: a multilingual embedding model
   (e.g. bge-m3) on CPU as a tie-breaker for taxonomy misses. Even this is
   optional; the curated research-horizon signal (WEF Future of Jobs 2025,
   Stanford AI Index — `src/data/curated.ts`) covers the horizon weight today.

Verdict: the forecast core is a **deterministic, citable pipeline**; RunPod
stays for the two narrative/extraction call sites only. If the team ever wants
an embedding tie-breaker, it runs CPU-side in the app, not on the endpoint.

## Live signal sources (verified 2026-10, all free and keyless)

| Source | API | Notes |
| --- | --- | --- |
| Remotive | `remotive.com/api/remote-jobs` | Remote-first, global |
| Arbeitnow | `arbeitnow.com/api/job-board-api` | Germany/EU-focused |
| Greenhouse boards | `boards-api.greenhouse.io/v1/boards/{board}/jobs` | Stripe, Datadog, Airbnb — every open job incl. HTML |
| Ashby boards | `api.ashbyhq.com/posting-api/job-board/{org}` | Notion, Perplexity, Mux |

Rejected for now: The Muse (403s non-browser clients), Lever (org boards
unverifiable), Adzuna (key required), LinkedIn/Indeed (no public API / ToS).
arXiv abstracts are the natural next addition if the research-horizon (SMI
0.2) weight should move from curated citations to a live signal — implemented
as a separate research feed, not stuffed into posting counts.