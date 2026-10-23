'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { HrSignalsModel, HrSignalEvidence as Evidence } from '@/lib/hr-signals';
import type { makeT } from '@/lib/i18n';

type Translate = ReturnType<typeof makeT>;

export function HrSignalEvidence({ entries, incomplete = false, t }: { entries: Evidence[]; incomplete?: boolean; t: Translate }) {
  return (
    <div className="mt-1 min-w-0 space-y-1 text-xs text-muted-foreground">
      {entries.map((entry) => (
        <p key={`${entry.url}|${entry.date}`} className="min-w-0 [overflow-wrap:anywhere]">
          {t('hr.signals.source')}{' '}
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{entry.label}</a>
          {' · '}
          {entry.date
            ? <>{t(entry.dateKind === 'updated' ? 'hr.signals.updated' : 'hr.signals.published')}{' '}<time dateTime={entry.date}>{entry.date}</time></>
            : t('hr.signals.unavailable')}
        </p>
      ))}
      {(!entries.length || (incomplete && entries.every((entry) => entry.date))) &&
        <p>{t('hr.signals.unavailable')}</p>}
    </div>
  );
}

export function HrMarketSignals({ model, refreshing, retry, t }: {
  model: HrSignalsModel; refreshing: boolean; retry: () => Promise<void>; t: Translate;
}) {
  return (
    <Card className="mt-4 min-w-0" data-testid="hr-market-signals">
      <CardHeader>
        <CardTitle className="text-base">{t('hr.signals.title')}</CardTitle>
        <CardDescription>{t('hr.signals.scope')}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3">
        <p role="status" aria-live="polite" className="text-sm" data-testid="hr-signals-status" data-state={model.status}>
          {t(`hr.signals.status.${model.status}`)}
        </p>
        {model.status !== 'loading' && (
          <Button variant="outline" size="sm" disabled={refreshing} onClick={() => void retry()}
            className="h-auto min-h-9 max-w-full whitespace-normal text-left">
            {refreshing ? t('hr.signals.retrying') : t('hr.signals.retry')}
          </Button>
        )}
        {model.live ? (
          <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
            {model.signals.map((signal) => (
              <li key={signal.skill} className="min-w-0 rounded-lg border p-3" data-testid="hr-live-signal">
                <p className="text-sm font-semibold">{t(`hr.skill.${signal.skill}`)}</p>
                <p className="mt-1 text-sm">{t('hr.signals.momentum', { n: signal.momentum })}</p>
                <HrSignalEvidence entries={signal.evidence} t={t} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">{t('hr.signals.demo.note')}</p>
        )}
      </CardContent>
    </Card>
  );
}
