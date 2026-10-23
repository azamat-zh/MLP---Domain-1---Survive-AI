// @ts-expect-error Bun provides this runtime API; shared main has no Bun ambient types.
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { COURSES } from '../src/data/courses';
import { ROLES } from '../src/data/roles';
import { TEAM, DEPT_TEMPLATES, resolveRoster } from '../src/data/team';
import { matchRole } from '../src/lib/matching';
import { makeT } from '../src/lib/i18n';
import { localizeHrCourse } from '../src/lib/hr-i18n';
import type { EmployerProfile, Lang, TeamMemberDef } from '../src/lib/types';

// Synthetic setup only. Render the real component without localStorage,
// providers with network effects, or any database/API imports.
const defaultEmployer: EmployerProfile = {
  company: 'Synthetic review company', industry: 'banking', teamSize: 5000,
  intake: 'matrix', template: '', matrixUrl: '', objective: 'transition',
  timelineMonths: 6, budgetPref: 'free',
};
let state = { employer: { ...defaultEmployer }, lang: 'en' as Lang, setView: () => {}, setUserType: () => {} };
mock.module('../src/lib/store', () => ({
  useSkillCast: (selector?: (value: typeof state) => unknown) => selector ? selector(state) : state,
}));
const { EmployerView, summarizeTargetRole, HR_DEMO_PROGRESS } = await import('../src/components/skillcast/employer');

beforeEach(() => { state = { ...state, employer: { ...defaultEmployer }, lang: 'en' }; });

function profile(member: TeamMemberDef) {
  return {
    persona: member.persona, years: member.years, interests: member.interests,
    skills: member.skills, budget: 5, objective: '', cvScrub: null, intakeMode: 'form' as const,
    inclusion: { dyslexia: false, visual: false, hearing: false, mobility: false, none: true },
  };
}

describe('synthetic roster and selected-target planning', () => {
  test('empty roster has finite zero readiness and no recommendations', () => {
    const plan = summarizeTargetRole([], 'ai-ops-specialist', {});
    expect(plan.readiness).toBe(0);
    expect(plan.teamGaps).toEqual([]);
    expect(plan.training).toEqual([]);
  });

  for (const intake of ['matrix', 'batch', 'template'] as const) {
    test(`${intake}: denominators use synthetic members, not headcount or template totals`, () => {
      state.employer.intake = intake;
      state.employer.template = DEPT_TEMPLATES.find((item) => item.totalStaff > item.shownMembers.length)!.id;
      const roster = resolveRoster(state.employer);
      const plan = summarizeTargetRole(roster.members, 'ai-ops-specialist', {});
      expect(plan.memberMatches.length).toBe(roster.members.length);
      expect(plan.teamGaps.every(([, n]) => n <= roster.members.length)).toBe(true);
      expect(plan.training.every((item) => item.learners.size <= roster.members.length)).toBe(true);
      const html = renderToStaticMarkup(<EmployerView />);
      expect(html).toContain('5000');
      expect(html.includes(`${roster.members.length} synthetic profiles`)).toBe(true);
      expect(html).toContain('No real employees have been assessed');
      expect(html).not.toContain('more staff aggregated');
      const before = plan;
      state.employer.teamSize = 1;
      expect(summarizeTargetRole(resolveRoster(state.employer).members, 'ai-ops-specialist', {})).toEqual(before);
    });
  }

  test('changing target role changes readiness, gaps, and course recommendations', () => {
    const roleA = ROLES.find((role) => role.slug === 'ai-ops-specialist')!;
    const roleB = ROLES.find((role) => role.skills.some((req) =>
      !roleA.skills.some((other) => other.skill === req.skill) && COURSES.some((course) => course.skills.includes(req.skill))))!;
    const fixture: TeamMemberDef[] = [{
      ...TEAM[0], id: 'synthetic-review-only',
      skills: Object.fromEntries(roleA.skills.map((req) => [req.skill, 5])),
    }];
    const a = summarizeTargetRole(fixture, roleA.slug, {});
    const b = summarizeTargetRole(fixture, roleB.slug, {});
    expect(a.readiness).toBe(100);
    expect(b.readiness).toBeLessThan(a.readiness);
    expect(a.teamGaps).toEqual([]);
    expect(b.teamGaps.length).toBeGreaterThan(0);
    expect(a.training).toEqual([]);
    expect(b.training.length).toBeGreaterThan(0);
    for (const role of [roleA, roleB]) {
      expect(summarizeTargetRole(fixture, role.slug, {}).readiness).toBe(matchRole(profile(fixture[0]), role.slug, {})!.skillReadiness);
    }
  });

  test('all target gaps keep the existing count ordering and top-five planning limit', () => {
    for (const role of ROLES) {
      const expected = new Map<string, number>();
      for (const member of TEAM) {
        for (const gap of matchRole(profile(member), role.slug, {})!.gap) {
          expected.set(gap.skill, (expected.get(gap.skill) ?? 0) + 1);
        }
      }
      expect(summarizeTargetRole(TEAM, role.slug, {}).teamGaps).toEqual(
        [...expected].sort((a, b) => b[1] - a[1]).slice(0, 5),
      );
    }
  });

  test('courses covering multiple gaps count each recommended learner once', () => {
    const fixture = TEAM.slice(0, 2).map((member, i) => ({ ...member, id: `synthetic-${i}`, skills: {} }));
    const plan = summarizeTargetRole(fixture, 'ai-ops-specialist', {});
    expect(plan.training.some((item) => item.skills.size > 1)).toBe(true);
    expect(new Set(plan.training.map((item) => item.course.slug)).size).toBe(plan.training.length);
    for (const item of plan.training) {
      expect(item.learners.size).toBe(2);
      expect([...item.learners].sort()).toEqual(['synthetic-0', 'synthetic-1']);
      expect(item.course).toEqual(COURSES.find((course) => course.slug === item.course.slug)!);
      expect([...item.skills].every((skill) => item.course.skills.includes(skill))).toBe(true);
    }
  });

  test('live momentum still reaches the selected-role matching engine', () => {
    const momentum = { 'data-analysis': 100, 'prompt-engineering': 1, 'ai-augmented-ops': 75 };
    const plan = summarizeTargetRole(TEAM, 'ai-ops-specialist', momentum);
    for (const item of plan.memberMatches) {
      expect(item.selected).toEqual(matchRole(profile(item.member), 'ai-ops-specialist', momentum));
    }
  });
});

