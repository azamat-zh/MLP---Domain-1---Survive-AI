'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen, Building2, CalendarClock, Gauge, GraduationCap, ListChecks, ShieldCheck, Users, Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resolveRoster } from '@/data/team';
import { COURSES } from '@/data/courses';
import { ROLE_MAP, ROLES } from '@/data/roles';
import { SKILL_MAP } from '@/data/skills';
import { matchAll } from '@/lib/matching';
import { useSkillCast } from '@/lib/store';
import type { Profile } from '@/lib/types';
import { SdgBadge, SourceChip, useSignals, useT } from './shared';

// ─── Employer / HR view: workforce skills-gap heatmap (good-to-have) ───────
// Driven by the employer onboarding (company, industry, intake, objective,
// timeline, budget). The roster is SYNTHETIC in the POC (competition rule);
// the matching engine is the SAME deterministic engine individuals get.
// k-anonymity guardrail is stated up front.

const HEAT_COLORS = ['bg-rose-100 dark:bg-rose-950', 'bg-rose-100 dark:bg-rose-950', 'bg-amber-100 dark:bg-amber-950', 'bg-amber-50 dark:bg-amber-900/40', 'bg-emerald-100 dark:bg-emerald-950', 'bg-emerald-200 dark:bg-emerald-900'];

const stubProfile = (m: { persona: Profile['persona']; years: number; interests: string[]; skills: Record<string, number> }): Profile => ({
  persona: m.persona, years: m.years, interests: m.interests, budget: 5, skills: m.skills,
  inclusion: { dyslexia: false, visual: false, hearing: false, mobility: false, none: true },
  objective: '', cvScrub: null, intakeMode: 'form',
});

