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
}

export const SMI_WEIGHTS = { frequency: 0.5, trend: 0.3, horizon: 0.2 };

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs?limit=150';
const ARBEITNOW_URL = 'https://www.arbeitnow.com/api/job-board-api';

// Verified public boards (checked 2026-10); each is a free, keyless API.
const GREENHOUSE_BOARDS = ['stripe', 'datadog', 'airbnb'];
const ASHBY_ORGS = ['notion', 'perplexity', 'mux'];

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
    jobs?: Array<{ title: string; company_name?: string; description?: string; publication_date?: string }>;
  };
  return (json.jobs ?? []).map((j) => ({
    title: j.title ?? '',
    company: j.company_name ?? '—',
    description: stripHtml(j.description ?? ''),
    source: 'Remotive',
    date: j.publication_date ? new Date(j.publication_date) : new Date(),
  }));
}

export async function fetchArbeitnow(): Promise<Posting[]> {
  const res = await fetch(ARBEITNOW_URL, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Arbeitnow ${res.status}`);
  const json = (await res.json()) as {
    data?: Array<{ title: string; company_name?: string; description?: string; created_at?: number }>;
  };
  return (json.data ?? []).map((j) => ({
    title: j.title ?? '',
    company: j.company_name ?? '—',
    description: stripHtml(j.description ?? ''),
    source: 'Arbeitnow',
    date: j.created_at ? new Date(j.created_at * 1000) : new Date(),
  }));
}

// Greenhouse boards API: every open job per board, HTML content included.
// Boards list is the verified subset; per-board cap keeps the ingest bounded.
export async function fetchGreenhouse(): Promise<Posting[]> {
  const out: Posting[] = [];
  for (const board of GREENHOUSE_BOARDS) {
    const json = (await fetchJson(
      `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`
    )) as {
      jobs?: Array<{ title?: string; content?: string; updated_at?: string }>;
    };
    for (const j of (json.jobs ?? []).slice(0, 250)) {
      const d = j.updated_at;
      out.push({
        title: j.title ?? '',
        company: board,
        description: `[${board}] ${stripHtml(j.content ?? '')}`,
        source: 'Greenhouse',
        date: d ? new Date(d) : new Date(),
      });
    }
  }
  return out;
}

// Ashby job-board API: same idea, per-org boards. `descriptionPlain` exists on
// newer endpoints; fall back to stripping descriptionHtml either way.
export async function fetchAshby(): Promise<Posting[]> {
  const out: Posting[] = [];
  for (const org of ASHBY_ORGS) {
    const json = (await fetchJson(
      `https://api.ashbyhq.com/posting-api/job-board/${org}`
    )) as {
      jobs?: Array<{
        title?: string;
        descriptionHtml?: string;
        descriptionPlain?: string;
        updatedAt?: string;
        createdAt?: string;
      }>;
    };
    for (const j of (json.jobs ?? []).slice(0, 250)) {
      const d = j.updatedAt ?? j.createdAt;
      out.push({
        title: j.title ?? '',
        company: org,
        description: `[${org}] ${stripHtml(j.descriptionHtml ?? j.descriptionPlain ?? '')}`,
        source: 'Ashby',
        date: d ? new Date(d) : new Date(),
      });
    }
  }
  return out;
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

  const attempts: Array<{ name: string; url: string; kind: string; fn: () => Promise<Posting[]> }> = [
    { name: 'Remotive Job API', url: REMOTIVE_URL, kind: 'live', fn: fetchRemotive },
    { name: 'Arbeitnow Job Board API', url: ARBEITNOW_URL, kind: 'live', fn: fetchArbeitnow },
    {
      name: 'Greenhouse Job Boards',
      url: `https://boards-api.greenhouse.io/v1/boards/${GREENHOUSE_BOARDS.join('|')}/jobs`,
      kind: 'live',
      fn: fetchGreenhouse,
    },
    {
      name: 'Ashby Job Boards',
      url: `https://api.ashbyhq.com/posting-api/job-board/${ASHBY_ORGS.join('|')}`,
      kind: 'live',
      fn: fetchAshby,
    },
  ];

  for (const src of attempts) {
    try {
      const list = await src.fn();
      postings.push(...list);
      sources.push({ name: src.name, url: src.url, postings: list.length, ok: true, kind: src.kind });
    } catch (e) {
      console.error(`[signals] ${src.name} failed:`, e);
      sources.push({ name: src.name, url: src.url, postings: 0, ok: false, kind: src.kind });
    }
  }

  if (postings.length === 0) throw new Error('All live sources failed');

  const snapshots = computeMomentum(postings);
  return { postings, sources, snapshots };
}

export function computeMomentum(postings: Posting[]): SkillSnapshot[] {
  const total = postings.length;
  const dates = postings.map((p) => p.date.getTime()).sort((a, b) => a - b);
  const midTimestamp = dates[Math.floor(dates.length / 2)] ?? Date.now();

  const results: SkillSnapshot[] = [];

  for (const skill of SKILLS) {
    let count = 0;
    let recent = 0;
    let earlier = 0;
    for (const p of postings) {
      const text = `${p.title}\n${p.description}`.toLowerCase();
      const n = countMatches(text, skill.aliases);
      if (n === 0) continue;
      count++;
      if (p.date.getTime() >= midTimestamp) recent++;
      else earlier++;
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
      frequency: Math.round((postings / 60) * 100) / 100,
      trend: Math.round(40 + s.seedMomentum * 0.2),
      momentum: s.seedMomentum,
    };
  });
}
