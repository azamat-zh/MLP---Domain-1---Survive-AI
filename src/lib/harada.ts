import { ROLE_MAP } from '@/data/roles';
import { SKILL_MAP } from '@/data/skills';
import type { Profile } from '@/lib/types';

export interface HaradaTask {
  id: string;
  title: string;
  description: string;
  hours: number;
}

export interface HaradaArea {
  id: string;
  title: string;
  skills: string[];
  alreadyMeetsRequirements: boolean;
  tasks: HaradaTask[];
}

export interface HaradaPlan {
  roleSlug: string;
  title: string;
  sdgTags: number[];
  sdgExplanation: string;
  areas: HaradaArea[];
}

const SUPPORT_AREAS = [
  'Portfolio',
  'Interview preparation',
  'Professional communication',
  'Job search',
  'Responsible practice',
  'Learning habits',
  'Industry research',
  'Career planning',
];

function createTasks(
  roleSlug: string,
  areaId: string,
  areaTitle: string,
  roleTitle: string,
  meetsRequirements: boolean,
): HaradaTask[] {
  const steps = [
    {
      key: 'assess',
      title: 'Assess your starting point',
      description: `Try a task involving ${areaTitle}. Record what you can do independently and where you need support.`,
      hours: 1,
    },
    {
      key: 'goal',
      title: 'Define a practical outcome',
      description: `Choose one result involving ${areaTitle} that is relevant to a ${roleTitle}. Write clear success criteria.`,
      hours: 1,
    },
    {
      key: 'learn',
      title: meetsRequirements ? 'Extend your knowledge' : 'Study the foundations',
      description: `Use a suitable learning resource for ${areaTitle}. Explain the main concepts in your own words.`,
      hours: meetsRequirements ? 2 : 4,
    },
    {
      key: 'practice',
      title: 'Complete guided practice',
      description: `Complete three exercises involving ${areaTitle}. Save the results and note any difficulties.`,
      hours: 3,
    },
    {
      key: 'project',
      title: 'Build a practical example',
      description: `Produce a small piece of work using ${areaTitle} in the context of a ${roleTitle}. Use public or synthetic data where relevant.`,
      hours: 4,
    },
    {
      key: 'review',
      title: 'Review and improve',
      description: 'Compare your work with your success criteria. Identify two weaknesses and improve the result.',
      hours: 2,
    },
    {
      key: 'explain',
      title: 'Explain your decisions',
      description: 'Prepare a written, audio or visual explanation of your approach, results and limitations.',
      hours: 1,
    },
    {
      key: 'reflect',
      title: 'Save evidence and reflect',
      description: 'Save your finished work in your portfolio. Record what you learned and choose a next step.',
      hours: 1,
    },
  ];

  return steps.map(({ key, ...step }) => ({
    ...step,
    id: `harada-v1:${roleSlug}:${areaId}:${key}`,
  }));
}

export function buildHaradaPlan(
  profile: Profile,
  roleSlug: string,
  momentum: Record<string, number> = {},
): HaradaPlan | null {
  const role = ROLE_MAP[roleSlug];
  if (!role) return null;

  const requirements = [...role.skills].sort((a, b) => {
    const missingA = (profile.skills[a.skill] ?? 0) < a.minLevel;
    const missingB = (profile.skills[b.skill] ?? 0) < b.minLevel;

    if (missingA !== missingB) return missingA ? -1 : 1;

    const priority = (item: typeof a) =>
      item.weight *
      (momentum[item.skill] ?? SKILL_MAP[item.skill]?.seedMomentum ?? 50);

    return priority(b) - priority(a) || a.skill.localeCompare(b.skill);
  });

  // Keep every required skill, grouping them if there are more than eight.
  const groups: Array<typeof requirements> = Array.from(
    { length: Math.min(8, requirements.length) },
    () => [],
  );

  requirements.forEach((item, index) => {
    groups[index % groups.length].push(item);
  });

  const areas: HaradaArea[] = groups.map((group) => {
    const skills = group.map((item) => item.skill).sort();
    const id = skills.join('+');
    const title = skills
      .map((skill) => SKILL_MAP[skill]?.name ?? skill)
      .join(' & ');

    const alreadyMeetsRequirements = group.every(
      (item) => (profile.skills[item.skill] ?? 0) >= item.minLevel,
    );

    return {
      id,
      title,
      skills,
      alreadyMeetsRequirements,
      tasks: createTasks(
        role.slug,
        id,
        title,
        role.title,
        alreadyMeetsRequirements,
      ),
    };
  });

  for (const title of SUPPORT_AREAS) {
    if (areas.length === 8) break;

    const id = `support-${title.toLowerCase().replaceAll(' ', '-')}`;

    areas.push({
      id,
      title,
      skills: [],
      alreadyMeetsRequirements: false,
      tasks: createTasks(role.slug, id, title, role.title, false),
    });
  }

  return {
    roleSlug: role.slug,
    title: role.title,
    sdgTags: role.sdgTags,
    sdgExplanation: role.sdgMechanism,
    areas,
  };
}