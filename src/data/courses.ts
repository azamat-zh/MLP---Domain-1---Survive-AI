import type { CourseDef } from '@/lib/types';

// ─── Curated course registry (real, free / low-cost resources) ─────────────
// The pathway planner ONLY recommends from this registry — the system cannot
// invent a course. Providers and titles are real and verifiable; links point
// to the provider's platform. "HRD Corp claimable" = deliverable through
// registered Malaysian training providers under HRD Corp's claim scheme.
// Accessibility flags drive the inclusive-pathway reordering.

export const COURSES: CourseDef[] = [
  // ── AI foundations & everyday AI ─────────────────────────────────────────
  {
    slug: 'google-ai-essentials', title: 'Google AI Essentials', provider: 'Google / Coursera',
    url: 'https://grow.google/ai-essentials/',
    totalHours: 8, level: 'beginner', skills: ['prompt-engineering', 'ai-augmented-ops'],
    free: false, hrdClaimable: true, formats: ['video', 'text', 'project'],
    accessibility: ['captions', 'transcripts', 'self-paced'], certificate: true,
    outcome: 'use generative AI tools thoughtfully in everyday work and write effective prompts',
  },
  {
    slug: 'dl-ai-prompt-eng', title: 'ChatGPT Prompt Engineering for Developers', provider: 'DeepLearning.AI',
    url: 'https://learn.deeplearning.ai/',
    totalHours: 2, level: 'beginner', skills: ['prompt-engineering'],
    free: true, hrdClaimable: false, formats: ['video', 'interactive'],
    accessibility: ['captions', 'self-paced'], certificate: false,
    outcome: 'write structured prompts and build simple LLM workflows with code',
  },
  {
    slug: 'dl-ai-agentic-patterns', title: 'AI Agentic Design Patterns', provider: 'DeepLearning.AI',
    url: 'https://learn.deeplearning.ai/',
    totalHours: 3, level: 'intermediate', skills: ['ai-agents', 'prompt-engineering'],
    free: true, hrdClaimable: false, formats: ['video', 'interactive'],
    accessibility: ['captions', 'self-paced'], certificate: false,
    outcome: 'understand how multi-agent AI systems are designed and orchestrated',
  },
  {
    slug: 'ms-ai-fundamentals', title: 'AI Fundamentals (AI-900 learning path)', provider: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/training/paths/introduction-generative-ai/',
    totalHours: 12, level: 'beginner', skills: ['machine-learning', 'responsible-ai'],
    free: true, hrdClaimable: false, formats: ['text', 'interactive'],
    accessibility: ['screen-reader-friendly', 'self-paced'], certificate: true,
    outcome: 'explain core ML concepts and responsible-AI principles',
  },
  {
    slug: 'ai-for-everyone', title: 'AI for Everyone (Andrew Ng)', provider: 'Coursera (audit free)',
    url: 'https://www.coursera.org/learn/ai-for-everyone',
    totalHours: 6, level: 'beginner', skills: ['responsible-ai', 'ai-augmented-ops'],
    free: true, hrdClaimable: false, formats: ['video', 'text'],
    accessibility: ['captions', 'transcripts', 'self-paced'], certificate: false,
    outcome: 'map what AI can and cannot do for your organisation',
  },
  {
    slug: 'salesforce-ai-fundamentals', title: 'AI Fundamentals module', provider: 'Salesforce Trailhead',
    url: 'https://trailhead.salesforce.com/',
    totalHours: 6, level: 'beginner', skills: ['prompt-engineering', 'ai-augmented-ops'],
    free: true, hrdClaimable: false, formats: ['interactive', 'text'],
    accessibility: ['screen-reader-friendly', 'self-paced'], certificate: true,
    outcome: 'apply AI assistants in business workflows hands-on',
  },

  // ── Data & programming ───────────────────────────────────────────────────
  {
    slug: 'fcc-data-analysis-python', title: 'Data Analysis with Python', provider: 'freeCodeCamp',
    url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/',
    totalHours: 120, level: 'beginner', skills: ['python', 'data-analysis'],
    free: true, hrdClaimable: false, formats: ['text', 'interactive', 'project'],
    accessibility: ['screen-reader-friendly', 'self-paced'], certificate: true,
    outcome: 'analyse real datasets in Python and present findings',
  },
  {
    slug: 'kaggle-intro-ml', title: 'Intro to Machine Learning', provider: 'Kaggle Learn',
    url: 'https://www.kaggle.com/learn/intro-to-machine-learning',
    totalHours: 4, level: 'beginner', skills: ['machine-learning', 'data-analysis'],
    free: true, hrdClaimable: false, formats: ['interactive', 'project'],
    accessibility: ['self-paced', 'text'], certificate: true,
    outcome: 'train and validate your first ML models',
  },
  {
    slug: 'kaggle-pandas', title: 'Pandas', provider: 'Kaggle Learn',
    url: 'https://www.kaggle.com/learn/pandas',
    totalHours: 5, level: 'beginner', skills: ['python', 'data-analysis'],
    free: true, hrdClaimable: false, formats: ['interactive', 'project'],
    accessibility: ['self-paced', 'text'], certificate: true,
    outcome: 'wrangle and summarise tabular data confidently',
  },
  {
    slug: 'google-data-analytics', title: 'Google Data Analytics Certificate', provider: 'Google / Coursera',
    url: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    totalHours: 180, level: 'beginner', skills: ['data-analysis', 'communication'],
    free: false, hrdClaimable: true, formats: ['video', 'text', 'project'],
    accessibility: ['captions', 'transcripts', 'self-paced'], certificate: true,
    outcome: 'run an end-to-end analysis and tell the story with dashboards',
  },
  {
    slug: 'fcc-ml-python', title: 'Machine Learning with Python', provider: 'freeCodeCamp',
    url: 'https://www.freecodecamp.org/learn/machine-learning-with-python/',
    totalHours: 120, level: 'intermediate', skills: ['machine-learning', 'python'],
    free: true, hrdClaimable: false, formats: ['text', 'interactive', 'project'],
    accessibility: ['screen-reader-friendly', 'self-paced'], certificate: true,
    outcome: 'build and deploy classic ML applications',
  },

  // ── Cloud, security, engineering ─────────────────────────────────────────
  {
    slug: 'aws-ai-ready', title: 'AI Ready learning plans', provider: 'AWS Skill Builder',
    url: 'https://skillbuilder.aws/',
    totalHours: 10, level: 'beginner', skills: ['cloud', 'machine-learning'],
    free: true, hrdClaimable: false, formats: ['video', 'interactive'],
    accessibility: ['captions', 'self-paced'], certificate: true,
    outcome: 'use AI services on a cloud platform from day one',
  },
  {
    slug: 'cisco-cyber-essentials', title: 'Cybersecurity Essentials', provider: 'Cisco Networking Academy',
    url: 'https://skillsforall.com/',
    totalHours: 15, level: 'beginner', skills: ['cybersecurity'],
    free: true, hrdClaimable: false, formats: ['interactive', 'video'],
    accessibility: ['captions', 'self-paced'], certificate: true,
    outcome: 'explain threats, defences and safe practice fundamentals',
  },
  {
    slug: 'fcc-responsive-web', title: 'Responsive Web Design', provider: 'freeCodeCamp',
    url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
    totalHours: 150, level: 'beginner', skills: ['software-engineering'],
    free: true, hrdClaimable: false, formats: ['text', 'interactive', 'project'],
    accessibility: ['screen-reader-friendly', 'self-paced'], certificate: true,
    outcome: 'build and publish a working website',
  },

  // ── Green & sustainability ───────────────────────────────────────────────
  {
    slug: 'tudelft-solar-energy', title: 'Solar Energy', provider: 'TU Delft (audit free)',
    url: 'https://online-learning.tudelft.nl/',
    totalHours: 40, level: 'intermediate', skills: ['renewable-energy'],
    free: true, hrdClaimable: false, formats: ['video', 'text'],
    accessibility: ['captions', 'transcripts', 'self-paced'], certificate: false,
    outcome: 'evaluate and size a basic photovoltaic system',
  },
  {
    slug: 'fao-climate-smart-ag', title: 'Climate-Smart Agriculture modules', provider: 'FAO eLearning Academy',
    url: 'https://elearning.fao.org/',
    totalHours: 10, level: 'beginner', skills: ['smart-agriculture', 'climate-data'],
    free: true, hrdClaimable: false, formats: ['text', 'interactive'],
    accessibility: ['screen-reader-friendly', 'self-paced'], certificate: true,
    outcome: 'apply climate-smart practices to a real farm context',
  },
  {
    slug: 'sdg-academy-sustainable-dev', title: 'The Age of Sustainable Development', provider: 'SDG Academy (Jeffrey Sachs)',
    url: 'https://www.sdgacademy.org/',
    totalHours: 30, level: 'beginner', skills: ['climate-data', 'communication'],
    free: true, hrdClaimable: false, formats: ['video', 'text'],
    accessibility: ['captions', 'transcripts', 'self-paced'], certificate: true,
    outcome: 'connect economic, social and environmental goals — the SDG big picture',
  },
  {
    slug: 'world-bank-climate-fundamentals', title: 'Climate Change: An Introduction', provider: 'World Bank Open Learning Campus',
    url: 'https://olc.worldbank.org/',
    totalHours: 8, level: 'beginner', skills: ['climate-data'],
    free: true, hrdClaimable: false, formats: ['video', 'text'],
    accessibility: ['captions', 'self-paced'], certificate: true,
    outcome: 'explain climate science basics and mitigation vs adaptation',
  },

  // ── Health & care ────────────────────────────────────────────────────────
  {
    slug: 'dl-ai-medical-diagnosis', title: 'AI for Medical Diagnosis', provider: 'DeepLearning.AI / Coursera (audit free)',
    url: 'https://www.coursera.org/learn/ai-for-medical-diagnosis',
    totalHours: 20, level: 'intermediate', skills: ['health-informatics', 'machine-learning'],
    free: true, hrdClaimable: false, formats: ['video', 'project'],
    accessibility: ['captions', 'transcripts', 'self-paced'], certificate: false,
    outcome: 'understand how AI models are validated in clinical settings',
  },
  {
    slug: 'openwho-digital-health', title: 'Digital Health courses', provider: 'WHO OpenWHO',
    url: 'https://openwho.org/',
    totalHours: 8, level: 'beginner', skills: ['telehealth', 'health-informatics'],
    free: true, hrdClaimable: false, formats: ['video', 'text'],
    accessibility: ['captions', 'transcripts', 'self-paced'], certificate: true,
    outcome: 'describe how digital tools extend health services to communities',
  },

  // ── People, business & teaching ──────────────────────────────────────────
  {
    slug: 'google-project-management', title: 'Google Project Management Certificate', provider: 'Google / Coursera',
    url: 'https://www.coursera.org/professional-certificates/google-project-management',
    totalHours: 180, level: 'beginner', skills: ['project-management', 'communication'],
    free: false, hrdClaimable: true, formats: ['video', 'text', 'project'],
    accessibility: ['captions', 'transcripts', 'self-paced'], certificate: true,
    outcome: 'plan, run and close projects with agile and traditional methods',
  },
  {
    slug: 'google-it-support', title: 'Google IT Support Certificate', provider: 'Google / Coursera',
    url: 'https://www.coursera.org/professional-certificates/google-it-support',
    totalHours: 170, level: 'beginner', skills: ['software-engineering', 'cybersecurity'],
    free: false, hrdClaimable: true, formats: ['video', 'text', 'project'],
    accessibility: ['captions', 'transcripts', 'self-paced'], certificate: true,
    outcome: 'troubleshoot IT systems and support users professionally',
  },
  {
    slug: 'alison-training-strategy', title: 'Training of Trainers foundations', provider: 'Alison (free)',
    url: 'https://alison.com/',
    totalHours: 12, level: 'beginner', skills: ['teaching-training', 'communication'],
    free: true, hrdClaimable: false, formats: ['video', 'text'],
    accessibility: ['captions', 'transcripts', 'self-paced'], certificate: true,
    outcome: 'design and deliver a short training session for adults',
  },
  {
    slug: 'hrcorp-claimable-directory', title: 'HRD Corp claimable programmes (registered providers)', provider: 'HRD Corp course directory',
    url: 'https://hrdcorp.gov.my/',
    totalHours: 24, level: 'beginner', skills: ['ai-augmented-ops', 'data-analysis', 'cybersecurity'],
    free: false, hrdClaimable: true, formats: ['video', 'text', 'project'],
    accessibility: ['self-paced'], certificate: true,
    outcome: 'take instructor-led AI/data courses subsidised through your employer\'s levy',
  },
];

export const COURSE_MAP: Record<string, CourseDef> = Object.fromEntries(
  COURSES.map((c) => [c.slug, c]),
);
