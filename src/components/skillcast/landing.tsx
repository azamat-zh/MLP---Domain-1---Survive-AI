'use client';

import {
  ArrowRight, BadgeCheck, BadgeCheck as VerifyIcon, Building2, ExternalLink,
  FileCheck2, GitBranch, GraduationCap, Radar, Scale, ShieldCheck, Sparkles, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { FACTS, FACTS_HEADLINE, FACT_MAP, FACT_CHECKED_ON } from '@/data/facts';
import { useSkillCast } from '@/lib/store';
import { SdgBadge, useT } from './shared';
import { SDG_TITLES } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

export function Landing() {
  const t = useT();
  const { setView, setUserType, onboarded, lang } = useSkillCast();
  const heroDescription = lang === 'en'
    ? 'Discover your strengths, understand how AI is transforming careers, and build a personalized pathway toward your future.'
    : t('landing.subtitle');
  const primaryCta = lang === 'en' ? 'Get Started' : t('landing.cta');

  const headlineStats = FACTS_HEADLINE.map((id) => FACT_MAP[id]).filter(Boolean);

  const entryCards = [
    { type: 'individual' as const, icon: User, title: 'Individual — My Career', desc: 'For students, working professionals, unemployed individuals, and career changers.' },
    { type: 'employer' as const, icon: Building2, title: 'Employer / HR — My Team', desc: 'For companies and HR professionals who want to understand workforce skills and future skill gaps.' },
  ];

  const journey = [
    { icon: FileCheck2, title: t('landing.step1'), desc: t('landing.step1d') },
    { icon: Radar, title: t('landing.step2'), desc: t('landing.step2d') },
    { icon: GitBranch, title: t('landing.step3'), desc: t('landing.step3d') },
    { icon: GraduationCap, title: t('landing.step4'), desc: t('landing.step4d') },
  ];

  const go = (type: 'individual' | 'employer' | 'institution') => {
    setUserType(type);
    if (type === 'individual' && onboarded) setView('dashboard');
    else setView('onboarding');
  };

  return (
    <div className="skillcast-landing min-h-screen overflow-hidden pb-16">
      {/* Hero */}
      <section className="skillcast-hero relative isolate flex min-h-[min(720px,calc(100svh-64px))] items-center justify-center overflow-hidden px-5 py-20 sm:px-10 lg:min-h-[700px]">
        <div className="skillcast-hero-glow" aria-hidden="true" />
        <div className="skillcast-bubble skillcast-bubble--one" aria-hidden="true" />
        <div className="skillcast-bubble skillcast-bubble--two" aria-hidden="true" />
        <div className="skillcast-bubble skillcast-bubble--three" aria-hidden="true"><span>Future-ready</span></div>
        <div className="skillcast-bubble skillcast-bubble--four" aria-hidden="true" />
        <div className="skillcast-bubble skillcast-bubble--five" aria-hidden="true"><span>+18%<small>Illustrative demo</small></span></div>
        <div className="skillcast-bubble skillcast-bubble--six" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-6 gap-1.5 border-indigo-200/25 bg-white/[0.06] px-3 py-1 text-indigo-100 shadow-[0_0_32px_rgba(112,118,255,.15)] backdrop-blur-md">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t('landing.badge')}
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-balance text-white sm:text-6xl lg:text-7xl">
            {lang === 'en' ? <>Your Future.<br />Your Skills.<br /><span className="text-blue-300">Your Path.</span></> : t('landing.title')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-blue-100/70 sm:text-lg sm:leading-8">{heroDescription}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => {
                setUserType(null);
                setView('onboarding');
              }}
              className="h-12 gap-2 rounded-full border border-indigo-200/25 bg-gradient-to-r from-indigo-500 to-violet-500 px-7 text-white shadow-[0_10px_40px_rgba(91,91,220,.38)] transition-transform hover:-translate-y-0.5 hover:from-indigo-400 hover:to-violet-400"
            >
              {primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <p className="mt-6 text-xs tracking-wide text-blue-100/45">Discover your strengths · Adapt to change · Achieve your next step</p>
        </div>
      </section>

      {/* Two ways in */}
      <section className="mx-auto mt-4 max-w-6xl px-4 pt-16 sm:px-6 lg:pt-20">
        <h2 className="text-xl font-semibold tracking-tight">Two Ways to Get Started</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Choose a career forecast for yourself or a skills view for your team.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {entryCards.map((c) => (
            <button
              key={c.type}
              type="button"
              onClick={() => go(c.type)}
              className="group flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-slate-800"
            >
              <span className="flex items-center justify-between">
                <c.icon className="h-7 w-7 text-blue-600 dark:text-blue-400" aria-hidden />
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </span>
              <span className="mt-3 font-semibold">{c.title}</span>
              <span className="mt-1 text-sm text-muted-foreground">{c.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Why now — fact-checked, every stat linked to its source */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <h2 className="text-lg font-semibold">{t('landing.stats.title')}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('landing.stats.sourced', { date: FACT_CHECKED_ON })}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {headlineStats.map((f) => (
            <Card key={f.id} className="border-l-4 border-l-indigo-400">
              <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-bold text-indigo-700 dark:text-indigo-200">{f.value}</CardTitle>
              </CardHeader>
              <CardContent className="flex h-full flex-col justify-between gap-2">
                <p className="text-sm text-muted-foreground">{f.claim[lang as Lang] ?? f.claim.en}</p>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 hover:underline dark:text-indigo-200"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden />
                  {f.publisher} · {f.date}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Fact-check ledger */}
      <section className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck2 className="h-5 w-5 text-blue-700 dark:text-blue-400" aria-hidden />
              {t('facts.title')}
            </CardTitle>
            <CardDescription>{t('facts.desc', { date: FACT_CHECKED_ON })}</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {FACTS.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="py-2 text-left text-sm hover:no-underline">
                    <span className="flex flex-1 flex-wrap items-center gap-2 pr-2">
                      <span className="font-semibold text-indigo-700 dark:text-indigo-200">{f.value}</span>
                      <span className="min-w-0 flex-1 truncate text-left">
                        {f.claim[lang as Lang] ?? f.claim.en}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          f.status === 'verified'
                            ? 'shrink-0 gap-1 border-emerald-400 text-emerald-700 dark:text-emerald-200'
                            : 'shrink-0 gap-1 border-amber-400 text-amber-700 dark:text-amber-200'
                        }
                      >
                        {f.status === 'verified' ? (
                          <><VerifyIcon className="h-3 w-3" aria-hidden /> {t('facts.verified')}</>
                        ) : (
                          <>{t('facts.indicative')}</>
                        )}
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {t('facts.source')}: <span className="font-medium text-foreground">{f.publisher}</span> — {f.title} · {f.date}
                    </p>
                    {f.note && (
                      <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {f.note[lang as Lang] ?? f.note.en}
                      </p>
                    )}
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 truncate text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-200"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate">{f.url}</span>
                    </a>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <h2 className="text-lg font-semibold">{t('landing.steps.title')}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {journey.map((s, i) => (
            <li key={s.title}>
              <Card className="h-full border-blue-100 bg-white dark:border-slate-700 dark:bg-slate-900">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200">
                      {i + 1}
                    </span>
                    <s.icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                  </div>
                  <CardTitle className="mt-2 text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{s.desc}</CardDescription>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* SDG + Responsible AI */}
      <section className="mx-auto mt-16 grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
        <Card className="border-emerald-300/15 bg-gradient-to-br from-emerald-400/[0.07] to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              {t('landing.sdg.title')}
            </CardTitle>
            <CardDescription className="leading-relaxed">{t('landing.sdg.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((g) => (
                <SdgBadge key={g} goal={g} />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {SDG_TITLES[4]} · {SDG_TITLES[5]} · {SDG_TITLES[8]} · {SDG_TITLES[9]} · {SDG_TITLES[10]} —
              Aiversecity Future-Ready Workforce domain
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden />
              {t('landing.privacy.title')}
            </CardTitle>
            <CardDescription className="leading-relaxed">{t('landing.privacy.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="gap-1 border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Scale className="h-3 w-3" aria-hidden /> {t('common.estimates')}
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">2 scenarios</Badge>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">4 languages: EN · BM · 中文 · RU</Badge>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">SDG ledger on every role</Badge>
            <Badge variant="outline" className="gap-1 border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <FileCheck2 className="h-3 w-3" aria-hidden /> {t('facts.badge')}
            </Badge>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
