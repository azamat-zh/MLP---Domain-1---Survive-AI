'use client';

import { useMemo } from 'react';
import { Compass, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_MAP } from '@/data/roles';
import { haradaMatrix } from '@/lib/matching';
import type { RoleMatch } from '@/lib/types';
import { useSkillCast } from '@/lib/store';
import { LevelDots, MomentumPill, useSignals, useT } from './shared';

// ─── Harada tab: skill map (current vs required) + objective + 1-year plan ──
// Inspired by the Harada Method's self-management sheets.

export function HaradaTab({ matches }: { matches: RoleMatch[] }) {
  const t = useT();
  const { chosenRole, profile, completedCourses } = useSkillCast();
  const { momentumMap } = useSignals();

  const match = useMemo(() => matches.find((m) => m.roleSlug === chosenRole) ?? null, [matches, chosenRole]);
  const role = chosenRole ? ROLE_MAP[chosenRole] : null;
  const matrix = useMemo(
    () => (role ? haradaMatrix(profile, role.slug).map((r) => ({ ...r, momentum: momentumMap[r.skill] ?? 0 })) : []),
    [role, profile, momentumMap],
  );

  if (!role || !match) {
    return (
      <Card className="text-center">
        <CardContent className="py-12 text-muted-foreground">{t('sdg.notchosen')}</CardContent>
      </Card>
    );
  }

  const topGap = matrix[0];
  const vision = t('harada.vision.text', {
    top: topGap?.name ?? '—',
    n: match.gap.length,
    w: match.pathwayWeeks,
    b: profile.budget,
    role: role.title,
  });

  return (
    <div className="space-y-4">
      {/* Objective + vision */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden />
              {t('harada.objective')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg bg-muted/50 p-3 text-sm italic">
              “{profile.objective || '—'}”
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              {t('harada.vision')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{vision}</p>
            <Badge variant="outline" className="mt-2 text-[11px] text-muted-foreground">
              {t('harada.method')}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Matrix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('harada.title')}</CardTitle>
          <CardDescription>{t('harada.desc', { role: role.title })}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">{t('common.level')}</th>
                <th className="pb-2 font-medium">{t('harada.current')}</th>
                <th className="pb-2 font-medium">{t('harada.required')}</th>
                <th className="pb-2 font-medium">{t('demand.momentum')}</th>
                <th className="pb-2 font-medium">Gap</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => {
                const gap = row.required - row.current;
                return (
                  <tr key={row.skill} className="border-b last:border-0">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{row.name}</span>
                      <span className="block text-xs text-muted-foreground">{row.category}</span>
                    </td>
                    <td className="py-2.5 pr-3"><LevelDots level={row.current} /></td>
                    <td className="py-2.5 pr-3"><LevelDots level={row.required} highlight={row.required} /></td>
                    <td className="py-2.5 pr-3"><MomentumPill momentum={row.momentum} /></td>
                    <td className="py-2.5">
                      {gap <= 0 ? (
                        <Badge className="bg-emerald-600 text-white">✓</Badge>
                      ) : gap >= 2 ? (
                        <Badge className="bg-rose-600 text-white">+{gap}</Badge>
                      ) : (
                        <Badge className="bg-amber-500 text-white">+{gap}</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            {t('pw.progress')}: {completedCourses.length} {t('pw.done').toLowerCase()} · {t('common.estimates')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
