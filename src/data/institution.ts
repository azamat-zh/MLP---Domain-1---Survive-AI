import type { StudyField, StudentDef } from '@/lib/types';

// ─── TVET & University Career Centres (Student Advisory View) ──────────────
// Synthetic institutions, cohorts and syllabus mappings — no real student
// data (competition rule). Syllabus skill levels reflect typical diploma /
// degree coverage; the advisory view compares them against live market
// momentum to surface practical-skills gaps.

export const FIELDS_OF_STUDY: Array<{ id: StudyField; labelKey: string }> = [
  { id: 'cs', labelKey: 'field.cs' },
  { id: 'mecheng', labelKey: 'field.mecheng' },
  { id: 'business', labelKey: 'field.business' },
];

export interface SyllabusItem {
  skill: string;
  taughtLevel: number; // 0-5 coverage in the current syllabus
}

export const FIELD_SYLLABI: Record<StudyField, SyllabusItem[]> = {
  cs: [
    { skill: 'software-engineering', taughtLevel: 3 },
    { skill: 'python', taughtLevel: 3 },
    { skill: 'data-analysis', taughtLevel: 2 },
    { skill: 'machine-learning', taughtLevel: 1 },
    { skill: 'cloud', taughtLevel: 1 },
  ],
  mecheng: [
    { skill: 'iot', taughtLevel: 2 },
    { skill: 'robotics', taughtLevel: 2 },
    { skill: 'renewable-energy', taughtLevel: 1 },
    { skill: 'energy-efficiency', taughtLevel: 1 },
    { skill: 'project-management', taughtLevel: 1 },
  ],
  business: [
    { skill: 'business-analysis', taughtLevel: 2 },
    { skill: 'communication', taughtLevel: 3 },
    { skill: 'project-management', taughtLevel: 2 },
    { skill: 'digital-marketing', taughtLevel: 2 },
    { skill: 'data-analysis', taughtLevel: 1 },
  ],
};

// Which role categories each field's graduates typically target
export const FIELD_ROLE_CATEGORIES: Record<StudyField, string[]> = {
  cs: ['Technology', 'AI', 'Governance'],
  mecheng: ['Green Energy', 'AgriTech', 'Technology'],
  business: ['Business', 'Marketing', 'Service', 'Sustainability'],
};

// Synthetic cohort — 12 students across the three fields (4 each)
export const STUDENT_COHORT: StudentDef[] = [
  { id: 'st-amir', name: 'Amir (synthetic)', year: '3', field: 'cs', interests: ['technology', 'ai'],
    skills: { 'software-engineering': 3, python: 3, 'data-analysis': 2, 'machine-learning': 1 } },
  { id: 'st-kavya', name: 'Kavya (synthetic)', year: '2', field: 'cs', interests: ['technology'],
    skills: { 'software-engineering': 2, python: 3, cloud: 1 } },
  { id: 'st-zack', name: 'Zack (synthetic)', year: '4', field: 'cs', interests: ['technology', 'ai'],
    skills: { 'software-engineering': 3, python: 2, 'machine-learning': 2, 'prompt-engineering': 2 } },
  { id: 'st-huiyin', name: 'Hui Yin (synthetic)', year: '1', field: 'cs', interests: ['technology'],
    skills: { 'software-engineering': 1, python: 2 } },

  { id: 'st-danial', name: 'Danial (synthetic)', year: '3', field: 'mecheng', interests: ['green', 'technology'],
    skills: { iot: 2, robotics: 2, 'renewable-energy': 1 } },
  { id: 'st-shalini', name: 'Shalini (synthetic)', year: '2', field: 'mecheng', interests: ['technology'],
    skills: { robotics: 2, 'project-management': 1, 'critical-thinking': 2 } },
  { id: 'st-aiman', name: 'Aiman (synthetic)', year: '4', field: 'mecheng', interests: ['green', 'sustainability'],
    skills: { iot: 3, 'energy-efficiency': 2, 'ev-mobility': 1 } },
  { id: 'st-bengchong', name: 'Beng Chong (synthetic)', year: '1', field: 'mecheng', interests: ['green'],
    skills: { iot: 1, robotics: 1 } },

  { id: 'st-syafika', name: 'Nur Syafika (synthetic)', year: '3', field: 'business', interests: ['creative', 'business'],
    skills: { 'business-analysis': 2, 'digital-marketing': 3, communication: 3 } },
  { id: 'st-jiahaur', name: 'Jia Haur (synthetic)', year: '2', field: 'business', interests: ['business', 'people'],
    skills: { communication: 3, 'project-management': 2 } },
  { id: 'st-thivya', name: 'Thivya (synthetic)', year: '4', field: 'business', interests: ['business', 'technology'],
    skills: { 'business-analysis': 3, 'data-analysis': 2, 'ai-augmented-ops': 1 } },
  { id: 'st-aqil', name: 'Aqil (synthetic)', year: '1', field: 'business', interests: ['creative'],
    skills: { communication: 2, 'digital-marketing': 2 } },
];

export function cohortForField(field: StudyField | ''): StudentDef[] {
  if (!field) return STUDENT_COHORT;
  const filtered = STUDENT_COHORT.filter((s) => s.field === field);
  return filtered.length > 0 ? filtered : STUDENT_COHORT;
}
