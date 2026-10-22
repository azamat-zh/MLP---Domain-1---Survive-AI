import { ROLE_MAP, ROLES } from '@/data/roles';
import { ADJACENCY_MAP, SKILL_MAP } from '@/data/skills';
import { COURSES } from '@/data/courses';
import type { GapItem, MatchFactor, Profile, RoleMatch } from '@/lib/types';

// ─── Deterministic matching engine (no AI in the numbers) ──────────────────
// Published formula — displayed in the UI and in the methodology view:
//
//   match score = 0.40 × skill overlap
//               + 0.30 × transferable adjacent skills
//               + 0.20 × experience parity
//               + 0.10 × interest fit
//
// The LLM narrator (/api/coach) only ever EXPLAINS this output.

export const FORMULA = [
  { key: 'overlap', weight: 0.4, label: 'Skill overlap' },
  { key: 'transferable', weight: 0.3, label: 'Transferable adjacent skills' },
  { key: 'experience', weight: 0.2, label: 'Experience parity' },
  { key: 'interest', weight: 0.1, label: 'Interest fit' },
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
  for (const interest of profile.interests) {
    const hits = map[interest] ?? [interest];
    if (hits.some((h) => cat.includes(h))) return 1;
  }
  return profile.interests.length ? 0.25 : 0.5;
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
  let overlapScore = 0;
  const gap: GapItem[] = [];
  for (const req of role.skills) {
    const lvl = userSkills[req.skill] ?? 0;
    const fit = Math.min(lvl, req.minLevel) / req.minLevel;
    overlapScore += req.weight * fit;
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
  overlapScore = overlapScore / totalWeight;

  // 2) Transferable credit: adjacent skills the user already has
  let transferScore = 0;
  for (const req of role.skills) {
    const lvl = userSkills[req.skill] ?? 0;
    if (lvl >= req.minLevel) continue;
    const need = req.minLevel - lvl;
    let best = 0;
    for (const [ownSlug, ownLvl] of Object.entries(userSkills)) {
      if (ownLvl <= 0) continue;
      const w = ADJACENCY_MAP[req.skill]?.[ownSlug] ?? 0;
      if (w > 0) best = Math.max(best, (ownLvl / 5) * w);
    }
    transferScore += req.weight * Math.min(1, best) * Math.min(1, need / req.minLevel);
  }
  transferScore = Math.min(1, transferScore / totalWeight / 0.7); // cap contribution

  // 3) Experience parity + 4) interest fit
  const expScore = experienceParity(profile, role.experience, role.entryLevel);
  const intScore = interestFit(profile, role.category);

  const score =
    FORMULA[0].weight * overlapScore +
    FORMULA[1].weight * transferScore +
    FORMULA[2].weight * expScore +
    FORMULA[3].weight * intScore;

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
    { label: 'Skill overlap', value: overlapScore, weight: 0.4 },
    { label: 'Transferable skills', value: transferScore, weight: 0.3 },
    { label: 'Experience fit', value: expScore, weight: 0.2 },
    { label: 'Interest fit', value: intScore, weight: 0.1 },
  ];

  return {
    roleSlug,
    score: Math.round(score * 100),
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
    .sort((a, b) => b.score - a.score);
}

// ─── Harada-style skill matrix ─────────────────────────────────────────────
// Inspired by the Harada Method's Skill Map: current self-rating vs the
// target role's required minimum, per skill. Feeds the gap heatmap.

export function haradaMatrix(
  profile: Profile,
  roleSlug: string,
): Array<{ skill: string; name: string; current: number; required: number; category: string; momentum: number }> {
  const role = ROLE_MAP[roleSlug];
  if (!role) return [];
  return role.skills
    .map((req) => ({
      skill: req.skill,
      name: SKILL_MAP[req.skill]?.name ?? req.skill,
      current: profile.skills?.[req.skill] ?? 0,
      required: req.minLevel,
      category: SKILL_MAP[req.skill]?.category ?? '',
      momentum: 0,
    }))
    .sort((a, b) => (b.required - b.current) - (a.required - a.current));
}
