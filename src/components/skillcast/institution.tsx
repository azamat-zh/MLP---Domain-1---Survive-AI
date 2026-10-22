'use client';

import { useMemo, useState } from 'react';
import {
  BookOpenCheck, Check, Copy, GraduationCap, Link2, Radar, ScrollText, Target, Users,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FIELD_ROLE_CATEGORIES, FIELD_SYLLABI, FIELDS_OF_STUDY, cohortForField } from '@/data/institution';
import { ROLES } from '@/data/roles';
import { SKILL_MAP } from '@/data/skills';
import { matchAll } from '@/lib/matching';
import { useSkillCast } from '@/lib/store';
import type { Profile, StudyField } from '@/lib/types';
import { LevelDots, SdgBadge, SourceChip, useSignals, useT } from './shared';

// ─── TVET & University Career Centres (Student Advisory View) ──────────────
// Advises a cohort against entry-level roles emerging from live market
// signals, surfaces practical-skills gaps in the current syllabus, and maps
// graduate paths to the SDGs. Cohort is SYNTHETIC in the POC.

const studentProfile = (s: { interests: string[]; skills: Record<string, number> }): Profile => ({
  persona: 'fresh-grad', years: 0, interests: s.interests, budget: 5, skills: s.skills,
  inclusion: { dyslexia: false, visual: false, hearing: false, mobility: false, none: true },
  objective: '', cvScrub: null, intakeMode: 'form',
});

