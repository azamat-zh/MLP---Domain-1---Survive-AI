'use client';

import { useSyncExternalStore } from 'react';
import { CloudSun, Scale, ShieldCheck } from 'lucide-react';
import { useSkillCast } from '@/lib/store';
import { SignalsProvider, useT } from '@/components/skillcast/shared';
import { Header } from '@/components/skillcast/header';
import { Landing } from '@/components/skillcast/landing';
import { Onboarding } from '@/components/skillcast/onboarding';
import { Dashboard } from '@/components/skillcast/dashboard';
import { EmployerView } from '@/components/skillcast/employer';
import { InstitutionView } from '@/components/skillcast/institution';
import { SignalsView } from '@/components/skillcast/signalsview';

// Hydration guard: server snapshot = false, client snapshot = true.
// Avoids SSR/localStorage mismatch without setState-in-effect.
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function Home() {
  return (
    <SignalsProvider>
      <Shell />
    </SignalsProvider>
  );
}

function Shell() {
  const { view } = useSkillCast();
  const mounted = useMounted();

  return (
    <div className="skillcast-app flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {!mounted ? (
          <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
            <CloudSun className="h-10 w-10 animate-pulse text-teal-600 dark:text-teal-400" aria-hidden />
          </div>
        ) : view === 'landing' ? (
          <Landing />
        ) : view === 'onboarding' ? (
          <Onboarding />
        ) : view === 'dashboard' ? (
          <Dashboard />
        ) : view === 'employer' ? (
          <EmployerView />
        ) : view === 'institution' ? (
          <InstitutionView />
        ) : (
          <SignalsView />
        )}
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  const t = useT();
  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('footer.disclosure')}
        </p>
        <p className="flex items-start gap-1.5">
          <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Aiversecity — Future-Ready Workforce · Human-in-command: AI supports career decisions, people make them.
        </p>
      </div>
    </footer>
  );
}
