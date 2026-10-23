import { NextResponse } from 'next/server';
import { z } from 'zod';
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

// Validated request contract. Earlier this route read req.factors / req.gap
// unguarded: a partially-formed body (missing factors or gap) threw inside the
// error handler itself, producing a raw 500 instead of a clean 400.
const CoachBody = z.object({
  roleSlug: z.string().min(1),
  score: z.number().min(0).max(100),
  factors: z.array(z.object({ label: z.string(), value: z.number() })).default([]),
  gap: z
    .array(
      z.object({
        skill: z.string(),
        userLevel: z.number(),
        minLevel: z.number(),
        momentum: z.number(),
      })
    )
    .default([]),
  scenario: z.enum(['moderate', 'accelerated']).default('moderate'),
  lang: z.enum(['en', 'ms', 'zh', 'ru']).default('en'),
  mode: z.enum(['match', 'harada']).optional(),
  pathwayWeeks: z.number().optional(),
  budget: z.number().optional(),
  courses: z.array(z.string()).optional(),
});
type CoachRequest = z.infer<typeof CoachBody>;

const LANG_INSTRUCTION: Record<string, string> = {
  en: 'Reply in English.',
  ms: 'Reply in Bahasa Malaysia.',
  zh: 'Reply in Simplified Chinese.',
  ru: 'Reply in Russian.',
};

function fallbackNarration(req: CoachRequest): string {
  const role = ROLE_MAP[req.roleSlug];
  const topGap = req.gap[0];
  if (req.mode === 'harada') {
    const g = topGap
      ? ` Priority gap: ${SKILL_MAP[topGap.skill]?.name ?? topGap.skill} (level ${topGap.userLevel} of ${topGap.minLevel} needed).`
      : '';
    return (
      `Plan: ${role?.title}. Why: ${role?.tagline}.` +
      g +
      ` Timeline: ~${req.pathwayWeeks ?? 0} weeks at ${req.budget ?? 0} hrs/week.` +
      ` Courses: ${(req.courses ?? []).join(', ') || 'none yet — pick them from the pathway tab.'}` +
      ` SDG: ${(role?.sdgTags ?? []).join(', ')}.`
    );
  }
  const strongest = [...req.factors].sort((a, b) => b.value - a.value)[0] ?? { label: 'overall fit', value: req.score / 100 };
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
    const parsed = CoachBody.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    req = parsed.data;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const role = ROLE_MAP[req.roleSlug];
  if (!role) return NextResponse.json({ error: 'unknown role' }, { status: 400 });

  try {
    const isHarada = req.mode === 'harada';
    const facts = isHarada
      ? {
          goal: role.title,
          why: role.tagline,
          sdgGoals: role.sdgTags,
          deadlineWeeks: req.pathwayWeeks ?? 0,
          budgetHrs: req.budget ?? 0,
          priorityGaps: req.gap
            .slice(0, 5)
            .map((g) => `${SKILL_MAP[g.skill]?.name ?? g.skill}: level ${g.userLevel}, needs ${g.minLevel}, momentum ${g.momentum}/100`),
          coursePlan: req.courses ?? [],
        }
      : {
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
            (isHarada
              ? 'You are the plan coach of a career tool. Explain the user\'s Harada-style self-management plan in 3-4 warm, concrete sentences: the goal role, why it matters (SDG link), the deadline, the priority gaps, and the course plan. STRICT RULES: use ONLY the facts provided; never invent jobs, courses, durations, statistics, salaries or sources; mention that predictions are estimates and the user makes the final decision. '
              : 'You are the narration layer of a career-forecasting tool. You receive deterministic match output and must explain it to the user in 3-4 warm, concrete sentences. STRICT RULES: use ONLY the facts provided; never invent jobs, courses, statistics, salaries or sources; never give a different score; mention that predictions are estimates and the user makes the final decision. ') +
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