// @ts-expect-error Bun runtime is installed; shared main has no Bun ambient types.
import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildHrSignals, hrSkillEvidence } from '../src/lib/hr-signals';
import { makeT } from '../src/lib/i18n';
import { ROLES } from '../src/data/roles';
import { HrMarketSignals, HrSignalEvidence } from '../src/components/skillcast/hr-market-signals';
import type { SignalsPayload } from '../src/lib/types';
import { computeMomentum, type Posting } from '../src/lib/momentum';

// Reserved example URLs, invented identities/dates: test fixtures only.
// No API calls, database imports or genuine market observations.
function fixture(): SignalsPayload {
  return {
    runId: 'synthetic-test-run', fetchedAt: '2026-10-24T00:00:00Z', live: true,
    totalPostings: 20, confidence: 'ok',
    sources: [{ name: 'Synthetic test feed', url: 'https://example.org/jobs', postings: 20, ok: true, kind: 'test' }],
    snapshots: [{
      skillSlug: 'data-analysis', momentum: 76, postings: 20, recentPostings: 12,
      earlierPostings: 8, frequency: 1, trend: 0.2,
      samples: [{ title: 'Synthetic test advertisement', company: 'Test only', snippet: '',
        url: 'https://example.org/jobs/test', date: '2026-09-09T12:00:00Z',
        sourceDate: '2026-09-09T12:00:00Z', sourceDateKind: 'published' }],
    }],
    changelog: [],
  };
}

