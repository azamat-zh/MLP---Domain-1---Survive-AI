'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { CloudSun, Languages, Moon, RotateCcw, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LANGS } from '@/lib/i18n';
import { useSkillCast, type View } from '@/lib/store';
import { useT } from './shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Hydration guard for theme-dependent icons (matches page.tsx pattern)
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function Header() {
  const t = useT();
  const { view, setView, lang, setLang, onboarded, resetDemo } = useSkillCast();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const landing = view === 'landing';

  const views: Array<{ id: View; label: string; enabled: boolean }> = [
    { id: 'landing', label: t('nav.home'), enabled: true },
    { id: 'dashboard', label: t('nav.dashboard'), enabled: onboarded },
    { id: 'employer', label: t('nav.employer'), enabled: true },
    { id: 'signals', label: t('nav.signals'), enabled: true },
  ];

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${landing
      ? 'border-white/10 bg-[#090b2b]/80 text-white supports-[backdrop-filter]:bg-[#090b2b]/70'
      : 'border-border bg-background/90 text-foreground supports-[backdrop-filter]:bg-background/75'
    }`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          aria-label="SkillCast home"
        >
          <CloudSun className={`h-5 w-5 ${landing ? 'text-blue-300' : 'text-blue-600 dark:text-blue-400'}`} aria-hidden />
          <span className="text-lg">
            Skill<span className={landing ? 'text-blue-300' : 'text-blue-600 dark:text-blue-400'}>Cast</span>
          </span>
          <span className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline ${landing ? 'border-white/15 text-blue-100/55' : 'border-border text-muted-foreground'}`}>
            POC
          </span>
        </button>

        <nav aria-label="Primary" className="order-3 flex flex-1 flex-wrap items-center gap-1 sm:order-2 sm:justify-center">
          {views.map((v) => (
            <Button
              key={v.id}
              variant={view === v.id ? 'secondary' : 'ghost'}
              size="sm"
              disabled={!v.enabled}
              onClick={() => setView(v.id)}
              className={`h-8 text-sm ${landing
                ? view === v.id
                  ? 'bg-white/10 text-white hover:bg-white/15 hover:text-white'
                  : 'text-blue-100/70 hover:bg-white/[0.07] hover:text-white disabled:text-blue-100/30'
                : ''}`}
            >
              {v.label}
            </Button>
          ))}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${landing ? 'text-blue-100/75 hover:bg-white/10 hover:text-white' : ''}`}
                  aria-label={t('nav.theme')}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {mounted && theme === 'light' ? (
                    <Moon className="h-4 w-4" aria-hidden />
                  ) : (
                    <Sun className="h-4 w-4" aria-hidden />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {t('nav.theme')}: {mounted && theme === 'light' ? t('nav.theme.light') : t('nav.theme.dark')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
                  <SelectTrigger size="sm" className={`h-8 w-auto gap-1 text-xs ${landing ? 'border-white/15 bg-white/[0.04] text-blue-100/85 hover:bg-white/10' : 'border-dashed'}`}>
                    <Languages className="h-3.5 w-3.5" aria-hidden />
                    <SelectValue aria-label={t('nav.lang')} />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGS.map((l) => (
                      <SelectItem key={l.code} value={l.code} className="text-xs">
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{t('nav.lang')}: EN · BM · 中文 · RU</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={`h-8 w-8 ${landing ? 'text-blue-100/75 hover:bg-white/10 hover:text-white' : ''}`} aria-label={t('nav.reset')}>
                <RotateCcw className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => resetDemo()}>{t('nav.reset')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
