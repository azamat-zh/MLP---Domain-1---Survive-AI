// ─── SkillCast shared types ────────────────────────────────────────────────

export type Lang = 'en' | 'ms' | 'zh' | 'ru';
export type ScenarioId = 'moderate' | 'accelerated';
export type Persona = 'working-adult' | 'fresh-grad' | 'switcher' | 'tvet-student';
export type PathType = 'work-with-ai' | 'pivot' | 'emerging';

// ─── Three onboarding tracks ──────────────────────────────────────────────
export type UserType = 'individual' | 'employer' | 'institution';
export type EmploymentStatus = 'student' | 'working' | 'unemployed' | 'career-changer' | '';
export type CareerStrategy = 'enhance' | 'related-transition' | 'new-field' | 'ai-skills' | '';

export interface IndividualProfileDetails {
  employmentStatus?: EmploymentStatus;
  fieldOfWork?: string;
  profession?: string;
  specialization?: string;
  educationLevel?: string;
  country?: string;
  city?: string;
  languages?: Array<{ language: string; proficiency: 'basic' | 'intermediate' | 'advanced' | 'native' }>;
  careerStrategy?: CareerStrategy;
  strategyRole?: string;
  focusSkill?: string;
  newField?: string;
  aiGoal?: string;
  aiSkill?: string;
  workPreferences?: string[];
}

export type EmployerIndustry =
  | 'technology' | 'manufacturing' | 'banking' | 'logistics'
  | 'public' | 'retail' | 'healthcare' | 'education';
export type EmployerObjective = 'risk' | 'transition' | 'budget';
export type EmployerBudget = 'free' | 'hrd';

export interface EmployerProfile {
  company: string;
  industry: EmployerIndustry | '';
  teamSize: number;
  intake: 'batch' | 'matrix' | 'template' | '';
  matrixUrl: string;
  template: string;
  objective: EmployerObjective | '';
  timelineMonths: 3 | 6 | 12;
  budgetPref: EmployerBudget | '';
}

export type StudyField = 'cs' | 'mecheng' | 'business';
export type AdvisoryFocus = 'entry' | 'gaps' | 'sdg';

export interface InstitutionProfile {
  name: string;
  field: StudyField | '';
  intake: 'cv' | 'assessment' | '';
  focus: AdvisoryFocus | '';
  lowBandwidth: boolean;
}

export interface SkillDef {
  slug: string;
  name: string;
  category: string;
  aliases: string[]; // lowercase keywords matched against live job postings
  sdgTags: number[];
  automationExposure: number; // 0-1, negative pressure
  augmentationPotential: number; // 0-1, positive pressure
  researchHorizon: number; // 0-100, curated + cited (WEF / Stanford AI Index)
  seedMomentum: number; // fallback baseline when live fetch is unavailable
}

export interface RoleSkillReq {
  skill: string; // skill slug
  weight: number; // 0-1 relative importance in the role
  minLevel: number; // 1-5 required proficiency
}

export interface RoleDef {
  slug: string;
  title: string;
  tagline: string;
  pathType: PathType;
  category: string;
  entryLevel: boolean; // internship-friendly
  experience: 'entry' | 'mid' | 'senior';
  automationExposure: number;
  demandModerate: number; // scenario-adjusted demand index 0-100
  demandAccelerated: number;
  sdgTags: number[];
  sdgMechanism: string; // WHY this role advances the goals (cited targets)
  skills: RoleSkillReq[];
  signalsNote: string; // how live trend signals feed this outlook
}

export interface CourseDef {
  slug: string;
  title: string;
  provider: string;
  url: string;
  totalHours: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  free: boolean;
  hrdClaimable: boolean; // claimable via registered HRD Corp training providers
  formats: Array<'video' | 'text' | 'interactive' | 'project' | 'audio'>;
  accessibility: string[];
  certificate: boolean;
  outcome: string; // "after this you will be able to ..."
}

export interface TeamMemberDef {
  id: string;
  name: string;
  title: string;
  dept: string;
  persona: Persona;
  years: number;
  interests: string[];
  skills: Record<string, number>; // slug -> level 0-5
}

export interface DeptTemplate {
  id: string;
  labelKey: string; // i18n key, e.g. "Marketing Team of 10"
  industry?: EmployerIndustry; // undefined = cross-industry template
  totalStaff: number;
  shownMembers: TeamMemberDef[];
}

export interface StudentDef {
  id: string;
  name: string;
  year: string;
  field: StudyField;
  skills: Record<string, number>;
  interests: string[];
}

export interface CuratedSignal {
  id: string;
  publisher: string;
  title: string;
  date: string;
  url: string;
  keyStats: Array<{ label: string; value: string }>;
  usedFor: string;
}

// ─── Runtime (API) types ───────────────────────────────────────────────────

export interface SkillSnapshot {
  skillSlug: string;
  postings: number;
  recentPostings: number;
  earlierPostings: number;
  frequency: number;
  trend: number;
  momentum: number;
}

export interface SignalsPayload {
  runId: string;
  fetchedAt: string;
  live: boolean;
  totalPostings: number;
  sources: Array<{ name: string; url: string; postings: number; ok: boolean; kind: string }>;
  note?: string;
  snapshots: SkillSnapshot[];
  changelog: Array<{
    id: string;
    createdAt: string;
    version: string;
    live: boolean;
    summary: string;
    details: {
      movers: Array<{ skill: string; delta: number; momentum: number }>;
      postings: number;
    };
  }>;
}

export interface Profile {
  persona: Persona | null;
  years: number;
  interests: string[];
  budget: number; // hours/week available for learning
  skills: Record<string, number>; // slug -> level 0-5
  inclusion: {
    dyslexia: boolean;
    visual: boolean;
    hearing: boolean;
    mobility: boolean;
    none: boolean;
  };
  objective: string; // Harada-style one-line objective
  cvScrub: { items: number; kinds: string[] } | null;
  intakeMode: 'cv' | 'form' | null;
  /** Optional extension keeps profiles saved before this onboarding update compatible. */
  extended?: IndividualProfileDetails;
  /** Self-reported weekly study time and reflection are stored locally with the profile. */
  weeklyHoursCompleted?: number;
  weeklyReflection?: string;
  completedRoadmapTasks?: string[];
  haradaTaskStatuses?: Record<string, 'not-started' | 'in-progress' | 'completed'>;
}

export interface MatchFactor {
  label: string;
  value: number; // 0-1
  weight: number;
}

export interface GapItem {
  skill: string;
  skillName: string;
  userLevel: number;
  minLevel: number;
  weight: number;
  momentum: number;
  category: string;
}

export interface RoleMatch {
  roleSlug: string;
  score: number; // 0-100
  skillReadiness: number; // weighted readiness against required proficiency, 0-100
  matchingSkills: Array<{ skill: string; skillName: string; userLevel: number; requiredLevel: number }>;
  missingSkills: GapItem[];
  factors: MatchFactor[];
  gap: GapItem[];
  demand: { moderate: number; accelerated: number };
  pathwayWeeks: number;
}
