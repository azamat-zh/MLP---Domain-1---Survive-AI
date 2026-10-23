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
import { localizeHrCourse } from '@/lib/hr-i18n';
import { buildHrSignals, hrSkillEvidence } from '@/lib/hr-signals';
import { ROLE_MAP, ROLES } from '@/data/roles';
import { SKILL_MAP } from '@/data/skills';
import { matchAll } from '@/lib/matching';
import { useSkillCast } from '@/lib/store';
import type { CourseDef, Profile, TeamMemberDef } from '@/lib/types';
import { SdgBadge, SourceChip, useSignals, useT } from './shared';
import { HrMarketSignals, HrSignalEvidence } from './hr-market-signals';

// ─── Employer / HR view: workforce skills-gap heatmap (good-to-have) ───────
// Driven by the employer onboarding (company, industry, intake, objective,
// timeline, budget). The roster is SYNTHETIC in the POC (competition rule);
// the matching engine is the SAME deterministic engine individuals get.
// Individual rows below are fabricated examples, not assessed employees.

const HEAT_COLORS = ['bg-rose-100 dark:bg-rose-950', 'bg-rose-100 dark:bg-rose-950', 'bg-amber-100 dark:bg-amber-950', 'bg-amber-50 dark:bg-amber-900/40', 'bg-emerald-100 dark:bg-emerald-950', 'bg-emerald-200 dark:bg-emerald-900'];

const stubProfile = (m: { persona: Profile['persona']; years: number; interests: string[]; skills: Record<string, number> }): Profile => ({
  persona: m.persona, years: m.years, interests: m.interests, budget: 5, skills: m.skills,
  inclusion: { dyslexia: false, visual: false, hearing: false, mobility: false, none: true },
  objective: '', cvScrub: null, intakeMode: 'form',
});

export const HR_DEMO_PROGRESS = { percent: 45, completedHours: 18, plannedHours: 40 };

// Reuse the published matching engine. Counts are always over the synthetic
// roster, never the configured company headcount; one learner per course.
export function summarizeTargetRole(team: TeamMemberDef[], targetRole: string, momentumMap: Record<string, number>) {
  const memberMatches = team.map((member) => {
    const matches = matchAll(stubProfile(member), momentumMap);
    return { member, top: matches[0], selected: matches.find((match) => match.roleSlug === targetRole) };
  });
  const counts = new Map<string, number>();
  const courses = new Map<string, { course: CourseDef; learners: Set<string>; skills: Set<string> }>();
  for (const { member, selected } of memberMatches) {
    const covered = new Set<string>();
    for (const gap of selected?.gap ?? []) {
      counts.set(gap.skill, (counts.get(gap.skill) ?? 0) + 1);
      if (covered.has(gap.skill)) continue;
      const course = COURSES.find((candidate) => candidate.skills.includes(gap.skill));
      if (!course) continue;
      const item = courses.get(course.slug) ?? { course, learners: new Set<string>(), skills: new Set<string>() };
      item.learners.add(member.id);
      for (const skill of course.skills) {
        covered.add(skill);
        if (selected?.gap.some((entry) => entry.skill === skill)) item.skills.add(skill);
      }
      courses.set(course.slug, item);
    }
  }
  return {
    memberMatches,
    teamGaps: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    readiness: team.length ? Math.round(memberMatches.reduce((sum, item) => sum + (item.selected?.skillReadiness ?? 0), 0) / team.length) : 0,
    training: [...courses.values()].sort((a, b) => b.learners.size - a.learners.size),
  };
}

