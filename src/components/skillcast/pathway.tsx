'use client';

import { useMemo } from 'react';
import { Award, BadgeCheck, BookOpen, Check, Clock, ExternalLink, Flag, Lock, Sparkles, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COURSES, COURSE_MAP } from '@/data/courses';
import { ROLE_MAP } from '@/data/roles';
import type { RoleMatch } from '@/lib/types';
import { useSkillCast } from '@/lib/store';
import { SdgBadge, SourceChip, useSignals, useT } from './shared';

// ─── Pathway tab: Duolingo-style tracked roadmap from the curated registry ──
// Courses are picked deterministically: gap priority (weight × momentum),
// then inclusion-aware format preference, then free-first. Nothing invented.

export interface PathwayNode {
  courseSlug: string;
  skill: string;
  startWeek: number;
  weeks: number;
}

const AI_SLUGS = new Set(['prompt-engineering', 'ai-agents', 'ai-augmented-ops', 'machine-learning', 'ai-content-ops', 'responsible-ai', 'mlops']);
const GREEN_SLUGS = new Set(['renewable-energy', 'energy-efficiency', 'ev-mobility', 'climate-data', 'smart-agriculture']);

export function pickCourses(gap: RoleMatch['gap'], inclusion: { dyslexia: boolean; visual: boolean; hearing: boolean }) {
  const covered = new Set<string>();
  const picked: PathwayNode[] = [];
  let hours = 0;
  const budget = Math.max(1, useSkillCast.getState().profile.budget || 5);

  for (const g of gap) {
    if (covered.has(g.skill)) continue;
    const candidates = COURSES.filter((c) => c.skills.includes(g.skill) && !picked.some((p) => p.courseSlug === c.slug));
    if (candidates.length === 0) continue;
    const scored = candidates.map((c) => {
      let s = 0;
      if (c.free) s += 2;
      if (inclusion.dyslexia && c.formats.some((f) => f === 'video' || f === 'interactive' || f === 'project')) s += 3;
      if (inclusion.dyslexia && c.formats.includes('text')) s -= 1;
      if (inclusion.visual && (c.accessibility.includes('screen-reader-friendly') || c.formats.includes('text'))) s += 3;
      if (inclusion.hearing && (c.accessibility.includes('captions') || c.accessibility.includes('transcripts'))) s += 3;
      if (c.certificate) s += 0.5;
      return { c, s };
    });
    scored.sort((a, b) => b.s - a.s || a.c.totalHours - b.c.totalHours);
    const best = scored[0].c;
    picked.push({
      courseSlug: best.slug,
      skill: g.skill,
      startWeek: Math.max(1, Math.ceil((hours + 1) / budget)),
      weeks: Math.max(1, Math.ceil(best.totalHours / budget)),
    });
    hours += best.totalHours;
    best.skills.forEach((s) => covered.add(s));
  }
  return picked;
}

