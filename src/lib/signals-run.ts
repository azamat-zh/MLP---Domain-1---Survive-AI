import { db } from '@/lib/db';
import { ingestLiveSignals, seedSnapshots } from '@/lib/momentum';
import type { SignalsPayload, SkillSnapshot } from '@/lib/types';

// ─── Core signal pipeline (extracted from /api/signals/route.ts) ──────────

export const FORCE_COOLDOWN_MS = 60_000;
export const RUN_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const STALENESS_MS = 6 * 60 * 60 * 1000; // 6 hours

let lastForcedAt = 0;

export const SEED_SOURCE = {
  name: 'Seeded baseline (demo snapshot)',
  url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/',
  postings: 0,
  ok: true,
  kind: 'seed',
};

// ─── Build a new run (live or seeded) ─────────────────────────────────────

export async function buildRun(live: boolean, fallbackNote?: string): Promise<string> {
  if (live) {
    const { postings, sources, snapshots } = await ingestLiveSignals();
    const run = await db.signalRun.create({
      data: {
        live: true,
        totalPostings: postings.length,
        sources: JSON.stringify(sources),
        note: null,
      },
    });
    const rows = snapshots.map((s) => ({
      skillSlug: s.skillSlug,
      postings: s.postings,
      recentPostings: s.recentPostings,
      earlierPostings: s.earlierPostings,
      frequency: s.frequency,
      trend: s.trend,
      momentum: s.momentum,
      samples: s.samples ?? undefined,
      runId: run.id,
    }));
    await db.signalSnapshot.createMany({ data: rows });
    return run.id;
  } else {
    const run = await db.signalRun.create({
      data: {
        live: false,
        totalPostings: 0,
        sources: JSON.stringify([SEED_SOURCE]),
        note: fallbackNote ?? 'Live sources unreachable — showing seeded baseline snapshot.',
      },
    });
    const rows = seedSnapshots().map((s) => ({
      skillSlug: s.skillSlug,
      postings: s.postings,
      recentPostings: s.recentPostings,
      earlierPostings: s.earlierPostings,
      frequency: s.frequency,
      trend: s.trend,
      momentum: s.momentum,
      samples: undefined,
      runId: run.id,
    }));
    await db.signalSnapshot.createMany({ data: rows });
    return run.id;
  }
}

// ─── Build the API payload from a run ID ──────────────────────────────────

export async function payloadFor(runId: string): Promise<SignalsPayload> {
  const run = await db.signalRun.findUniqueOrThrow({
    where: { id: runId },
    include: { snapshots: true },
  });
  const log = await db.changelogEntry.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  return {
    runId: run.id,
    fetchedAt: run.createdAt.toISOString(),
    live: run.live,
    totalPostings: run.totalPostings,
    confidence: run.totalPostings < 100 ? 'low' : 'ok',
    sources: JSON.parse(run.sources) as SignalsPayload['sources'],
    note: run.note ?? undefined,
    snapshots: run.snapshots.map((s) => ({
      skillSlug: s.skillSlug,
      postings: s.postings,
      recentPostings: s.recentPostings,
      earlierPostings: s.earlierPostings,
      frequency: s.frequency,
      trend: s.trend,
      momentum: s.momentum,
      samples: s.samples as SkillSnapshot['samples'] | undefined,
    })),
    changelog: log.map((c) => ({
      id: c.id,
      createdAt: c.createdAt.toISOString(),
      version: c.version,
      live: c.live,
      summary: c.summary,
      details: JSON.parse(c.details) as SignalsPayload['changelog'][number]['details'],
    })),
  };
}

// ─── Write a changelog entry comparing the new run to the previous one ────

export async function writeChangelog(newRunId: string): Promise<void> {
  const newRun = await db.signalRun.findUniqueOrThrow({
    where: { id: newRunId },
    include: { snapshots: true },
  });
  const prevRun = await db.signalRun.findFirst({
    where: { id: { not: newRunId } },
    orderBy: { createdAt: 'desc' },
    include: { snapshots: true },
  });

  const movers: Array<{ skill: string; delta: number; momentum: number }> = [];
  if (prevRun) {
    const prevMap = new Map(prevRun.snapshots.map((s) => [s.skillSlug, s.momentum]));
    for (const s of newRun.snapshots) {
      const prev = prevMap.get(s.skillSlug);
      if (prev === undefined) continue;
      movers.push({ skill: s.skillSlug, delta: s.momentum - prev, momentum: s.momentum });
    }
  }
  movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const top = movers.slice(0, 4).filter((m) => Math.abs(m.delta) >= 2);
  const version = `v${newRun.createdAt.toISOString().slice(0, 10)} · ${newRun.createdAt
    .toTimeString()
    .slice(0, 5)}`;

  const summary = newRun.live
    ? `Signals refreshed — ${newRun.totalPostings} live postings analysed${top.length ? ` · top mover: ${top[0].skill} ${top[0].delta >= 0 ? '↑' : '↓'}${Math.abs(top[0].delta)}` : ''}`
    : 'Live sources unreachable — serving seeded baseline snapshot (sources & dates still shown)';

  await db.changelogEntry.create({
    data: {
      version,
      live: newRun.live,
      summary,
      details: JSON.stringify({
        movers: top,
        postings: newRun.totalPostings,
      }),
    },
  });
}

// ─── Prune old runs and changelog entries ─────────────────────────────────

export async function pruneOldRuns() {
  const cutoff = new Date(Date.now() - RUN_RETENTION_MS);
  try {
    await db.signalRun.deleteMany({ where: { createdAt: { lt: cutoff } } });
    await db.changelogEntry.deleteMany({ where: { createdAt: { lt: cutoff } } });
    const keep = await db.changelogEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true },
    });
    if (keep.length > 0) {
      const keepIds = keep.map((e) => e.id);
      await db.changelogEntry.deleteMany({ where: { id: { notIn: keepIds } } });
    }
  } catch (e) {
    console.error('[signals] prune failed', e);
  }
}

// ─── Get (or create) a fresh run ─────────────────────────────────────────

export async function ensureFreshRun(force: boolean): Promise<string> {
  const latest = await db.signalRun.findFirst({ orderBy: { createdAt: 'desc' } });
  const stale = !latest || Date.now() - latest.createdAt.getTime() > STALENESS_MS;
  if (force && latest && Date.now() - lastForcedAt < FORCE_COOLDOWN_MS) {
    await db.signalRun.update({
      where: { id: latest.id },
      data: { note: `Refresh throttled (cooldown active) — showing data from ${latest.createdAt.toLocaleString()}.` },
    });
    return latest.id;
  }
  if (force || stale || !latest) {
    lastForcedAt = Date.now();
    let runId: string;
    try {
      runId = await buildRun(true);
    } catch {
      runId = await buildRun(false);
    }
    await writeChangelog(runId);
    await pruneOldRuns();
    return runId;
  }
  return latest.id;
}