export function EmployerView() {
  const t = useT();
  const { momentumMap, data, error, loading, refreshing, refresh } = useSignals();
  const { employer, setView, setUserType } = useSkillCast();
  const [targetRole, setTargetRole] = useState('ai-ops-specialist');
  const [scenario, setScenario] = useState<'moderate' | 'fast'>('moderate');
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

  const signals = useMemo(() => buildHrSignals(data, error, targetRole, loading), [data, error, targetRole, loading]);
  const heatmapSkills = signals.columns;

  const { memberMatches, teamGaps, readiness, training } = useMemo(
    () => summarizeTargetRole(team, targetRole, momentumMap),
    [team, targetRole, momentumMap],
  );

  const roleMix = [...new Set(team.map((member) => t(`hr.job.${member.title}`)))];
  const departmentMix = [...new Set(team.map((member) => t(`hr.department.${member.dept}`)))];
  const demandRoles = [...ROLES].sort((a, b) =>
    (a.demandAccelerated - a.demandModerate) - (b.demandAccelerated - b.demandModerate));

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
    { key: 'emp.phase1', icon: BookOpen, range: t('hr.month.range', { start: 1, end: phaseLen }) },
    { key: 'emp.phase2', icon: ListChecks, range: t('hr.month.range', { start: phaseLen + 1, end: phaseLen * 2 }) },
    { key: 'emp.phase3', icon: ShieldCheck, range: t('hr.month.range', { start: phaseLen * 2 + 1, end: months }) },
  ];

  const budgetPref = employer.budgetPref ?? 'free';
  const entryRoles = ROLES.filter((r) => r.entryLevel).slice(0, 6);

  const objectiveCards = [
    { id: 'risk', icon: Gauge, descKey: 'emp.obj.risk.desc' },
    { id: 'transition', icon: ListChecks, descKey: 'emp.obj.transition.desc' },
    { id: 'budget', icon: Wallet, descKey: 'emp.obj.budget.desc' },
  ] as const;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl break-words px-4 pb-16">
      {/* Org header from onboarding */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-full">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="h-6 w-6 text-teal-700 dark:text-teal-400" aria-hidden />
            {orgName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="gap-1"><Building2 className="h-3 w-3" aria-hidden /> {industryLabel}</Badge>
            <Badge variant="outline">{team.length} {t('emp.hr.profiles')}</Badge>
            {objectiveLabel && (
              <Badge className="max-w-full gap-1 whitespace-normal text-left bg-teal-700 text-white dark:bg-teal-600"><ListChecks className="h-3 w-3" aria-hidden /> {objectiveLabel}</Badge>
            )}
            <Badge variant="outline" className="gap-1"><CalendarClock className="h-3 w-3" aria-hidden /> {t(`onb.emp.months.${months}`)}</Badge>
            {employer.budgetPref && (
              <Badge variant="outline" className="max-w-full gap-1 whitespace-normal text-left">
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
      <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-emerald-400 p-3 text-sm text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        <p>{t('emp.hr.disclosure')}</p>
      </div>

      <Card className="mt-4 min-w-0">
        <CardHeader>
          <CardTitle className="text-base">{t('emp.context.title')}</CardTitle>
          <CardDescription>{t('emp.context.mix.note')}</CardDescription>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [t('emp.context.industry'), industryLabel],
            [t('emp.context.size'), String(employer.teamSize)],
            [t('emp.context.location'), t('emp.context.location.na')],
            [t('emp.context.profiles'), String(team.length)],
            [t('emp.context.roles'), roleMix.join(' · ')],
            [t('emp.context.departments'), departmentMix.join(' · ')],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{t('emp.hr.readiness')}</CardTitle>
            <CardDescription>{t('emp.hr.readiness.note', { role: t(`hr.role.${targetRole}.title`), n: team.length })}</CardDescription>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold" data-testid="hr-readiness">{readiness}%</p></CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{t('emp.reskill.progress')}</CardTitle>
            <CardDescription>{t('emp.reskill.hours', HR_DEMO_PROGRESS)}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-2 font-semibold">{HR_DEMO_PROGRESS.percent}%</p>
            <Progress value={HR_DEMO_PROGRESS.percent} aria-label={t('emp.hr.progress.label')} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 min-w-0">
        <CardHeader>
          <CardTitle className="text-base">{t('emp.scenarios.title')}</CardTitle>
          <CardDescription>{t('emp.scenario.caveat')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['moderate', 'fast'] as const).map((item) => (
              <Button key={item} variant={scenario === item ? 'default' : 'outline'} aria-pressed={scenario === item} onClick={() => setScenario(item)}>
                {t(`emp.scenario.${item}`)}
              </Button>
            ))}
          </div>
          <p className="text-sm">{t(`emp.scenario.${scenario}.desc`)}</p>
          <p className="text-sm">{t(`emp.scenario.${scenario}.cadence`)}</p>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {[
              { label: 'emp.outlook.risk.label', role: demandRoles[0] },
              { label: 'emp.outlook.opportunity.label', role: demandRoles[demandRoles.length - 1] },
            ].map((item) => (
              <div key={item.label} className="min-w-0 rounded-lg border p-3 text-sm">
                <p className="text-xs text-muted-foreground">{t(item.label)}</p>
                <p className="font-semibold">{t(`hr.role.${item.role.slug}.title`)}</p>
                <p>{t('emp.hr.demand.index', { n: scenario === 'fast' ? item.role.demandAccelerated : item.role.demandModerate })}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t('emp.hr.demand.note')}</p>
          <p className="text-xs text-muted-foreground">{t('hr.abbreviations')}</p>
        </CardContent>
      </Card>

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
                <Gauge className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden /> {t('emp.atrisk')}
              </CardTitle>
              <CardDescription>{t('emp.atrisk.d')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {atRiskRoles.map((r) => (
                <div key={r.slug}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 whitespace-normal font-medium" title={t(`hr.role.${r.slug}.title`)}>{t(`hr.role.${r.slug}.title`)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{Math.round(r.automationExposure * 100)}%</span>
                  </div>
                  <Progress value={r.automationExposure * 100} className="mt-1 h-1.5" aria-label={t('hr.automation.exposure', { role: t(`hr.role.${r.slug}.title`) })} />
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
                {exposedStaff.map(({ member, avgMomentum }) => {
                  const provenance = hrSkillEvidence(signals, Object.keys(member.skills));
                  return (
                  <li key={member.id} className="flex min-w-0 flex-col items-start gap-1.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="min-w-0 whitespace-normal" title={`${t(`hr.person.${member.name}`)} · ${t(`hr.job.${member.title}`)}`}>
                      <span className="font-medium">{t(`hr.person.${member.name}`)}</span>
                      <span className="text-muted-foreground"> · {t(`hr.job.${member.title}`)}</span>
                    </span>
                    <div className="min-w-0 max-w-full sm:max-w-[60%]">
                      <Badge variant={avgMomentum < 45 ? 'destructive' : avgMomentum < 60 ? 'secondary' : 'outline'} className="max-w-full whitespace-normal">
                        {t('demand.momentum')} {avgMomentum}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">{t(provenance.live ? 'hr.signals.mean.live' : 'hr.signals.mean.demo')}</p>
                      {provenance.live && <HrSignalEvidence entries={provenance.entries} incomplete={provenance.incomplete} t={t} />}
                    </div>
                  </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      <HrMarketSignals model={signals} refreshing={refreshing} retry={refresh} t={t} />

      {/* Levels are always synthetic; live data may only select the columns. */}
      <Card className="mt-4 min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t('emp.gaps')} — {t(signals.live ? 'hr.signals.heatmap.live' : 'hr.signals.heatmap.demo')}
          </CardTitle>
          <CardDescription>
            {t('hr.signals.heatmap.levels')}
            {' · '}
            0–5 · {t('common.estimates')}
            {` · ${t('emp.hr.sample.note', { n: team.length })}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0.5 text-sm">
            <caption className="sr-only">{t('hr.signals.heatmap.levels')}</caption>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card px-2 pb-1 text-left text-xs font-medium text-muted-foreground">{t('emp.hr.team')}</th>
                {heatmapSkills.map((slug) => (
                  <th key={slug} data-testid="hr-skill-column" className="pb-1 text-center text-[10px] font-medium leading-tight text-muted-foreground">
                    <div className="mx-auto max-w-[72px]" title={t(`hr.skill.${slug}`)}>{t(`hr.skill.${slug}`)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.slice(0, 14).map((m) => (
                <tr key={m.id}>
                  <td className="sticky left-0 z-10 bg-card px-2 py-1">
                    <span className="block whitespace-nowrap text-xs font-medium">{t(`hr.person.${m.name}`)}</span>
                    <span className="block whitespace-nowrap text-[10px] text-muted-foreground">{t(`hr.job.${m.title}`)}</span>
                  </td>
                  {heatmapSkills.map((slug) => {
                    const lvl = m.skills[slug] ?? 0;
                    return (
                      <td key={slug} className="text-center">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${HEAT_COLORS[lvl] ?? 'bg-muted'}`}
                          title={t('hr.skill.level', { skill: t(`hr.skill.${slug}`), n: lvl })}
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
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="min-w-0 pb-2 [&>*]:min-w-0">
            <CardTitle className="text-base">{t('emp.plan')}</CardTitle>
            <CardDescription>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger className="mt-1 h-auto min-h-11 w-full min-w-0 max-w-full whitespace-normal rounded-xl text-left text-sm data-[size=default]:h-auto [&_[data-slot=select-value]]:block [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal" aria-label={t('emp.hr.target')} title={t(`hr.role.${targetRole}.title`)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)]">
                  {ROLES.map((r) => (
                    <SelectItem key={r.slug} value={r.slug} className="whitespace-normal break-words text-xs">
                      {t(`hr.role.${r.slug}.title`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {teamGaps.map(([slug, n]) => (
                <li key={slug} className="flex flex-col items-start gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                  <span className="min-w-0 break-words">{t(`hr.skill.${slug}`)}</span>
                  <Badge variant="outline" className="max-w-full shrink-0 whitespace-normal">{n}/{team.length} {t('emp.hr.gap.count')}</Badge>
                </li>
              ))}
              {teamGaps.length === 0 && <li className="text-sm text-muted-foreground">{t('hr.gaps.empty')}</li>}
            </ul>
            <p className="mt-3 text-xs font-medium text-muted-foreground">{t('hr.signals.research')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t(`hr.role.${targetRole}.signals`)}</p>
            <p className="mt-3 text-xs font-medium">{t('emp.hr.critical')}</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {role?.skills.map((requirement) => (
                <li key={requirement.skill}>{t(`hr.skill.${requirement.skill}`)} · {t('emp.hr.required', { n: requirement.minLevel })}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('match.title')} — {t('emp.risk')}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto">
            <ul className="space-y-2">
              {memberMatches.slice(0, 14).map(({ member, top }) => (
                <li key={member.id} className="flex min-w-0 flex-col items-start gap-1.5 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <span className="min-w-0 whitespace-normal" title={`${t(`hr.person.${member.name}`)} · ${t(`hr.department.${member.dept}`)}`}>
                    <span className="font-medium">{t(`hr.person.${member.name}`)}</span>
                    <span className="text-muted-foreground"> · {t(`hr.department.${member.dept}`)}</span>
                  </span>
                  {top && (
                    <Badge variant="secondary" className="max-w-full whitespace-normal text-left text-[11px] sm:max-w-[60%]" title={t(`hr.role.${top.roleSlug}.title`)}>
                      {t(`hr.role.${top.roleSlug}.title`)} · {top.score}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 min-w-0">
        <CardHeader>
          <CardTitle className="text-base">{t('emp.training.title')} — {t(`hr.role.${targetRole}.title`)}</CardTitle>
          <CardDescription>{t('emp.hr.training.note')}</CardDescription>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-3 sm:grid-cols-2">
          {training.map(({ course, learners, skills }) => {
            const label = localizeHrCourse(course, t);
            return (
              <div key={course.slug} className="min-w-0 rounded-lg border p-3 text-sm" data-testid="hr-course">
                <a href={course.url} target="_blank" rel="noopener noreferrer" className="block min-w-0 whitespace-normal font-semibold underline underline-offset-2">{label.title}</a>
                <p className="mt-1 text-xs text-muted-foreground">{label.provider} · {t('emp.hr.hours', { n: course.totalHours })}</p>
                <p className="mt-2">{t('emp.hr.learners', { n: learners.size, total: team.length })}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('emp.hr.covers', { skills: [...skills].map((skill) => t(`hr.skill.${skill}`)).join(', ') })}</p>
              </div>
            );
          })}
          {training.length === 0 && <p className="text-sm text-muted-foreground">{t('emp.no.priority.gap')}</p>}
          <p className="text-xs text-muted-foreground sm:col-span-2">{t('emp.hr.support')}</p>
        </CardContent>
      </Card>

      {/* Timeline + budget (objective: transition & budget) */}
      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className={`min-w-0 ${employer.objective === 'transition' ? 'border-teal-300 dark:border-teal-800' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
              {t('emp.timeline.plan')} — {t(`onb.emp.months.${months}`)}
            </CardTitle>
            <CardDescription>{t('emp.timeline.d')} · {t('emp.hr.target')}: {t(`hr.role.${targetRole}.title`)}</CardDescription>
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

        <Card className={`min-w-0 ${employer.objective === 'budget' ? 'border-amber-300 dark:border-amber-900' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              {t('emp.budget.split')}
            </CardTitle>
            <CardDescription>
              {budgetPref === 'free' ? t('emp.budget.free.first') : budgetPref === 'hrd' ? t('emp.budget.hrd.first') : t('hr.budget.preference.unset')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-300 p-3 dark:border-emerald-900">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden /> {t('emp.free.mat')}
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{t('hr.study.hours', { n: budgetSplit.freeHrs })}</p>
                <p className="text-xs text-muted-foreground">{t('hr.course.count', { n: budgetSplit.freeN })}</p>
              </div>
              <div className="rounded-lg border border-amber-300 p-3 dark:border-amber-900">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden /> {t('emp.hrd.mat')}
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">{t('hr.study.hours', { n: budgetSplit.hrdHrs })}</p>
                <p className="text-xs text-muted-foreground">{t('hr.course.count', { n: budgetSplit.hrdN })}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('emp.hr.budget.scope')}</p>
            <p className="text-xs text-muted-foreground">{t('emp.hrd.note')}</p>
            <SourceChip href="https://hrdcorp.gov.my/">hrdcorp.gov.my</SourceChip>
          </CardContent>
        </Card>
      </div>

      {/* Internship pipeline */}
      <Card className="mt-4 min-w-0">
        <CardHeader>
          <CardTitle className="text-base">{t('emp.sdg.title')}</CardTitle>
          <CardDescription>{t('emp.sdg.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-3 sm:grid-cols-3">
          {[4, 8, 9].map((goal) => (
            <div key={goal} className="min-w-0 rounded-lg border p-3">
              <p className="text-sm font-semibold">{t(`emp.sdg.${goal}.title`)}</p>
              <p className="mt-2 text-xs text-muted-foreground">{t(`emp.sdg.${goal}.desc`)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="mt-4 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            {t('emp.intern')}
          </CardTitle>
          <CardDescription>{t('emp.intern.d')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entryRoles.map((r) => (
              <li key={r.slug} className="rounded-lg border p-3">
                <p className="text-sm font-semibold">{t(`hr.role.${r.slug}.title`)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(`hr.role.${r.slug}.tagline`)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.sdgTags.map((g) => (
                    <SdgBadge key={g} goal={g} label={t('hr.sdg.label', { n: g })} />
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
