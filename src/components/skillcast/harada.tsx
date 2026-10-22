'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { buildHaradaPlan } from '@/lib/harada';
import type { HaradaTask } from '@/lib/harada';
import type { RoleMatch } from '@/lib/types';
import { useSkillCast } from '@/lib/store';
import { useSignals, useT } from './shared';

type TaskStatus = 'todo' | 'in_progress' | 'done';

// The middle cell is reserved for the goal or selected area.
const POSITIONS = [0, 1, 2, 3, -1, 4, 5, 6, 7];

export function HaradaTab({ matches }: { matches: RoleMatch[] }) {
  const t = useT();
  const {
    chosenRole,
    profile,
    haradaTaskStatus,
    setHaradaTaskStatus,
    setProfile,
    setDashTab,
  } = useSkillCast();

  const { momentumMap } = useSignals();
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const plan = useMemo(
    () =>
      chosenRole
        ? buildHaradaPlan(profile, chosenRole, momentumMap)
        : null,
    [chosenRole, profile, momentumMap],
  );

  const statuses = haradaTaskStatus ?? {};
  const tasks = plan?.areas.flatMap((area) => area.tasks) ?? [];

  const statusOf = (task: HaradaTask): TaskStatus =>
    statuses[task.id] ?? 'todo';

  const summarize = (items: HaradaTask[]) => {
    const totalHours = items.reduce((sum, task) => sum + task.hours, 0);
    const doneHours = items.reduce(
      (sum, task) => sum + (statusOf(task) === 'done' ? task.hours : 0),
      0,
    );

    return {
      totalHours,
      remainingHours: totalHours - doneHours,
      percent: totalHours ? Math.round((doneHours / totalHours) * 100) : 0,
      doneCount: items.filter((task) => statusOf(task) === 'done').length,
    };
  };

  const summary = summarize(tasks);
  const weeklyHours =
    Number.isFinite(profile.budget) && profile.budget > 0
      ? profile.budget
      : 5;
  const weeks = Math.ceil(summary.remainingHours / weeklyHours);

  const area =
    plan?.areas.find((item) => item.id === selectedAreaId) ?? null;
  const selectedTask =
    area?.tasks.find((task) => task.id === selectedTaskId) ?? null;

  if (
    !plan ||
    !matches.some((match) => match.roleSlug === plan.roleSlug)
  ) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-muted-foreground">{t('sdg.notchosen')}</p>
          <Button onClick={() => setDashTab('matches')}>
            {t('tab.matches')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tileColor = (percent: number, started = false) => {
    if (percent === 100) {
      return 'border-emerald-500 bg-emerald-500/10';
    }
    if (percent > 0 || started) {
      return 'border-amber-500 bg-amber-500/10';
    }
    return 'border-border bg-card hover:border-teal-500';
  };

  const statusLabel = (status: TaskStatus) => {
    if (status === 'done') return 'Completed';
    if (status === 'in_progress') return 'In progress';
    return 'Not started';
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">My Harada career map</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One career goal · Eight development areas · 64 actions
        </p>
      </div>

      {profile.objective && (
        <p className="rounded-xl border bg-muted/30 p-4 text-sm">
          Your objective: {profile.objective}
        </p>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{plan.title}</p>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {summary.doneCount}/{tasks.length} actions completed
                {' · '}
                {summary.remainingHours} estimated hours remaining
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              Hours per week
              <select
                value={weeklyHours}
                onChange={(event) =>
                  setProfile({ budget: Number(event.target.value) })
                }
                className="rounded-md border bg-background px-2 py-1.5"
              >
                {[...new Set([1, 2, 3, 5, 8, 10, 15, 20, weeklyHours])]
                  .sort((a, b) => a - b)
                  .map((hours) => (
                    <option key={hours} value={hours}>
                      {hours}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Progress
              value={summary.percent}
              className="h-2 flex-1"
              aria-label="Harada learning progress"
            />
            <span className="text-sm tabular-nums">
              {summary.percent}%
            </span>
          </div>

          <p className="text-sm" aria-live="polite">
            {weeks === 0
              ? 'All planned actions are completed.'
              : `Estimated remaining learning time: about ${weeks} weeks.`}
          </p>

          <p className="text-xs text-muted-foreground">
            Preliminary action estimates, assuming a steady weekly pace.
            Full course durations are not included. Completion is
            self-reported and does not certify proficiency or guarantee a job.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">
          {area ? area.title : 'Choose a development area'}
        </h3>

        {area && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedAreaId(null);
              setSelectedTaskId(null);
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to goal
          </Button>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[510px] grid-cols-3 gap-3">
          {POSITIONS.map((index, position) => {
            if (index === -1) {
              return (
                <div
                  key="center"
                  className="flex min-h-36 flex-col items-center justify-center rounded-xl border-2 border-teal-500 bg-teal-500/10 p-4 text-center"
                >
                  <Target
                    className="mb-2 h-6 w-6 text-teal-600 dark:text-teal-400"
                    aria-hidden
                  />
                  <span className="mb-1 text-xs text-muted-foreground">
                    {area ? 'Development area' : 'Career goal'}
                  </span>
                  <p className="font-semibold">
                    {area?.title ?? plan.title}
                  </p>
                </div>
              );
            }

            if (area) {
              const task = area.tasks[index];
              const status = statusOf(task);

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                  aria-pressed={selectedTaskId === task.id}
                  className={`min-h-36 rounded-xl border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 ${
                    tileColor(
                      status === 'done' ? 100 : 0,
                      status === 'in_progress',
                    )
                  } ${
                    selectedTaskId === task.id
                      ? 'ring-2 ring-teal-500'
                      : ''
                  }`}
                >
                  <span className="text-xs text-muted-foreground">
                    Action {index + 1}
                  </span>
                  <p className="my-2 text-sm font-semibold">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.hours}h · {statusLabel(status)}
                  </p>
                </button>
              );
            }

            const item = plan.areas[index];
            const progress = summarize(item.tasks);
            const started = item.tasks.some(
              (task) => statusOf(task) === 'in_progress',
            );

            return (
              <button
                key={`${position}:${item.id}`}
                type="button"
                onClick={() => {
                  setSelectedAreaId(item.id);
                  setSelectedTaskId(null);
                }}
                className={`min-h-36 rounded-xl border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 ${
                  tileColor(progress.percent, started)
                }`}
              >
                <span className="text-xs text-muted-foreground">
                  Area {index + 1}
                </span>
                <p className="my-2 text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {progress.doneCount}/8 actions · {progress.percent}%
                </p>
                {item.alreadyMeetsRequirements && (
                  <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                    Profile meets the required level · Extension activities
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {area && !selectedTask && (
        <p className="text-sm text-muted-foreground">
          Select an action to read the instructions and update its status.
        </p>
      )}

      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedTask.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedTask.description}
            </p>
            <p className="text-sm">
              Estimated effort: {selectedTask.hours} hours
            </p>

            <label className="flex flex-wrap items-center gap-3 text-sm">
              Status
              <select
                value={statusOf(selectedTask)}
                onChange={(event) =>
                  setHaradaTaskStatus(
                    selectedTask.id,
                    event.target.value as TaskStatus,
                  )
                }
                className="rounded-md border bg-background px-3 py-2"
              >
                <option value="todo">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="done">Completed</option>
              </select>
            </label>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Potential SDG contribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {plan.sdgTags.map((goal) => (
              <span
                key={goal}
                className="rounded-full border px-3 py-1 text-xs font-medium"
              >
                SDG {goal}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {plan.sdgExplanation}
          </p>
          <p className="text-xs text-muted-foreground">
            These links describe the target role. Completing learning
            activities alone does not demonstrate real-world SDG impact.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}