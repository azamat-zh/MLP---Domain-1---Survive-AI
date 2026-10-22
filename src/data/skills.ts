import type { SkillDef } from '@/lib/types';

// ─── Skills taxonomy (v1) ──────────────────────────────────────────────────
// Sources: skill names aligned with ESCO/O*NET skill concepts; momentum
// parameters blend curated research (WEF Future of Jobs 2025, Stanford AI
// Index 2025 — see src/data/curated.ts) with live job-posting signals
// (Remotive + Arbeitnow, fetched via /api/signals).
// Levels: 0 none · 1 aware · 2 basic · 3 competent · 4 strong · 5 expert

export const SKILLS: SkillDef[] = [
  // ── AI & Data ────────────────────────────────────────────────────────────
  {
    slug: 'prompt-engineering', name: 'Prompt & GenAI Orchestration', category: 'AI & Data',
    aliases: ['prompt engineering', 'generative ai', 'genai', 'large language model', 'llm', 'chatgpt', 'copilot', 'prompt design'],
    sdgTags: [8, 9], automationExposure: 0.1, augmentationPotential: 0.95,
    researchHorizon: 88, seedMomentum: 72,
  },
  {
    slug: 'ai-agents', name: 'AI Agent Design & Operations', category: 'AI & Data',
    aliases: ['ai agent', 'agentic', 'agent orchestration', 'multi-agent', 'langchain', 'crewai', 'autogen', 'ai workflow'],
    sdgTags: [8, 9], automationExposure: 0.1, augmentationPotential: 0.95,
    researchHorizon: 92, seedMomentum: 58,
  },
  {
    slug: 'machine-learning', name: 'Machine Learning', category: 'AI & Data',
    aliases: ['machine learning', 'deep learning', 'pytorch', 'tensorflow', 'neural network', 'data science'],
    sdgTags: [8, 9], automationExposure: 0.15, augmentationPotential: 0.85,
    researchHorizon: 82, seedMomentum: 74,
  },
  {
    slug: 'data-analysis', name: 'Data Analysis & Visualisation', category: 'AI & Data',
    aliases: ['data analysis', 'data analytics', 'data visualisation', 'data visualization', 'power bi', 'tableau', 'sql', 'pandas', 'spreadsheet'],
    sdgTags: [8, 9], automationExposure: 0.35, augmentationPotential: 0.8,
    researchHorizon: 76, seedMomentum: 80,
  },
  {
    slug: 'data-engineering', name: 'Data Engineering', category: 'AI & Data',
    aliases: ['data engineer', 'data pipeline', 'etl', 'airflow', 'dbt', 'snowflake', 'data warehouse'],
    sdgTags: [9], automationExposure: 0.25, augmentationPotential: 0.75,
    researchHorizon: 72, seedMomentum: 62,
  },
  {
    slug: 'mlops', name: 'MLOps & AI Deployment', category: 'AI & Data',
    aliases: ['mlops', 'model deployment', 'machine learning operations', 'model monitoring'],
    sdgTags: [8, 9], automationExposure: 0.2, augmentationPotential: 0.8,
    researchHorizon: 70, seedMomentum: 48,
  },
  {
    slug: 'responsible-ai', name: 'Responsible AI & Governance', category: 'AI & Data',
    aliases: ['responsible ai', 'ai ethics', 'ai governance', 'ai safety', 'ai regulation', 'model risk'],
    sdgTags: [9, 10, 16], automationExposure: 0.1, augmentationPotential: 0.7,
    researchHorizon: 78, seedMomentum: 52,
  },

  // ── Engineering & Cloud ──────────────────────────────────────────────────
  {
    slug: 'python', name: 'Python Programming', category: 'Engineering & Cloud',
    aliases: ['python', 'django', 'flask', 'fastapi'],
    sdgTags: [9], automationExposure: 0.25, augmentationPotential: 0.8,
    researchHorizon: 75, seedMomentum: 78,
  },
  {
    slug: 'cloud', name: 'Cloud Computing', category: 'Engineering & Cloud',
    aliases: ['aws', 'azure', 'google cloud', 'gcp', 'cloud infrastructure', 'cloud computing', 'cloud engineer'],
    sdgTags: [9], automationExposure: 0.2, augmentationPotential: 0.8,
    researchHorizon: 76, seedMomentum: 75,
  },
  {
    slug: 'devops', name: 'DevOps & Automation', category: 'Engineering & Cloud',
    aliases: ['devops', 'kubernetes', 'docker', 'ci/cd', 'terraform', 'site reliability', 'sre'],
    sdgTags: [9], automationExposure: 0.2, augmentationPotential: 0.75,
    researchHorizon: 72, seedMomentum: 68,
  },
  {
    slug: 'software-engineering', name: 'Software Engineering', category: 'Engineering & Cloud',
    aliases: ['software engineer', 'software developer', 'full stack', 'full-stack', 'backend', 'frontend', 'web developer', 'react', 'node.js', 'javascript', 'typescript'],
    sdgTags: [8, 9], automationExposure: 0.35, augmentationPotential: 0.8,
    researchHorizon: 70, seedMomentum: 85,
  },
  {
    slug: 'robotics', name: 'Robotics & Automation Systems', category: 'Engineering & Cloud',
    aliases: ['robotics', 'robot', 'ros', 'industrial automation', 'plc'],
    sdgTags: [9, 2], automationExposure: 0.15, augmentationPotential: 0.7,
    researchHorizon: 65, seedMomentum: 40,
  },
  {
    slug: 'iot', name: 'IoT & Smart Systems', category: 'Engineering & Cloud',
    aliases: ['iot', 'internet of things', 'smart sensors', 'embedded systems', 'arduino', 'raspberry pi'],
    sdgTags: [9, 11], automationExposure: 0.2, augmentationPotential: 0.7,
    researchHorizon: 65, seedMomentum: 42,
  },
  {
    slug: 'blockchain', name: 'Blockchain / Web3', category: 'Engineering & Cloud',
    aliases: ['blockchain', 'web3', 'solidity', 'smart contract'],
    sdgTags: [9], automationExposure: 0.4, augmentationPotential: 0.5,
    researchHorizon: 30, seedMomentum: 22,
  },

  // ── Green & Sustainability ───────────────────────────────────────────────
  {
    slug: 'renewable-energy', name: 'Renewable Energy Systems', category: 'Green & Sustainability',
    aliases: ['solar', 'photovoltaic', 'wind energy', 'wind turbine', 'renewable energy', 'clean energy', 'solar panel'],
    sdgTags: [7, 13], automationExposure: 0.1, augmentationPotential: 0.6,
    researchHorizon: 76, seedMomentum: 55,
  },
  {
    slug: 'energy-efficiency', name: 'Energy Efficiency & Audit', category: 'Green & Sustainability',
    aliases: ['energy audit', 'energy efficiency', 'energy management', 'building management system', 'hvac efficiency'],
    sdgTags: [7, 13], automationExposure: 0.15, augmentationPotential: 0.65,
    researchHorizon: 70, seedMomentum: 45,
  },
  {
    slug: 'ev-mobility', name: 'EV & Battery Technology', category: 'Green & Sustainability',
    aliases: ['electric vehicle', 'ev charging', 'battery technology', 'battery management', 'charging infrastructure'],
    sdgTags: [9, 13], automationExposure: 0.1, augmentationPotential: 0.6,
    researchHorizon: 72, seedMomentum: 48,
  },
  {
    slug: 'climate-data', name: 'Climate & ESG Data Analysis', category: 'Green & Sustainability',
    aliases: ['esg', 'sustainability reporting', 'carbon accounting', 'carbon footprint', 'emissions data', 'climate risk', 'ghg'],
    sdgTags: [8, 12, 13], automationExposure: 0.15, augmentationPotential: 0.7,
    researchHorizon: 72, seedMomentum: 50,
  },
  {
    slug: 'smart-agriculture', name: 'Smart Agriculture', category: 'Green & Sustainability',
    aliases: ['precision agriculture', 'agritech', 'smart farming', 'agriculture technology', 'agricultural drone', 'hydroponic', 'vertical farming'],
    sdgTags: [2, 12], automationExposure: 0.15, augmentationPotential: 0.65,
    researchHorizon: 66, seedMomentum: 30,
  },

  // ── Health & Care ────────────────────────────────────────────────────────
  {
    slug: 'telehealth', name: 'Telehealth & Digital Care', category: 'Health & Care',
    aliases: ['telehealth', 'telemedicine', 'virtual care', 'remote patient monitoring', 'digital health'],
    sdgTags: [3], automationExposure: 0.2, augmentationPotential: 0.6,
    researchHorizon: 66, seedMomentum: 38,
  },
  {
    slug: 'health-informatics', name: 'Health Informatics', category: 'Health & Care',
    aliases: ['health informatics', 'health data', 'electronic health record', 'ehr', 'emr', 'fhir', 'medical data'],
    sdgTags: [3], automationExposure: 0.25, augmentationPotential: 0.7,
    researchHorizon: 64, seedMomentum: 32,
  },
  {
    slug: 'eldercare', name: 'Eldercare & Community Support', category: 'Health & Care',
    aliases: ['elderly care', 'aged care', 'caregiver', 'home care', 'domiciliary care'],
    sdgTags: [3, 10], automationExposure: 0.15, augmentationPotential: 0.4,
    researchHorizon: 58, seedMomentum: 26,
  },
  {
    slug: 'mental-health', name: 'Mental Health & Psychosocial Support', category: 'Health & Care',
    aliases: ['mental health', 'psychosocial support', 'counselling', 'counseling', 'wellbeing at work', 'employee assistance'],
    sdgTags: [3, 8], automationExposure: 0.1, augmentationPotential: 0.5,
    researchHorizon: 60, seedMomentum: 28,
  },

  // ── Business & Operations ────────────────────────────────────────────────
  {
    slug: 'project-management', name: 'Project Management', category: 'Business & Operations',
    aliases: ['project management', 'project manager', 'agile', 'scrum', 'kanban', 'pmp', 'programme management'],
    sdgTags: [8], automationExposure: 0.35, augmentationPotential: 0.75,
    researchHorizon: 56, seedMomentum: 70,
  },
  {
    slug: 'product-management', name: 'Product Management', category: 'Business & Operations',
    aliases: ['product management', 'product manager', 'product owner', 'product discovery'],
    sdgTags: [8, 9], automationExposure: 0.25, augmentationPotential: 0.75,
    researchHorizon: 60, seedMomentum: 58,
  },
  {
    slug: 'business-analysis', name: 'Business & Process Analysis', category: 'Business & Operations',
    aliases: ['business analyst', 'business analysis', 'process mapping', 'requirements gathering', 'process improvement', 'lean six sigma'],
    sdgTags: [8], automationExposure: 0.45, augmentationPotential: 0.7,
    researchHorizon: 58, seedMomentum: 55,
  },
  {
    slug: 'ai-augmented-ops', name: 'AI-Augmented Office Operations', category: 'Business & Operations',
    aliases: ['office automation', 'rpa', 'robotic process automation', 'workflow automation', 'power automate', 'zapier', 'intelligent automation'],
    sdgTags: [8, 9], automationExposure: 0.3, augmentationPotential: 0.85,
    researchHorizon: 70, seedMomentum: 46,
  },
  {
    slug: 'supply-chain', name: 'Supply Chain & Logistics Analytics', category: 'Business & Operations',
    aliases: ['supply chain', 'logistics', 'inventory optimisation', 'demand planning', 'warehouse management'],
    sdgTags: [9, 12], automationExposure: 0.4, augmentationPotential: 0.7,
    researchHorizon: 58, seedMomentum: 52,
  },
  {
    slug: 'customer-experience', name: 'Human-Centred Customer Service', category: 'Business & Operations',
    aliases: ['customer service', 'customer experience', 'customer success', 'client relations', 'service delivery', 'community outreach'],
    sdgTags: [8, 10], automationExposure: 0.5, augmentationPotential: 0.6,
    researchHorizon: 50, seedMomentum: 60,
  },
  {
    slug: 'teaching-training', name: 'Teaching & Workforce Training', category: 'Business & Operations',
    aliases: ['training and development', 'learning and development', 'trainer', 'facilitation', 'instructional design', 'upskilling', 'train the trainer'],
    sdgTags: [4, 8], automationExposure: 0.2, augmentationPotential: 0.65,
    researchHorizon: 74, seedMomentum: 36,
  },

  // ── Human & Creative Skills ──────────────────────────────────────────────
  {
    slug: 'critical-thinking', name: 'Analytical & Critical Thinking', category: 'Human & Creative',
    aliases: ['critical thinking', 'analytical thinking', 'problem solving', 'problem-solving', 'structured thinking'],
    sdgTags: [4, 8], automationExposure: 0.15, augmentationPotential: 0.8,
    researchHorizon: 76, seedMomentum: 66,
  },
  {
    slug: 'communication', name: 'Communication & Storytelling', category: 'Human & Creative',
    aliases: ['communication skills', 'stakeholder management', 'presentation skills', 'storytelling', 'business writing'],
    sdgTags: [4, 8, 17], automationExposure: 0.2, augmentationPotential: 0.7,
    researchHorizon: 70, seedMomentum: 68,
  },
  {
    slug: 'collaboration', name: 'Collaboration & Teamwork', category: 'Human & Creative',
    aliases: ['teamwork', 'cross-functional', 'collaboration', 'pair working', 'knowledge sharing'],
    sdgTags: [8, 17], automationExposure: 0.15, augmentationPotential: 0.65,
    researchHorizon: 64, seedMomentum: 58,
  },
  {
    slug: 'adaptability', name: 'Adaptability & Learning Agility', category: 'Human & Creative',
    aliases: ['adaptability', 'resilience', 'growth mindset', 'continuous learning', 'agile mindset', 'learning agility'],
    sdgTags: [4, 8], automationExposure: 0.1, augmentationPotential: 0.75,
    researchHorizon: 74, seedMomentum: 54,
  },
  {
    slug: 'leadership', name: 'People Leadership & Coaching', category: 'Human & Creative',
    aliases: ['people management', 'team leadership', 'coaching and mentoring', 'people leadership'],
    sdgTags: [4, 5, 8], automationExposure: 0.15, augmentationPotential: 0.65,
    researchHorizon: 62, seedMomentum: 50,
  },
  {
    slug: 'creative-framing', name: 'Creative Problem Framing', category: 'Human & Creative',
    aliases: ['design thinking', 'creative thinking', 'ideation', 'innovation workshop', 'creative problem solving'],
    sdgTags: [4, 8, 9], automationExposure: 0.2, augmentationPotential: 0.75,
    researchHorizon: 70, seedMomentum: 44,
  },

  // ── Security & Trust ─────────────────────────────────────────────────────
  {
    slug: 'cybersecurity', name: 'Cybersecurity Operations', category: 'Security & Trust',
    aliases: ['cybersecurity', 'cyber security', 'information security', 'security analyst', 'penetration testing', 'soc analyst', 'vulnerability management'],
    sdgTags: [9, 16], automationExposure: 0.15, augmentationPotential: 0.75,
    researchHorizon: 80, seedMomentum: 64,
  },
  {
    slug: 'privacy-compliance', name: 'Data Privacy & Compliance', category: 'Security & Trust',
    aliases: ['data privacy', 'data protection', 'gdpr', 'pdpa', 'privacy officer', 'compliance officer', 'data governance'],
    sdgTags: [8, 16], automationExposure: 0.2, augmentationPotential: 0.65,
    researchHorizon: 68, seedMomentum: 40,
  },

  // ── Marketing & Content ──────────────────────────────────────────────────
  {
    slug: 'digital-marketing', name: 'Digital Marketing', category: 'Marketing & Content',
    aliases: ['digital marketing', 'seo', 'sem', 'search engine', 'content marketing', 'growth marketing', 'social media marketing'],
    sdgTags: [8], automationExposure: 0.45, augmentationPotential: 0.7,
    researchHorizon: 54, seedMomentum: 62,
  },
  {
    slug: 'ai-content-ops', name: 'AI Content Operations', category: 'Marketing & Content',
    aliases: ['ai content', 'content generation', 'copywriting ai', 'ai marketing', 'content operations', 'generative content'],
    sdgTags: [8], automationExposure: 0.5, augmentationPotential: 0.8,
    researchHorizon: 62, seedMomentum: 42,
  },
];

