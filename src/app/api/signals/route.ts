import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ingestLiveSignals, seedSnapshots } from '@/lib/momentum';
import type { SignalsPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

async function ensureFreshRun(force: boolean) {
  const latest = await db.signalRun.findFirst({ orderBy: { createdAt: 'desc' } });
  const stale = !latest || Date.now() - latest.createdAt.getTime() > 10 * 60 * 1000;
  if (force || stale || !latest) {
    let runId: string;
    try {
      runId = await buildRun(true);
    } catch {
      runId = await buildRun(false);
    }
    await writeChangelog(runId);
    return runId;
  }
  return latest.id;
}

export async function GET() {
  try {
    const runId = await ensureFreshRun(false);
    const payload = await payloadFor(runId);
    return NextResponse.json(payload);
  } catch (e) {
    console.error('[api/signals] GET failed', e);
    return NextResponse.json({ error: 'signal pipeline failed' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const runId = await ensureFreshRun(true);
    const payload = await payloadFor(runId);
    return NextResponse.json(payload);
  } catch (e) {
    console.error('[api/signals] POST failed', e);
    return NextResponse.json({ error: 'signal refresh failed' }, { status: 500 });
  }
}
