'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Bot, Check, ClipboardCopy, Compass, Sparkles, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_MAP } from '@/data/roles';
import { COURSE_MAP } from '@/data/courses';
import { haradaMatrix } from '@/lib/matching';
import type { RoleMatch } from '@/lib/types';
import { useSkillCast } from '@/lib/store';
import { LevelDots, MomentumPill, SdgBadge, useSignals, useT } from './shared';

// ─── Harada tab: Open 9 Boxes — a self-management sheet the user owns ───────
// Harada fills the follow-through blind spot: the app stops predicting and
// hands the user a sheet they own. Every box is pre-filled with cited
// deterministic data (public match formula, gap list, course registry, time
// budget, completed courses); the human keeps ownership — the goal box is
// chosen by the user, not the AI. The LLM only narrates the plan on request
// (call site 2) and always falls back to a deterministic template.

export function HaradaTab({ matches }: { matches: RoleMatch[] }) {
  const t = useT();
  const { chosenRole, profile, completedCourses, lang, scenario } = useSkillCast();
  const { momentumMap } = useSignals();
  const [plan, setPlan] = useState<string | null>(null);
  const [planFallback, setPlanFallback] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const match = useMemo(() => matches.find((m) => m.roleSlug === chosenRole) ?? null, [matches, chosenRole]);
  const role = chosenRole ? ROLE_MAP[chosenRole] : null;
  const matrix = useMemo(
    () => (role ? haradaMatrix(profile, role.slug).map((r) => ({ ...r, momentum: momentumMap[r.skill] ?? 0 })) : []),
    [role, profile, momentumMap],
  );

  if (!role || !match) {
    return (
      <Card className="text-center">
        <CardContent className="py-12 text-muted-foreground">{t('sdg.notchosen')}</CardContent>
      </Card>
    );
  }

  const gaps = [...match.gap].sort((a, b) => a.weight - b.weight).slice(0, 4);
  const gapSkills = gaps.map((g) => g.skill);
  const planCourses = Object.values(COURSE_MAP)
    .filter((c) => c.skills.some((s) => gapSkills.includes(s)))
    .slice(0, 3);
  const minutesPerDay = Math.max(10, Math.round((profile.budget * 60) / 7));
  const deadlineDate = new Date(Date.now() + match.pathwayWeeks * 7 * 24 * 3600 * 1000).toLocaleDateString();

  const askAI = async () => {
    setPlanLoading(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleSlug: role.slug,
          mode: 'harada',
          score: match.score,
          factors: match.factors.map((f) => ({ label: f.label, value: f.value })),
          gap: match.gap.slice(0, 5).map((g) => ({
            skill: g.skill,
            userLevel: g.userLevel,
            minLevel: g.minLevel,
            momentum: momentumMap[g.skill] ?? g.momentum,
          })),
          scenario,
          lang,
          pathwayWeeks: match.pathwayWeeks,
          budget: profile.budget,
          courses: planCourses.map((c) => `${c.title} (${c.provider})`),
        }),
      });
      const json = (await res.json()) as { narration?: string; fallback?: boolean };
      setPlan(json.narration ?? null);
      setPlanFallback(Boolean(json.fallback));
    } catch {
      setPlan(null);
      setPlanFallback(true);
    } finally {
      setPlanLoading(false);
    }
  };

  const shareText = [
    `SkillCast plan — ${role.title}`,
    `Why: ${role.tagline}`,
    `Deadline: ~${match.pathwayWeeks} weeks at ${profile.budget} hrs/week (by ${deadlineDate})`,
    `Priority gaps: ${gaps.map((g) => `${g.skillName} ${g.userLevel}→${g.minLevel}`).join(', ') || 'none'}`,
    `Courses: ${planCourses.map((c) => `${c.title} (${c.provider})`).join(', ') || '—'}`,
    `Progress: ${completedCourses.length}/${planCourses.length} courses done`,
    `SDG: ${role.sdgTags.join(', ')}`,
  ].join('\n');

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      // clipboard unavailable (e.g. non-secure context) — nothing to fix here
    }
  };

  const cell = (title: string, desc: string, children: ReactNode) => (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-2">{children}</div>
      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );

  const vision = t('harada.vision.text', {
    top: matrix[0]?.name ?? '—',
    n: match.gap.length,
    w: match.pathwayWeeks,
    b: profile.budget,
    role: role.title,
  });

  return (
    <div className="space-y-4">
      {/* Open 9 Boxes — the self-management sheet */}
      <div className="grid gap-3 md:grid-cols-3">
        {cell(t('harada.box.goal'), t('harada.goal.d'), (
          <div>
            <p className="font-semibold leading-snug">{role.title}</p>
            <Badge variant="outline" className="mt-1.5 text-[10px] text-muted-foreground">
              <Target className="mr-1 h-3 w-3" aria-hidden /> {t('harada.chosen')}
            </Badge>
          </div>
        ))}
        {cell(t('harada.box.why'), t('harada.why.d'), <p className="text-sm leading-snug">{role.tagline}</p>)}
        {cell(t('harada.box.deadline'), t('harada.deadline.d', { w: match.pathwayWeeks, b: profile.budget }), (
          <p className="text-sm font-medium">
            ~{match.pathwayWeeks} {t('harada.weeks')} → {deadlineDate}
          </p>
        ))}
        {cell(t('harada.box.situation'), t('harada.situation.d'), (
          <ul className="space-y-1.5">
            {gaps.map((g) => (
              <li key={g.skill} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{g.skillName}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <LevelDots level={g.userLevel} />
                  <MomentumPill momentum={momentumMap[g.skill] ?? g.momentum} />
                </span>
              </li>
            ))}
            {gaps.length === 0 && <li className="text-sm text-muted-foreground">No gaps — strong fit.</li>}
          </ul>
        ))}
        {cell(t('harada.box.plan'), t('harada.plan.d'), (
          <ul className="space-y-1 text-sm">
            {planCourses.map((c) => (
              <li key={c.slug} className="truncate">
                {c.title} <span className="text-muted-foreground">({c.provider})</span>
              </li>
            ))}
            {planCourses.length === 0 && <li className="text-muted-foreground">—</li>}
          </ul>
        ))}
        {cell(t('harada.box.routine'), t('harada.routine.d', { m: minutesPerDay }), (
          <p className="text-sm font-medium">
            ~{minutesPerDay} {t('harada.min')} / {t('harada.day')} · {profile.budget} {t('harada.hrs')}
          </p>
        ))}
        {cell(t('harada.box.measure'), t('harada.measure.d', { done: completedCourses.length, total: Math.max(1, planCourses.length) }), (
          <p className="text-sm font-medium">
            {completedCourses.length} / {planCourses.length} {t('harada.courses')}
          </p>
        ))}
        {cell(t('harada.box.share'), t('harada.share.d'), (
          <Button size="sm" variant="outline" onClick={() => void copyPlan()} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? t('harada.share.copied') : t('harada.share.btn')}
          </Button>
        ))}
        {cell(t('harada.box.sdg'), t('harada.sdg.d'), (
          <div className="flex flex-wrap gap-1.5">
            {role.sdgTags.map((g) => (
              <SdgBadge key={g} goal={g} size="md" />
            ))}
          </div>
        ))}
      </div>

      {/* AI plan narration (call site 2 — never invents facts) */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => void askAI()} disabled={planLoading} className="gap-2">
          <Bot className="h-4 w-4" aria-hidden />
          {planLoading ? '…' : t('harada.ai.btn')}
        </Button>
      </div>
      {plan && (
        <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3 text-sm dark:border-violet-900 dark:bg-violet-950/30">
          <p className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
            <span>{plan}</span>
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {planFallback ? t('match.coach.fallback') : t('match.coach.disclosure')}
          </p>
        </div>
      )}

      {/* Objective + vision */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden />
              {t('harada.objective')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg bg-muted/50 p-3 text-sm italic">“{profile.objective || '—'}”</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              {t('harada.vision')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{vision}</p>
            <Badge variant="outline" className="mt-2 text-[11px] text-muted-foreground">
              {t('harada.method')}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Skill map detail */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('harada.title')}</CardTitle>
          <CardDescription>{t('harada.desc', { role: role.title })}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">{t('common.level')}</th>
                <th className="pb-2 font-medium">{t('harada.current')}</th>
                <th className="pb-2 font-medium">{t('harada.required')}</th>
                <th className="pb-2 font-medium">{t('demand.momentum')}</th>
                <th className="pb-2 font-medium">Gap</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => {
                const gap = row.required - row.current;
                return (
                  <tr key={row.skill} className="border-b last:border-0">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{row.name}</span>
                      <span className="block text-xs text-muted-foreground">{row.category}</span>
                    </td>
                    <td className="py-2.5 pr-3"><LevelDots level={row.current} /></td>
                    <td className="py-2.5 pr-3"><LevelDots level={row.required} highlight={row.required} /></td>
                    <td className="py-2.5 pr-3"><MomentumPill momentum={row.momentum} /></td>
                    <td className="py-2.5">
                      {gap <= 0 ? (
                        <Badge className="bg-emerald-600 text-white">✓</Badge>
                      ) : gap >= 2 ? (
                        <Badge className="bg-rose-600 text-white">+{gap}</Badge>
                      ) : (
                        <Badge className="bg-amber-500 text-white">+{gap}</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            {t('pw.progress')}: {completedCourses.length} {t('pw.done').toLowerCase()} · {t('common.estimates')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}