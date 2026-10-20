'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ClipboardList, Rocket, ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SKILLS, SKILL_CATEGORIES, SKILL_MAP } from '@/data/skills';
import { INTERESTS, PERSONAS, useSkillCast } from '@/lib/store';
import { LevelPicker, useT } from './shared';
import { CvStep } from './cv-step';

const TOTAL_STEPS = 5;

export function Onboarding() {
  const t = useT();
  const { profile, setProfile, setView } = useSkillCast();
  const [step, setStep] = useState(1);

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return profile.persona !== null;
      case 2:
        return profile.interests.length > 0 && profile.budget >= 1;
      case 3:
        return profile.intakeMode !== null;
      case 4:
        return Object.keys(profile.skills).length > 0;
      default:
        return true;
    }
  }, [step, profile]);

  const finish = () => {
    useSkillCast.setState({ onboarded: true, view: 'dashboard' });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      {/* Progress */}
      <div className="mt-6 flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          {t('onb.step')} {step} {t('onb.of')} {TOTAL_STEPS}
        </span>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5 flex-1" aria-label={`Step ${step} of ${TOTAL_STEPS}`} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          {step === 1 && (
            <>
              <CardTitle>{t('onb.persona.q')}</CardTitle>
              <CardDescription>Aiversecity — Future-Ready Workforce</CardDescription>
            </>
          )}
          {step === 2 && (
            <>
              <CardTitle>{t('onb.interests.q')}</CardTitle>
              <CardDescription>{t('onb.budget.hint')}</CardDescription>
            </>
          )}
          {step === 3 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" aria-hidden /> {t('onb.cv.title')}
              </CardTitle>
              <CardDescription className="leading-relaxed">{t('onb.cv.desc')}</CardDescription>
            </>
          )}
          {step === 4 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" aria-hidden /> {t('onb.skills.title')}
              </CardTitle>
              <CardDescription className="leading-relaxed">{t('onb.skills.desc')}</CardDescription>
            </>
          )}
          {step === 5 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" aria-hidden /> {t('onb.inclusion.title')}
              </CardTitle>
              <CardDescription className="leading-relaxed">{t('onb.inclusion.desc')}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && <StepPersona />}
          {step === 2 && <StepInterests />}
          {step === 3 && <CvStep onDone={() => setStep(4)} />}
          {step === 4 && <StepSkills />}
          {step === 5 && <StepInclusion />}
        </CardContent>
      </Card>

      {/* Nav */}
      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> {t('common.back')}
        </Button>
        {step < TOTAL_STEPS ? (
          <Button
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            disabled={!canNext}
            className="gap-1 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {t('common.next')} <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button
            onClick={finish}
            className="gap-2 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            <Rocket className="h-4 w-4" aria-hidden /> {t('onb.finish')}
          </Button>
        )}
      </div>
      {step === 3 && (
        <p className="mt-2 text-right text-xs text-muted-foreground">
          <ShieldCheck className="mr-1 inline h-3 w-3" aria-hidden />
          Privacy by design: scrubbing runs in your browser.
        </p>
      )}
    </div>
  );
}

// ─── Step 1: persona + years ───────────────────────────────────────────────

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

// ─── Step 2: interests + budget ────────────────────────────────────────────

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

// ─── Step 4: skills editor (CV-extracted or manual) ───────────────────────

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
            <span className="text-sm font-medium">{skillDisplayName(slug)}</span>
            <LevelPicker level={level} onChange={(n) => setSkillLevel(slug, n)} />
          </li>
        ))}
      </ul>
      <SkillBrowser />
    </div>
  );
}

function skillDisplayName(slug: string) {
  return SKILL_MAP[slug]?.name ?? slug;
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

// ─── Step 5: inclusion + Harada objective ──────────────────────────────────

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
