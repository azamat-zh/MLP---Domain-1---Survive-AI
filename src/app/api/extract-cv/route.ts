import { NextResponse } from 'next/server';
import { SKILL_MAP } from '@/data/skills';

export const dynamic = 'force-dynamic';

// ─── AI-assisted CV extraction (call site 1) ───────────────────────────────
// The client scrubs PII in the browser first; this route only ever receives
// de-identified text, which it forwards to a self-hosted vLLM endpoint on
// RunPod (Qwen2.5-7B-Instruct) with strict JSON-object decoding — malformed
// output cannot pass the response_format constraint, and the parsed result is
// validated again here before use. On any failure (no API key, timeout, bad
// output) the deterministic in-browser extractor takes over: the onboarding
// flow always renders a result.

const ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID ?? '3sz0imio0udhna';
const API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_URL = `https://api.runpod.ai/v2/${ENDPOINT_ID}/runsync`;

const SYSTEM_PROMPT =
  'You extract structured career data from a de-identified CV. ' +
  'Return ONLY a JSON object with exactly these keys: ' +
  '"skills" (array of { "name": string, "level": integer 0-5 }), ' +
  '"roles" (array of strings, most recent first), ' +
  '"yearsOfExperience" (integer), ' +
  '"education" (array of strings), ' +
  '"certifications" (array of strings), ' +
  '"languages" (array of strings). ' +
  'No prose, no markdown, no keys outside this schema. If a field is unknown, use an empty array or 0.';

export interface ExtractCvResult {
  ok: boolean;
  fallback: boolean;
  model: string;
  skills: Record<string, number>; // taxonomy slug -> level 0-5
  years: number;
  roles: string[];
  education: string[];
  certifications: string[];
  languages: string[];
  raw?: unknown;
}

function clampLevel(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0;
}

function clampYears(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(50, n) : 0;
}

// Map extracted skill names onto the 40-skill taxonomy. Names are compared by
// normalized token overlap: a name fully contained in a taxonomy name (e.g.
// "Python" in "Python Programming", "Prompt Engineering" in "Prompt & GenAI
// Orchestration") scores 1.0; partial overlap scores shared/max and must reach
// 0.5. Names outside the taxonomy (TypeScript, SQL, Kubernetes, …) are dropped
// — the product universe is the taxonomy; the LLM proposes, the user disposes.
function skillTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/&/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Explicit aliases for taxonomy entries whose natural names do not token-
// overlap (e.g. "Prompt Engineering" vs "Prompt & GenAI Orchestration").
const SKILL_ALIASES: Record<string, string> = {
  'prompt engineering': 'prompt-engineering',
  'prompt engineer': 'prompt-engineering',
  'prompt writing': 'prompt-engineering',
};

function bestSlug(name: string): string | undefined {
  const norm = name.trim().toLowerCase();
  if (SKILL_ALIASES[norm]) return SKILL_ALIASES[norm];
  const nt = skillTokens(name);
  if (nt.length === 0) return undefined;
  let best: { slug: string; score: number } | undefined;
  for (const [slug, def] of Object.entries(SKILL_MAP)) {
    const st = skillTokens(def.name);
    const shared = nt.filter((t) => st.includes(t)).length;
    if (shared === 0) continue;
    const score = shared === Math.min(nt.length, st.length) ? 1 : shared / Math.max(nt.length, st.length);
    if (score >= 0.5 && (!best || score > best.score)) best = { slug, score };
  }
  return best?.slug;
}

function mapSkills(skills: unknown): Record<string, number> {
  if (!Array.isArray(skills)) return {};
  const out: Record<string, number> = {};
  for (const s of skills) {
    if (typeof s !== 'object' || s === null) continue;
    const { name, level } = s as { name?: unknown; level?: unknown };
    if (typeof name !== 'string') continue;
    const slug = bestSlug(name);
    if (slug) out[slug] = clampLevel(level);
  }
  return out;
}

function parseOutput(payload: unknown): ExtractCvResult | null {
  try {
    const output = payload as {
      status?: string;
      output?: Array<{ choices?: Array<{ message?: { content?: string } }> }>;
    };
    if (output?.status !== 'COMPLETED') return null;
    const content = output.output?.[0]?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as {
      skills?: unknown;
      roles?: unknown;
      yearsOfExperience?: unknown;
      education?: unknown;
      certifications?: unknown;
      languages?: unknown;
    };
    return {
      ok: true,
      fallback: false,
      model: 'Qwen2.5-7B-Instruct (vLLM on RunPod)',
      skills: mapSkills(parsed.skills),
      years: clampYears(parsed.yearsOfExperience),
      roles: Array.isArray(parsed.roles)
        ? parsed.roles.filter((r): r is string => typeof r === 'string').slice(0, 10)
        : [],
      education: Array.isArray(parsed.education)
        ? parsed.education.filter((e): e is string => typeof e === 'string').slice(0, 10)
        : [],
      certifications: Array.isArray(parsed.certifications)
        ? parsed.certifications.filter((c): c is string => typeof c === 'string').slice(0, 10)
        : [],
      languages: Array.isArray(parsed.languages)
        ? parsed.languages.filter((l): l is string => typeof l === 'string').slice(0, 10)
        : [],
      raw: parsed,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let text: string;
  try {
    const body = (await request.json()) as { text?: unknown };
    if (typeof body.text !== 'string' || body.text.trim().length < 40) {
      return NextResponse.json({ error: 'invalid body: text (string, >=40 chars) required' }, { status: 400 });
    }
    text = body.text;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  // No key configured → deterministic path (never call the endpoint unauthenticated).
  if (!API_KEY) {
    return NextResponse.json({
      ok: false,
      fallback: true,
      model: 'deterministic extractor (RunPod API key not configured)',
      skills: {},
      years: 0,
      roles: [],
      education: [],
      certifications: [],
      languages: [],
    } satisfies ExtractCvResult);
  }

  try {
    const res = await fetch(RUNPOD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        input: {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: text },
          ],
          max_tokens: 600,
          temperature: 0,
          response_format: { type: 'json_object' },
        },
      }),
      signal: AbortSignal.timeout(50000),
    });

    if (!res.ok) {
      throw new Error(`RunPod endpoint responded ${res.status}`);
    }
    const payload: unknown = await res.json();
    const result = parseOutput(payload);
    if (!result) throw new Error('unparseable or non-terminal response');
    return NextResponse.json(result);
  } catch (e) {
    console.error('[api/extract-cv] LLM extraction unavailable, client falls back to deterministic:', e);
    return NextResponse.json({
      ok: false,
      fallback: true,
      model: 'deterministic extractor (LLM unavailable)',
      skills: {},
      years: 0,
      roles: [],
      education: [],
      certifications: [],
      languages: [],
    } satisfies ExtractCvResult);
  }
}