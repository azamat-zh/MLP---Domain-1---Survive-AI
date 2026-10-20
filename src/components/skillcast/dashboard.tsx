'use client';

import { useMemo, useState } from 'react';
import {
  RefreshCw,
  Activity,
  Mail,
  RadioTower,
  ScrollText,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SKILL_MAP } from '@/data/skills';
import { ROLE_MAP } from '@/data/roles';
import { COURSE_MAP } from '@/data/courses';
import { useSkillCast } from '@/lib/store';
import { matchAll } from '@/lib/matching';
import { MomentumPill, SourceChip, TrendArrow, useSignals, useT } from './shared';
import { MatchesTab } from './matches';
import { PathwayTab } from './pathway';
import { HaradaTab } from './harada';
import { SdgTab } from './sdgview';
import { DemandTab } from './demand';

export function Dashboard() {
  const t = useT();
  const { scenario, setScenario, profile, chosenRole, dashTab, setDashTab } = useSkillCast();
  const { momentumMap } = useSignals();

  const matches = useMemo(() => matchAll(profile, momentumMap), [profile, momentumMap]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* Greeting + scenario toggle */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('dash.hello')}</h1>
          <p className="text-sm text-muted-foreground">{t('scenario.note')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{t('dash.scenario')}:</span>
          <div className="inline-flex rounded-lg border border-border p-0.5" role="radiogroup" aria-label={t('dash.scenario')}>
            <button
              type="button"
              role="radio"
              aria-checked={scenario === 'moderate'}
              onClick={() => setScenario('moderate')}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                scenario === 'moderate' ? 'bg-foreground text-background font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('scenario.moderate')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={scenario === 'accelerated'}
              onClick={() => setScenario('accelerated')}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                scenario === 'accelerated' ? 'bg-amber-600 text-white font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('scenario.accelerated')}
            </button>
          </div>
        </div>
      </div>

      <Tabs value={dashTab} onValueChange={setDashTab} className="mt-4">
        <TabsList className="flex h-auto w-full flex-wrap gap-1">
          <TabsTrigger value="overview" className="gap-1.5"><Activity className="h-4 w-4" aria-hidden />{t('tab.overview')}</TabsTrigger>
          <TabsTrigger value="matches" className="gap-1.5">{t('tab.matches')}</TabsTrigger>
          <TabsTrigger value="pathway" className="gap-1.5">{t('tab.pathway')}</TabsTrigger>
          <TabsTrigger value="harada" className="gap-1.5">{t('tab.harada')}</TabsTrigger>
          <TabsTrigger value="sdg" className="gap-1.5">{t('tab.sdg')}</TabsTrigger>
          <TabsTrigger value="demand" className="gap-1.5">{t('tab.demand')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab matches={matches} />
        </TabsContent>
        <TabsContent value="matches" className="mt-4">
          <MatchesTab matches={matches} />
        </TabsContent>
        <TabsContent value="pathway" className="mt-4">
          <PathwayTab matches={matches} />
        </TabsContent>
        <TabsContent value="harada" className="mt-4">
          <HaradaTab matches={matches} />
        </TabsContent>
        <TabsContent value="sdg" className="mt-4">
          <SdgTab matches={matches} />
        </TabsContent>
        <TabsContent value="demand" className="mt-4">
          <DemandTab matches={matches} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Overview: forecast status + radar + movers + changelog ────────────────

function OverviewTab({ matches }: { matches: ReturnType<typeof matchAll> }) {
  const t = useT();
  const { profile, chosenRole } = useSkillCast();
  const { data, loading, refreshing, refresh, momentumMap } = useSignals();
  const [emailOpen, setEmailOpen] = useState(false);

  const radarData = useMemo(() => {
    const userSlugs = Object.keys(profile.skills);
    const marketTop = Object.entries(momentumMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([s]) => s);
    const slugs = [...new Set([...userSlugs.slice(0, 8), ...marketTop])].slice(0, 12);
    return slugs.map((slug) => ({
      skill: (SKILL_MAP[slug]?.name ?? slug).split(' ').slice(0, 2).join(' '),
      you: Math.round((profile.skills[slug] ?? 0) * 20),
      market: momentumMap[slug] ?? 0,
    }));
  }, [profile.skills, momentumMap]);

  const movers = data?.changelog?.[0]?.details?.movers ?? [];

  const strongest = useMemo(() => {
    return Object.keys(profile.skills)
      .map((s) => ({ slug: s, m: momentumMap[s] ?? 0 }))
      .sort((a, b) => b.m - a.m);
  }, [profile.skills, momentumMap]);

  const nextCourse = useMemo(() => {
    const role = chosenRole ? ROLE_MAP[chosenRole] : null;
    if (!role) return null;
    const m = matches.find((x) => x.roleSlug === role.slug);
    const firstGap = m?.gap?.[0];
    if (!firstGap) return null;
    const c = Object.values(COURSE_MAP).find((x) => x.skills.includes(firstGap.skill));
    return c ?? null;
  }, [chosenRole, matches]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Loading signals…</div>;
  }

  return (
    <div className="space-y-4">
      {/* Forecast status */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Badge
            className={
              data?.live
                ? 'gap-1.5 bg-emerald-600 text-white'
                : 'gap-1.5 bg-amber-600 text-white'
            }
          >
            <RadioTower className="h-3 w-3" aria-hidden />
            {data?.live ? t('ov.live') : t('ov.cached')}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {t('ov.runinfo', { n: data?.totalPostings ?? 0 })} ·{' '}
            {data ? new Date(data.fetchedAt).toLocaleString() : ''}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button onClick={() => void refresh()} disabled={refreshing} variant="outline" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
              {refreshing ? t('ov.refreshing') : t('ov.refresh')}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setEmailOpen(true)}>
              <Mail className="h-4 w-4" aria-hidden /> {t('ov.email.btn')}
            </Button>
          </div>
          {data?.sources?.map((s) => (
            <SourceChip key={s.name} href={s.url}>
              {s.name} · {s.postings || '—'}
            </SourceChip>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Radar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{t('ov.radar.title')}</CardTitle>
            <CardDescription>{t('ov.radar.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="You" dataKey="you" stroke="#0d9488" fill="#0d9488" fillOpacity={0.35} />
                <Radar name="Market" dataKey="market" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Movers + strengths */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('ov.movers.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {movers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('ov.movers.none')}</p>
              ) : (
                <ul className="space-y-1.5">
                  {movers.slice(0, 5).map((m) => (
                    <li key={m.skill} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{SKILL_MAP[m.skill]?.name ?? m.skill}</span>
                      <span className="flex items-center gap-2">
                        <TrendArrow delta={m.delta} />
                        <MomentumPill momentum={m.momentum} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('ov.strong')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {strongest.slice(0, 4).map((s) => (
                  <li key={s.slug} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{SKILL_MAP[s.slug]?.name ?? s.slug}</span>
                    <MomentumPill momentum={s.m} />
                  </li>
                ))}
                {strongest.length > 4 && (
                  <li className="text-xs text-muted-foreground">{t('ov.weak')}: {strongest.slice(-2).map((s) => SKILL_MAP[s.slug]?.name ?? s.slug).join(', ')}</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Changelog */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="h-5 w-5" aria-hidden /> {t('ov.changelog.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-72 overflow-y-auto">
          <ol className="relative space-y-3 border-l border-border pl-4">
            {data?.changelog?.map((c) => (
              <li key={c.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={c.live ? 'default' : 'secondary'} className="text-[10px]">{c.version}</Badge>
                  <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="mt-0.5">{c.summary}</p>
                {c.details.movers.length > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.details.movers
                      .map((m) => `${SKILL_MAP[m.skill]?.name ?? m.skill} ${m.delta >= 0 ? '↑' : '↓'}${Math.abs(m.delta)}`)
                      .join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Monthly email preview (simulated) */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('ov.email.subject')}</DialogTitle>
            <DialogDescription>{t('ov.email.sim')}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="mb-2">{t('ov.email.greeting')}</p>
            <p className="mb-1 font-semibold">{t('ov.email.changes')}</p>
            {movers.length ? (
              <ul className="mb-3 list-inside list-disc text-muted-foreground">
                {movers.slice(0, 3).map((m) => (
                  <li key={m.skill}>
                    {SKILL_MAP[m.skill]?.name ?? m.skill} {m.delta >= 0 ? '↑' : '↓'}{Math.abs(m.delta)} → {m.momentum}/100
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-muted-foreground">{t('ov.movers.none')}</p>
            )}
            <p className="mb-1 font-semibold">{t('ov.email.next')}</p>
            <p className="mb-3 text-muted-foreground">
              {nextCourse ? `${nextCourse.title} (${nextCourse.provider})` : '—'}
            </p>
            <Button size="sm" className="bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500">
              {t('ov.email.cta')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
