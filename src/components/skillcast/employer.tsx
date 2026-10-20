'use client';

import { useMemo, useState } from 'react';
import { GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEAM } from '@/data/team';
import { ROLE_MAP, ROLES } from '@/data/roles';
import { SKILLS, SKILL_MAP } from '@/data/skills';
import { matchAll } from '@/lib/matching';
import { useSkillCast } from '@/lib/store';
import { SdgBadge, useSignals, useT } from './shared';

// ─── Employer / HR view: workforce skills-gap heatmap (good-to-have) ───────
// Synthetic team of 8. Each member's skills are run through the SAME
// deterministic matching engine as individuals — the heatmap shows levels,
// the plan shows aggregated gaps. k-anonymity guardrail is stated up front.

const HEAT_COLORS = ['bg-rose-100 dark:bg-rose-950', 'bg-rose-100 dark:bg-rose-950', 'bg-amber-100 dark:bg-amber-950', 'bg-amber-50 dark:bg-amber-900/40', 'bg-emerald-100 dark:bg-emerald-950', 'bg-emerald-200 dark:bg-emerald-900'];

export function EmployerView() {
  const t = useT();
  const { momentumMap } = useSignals();
  const [targetRole, setTargetRole] = useState('ai-ops-specialist');
  const role = ROLE_MAP[targetRole];

  const heatmapSkills = useMemo(() => {
    return Object.entries(momentumMap)
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => slug)
      .filter((slug) => SKILL_MAP[slug])
      .slice(0, 8);
  }, [momentumMap]);

  const memberMatches = useMemo(
    () =>
      TEAM.map((m) => {
        const matches = matchAll(
          { persona: m.persona, years: m.years, interests: m.interests, budget: 5, skills: m.skills, inclusion: { dyslexia: false, visual: false, hearing: false, mobility: false, none: true }, objective: '', cvScrub: null, intakeMode: 'form' },
          momentumMap,
        );
        return { member: m, top: matches[0], matches };
      }),
    [momentumMap],
  );

  const teamGaps = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { matches } of memberMatches) {
      const m = matches.find((x) => x.roleSlug === targetRole);
      for (const g of m?.gap ?? []) counts.set(g.skill, (counts.get(g.skill) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [memberMatches, targetRole]);

  const entryRoles = ROLES.filter((r) => r.entryLevel).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <div className="mt-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Users className="h-6 w-6 text-teal-700 dark:text-teal-400" aria-hidden />
          {t('emp.title')}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('emp.desc')}</p>
        <Badge variant="outline" className="mt-2 gap-1.5 border-emerald-400 text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {t('emp.k')}
        </Badge>
      </div>

      {/* Heatmap */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t('emp.gaps')} — {t('demand.momentum')} top skills
          </CardTitle>
          <CardDescription>0–5 · {t('common.estimates')}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0.5 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card px-2 pb-1 text-left text-xs font-medium text-muted-foreground">Team</th>
                {heatmapSkills.map((slug) => (
                  <th key={slug} className="pb-1 text-center text-[10px] font-medium leading-tight text-muted-foreground">
                    <div className="mx-auto max-w-[72px]">{SKILL_MAP[slug]?.name.split(' ').slice(0, 2).join(' ')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEAM.map((m) => (
                <tr key={m.id}>
                  <td className="sticky left-0 z-10 bg-card px-2 py-1">
                    <span className="block whitespace-nowrap text-xs font-medium">{m.name.replace(' (synthetic)', '')}</span>
                    <span className="block whitespace-nowrap text-[10px] text-muted-foreground">{m.title}</span>
                  </td>
                  {heatmapSkills.map((slug) => {
                    const lvl = m.skills[slug] ?? 0;
                    return (
                      <td key={slug} className="text-center">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${HEAT_COLORS[lvl] ?? 'bg-muted'}`}
                          title={`${SKILL_MAP[slug]?.name}: level ${lvl}`}
                        >
                          {lvl}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Team plan toward a target role */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('emp.plan')}</CardTitle>
            <CardDescription>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger className="mt-1 h-8 w-full text-xs" aria-label="Target role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.slug} value={r.slug} className="text-xs">
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {teamGaps.map(([slug, n]) => (
                <li key={slug} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{SKILL_MAP[slug]?.name ?? slug}</span>
                  <Badge variant="outline">{n}/8 {t('emp.gaps').toLowerCase()}</Badge>
                </li>
              ))}
              {teamGaps.length === 0 && <li className="text-sm text-muted-foreground">—</li>}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{role?.signalsNote}</p>
          </CardContent>
        </Card>

        {/* Per-member top matches */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('match.title')} — {t('emp.risk')}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto">
            <ul className="space-y-2">
              {memberMatches.map(({ member, top }) => (
                <li key={member.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    <span className="font-medium">{member.name.replace(' (synthetic)', '')}</span>
                    <span className="text-muted-foreground"> · {member.dept}</span>
                  </span>
                  {top && (
                    <Badge variant="secondary" className="max-w-52 shrink-0 truncate text-[11px]">
                      {ROLE_MAP[top.roleSlug]?.title} · {top.score}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Internship pipeline */}
      <Card className="mt-4 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
            {t('emp.intern')}
          </CardTitle>
          <CardDescription>{t('emp.intern.d')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entryRoles.map((r) => (
              <li key={r.slug} className="rounded-lg border p-3">
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.tagline}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.sdgTags.map((g) => (
                    <SdgBadge key={g} goal={g} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
