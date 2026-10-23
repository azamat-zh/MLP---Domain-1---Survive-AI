import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ingestLiveSignals, seedSnapshots } from '@/lib/momentum';
import type { SignalsPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';

// POST /api/signals forces an ingest past the 10-minute staleness window. Any
// visitor hitting the endpoint could otherwise trigger unbounded external
// fetches and DB growth, so the force path has an in-process cooldown and
// old runs are pruned after each ingest.
const FORCE_COOLDOWN_MS = 60_000;
const RUN_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
let lastForcedAt = 0;

const SEED_SOURCE = {
  name: 'Seeded baseline (demo snapshot)',
  url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/',
  postings: 0,
  ok: true,
  kind: 'seed',
};

async function buildRun(live: boolean, fallbackNote?: string): Promise<string> {
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
    const rows = snapshots.map((s) => ({ ...s, runId: run.id }));
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
    const rows = seedSnapshots().map((s) => ({ ...s, runId: run.id }));
    await db.signalSnapshot.createMany({ data: rows });
    return run.id;
  }
}

async function payloadFor(runId: string): Promise<SignalsPayload> {
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

async function writeChangelog(newRunId: string): Promise<void> {
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

async function pruneOldRuns() {
  const cutoff = new Date(Date.now() - RUN_RETENTION_MS);
  try {
    // SignalSnapshot cascade-deletes with its run.
    await db.signalRun.deleteMany({ where: { createdAt: { lt: cutoff } } });
    // Prune changelog entries older than the retention window.
    await db.changelogEntry.deleteMany({ where: { createdAt: { lt: cutoff } } });
    // Cap survivors to the newest 50 entries.
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
    console.error('[api/signals] prune failed', e);
  }
}

async function ensureFreshRun(force: boolean) {
  const latest = await db.signalRun.findFirst({ orderBy: { createdAt: 'desc' } });
  const stale = !latest || Date.now() - latest.createdAt.getTime() > 10 * 60 * 1000;
  // Forced refreshes are throttled: a second force within the cooldown window
  // serves the freshest run instead of re-ingesting (no DB write, no fetches).
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

export async function GET() {
  try {
    const runId = await ensureFreshRun(false);
    const payload = await payloadFor(runId);
    return NextResponse.json(payload);
  } catch (e: unknown) {
    const errMsg = typeof e === 'object' && e ? String((e as Record<string, unknown>).message ?? e) : String(e);
    const isDbError =
      ((typeof e === 'object' && e) ? (e as Record<string, unknown>).code : undefined) === 'P2021' ||
      /did not initialize|does not exist|Unable to open|no such table/i.test(errMsg);
    if (isDbError) {
      console.warn('[api/signals] GET returning seeded baseline (DB not ready)');
      return NextResponse.json({
        runId: 'seed',
        fetchedAt: new Date().toISOString(),
        live: false,
        totalPostings: 0,
        sources: [SEED_SOURCE],
        note: 'Database not initialised — run bun run db:push. Showing seeded baseline.',
        snapshots: seedSnapshots(),
        changelog: [],
      });
    }
    console.error('[api/signals] GET failed', e);
    return NextResponse.json({ error: 'signal pipeline failed' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const runId = await ensureFreshRun(true);
    const payload = await payloadFor(runId);
    return NextResponse.json(payload);
  } catch (e: unknown) {
    const errMsg = typeof e === 'object' && e ? String((e as Record<string, unknown>).message ?? e) : String(e);
    const isDbError =
      ((typeof e === 'object' && e) ? (e as Record<string, unknown>).code : undefined) === 'P2021' ||
      /did not initialize|does not exist|Unable to open|no such table/i.test(errMsg);
    if (isDbError) {
      console.warn('[api/signals] POST returning seeded baseline (DB not ready)');
      return NextResponse.json({
        runId: 'seed',
        fetchedAt: new Date().toISOString(),
        live: false,
        totalPostings: 0,
        sources: [SEED_SOURCE],
        note: 'Database not initialised — run bun run db:push. Showing seeded baseline.',
        snapshots: seedSnapshots(),
        changelog: [],
      });
    }
    console.error('[api/signals] POST failed', e);
    return NextResponse.json({ error: 'signal refresh failed' }, { status: 500 });
  }
}
