'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Database, ExternalLink, FileWarning, RadioTower, RefreshCw, ScrollText, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CURATED_SIGNALS, LIVE_SOURCES } from '@/data/curated';
import { SKILL_MAP } from '@/data/skills';
import { useSignals, SourceChip, useT } from './shared';

// ─── Signals view: every source with its date — the transparency page ──────

export function SignalsView() {
  const t = useT();
  const { data, loading, refreshing, refresh, error } = useSignals();
  const [showSample, setShowSample] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8">
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <RadioTower className="h-6 w-6 text-teal-700 dark:text-teal-400" aria-hidden />
            {t('sig.title')}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('sig.method')}</p>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('sig.note')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data?.confidence === 'low' && data.live && (
            <Badge variant="outline" className="border-amber-400 bg-amber-50/50 text-amber-700 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
              {t('sig.lowConfidence', { n: data.totalPostings })}
            </Badge>
          )}
          <Button onClick={() => void refresh()} disabled={refreshing} className="gap-2 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
            {refreshing ? t('ov.refreshing') : t('sig.refresh')}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500 bg-red-50/30 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
            <FileWarning className="h-5 w-5" aria-hidden />
            Could not load signals
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void refresh()} className="mt-2 gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Retry
          </Button>
        </div>
      )}

      {/* Demo banner when not live */}
      {data && !data.live && !error && (
        <div className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 dark:border-amber-600/50 dark:bg-amber-600/15">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <Database className="h-5 w-5" aria-hidden />
            {t('sig.demoBanner', { date: new Date(data.fetchedAt).toLocaleString() })}
          </p>
        </div>
      )}

      {/* Data note */}
      {data?.note && !error && (
        <div className="mt-4 rounded-lg border border-amber-400 bg-amber-50/20 p-3 text-sm text-amber-800 dark:text-amber-300">
          {data.note}
        </div>
      )}

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
                <SourceChip href={s.ok ? s.url : undefined}>{s.url}</SourceChip>
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
                      <button
                        key={s.skillSlug}
                        type="button"
                        onClick={() => setExpandedSkill(expandedSkill === s.skillSlug ? null : s.skillSlug)}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {expandedSkill === s.skillSlug ? (
                          <ChevronDown className="h-3 w-3" aria-hidden />
                        ) : (
                          <ChevronRight className="h-3 w-3" aria-hidden />
                        )}
                        {SKILL_MAP[s.skillSlug]?.name ?? s.skillSlug}: {s.momentum}
                        <span className="text-[10px] opacity-70">({s.postings} {t('sig.postings').split(' ')[0]})</span>
                      </button>
                    ))}
                </div>
                {expandedSkill && data && (
                  <div className="mt-3 space-y-2">
                    {(() => {
                      const snap = data.snapshots.find((s) => s.skillSlug === expandedSkill);
                      if (!snap || !snap.samples || snap.samples.length === 0) {
                        return <p className="text-xs text-muted-foreground">{t('sig.noEvidence')}</p>;
                      }
                      return snap.samples.map((sample, i) => (
                        <div key={i} className="rounded-lg border p-2 text-xs">
                          <p className="font-medium text-sm">{sample.title}</p>
                          <p className="text-muted-foreground">{sample.company}</p>
                          <p className="text-muted-foreground">{new Date(sample.date).toLocaleDateString()}</p>
                          {sample.url ? (
                            <a href={sample.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400">
                              <ExternalLink className="h-3 w-3" aria-hidden /> View posting
                            </a>
                          ) : null}
                          <p className="mt-1 italic text-muted-foreground/70">{sample.snippet}</p>
                        </div>
                      ));
                    })()}
                  </div>
                )}
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