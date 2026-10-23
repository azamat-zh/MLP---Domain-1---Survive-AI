import verifiedRoles from "../data/verified_roles.json";

export interface UserProfile {
  skills: string[];
  interests: string[];
  experienceYears: number;
  age?: number;
  gender?: string;
}

export interface RoleScore {
  roleId: string;
  roleTitle: string;
  score: number;
  readinessScore: number;
  futurePotentialScore: number;
  missingSkills: string[];
  recommendedCourses: Array<{ title: string; platform: string; url: string }>;
}

export type StrategyType = 
  | "QUICK_SKILL_UP"
  | "DEEP_RESKILLING"
  | "SIDE_PROJECT"
  | "CAREER_PIVOT";

export interface StrategyRecommendation {
  type: StrategyType;
  title: string;
  description: string;
  nextSteps: string[];
}

export function calculateRoleScores(
  user: UserProfile,
  trendMultiplier: number = 1.0
): RoleScore[] {
  return verifiedRoles.map((role) => {
    const matchedSkills = role.required_skills.filter((skill) =>
      user.skills.map((s) => s.toLowerCase()).includes(skill.toLowerCase())
    );

    const missingSkills = role.required_skills.filter(
      (skill) => !matchedSkills.includes(skill)
    );

    const matchRatio = matchedSkills.length / role.required_skills.length;
    const readinessScore = Math.min(
      100,
      Math.round(matchRatio * 70 + Math.min(user.experienceYears, 5) * 6)
    );

    const hasInterest = user.interests.some((interest) =>
      role.title.toLowerCase().includes(interest.toLowerCase())
    );
    const futurePotentialScore = Math.min(
      100,
      Math.round((readinessScore * 0.5 + (hasInterest ? 30 : 10)) * trendMultiplier)
    );

    const totalScore = Math.round((readinessScore + futurePotentialScore) / 2);

    return {
      roleId: role.id,
      roleTitle: role.title,
      score: totalScore,
      readinessScore,
      futurePotentialScore,
      missingSkills,
      recommendedCourses: role.verified_courses,
    };
  });
}

export function getStrategyRecommendation(score: RoleScore): StrategyRecommendation {
  if (score.readinessScore >= 70) {
    return {
      type: "QUICK_SKILL_UP",
      title: "Быстрый точечный апгрейд",
      description: "Вы близки к роли. Достаточно закрыть 1-2 недостающих навыка.",
      nextSteps: ["Пройти проверенный курс", "Обновить резюме под роль"]
    };
  } else if (score.futurePotentialScore >= 70 && score.readinessScore >= 40) {
    return {
      type: "CAREER_PIVOT",
      title: "Смежный переход",
      description: "Используйте имеющийся опыт для плавного перехода.",
      nextSteps: ["Сделать пет-проект на стыке сфер", "Пройти менторскую консультацию"]
    };
  } else if (score.readinessScore >= 40) {
    return {
      type: "SIDE_PROJECT",
      title: "Усиление практикой (Side-project)",
      description: "Не хватает реального практического опыта.",
      nextSteps: ["Участвовать в хакатоне", "Сделать кейс для портфолио"]
    };
  } else {
    return {
      type: "DEEP_RESKILLING",
      title: "Глубокая переквалификация",
      description: "Требуется системное обучение фундаментальным навыкам.",
      nextSteps: ["Записаться на базовый курс", "Составить план обучения"]
    };
  }
}

export function verifyFairness(
  baseProfile: UserProfile,
  alteredProfile: UserProfile
): boolean {
  const score1 = calculateRoleScores(baseProfile);
  const score2 = calculateRoleScores(alteredProfile);
  return JSON.stringify(score1) === JSON.stringify(score2);
}
