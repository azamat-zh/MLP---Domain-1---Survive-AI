'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Building2, CalendarClock, Check, ClipboardList,
  ClipboardCheck, FileArchive, FileWarning, Gauge, Globe, GraduationCap, LayoutTemplate,
  Link as LinkIcon, ListChecks, Rocket, ScanSearch, ShieldCheck, Target, Upload, User, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SKILLS, SKILL_CATEGORIES, SKILL_MAP } from '@/data/skills';
import { BATCH_CVS, DEPT_TEMPLATES, INDUSTRIES } from '@/data/team';
import { FIELDS_OF_STUDY } from '@/data/institution';
import { scrubCV } from '@/lib/cv';
import { INTERESTS, PERSONAS, useSkillCast } from '@/lib/store';
import type { EmployerObjective, UserType } from '@/lib/types';
import { LevelPicker, useT } from './shared';
import { CvStep } from './cv-step';

// ─── Onboarding router: three tracks ────────────────────────────────────────

export function Onboarding() {
  const { userType } = useSkillCast();
  if (userType === 'employer') return <EmployerOnboarding />;
  if (userType === 'institution') return <InstitutionOnboarding />;
  if (userType === 'individual') return <IndividualOnboarding />;
  return <StepUserType />;
}

// ─── Step 0: who is planning? ──────────────────────────────────────────────

const USER_TYPES: Array<{
  id: UserType; icon: typeof User; labelKey: string; descKey: string; exampleKey: string;
}> = [
  { id: 'individual', icon: User, labelKey: 'onb.ut.individual', descKey: 'onb.ut.individual.d', exampleKey: 'onb.ut.individual.ex' },
  { id: 'employer', icon: Building2, labelKey: 'onb.ut.employer', descKey: 'onb.ut.employer.d', exampleKey: 'onb.ut.employer.ex' },
  { id: 'institution', icon: GraduationCap, labelKey: 'onb.ut.institution', descKey: 'onb.ut.institution.d', exampleKey: 'onb.ut.institution.ex' },
];