describe('preserved plan and honest illustrative content', () => {
  for (const lang of ['en', 'ms', 'zh', 'ru'] as const) {
    test(`${lang}: rendered HR cards localize registry text, hours and SDG accessibility labels`, () => {
      state.lang = lang;
      state.employer.intake = 'batch';
      state.employer.objective = 'risk';
      const t = makeT(lang);
      const html = renderToStaticMarkup(<EmployerView />);
      expect(html).toContain(t('hr.role.ai-ops-specialist.title'));
      expect(html).toContain(t('hr.person.Employee 01 (batch, synthetic)'));
      expect(html).toContain(t('hr.department.Batch intake'));
      expect(html).toContain(t('hr.job.Customer Service Officer'));
      expect(html).toContain(t('hr.skill.prompt-engineering').replaceAll('&', '&amp;'));
      expect(html).toContain(t('emp.hr.hours', { n: 8 }));
      expect(html).toContain(t('hr.study.hours', { n: 120 }));
      expect(html).toContain(t('hr.month.range', { start: 1, end: 2 }));
      expect(html).toContain(`aria-label="${t('hr.sdg.label', { n: 8 })}"`);
      expect(html).not.toContain('hr.role.');
      expect(html).not.toContain('hr.person.');
      expect(html).not.toContain('hr.job.');
      expect(html).not.toContain('hr.department.');
      expect(html).not.toContain('hr.skill.');
      expect((html.match(/data-testid="hr-skill-column"/g) ?? []).length).toBeGreaterThan(0);
      expect(html).toContain(t('hr.signals.heatmap.levels'));
      expect(html).toContain(t('hr.signals.status.loading'));
      expect(html).not.toContain('data-testid="hr-live-signal"');
      if (lang !== 'en') {
        expect(html).not.toContain(' automation exposure"');
        for (const role of ROLES) expect(html).not.toContain(role.title.replaceAll('&', '&amp;'));
        expect(html).not.toContain('Employee 01');
        expect(html).not.toContain('Batch intake');
        expect(html).not.toContain('Customer Service Officer');
        expect(html).not.toContain('120 h');
      }
      for (const course of summarizeTargetRole(resolveRoster(state.employer).members, 'ai-ops-specialist', {}).training) {
        const label = localizeHrCourse(course.course, t);
        expect(html).toContain(label.title.replaceAll('&', '&amp;'));
        expect(html).toContain(label.provider.replaceAll('&', '&amp;'));
      }
    });
  }

  test('HR headers and budget scope are localized without hiding gap labels on mobile', () => {
    for (const lang of ['en', 'ms', 'zh', 'ru'] as const) {
      state.lang = lang;
      const html = renderToStaticMarkup(<EmployerView />);
      expect(html).not.toContain('>Team</th>');
      expect(html).not.toContain(' top skills<');
    }
    const source = readFileSync(new URL('../src/components/skillcast/employer.tsx', import.meta.url), 'utf8');
    expect(source).toContain("t('emp.hr.budget.scope')");
    expect(source).toContain('max-w-full gap-1 whitespace-normal text-left bg-teal-700');
    expect(source).toContain('flex flex-col items-start gap-1 text-sm sm:flex-row');
    expect(source).not.toContain('className="truncate">{SKILL_MAP[slug]');
  });

  test('progress is a constant synthetic example, not attendance or completion', () => {
    const html = renderToStaticMarkup(<EmployerView />);
    expect(HR_DEMO_PROGRESS).toEqual({ percent: 45, completedHours: 18, plannedHours: 40 });
    expect(HR_DEMO_PROGRESS.percent).toBe(HR_DEMO_PROGRESS.completedHours / HR_DEMO_PROGRESS.plannedHours * 100);
    expect(html).toContain('18 of 40 synthetic example hours · not tracked');
    expect(html).toContain('Not collected');
    for (const goal of [4, 8, 9]) expect(html).toContain(`SDG ${goal} ·`);
    expect(html).toContain('not predictions of layoffs');
    expect(html).toContain('protected learning time');
  });

  test('long HR labels wrap rather than truncate, and budget categories stack on small screens', () => {
    const source = readFileSync(new URL('../src/components/skillcast/employer.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('truncate');
    expect(source).toContain('line-clamp-none');
    expect(source).toContain('data-[size=default]:h-auto');
    expect(source).toContain('max-w-full whitespace-normal text-left');
    expect(source).toContain('grid min-w-0 gap-3 sm:grid-cols-2');
    const onboarding = readFileSync(new URL('../src/components/skillcast/onboarding.tsx', import.meta.url), 'utf8');
    expect(onboarding).toContain('grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4');
    expect(onboarding).toContain('h-auto min-h-9 max-w-full gap-2 whitespace-normal text-left');
  });

  test('an unset budget preference does not falsely claim HRD priority', () => {
    state.employer.budgetPref = '';
    for (const lang of ['en', 'ms', 'zh', 'ru'] as const) {
      state.lang = lang;
      const html = renderToStaticMarkup(<EmployerView />);
      expect(html).toContain(makeT(lang)('hr.budget.preference.unset'));
      expect(html).not.toContain(makeT(lang)('emp.budget.hrd.first'));
    }
  });

  test('budget totals still follow the existing first-course and covered-skill algorithm', () => {
    const plan = summarizeTargetRole(TEAM, 'ai-ops-specialist', {});
    let freeHours = 0, hrdHours = 0;
    const covered = new Set<string>();
    for (const [slug] of plan.teamGaps) {
      if (covered.has(slug)) continue;
      const course = COURSES.find((item) => item.skills.includes(slug));
      if (!course) continue;
      if (course.hrdClaimable || !course.free) hrdHours += course.totalHours;
      else freeHours += course.totalHours;
      course.skills.forEach((skill) => covered.add(skill));
    }
    for (const budgetPref of ['free', 'hrd'] as const) {
      state.employer.budgetPref = budgetPref;
      const html = renderToStaticMarkup(<EmployerView />);
      expect(html.includes(`>${makeT(state.lang)('hr.study.hours', { n: freeHours })}<`)).toBe(true);
      expect(html.includes(`>${makeT(state.lang)('hr.study.hours', { n: hrdHours })}<`)).toBe(true);
    }
  });

  for (const months of [3, 6, 12] as const) {
    test(`${months}-month timeline retains its three phases and internship pipeline`, () => {
      state.employer.timelineMonths = months;
      const html = renderToStaticMarkup(<EmployerView />);
      const phase = Math.max(1, Math.round(months / 3));
      for (const range of [`M1–M${phase}`, `M${phase + 1}–M${phase * 2}`, `M${phase * 2 + 1}–M${months}`]) expect(html).toContain(range);
      expect(html).toContain('Internship pipeline');
      expect(html).toContain('Target role');
      expect(html).toContain('overflow-x-auto');
    });
  }

  test('employer picker has no content processing or filename-display behavior', () => {
    const source = readFileSync(new URL('../src/components/skillcast/onboarding.tsx', import.meta.url), 'utf8');
    const intake = source.slice(source.indexOf('function EmployerStepIntake()'), source.indexOf('function EmployerStepObjective()'));
    expect(intake).toContain('type="file"');
    expect(intake).toContain('accept=".zip,.csv,.txt"');
    expect(intake).toContain("t('onb.emp.intake.batch.notice')");
    expect(intake).toContain('fileRef.current?.click()');
    expect(intake).not.toMatch(/FileReader|\.text\(|\.arrayBuffer\(|FormData|fetch\(|scrubCV|BATCH_CVS|\.files|files\[/);
    const input = intake.match(/<input[\s\S]*?\/>/)![0];
    expect(input).not.toContain('onChange');
    expect(source).toContain('privacyNote={false}');
  });
});
