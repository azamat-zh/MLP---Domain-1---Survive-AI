import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedSnapshots } from '@/lib/momentum';
import {
  buildRun, payloadFor, writeChangelog, pruneOldRuns, ensureFreshRun,
  FORCE_COOLDOWN_MS, STALENESS_MS, SEED_SOURCE,
} from '@/lib/signals-run';
import type { SignalsPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';

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
        confidence: 'low' as const,
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
        confidence: 'low' as const,
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