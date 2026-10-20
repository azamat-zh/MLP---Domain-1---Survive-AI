'use client';

import { useState } from 'react';
import { Database, RadioTower, RefreshCw, ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CURATED_SIGNALS, LIVE_SOURCES } from '@/data/curated';
import { SKILL_MAP } from '@/data/skills';
import { useSignals, SourceChip, useT } from './shared';

// ─── Signals view: every source with its date — the transparency page ──────

export function SignalsView() {
  const t = useT();
  const { data, loading, refreshing, refresh } = useSignals();
  const [showSample, setShowSample] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <RadioTower className="h-6 w-6 text-teal-700 dark:text-teal-400" aria-hidden />
            {t('sig.title')}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('sig.method')}</p>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('sig.note')}</p>
        </div>
        <Button onClick={() => void refresh()} disabled={refreshing} className="gap-2 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
          {refreshing ? t('ov.refreshing') : t('sig.refresh')}
        </Button>
      </div>

      {/* Current run */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('ov.changelog.title')}</CardTitle>
          <CardDescription>
            {data && (
              <>
                {t('sig.fetched')}: {new Date(data.fetchedAt).toLocaleString()} ·{' '}
                {data.totalPostings} {t('sig.postings')} ·{' '}
                <Badge variant={data.live ? 'default' : 'secondary'} className="h-4 px-1 text-[10px]">
                  {data.live ? t('ov.live') : t('ov.cached')}
                </Badge>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">…</p>
          ) : (
            <ol className="space-y-2">
              {data?.changelog?.map((c) => (
                <li key={c.id} className="rounded-lg border px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{c.version}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-0.5">{c.summary}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Live sources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('sig.live')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.sources?.map((s) => (
              <div key={s.name} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{s.name}</span>
                  <Badge variant={s.ok ? 'default' : 'destructive'} className="text-[10px]">
                    {s.ok ? 'OK' : 'FAIL'}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.postings > 0 ? `${s.postings} ${t('sig.postings')}` : s.kind}
                </p>
                <SourceChip href={s.url}>{s.url}</SourceChip>
              </div>
            ))}
            {LIVE_SOURCES.filter((s) => s.kind === 'planned').map((s) => (
              <div key={s.name} className="rounded-lg border border-dashed p-3 opacity-75">
                <span className="text-sm font-semibold">{s.name}</span>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowSample((v) => !v)}>
              <Database className="mr-2 h-4 w-4" aria-hidden />
              {t('sig.sample')}
            </Button>
            {showSample && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  Momentum pipeline: postings → alias matching against the taxonomy (word boundaries) →
                  frequency / trend → blend with cited research horizon. Sample skills in the corpus:
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(data?.snapshots ?? [])
                    .sort((a, b) => b.momentum - a.momentum)
                    .slice(0, 10)
                    .map((s) => (
                      <SourceChip key={s.skillSlug}>
                        {SKILL_MAP[s.skillSlug]?.name ?? s.skillSlug}: {s.momentum}
                      </SourceChip>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Curated, cited */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="h-5 w-5" aria-hidden />
              {t('sig.curated')}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 space-y-3 overflow-y-auto">
            {CURATED_SIGNALS.map((c) => (
              <div key={c.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{c.title}</span>
                  <Badge variant="outline" className="text-[10px]">{c.date}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.publisher}</p>
                <ul className="mt-2 space-y-0.5">
                  {c.keyStats.map((s) => (
                    <li key={s.label} className="text-xs">
                      <span className="font-medium">{s.value}</span>{' '}
                      <span className="text-muted-foreground">{s.label}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] italic text-muted-foreground">{c.usedFor}</p>
                <SourceChip href={c.url}>{c.url}</SourceChip>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
