import { SKILLS } from '@/data/skills';
import type { SkillSnapshot } from '@/lib/types';

// ─── Signal ingestion + Skill Momentum Index (SMI) ────────────────────────
// LIVE SOURCES (free, no key, verified reachable):
//   · Remotive API      — https://remotive.com/api/remote-jobs
//   · Arbeitnow API     — https://www.arbeitnow.com/api/job-board-api
//   · Greenhouse boards — https://boards-api.greenhouse.io/v1/boards/{board}/jobs
//   · Ashby boards      — https://api.ashbyhq.com/posting-api/job-board/{org}
// Pipeline: fetch postings → strip HTML → match skill aliases with word
// boundaries → per-skill frequency + recent-vs-earlier trend → blend with
// curated research-horizon weights (WEF FOJ 2025 / Stanford AI Index — see
// curated.ts). Every snapshot stores its sources and timestamps.
//
//   momentum = 0.50 × frequency score
//            + 0.30 × trend score (recent vs earlier postings)
//            + 0.20 × research horizon (curated, cited)

export interface Posting {
  title: string;
  company: string;
  description: string;
  source: string;
  date: Date;
  sourceDate?: string;
  sourceDateKind?: 'published' | 'updated';
  url?: string;
}

export const SMI_WEIGHTS = { frequency: 0.5, trend: 0.3, horizon: 0.2 };

// Remotive caps responses at 10 jobs regardless of the limit parameter
// (verified 2026-10) — the endpoint is fetched without parameters and the
// source chip honestly shows its contribution.
const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs';
const ARBEITNOW_URL = 'https://www.arbeitnow.com/api/job-board-api';

// Verified public Greenhouse boards (checked 2026-10-23):
// stripe, datadog, airbnb, cloudflare, figma, databricks, roblox,
// pinterest, dropbox, coinbase — each returns HTTP 200 with a jobs array.
// sentry returned 404 and was excluded.
const GREENHOUSE_BOARDS = ['stripe', 'datadog', 'airbnb', 'cloudflare', 'figma', 'databricks', 'roblox', 'pinterest', 'dropbox', 'coinbase'];

