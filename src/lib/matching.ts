import { ROLE_MAP, ROLES } from '@/data/roles';
import { SKILL_MAP } from '@/data/skills';
import { COURSES } from '@/data/courses';
import type { GapItem, MatchFactor, Profile, RoleMatch } from '@/lib/types';

// ─── Deterministic matching engine (no AI in the numbers) ──────────────────
// Published formula — displayed in the UI and in the methodology view:
//
//   match score = 0.45 × skill readiness
//               + 0.25 × interest fit
//               + 0.20 × experience fit
//               + 0.10 × work-preference fit
//
// The LLM narrator (/api/coach) only ever EXPLAINS this output.

export const FORMULA = [
  { key: 'skills', weight: 0.45, label: 'Skills' },
  { key: 'interests', weight: 0.25, label: 'Interests' },
  { key: 'experience', weight: 0.2, label: 'Experience parity' },
  { key: 'preferences', weight: 0.1, label: 'Work preferences' },
] as const;

function experienceParity(profile: Profile, experience: 'entry' | 'mid' | 'senior', entryLevel: boolean): number {
  const y = profile.years;
  switch (profile.persona) {
    case 'fresh-grad':
      return entryLevel ? 1 : experience === 'entry' ? 0.75 : 0.35;
    case 'tvet-student':
      return entryLevel ? 1 : experience === 'entry' ? 0.7 : 0.3;
    case 'switcher':
      return experience === 'senior' ? 0.5 : Math.min(1, 0.5 + y / 8);
    case 'working-adult':
    default:
      if (experience === 'senior') return Math.min(1, 0.4 + y / 15);
      if (experience === 'mid') return Math.min(1, 0.6 + y / 12);
      return Math.min(1, 0.55 + y / 20); // entry roles for experienced people
  }
}

function interestFit(profile: Profile, category: string): number {
  const cat = category.toLowerCase();
  const map: Record<string, string[]> = {
    technology: ['ai', 'technology'],
    ai: ['ai', 'technology'],
    business: ['business', 'operations', 'governance'],
    people: ['people', 'education'],
    education: ['education', 'people'],
    service: ['service', 'health'],
    health: ['health', 'service'],
    green: ['green energy', 'sustainability', 'agritech'],
    sustainability: ['sustainability', 'green energy'],
    creative: ['marketing'],
  };
  if (!profile.interests.length) return 0.5;
  const matched = profile.interests.filter((interest) => (map[interest] ?? [interest]).some((hit) => cat.includes(hit)));
  return matched.length / profile.interests.length;
}

function workPreferenceFit(): number {
  // Role data has no workplace accommodation attributes, so this factor remains neutral
  // instead of penalizing users for requesting a preference the taxonomy cannot verify.
  return 1;
}

function categoryMatches(text: string, category: string): boolean {
  const normalized = text.toLowerCase();
  const cat = category.toLowerCase();
  if (!normalized.trim()) return false;
  if (normalized.includes(cat) || cat.includes(normalized)) return true;
  const aliases: Record<string, string[]> = {
    business: ['account', 'finance', 'analyst', 'management', 'commerce'],
    people: ['human resource', 'hr', 'recruit', 'talent', 'people'],
    technology: ['technology', 'software', 'it ', 'developer', 'computer', 'engineering'],
    operations: ['operations', 'logistics', 'supply chain', 'process'],
    health: ['health', 'medical', 'nursing', 'care'],
    education: ['education', 'teacher', 'student', 'training', 'learning'],
    marketing: ['marketing', 'content', 'communications', 'brand'],
    sustainability: ['sustainability', 'esg', 'climate', 'environment'],
    'green energy': ['energy', 'renewable', 'solar', 'environment'],
    service: ['service', 'customer', 'hospitality', 'support'],
    governance: ['governance', 'policy', 'compliance', 'regulation'],
  };
  return (aliases[cat] ?? []).some((alias) => normalized.includes(alias));
}

export function strategyPriority(profile: Profile, roleSlug: string): number {
  const role = ROLE_MAP[roleSlug];
  if (!role) return 99;
  const details = profile.extended;
  const strategy = details?.careerStrategy as string | undefined;
  const currentWork = [details?.profession, details?.fieldOfWork, details?.specialization].filter(Boolean).join(' ');
  const targetRole = details?.strategyRole ? ROLE_MAP[details.strategyRole] : undefined;

  if (strategy === 'enhance' || strategy === 'enhance-current') {
    if (categoryMatches(currentWork, role.category)) return 0;
    if (role.pathType === 'work-with-ai') return 1;
    return 2;
  }
  if (strategy === 'related-transition') {
    if (role.slug === details?.strategyRole) return 0;
    if (targetRole && (role.category === targetRole.category || role.skills.some((required) => targetRole.skills.some((target) => target.skill === required.skill)))) return 1;
    if (role.pathType === 'pivot') return 2;
    return 3;
  }
  if (strategy === 'new-field' || strategy === 'different-field') {
    if (details?.newField && role.category.toLowerCase() === details.newField.toLowerCase()) return 0;
    if (details?.newField && categoryMatches(details.newField, role.category)) return 1;
    return 2;
  }
  if (strategy === 'ai-skills' || strategy === 'ai-development') {
    if (details?.aiSkill && role.skills.some((requirement) => requirement.skill === details.aiSkill)) return 0;
    if (/ai|governance/i.test(`${role.category} ${role.title}`)) return 1;
    return 2;
  }
  return 1;
}

