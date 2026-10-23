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
import { strategyPriority } from '@/lib/matching';
import { SdgBadge, useSignals, useT } from './shared';

// ─── Matches tab: the fork (work WITH AI / pivot / emerging) + explainable ──
// match cards with factor breakdown, gap list and the LLM narrator.

const FORKS = [
  { id: 'work-with-ai', labelKey: 'match.fork.work', descKey: 'match.fork.work.d', icon: Cpu },
  { id: 'pivot', labelKey: 'match.fork.pivot', descKey: 'match.fork.pivot.d', icon: GitBranch },
  { id: 'emerging', labelKey: 'match.fork.emerging', descKey: 'match.fork.emerging.d', icon: Sprout },
] as const;

function recommendationReason(roleSlug: string, profile: ReturnType<typeof useSkillCast.getState>['profile']): string {
  const role = ROLE_MAP[roleSlug];
  const details = profile.extended;
  const priority = strategyPriority(profile, roleSlug);
  switch (details?.careerStrategy) {
    case 'enhance': return priority === 0 ? `Prioritized because ${role.category} aligns with your current profession or field.` : priority === 1 ? 'Prioritized as a role that works with AI for your current-career strategy.' : 'Recommended by your profile compatibility as another career option.';
    case 'related-transition': return priority === 0 ? 'This is the target role you selected during onboarding.' : priority === 1 ? `This role shares the ${role.category} category with your selected target.` : priority === 2 ? 'Included as a pivot pathway, ranked by your profile compatibility.' : 'Recommended by your profile compatibility.';
    case 'new-field': return priority < 2 ? `Prioritized because it aligns with your selected ${details.newField} field.` : 'Recommended by your profile compatibility beyond your selected field.';
    case 'ai-skills': return priority === 0 ? 'This role requires the AI skill you selected during onboarding.' : priority === 1 ? 'Prioritized as an AI or governance career pathway.' : 'Recommended by your profile compatibility.';
    default: return 'Recommended from your skill readiness, interests, experience, and available work-preference data.';
  }
}

