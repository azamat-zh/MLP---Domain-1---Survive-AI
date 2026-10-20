'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLES, ROLE_MAP } from '@/data/roles';
import { SKILL_MAP } from '@/data/skills';
import type { RoleMatch } from '@/lib/types';
import { useSkillCast } from '@/lib/store';
import { SourceChip, useSignals, useT } from './shared';

// ─── Demand tab: "Will this profession be in demand?" ──────────────────────
// Scenario-adjusted demand index + the momentum decomposition of the role's
// key skills (frequency / trend / research horizon). Everything estimated and
// labelled as such, with sources.

export function DemandTab({ matches }: { matches: RoleMatch[] }) {
  const t = useT();
  const { chosenRole } = useSkillCast();
  const { data, momentumMap } = useSignals();
  const [roleSlug, setRoleSlug] = useState(chosenRole ?? matches[0]?.roleSlug ?? 'ai-ops-specialist');

  const role = ROLE_MAP[roleSlug];
  const match = matches.find((m) => m.roleSlug === roleSlug);

  const skillRows = useMemo(() => {
    return role.skills
      .map((req) => {
        const snap = data?.snapshots.find((s) => s.skillSlug === req.skill);
        return {
          slug: req.skill,
          name: SKILL_MAP[req.skill]?.name ?? req.skill,
          weight: req.weight,
          momentum: snap?.momentum ?? SKILL_MAP[req.skill]?.seedMomentum ?? 50,
          freq: snap?.frequency ?? 0,
          trend: snap?.trend ?? 50,
          horizon: SKILL_MAP[req.skill]?.researchHorizon ?? 50,
        };
      })
      .sort((a, b) => b.momentum - a.momentum);
  }, [role, data]);

  const chartData = skillRows.slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t('demand.title')}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{t('demand.desc')}</p>
        </div>
        <Select value={roleSlug} onValueChange={setRoleSlug}>
          <SelectTrigger className="w-64" aria-label="Role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.slug} value={r.slug}>
                {r.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scenario comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-l-4 border-l-teal-600">
          <CardHeader className="pb-2">
            <CardDescription>{t('scenario.moderate')}</CardDescription>
            <CardTitle className="text-4xl font-bold">
              {role.demandModerate}
              <span className="text-base font-normal text-muted-foreground">/100</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-teal-600" style={{ width: `${role.demandModerate}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription>{t('scenario.accelerated')}</CardDescription>
            <CardTitle className="text-4xl font-bold">
              {role.demandAccelerated}
              <span className="text-base font-normal text-muted-foreground">/100</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${role.demandAccelerated}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-muted-foreground">{t('demand.estimate')}</Badge>
        {match && <Badge variant="outline">{t('match.score')}: {match.score}/100</Badge>}
      </div>

      {/* Skill momentum decomposition */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('demand.momentum')} — {role.title}</CardTitle>
          <CardDescription>{role.signalsNote}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval={0} angle={-12} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number, name: string) => [Math.round(value), name]}
                />
                <Bar dataKey="momentum" radius={[6, 6, 0, 0]} name={t('demand.momentum')}>
                  {chartData.map((row) => (
                    <Cell key={row.slug} fill={row.momentum >= 60 ? '#059669' : row.momentum >= 45 ? '#d97706' : '#e11d48'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Skill</th>
                  <th className="pb-2 font-medium">{t('demand.freq')}</th>
                  <th className="pb-2 font-medium">{t('demand.trend')}</th>
                  <th className="pb-2 font-medium">{t('demand.horizon')}</th>
                  <th className="pb-2 font-medium">{t('demand.momentum')}</th>
                </tr>
              </thead>
              <tbody>
                {skillRows.map((r) => (
                  <tr key={r.slug} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{r.name}</td>
                    <td className="py-2 pr-3 tabular-nums text-muted-foreground">{r.freq}%</td>
                    <td className="py-2 pr-3 tabular-nums text-muted-foreground">{r.trend}/100</td>
                    <td className="py-2 pr-3 tabular-nums text-muted-foreground">{r.horizon}/100</td>
                    <td className="py-2 font-semibold tabular-nums">{r.momentum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {data?.live ? (
              data.sources.map((s) => (
                <SourceChip key={s.name} href={s.url}>
                  {s.name} · {new Date(data.fetchedAt).toLocaleDateString()}
                </SourceChip>
              ))
            ) : (
              <SourceChip href="https://www.weforum.org/publications/the-future-of-jobs-report-2025/">
                WEF Future of Jobs 2025 · baseline snapshot
              </SourceChip>
            )}
            <SourceChip href="https://hai.stanford.edu/ai-index/2025-ai-index-report">Stanford AI Index 2025</SourceChip>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
