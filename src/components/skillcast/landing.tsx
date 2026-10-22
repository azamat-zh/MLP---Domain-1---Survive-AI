'use client';

import {
  ArrowRight, BadgeCheck, BadgeCheck as VerifyIcon, Building2, CloudSun, ExternalLink,
  FileCheck2, FileText, GitBranch, GraduationCap, Radar, Scale, ShieldCheck, Sparkles, User,
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
  const { setView, onboarded, setUserType, lang } = useSkillCast();

  const steps = [
    { icon: FileText, title: t('landing.step1'), desc: t('landing.step1d') },
    { icon: Radar, title: t('landing.step2'), desc: t('landing.step2d') },
    { icon: GitBranch, title: t('landing.step3'), desc: t('landing.step3d') },
    { icon: GraduationCap, title: t('landing.step4'), desc: t('landing.step4d') },
  ];

  const headlineStats = FACTS_HEADLINE.map((id) => FACT_MAP[id]).filter(Boolean);

  const entryCards = [
    { type: 'individual' as const, icon: User, titleKey: 'onb.ut.individual', descKey: 'onb.ut.individual.ex' },
    { type: 'employer' as const, icon: Building2, titleKey: 'onb.ut.employer', descKey: 'onb.ut.employer.ex' },
    { type: 'institution' as const, icon: GraduationCap, titleKey: 'onb.ut.institution', descKey: 'onb.ut.institution.ex' },
  ];

  const go = (type: 'individual' | 'employer' | 'institution') => {
    setUserType(type);
    if (type === 'individual' && onboarded) setView('dashboard');
    else setView('onboarding');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50 via-emerald-50/60 to-white px-6 py-12 dark:border-teal-900/50 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-background sm:px-10 sm:py-16">
        <CloudSun
          className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 text-teal-200/50 dark:text-teal-800/30"
          aria-hidden
        />
        <div className="relative max-w-3xl">
          <Badge variant="outline" className="mb-4 gap-1.5 border-teal-300 bg-white/70 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t('landing.badge')}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {t('landing.title')}
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t('landing.subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => go('individual')}
              className="gap-2 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              {t('landing.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button size="lg" variant="outline" onClick={() => go('employer')}>
              <Building2 className="mr-2 h-4 w-4" aria-hidden />
              {t('landing.cta2')}
            </Button>
          </div>
        </div>
      </section>

      {/* Three ways in */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">{t('landing.entry.title')}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('landing.entry.desc')}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {entryCards.map((c) => (
            <button
              key={c.type}
              type="button"
              onClick={() => go(c.type)}
              className="group flex h-full flex-col rounded-xl border p-5 text-left transition-colors hover:border-teal-500 hover:bg-teal-50/40 dark:hover:border-teal-500 dark:hover:bg-teal-950/20"
            >
              <span className="flex items-center justify-between">
                <c.icon className="h-7 w-7 text-teal-600 dark:text-teal-400" aria-hidden />
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </span>
              <span className="mt-3 font-semibold">{t(c.titleKey)}</span>
              <span className="mt-1 text-sm text-muted-foreground">{t(c.descKey)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Why now — fact-checked, every stat linked to its source */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold">{t('landing.stats.title')}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('landing.stats.sourced', { date: FACT_CHECKED_ON })}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {headlineStats.map((f) => (
            <Card key={f.id} className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold text-rose-600 dark:text-rose-400">{f.value}</CardTitle>
              </CardHeader>
              <CardContent className="flex h-full flex-col justify-between gap-2">
                <p className="text-sm text-muted-foreground">{f.claim[lang as Lang] ?? f.claim.en}</p>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:underline dark:text-teal-400"
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
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck2 className="h-5 w-5 text-teal-700 dark:text-teal-400" aria-hidden />
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
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{f.value}</span>
                      <span className="min-w-0 flex-1 truncate text-left">
                        {f.claim[lang as Lang] ?? f.claim.en}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          f.status === 'verified'
                            ? 'shrink-0 gap-1 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                            : 'shrink-0 gap-1 border-amber-400 text-amber-700 dark:text-amber-300'
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
                      className="inline-flex max-w-full items-center gap-1 truncate text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
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
      <section className="mt-12">
        <h2 className="text-lg font-semibold">{t('landing.steps.title')}</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
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
      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
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
            <Badge variant="outline" className="gap-1">
              <Scale className="h-3 w-3" aria-hidden /> {t('common.estimates')}
            </Badge>
            <Badge variant="outline">2 scenarios</Badge>
            <Badge variant="outline">4 languages: EN · BM · 中文 · RU</Badge>
            <Badge variant="outline">SDG ledger on every role</Badge>
            <Badge variant="outline" className="gap-1">
              <FileCheck2 className="h-3 w-3" aria-hidden /> {t('facts.badge')}
            </Badge>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