describe('HR heatmap and market evidence', () => {
  test('loading, failures, stale retained payloads and seeded responses never fabricate live signals', () => {
    for (const role of ROLES) {
      for (const [data, error, loading] of [
        [null, null, true], [null, 'signals 500', false],
        [fixture(), 'signals 500', false], [{ ...fixture(), live: false }, null, false],
      ] as const) {
        const model = buildHrSignals(data, error, role.slug, loading);
        expect(model.live).toBe(false);
        expect(model.signals).toEqual([]);
        expect(model.columns).toEqual(role.skills.map((item) => item.skill).slice(0, 8));
        expect(model.columns.length).toBeGreaterThan(0);
      }
    }
  });

  test('fallback follows the selected role rather than a fabricated vacancy ranking', () => {
    expect(buildHrSignals(null, 'failed', 'ai-ops-specialist').columns)
      .not.toEqual(buildHrSignals(null, 'failed', 'solar-technician').columns);
  });

  test('live entries use actual sample provenance and publication date, never run creation date', () => {
    const data = fixture();
    const model = buildHrSignals(data, null, 'ai-ops-specialist');
    expect(model.live).toBe(true);
    expect(model.signals[0].momentum).toBe(76);
    expect(model.signals[0].evidence).toEqual([{
      label: 'Synthetic test feed', url: 'https://example.org/jobs/test', date: '2026-09-09', dateKind: 'published',
    }]);
    expect(model.signals[0].evidence[0].date).not.toBe(data.fetchedAt.slice(0, 10));
    data.snapshots[0].momentum = 0;
    expect(buildHrSignals(data, null, 'ai-ops-specialist').signals[0].momentum).toBe(0);
  });

  test('unrelated aggregate feeds are not falsely attributed to a skill', () => {
    const data = fixture();
    data.sources[0].url = 'https://other.example.org/';
    const entry = buildHrSignals(data, null, 'ai-ops-specialist').signals[0].evidence[0];
    expect(entry.label).toBe('example.org');
    expect(entry.label).not.toBe('Synthetic test feed');
  });

  test('missing/invalid metadata is explicit; unsafe URLs and invented dates are never rendered', () => {
    for (const date of ['', 'not-a-date', '2026-02-30']) {
      const data = fixture();
      data.snapshots[0].samples![0].sourceDate = date;
      const model = buildHrSignals(data, null, 'ai-ops-specialist');
      expect(model.signals[0].evidence[0].date).toBeNull();
      const html = renderToStaticMarkup(<HrMarketSignals model={model} refreshing={false} retry={async () => {}} t={makeT('en')} />);
      expect(html).toContain('Source/date unavailable');
      expect(html).not.toContain('2026-10-24');
    }
    const data = fixture();
    data.snapshots[0].samples![0].url = 'javascript:alert(1)';
    expect(buildHrSignals(data, null, 'ai-ops-specialist').signals[0].evidence).toEqual([]);
    data.snapshots[0].samples = undefined;
    expect(buildHrSignals(data, null, 'ai-ops-specialist').signals[0].evidence).toEqual([]);
  });

  test('mixed or missing skill coverage is labelled illustrative without changing momentum calculations', () => {
    const model = buildHrSignals(fixture(), null, 'ai-ops-specialist');
    expect(hrSkillEvidence(model, ['data-analysis']).live).toBe(true);
    expect(hrSkillEvidence(model, ['data-analysis', 'leadership']).live).toBe(false);
    expect(hrSkillEvidence(model, []).live).toBe(false);
    const data = fixture();
    data.snapshots[0].samples = undefined;
    expect(hrSkillEvidence(buildHrSignals(data, null, 'ai-ops-specialist'), ['data-analysis']).incomplete).toBe(true);
    for (const momentum of [NaN, Infinity, -1, 101]) {
      data.snapshots[0].momentum = momentum;
      expect(buildHrSignals(data, null, 'ai-ops-specialist').live).toBe(false);
    }
  });

  test('source dates are additive metadata: legacy sample dates are never presented as verified publication', () => {
    const data = fixture();
    delete data.snapshots[0].samples![0].sourceDate;
    expect(buildHrSignals(data, null, 'ai-ops-specialist').signals[0].evidence[0].date).toBeNull();
    const posting: Posting = {
      title: 'Synthetic Python data analysis job', company: 'Test only', description: 'Python data analysis',
      source: 'Synthetic test feed', date: new Date(), url: 'https://example.org/test',
    };
    const before = computeMomentum([posting]);
    const after = computeMomentum([{ ...posting, sourceDate: '2026-09-09', sourceDateKind: 'updated' }]);
    expect(before.map(({ samples, ...scores }) => scores)).toEqual(after.map(({ samples, ...scores }) => scores));
    const sample = after.flatMap((item) => item.samples ?? [])[0];
    expect(sample.sourceDate).toBe('2026-09-09');
    expect(sample.sourceDateKind).toBe('updated');
    data.snapshots[0].samples![0].sourceDate = '2026-09-09';
    data.snapshots[0].samples![0].sourceDateKind = 'updated';
    const html = renderToStaticMarkup(<HrMarketSignals model={buildHrSignals(data, null, 'ai-ops-specialist')}
      refreshing={false} retry={async () => {}} t={makeT('en')} />);
    expect(html).toContain('Updated:');
    expect(html).not.toContain('Published:');
  });

  for (const lang of ['en', 'ms', 'zh', 'ru'] as const) {
    test(`${lang}: rendered error, retry, live provenance and unknown metadata use translations`, () => {
      const t = makeT(lang);
      const fallback = renderToStaticMarkup(<HrMarketSignals model={buildHrSignals(null, 'failed', 'ai-ops-specialist')}
        refreshing={false} retry={async () => {}} t={t} />);
      expect(fallback).toContain(t('hr.signals.status.error'));
      expect(fallback).toContain(t('hr.signals.retry'));
      expect(fallback).not.toContain('data-testid="hr-live-signal"');
      const busy = renderToStaticMarkup(<HrMarketSignals model={buildHrSignals(null, 'failed', 'ai-ops-specialist')}
        refreshing retry={async () => {}} t={t} />);
      expect(busy).toContain('disabled=""');
      expect(busy).toContain(t('hr.signals.retrying'));
      const live = renderToStaticMarkup(<HrMarketSignals model={buildHrSignals(fixture(), null, 'ai-ops-specialist')}
        refreshing={false} retry={async () => {}} t={t} />);
      expect(live).toContain('2026-09-09');
      expect(live).toContain('Synthetic test feed');
      expect(live).toContain(t('hr.signals.momentum', { n: 76 }));
      expect(live).not.toContain('2026-10-24');
      const unknown = renderToStaticMarkup(<HrSignalEvidence entries={[]} t={t} />);
      expect(unknown).toContain(t('hr.signals.unavailable'));
      expect(live + fallback + unknown).not.toContain('hr.signals.');
    });
  }
});