// Verified Ashby job-board orgs (checked 2026-10-23):
// notion, perplexity, mux, linear, ramp — each returns HTTP 200.
const ASHBY_ORGS = ['notion', 'perplexity', 'mux', 'linear', 'ramp'];

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'SkillCast-POC/0.1 (open data research)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchRemotive(): Promise<Posting[]> {
  const res = await fetch(REMOTIVE_URL, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Remotive ${res.status}`);
  const json = (await res.json()) as {
    jobs?: Array<{ title: string; company_name?: string; description?: string; publication_date?: string; url?: string }>;
  };
  return (json.jobs ?? []).map((j) => ({
    title: j.title ?? '',
    company: j.company_name ?? '—',
    description: stripHtml(j.description ?? ''),
    source: 'Remotive',
    date: j.publication_date ? new Date(j.publication_date) : new Date(),
    sourceDate: j.publication_date,
    sourceDateKind: j.publication_date ? 'published' as const : undefined,
    url: j.url,
  }));
}

// Arbeitnow serves one page per request; read three pages so the corpus is not
// a fixed single window from the dominant source.
export async function fetchArbeitnow(): Promise<Posting[]> {
  const out: Posting[] = [];
  for (let page = 1; page <= 3; page++) {
    const url = page === 1 ? ARBEITNOW_URL : `${ARBEITNOW_URL}?page=${page}`;
    let json: { data?: Array<{ title: string; company_name?: string; description?: string; created_at?: number; url?: string }> };
    if (page === 1) {
      const res = await fetch(ARBEITNOW_URL, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`Arbeitnow ${res.status}`);
      json = await res.json();
    } else {
      try {
        json = (await fetchJson(url)) as typeof json;
      } catch {
        break; // later pages are optional — keep what page 1 delivered
      }
    }
    const list = (json?.data ?? []).map((j) => ({
      title: j.title ?? '',
      company: j.company_name ?? '—',
      description: stripHtml(j.description ?? ''),
      source: 'Arbeitnow',
      date: j.created_at ? new Date(j.created_at * 1000) : new Date(),
      sourceDate: j.created_at ? new Date(j.created_at * 1000).toISOString() : undefined,
      sourceDateKind: j.created_at ? 'published' as const : undefined,
      url: j.url,
    }));
    if (list.length === 0) break;
    out.push(...list);
  }
  return out;
}

// Greenhouse boards API: every open job per board, HTML content included.
// Boards list is the verified subset; per-board cap keeps the ingest bounded.
// Each board is wrapped in try/catch: a single board failure doesn't lose the rest.
export async function fetchGreenhouse(): Promise<{ postings: Posting[]; boardResults: Array<{ board: string; ok: boolean; count: number }> }> {
  const allPostings: Posting[] = [];
  const boardResults: Array<{ board: string; ok: boolean; count: number }> = [];
  for (const board of GREENHOUSE_BOARDS) {
    try {
      const json = (await fetchJson(
        `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`
      )) as {
        jobs?: Array<{ title?: string; content?: string; updated_at?: string; absolute_url?: string }>;
      };
      const jobs = (json.jobs ?? []).slice(0, 150);
      for (const j of jobs) {
        const d = j.updated_at;
        allPostings.push({
          title: j.title ?? '',
          company: board,
          description: `[${board}] ${stripHtml(j.content ?? '')}`,
          source: 'Greenhouse',
          date: d ? new Date(d) : new Date(),
          sourceDate: d,
          sourceDateKind: d ? 'updated' : undefined,
          url: j.absolute_url,
        });
      }
      boardResults.push({ board, ok: true, count: jobs.length });
    } catch (e) {
      console.error(`[signals] Greenhouse board ${board} failed:`, e);
      boardResults.push({ board, ok: false, count: 0 });
    }
  }
  if (boardResults.every((b) => !b.ok)) throw new Error('All Greenhouse boards failed');
  return { postings: allPostings, boardResults };
}

// Ashby job-board API: same idea, per-org boards. `descriptionPlain` exists on
// newer endpoints; fall back to stripping descriptionHtml either way.
// Each org is wrapped in try/catch: a single org failure doesn't lose the rest.
export async function fetchAshby(): Promise<{ postings: Posting[]; boardResults: Array<{ board: string; ok: boolean; count: number }> }> {
  const allPostings: Posting[] = [];
  const boardResults: Array<{ board: string; ok: boolean; count: number }> = [];
  for (const org of ASHBY_ORGS) {
    try {
      const json = (await fetchJson(
        `https://api.ashbyhq.com/posting-api/job-board/${org}`
      )) as {
        jobs?: Array<{
          title?: string;
          descriptionHtml?: string;
          descriptionPlain?: string;
          updatedAt?: string;
          createdAt?: string;
          jobUrl?: string;
          url?: string;
        }>;
      };
      const jobs = (json.jobs ?? []).slice(0, 150);
      for (const j of jobs) {
        const d = j.updatedAt ?? j.createdAt;
        allPostings.push({
          title: j.title ?? '',
          company: org,
          description: `[${org}] ${stripHtml(j.descriptionHtml ?? j.descriptionPlain ?? '')}`,
          source: 'Ashby',
          date: d ? new Date(d) : new Date(),
          sourceDate: d,
          sourceDateKind: j.updatedAt ? 'updated' : j.createdAt ? 'published' : undefined,
          url: j.jobUrl ?? j.url,
        });
      }
      boardResults.push({ board: org, ok: true, count: jobs.length });
    } catch (e) {
      console.error(`[signals] Ashby org ${org} failed:`, e);
      boardResults.push({ board: org, ok: false, count: 0 });
    }
  }
  if (boardResults.every((b) => !b.ok)) throw new Error('All Ashby boards failed');
  return { postings: allPostings, boardResults };
}

