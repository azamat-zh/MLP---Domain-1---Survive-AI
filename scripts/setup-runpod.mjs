#!/usr/bin/env bun
// ─── One-command RunPod connection for SkillCast ───────────────────────────
// Writes a working .env.local: local DATABASE_URL (the committed .env carries
// a Linux sandbox path) plus RUNPOD_API_KEY / RUNPOD_ENDPOINT_ID for the
// AI-assisted CV extraction (call site 1). Without a key the app still works —
// it falls back to deterministic in-browser extraction.
//
//   bun run setup:runpod          # interactive: prompts for the API key
//   bun run setup:runpod --check  # read-only status, exits 1 when the key is missing
//
// The API key is never printed (only the last 4 characters). .env.local is
// gitignored — never commit it.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { stdin, stdout, exit } from 'node:process';

const ENV_FILE = join(process.cwd(), '.env.local');
const CHECK_ONLY = process.argv.includes('--check');
// Shared SkillCast endpoint (self-hosted Qwen2.5-7B-Instruct, EU-RO-1).
// Teammates reuse it — do not deploy your own.
const ENDPOINT_ID = '3sz0imio0udhna';

function readEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

const env = readEnv(ENV_FILE);
const additions = [];
const key = env.RUNPOD_API_KEY;

if (!env.DATABASE_URL) {
  additions.push('DATABASE_URL=file:../db/custom.db');
}
if (key) {
  const tail = key.length > 4 ? key.slice(-4) : '****';
  console.log(`RUNPOD_API_KEY: already set (…${tail})`);
  if (CHECK_ONLY) console.log('RunPod: connected');
} else if (CHECK_ONLY) {
  console.log('RunPod: NOT configured — run `bun run setup:runpod` to connect.');
  exit(1);
} else {
  const entered = await prompt(
    'Paste your Runpod API key (https://console.runpod.io -> Settings -> API Keys; starts with rpa_): '
  );
  if (!/^rpa_/.test(entered)) {
    console.error('Rejected: the key must start with "rpa_". Nothing was written.');
    exit(1);
  }
  additions.push(`RUNPOD_API_KEY=${entered}`);
}
if (!env.RUNPOD_ENDPOINT_ID) {
  additions.push(`RUNPOD_ENDPOINT_ID=${ENDPOINT_ID}`);
}

if (additions.length > 0) {
  const body = (existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8').replace(/\n*$/, '\n') : '') +
    additions.map((l) => `${l}\n`).join('');
  writeFileSync(ENV_FILE, body, { mode: 0o600 });
  console.log(`Written to ${ENV_FILE}:`);
  for (const line of additions) console.log(`  ${line.replace(/=.*/, '=<set>')}`);
} else {
  console.log(`${ENV_FILE} is already fully configured.`);
}

console.log('\nNext: restart `bun run dev`, then paste a CV in onboarding — you should see "Analysing with AI…"');
console.log(`Endpoint: ${ENDPOINT_ID} (shared, EU-RO-1). Only de-identified CV text is sent.`);