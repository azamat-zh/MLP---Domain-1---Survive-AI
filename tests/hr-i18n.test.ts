// @ts-expect-error Bun provides this runtime API; shared main has no Bun ambient types.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { LANGS, makeT } from '../src/lib/i18n';
import { HR_DICTIONARIES, localizeHrCourse } from '../src/lib/hr-i18n';
import { COURSES } from '../src/data/courses';
import { ROLES } from '../src/data/roles';
import { SKILLS } from '../src/data/skills';
import { TEAM, DEPT_TEMPLATES, resolveRoster } from '../src/data/team';
import type { Lang } from '../src/lib/types';

// Inspect raw dictionaries: makeT's English fallback must not hide missing
// translations. Use the already-installed TypeScript parser, not regex/eval.
const source = readFileSync(new URL('../src/lib/i18n.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('i18n.ts', source, ts.ScriptTarget.Latest, true);
const dictionaries = {} as Record<Lang, Record<string, string>>;
const duplicates: string[] = [];
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
      ['en', 'ms', 'zh', 'ru'].includes(node.name.text) && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
    const lang = node.name.text as Lang;
    const dict: Record<string, string> = {};
    for (const entry of node.initializer.properties) {
      if (!ts.isPropertyAssignment(entry) || !ts.isStringLiteral(entry.name) ||
          !ts.isStringLiteral(entry.initializer)) throw new Error(`Unsupported translation entry in ${lang}`);
      if (entry.name.text in dict) duplicates.push(`${lang}:${entry.name.text}`);
      dict[entry.name.text] = entry.initializer.text;
    }
    dictionaries[lang] = dict;
  }
  ts.forEachChild(node, visit);
}
visit(ast);
// Include the focused HR catalogue without allowing fallback or a silent
// collision with a base key to hide missing translations.
for (const lang of ['en', 'ms', 'zh', 'ru'] as const) {
  for (const key of Object.keys(HR_DICTIONARIES[lang])) {
    if (key in dictionaries[lang]) duplicates.push(`${lang}:${key}`);
  }
  dictionaries[lang] = { ...dictionaries[lang], ...HR_DICTIONARIES[lang] };
}
const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
const keys = Object.keys(dictionaries.en).sort();

