'use client';

import { useMemo } from 'react';
import { Globe2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_MAP } from '@/data/roles';
import { SKILL_MAP } from '@/data/skills';
import { SDG_TITLES } from '@/lib/i18n';
import type { RoleMatch } from '@/lib/types';
import { useSkillCast } from '@/lib/store';
import { SdgBadge, SourceChip, useT } from './shared';

// ─── SDG tab: the ledger. Mechanisms, not decoration. ──────────────────────

export function SdgTab({ matches }: { matches: RoleMatch[] }) {
  const t = useT();
  const { chosenRole, profile } = useSkillCast();
  const role = chosenRole ? ROLE_MAP[chosenRole] : null;

  const ledger = useMemo(() => {
    if (!role) return null;
    const map = new Map<number, { goals: number; have: string[]; learning: string[] }>();
    for (const req of role.skills) {
      const def = SKILL_MAP[req.skill];
      if (!def) continue;
      const lvl = profile.skills[req.skill] ?? 0;
      const has = lvl >= req.minLevel;
      for (const g of def?.sdgTags ?? []) {
        const entry = map.get(g) ?? { goals: g, have: [], learning: [] };
        (has ? entry.have : entry.learning).push(def.name);
        map.set(g, entry);
      }
    }
    const goalSet = new Set<number>(role.sdgTags);
    for (const g of map.keys()) goalSet.add(g);
    return { perGoal: map, all: [...goalSet].sort((a, b) => a - b) };
  }, [role, profile.skills]);

  if (!role || !ledger) {
    return (
      <Card className="text-center">
        <CardContent className="py-12 text-muted-foreground">{t('sdg.notchosen')}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-emerald-600">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            {t('sdg.title')}
          </CardTitle>
          <CardDescription>{t('sdg.desc', { n: ledger.all.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {ledger.all.map((g) => (
              <SdgBadge key={g} goal={g} size="md" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{role.title} — {t('sdg.why')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="mb-1 flex items-center gap-1.5">
              {role.sdgTags.map((g) => (
                <SdgBadge key={g} goal={g} />
              ))}
            </div>
            <p className="text-sm">{role.sdgMechanism}</p>
          </div>

          {ledger.perGoal.size > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('sdg.roleskills')}</p>
              <ul className="space-y-1.5">
                {[...ledger.perGoal.entries()].map(([goal, entry]) => (
                  <li key={goal} className="flex items-start gap-2 text-sm">
                    <SdgBadge goal={goal} />
                    <span>
                      <span className="font-medium">{SDG_TITLES[goal]}</span>
                      {entry.have.length > 0 && (
                        <span className="text-muted-foreground"> — ✓ {entry.have.join(', ')}</span>
                      )}
                      {entry.learning.length > 0 && (
                        <span className="text-muted-foreground/80">
                          {entry.have.length > 0 ? '; ' : ' — '}
                          <span className="italic">in your pathway:</span> {entry.learning.join(', ')}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <SourceChip href="https://sdgs.un.org/goals">UN SDG framework · targets 4.4 / 8.2 / 8.5</SourceChip>
            <SourceChip>{t('sdg.aggregate')}</SourceChip>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
