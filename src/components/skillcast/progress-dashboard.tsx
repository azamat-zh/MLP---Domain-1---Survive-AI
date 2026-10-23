'use client';

import { useMemo } from 'react';
import { Check, Clock3, ListChecks, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { COURSE_MAP } from '@/data/courses';
import { ROLE_MAP } from '@/data/roles';
import type { RoleMatch } from '@/lib/types';
import { useSkillCast } from '@/lib/store';
import { pickCourses } from './pathway';

export function ProgressDashboard({ matches }: { matches: RoleMatch[] }) {
  const { profile, chosenRole, completedCourses, setProfile, setDashTab } = useSkillCast();
  const role = chosenRole ? ROLE_MAP[chosenRole] : null;
  const match = matches.find((item) => item.roleSlug === chosenRole) ?? null;
  const roadmap = useMemo(() => match ? pickCourses(match.gap, profile.inclusion) : [], [match, profile.inclusion]);
  const completedRoadmap = roadmap.filter((item) => completedCourses.includes(item.courseSlug));
  const completedHours = completedRoadmap.reduce((sum, item) => sum + (COURSE_MAP[item.courseSlug]?.totalHours ?? 0), 0);
  const weeklyHours = Math.min(25, Math.max(0, Number(profile.weeklyHoursCompleted ?? 0)));
  const tasks = profile.completedRoadmapTasks ?? [];
  const toggleTask = (id: string) => setProfile({ completedRoadmapTasks: tasks.includes(id) ? tasks.filter((item) => item !== id) : [...tasks, id] });
  const gaps = (match?.gap ?? []).slice(0, 5);
  const completedMilestones = gaps.filter((gap) => tasks.includes(`${chosenRole}:${gap.skill}`)).length;
  const haradaEntries = Object.entries(profile.haradaTaskStatuses ?? {}).filter(([key]) => key.startsWith(`${chosenRole}:`));
  const haradaComplete = haradaEntries.filter(([, status]) => status === 'completed').length;
  const haradaInProgress = haradaEntries.filter(([, status]) => status === 'in-progress').length;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Progress Dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Track learning, role skill milestones, and your next actions{role ? ` toward ${role.title}` : ''}.</p>
        </div>
        <Badge variant="outline" className="border-blue-200 text-blue-700"><Target className="mr-1 h-3.5 w-3.5" aria-hidden />{profile.budget} hours/week goal</Badge>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-100 bg-white"><CardHeader className="pb-2"><CardDescription>Learning roadmap</CardDescription><CardTitle className="text-2xl text-slate-900">{completedRoadmap.length}/{roadmap.length}</CardTitle></CardHeader><CardContent><Progress value={roadmap.length ? completedRoadmap.length / roadmap.length * 100 : 0} aria-label="Course completion"/><p className="mt-2 text-xs text-slate-500">Curated course milestones completed</p></CardContent></Card>
        <Card className="border-blue-100 bg-white"><CardHeader className="pb-2"><CardDescription>Learning time</CardDescription><CardTitle className="flex items-center gap-2 text-2xl text-slate-900"><Clock3 className="h-5 w-5 text-blue-600" aria-hidden />{completedHours} course hours</CardTitle></CardHeader><CardContent><p className="text-xs text-slate-500">Total estimated hours in courses you marked complete.</p></CardContent></Card>
        <Card className="border-blue-100 bg-white"><CardHeader className="pb-2"><CardDescription>This week · self-reported</CardDescription><CardTitle className="text-base text-slate-900">Hours learned</CardTitle></CardHeader><CardContent className="flex items-center gap-3"><Input type="number" min={0} max={168} value={profile.weeklyHoursCompleted ?? 0} onChange={(event) => setProfile({ weeklyHoursCompleted: Math.min(168, Math.max(0, Number(event.target.value) || 0)) })} className="h-10 max-w-28 border-blue-100" aria-label="Learning hours completed this week"/><span className="text-sm text-slate-600">of {profile.budget} goal</span></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-blue-100 bg-white">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base text-slate-900"><ListChecks className="h-5 w-5 text-blue-600" aria-hidden />Role skill milestones</CardTitle><CardDescription>Milestones are saved locally and shared with your Harada roadmap.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {!role || gaps.length === 0 ? <p className="text-sm text-slate-500">Choose a career match to create skill milestones.</p> : <>
              <Progress value={gaps.length ? completedMilestones / gaps.length * 100 : 0} aria-label="Skill milestone completion" />
              <ul className="space-y-2">{gaps.map((gap) => {
                const id = `${chosenRole}:${gap.skill}`;
                const done = tasks.includes(id);
                return <li key={id} className="flex items-center gap-3 rounded-xl border border-blue-100 p-3"><button type="button" aria-pressed={done} onClick={() => toggleTask(id)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${done ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-200 text-transparent hover:border-blue-500'}`} aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${gap.skillName}`}>{done && <Check className="h-4 w-4" aria-hidden />}</button><span className={`flex-1 text-sm ${done ? 'text-slate-500 line-through' : 'font-medium text-slate-800'}`}>{gap.skillName}<span className="mt-0.5 block text-xs font-normal text-slate-500">Current {gap.userLevel}/5 · target {gap.minLevel}/5</span></span><Badge variant="outline" className="border-blue-100 text-blue-700">{done ? 'Complete' : 'Upcoming'}</Badge></li>;
              })}</ul>
            </>}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3"><p className="text-sm font-semibold text-slate-800">Harada Open Window tasks</p><p className="mt-1 text-xs text-slate-600">{haradaComplete} completed · {haradaInProgress} in progress · saved locally for this career.</p><Button variant="link" onClick={() => setDashTab('harada')} className="h-auto p-0 pt-1 text-blue-700">Continue roadmap</Button></div>
            <Button variant="outline" onClick={() => setDashTab('harada')} className="border-blue-200 text-blue-700">Open Harada roadmap</Button>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white">
          <CardHeader><CardTitle className="text-base text-slate-900">Course milestones</CardTitle><CardDescription>Course completion and upcoming learning steps from your pathway.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {!roadmap.length ? <p className="text-sm text-slate-500">Choose a career match with mapped skill gaps to build a course pathway.</p> : roadmap.map((item) => {
              const course = COURSE_MAP[item.courseSlug];
              const done = completedCourses.includes(item.courseSlug);
              return <div key={item.courseSlug} className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 p-3"><div><p className="text-sm font-medium text-slate-800">{course.title}</p><p className="mt-1 text-xs text-slate-500">{course.totalHours} hours · estimated week {item.startWeek} · {course.provider}</p></div><Badge variant={done ? 'default' : 'outline'} className={done ? 'bg-blue-600' : 'border-blue-200 text-blue-700'}>{done ? 'Complete' : 'Upcoming'}</Badge></div>;
            })}
            <Button variant="outline" onClick={() => setDashTab('pathway')} className="mt-2 border-blue-200 text-blue-700">Open learning pathway</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100 bg-white">
        <CardHeader><CardTitle className="text-base text-slate-900">Weekly reflection</CardTitle><CardDescription>Save a private note in this browser about what you learned and your next action.</CardDescription></CardHeader>
        <CardContent><Textarea value={profile.weeklyReflection ?? ''} maxLength={1000} onChange={(event) => setProfile({ weeklyReflection: event.target.value })} placeholder="What moved forward this week? What will you try next?" className="min-h-28 border-blue-100"/><p className="mt-1 text-right text-xs text-slate-500">{(profile.weeklyReflection ?? '').length}/1000</p></CardContent>
      </Card>
    </div>
  );
}
