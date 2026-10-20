import type { TeamMemberDef } from '@/lib/types';

// ─── Synthetic employer workforce (DEMO DATA — no real persons) ────────────
// Used by the employer dashboard to render a team-level skills-gap heatmap.
// In production this would come from anonymised, consented workforce profiles
// with a minimum aggregation cell size (k-anonymity) before display.

export const TEAM: TeamMemberDef[] = [
  {
    id: 'tm-aina', name: 'Aina (synthetic)', title: 'Operations Executive', dept: 'Banking Ops',
    persona: 'working-adult', years: 18, interests: ['business', 'technology'],
    skills: {
      'ai-augmented-ops': 2, 'data-analysis': 2, communication: 4,
      'project-management': 3, 'critical-thinking': 3, 'customer-experience': 3,
    },
  },
  {
    id: 'tm-raj', name: 'Raj (synthetic)', title: 'Marketing Executive', dept: 'Marketing',
    persona: 'working-adult', years: 4, interests: ['creative', 'technology'],
    skills: {
      'digital-marketing': 3, 'ai-content-ops': 2, communication: 3,
      'data-analysis': 1, 'creative-framing': 3, adaptability: 3,
    },
  },
  {
    id: 'tm-meiling', name: 'Mei Ling (synthetic)', title: 'HR Executive', dept: 'People',
    persona: 'working-adult', years: 9, interests: ['people', 'education'],
    skills: {
      communication: 4, 'project-management': 2, 'teaching-training': 2,
      'business-analysis': 2, adaptability: 3, leadership: 2,
    },
  },
  {
    id: 'tm-farah', name: 'Farah (synthetic)', title: 'Customer Service Lead', dept: 'Service',
    persona: 'working-adult', years: 6, interests: ['service', 'health'],
    skills: {
      'customer-experience': 4, communication: 4, 'ai-augmented-ops': 1,
      adaptability: 3, 'mental-health': 2, telehealth: 1,
    },
  },
  {
    id: 'tm-hafiz', name: 'Hafiz (synthetic)', title: 'IT Support Officer', dept: 'Technology',
    persona: 'working-adult', years: 3, interests: ['technology'],
    skills: {
      'software-engineering': 2, cybersecurity: 2, cloud: 2,
      communication: 2, iot: 1, 'prompt-engineering': 2,
    },
  },
  {
    id: 'tm-devi', name: 'Devi (synthetic)', title: 'Finance Analyst', dept: 'Finance',
    persona: 'working-adult', years: 12, interests: ['business', 'sustainability'],
    skills: {
      'data-analysis': 4, 'business-analysis': 3, 'critical-thinking': 4,
      python: 1, communication: 3, 'climate-data': 1,
    },
  },
  {
    id: 'tm-weiming', name: 'Wei Ming (synthetic)', title: 'Electrical Trainee (TVET)', dept: 'Facilities',
    persona: 'tvet-student', years: 1, interests: ['green', 'technology'],
    skills: {
      iot: 1, 'software-engineering': 1, 'renewable-energy': 1,
      adaptability: 4, 'ev-mobility': 1, 'energy-efficiency': 1,
    },
  },
  {
    id: 'tm-sarah', name: 'Sarah (synthetic)', title: 'Administration Supervisor', dept: 'Corporate Services',
    persona: 'working-adult', years: 20, interests: ['business'],
    skills: {
      'ai-augmented-ops': 1, communication: 3, 'project-management': 2,
      'customer-experience': 2, 'data-analysis': 1, 'prompt-engineering': 1,
    },
  },
];