export function EmployerView() {
  const t = useT();
  const { momentumMap } = useSignals();
  const { employer, setView, setUserType } = useSkillCast();
  const [targetRole, setTargetRole] = useState('ai-ops-specialist');
  const role = ROLE_MAP[targetRole];

  const isDemo = employer.company.trim().length === 0 || employer.objective === '';
  const orgName = employer.company.trim() || t('emp.demo.org');
  const industryLabel = employer.industry ? t(`industry.${employer.industry}`) : t('emp.demo.industry');
  const objectiveLabel = employer.objective ? t(`onb.emp.obj.${employer.objective}`) : '';

  const roster = useMemo(
    () => resolveRoster({ intake: employer.intake, template: employer.template }),
    [employer.intake, employer.template],
  );
  const team = roster.members;

  const heatmapSkills = useMemo(() => {
    return Object.entries(momentumMap)
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => slug)
      .filter((slug) => SKILL_MAP[slug])
      .slice(0, 8);
  }, [momentumMap]);

  const memberMatches = useMemo(
    () => team.map((m) => ({ member: m, top: matchAll(stubProfile(m), momentumMap)[0] })),
    [team, momentumMap],
  );

  const teamGaps = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { member } of memberMatches) {
      const m = matchAll(stubProfile(member), momentumMap).find((x) => x.roleSlug === targetRole);
      for (const g of m?.gap ?? []) counts.set(g.skill, (counts.get(g.skill) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [memberMatches, targetRole, momentumMap]);

  // Budget split: courses covering the team's gap skills, free vs HRD-claimable
  const budgetSplit = useMemo(() => {
    let freeHrs = 0, hrdHrs = 0, freeN = 0, hrdN = 0;
    const covered = new Set<string>();
    for (const [slug] of teamGaps) {
      if (covered.has(slug)) continue;
      const course = COURSES.find((c) => c.skills.includes(slug));
      if (!course) continue;
      if (course.hrdClaimable) { hrdHrs += course.totalHours; hrdN++; }
      else if (course.free) { freeHrs += course.totalHours; freeN++; }
      else { hrdHrs += course.totalHours; hrdN++; }
      course.skills.forEach((s) => covered.add(s));
    }
    return { freeHrs, hrdHrs, freeN, hrdN };
  }, [teamGaps]);

  // Roles at risk (deterministic: automation exposure parameter, cited per role)
  const atRiskRoles = useMemo(
    () => [...ROLES].sort((a, b) => b.automationExposure - a.automationExposure).slice(0, 5),
    [],
  );

  // Most exposed staff: lowest average momentum across their current skills
  const exposedStaff = useMemo(() => {
    return team
      .map((m) => {
        const slugs = Object.keys(m.skills);
        const avg = slugs.length
          ? slugs.reduce((s, sl) => s + (momentumMap[sl] ?? SKILL_MAP[sl]?.seedMomentum ?? 50), 0) / slugs.length
          : 50;
        return { member: m, avgMomentum: Math.round(avg) };
      })
      .sort((a, b) => a.avgMomentum - b.avgMomentum)
      .slice(0, 5);
  }, [team, momentumMap]);

  // Timeline phases from onboarding
  const months = employer.timelineMonths ?? 6;
  const phaseLen = Math.max(1, Math.round(months / 3));
  const phases = [
    { key: 'emp.phase1', icon: BookOpen, range: `M1–M${phaseLen}` },
    { key: 'emp.phase2', icon: ListChecks, range: `M${phaseLen + 1}–M${phaseLen * 2}` },
    { key: 'emp.phase3', icon: ShieldCheck, range: `M${phaseLen * 2 + 1}–M${months}` },
  ];

  const budgetPref = employer.budgetPref ?? 'free';
  const entryRoles = ROLES.filter((r) => r.entryLevel).slice(0, 6);

  const objectiveCards = [
    { id: 'risk', icon: Gauge, descKey: 'emp.obj.risk.desc' },
    { id: 'transition', icon: ListChecks, descKey: 'emp.obj.transition.desc' },
    { id: 'budget', icon: Wallet, descKey: 'emp.obj.budget.desc' },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* Org header from onboarding */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="h-6 w-6 text-teal-700 dark:text-teal-400" aria-hidden />
            {orgName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="gap-1"><Building2 className="h-3 w-3" aria-hidden /> {industryLabel}</Badge>
            <Badge variant="outline">{team.length}/{roster.totalStaff} {t('emp.shown')}</Badge>
            {objectiveLabel && (
              <Badge className="gap-1 bg-teal-700 text-white dark:bg-teal-600"><ListChecks className="h-3 w-3" aria-hidden /> {objectiveLabel}</Badge>
            )}
            <Badge variant="outline" className="gap-1"><CalendarClock className="h-3 w-3" aria-hidden /> {t(`onb.emp.months.${months}`)}</Badge>
            {employer.budgetPref && (
              <Badge variant="outline" className="gap-1">
                {employer.budgetPref === 'free' ? <BookOpen className="h-3 w-3" aria-hidden /> : <Wallet className="h-3 w-3" aria-hidden />}
                {t(`onb.emp.budget.${employer.budgetPref}`)}
              </Badge>
            )}
          </div>
        </div>
        {isDemo && (
          <Button variant="outline" size="sm" onClick={() => { setUserType('employer'); setView('onboarding'); }} className="gap-2">
            <Building2 className="h-4 w-4" aria-hidden /> {t('emp.setup.cta')}
          </Button>
        )}
      </div>
      {isDemo && <p className="mt-2 text-sm text-muted-foreground">{t('emp.demo.note')}</p>}
      <Badge variant="outline" className="mt-3 gap-1.5 border-emerald-400 text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        {t('emp.k')}
      </Badge>

      {/* Objective status card */}
      {employer.objective && (
        <Card className={`mt-4 ${employer.objective === 'risk' ? 'border-rose-300 dark:border-rose-900' : employer.objective === 'transition' ? 'border-teal-300 dark:border-teal-800' : 'border-amber-300 dark:border-amber-900'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('emp.obj.title')}: {objectiveLabel}</CardTitle>
            <CardDescription>{t(objectiveCards.find((o) => o.id === employer.objective)?.descKey ?? 'emp.obj.risk.desc')}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Objective-driven ordering: risk first when objective = risk */}
      {employer.objective === 'risk' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="border-rose-200 dark:border-rose-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden /> {t('emp.atrisk')}
              </CardTitle>
              <CardDescription>{t('emp.atrisk.d')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {atRiskRoles.map((r) => (
                <div key={r.slug}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{r.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{Math.round(r.automationExposure * 100)}%</span>
                  </div>
                  <Progress value={r.automationExposure * 100} className="mt-1 h-1.5" aria-label={`${r.title} automation exposure`} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('emp.exposed.staff')}</CardTitle>
              <CardDescription>{t('emp.exposed.staff.d')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {exposedStaff.map(({ member, avgMomentum }) => (
                  <li key={member.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">
                      <span className="font-medium">{member.name.replace(' (synthetic)', '')}</span>
                      <span className="text-muted-foreground"> · {member.title}</span>
                    </span>
                    <Badge variant={avgMomentum < 45 ? 'destructive' : avgMomentum < 60 ? 'secondary' : 'outline'} className="shrink-0">
                      {t('demand.momentum')} {avgMomentum}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Heatmap */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t('emp.gaps')} — {t('demand.momentum')} top skills
          </CardTitle>
          <CardDescription>
            0–5 · {t('common.estimates')}
            {team.length < roster.totalStaff && ` · ${t('emp.aggregated', { n: roster.totalStaff - team.length })}`}
          </CardDescription>
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
              {team.slice(0, 14).map((m) => (
                <tr key={m.id}>
                  <td className="sticky left-0 z-10 bg-card px-2 py-1">
                    <span className="block whitespace-nowrap text-xs font-medium">{m.name.replace(' (synthetic)', '').replace(' (batch, synthetic)', '')}</span>
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

      {/* Team plan + per-member matches */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('emp.plan')}</CardTitle>
            <CardDescription>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger className="mt-1 h-11 w-full rounded-xl text-sm" aria-label="Target role">
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
                  <Badge variant="outline">{n}/{team.length} {t('emp.gaps').toLowerCase()}</Badge>
                </li>
              ))}
              {teamGaps.length === 0 && <li className="text-sm text-muted-foreground">—</li>}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{role?.signalsNote}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('match.title')} — {t('emp.risk')}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto">
            <ul className="space-y-2">
              {memberMatches.slice(0, 14).map(({ member, top }) => (
                <li key={member.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    <span className="font-medium">{member.name.replace(' (synthetic)', '').replace(' (batch, synthetic)', '')}</span>
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

      {/* Timeline + budget (objective: transition & budget) */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className={employer.objective === 'transition' ? 'border-teal-300 dark:border-teal-800' : undefined}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-5 w-5 text-teal-700 dark:text-teal-400" aria-hidden />
              {t('emp.timeline.plan')} — {t(`onb.emp.months.${months}`)}
            </CardTitle>
            <CardDescription>{t('emp.timeline.d')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {phases.map((p, i) => (
                <li key={p.key} className="flex items-start gap-3 rounded-lg border p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t(p.key)} <Badge variant="outline" className="ml-1 text-[10px]">{p.range}</Badge></p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t(`${p.key}.d`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className={employer.objective === 'budget' ? 'border-amber-300 dark:border-amber-900' : undefined}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
              {t('emp.budget.split')}
            </CardTitle>
            <CardDescription>
              {budgetPref === 'free' ? t('emp.budget.free.first') : t('emp.budget.hrd.first')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-300 p-3 dark:border-emerald-900">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden /> {t('emp.free.mat')}
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{budgetSplit.freeHrs}h</p>
                <p className="text-xs text-muted-foreground">{budgetSplit.freeN} {t('emp.courses')}</p>
              </div>
              <div className="rounded-lg border border-amber-300 p-3 dark:border-amber-900">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" aria-hidden /> {t('emp.hrd.mat')}
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">{budgetSplit.hrdHrs}h</p>
                <p className="text-xs text-muted-foreground">{budgetSplit.hrdN} {t('emp.courses')}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('emp.hrd.note')}</p>
            <SourceChip href="https://hrdcorp.gov.my/">hrdcorp.gov.my</SourceChip>
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