function StepUserType() {
  const t = useT();
  const { setUserType } = useSkillCast();
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('onb.ut.q')}</CardTitle>
          <CardDescription>{t('onb.ut.d')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label={t('onb.ut.q')}>
            {USER_TYPES.map((u) => (
              <button
                key={u.id}
                type="button"
                role="radio"
                aria-checked={false}
                onClick={() => setUserType(u.id)}
                className="group flex h-full flex-col rounded-xl border p-4 text-left transition-colors hover:border-teal-500 hover:bg-teal-50/50 dark:hover:border-teal-500 dark:hover:bg-teal-950/30"
              >
                <u.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" aria-hidden />
                <span className="mt-2 font-semibold">{t(u.labelKey)}</span>
                <span className="mt-1 text-sm text-muted-foreground">{t(u.descKey)}</span>
                <span className="mt-3 text-xs italic text-muted-foreground/80">{t(u.exampleKey)}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Shared onboarding shell (progress + nav) ──────────────────────────────

function OnboardingShell({
  step, total, title, desc, icon: Icon, onBack, onNext, nextDisabled, children, finish, privacyNote, hideNext,
}: {
  step: number; total: number; title: string; desc?: string; icon: typeof User;
  onBack: () => void; onNext: () => void; nextDisabled: boolean; children: React.ReactNode;
  finish?: () => void; privacyNote?: boolean; hideNext?: boolean;
}) {
  const t = useT();
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <div className="mt-6 flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          {t('onb.step')} {step} {t('onb.of')} {total}
        </span>
        <Progress value={(step / total) * 100} className="h-1.5 flex-1" aria-label={`Step ${step} of ${total}`} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden /> {title}
          </CardTitle>
          {desc && <CardDescription className="leading-relaxed">{desc}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> {t('common.back')}
        </Button>
        {step < total || !finish ? (
          hideNext ? null : (
            <Button
              onClick={onNext}
              disabled={nextDisabled}
              className="gap-1 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              {t('common.next')} <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          )
        ) : (
          <Button onClick={finish} className="gap-2 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500">
            <Rocket className="h-4 w-4" aria-hidden /> {t('onb.finish')}
          </Button>
        )}
      </div>
      {privacyNote && (
        <p className="mt-2 text-right text-xs text-muted-foreground">
          <ShieldCheck className="mr-1 inline h-3 w-3" aria-hidden />
          {t('onb.privacy.browser')}
        </p>
      )}
    </div>
  );
}

// ═══ Individual track (existing 5-step flow) ════════════════════════════════

const TOTAL_STEPS = 5;

function IndividualOnboarding() {
  const t = useT();
  const { profile, setProfile, setUserType } = useSkillCast();
  const [step, setStep] = useState(1);

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return profile.persona !== null;
      case 2: return profile.interests.length > 0 && profile.budget >= 1;
      case 3:
        // CV intake only advances once extraction actually filled the profile
        // (intakeMode is set before the async LLM call completes); the guided
        // checklist path advances immediately — no extraction involved.
        return profile.intakeMode === 'form' ||
          (profile.intakeMode === 'cv' && Object.keys(profile.skills).length > 0);
      case 4: return Object.keys(profile.skills).length > 0;
      default: return true;
    }
  }, [step, profile]);

  const finish = () => useSkillCast.setState({ onboarded: true, view: 'dashboard' });
  const back = step === 1 ? () => setUserType(null) : () => setStep((s) => Math.max(1, s - 1));

  const titles = [
    t('onb.persona.q'),
    t('onb.interests.q'),
    t('onb.cv.title'),
    t('onb.skills.title'),
    t('onb.inclusion.title'),
  ];

  return (
    <OnboardingShell
      step={step}
      total={TOTAL_STEPS}
      title={titles[step - 1]}
      desc={step === 1 ? 'Aiversecity — Future-Ready Workforce' : step === 2 ? t('onb.budget.hint') : undefined}
      icon={step === 3 ? Upload : step === 4 ? ClipboardList : step === 5 ? ShieldCheck : User}
      onBack={back}
      onNext={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
      nextDisabled={!canNext}
      finish={finish}
      privacyNote={step === 3}
      hideNext={step === 3}
    >
      {step === 1 && <StepPersona />}
      {step === 2 && <StepInterests />}
      {step === 3 && <CvStep onDone={() => setStep(4)} />}
      {step === 4 && <StepSkills />}
      {step === 5 && <StepInclusion />}
    </OnboardingShell>
  );
}

// ═══ Employer track (4 steps) ═══════════════════════════════════════════════

function EmployerOnboarding() {
  const t = useT();
  const { employer, setEmployer, setUserType } = useSkillCast();
  const [step, setStep] = useState(1);

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return employer.company.trim().length >= 2 && employer.industry !== '' && employer.teamSize >= 1;
      case 2:
        if (employer.intake === 'batch') return true;
        if (employer.intake === 'matrix') return employer.matrixUrl.trim().length >= 6;
        return employer.intake === 'template' && employer.template !== '';
      case 3: return employer.objective !== '';
      case 4: return employer.budgetPref !== '';
      default: return true;
    }
  }, [step, employer]);

  const finish = () => useSkillCast.setState({ onboarded: true, view: 'employer' });
  const back = step === 1 ? () => setUserType(null) : () => setStep((s) => Math.max(1, s - 1));

  const titles = [t('onb.emp.step1.q'), t('onb.emp.step2.q'), t('onb.emp.step3.q'), t('onb.emp.step4.q')];

  return (
    <OnboardingShell
      step={step}
      total={4}
      title={titles[step - 1]}
      desc={step === 2 ? t('onb.emp.step2.d') : undefined}
      icon={step === 1 ? Building2 : step === 2 ? FileArchive : step === 3 ? Target : CalendarClock}
      onBack={back}
      onNext={() => setStep((s) => Math.min(4, s + 1))}
      nextDisabled={!canNext}
      finish={finish}
      privacyNote={step === 2 && employer.intake === 'batch'}
    >
      {step === 1 && <EmployerStepOrg />}
      {step === 2 && <EmployerStepIntake />}
      {step === 3 && <EmployerStepObjective />}
      {step === 4 && <EmployerStepParams />}
    </OnboardingShell>
  );
}

