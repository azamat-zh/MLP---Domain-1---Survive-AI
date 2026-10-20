'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  EmployerProfile, InstitutionProfile, Lang, Persona, Profile, ScenarioId, UserType,
} from '@/lib/types';

// ─── Client state: view machine + profile + scenario + progress ────────────
// The profile lives only in this browser (localStorage). No account, no
// server-side personal data — privacy by design for the POC.

export type View = 'landing' | 'onboarding' | 'dashboard' | 'employer' | 'institution' | 'signals';

interface SkillCastState {
  lang: Lang;
  view: View;
  userType: UserType | null;
  scenario: ScenarioId;
  profile: Profile;
  employer: EmployerProfile;
  institution: InstitutionProfile;
  chosenRole: string | null;
  completedCourses: string[];
  onboarded: boolean;
  dashTab: string;

  setLang: (l: Lang) => void;
  setView: (v: View) => void;
  setUserType: (u: UserType | null) => void;
  setScenario: (s: ScenarioId) => void;
  setProfile: (p: Partial<Profile>) => void;
  setEmployer: (p: Partial<EmployerProfile>) => void;
  setInstitution: (p: Partial<InstitutionProfile>) => void;
  setSkillLevel: (slug: string, level: number) => void;
  setChosenRole: (slug: string | null) => void;
  toggleCourse: (slug: string) => void;
  resetDemo: () => void;
  setDashTab: (tab: string) => void;
}

export const EMPTY_PROFILE: Profile = {
  persona: null,
  years: 0,
  interests: [],
  budget: 5,
  skills: {},
  inclusion: { dyslexia: false, visual: false, hearing: false, mobility: false, none: true },
  objective: '',
  cvScrub: null,
  intakeMode: null,
};

export const EMPTY_EMPLOYER: EmployerProfile = {
  company: '',
  industry: '',
  teamSize: 10,
  intake: '',
  matrixUrl: '',
  template: '',
  objective: '',
  timelineMonths: 6,
  budgetPref: '',
};

export const EMPTY_INSTITUTION: InstitutionProfile = {
  name: '',
  field: '',
  intake: '',
  focus: '',
  lowBandwidth: false,
};

export const useSkillCast = create<SkillCastState>()(
  persist(
    (set) => ({
      lang: 'en',
      view: 'landing',
      userType: null,
      scenario: 'moderate',
      profile: EMPTY_PROFILE,
      employer: EMPTY_EMPLOYER,
      institution: EMPTY_INSTITUTION,
      chosenRole: null,
      completedCourses: [],
      onboarded: false,
      dashTab: 'overview',

      setLang: (l) => set({ lang: l }),
      setView: (v) => set({ view: v }),
      setUserType: (u) => set({ userType: u }),
      setScenario: (s) => set({ scenario: s }),
      setProfile: (p) => set((st) => ({ profile: { ...st.profile, ...p } })),
      setEmployer: (p) => set((st) => ({ employer: { ...st.employer, ...p } })),
      setInstitution: (p) => set((st) => ({ institution: { ...st.institution, ...p } })),
      setSkillLevel: (slug, level) =>
        set((st) => {
          const skills = { ...st.profile.skills };
          if (level <= 0) delete skills[slug];
          else skills[slug] = level;
          return { profile: { ...st.profile, skills } };
        }),
      setChosenRole: (slug) => set({ chosenRole: slug }),
      toggleCourse: (slug) =>
        set((st) => ({
          completedCourses: st.completedCourses.includes(slug)
            ? st.completedCourses.filter((c) => c !== slug)
            : [...st.completedCourses, slug],
        })),
      setDashTab: (tab) => set({ dashTab: tab }),
      resetDemo: () =>
        set({
          view: 'landing',
          userType: null,
          profile: EMPTY_PROFILE,
          employer: EMPTY_EMPLOYER,
          institution: EMPTY_INSTITUTION,
          chosenRole: null,
          completedCourses: [],
          onboarded: false,
          scenario: 'moderate',
          dashTab: 'overview',
        }),
    }),
    {
      name: 'skillcast-poc',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        lang: s.lang,
        scenario: s.scenario,
        userType: s.userType,
        profile: s.profile,
        employer: s.employer,
        institution: s.institution,
        chosenRole: s.chosenRole,
        completedCourses: s.completedCourses,
        onboarded: s.onboarded,
      }),
    },
  ),
);

// Personas for onboarding UI
export const PERSONAS: Array<{ id: Persona; labelKey: string; descKey: string }> = [
  { id: 'working-adult', labelKey: 'persona.working-adult', descKey: 'persona.working-adult.d' },
  { id: 'fresh-grad', labelKey: 'persona.fresh-grad', descKey: 'persona.fresh-grad.d' },
  { id: 'switcher', labelKey: 'persona.switcher', descKey: 'persona.switcher.d' },
  { id: 'tvet-student', labelKey: 'persona.tvet-student', descKey: 'persona.tvet-student.d' },
];

export const INTERESTS = [
  'technology', 'ai', 'business', 'people', 'education',
  'service', 'health', 'green', 'sustainability', 'creative',
] as const;
