'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Check, Clock3, Compass, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COURSES } from '@/data/courses';
import { ROLES, ROLE_MAP } from '@/data/roles';
import { ADJACENCY_MAP, SKILL_MAP } from '@/data/skills';
import { haradaMatrix } from '@/lib/matching';
import type { RoleMatch } from '@/lib/types';
import { useSkillCast } from '@/lib/store';
import { LevelDots, MomentumPill, useSignals, useT } from './shared';

const TASKS = [
  { title: 'Map the foundations', hours: 1, describe: (skill: string, role: string) => `List the main ideas behind ${skill} and where they appear in ${role}.` },
  { title: 'Study a guided resource', hours: 2, describe: (skill: string, course?: string) => course ? `Work through ${course} and note the parts that build ${skill}.` : `Use a trusted beginner resource to learn the core concepts of ${skill}.` },
  { title: 'Practice the core technique', hours: 2, describe: (skill: string) => `Complete a short exercise using one core ${skill} technique.` },
  { title: 'Apply it to the target career', hours: 2, describe: (skill: string, role: string) => `Use ${skill} to work through a small, realistic task from ${role}.` },
  { title: 'Create a small work sample', hours: 3, describe: (skill: string, role: string) => `Create a brief work sample showing how you would use ${skill} in ${role}.` },
  { title: 'Check quality and responsible use', hours: 1, describe: (skill: string) => `Review your ${skill} work for accuracy, privacy, accessibility, and responsible practice.` },
  { title: 'Get feedback and identify a gap', hours: 1, describe: (skill: string) => `Ask a peer, mentor, or trusted reviewer to assess your ${skill} sample and name one gap.` },
  { title: 'Revise and reflect', hours: 1, describe: (skill: string) => `Revise the sample using feedback and record what you can now do with ${skill}.` },
] as const;
type TaskStatus = 'not-started' | 'in-progress' | 'completed';
const STATUS_LABELS: Record<TaskStatus, string> = { 'not-started': 'Not Started', 'in-progress': 'In Progress', completed: 'Completed' };