function countMatches(text: string, aliases: string[]): number {
  let n = 0;
  for (const alias of aliases) {
    const re = new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}([^a-z0-9]|$)`, 'g');
    n += (text.match(re) ?? []).length;
  }
  return n;
}

export interface IngestResult {
  postings: Posting[];
  sources: Array<{ name: string; url: string; postings: number; ok: boolean; kind: string }>;
  snapshots: SkillSnapshot[];
}

export async function ingestLiveSignals(): Promise<IngestResult> {
  const sources: IngestResult['sources'] = [];
  const postings: Posting[] = [];

  // Remotive
  try {
    const list = await fetchRemotive();
    postings.push(...list);
    sources.push({ name: 'Remotive Job API', url: REMOTIVE_URL, postings: list.length, ok: true, kind: 'live' });
  } catch (e) {
    console.error('[signals] Remotive failed:', e);
    sources.push({ name: 'Remotive Job API', url: REMOTIVE_URL, postings: 0, ok: false, kind: 'live' });
  }

  // Arbeitnow
  try {
    const list = await fetchArbeitnow();
    postings.push(...list);
    sources.push({ name: 'Arbeitnow Job Board API', url: ARBEITNOW_URL, postings: list.length, ok: true, kind: 'live' });
  } catch (e) {
    console.error('[signals] Arbeitnow failed:', e);
    sources.push({ name: 'Arbeitnow Job Board API', url: ARBEITNOW_URL, postings: 0, ok: false, kind: 'live' });
  }

  // Greenhouse (per-board)
  try {
    const { postings: ghPostings, boardResults } = await fetchGreenhouse();
    postings.push(...ghPostings);
    for (const br of boardResults) {
      sources.push({
        name: `Greenhouse · ${br.board}`,
        url: `https://boards-api.greenhouse.io/v1/boards/${br.board}/jobs`,
        postings: br.count,
        ok: br.ok,
        kind: 'live',
      });
    }
  } catch (e) {
    console.error('[signals] Greenhouse all boards failed:', e);
    // No individual entries — all boards failed
  }

  // Ashby (per-board)
  try {
    const { postings: ashbyPostings, boardResults } = await fetchAshby();
    postings.push(...ashbyPostings);
    for (const br of boardResults) {
      sources.push({
        name: `Ashby · ${br.board}`,
        url: `https://api.ashbyhq.com/posting-api/job-board/${br.board}`,
        postings: br.count,
        ok: br.ok,
        kind: 'live',
      });
    }
  } catch (e) {
    console.error('[signals] Ashby all orgs failed:', e);
  }

  if (postings.length === 0) throw new Error('All live sources failed');

  const snapshots = computeMomentum(postings);
  return { postings, sources, snapshots };
}

export function computeMomentum(postings: Posting[]): SkillSnapshot[] {
  // Fixed time windows: keep only postings ≤ 60 days old
  const now = Date.now();
  const cutoff = now - 60 * 24 * 60 * 60 * 1000;
  const filtered = postings.filter((p) => p.date.getTime() >= cutoff);
  if (filtered.length === 0) throw new Error('No postings within the 60-day window');

  const total = filtered.length;
  const midBoundary = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago

  const results: SkillSnapshot[] = [];

  for (const skill of SKILLS) {
    let count = 0;
    let recent = 0;
    let earlier = 0;
    const samples: SkillSnapshot['samples'] = [];
    for (const p of filtered) {
      const text = `${p.title}\n${p.description}`.toLowerCase();
      const n = countMatches(text, skill.aliases);
      if (n === 0) continue;
      count++;
      if (p.date.getTime() >= midBoundary) recent++;
      else earlier++;
      // Collect up to 3 samples: prefer ones with url, most recent first
      if (samples.length < 3 && (p.url || samples.length < 2)) {
        const matchPos = text.indexOf(skill.aliases[0].toLowerCase());
        const snippet = matchPos >= 0
          ? p.description.slice(Math.max(0, matchPos - 40), matchPos + 120)
          : p.description.slice(0, 160);
        samples.push({
          title: p.title,
          company: p.company,
          url: p.url,
          date: p.date.toISOString(),
          sourceDate: p.sourceDate,
          sourceDateKind: p.sourceDateKind,
          snippet: snippet.slice(0, 160),
        });
      }
    }

    const frequency = (count / total) * 100;
    // 6% of postings mentioning a skill ≈ 100 on the frequency axis
    const freqScore = Math.min(100, 100 * Math.sqrt(frequency / 100 / 0.06));
    // Trend: recent vs earlier ratio (clamped 0.25–4, log-scaled around 50)
    const ratio = (recent + 0.5) / (earlier + 0.5);
    const trendScore = Math.max(0, Math.min(100, 50 + 45 * Math.log2(Math.max(0.25, Math.min(4, ratio)))));
    const momentum =
      SMI_WEIGHTS.frequency * freqScore +
      SMI_WEIGHTS.trend * trendScore +
      SMI_WEIGHTS.horizon * skill.researchHorizon;

    results.push({
      skillSlug: skill.slug,
      postings: count,
      recentPostings: recent,
      earlierPostings: earlier,
      frequency: Math.round(frequency * 100) / 100,
      trend: Math.round(trendScore),
      momentum: Math.round(momentum),
      samples: samples.length > 0 ? samples : undefined,
    });
  }
  return results;
}

// Seeded fallback: used when live sources are unreachable (sandbox offline,
// rate limits). Clearly labelled in the UI as a cached/demo snapshot.
export function seedSnapshots(): SkillSnapshot[] {
  return SKILLS.map((s) => {
    const postings = Math.round(s.seedMomentum * 1.2);
    const recent = Math.round(postings * 0.45);
    return {
      skillSlug: s.slug,
      postings,
      recentPostings: recent,
      earlierPostings: postings - recent,
      frequency: 0,
      trend: Math.round(40 + s.seedMomentum * 0.2),
      momentum: s.seedMomentum,
    };
  });
}
