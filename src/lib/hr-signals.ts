import { ROLE_MAP } from '@/data/roles';
import { SKILL_MAP } from '@/data/skills';
import type { SignalsPayload, SkillSnapshot } from './types';

export interface HrSignalEvidence {
  label: string;
  url: string;
  date: string | null;
  dateKind: 'published' | 'updated' | null;
}
export interface HrVacancySignal {
  skill: string;
  momentum: number;
  evidence: HrSignalEvidence[];
}
export interface HrSignalsModel {
  status: 'loading' | 'error' | 'live' | 'demo';
  live: boolean;
  columns: string[];
  signals: HrVacancySignal[];
  bySkill: Map<string, HrVacancySignal>;
}

function httpUrl(value: string | undefined): URL | null {
  try {
    const url = new URL(value ?? '');
    return ['https:', 'http:'].includes(url.protocol) ? url : null;
  } catch { return null; }
}

function publicationDate(value: string | undefined): string | null {
  // Keep the source's calendar date, not the run timestamp or today's date.
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return null;
  const day = value.slice(0, 10);
  const parsedDay = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(Date.parse(value)) && Number.isFinite(parsedDay.getTime()) &&
    parsedDay.toISOString().slice(0, 10) === day ? day : null;
}

function evidenceFor(snapshot: SkillSnapshot, sources: SignalsPayload['sources']): HrSignalEvidence[] {
  const unique = new Map<string, HrSignalEvidence>();
  for (const sample of snapshot.samples ?? []) {
    const url = httpUrl(sample.url);
    if (!url) continue;
    // Feeds have run-level metadata only. Associate by actual sample URL host;
    // never attribute every skill to every feed in an aggregate payload.
    const source = sources.find((item) => item.ok && httpUrl(item.url)?.hostname === url.hostname);
    const dateKind = sample.sourceDateKind === 'published' || sample.sourceDateKind === 'updated' ? sample.sourceDateKind : null;
    const date = dateKind ? publicationDate(sample.sourceDate) : null;
    unique.set(`${url.href}|${date}`, {
      label: source?.name?.trim() || url.hostname,
      url: url.href,
      date, dateKind: date ? dateKind : null,
    });
  }
  return [...unique.values()];
}

export function buildHrSignals(
  data: SignalsPayload | null, error: string | null, targetRole: string, loading = false,
): HrSignalsModel {
  const snapshots = data?.snapshots.filter((item) =>
    SKILL_MAP[item.skillSlug] && Number.isFinite(item.momentum) && item.momentum >= 0 && item.momentum <= 100) ?? [];
  const live = !loading && !error && data?.live === true && snapshots.length > 0;
  const all = live ? snapshots.map((snapshot) => ({
    skill: snapshot.skillSlug, momentum: snapshot.momentum,
    evidence: evidenceFor(snapshot, data!.sources),
  })).sort((a, b) => b.momentum - a.momentum) : [];
  const signals = all.slice(0, 8);
  return {
    status: error ? 'error' : loading ? 'loading' : live ? 'live' : 'demo',
    live,
    columns: live ? signals.map((item) => item.skill)
      : (ROLE_MAP[targetRole]?.skills ?? []).map((item) => item.skill).filter((skill) => SKILL_MAP[skill]).slice(0, 8),
    signals,
    bySkill: new Map(all.map((item) => [item.skill, item])),
  };
}

export function hrSkillEvidence(model: HrSignalsModel, skills: string[]) {
  const live = model.live && skills.length > 0 && skills.every((skill) => model.bySkill.has(skill));
  const entries = live ? skills.flatMap((skill) => model.bySkill.get(skill)!.evidence) : [];
  return {
    live,
    entries: [...new Map(entries.map((entry) => [`${entry.url}|${entry.date}`, entry])).values()],
    incomplete: live && skills.some((skill) => {
      const evidence = model.bySkill.get(skill)!.evidence;
      return !evidence.length || evidence.some((entry) => !entry.date);
    }),
  };
}
