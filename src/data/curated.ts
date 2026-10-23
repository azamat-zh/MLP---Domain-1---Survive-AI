import type { CuratedSignal } from '@/lib/types';

// ─── Curated, cited signal sources ─────────────────────────────────────────
// These are the "versioned report" half of the signal layer. Each is stored
// with publisher + date and is used transparently in the momentum blend.
// Live sources (Remotive, Arbeitnow) are fetched at runtime — see
// src/lib/momentum.ts and /api/signals.

export const LIVE_SOURCES = [
  {
    name: 'Remotive Job API',
    url: 'https://remotive.com/api/remote-jobs',
    kind: 'live',
    description: 'Remote job postings worldwide (JSON, free, no key). Updated continuously.',
  },
  {
    name: 'Arbeitnow Job Board API',
    url: 'https://www.arbeitnow.com/api/job-board-api',
    kind: 'live',
    description: 'Job postings from the German/EU market (JSON, free, no key). Updated hourly.',
  },
  {
    name: 'Greenhouse Boards (10 verified)',
    url: 'https://boards-api.greenhouse.io/v1/boards/{board}/jobs',
    kind: 'live',
    description: 'stripe, datadog, airbnb, cloudflare, figma, databricks, roblox, pinterest, dropbox, coinbase. Each board fetched independently; per-board failures isolated.',
  },
  {
    name: 'Ashby Boards (5 verified)',
    url: 'https://api.ashbyhq.com/posting-api/job-board/{org}',
    kind: 'live',
    description: 'notion, perplexity, mux, linear, ramp. Each org fetched independently; per-org failures isolated.',
  },
  {
    name: 'MyFutureJobs (planned)',
    url: 'https://myfuturejobs.gov.my/',
    kind: 'planned',
    description: "Malaysia's national employment portal by PERKESO — production integration planned for local-market fidelity.",
  },
] as const;

export const CURATED_SIGNALS: CuratedSignal[] = [
  {
    id: 'wef-foj-2025',
    publisher: 'World Economic Forum',
    title: 'Future of Jobs Report 2025',
    date: 'January 2025',
    url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/',
    keyStats: [
      { label: 'Jobs created by 2030', value: '170 million' },
      { label: 'Jobs displaced by 2030', value: '92 million' },
      { label: 'Workers whose key skills change by 2030', value: '39%' },
      { label: 'Fastest-growing skills', value: 'AI & big data, networks & cybersecurity, technological literacy' },
    ],
    usedFor: 'Research-horizon weights per skill; scenario demand directions; uncertainty framing.',
  },
  {
    id: 'hays-asia-2025',
    publisher: 'Hays Asia',
    title: 'Asia Salary Guide 2025 (Malaysia)',
    date: 'January 2025',
    url: 'https://www.hays.com.my/',
    keyStats: [
      { label: 'Malaysian professionals using AI tools at work', value: '56%' },
      { label: 'Who have received formal AI training', value: '26%' },
    ],
    usedFor: 'Problem framing — the skills-gap headline used in the landing page and proposal.',
  },
  {
    id: 'mosti-reskilling',
    publisher: 'Ministry of Science, Technology & Innovation (MOSTI), Malaysia',
    title: 'National AI reskilling estimate (as cited in the Aiversecity brief)',
    date: '2025',
    url: 'https://www.mosti.gov.my/',
    keyStats: [
      { label: 'Workers needing reskilling within 3–5 years', value: '600,000+' },
    ],
    usedFor: 'Accelerated-scenario demand for teaching/training and reskilling roles.',
  },
  {
    id: 'stanford-ai-index-2025',
    publisher: 'Stanford HAI',
    title: 'AI Index Report 2025',
    date: 'April 2025',
    url: 'https://hai.stanford.edu/ai-index/2025-ai-index-report',
    keyStats: [
      { label: 'Organisations using AI in 2024', value: '78%' },
      { label: 'vs. 2023', value: '55%' },
    ],
    usedFor: 'Adoption-pace calibration between the moderate and accelerated scenarios.',
  },
  {
    id: 'un-sdg-targets',
    publisher: 'United Nations',
    title: 'Sustainable Development Goal targets',
    date: '2015–2030 framework',
    url: 'https://sdgs.un.org/goals',
    keyStats: [
      { label: 'Primary targets', value: '4.4 relevant skills for decent work · 4.3 lifelong TVET learning' },
      { label: 'Work targets', value: '8.2 productivity through innovation · 8.5 full & productive employment' },
    ],
    usedFor: 'Every role and skill in the graph is mapped to at least one target — the SDG ledger.',
  },
];

export const DISCLAIMER =
  'All momentum scores, demand indices and match scores are transparent estimates, not guarantees. Every number on this page is traceable to a named source with its date. Predictions are shown under at least two scenarios because AI progress is unpredictable.';
