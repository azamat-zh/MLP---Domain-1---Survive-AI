'use client';

import { useRef, useState } from 'react';
import { Eye, FileWarning, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { SAMPLE_CV } from '@/data/sample-cv';
import { scrubCV, skillsFromCV, extractSkills, type ScrubReport } from '@/lib/cv';
import { SKILL_MAP } from '@/data/skills';
import { useSkillCast } from '@/lib/store';
import { LevelDots, useT } from './shared';

// ─── Step 3: CV intake with in-browser PII scrubbing ───────────────────────
// The raw CV never leaves this component: scrub in-browser, then send only the
// de-identified text to /api/extract-cv (self-hosted Qwen on RunPod) for
// structured extraction. If the AI path fails, the deterministic keyword
// extractor takes over — the flow always renders a result the user confirms.

export function CvStep({ onDone }: { onDone: () => void }) {
  const t = useT();
  const { profile, setProfile } = useSkillCast();
  const [cvText, setCvText] = useState('');
  const [report, setReport] = useState<ScrubReport | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractMode, setExtractMode] = useState<'llm' | 'deterministic' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCvText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  const analyse = async () => {
    const scrubbed = scrubCV(cvText);
    setReport(scrubbed);
    setExtracting(true);
    setExtractMode(null);
    const scrubMeta = {
      intakeMode: 'cv' as const,
      cvScrub: { items: scrubbed.items.length, kinds: [...new Set(scrubbed.items.map((i) => i.kind))] },
    };
    try {
      const res = await fetch('/api/extract-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scrubbed.scrubbedText }),
      });
      const data = (await res.json()) as { ok?: boolean; skills?: Record<string, number>; years?: number };
      if (data.ok && data.skills && Object.keys(data.skills).length > 0) {
        setProfile({
          skills: data.skills,
          years: data.years && data.years > 0 ? data.years : profile.years,
          ...scrubMeta,
        });
        setExtractMode('llm');
        return;
      }
    } catch {
      // fall through to the deterministic extractor
    } finally {
      setExtracting(false);
    }
    const skills = skillsFromCV(scrubbed.scrubbedText);
    setProfile({ skills, ...scrubMeta });
    setExtractMode('deterministic');
  };

  const useForm = () => {
    setProfile({ intakeMode: 'form', cvScrub: null });
    onDone();
  };

  const extracted = report ? extractSkills(report.scrubbedText).slice(0, 10) : [];

  if (profile.intakeMode === 'form') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('onb.skills.formDesc')}</p>
        <Button variant="outline" onClick={() => setProfile({ intakeMode: null })}>
          {t('onb.cv.backToCv')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
          <ScanSearch className="h-4 w-4" aria-hidden /> {t('onb.cv.upload')}
        </Button>
        <Button
          variant="outline"
          onClick={() => setCvText(SAMPLE_CV)}
          className="gap-2"
          title="Synthetic CV — contains no real person's data"
        >
          <Sparkles className="h-4 w-4" aria-hidden /> {t('onb.cv.sample')}
        </Button>
        <Button variant="ghost" onClick={useForm} className="gap-2">
          {t('onb.cv.useForm')}
        </Button>
      </div>

      <Textarea
        value={cvText}
        onChange={(e) => setCvText(e.target.value)}
        placeholder={t('onb.cv.paste')}
        rows={8}
        aria-label={t('onb.cv.paste')}
      />

      <Button
        onClick={analyse}
        disabled={cvText.trim().length < 40 || extracting}
        className="gap-2 bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
      >
        <ShieldCheck className="h-4 w-4" aria-hidden />
        {extracting ? t('onb.cv.extracting') : t('onb.cv.analyse')}
      </Button>

      {report && (
        <div className="space-y-4">
          {/* Scrubber report */}
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5" aria-hidden />
              {t('scrub.title')}
            </div>
            <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">
              {report.items.length > 0
                ? `${report.items.length} ${t('scrub.stripped')}`
                : t('scrub.none')}
            </p>
            {report.items.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {report.items.map((item, i) => (
                  <li key={i}>
                    <Badge variant="outline" className="gap-1 border-emerald-400 bg-white/60 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <FileWarning className="h-3 w-3" aria-hidden />
                      {item.kind}: {item.preview}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-300/80">{t('scrub.keep')}</p>
          </div>

          {/* Scrubbed preview */}
          <details className="rounded-lg border bg-muted/40">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
              <Eye className="mr-1 inline h-4 w-4" aria-hidden />
              {t('scrub.preview')}
            </summary>
            <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap px-3 pb-3 text-xs text-muted-foreground">
              {report.scrubbedText.slice(0, 1500)}
            </pre>
          </details>

          {/* Extraction source disclosure */}
          {extractMode && (
            <p className="text-xs text-muted-foreground">
              {extractMode === 'llm' ? t('onb.cv.aiExtract') : t('onb.cv.deterministicExtract')}
            </p>
          )}

          {/* Extracted skills preview */}
          {extracted.length > 0 && (
            <div>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {extracted.map((s) => (
                  <li
                    key={s.slug}
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm"
                  >
                    <span className="truncate">{SKILL_MAP[s.slug]?.name ?? s.slug}</span>
                    <span className="flex items-center gap-2">
                      {s.strongContext && (
                        <Badge variant="secondary" className="text-[10px]">title context</Badge>
                      )}
                      <LevelDots level={s.level} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={onDone} className="w-full gap-2">
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