export function MatchesTab({ matches }: { matches: RoleMatch[] }) {
  const t = useT();
  const { chosenRole, profile } = useSkillCast();
  const strategy = profile.extended?.careerStrategy;
  const defaultFork = strategy === 'enhance' ? 'work-with-ai'
    : strategy === 'related-transition' ? 'pivot'
      : strategy === 'new-field' || strategy === 'ai-skills' ? ROLE_MAP[matches[0]?.roleSlug ?? '']?.pathType ?? 'work-with-ai'
        : ROLE_MAP[chosenRole ?? '']?.pathType ?? 'work-with-ai';
  const [fork, setFork] = useState<(typeof FORKS)[number]['id']>(
    defaultFork,
  );

  const forkMatches = useMemo(
    () => matches.filter((m) => ROLE_MAP[m.roleSlug]?.pathType === fork).slice(0, 6),
    [matches, fork],
  );

console.log('All matches:', matches);
console.log('Selected fork:', fork);
console.log('Filtered matches:', forkMatches);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
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
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                : 'border-blue-100 bg-white hover:border-blue-300'
            }`}
          >
            <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden />
            <span>
              <span className="block font-semibold">{t(f.labelKey)}</span>
              <span className="block text-sm text-muted-foreground">{t(f.descKey)}</span>
            </span>
          </button>
        ))}
      </div>

      <h2 className="text-lg font-semibold">{t('match.title')}</h2>

      <div className="flex w-full min-w-0 flex-col gap-4">
        {forkMatches.map((m) => <MatchCard key={m.roleSlug} match={m} />)}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: RoleMatch }) {
  const t = useT();
  const { lang, scenario, chosenRole, setChosenRole, setDashTab, profile } = useSkillCast();
  const { momentumMap } = useSignals();
  const role = ROLE_MAP[match.roleSlug];
  const isChosen = chosenRole === match.roleSlug;
  const [coach, setCoach] = useState<string | null>(null);
  const [coachFallback, setCoachFallback] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const demand = scenario === 'accelerated' ? match.demand.accelerated : match.demand.moderate;
  const currentSkills = match.matchingSkills;
  const exposure = role.automationExposure < 0.3 ? 'Lower' : role.automationExposure < 0.6 ? 'Moderate' : 'Higher';

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

  const pathLabel = role.pathType === 'work-with-ai' ? 'Work with AI' : role.pathType === 'pivot' ? 'Pivot to another career' : 'Emerging opportunities';
  const factorLabels: Record<string, string> = { Skills: 'Skills', Interests: 'Interests', Experience: 'Experience', 'Work preferences': 'Work Preferences' };

  return (
    <Card className={`w-full min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm ${isChosen ? 'border-blue-500 ring-1 ring-blue-200' : 'border-blue-100'}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-xl text-slate-900">
              {role.title}
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{role.category}</Badge>
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">{pathLabel}</Badge>
              {role.entryLevel && <Badge variant="secondary" className="text-[11px]">{t('match.entrylevel')}</Badge>}
              {isChosen && <Badge className="gap-1 bg-blue-600 text-white"><CircleCheck className="h-3 w-3" aria-hidden />{t('match.chosen')}</Badge>}
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-relaxed">{role.tagline}</CardDescription>
          </div>
          <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-[1.75rem] border border-blue-200 bg-blue-50 text-blue-800 shadow-sm sm:h-28 sm:w-28" role="img" aria-label={`${t('match.score')} ${match.score}%`}>
            <span className="text-3xl font-bold leading-none tracking-tight sm:text-4xl">{match.score}%</span>
            <span className="mt-2 text-sm font-medium tracking-wide">match</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <section aria-label="Current readiness" className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-sm font-semibold text-slate-900">Current Readiness</p><p className="text-xs text-slate-600">Skills needed for this role</p></div>
            <span className="text-lg font-bold tabular-nums text-blue-700">{match.skillReadiness}%</span>
          </div>
          <Progress value={match.skillReadiness} className="mt-2 h-2.5" aria-label={`Skill readiness ${match.skillReadiness}%`} />
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {match.factors.map((factor) => <div key={factor.label} className="rounded-lg border border-blue-100/80 bg-white/80 px-3 py-2 text-center"><p className="text-[11px] text-slate-500">{factorLabels[factor.label] ?? factor.label}</p><p className="text-sm font-semibold tabular-nums text-slate-800">{Math.round(factor.value * 100)}%</p></div>)}
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-xl border border-blue-100 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Matching Skills</h3>
            {currentSkills.length ? <ul className="mt-3 space-y-2">{currentSkills.map((item) => <li key={item.skill} className="flex items-center justify-between gap-3 rounded-lg bg-blue-50/70 px-3 py-2 text-sm"><span className="font-medium text-slate-800">{item.skillName}</span><span className="shrink-0 text-xs text-slate-600">{item.userLevel}/5 current · {item.requiredLevel} required</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-600">No mapped role skills selected yet.</p>}
          </section>
          <section className="rounded-xl border border-indigo-100 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Skills to Build</h3>
            {match.missingSkills.length ? <ul className="mt-3 space-y-2">{match.missingSkills.slice(0, 5).map((gap) => <li key={gap.skill} className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50/60 px-3 py-2 text-sm"><span className="font-medium text-slate-800">{gap.skillName}</span><span className="shrink-0 text-xs text-slate-600">{gap.userLevel}/5 current · {gap.minLevel} required</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Your current levels meet the mapped requirements for this role.</p>}
          </section>
        </div>

        <section className="rounded-xl border border-blue-100 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Career Outlook</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-700">Market Outlook</span><Badge variant="outline" className="border-blue-200 bg-white text-blue-700">{scenario === 'accelerated' ? 'Fast adoption' : 'Moderate adoption'}</Badge></div>
              <p className="mt-2 text-xl font-bold text-blue-700">{demand}<span className="text-sm font-medium text-slate-500">/100</span></p>
              <p className="mt-1 text-[11px] text-slate-500">{t('common.estimate')} from existing SkillCast data; not a guaranteed forecast.</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-700">AI Task Exposure</span><Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700">{exposure}</Badge></div>
              <p className="mt-2 text-xl font-bold text-indigo-700">{Math.round(role.automationExposure * 100)}%</p>
              <p className="mt-1 text-[11px] text-slate-500">Task exposure only; it is not a probability of job replacement.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-blue-100 p-4">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">UN Sustainable Development Goals</h3>{role.sdgTags.map((goal) => <SdgBadge key={goal} goal={goal} size="md" />)}</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{role.sdgMechanism}</p>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-blue-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <details className="min-w-0 flex-1 rounded-lg">
            <summary className="cursor-pointer text-sm font-semibold text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Why this match?</summary>
            <div className="mt-3 space-y-3 border-t border-blue-50 pt-3 text-sm text-slate-600">
              <p>{recommendationReason(role.slug, profile)} The compatibility score uses your saved profile and this role&apos;s requirements. Skill readiness is shown separately.</p>
              <p className="font-medium text-slate-700">Score breakdown · {t('match.formula')}</p>
              <ul className="grid gap-2 sm:grid-cols-2">{match.factors.map((factor) => <li key={factor.label} className="rounded-lg bg-blue-50/60 p-2"><strong className="text-slate-800">{factorLabels[factor.label] ?? factor.label} ({Math.round(factor.weight * 100)}% weight):</strong> {Math.round(factor.value * 100)}% factor value{factor.label === 'Skills' ? ` · ${currentSkills.length} of ${role.skills.length} required skills selected; readiness ${match.skillReadiness}%` : factor.label === 'Experience' ? ` · ${profile.years} years recorded` : factor.label === 'Interests' ? ` · ${profile.interests.length ? profile.interests.join(', ') : 'no interests selected'}` : ` · ${profile.extended?.workPreferences?.filter((preference) => preference !== 'none').length ? 'preferences are saved; role accommodation fit is unavailable, so this factor is neutral' : 'no additional preferences selected; this factor is neutral'}`}</li>)}</ul>
              <p>Market outlook values are estimates from existing SkillCast data. AI task exposure describes potential task change, not employment or replacement probability.</p>
              <Button size="sm" variant="outline" onClick={() => void askCoach()} disabled={coachLoading} className="gap-2"><Bot className="h-4 w-4" aria-hidden />{coachLoading ? '…' : t('match.coach.title')}</Button>
              {coach && <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3"><p className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden /><span>{coach}</span></p><p className="mt-2 text-[11px] text-muted-foreground">{coachFallback ? t('match.coach.fallback') : t('match.coach.disclosure')}</p></div>}
            </div>
          </details>
          <Button size="sm" className="shrink-0 bg-green-600 text-white hover:bg-green-700" onClick={() => { setChosenRole(match.roleSlug); setDashTab('pathway'); }}>
            {isChosen ? t('match.viewpath') : 'Explore Roadmap'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
