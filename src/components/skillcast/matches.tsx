'use client';

import { useMemo, useState } from 'react';
import { Bot, CircleCheck, Cpu, GitBranch, Sparkles, Sprout } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ROLE_MAP } from '@/data/roles';
import type { RoleMatch } from '@/lib/types';
import { useSkillCast } from '@/lib/store';
import { SdgBadge, useSignals, useT } from './shared';

// ─── Matches tab: the fork (work WITH AI / pivot / emerging) + explainable ──
// match cards with factor breakdown, gap list and the LLM narrator.

const FORKS = [
  { id: 'work-with-ai', labelKey: 'match.fork.work', descKey: 'match.fork.work.d', icon: Cpu },
  { id: 'pivot', labelKey: 'match.fork.pivot', descKey: 'match.fork.pivot.d', icon: GitBranch },
  { id: 'emerging', labelKey: 'match.fork.emerging', descKey: 'match.fork.emerging.d', icon: Sprout },
] as const;

export function MatchesTab({ matches }: { matches: RoleMatch[] }) {
  const t = useT();
  const { chosenRole } = useSkillCast();
  const [fork, setFork] = useState<(typeof FORKS)[number]['id']>(
    (ROLE_MAP[chosenRole ?? '']?.pathType as (typeof FORKS)[number]['id']) ?? 'work-with-ai',
  );

  const forkMatches = useMemo(
    () => matches.filter((m) => ROLE_MAP[m.roleSlug]?.pathType === fork).slice(0, 5),
    [matches, fork],
  );

  return (
    <div className="space-y-4">
      {/* Fork switcher */}
      <div role="radiogroup" aria-label={t('match.title')} className="grid gap-3 sm:grid-cols-3">
        {FORKS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={fork === f.id}
            onClick={() => setFork(f.id)}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
              fork === f.id
                ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-300 dark:border-teal-500 dark:bg-teal-950 dark:ring-teal-800'
                : 'border-border hover:border-teal-400'
            }`}
          >
            <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
            <span>
              <span className="block font-semibold">{t(f.labelKey)}</span>
              <span className="block text-sm text-muted-foreground">{t(f.descKey)}</span>
            </span>
          </button>
        ))}
      </div>

      <h2 className="text-lg font-semibold">{t('match.title')}</h2>

      {forkMatches.map((m) => (
        <MatchCard key={m.roleSlug} match={m} />
      ))}
    </div>
  );
}

function MatchCard({ match }: { match: RoleMatch }) {
  const t = useT();
  const { lang, scenario, chosenRole, setChosenRole, setDashTab } = useSkillCast();
  const { momentumMap } = useSignals();
  const role = ROLE_MAP[match.roleSlug];
  const isChosen = chosenRole === match.roleSlug;
  const [coach, setCoach] = useState<string | null>(null);
  const [coachFallback, setCoachFallback] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const demand = scenario === 'accelerated' ? match.demand.accelerated : match.demand.moderate;

  const askCoach = async () => {
    setCoachLoading(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleSlug: match.roleSlug,
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
        }),
      });
      const json = (await res.json()) as { narration?: string; fallback?: boolean };
      setCoach(json.narration ?? null);
      setCoachFallback(Boolean(json.fallback));
    } catch {
      setCoach(t('match.coach.fallback'));
      setCoachFallback(true);
    } finally {
      setCoachLoading(false);
    }
  };

  return (
    <Card className={isChosen ? 'border-teal-600 ring-1 ring-teal-300 dark:ring-teal-800' : ''}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              {role.title}
              {role.entryLevel && (
                <Badge variant="secondary" className="text-[11px]">{t('match.entrylevel')}</Badge>
              )}
              {isChosen && (
                <Badge className="gap-1 bg-teal-700 text-white dark:bg-teal-600">
                  <CircleCheck className="h-3 w-3" aria-hidden /> {t('match.chosen')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl">{role.tagline}</CardDescription>
          </div>
          {/* Score dial */}
          <div
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-4"
            style={{
              borderColor: match.score >= 65 ? '#059669' : match.score >= 45 ? '#d97706' : '#e11d48',
            }}
            role="img"
            aria-label={`${t('match.score')} ${match.score}/100`}
          >
            <span className="text-xl font-bold leading-none">{match.score}</span>
            <span className="text-[9px] text-muted-foreground">/100</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Factor breakdown */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            {t('match.why')}: <span className="font-normal">{t('match.formula')}</span>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {match.factors.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <span className="w-32 shrink-0 text-xs text-muted-foreground">{f.label}</span>
                <Progress value={Math.round(f.value * 100)} className="h-2 flex-1" aria-label={`${f.label}: ${Math.round(f.value * 100)}%`} />
                <span className="w-9 text-right text-xs font-medium tabular-nums">{Math.round(f.value * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Demand outlook */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{t('match.demand')}:</span>
          <Badge variant="outline" className="gap-1">
            {t('scenario.moderate')} {match.demand.moderate}
          </Badge>
          <Badge variant="outline" className="gap-1 border-amber-400 text-amber-700 dark:text-amber-300">
            {t('scenario.accelerated')} {match.demand.accelerated}
          </Badge>
          <span className="text-xs text-muted-foreground">{t('common.estimate')}</span>
        </div>

        {/* Gap list */}
        {match.gap.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('match.gap')}</p>
            <ul className="flex flex-wrap gap-1.5">
              {match.gap.slice(0, 4).map((g) => (
                <li key={g.skill} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs">
                  <span>{t('match.gapitem', { skill: g.skillName, cur: g.userLevel, req: g.minLevel })}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t('match.pathweeks', { n: match.pathwayWeeks })}
            </p>
          </div>
        )}

        {/* SDG chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">SDG:</span>
          {role.sdgTags.map((g) => (
            <SdgBadge key={g} goal={g} size="md" />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={isChosen ? 'secondary' : 'default'}
            className={isChosen ? '' : 'bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500'}
            onClick={() => {
              setChosenRole(match.roleSlug);
              setDashTab('pathway');
            }}
          >
            {isChosen ? t('match.viewpath') : t('match.choose')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void askCoach()} disabled={coachLoading} className="gap-2">
            <Bot className="h-4 w-4" aria-hidden />
            {coachLoading ? '…' : t('match.coach.title')}
          </Button>
        </div>

        {/* Coach narration */}
        {coach && (
          <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3 text-sm dark:border-violet-900 dark:bg-violet-950/30">
            <p className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
              <span>{coach}</span>
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {coachFallback ? t('match.coach.fallback') : t('match.coach.disclosure')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
