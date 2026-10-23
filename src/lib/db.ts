import path from 'node:path';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Dev and the standalone production build run from different working
// directories (project root vs .next/standalone), and the standalone server
// also chdirs into its own folder. Walk up until the repository's
// db/custom.db is found so a relative (or missing) DATABASE_URL resolves
// identically in both modes.
function findDbPath(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'db', 'custom.db');
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(process.cwd(), 'db', 'custom.db');
}

// Absolute values (sandbox `file:/app/db/custom.db`, Windows drive paths)
// pass through untouched; any relative value (e.g. `file:../db/custom.db`)
// or a missing value is pinned to the repository's own db/custom.db.
function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  const fileMatch = raw?.match(/^file:(.*)$/);
  if (!fileMatch) return raw ?? ('file:' + findDbPath().split('\\').join('/'));
  const p = fileMatch[1];
  if (path.isAbsolute(p) || /^[a-zA-Z]:/.test(p)) return raw as string;
  return 'file:' + findDbPath().split('\\').join('/');
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: { db: { url: resolveDatabaseUrl() } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db