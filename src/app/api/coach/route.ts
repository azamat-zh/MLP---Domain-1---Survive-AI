import { NextResponse } from 'next/server';
import { SKILL_MAP } from '@/data/skills';
import { ROLE_MAP } from '@/data/roles';
import { runpodChat, RUNPOD_MODEL } from '@/lib/runpod';

export const dynamic = 'force-dynamic';

// ─── AI Career Coach (narration layer — call site 2) ───────────────────────
// AI DISCLOSURE: this endpoint narrates via the self-hosted vLLM endpoint on
// RunPod (Qwen2.5-7B-Instruct, EU-RO-1). The LLM receives ONLY deterministic
// match output (scores, factor breakdown, gap list, role metadata) — never
// the CV — and is instructed not to invent jobs, courses, statistics or
// sources. If the call fails (no API key, timeout, unusable output), a
// structured template is returned; the deterministic core is unaffected.

interface CoachRequest {
  roleSlug: string;
  score: number;
  factors: Array<{ label: string; value: number }>;
  gap: Array<{ skill: string; userLevel: number; minLevel: number; momentum: number }>;
  scenario: 'moderate' | 'accelerated';
  lang: 'en' | 'ms' | 'zh' | 'ru';
}

const LANG_INSTRUCTION: Record<string, string> = {
  en: 'Reply in English.',
  ms: 'Reply in Bahasa Malaysia.',
  zh: 'Reply in Simplified Chinese.',
  ru: 'Reply in Russian.',
};

function fallbackNarration(req: CoachRequest): string {
  const role = ROLE_MAP[req.roleSlug];
  const topGap = req.gap[0];
  const strongest = [...req.factors].sort((a, b) => b.value - a.value)[0];
  const g = topGap
    ? ` The priority gap is ${SKILL_MAP[topGap.skill]?.name ?? topGap.skill} (level ${topGap.userLevel} of ${topGap.minLevel} needed).`
    : '';
  return (
    `Match ${req.score}/100, driven mainly by ${strongest.label.toLowerCase()} (${Math.round(strongest.value * 100)}%).` +
    g +
    ` Under the ${req.scenario} scenario the demand outlook for ${role?.title ?? 'this role'} is ${req.scenario === 'accelerated' ? role?.demandAccelerated : role?.demandModerate}/100 (estimate).`
  );
}

export async function POST(request: Request) {
  let req: CoachRequest;
  try {
    req = (await request.json()) as CoachRequest;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const role = ROLE_MAP[req.roleSlug];
  if (!role) return NextResponse.json({ error: 'unknown role' }, { status: 400 });

  try {
    const facts = {
      role: role.title,
      tagline: role.tagline,
      matchScore: req.score,
      factors: req.factors.map((f) => `${f.label}: ${Math.round(f.value * 100)}%`),
      skillsGap: req.gap
        .slice(0, 5)
        .map((g) => `${SKILL_MAP[g.skill]?.name ?? g.skill}: level ${g.userLevel}, needs ${g.minLevel}, momentum ${g.momentum}/100`),
      demandOutlook: {
        moderate: role.demandModerate,
        accelerated: role.demandAccelerated,
        scenarioShown: req.scenario,
      },
      sdgGoals: role.sdgTags,
    };

    const narration = await runpodChat({
      messages: [
        {
          role: 'system',
          content:
            'You are the narration layer of a career-forecasting tool. You receive deterministic match output and must explain it to the user in 3-4 warm, concrete sentences. STRICT RULES: use ONLY the facts provided; never invent jobs, courses, statistics, salaries or sources; never give a different score; mention that predictions are estimates and the user makes the final decision. ' +
            (LANG_INSTRUCTION[req.lang] ?? 'Reply in English.'),
        },
        {
          role: 'user',
          content: JSON.stringify(facts),
        },
      ],
      maxTokens: 350,
      temperature: 0.7,
    });

    if (!narration) throw new Error('no narration from endpoint');
    return NextResponse.json({ narration, model: RUNPOD_MODEL, fallback: false });
  } catch (e) {
    console.error('[api/coach] LLM unavailable, using fallback:', e);
    return NextResponse.json({
      narration: fallbackNarration(req),
      model: 'deterministic template (LLM unavailable)',
      fallback: true,
    });
  }
}