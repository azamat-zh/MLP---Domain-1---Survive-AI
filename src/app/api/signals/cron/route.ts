import { NextResponse } from 'next/server';
import { buildRun, writeChangelog, pruneOldRuns } from '@/lib/signals-run';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 501 });
  }

  const auth = request.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const runId = await buildRun(true);
    await writeChangelog(runId);
    await pruneOldRuns();
    return NextResponse.json({ ok: true, runId, live: true });
  } catch (e) {
    console.error('[signals/cron] Live ingest failed, falling back to seed', e);
    try {
      const runId = await buildRun(false);
      await writeChangelog(runId);
      await pruneOldRuns();
      return NextResponse.json({ ok: true, runId, live: false });
    } catch (f) {
      console.error('[signals/cron] Seed fallback also failed', f);
      return NextResponse.json({ error: 'signal ingest failed' }, { status: 500 });
    }
  }
}