// Step 1: Organization details
function EmployerStepOrg() {
  const t = useT();
  const { employer, setEmployer } = useSkillCast();
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="company">{t('onb.emp.company')}</Label>
        <Input
          id="company"
          value={employer.company}
          onChange={(e) => setEmployer({ company: e.target.value })}
          placeholder={t('onb.emp.company.ph')}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label>{t('onb.emp.industry')}</Label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t('onb.emp.industry')}>
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.id}
              type="button"
              role="radio"
              aria-checked={employer.industry === ind.id}
              onClick={() => setEmployer({ industry: ind.id })}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                employer.industry === ind.id
                  ? 'border-teal-600 bg-teal-50 font-medium ring-1 ring-teal-300 dark:border-teal-500 dark:bg-teal-950 dark:ring-teal-800'
                  : 'border-border hover:border-teal-400'
              }`}
            >
              {t(ind.labelKey)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="teamsize">{t('onb.emp.size')}</Label>
        <Input
          id="teamsize"
          type="number"
          min={1}
          max={5000}
          value={employer.teamSize}
          onChange={(e) => setEmployer({ teamSize: Math.max(1, Number(e.target.value) || 1) })}
          className="mt-1.5 max-w-32"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">{t('onb.emp.size.hint')}</p>
      </div>
    </div>
  );
}

// Shared module-level intake option card (avoids components created during render)
function IntakeOption({
  selected, icon: Icon, title, desc, onSelect, children,
}: {
  selected: boolean; icon: typeof Upload; title: string; desc: string; onSelect: () => void; children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        selected
          ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-300 dark:border-teal-500 dark:bg-teal-950/40 dark:ring-teal-800'
          : 'border-border'
      }`}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 text-left">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
        <span className="flex-1">
          <span className="flex items-center gap-2 font-medium">
            {title}
            {selected && <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{desc}</span>
        </span>
      </button>
      {selected && children}
    </div>
  );
}

