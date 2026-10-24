'use client';

import {
  ArrowRight, BadgeCheck, Building2, FileCheck2, GitBranch, GraduationCap, Radar, Scale, ShieldCheck, Sparkles, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSkillCast } from '@/lib/store';
import { SdgBadge, useT } from './shared';
import { SDG_TITLES } from '@/lib/i18n';

export function Landing() {
  const t = useT();
  const { setView, setUserType, onboarded, lang } = useSkillCast();

  const navigate = (type: 'individual' | 'employer' | 'institution') => {
    setUserType(type);
    if (type === 'individual' && onboarded) setView('dashboard');
    else setView('onboarding');
  };

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
    <div className="skillcast-landing overflow-hidden">
      {/* Hero */}
      <section className="skillcast-hero relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-20 sm:px-10">
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
            {t('landing.title')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-blue-100/70 sm:text-lg sm:leading-8">{t('landing.subtitle')}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => navigate('individual')}
              className="h-12 gap-2 rounded-full border border-indigo-200/25 bg-gradient-to-r from-indigo-500 to-violet-500 px-7 text-white shadow-[0_10px_40px_rgba(91,91,220,.38)] transition-transform hover:-translate-y-0.5 hover:from-indigo-400 hover:to-violet-400"
            >
              {t('landing.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <p className="mt-6 text-xs tracking-wide text-blue-100/45">Discover your strengths · Adapt to change · Achieve your next step</p>
        </div>
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
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