export const SKILL_MAP: Record<string, SkillDef> = Object.fromEntries(
  SKILLS.map((s) => [s.slug, s]),
);

export const SKILL_CATEGORIES = Array.from(new Set(SKILLS.map((s) => s.category)));

// ─── Adjacency: transferable-skill credit (0-1) ────────────────────────────
// Used by the matching engine: a skill you already have partially covers a
// related skill you lack. Edge list is symmetric; weights are transparent.

export const ADJACENCY: Array<[string, string, number]> = [
  ['python', 'machine-learning', 0.6],
  ['python', 'data-analysis', 0.5],
  ['python', 'software-engineering', 0.6],
  ['data-analysis', 'data-engineering', 0.5],
  ['data-analysis', 'business-analysis', 0.5],
  ['data-analysis', 'health-informatics', 0.5],
  ['data-analysis', 'climate-data', 0.45],
  ['machine-learning', 'mlops', 0.5],
  ['machine-learning', 'ai-agents', 0.5],
  ['machine-learning', 'responsible-ai', 0.4],
  ['prompt-engineering', 'ai-agents', 0.6],
  ['prompt-engineering', 'ai-content-ops', 0.55],
  ['prompt-engineering', 'ai-augmented-ops', 0.5],
  ['ai-agents', 'software-engineering', 0.4],
  ['cloud', 'devops', 0.6],
  ['devops', 'software-engineering', 0.5],
  ['devops', 'mlops', 0.5],
  ['cybersecurity', 'software-engineering', 0.4],
  ['cybersecurity', 'privacy-compliance', 0.5],
  ['privacy-compliance', 'responsible-ai', 0.45],
  ['iot', 'robotics', 0.5],
  ['iot', 'software-engineering', 0.4],
  ['iot', 'ev-mobility', 0.35],
  ['renewable-energy', 'ev-mobility', 0.5],
  ['renewable-energy', 'energy-efficiency', 0.55],
  ['climate-data', 'supply-chain', 0.35],
  ['telehealth', 'customer-experience', 0.4],
  ['telehealth', 'health-informatics', 0.5],
  ['communication', 'teaching-training', 0.5],
  ['communication', 'customer-experience', 0.5],
  ['communication', 'leadership', 0.4],
  ['teaching-training', 'adaptability', 0.35],
  ['critical-thinking', 'creative-framing', 0.5],
  ['critical-thinking', 'data-analysis', 0.4],
  ['critical-thinking', 'business-analysis', 0.45],
  ['business-analysis', 'project-management', 0.5],
  ['project-management', 'leadership', 0.5],
  ['project-management', 'product-management', 0.5],
  ['product-management', 'business-analysis', 0.45],
  ['digital-marketing', 'creative-framing', 0.4],
  ['digital-marketing', 'ai-content-ops', 0.55],
  ['ai-content-ops', 'communication', 0.4],
  ['ai-augmented-ops', 'adaptability', 0.35],
  ['supply-chain', 'data-analysis', 0.4],
  ['eldercare', 'communication', 0.35],
  ['mental-health', 'communication', 0.4],
  ['mental-health', 'eldercare', 0.3],
];

export const ADJACENCY_MAP: Record<string, Record<string, number>> = (() => {
  const m: Record<string, Record<string, number>> = {};
  for (const [a, b, w] of ADJACENCY) {
    (m[a] ??= {})[b] = Math.max(m[a]?.[b] ?? 0, w);
    (m[b] ??= {})[a] = Math.max(m[b]?.[a] ?? 0, w);
  }
  return m;
})();