export function matchRole(
  profile: Profile,
  roleSlug: string,
  momentum: Record<string, number> = {},
): RoleMatch | null {
  const role = ROLE_MAP[roleSlug];
  if (!role) return null;

  const userSkills = profile.skills ?? {};
  const totalWeight = role.skills.reduce((s, r) => s + r.weight, 0) || 1;

  // 1) Direct overlap: user level vs required minimum level
  let skillReadiness = 0;
  const gap: GapItem[] = [];
  const matchingSkills: RoleMatch['matchingSkills'] = [];
  for (const req of role.skills) {
    const lvl = userSkills[req.skill] ?? 0;
    const fit = Math.min(lvl, req.minLevel) / req.minLevel;
    skillReadiness += req.weight * fit;
    if (lvl > 0) matchingSkills.push({ skill: req.skill, skillName: SKILL_MAP[req.skill]?.name ?? req.skill, userLevel: lvl, requiredLevel: req.minLevel });
    if (lvl < req.minLevel) {
      gap.push({
        skill: req.skill,
        skillName: SKILL_MAP[req.skill]?.name ?? req.skill,
        userLevel: lvl,
        minLevel: req.minLevel,
        weight: req.weight,
        momentum: momentum[req.skill] ?? SKILL_MAP[req.skill]?.seedMomentum ?? 50,
        category: SKILL_MAP[req.skill]?.category ?? '',
      });
    }
  }
  skillReadiness /= totalWeight;

  // 3) Experience parity + 4) interest fit
  const expScore = experienceParity(profile, role.experience, role.entryLevel);
  const intScore = interestFit(profile, role.category);
  const preferenceScore = workPreferenceFit();

  const score =
    FORMULA[0].weight * skillReadiness +
    FORMULA[1].weight * intScore +
    FORMULA[2].weight * expScore +
    FORMULA[3].weight * preferenceScore;

  // Pathway duration estimate from the course registry
  const gapSorted = [...gap].sort((a, b) => b.weight * b.momentum - a.weight * a.momentum);
  let hours = 0;
  const covered = new Set<string>();
  for (const g of gapSorted) {
    if (covered.has(g.skill)) continue;
    const course = COURSES.find((c) => c.skills.includes(g.skill));
    if (course) {
      hours += course.totalHours;
      course.skills.forEach((s) => covered.add(s));
    }
  }
  const weekly = Math.max(1, profile.budget || 5);
  const pathwayWeeks = Math.max(1, Math.ceil(hours / weekly));

  const factors: MatchFactor[] = [
    { label: 'Skills', value: skillReadiness, weight: 0.45 },
    { label: 'Interests', value: intScore, weight: 0.25 },
    { label: 'Experience', value: expScore, weight: 0.2 },
    { label: 'Work preferences', value: preferenceScore, weight: 0.1 },
  ];

  return {
    roleSlug,
    score: Math.round(score * 100),
    skillReadiness: Math.round(skillReadiness * 100),
    matchingSkills,
    missingSkills: gapSorted,
    factors,
    gap: gapSorted,
    demand: { moderate: role.demandModerate, accelerated: role.demandAccelerated },
    pathwayWeeks,
  };
}

export function matchAll(
  profile: Profile,
  momentum: Record<string, number> = {},
): RoleMatch[] {
  return ROLES.map((r) => matchRole(profile, r.slug, momentum))
    .filter((m): m is RoleMatch => m !== null)
    .sort((a, b) => strategyPriority(profile, a.roleSlug) - strategyPriority(profile, b.roleSlug) || b.score - a.score);
}

// ─── Harada-style skill matrix ─────────────────────────────────────────────
// Inspired by the Harada Method's Skill Map: current self-rating vs the
// target role's required minimum, per skill. Feeds the gap heatmap.

export function haradaMatrix(
  profile: Profile,
  roleSlug: string,
): Array<{ skill: string; name: string; current: number; required: number; category: string }> {
  const role = ROLE_MAP[roleSlug];
  if (!role) return [];
  return role.skills
    .map((req) => ({
      skill: req.skill,
      name: SKILL_MAP[req.skill]?.name ?? req.skill,
      current: profile.skills?.[req.skill] ?? 0,
      required: req.minLevel,
      category: SKILL_MAP[req.skill]?.category ?? '',
    }))
    .sort((a, b) => (b.required - b.current) - (a.required - a.current));
}