// Step 2: Team profile intake
function EmployerStepIntake() {
  const t = useT();
  const { employer, setEmployer } = useSkillCast();
  const fileRef = useRef<HTMLInputElement>(null);

  // Batch demo: run the same in-browser scrubber over the synthetic batch
  const scrubStats = useMemo(() => {
    let items = 0;
    const kinds = new Set<string>();
    for (const cv of BATCH_CVS) {
      const r = scrubCV(cv);
      items += r.items.length;
      r.items.forEach((i) => kinds.add(i.kind));
    }
    return { cvs: BATCH_CVS.length, items, kinds: [...kinds] };
  }, []);

  const sortedTemplates = useMemo(() => {
    return [...DEPT_TEMPLATES].sort((a, b) => {
      const aMatch = a.industry === employer.industry ? 0 : 1;
      const bMatch = b.industry === employer.industry ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [employer.industry]);

  return (
    <div className="space-y-4">
      <IntakeOption
        selected={employer.intake === 'batch'}
        icon={Upload}
        title={t('onb.emp.intake.batch')}
        desc={t('onb.emp.intake.batch.d')}
        onSelect={() => setEmployer({ intake: 'batch' })}
      >
        <div className="mt-3 space-y-2 pl-8">
          <input
            ref={fileRef}
            type="file"
            accept=".zip,.csv,.txt"
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2">
            <ScanSearch className="h-4 w-4" aria-hidden /> {t('onb.emp.intake.batch.btn')}
          </Button>
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
              <p className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                {t('onb.emp.intake.batch.report', { cvs: scrubStats.cvs, items: scrubStats.items })}
              </p>
              {scrubStats.kinds.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {scrubStats.kinds.map((k) => (
                    <Badge key={k} variant="outline" className="gap-1 border-emerald-400 bg-white/60 text-[11px] text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <FileWarning className="h-3 w-3" aria-hidden /> {k}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="mt-1.5 text-xs text-emerald-800/80 dark:text-emerald-300/80">{t('scrub.keep')}</p>
          </div>
        </div>
      </IntakeOption>

      <IntakeOption
        selected={employer.intake === 'matrix'}
        icon={LinkIcon}
        title={t('onb.emp.intake.matrix')}
        desc={t('onb.emp.intake.matrix.d')}
        onSelect={() => setEmployer({ intake: 'matrix' })}
      >
        <div className="mt-3 pl-8">
          <Input
            value={employer.matrixUrl}
            onChange={(e) => setEmployer({ matrixUrl: e.target.value })}
            placeholder="https://docs.google.com/…"
            aria-label={t('onb.emp.intake.matrix')}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{t('onb.emp.intake.matrix.note')}</p>
        </div>
      </IntakeOption>

      <IntakeOption
        selected={employer.intake === 'template'}
        icon={LayoutTemplate}
        title={t('onb.emp.intake.template')}
        desc={t('onb.emp.intake.template.d')}
        onSelect={() => setEmployer({ intake: 'template' })}
      >
        <div className="mt-3 grid gap-2 pl-8 sm:grid-cols-2" role="radiogroup" aria-label={t('onb.emp.intake.template')}>
          {sortedTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              role="radio"
              aria-checked={employer.template === tpl.id}
              onClick={() => setEmployer({ template: tpl.id })}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                employer.template === tpl.id
                  ? 'border-teal-600 bg-teal-50 font-medium dark:border-teal-500 dark:bg-teal-950'
                  : 'border-border hover:border-teal-400'
              }`}
            >
              <span>{t(tpl.labelKey)}</span>
              <span className="flex items-center gap-1.5">
                {tpl.industry === employer.industry && <Badge variant="outline" className="text-[10px]">{t('onb.emp.match')}</Badge>}
                {tpl.totalStaff > tpl.shownMembers.length && (
                  <span className="text-[10px] text-muted-foreground">{tpl.shownMembers.length}/{tpl.totalStaff}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </IntakeOption>
    </div>
  );
}

// Step 3: Primary objective
const OBJECTIVES: Array<{ id: EmployerObjective; icon: typeof Target; labelKey: string; descKey: string }> = [
  { id: 'risk', icon: Gauge, labelKey: 'onb.emp.obj.risk', descKey: 'onb.emp.obj.risk.d' },
  { id: 'transition', icon: ListChecks, labelKey: 'onb.emp.obj.transition', descKey: 'onb.emp.obj.transition.d' },
  { id: 'budget', icon: Wallet, labelKey: 'onb.emp.obj.budget', descKey: 'onb.emp.obj.budget.d' },
];

function EmployerStepObjective() {
  const t = useT();
  const { employer, setEmployer } = useSkillCast();
  return (
    <div className="space-y-3" role="radiogroup" aria-label={t('onb.emp.step3.q')}>
      {OBJECTIVES.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={employer.objective === o.id}
          onClick={() => setEmployer({ objective: o.id })}
          className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
            employer.objective === o.id
              ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-300 dark:border-teal-500 dark:bg-teal-950/40 dark:ring-teal-800'
              : 'border-border hover:border-teal-400'
          }`}
        >
          <o.icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
          <span>
            <span className="flex items-center gap-2 font-medium">
              {t(o.labelKey)}
              {employer.objective === o.id && <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />}
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">{t(o.descKey)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// Step 4: Timeline & budget
function EmployerStepParams() {
  const t = useT();
  const { employer, setEmployer } = useSkillCast();
  return (
    <div className="space-y-6">
      <div>
        <Label>{t('onb.emp.timeline')}</Label>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('onb.emp.timeline')}>
          {([3, 6, 12] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={employer.timelineMonths === m}
              onClick={() => setEmployer({ timelineMonths: m })}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                employer.timelineMonths === m
                  ? 'border-teal-600 bg-teal-50 font-medium ring-1 ring-teal-300 dark:border-teal-500 dark:bg-teal-950 dark:ring-teal-800'
                  : 'border-border hover:border-teal-400'
              }`}
            >
              {t(`onb.emp.months.${m}`)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>{t('onb.emp.budget.pref')}</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t('onb.emp.budget.pref')}>
          {(['free', 'hrd'] as const).map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={employer.budgetPref === b}
              onClick={() => setEmployer({ budgetPref: b })}
              className={`rounded-xl border p-4 text-left text-sm transition-colors ${
                employer.budgetPref === b
                  ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-300 dark:border-teal-500 dark:bg-teal-950/40 dark:ring-teal-800'
                  : 'border-border hover:border-teal-400'
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                {b === 'free' ? <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden /> : <Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />}
                {t(`onb.emp.budget.${b}`)}
                {employer.budgetPref === b && <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />}
              </span>
              <span className="mt-1 block text-muted-foreground">{t(`onb.emp.budget.${b}.d`)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ Institution track (4 steps) ════════════════════════════════════════════

function InstitutionOnboarding() {
  const t = useT();
  const { institution, setInstitution, setUserType } = useSkillCast();
  const [step, setStep] = useState(1);

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return institution.name.trim().length >= 2 && institution.field !== '';
      case 2: return institution.intake !== '';
      case 3: return institution.focus !== '';
      default: return true;
    }
  }, [step, institution]);

  const finish = () => useSkillCast.setState({ onboarded: true, view: 'institution' });
  const back = step === 1 ? () => setUserType(null) : () => setStep((s) => Math.max(1, s - 1));

  const titles = [t('onb.inst.step1.q'), t('onb.inst.step2.q'), t('onb.inst.step3.q'), t('onb.inst.step4.q')];

  return (
    <OnboardingShell
      step={step}
      total={4}
      title={titles[step - 1]}
      desc={step === 1 ? t('onb.inst.step1.d') : undefined}
      icon={step === 1 ? GraduationCap : step === 2 ? ClipboardCheck : step === 3 ? Target : Globe}
      onBack={back}
      onNext={() => setStep((s) => Math.min(4, s + 1))}
      nextDisabled={!canNext}
      finish={finish}
    >
      {step === 1 && <InstitutionStepOrg />}
      {step === 2 && <InstitutionStepIntake />}
      {step === 3 && <InstitutionStepFocus />}
      {step === 4 && <InstitutionStepAccess />}
    </OnboardingShell>
  );
}

// Step 1: Institution & cohort profile
function InstitutionStepOrg() {
  const t = useT();
  const { institution, setInstitution } = useSkillCast();
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="instname">{t('onb.inst.name')}</Label>
        <Input
          id="instname"
          value={institution.name}
          onChange={(e) => setInstitution({ name: e.target.value })}
          placeholder={t('onb.inst.name.ph')}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label>{t('onb.inst.field')}</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t('onb.inst.field')}>
          {FIELDS_OF_STUDY.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={institution.field === f.id}
              onClick={() => setInstitution({ field: f.id })}
              className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                institution.field === f.id
                  ? 'border-teal-600 bg-teal-50 font-medium ring-1 ring-teal-300 dark:border-teal-500 dark:bg-teal-950 dark:ring-teal-800'
                  : 'border-border hover:border-teal-400'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{t('onb.inst.field.hint')}</p>
      </div>
    </div>
  );
}

// Step 2: Student skill intake
function InstitutionStepIntake() {
  const t = useT();
  const { institution, setInstitution } = useSkillCast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="space-y-4">
      <IntakeOption
        selected={institution.intake === 'cv'}
        icon={Upload}
        title={t('onb.inst.intake.cv')}
        desc={t('onb.inst.intake.cv.d')}
        onSelect={() => setInstitution({ intake: 'cv' })}
      >
        <div className="mt-3 pl-8">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.docx"
            className="hidden"
            onChange={() => setUploaded(true)}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2">
            <ScanSearch className="h-4 w-4" aria-hidden /> {t('onb.inst.intake.cv.btn')}
          </Button>
          {uploaded && (
            <p className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="mr-1 inline h-4 w-4" aria-hidden /> {t('onb.inst.intake.cv.ok')}
            </p>
          )}
        </div>
      </IntakeOption>

      <IntakeOption
        selected={institution.intake === 'assessment'}
        icon={ClipboardCheck}
        title={t('onb.inst.intake.assessment')}
        desc={t('onb.inst.intake.assessment.d')}
        onSelect={() => setInstitution({ intake: 'assessment' })}
      >
        {institution.intake === 'assessment' && (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 pl-8 text-sm text-muted-foreground">
            {t('onb.inst.intake.assessment.note')}
          </p>
        )}
      </IntakeOption>
    </div>
  );
}

// Step 3: Advisory focus
const FOCUS_OPTIONS = [
  { id: 'entry', labelKey: 'onb.inst.focus.entry', descKey: 'onb.inst.focus.entry.d' },
  { id: 'gaps', labelKey: 'onb.inst.focus.gaps', descKey: 'onb.inst.focus.gaps.d' },
  { id: 'sdg', labelKey: 'onb.inst.focus.sdg', descKey: 'onb.inst.focus.sdg.d' },
] as const;

function InstitutionStepFocus() {
  const t = useT();
  const { institution, setInstitution } = useSkillCast();
  return (
    <div className="space-y-3" role="radiogroup" aria-label={t('onb.inst.step3.q')}>
      {FOCUS_OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={institution.focus === o.id}
          onClick={() => setInstitution({ focus: o.id })}
          className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
            institution.focus === o.id
              ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-300 dark:border-teal-500 dark:bg-teal-950/40 dark:ring-teal-800'
              : 'border-border hover:border-teal-400'
          }`}
        >
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
          <span>
            <span className="flex items-center gap-2 font-medium">
              {t(o.labelKey)}
              {institution.focus === o.id && <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />}
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">{t(o.descKey)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// Step 4: Accessibility preferences
function InstitutionStepAccess() {
  const t = useT();
  const { institution, setInstitution, lang, setLang } = useSkillCast();
  return (
    <div className="space-y-6">
      <div>
        <Label>{t('onb.inst.lang.q')}</Label>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('onb.inst.lang.q')}>
          {(['en', 'ms', 'zh', 'ru'] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={lang === l}
              onClick={() => setLang(l)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                lang === l
                  ? 'border-teal-600 bg-teal-50 font-medium ring-1 ring-teal-300 dark:border-teal-500 dark:bg-teal-950 dark:ring-teal-800'
                  : 'border-border hover:border-teal-400'
              }`}
            >
              {t(`lang.${l}`)}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{t('onb.inst.lang.hint')}</p>
      </div>
      <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
        <div>
          <Label htmlFor="lowbw">{t('onb.inst.lowbw')}</Label>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('onb.inst.lowbw.d')}</p>
        </div>
        <Switch
          id="lowbw"
          checked={institution.lowBandwidth}
          onCheckedChange={(v) => setInstitution({ lowBandwidth: v })}
        />
      </div>
    </div>
  );
}

// ─── Individual steps (unchanged logic) ────────────────────────────────────

function StepPersona() {
  const t = useT();
  const { profile, setProfile } = useSkillCast();
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t('onb.persona.q')}>
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={profile.persona === p.id}
            onClick={() => setProfile({ persona: p.id })}
            className={`rounded-xl border p-4 text-left transition-colors ${
              profile.persona === p.id
                ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-300 dark:border-teal-500 dark:bg-teal-950 dark:ring-teal-800'
                : 'border-border hover:border-teal-400'
            }`}
          >
            <span className="flex items-center justify-between">
              <span className="font-medium">{t(p.labelKey)}</span>
              {profile.persona === p.id && <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">{t(p.descKey)}</span>
          </button>
        ))}
      </div>
      <div>
        <Label htmlFor="years">
          {t('onb.years')}: <span className="font-semibold text-foreground">{profile.years}</span>
        </Label>
        <Slider
          id="years"
          min={0}
          max={40}
          step={1}
          value={[profile.years]}
          onValueChange={([v]) => setProfile({ years: v })}
          className="mt-2"
        />
      </div>
    </div>
  );
}

function StepInterests() {
  const t = useT();
  const { profile, setProfile } = useSkillCast();
  const toggle = (i: string) => {
    const has = profile.interests.includes(i);
    setProfile({
      interests: has ? profile.interests.filter((x) => x !== i) : [...profile.interests, i],
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {INTERESTS.map((i) => (
          <button
            key={i}
            type="button"
            aria-pressed={profile.interests.includes(i)}
            onClick={() => toggle(i)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              profile.interests.includes(i)
                ? 'border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500'
                : 'border-border hover:border-teal-400'
            }`}
          >
            {t(`interest.${i}`)}
          </button>
        ))}
      </div>
      <div>
        <Label htmlFor="budget">
          {t('onb.budget.q')}{' '}
          <span className="font-semibold text-foreground">
            {profile.budget} {t('common.hrsweek')}
          </span>
        </Label>
        <Slider
          id="budget"
          min={1}
          max={25}
          step={1}
          value={[profile.budget]}
          onValueChange={([v]) => setProfile({ budget: v })}
          className="mt-2"
        />
        <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t('onb.budget.hint')}
        </p>
      </div>
    </div>
  );
}

function StepSkills() {
  const t = useT();
  const { profile, setSkillLevel } = useSkillCast();
  const entries = Object.entries(profile.skills).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {entries.length === 0 && <p className="text-sm text-muted-foreground">{t('onb.skills.none')}</p>}
      <ul className="divide-y divide-border rounded-lg border">
        {entries.map(([slug, level]) => (
          <li key={slug} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-sm font-medium">{SKILL_MAP[slug]?.name ?? slug}</span>
            <LevelPicker level={level} onChange={(n) => setSkillLevel(slug, n)} />
          </li>
        ))}
      </ul>
      <SkillBrowser />
    </div>
  );
}

function SkillBrowser() {
  const t = useT();
  const { profile, setSkillLevel } = useSkillCast();
  return (
    <Accordion type="multiple" className="rounded-lg border px-3">
      {SKILL_CATEGORIES.map((cat) => (
        <AccordionItem key={cat} value={cat}>
          <AccordionTrigger className="py-2 text-sm font-medium">{cat}</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5">
              {SKILLS.filter((s) => s.category === cat).map((s) => (
                <li key={s.slug} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{s.name}</span>
                  <LevelPicker
                    level={profile.skills[s.slug] ?? 0}
                    onChange={(n) => setSkillLevel(s.slug, n)}
                  />
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function StepInclusion() {
  const t = useT();
  const { profile, setProfile } = useSkillCast();
  const incl = profile.inclusion;

  const toggle = (key: keyof typeof incl) => {
    const next = { ...incl, [key]: !incl[key] };
    if (key === 'none') {
      Object.assign(next, { dyslexia: false, visual: false, hearing: false, mobility: false, none: !incl.none });
    } else {
      next.none = false;
    }
    setProfile({ inclusion: next });
  };

  const needs: Array<{ key: 'dyslexia' | 'visual' | 'hearing' | 'mobility' | 'none'; label: string }> = [
    { key: 'dyslexia', label: t('inclusion.dyslexia') },
    { key: 'visual', label: t('inclusion.visual') },
    { key: 'hearing', label: t('inclusion.hearing') },
    { key: 'mobility', label: t('inclusion.mobility') },
    { key: 'none', label: t('inclusion.none') },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {needs.map((n) => (
          <label
            key={n.key}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
              incl[n.key] ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-950' : 'border-border'
            }`}
          >
            <input
              type="checkbox"
              checked={incl[n.key]}
              onChange={() => toggle(n.key)}
              className="mt-0.5 h-4 w-4 accent-teal-600"
            />
            <span>{n.label}</span>
          </label>
        ))}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">{t('onb.objective.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('onb.objective.desc')}</p>
        <Textarea
          value={profile.objective}
          onChange={(e) => setProfile({ objective: e.target.value })}
          placeholder={t('onb.objective.ph')}
          rows={2}
        />
        <Badge variant="outline" className="text-[11px] text-muted-foreground">
          {t('harada.method')}
        </Badge>
      </div>
    </div>
  );
}