export function InstitutionView() {
  const t = useT();
  const { momentumMap } = useSignals();
  const { institution, setView, setUserType } = useSkillCast();
  const [copied, setCopied] = useState(false);

  const isDemo = institution.name.trim().length === 0 || institution.field === '';
  const field = (institution.field || 'cs') as StudyField;
  const fieldLabel = t(FIELDS_OF_STUDY.find((f) => f.id === field)?.labelKey ?? 'field.cs');
  const orgName = institution.name.trim() || t('inst.demo.name');

  const cohort = useMemo(() => cohortForField(field), [field]);

  // Relevant entry-level roles for this field of study
  const relevantRoles = useMemo(
    () => ROLES.filter((r) => r.entryLevel && FIELD_ROLE_CATEGORIES[field].includes(r.category)),
    [field],
  );

  // Per-student best relevant entry-role match
  const studentMatches = useMemo(
    () =>
      cohort.map((s) => {
        const matches = matchAll(studentProfile(s), momentumMap).filter((m) =>
          relevantRoles.some((r) => r.slug === m.roleSlug),
        );
        return { student: s, best: matches[0] ?? null, top3: matches.slice(0, 3) };
      }),
    [cohort, momentumMap, relevantRoles],
  );

  // Aggregate readiness: students per best-matched role
  const readiness = useMemo(() => {
    const counts = new Map<string, { n: number; total: number }>();
    for (const { best } of studentMatches) {
      if (!best) continue;
      const cur = counts.get(best.roleSlug) ?? { n: 0, total: 0 };
      counts.set(best.roleSlug, { n: cur.n + 1, total: cur.total + best.score });
    }
    return [...counts.entries()]
      .map(([slug, { n, total }]) => ({
        role: (SKILL_MAP[slug] ? ROLES.find((r) => r.slug === slug)?.title ?? slug : slug),
        roleSlug: slug,
        students: n,
        avg: Math.round(total / n),
      }))
      .sort((a, b) => b.students - a.students);
  }, [studentMatches]);

  // Syllabus vs market: required skills of relevant roles, vs taught coverage
  const syllabusRows = useMemo(() => {
    const req = new Map<string, { momentum: number; minLevel: number; roles: number }>();
    for (const r of relevantRoles) {
      for (const need of r.skills) {
        const m = momentumMap[need.skill] ?? SKILL_MAP[need.skill]?.seedMomentum ?? 50;
        const cur = req.get(need.skill);
        req.set(need.skill, {
          momentum: Math.max(cur?.momentum ?? 0, m),
          minLevel: Math.max(cur?.minLevel ?? 0, need.minLevel),
          roles: (cur?.roles ?? 0) + 1,
        });
      }
    }
    const taught = new Map(FIELD_SYLLABI[field].map((s) => [s.skill, s.taughtLevel]));
    return [...req.entries()]
      .map(([slug, info]) => ({
        slug,
        name: SKILL_MAP[slug]?.name ?? slug,
        momentum: info.momentum,
        required: info.minLevel,
        roles: info.roles,
        taught: taught.get(slug) ?? 0,
      }))
      .sort((a, b) => b.momentum - a.momentum);
  }, [relevantRoles, momentumMap, field]);

  const gapSkills = syllabusRows.filter((r) => r.taught < 2 && r.momentum >= 55);

  // SDG alignment of the field's graduate paths
  const sdgGoals = useMemo(() => {
    const set = new Set<number>();
    for (const r of relevantRoles) r.sdgTags.forEach((g) => set.add(g));
    return [...set].sort((a, b) => a - b);
  }, [relevantRoles]);
  const sdgRoles = relevantRoles.slice(0, 3);

  const assessmentLink = useMemo(
    () => `https://app.skillcast.example/assess/${uuidv4().slice(0, 8)}`,
    [],
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(assessmentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const lowBw = institution.lowBandwidth;

  const focusBadges = (
    institution.focus
      ? [{ key: `onb.inst.focus.${institution.focus}`, icon: Target }]
      : []
  ) as Array<{ key: string; icon: typeof Target }>;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* Header */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <GraduationCap className="h-6 w-6 text-teal-700 dark:text-teal-400" aria-hidden />
            {orgName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="gap-1"><BookOpenCheck className="h-3 w-3" aria-hidden /> {fieldLabel}</Badge>
            <Badge variant="outline">{cohort.length} {t('inst.students')}</Badge>
            {institution.intake && <Badge variant="outline">{t(`onb.inst.intake.${institution.intake}`)}</Badge>}
            {focusBadges.map((b) => (
              <Badge key={b.key} className="gap-1 bg-teal-700 text-white dark:bg-teal-600">
                <b.icon className="h-3 w-3" aria-hidden /> {t(b.key)}
              </Badge>
            ))}
            {lowBw && <Badge variant="outline" className="gap-1"><Radar className="h-3 w-3" aria-hidden /> {t('onb.inst.lowbw')}</Badge>}
          </div>
        </div>
        {isDemo && (
          <Button variant="outline" size="sm" onClick={() => { setUserType('institution'); setView('onboarding'); }} className="gap-2">
            <GraduationCap className="h-4 w-4" aria-hidden /> {t('inst.setup.cta')}
          </Button>
        )}
      </div>
      {isDemo && <p className="mt-2 text-sm text-muted-foreground">{t('inst.demo.note')}</p>}

      {/* 1) Cohort readiness */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className={`lg:col-span-3 ${institution.focus === 'entry' ? 'border-teal-300 ring-1 ring-teal-200 dark:border-teal-700 dark:ring-teal-900' : ''}`}>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Radar className="h-5 w-5 text-teal-700 dark:text-teal-400" aria-hidden />
              {t('inst.readiness')}
            </CardTitle>
            <CardDescription>{t('inst.readiness.d', { field: fieldLabel })}</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            {lowBw ? (
              <ul className="space-y-1.5 text-sm">
                {readiness.slice(0, 8).map((r) => (
                  <li key={r.roleSlug} className="flex items-center justify-between gap-2">
                    <span className="truncate">{r.role}</span>
                    <span className="shrink-0 text-muted-foreground">{r.students} × · Ø {r.avg}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readiness.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <YAxis type="category" dataKey="role" width={150} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <RTooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name) => [value, name === 'students' ? t('inst.students') : name]}
                  />
                  <Bar dataKey="students" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Per-student list */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('inst.matchlist')}</CardTitle>
            <CardDescription>{t('inst.synthetic')}</CardDescription>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto">
            <ul className="space-y-2">
              {studentMatches.map(({ student, best }) => (
                <li key={student.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    <span className="font-medium">{student.name.replace(' (synthetic)', '')}</span>
                    <span className="text-muted-foreground"> · {t('inst.year')} {student.year}</span>
                  </span>
                  {best ? (
                    <Badge variant="secondary" className="max-w-44 shrink-0 truncate text-[11px]">
                      {ROLES.find((r) => r.slug === best.roleSlug)?.title} · {best.score}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 2) Syllabus vs market gaps */}
      <Card className={`mt-4 ${institution.focus === 'gaps' ? 'border-rose-300 ring-1 ring-rose-200 dark:border-rose-900 dark:ring-rose-950' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="h-5 w-5 text-teal-700 dark:text-teal-400" aria-hidden />
            {t('inst.syllabus')} — {fieldLabel}
          </CardTitle>
          <CardDescription>{t('inst.syllabus.d')}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">{t('inst.skill')}</th>
                <th className="pb-2 pr-3 font-medium">{t('demand.momentum')}</th>
                <th className="pb-2 pr-3 font-medium">{t('inst.taught')}</th>
                <th className="pb-2 pr-3 font-medium">{t('inst.verdict')}</th>
              </tr>
            </thead>
            <tbody>
              {syllabusRows.slice(0, 10).map((r) => {
                const isGap = r.taught < 2 && r.momentum >= 55;
                return (
                  <tr key={r.slug} className={`border-b last:border-0 ${isGap ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''}`}>
                    <td className="py-2 pr-3">{r.name}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline" className={r.momentum >= 60 ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300' : ''}>
                        {r.momentum}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">{r.taught > 0 ? <LevelDots level={r.taught} /> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="py-2 pr-3">
                      {isGap ? (
                        <Badge variant="destructive" className="text-[11px]">{t('inst.gap')}</Badge>
                      ) : r.taught >= 2 ? (
                        <Badge variant="outline" className="border-emerald-400 text-[11px] text-emerald-700 dark:text-emerald-300">{t('inst.covered')}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[11px]">{t('inst.watch')}</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {gapSkills.length > 0 && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
              {t('inst.gap.summary', { n: gapSkills.length, skills: gapSkills.slice(0, 3).map((g) => g.name).join(', ') })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 3) SDG alignment */}
      <Card className={`mt-4 ${institution.focus === 'sdg' ? 'border-emerald-300 ring-1 ring-emerald-200 dark:border-emerald-900 dark:ring-emerald-950' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-teal-700 dark:text-teal-400" aria-hidden />
            {t('inst.sdg')}
          </CardTitle>
          <CardDescription>{t('inst.sdg.d')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-1.5">
              {sdgGoals.map((g) => (
                <SdgBadge key={g} goal={g} size="md" />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t('inst.sdg.footnote')}</p>
          </div>
          <ul className="space-y-2.5">
            {sdgRoles.map((r) => (
              <li key={r.slug} className="rounded-lg border p-3">
                <p className="flex items-center justify-between gap-2 text-sm font-semibold">
                  {r.title}
                  <span className="flex gap-1">{r.sdgTags.slice(0, 3).map((g) => <SdgBadge key={g} goal={g} />)}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{r.sdgMechanism}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 4) Assessment link */}
      <Card className="mt-4 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
            {t('inst.assess')}
          </CardTitle>
          <CardDescription>{t('inst.assess.d')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <code className="max-w-full truncate rounded-lg border bg-muted px-3 py-2 text-xs">{assessmentLink}</code>
          <Button size="sm" variant="outline" onClick={() => void copyLink()} className="gap-2">
            {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? t('inst.copied') : t('inst.copy')}
          </Button>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">{t('inst.simulated')}</Badge>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        <SourceChip href="https://esco.ec.europa.eu/en/about-esco/portal-classification">ESCO skills taxonomy</SourceChip>{' '}
        <SourceChip href="https://www.myfuturejobs.gov.my/">MyFutureJobs</SourceChip>{' '}
        <SourceChip href="https://www.weforum.org/publications/the-future-of-jobs-report-2025/">WEF Future of Jobs 2025</SourceChip>
      </p>
    </div>
  );
}
