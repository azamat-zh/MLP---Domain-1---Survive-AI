'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { makeT, SDG_COLORS as SDG_HEX } from '@/lib/i18n';
import { useSkillCast } from '@/lib/store';
import type { SignalsPayload } from '@/lib/types';

// ─── Signals context: one shared fetch of /api/signals for the whole app ───

interface SignalsCtx {
  data: SignalsPayload | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  momentumMap: Record<string, number>;
}

const Ctx = createContext<SignalsCtx>({
  data: null,
  loading: true,
  refreshing: false,
  error: null,
  refresh: async () => {},
  momentumMap: {},
});

export function SignalsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SignalsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (method: 'GET' | 'POST') => {
    if (method === 'POST') setRefreshing(true);
    try {
      const res = await fetch('/api/signals', { method, cache: 'no-store' });
      if (!res.ok) throw new Error(`signals ${res.status}`);
      const json = (await res.json()) as SignalsPayload;
      setData(json);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Could not load signals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Trade-off: eager load on mount means the signals request fires even on
  // pages that never call useSignals(). The alternative — deferring to first
  // access — adds latency on the first interaction.
  useEffect(() => {
    void load('GET');
  }, []);

  const momentumMap: Record<string, number> = {};
  if (data) for (const s of data.snapshots) momentumMap[s.skillSlug] = s.momentum;

  return (
    <Ctx.Provider
      value={{ data, loading, refreshing, error, refresh: () => load('POST'), momentumMap }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSignals() {
  return useContext(Ctx);
}

// ─── Language helper hook ──────────────────────────────────────────────────

export function useT() {
  const lang = useSkillCast((s) => s.lang);
  return makeT(lang);
}

// ─── Small shared UI atoms ─────────────────────────────────────────────────

export function SdgBadge({ goal, size = 'sm' }: { goal: number; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold text-white ${
        size === 'sm' ? 'h-5 w-5 justify-center text-[10px]' : 'h-6 min-w-6 px-1.5 justify-center text-xs'
      }`}
      style={{ backgroundColor: SDG_HEX[goal] ?? '#555' }}
      title={`SDG ${goal}`}
      aria-label={`Sustainable Development Goal ${goal}`}
    >
      {goal}
    </span>
  );
}

export function MomentumPill({ momentum }: { momentum: number }) {
  const rising = momentum >= 60;
  const mid = momentum >= 45;
  return (
    <Badge
      variant="outline"
      className={
        rising
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          : mid
            ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            : 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
      }
    >
      {momentum}
      <span className="ml-0.5 text-[10px] opacity-70">/100</span>
    </Badge>
  );
}

export function TrendArrow({ delta }: { delta: number }) {
  if (Math.abs(delta) < 2) return <span className="text-muted-foreground">→</span>;
  return delta > 0 ? (
    <span className="font-semibold text-emerald-600 dark:text-emerald-400">↑ {Math.abs(delta)}</span>
  ) : (
    <span className="font-semibold text-rose-600 dark:text-rose-400">↓ {Math.abs(delta)}</span>
  );
}

export function SourceChip({ children, href }: { children: ReactNode; href?: string }) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
      >
        {children}
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}

export function LevelDots({ level, max = 5, highlight = 0 }: { level: number; max?: number; highlight?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Level ${level} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < level
              ? i < highlight
                ? 'bg-emerald-600'
                : 'bg-teal-600 dark:bg-teal-400'
              : 'bg-muted-foreground/25'
          }`}
        />
      ))}
    </span>
  );
}

export function LevelPicker({ level, onChange }: { level: number; onChange: (n: number) => void }) {
  return (
    <span className="inline-flex items-center gap-1" role="radiogroup" aria-label="Skill level 0 to 5">
      <button
        type="button"
        role="radio"
        aria-checked={level === 0}
        onClick={() => onChange(0)}
        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
          level === 0 ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        0
      </button>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={level === n}
          aria-label={`Level ${n}`}
          onClick={() => onChange(n)}
          className={`h-4 w-4 rounded-full border transition-colors ${
            level >= n
              ? 'border-teal-600 bg-teal-600 dark:border-teal-400 dark:bg-teal-400'
              : 'border-muted-foreground/40 hover:border-teal-500'
          } ${level === n ? 'ring-2 ring-teal-300 dark:ring-teal-700' : ''}`}
        />
      ))}
      <span className="ml-1 w-3 text-xs text-muted-foreground" aria-hidden>{level}</span>
    </span>
  );
}