export function HaradaTab({ matches }: { matches: RoleMatch[] }) {
  const t = useT();
  const { chosenRole, profile, completedCourses, setProfile, setDashTab } = useSkillCast();
  const { momentumMap } = useSignals();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const match = useMemo(() => matches.find((item) => item.roleSlug === chosenRole) ?? null, [matches, chosenRole]);
  const role = chosenRole ? ROLE_MAP[chosenRole] : null;
  const matrix = useMemo(() => role ? haradaMatrix(profile, role.slug).map((row) => ({ ...row, momentum: momentumMap[row.skill] ?? 0 })) : [], [role, profile, momentumMap]);

  const roadmapSkills = useMemo(() => {
    if (!role) return [];
    const direct = matrix.map((row) => ({ ...row, target: row.required, relevance: (role.skills.find((item) => item.skill === row.skill)?.weight ?? 0) * (row.required - row.current + 1), supporting: false }))
      .sort((a, b) => b.relevance - a.relevance);
    const directSlugs = new Set(direct.map((row) => row.skill));
    const adjacent = new Map<string, { target: number; relevance: number }>();
    const addAdjacent = (baseWeight: number, slug: string, strength: number) => {
      if (directSlugs.has(slug)) return;
      if (!SKILL_MAP[slug]) return;
      const requirements = ROLES.flatMap((relatedRole) => relatedRole.skills.filter((req) => req.skill === slug));
      const relevance = strength * baseWeight * (requirements.length ? 1.15 : 1);
      const prior = adjacent.get(slug);
      adjacent.set(slug, { target: requirements.length ? Math.max(...requirements.map((req) => req.minLevel)) : 2, relevance: (prior?.relevance ?? 0) + relevance });
    };
    role.skills.forEach((base) => Object.entries(ADJACENCY_MAP[base.skill] ?? {}).forEach(([neighbor, strength]) => {
      addAdjacent(base.weight, neighbor, strength);
      Object.entries(ADJACENCY_MAP[neighbor] ?? {}).forEach(([secondHop, secondStrength]) => {
        if (secondHop !== base.skill) addAdjacent(base.weight, secondHop, strength * secondStrength * 0.6);
      });
    }));
    const supporting = [...adjacent.entries()].map(([slug, item]) => ({
      skill: slug,
      name: SKILL_MAP[slug].name,
      current: profile.skills[slug] ?? 0,
      required: item.target,
      target: item.target,
      category: SKILL_MAP[slug].category,
      momentum: momentumMap[slug] ?? SKILL_MAP[slug].seedMomentum,
      relevance: item.relevance * Math.max(0.25, item.target - (profile.skills[slug] ?? 0)),
      supporting: true,
    })).sort((a, b) => b.relevance - a.relevance);
    return [...direct.slice(0, 8), ...supporting].slice(0, 8);
  }, [role, matrix, profile.skills, momentumMap]);

  const statuses = profile.haradaTaskStatuses ?? {};
  const taskKey = (skill: string, index: number) => `${role?.slug}:${skill}:${index}`;
  const roadmapTaskEntries = roadmapSkills.flatMap((skill) => TASKS.map((task, index) => ({ skill, task, index, status: statuses[taskKey(skill.skill, index)] ?? 'not-started' as TaskStatus })));
  const completedCount = roadmapTaskEntries.filter((item) => item.status === 'completed').length;
  const inProgressCount = roadmapTaskEntries.filter((item) => item.status === 'in-progress').length;
  const totalHours = roadmapTaskEntries.reduce((sum, item) => sum + item.task.hours, 0);
  const remainingHours = roadmapTaskEntries.filter((item) => item.status !== 'completed').reduce((sum, item) => sum + item.task.hours, 0);
  const weeklyHours = Math.max(1, profile.budget || 1);
  const weeksRemaining = Math.ceil(remainingHours / weeklyHours);
  const selected = roadmapSkills.find((item) => item.skill === selectedSkill) ?? roadmapSkills[0];
  const selectedCourses = selected ? COURSES.filter((course) => course.skills.includes(selected.skill)).slice(0, 3) : [];
  const targetTaskCount = roadmapSkills.filter((skill) => TASKS.every((_, index) => statuses[taskKey(skill.skill, index)] === 'completed')).length;
  const completedRoadmapTasks = profile.completedRoadmapTasks ?? [];

  const setTaskStatus = (skill: string, index: number, status: TaskStatus) => {
    const key = taskKey(skill, index);
    const nextStatuses = { ...statuses, [key]: status };
    const allDone = TASKS.every((_, taskIndex) => nextStatuses[taskKey(skill, taskIndex)] === 'completed');
    const milestone = `${role?.slug}:${skill}`;
    const nextMilestones = allDone
      ? [...new Set([...completedRoadmapTasks, milestone])]
      : completedRoadmapTasks.filter((item) => item !== milestone);
    setProfile({ haradaTaskStatuses: nextStatuses, completedRoadmapTasks: nextMilestones });
  };

  if (!role || !match) {
    return <Card className="border-blue-100 dark:border-slate-700 text-center"><CardContent className="py-12 text-slate-600">{t('sdg.notchosen')}<Button className="ml-3 bg-blue-600 text-white hover:bg-blue-700" onClick={() => setDashTab('matches')}>{t('tab.matches')}</Button></CardContent></Card>;
  }

  const vision = `Build toward ${role.title} by strengthening ${match.gap.length ? `${match.gap.length} priority skill gaps, starting with ${roadmapSkills[0]?.name ?? 'your role skills'}` : 'the skills required for your selected career'}. At ${profile.budget} learning hours per week, this Open Window plan has about ${weeksRemaining} weeks remaining based on its task estimates.`;
  const selectedCompleted = selected ? TASKS.filter((_, index) => statuses[taskKey(selected.skill, index)] === 'completed').length : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-100 dark:border-slate-700 bg-white"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base text-slate-900"><Target className="h-5 w-5 text-blue-600" aria-hidden />Objective (yours)</CardTitle></CardHeader><CardContent><p className="rounded-xl bg-blue-50/70 p-4 text-sm text-slate-700">{profile.objective || profile.extended?.aiGoal || `Develop toward ${role.title}`}</p></CardContent></Card>
        <Card className="border-blue-100 dark:border-slate-700 bg-white"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base text-slate-900"><Compass className="h-5 w-5 text-indigo-600" aria-hidden />1-year vision</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600">{vision}</p><Badge variant="outline" className="mt-3 border-blue-200 text-blue-700">Harada Method · Open Window 64</Badge></CardContent></Card>
      </div>

      <Card className="border-blue-100 dark:border-slate-700 bg-white">
        <CardHeader className="pb-3"><CardTitle className="text-lg text-slate-900">Harada Method Roadmap · Open Window 64</CardTitle><CardDescription>Eight role skills, each developed through eight practical tasks. Select a skill to open its task plan.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">Direct skills use the selected role&apos;s required level. Adjacent supporting skills use a level 2 foundation target unless another role defines a requirement.</p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Open Window 64 skill roadmap">
            {Array.from({ length: 9 }, (_, index) => {
              if (index === 4) return <div key="career-goal" className="flex min-h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-3 text-center text-sm font-semibold text-white shadow-sm sm:min-h-36">{profile.objective || role.title}</div>;
              const cellIndex = index < 4 ? index : index - 1;
              const skill = roadmapSkills[cellIndex];
              if (!skill) return <div key={`empty-${index}`} className="min-h-28 rounded-2xl border border-dashed border-transparent bg-transparent sm:min-h-36" aria-hidden />;
              const active = selected?.skill === skill.skill;
              const done = TASKS.filter((_, taskIndex) => statuses[taskKey(skill.skill, taskIndex)] === 'completed').length;
              return <button key={skill.skill} type="button" aria-pressed={active} onClick={() => setSelectedSkill(skill.skill)} className={`min-h-28 min-w-0 overflow-hidden rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-36 sm:p-4 ${active ? 'border-blue-500 dark:border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-400 dark:bg-blue-950/40 dark:ring-blue-900' : cellIndex % 2 ? 'border-violet-100 bg-violet-50/60 hover:border-violet-300 dark:border-violet-800 dark:bg-violet-950/30 dark:hover:border-violet-600' : 'border-blue-100 dark:border-slate-700 bg-blue-50/60 hover:border-blue-300 dark:hover:border-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:border-blue-600'}`}><span className="line-clamp-2 block text-xs font-semibold leading-5 text-slate-900 sm:text-sm">{skill.name}</span><span className="mt-2 block text-[11px] text-slate-600 sm:text-xs">{skill.current} → {skill.target}</span><span className="mt-1 block text-[11px] text-blue-700 sm:text-xs">{done}/8 tasks</span></button>;
            })}
          </div>

          <div className="rounded-2xl border border-blue-100 dark:border-slate-700 bg-blue-50/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{selected?.name ?? 'Select a skill'}</h3><p className="mt-1 text-sm text-slate-600">{selected ? `${selected.current}/5 current · ${selected.target}/5 target · ${selected.category}` : 'No role skills are available.'}</p></div>{selected && <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">{selectedCompleted}/8 completed</Badge>}</div>
            {selected && <ol className="mt-4 space-y-2">{TASKS.map((task, index) => {
              const status = statuses[taskKey(selected.skill, index)] ?? 'not-started';
              const courseTitle = COURSES.find((course) => course.skills.includes(selected.skill))?.title;
              const description = task.describe(selected.name, index === 1 ? courseTitle ?? 'a guided course' : role.title);
              return <li key={task.title} className="grid gap-3 rounded-xl border border-blue-100 dark:border-slate-700 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="text-sm font-semibold text-slate-900">{index + 1}. {task.title}</p><p className="mt-1 text-sm leading-5 text-slate-600">{description}</p><span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3 w-3" aria-hidden />{task.hours} estimated {task.hours === 1 ? 'hour' : 'hours'}</span></div><Select value={status} onValueChange={(value) => setTaskStatus(selected.skill, index, value as TaskStatus)}><SelectTrigger className="h-10 w-full border-blue-100 dark:border-slate-700 bg-white sm:w-40" aria-label={`${task.title} status`}><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(STATUS_LABELS) as TaskStatus[]).map((option) => <SelectItem key={option} value={option}>{STATUS_LABELS[option]}</SelectItem>)}</SelectContent></Select></li>;
            })}</ol>}
            <section className="mt-5 border-t border-blue-100 dark:border-slate-700 pt-4"><h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><BookOpen className="h-4 w-4 text-blue-600" aria-hidden />Relevant courses</h4><div className="mt-2 grid gap-2 sm:grid-cols-3">{selectedCourses.length ? selectedCourses.map((course) => <a key={course.slug} href={course.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-blue-100 dark:border-slate-700 bg-white p-3 text-sm transition hover:border-blue-300 dark:hover:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className="block font-medium text-slate-800">{course.title}</span><span className="mt-1 block text-xs text-slate-500">{course.provider} · {course.totalHours} hours</span></a>) : <p className="text-sm text-slate-600">No curated courses are directly mapped to this skill yet.</p>}</div></section>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100 dark:border-slate-700 bg-white"><CardHeader className="pb-2"><CardTitle className="text-base text-slate-900">Overall roadmap progress</CardTitle><CardDescription>Task estimates use the selected skills and your weekly learning budget.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap justify-between gap-2 text-sm text-slate-600"><span>{completedCount} completed</span><span>{inProgressCount} in progress</span><span>{roadmapTaskEntries.length} total tasks</span></div><Progress value={roadmapTaskEntries.length ? completedCount / roadmapTaskEntries.length * 100 : 0} aria-label="Harada roadmap completion"/><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="inline-flex items-center gap-1.5 text-slate-700"><Clock3 className="h-4 w-4 text-blue-600" aria-hidden />{remainingHours} estimated hours remaining</span><Badge variant="outline" className="border-blue-200 text-blue-700">About {weeksRemaining} weeks at {profile.budget} hrs/week</Badge><span className="text-xs text-slate-500">{targetTaskCount}/8 skills have all tasks completed · {totalHours} total estimated hours</span></div></CardContent></Card>

      <Card className="border-blue-100 dark:border-slate-700 bg-white"><CardHeader className="pb-2"><CardTitle className="text-base text-slate-900">Role Skill Profile</CardTitle><CardDescription>Current profile levels compared with the selected career&apos;s required skills and available momentum signals.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b text-left text-xs text-slate-500"><th className="pb-2 font-medium">Skill</th><th className="pb-2 font-medium">Current</th><th className="pb-2 font-medium">Required</th><th className="pb-2 font-medium">Skill Momentum</th><th className="pb-2 font-medium">Gap</th></tr></thead><tbody>{matrix.map((row) => { const gap = Math.max(0, row.required - row.current); return <tr key={row.skill} className="border-b last:border-0"><td className="py-2.5 pr-3"><span className="font-medium text-slate-900">{row.name}</span><span className="block text-xs text-slate-500">{row.category}</span></td><td className="py-2.5 pr-3"><LevelDots level={row.current}/></td><td className="py-2.5 pr-3"><LevelDots level={row.required} highlight={row.required}/></td><td className="py-2.5 pr-3"><MomentumPill momentum={row.momentum}/></td><td className="py-2.5">{gap ? <Badge variant="outline" className="border-blue-200 text-blue-700">+{gap}</Badge> : <Badge className="bg-blue-600 text-white"><Check className="mr-1 h-3 w-3" aria-hidden/>Ready</Badge>}</td></tr>; })}</tbody></table><p className="mt-3 text-xs text-slate-500">{completedCourses.length} pathway courses marked complete.</p></CardContent></Card>
    </div>
  );
}