describe('English, Malay, Chinese and Russian completeness', () => {
  test('editorial course descriptors and access notes translate without altering named resources or registry data', () => {
    const original = JSON.stringify(COURSES);
    for (const lang of ['en', 'ms', 'zh', 'ru'] as const) {
      const t = makeT(lang);
      for (const course of COURSES) {
        const label = localizeHrCourse(course, t);
        expect(label.title).not.toContain('hr.course.');
        expect(label.provider).not.toContain('hr.provider.');
        if (lang === 'en') {
          expect(label.title).toBe(course.title);
          expect(label.provider).toBe(course.provider);
        } else {
          expect(label.provider).not.toContain('(audit free)');
          expect(label.provider).not.toContain('(free)');
          expect(label.title).not.toContain('learning path');
          expect(label.title).not.toContain('learning plans');
          expect(label.title).not.toContain('registered providers');
        }
      }
      const official = COURSES.find((course) => course.slug === 'google-ai-essentials')!;
      expect(localizeHrCourse(official, t)).toEqual({ title: official.title, provider: official.provider });
      expect(t('emp.hrd.note')).toContain('HRD Corp');
      expect(t('emp.budget.hrd.first')).not.toContain('HRD Corp-трекам');
      for (const n of [0, 1, 3, 5]) expect(t('hr.course.count', { n })).toContain(String(n));
    }
    expect(makeT('ru')('hr.course.count', { n: 3 })).toBe('Курсы: 3');
    expect(makeT('ru')('emp.budget.split')).toContain('учебных часов');
    expect(JSON.stringify(COURSES)).toBe(original);
  });
  test('HR catalogue has unique keys and exactly four explicit string translations per row', () => {
    const catalog = readFileSync(new URL('../src/lib/hr-i18n.ts', import.meta.url), 'utf8');
    const tree = ts.createSourceFile('hr-i18n.ts', catalog, ts.ScriptTarget.Latest, true);
    const seen = new Set<string>();
    function check(node: ts.Node) {
      if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'COPY' &&
          node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
        for (const row of node.initializer.properties) {
          if (!ts.isPropertyAssignment(row) || !ts.isStringLiteral(row.name) ||
              !ts.isArrayLiteralExpression(row.initializer)) throw new Error('Invalid HR translation row');
          expect(seen.has(row.name.text), row.name.text).toBe(false);
          seen.add(row.name.text);
          expect(row.initializer.elements.length, row.name.text).toBe(4);
          expect(row.initializer.elements.every((entry) => ts.isStringLiteral(entry) && entry.text.trim().length > 0)).toBe(true);
        }
      }
      ts.forEachChild(node, check);
    }
    check(tree);
    expect([...seen].sort()).toEqual(Object.keys(HR_DICTIONARIES.en).sort());
  });

  test('all registry roles, skills, departments and synthetic identities have explicit translations', () => {
    const members = [...TEAM, ...DEPT_TEMPLATES.flatMap((template) => template.shownMembers),
      ...resolveRoster({ intake: 'batch', template: '' }).members];
    const dynamicKeys = [
      ...ROLES.flatMap((role) => ['title', 'tagline', 'signals'].map((field) => `hr.role.${role.slug}.${field}`)),
      ...SKILLS.map((skill) => `hr.skill.${skill.slug}`),
      ...members.flatMap((member) => [`hr.person.${member.name}`, `hr.job.${member.title}`, `hr.department.${member.dept}`]),
    ];
    for (const lang of ['en', 'ms', 'zh', 'ru'] as const) {
      const t = makeT(lang);
      for (const key of dynamicKeys) {
        expect(HR_DICTIONARIES[lang][key], `${lang}:${key}`).toBeDefined();
        expect(t(key), `${lang}:${key}`).toBe(HR_DICTIONARIES[lang][key]);
      }
      for (const role of ROLES) {
        if (lang !== 'en') expect(t(`hr.role.${role.slug}.title`)).not.toBe(role.title);
      }
    }
    for (const role of ROLES) {
      expect(makeT('en')(`hr.role.${role.slug}.title`)).toBe(role.title);
      expect(makeT('en')(`hr.role.${role.slug}.tagline`)).toBe(role.tagline);
      expect(makeT('en')(`hr.role.${role.slug}.signals`)).toBe(role.signalsNote);
    }
  });

  test('course-hour and total-hour labels are localized, with numeric values unchanged', () => {
    const totalHours = { en: '120 h', ms: '120 jam', zh: '120 小时', ru: '120 ч' };
    const perLearner = {
      en: 'Approximately 8 hours per learner', ms: 'Anggaran 8 jam bagi setiap peserta',
      zh: '每位学习者约需8小时', ru: 'Примерно 8 ч на участника',
    };
    for (const lang of ['en', 'ms', 'zh', 'ru'] as const) {
      expect(makeT(lang)('hr.study.hours', { n: 120 })).toBe(totalHours[lang]);
      expect(makeT(lang)('emp.hr.hours', { n: 8 })).toBe(perLearner[lang]);
    }
  });

  test('exactly four supported languages and no duplicate dictionary keys', () => {
    expect(LANGS.map((lang) => lang.code).sort()).toEqual(['en', 'ms', 'ru', 'zh']);
    expect(Object.keys(dictionaries).sort()).toEqual(['en', 'ms', 'ru', 'zh']);
    expect(duplicates).toEqual([]);
  });

  for (const lang of ['en', 'ms', 'zh', 'ru'] as const) {
    test(`${lang}: raw keys, nonempty values and placeholder multiplicity match English`, () => {
      expect(Object.keys(dictionaries[lang]).sort()).toEqual(keys);
      for (const key of keys) {
        const value = dictionaries[lang][key];
        expect(value.trim().length, `${lang}:${key}`).toBeGreaterThan(0);
        expect(placeholders(value), `${lang}:${key}`).toEqual(placeholders(dictionaries.en[key]));
      }
    });
    test(`${lang}: every key renders with no unresolved placeholders`, () => {
      const t = makeT(lang);
      for (const key of keys) {
        const vars = Object.fromEntries(placeholders(dictionaries.en[key]).map((name) => [name, `synthetic-${name}`]));
        expect(t(key, vars), `${lang}:${key}`).not.toMatch(/\{\w+\}/);
        expect(t(key, vars), `${lang}:${key}`).not.toBe(key);
      }
      expect(t('emp.hr.learners', { n: 2, total: 8 })).toContain('2/8');
      expect(t('emp.hr.readiness.note', { role: 'Synthetic target', n: 8 })).toContain('Synthetic target');
    });
  }

  test('literal HR translation usages exist in every raw dictionary', () => {
    for (const filename of ['../src/components/skillcast/employer.tsx', '../src/components/skillcast/onboarding.tsx', '../src/components/skillcast/signalsview.tsx', '../src/components/skillcast/hr-market-signals.tsx', '../src/app/page.tsx']) {
      const component = readFileSync(new URL(filename, import.meta.url), 'utf8');
      for (const match of component.matchAll(/t\('(emp\.[^']+|onb\.emp\.[^']+|hr\.[^']+)'/g)) {
        for (const lang of ['en', 'ms', 'zh', 'ru'] as const) expect(dictionaries[lang][match[1]], `${lang}:${match[1]}`).toBeDefined();
      }
    }
  });

  test('selection copy explicitly denies processing and filename display', () => {
    const notice = makeT('en')('onb.emp.intake.batch.notice');
    expect(notice).toContain('does not upload, read, import, or process');
    expect(notice).toContain('does not display filenames');
    expect(makeT('en')('onb.emp.intake.batch.btn')).toBe('Choose file · synthetic demo');
  });
});