export function PathwayTab({ matches }: { matches: RoleMatch[] }) {
  const t = useT();
  const { chosenRole, profile, completedCourses, toggleCourse, setDashTab } = useSkillCast();
  const { momentumMap } = useSignals();

  const match = useMemo(
    () => matches.find((m) => m.roleSlug === chosenRole) ?? null,
    [matches, chosenRole],
  );
  const role = chosenRole ? ROLE_MAP[chosenRole] : null;

  const nodes = useMemo(
    () => (match ? pickCourses(match.gap, profile.inclusion) : []),
    [match, profile.inclusion],
  );

  const badges = useMemo(() => {
    const done = nodes.filter((n) => completedCourses.includes(n.courseSlug));
    const b: Array<{ label: string; icon: typeof Flag; earned: boolean }> = [];
    b.push({ label: 'First step', icon: Flag, earned: done.length >= 1 });
    b.push({ label: 'Halfway', icon: BadgeCheck, earned: nodes.length > 0 && done.length >= Math.ceil(nodes.length / 2) });
    const aiDone = done.some((n) => COURSE_MAP[n.courseSlug].skills.some((s) => AI_SLUGS.has(s)));
    b.push({ label: 'AI Explorer', icon: Sparkles, earned: aiDone });
    const greenDone = done.some((n) => COURSE_MAP[n.courseSlug].skills.some((s) => GREEN_SLUGS.has(s)));
    b.push({ label: 'Green Skill', icon: Trophy, earned: greenDone });
    b.push({ label: 'Path complete', icon: Award, earned: nodes.length > 0 && done.length === nodes.length });
    return b;
  }, [nodes, completedCourses]);

  if (!role || !match) {
    return (
      <Card className="text-center">
        <CardContent className="py-12">
          <p className="mb-4 text-muted-foreground">{t('sdg.notchosen')}</p>
          <Button onClick={() => setDashTab('matches')} className="bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500">
            {t('tab.matches')} →
          </Button>
        </CardContent>
      </Card>
    );
  }

  const doneCount = nodes.filter((n) => completedCourses.includes(n.courseSlug)).length;
  const firstIncomplete = nodes.findIndex((n) => !completedCourses.includes(n.courseSlug));
  const inclusionNeeds = Object.entries(profile.inclusion)
    .filter(([k, v]) => v && k !== 'none')
    .map(([k]) => t(`inclusion.${k}`));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t('pw.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {role.title} · {t('pw.subtitle')}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {doneCount}/{nodes.length} · {match.pathwayWeeks} {t('pw.weeks')}
        </Badge>
      </div>

      {/* Progress + badges */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{t('pw.progress')}</span>
            <Progress value={nodes.length ? (doneCount / nodes.length) * 100 : 0} className="h-2 flex-1" aria-label={t('pw.progress')} />
            <span className="text-sm tabular-nums text-muted-foreground">{Math.round(nodes.length ? (doneCount / nodes.length) * 100 : 0)}%</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{t('pw.badges')}:</span>
            {badges.map((b) => (
              <Badge
                key={b.label}
                variant={b.earned ? 'default' : 'outline'}
                className={`gap-1 ${b.earned ? 'bg-teal-700 text-white dark:bg-teal-600' : 'text-muted-foreground'}`}
              >
                <b.icon className="h-3 w-3" aria-hidden />
                {b.label}
              </Badge>
            ))}
          </div>
          {inclusionNeeds.length > 0 && (
            <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
              {t('pw.access.note', { needs: inclusionNeeds.join(' · ') })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Duolingo-style path */}
      <div className="relative mx-auto max-w-xl">
        <div className="absolute bottom-8 left-1/2 top-8 w-1 -translate-x-1/2 rounded bg-gradient-to-b from-teal-300 via-teal-200 to-emerald-200 dark:from-teal-800 dark:via-teal-900 dark:to-emerald-900" aria-hidden />
        <ol className="relative space-y-4">
          {nodes.map((n, i) => {
            const course = COURSE_MAP[n.courseSlug];
            const done = completedCourses.includes(n.courseSlug);
            const next = i === firstIncomplete;
            const locked = !done && !next;
            const state = done ? 'done' : next ? 'next' : 'locked';
            return (
              <li key={n.courseSlug} className="flex justify-center">
                <Card
                  className={`w-full max-w-md transition-shadow ${
                    state === 'next'
                      ? 'border-teal-500 shadow-lg shadow-teal-100 dark:shadow-teal-950'
                      : state === 'locked'
                        ? 'opacity-70'
                        : 'border-emerald-400'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        className={
                          state === 'done'
                            ? 'gap-1 bg-emerald-600 text-white'
                            : state === 'next'
                              ? 'gap-1 bg-teal-600 text-white'
                              : 'gap-1 text-muted-foreground'
                        }
                        variant={state === 'locked' ? 'outline' : 'default'}
                      >
                        {state === 'done' ? <Check className="h-3 w-3" aria-hidden /> : state === 'locked' ? <Lock className="h-3 w-3" aria-hidden /> : <BookOpen className="h-3 w-3" aria-hidden />}
                        {state === 'done' ? t('pw.done') : state === 'locked' ? t('pw.locked') : t('pw.available')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {t('pw.week', { n: n.startWeek })} · {t('pw.hours', { n: course.totalHours })}
                      </span>
                    </div>
                    <CardTitle className="mt-1 text-base">{course.title}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-1.5">
                      <span>{course.provider}</span>
                      {course.free && <Badge variant="secondary" className="text-[10px]">{t('pw.free')}</Badge>}
                      {course.hrdClaimable && (
                        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300">
                          {t('pw.hrd')}
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t('pw.youll', { outcome: course.outcome })}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {course.skills.map((s) => (
                        <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {s.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ROLE_MAP[role.slug].sdgTags.slice(0, 3).map((g) => (
                          <SdgBadge key={g} goal={g} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
                        >
                          {course.provider} <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                        {!locked && (
                          <Button
                            size="sm"
                            variant={done ? 'secondary' : 'outline'}
                            onClick={() => toggleCourse(n.courseSlug)}
                            className="h-7 gap-1 text-xs"
                          >
                            {!done && <Check className="h-3 w-3" aria-hidden />}
                            {done ? t('pw.done') : t('pw.mark')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}

          {/* Internship milestone */}
          {role.entryLevel && (
            <li className="flex justify-center">
              <Card className="w-full max-w-md border-dashed">
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="w-fit gap-1 border-amber-400 text-amber-700 dark:text-amber-300">
                    <Flag className="h-3 w-3" aria-hidden /> {t('pw.internship')}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {role.title} — {role.signalsNote}
                  </p>
                </CardContent>
              </Card>
            </li>
          )}
        </ol>
      </div>

      <div className="flex flex-wrap gap-2">
        <SourceChip href="https://www.freecodecamp.org/">freeCodeCamp</SourceChip>
        <SourceChip href="https://www.coursera.org/">Coursera (audit)</SourceChip>
        <SourceChip href="https://learn.deeplearning.ai/">DeepLearning.AI</SourceChip>
        <SourceChip href="https://elearning.fao.org/">FAO eLearning</SourceChip>
        <SourceChip href="https://hrdcorp.gov.my/">HRD Corp directory</SourceChip>
      </div>
    </div>
  );
}
