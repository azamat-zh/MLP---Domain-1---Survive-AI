import { SKILLS, SKILL_MAP } from '@/data/skills';

// ─── PII scrubber + deterministic CV skill extractor ───────────────────────
// PRIVACY BY DESIGN: the raw CV never leaves the browser — scrubbing and
// skill extraction both run client-side. Only the extracted skill levels are
// stored in the profile. In production the same rules apply before any LLM
// narration call (see /api/coach — it receives skills, never CV text).

export interface ScrubReport {
  originalLength: number;
  scrubbedLength: number;
  items: Array<{ kind: string; preview: string }>;
  scrubbedText: string;
}

const MASK = '[REDACTED]';

function maskLine(text: string, label: string, items: Array<{ kind: string; preview: string }>) {
  items.push({ kind: label, preview: text.length > 24 ? text.slice(0, 24) + '…' : text });
  return MASK;
}

export function scrubCV(input: string): ScrubReport {
  const items: Array<{ kind: string; preview: string }> = [];
  let text = input;

  // Malaysian NRIC (12 digits, optional dashes) — the headline case
  text = text.replace(/\b\d{6}[-\s]?\d{2}[-\s]?\d{4}\b/g, (m) => maskLine(m, 'NRIC (MyKad)', items));

  // Phone numbers (MY formats: +60 12-345 6789, 012-345 6789, 0123456789)
  text = text.replace(/(\+?6?0?[\s-]?\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4})\b/g, (m) => maskLine(m, 'Phone number', items));

  // Email
  text = text.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (m) => maskLine(m, 'Email', items));

  // LinkedIn / social URLs
  text = text.replace(/(https?:\/\/)?(www\.)?(linkedin|facebook|instagram|twitter|x)\.com\/\S+/gi, (m) => maskLine(m, 'Social profile URL', items));

  // Malaysian addresses (Jalan/Lorong/Taman/No. + postcode patterns)
  text = text.replace(/\b\d{5}\s+(?:Jalan|Lorong|Lebuh|Persiaran)\b[^\n,;]*/gi, (m) => maskLine(m, 'Address', items));
  text = text.replace(/\b(Jalan|Lorong|Taman|Kampung|Batu)\s+[\w\s]+\d*[^\n]{0,40}/g, (m) => maskLine(m, 'Address', items));

  // Date of birth / age / gender / race / religion / marital status
  text = text.replace(/\b(0?[1-9]|[12]\d|3[01])[\/\-.](0?[1-9]|1[0-2])[\/\-.](19|20)\d{2}\b/g, (m) => maskLine(m, 'Date of birth', items));
  text = text.replace(/\b(age|umur)\s*[:\-]?\s*\d{2}\b/gi, (m) => maskLine(m, 'Age', items));
  text = text.replace(/\b(male|female|lelaki|perempuan)\b/gi, (m) => maskLine(m, 'Gender', items));
  text = text.replace(/\b(single|married|divorced|bujang|berkahwin)\b/gi, (m) => maskLine(m, 'Marital status', items));
  text = text.replace(/\breligion\s*[:\-]\s*\w+/gi, (m) => maskLine(m, 'Religion', items));
  text = text.replace(/\b(islam|christianity|buddhism|hinduism)\b/gi, (m) => maskLine(m, 'Religion', items));
  text = text.replace(/\brace\s*[:\-]\s*\w+/gi, (m) => maskLine(m, 'Race/ethnicity', items));
  text = text.replace(/\b(race\s*[:\-]\s*\w+|malay|chinese|indian|iban|kadazan)\b/gi, (m) => maskLine(m, 'Race/ethnicity', items));

  // Candidate name: heuristic — "Name:" label or the first non-empty line
  text = text.replace(/^\s*name\s*[:\-]\s*[^\n]+/im, (m) => maskLine(m, 'Full name', items));
  const firstLine = text.split('\n').find((l) => l.trim().length > 2);
  if (firstLine && /^[A-Z][A-Z\s.'-]{4,40}$/.test(firstLine.trim())) {
    text = text.replace(firstLine, maskLine(firstLine, 'Full name (header line)', items));
  }

  // Salary expectations
  text = text.replace(/\b(current|expected)\s+salary\s*[:\-]?\s*[^\n]+/gi, (m) => maskLine(m, 'Salary info', items));

  return {
    originalLength: input.length,
    scrubbedLength: text.length,
    items,
    scrubbedText: text,
  };
}

// ─── Deterministic skill extraction ────────────────────────────────────────
// Transparent keyword matching against the taxonomy (with word boundaries).
// Context weighting: title-ish lines (first 25% of CV or ALL-CAPS lines)
// count double. Level heuristic: mentions × context, capped at 5. An LLM
// never decides your skill levels — you confirm and edit them in the UI.

const SENIORITY_BOOST = /\b(senior|lead|expert|specialist|manager|head of|director|architect)\b/i;

export interface ExtractedSkill {
  slug: string;
  name: string;
  level: number; // 0-5
  mentions: number;
  strongContext: boolean;
}

export function extractSkills(cvText: string): ExtractedSkill[] {
  const lines = cvText.split('\n');
  const titleZone = lines.slice(0, Math.max(3, Math.floor(lines.length * 0.25))).join('\n').toLowerCase();
  const allCapsZone = lines.filter((l) => l.trim() === l.trim().toUpperCase() && /[A-Z]{3}/.test(l)).join('\n').toLowerCase();
  const body = cvText.toLowerCase();

  const out: ExtractedSkill[] = [];
  for (const skill of SKILLS) {
    let count = 0;
    let strong = false;
    for (const alias of skill.aliases) {
      const re = new RegExp(`(^|[^a-z0-9])${escapeRe(alias)}([^a-z0-9]|$)`, 'g');
      count += (body.match(re) ?? []).length;
      if (titleZone.includes(alias) || allCapsZone.includes(alias)) strong = true;
    }
    if (count === 0) continue;

    let level = 1;
    if (count >= 2) level = 2;
    if (count >= 4) level = 3;
    if (count >= 7) level = 4;
    if (strong) level = Math.min(5, level + 1);
    if (SENIORITY_BOOST.test(body) && count >= 5) level = Math.min(5, level + 1);

    out.push({ slug: skill.slug, name: skill.name, level, mentions: count, strongContext: strong });
  }
  return out.sort((a, b) => b.level - a.level || b.mentions - a.mentions);
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

// Convenience: build a skills record from extraction, capped at top 15 skills
export function skillsFromCV(cvText: string): Record<string, number> {
  const extracted = extractSkills(cvText).slice(0, 15);
  return Object.fromEntries(extracted.map((e) => [e.slug, e.level]));
}

export function skillName(slug: string): string {
  return SKILL_MAP[slug]?.name ?? slug;
}
