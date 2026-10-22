import type { Lang } from '@/lib/types';

// ─── Fact-check ledger: every Malaysia / labour-market stat, sourced ────────
// Each claim used anywhere in the product appears here with its publisher,
// URL, date and verification status. Two claims inherited from the original
// problem brief ("56% use AI tools", "26% formally trained") could not be
// re-verified online (the Hays Asia Salary Guide is a form-gated PDF), so
// they are marked "indicative" and paired with verified alternatives —
// per the competition rule: no unsourced statistics.
//
// Fact-checked on: 21 Oct 2026.

export type FactStatus = 'verified' | 'indicative';

export interface FactDef {
  id: string;
  value: string;
  claim: Record<Lang, string>;
  publisher: string;
  title: string;
  url: string;
  date: string;
  status: FactStatus;
  note?: Record<Lang, string>;
}

export const FACT_CHECKED_ON = '21 Oct 2026';

export const FACTS: FactDef[] = [
  {
    id: 'mosti-600k',
    value: '600,000+',
    claim: {
      en: 'Malaysian workers must undergo reskilling within 3–5 years as AI disrupts clerical and routine work',
      ms: 'Pekerja Malaysia perlu dilatih semula dalam masa 3–5 tahun apabila AI mengganggu kerja kerani dan rutin',
      zh: '马来西亚员工必须在3–5年内接受再培训，因为AI正在冲击文书和常规工作',
      ru: 'малайзийских работников должны пройти переквалификацию в течение 3–5 лет по мере того, как ИИ вытесняет канцелярский и рутинный труд',
    },
    publisher: 'MOSTI — Minister Chang Lih Kang',
    title: 'Malay Mail / HR Asia coverage',
    url: 'https://www.malaymail.com/news/malaysia/2025/01/07/mosti-ai-disruption-looms-in-malaysia-600000-workers-must-reskill-in-three-to-five-years/162368',
    date: '7 Jan 2025',
    status: 'verified',
    note: {
      en: 'Also: “AI set to impact over 30% of jobs in Malaysia in the next 10 years” (Staffing Industry Analysts).',
      ms: 'Juga: “AI akan menjejaskan lebih 30% pekerjaan di Malaysia dalam 10 tahun akan datang”.',
      zh: '另见：「AI将在未来10年影响马来西亚超30%的岗位」。',
      ru: 'Также: «ИИ затронет более 30% рабочих мест Малайзии в ближайшие 10 лет».',
    },
  },
  {
    id: 'isis-4-2m',
    value: '4.2 million',
    claim: {
      en: 'Malaysian workers — 28% of the labour force — are highly exposed to generative AI technologies',
      ms: 'Pekerja Malaysia — 28% daripada tenaga buruh — sangat terdedah kepada teknologi AI generatif',
      zh: '马来西亚员工——占劳动力的28%——高度暴露于生成式AI技术',
      ru: 'работников Малайзии — 28% рабочей силы — сильно подвержены влиянию генеративного ИИ',
    },
    publisher: 'ISIS Malaysia',
    title: 'Novel AI technologies and the future of work in Malaysia',
    url: 'https://www.isis.org.my/2025/07/06/novel-ai-technologies-and-the-future-of-work-in-malaysia',
    date: 'Jul 2025',
    status: 'verified',
  },
  {
    id: 'wef-foj-170m',
    value: '170M / 92M',
    claim: {
      en: 'New jobs created vs displaced worldwide by 2030 (net +78M); 39% of workers’ key skills will change',
      ms: 'Pekerjaan baharu dicipta vs tersingkir seluruh dunia menjelang 2030 (bersih +78 juta); 39% kemahiran utama berubah',
      zh: '到2030年全球新增 vs 消失的岗位（净增7800万）；39%员工的核心技能将改变',
      ru: 'новых рабочих мест против упразднённых в мире к 2030 г. (чистый прирост +78 млн); 39% ключевых навыков изменятся',
    },
    publisher: 'World Economic Forum',
    title: 'Future of Jobs Report 2025',
    url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/',
    date: 'Jan 2025',
    status: 'verified',
  },
  {
    id: 'dosm-underemp',
    value: '1.60 million',
    claim: {
      en: 'Malaysian graduates were employed below their qualifications in 2024 (+3.9% year-on-year)',
      ms: 'Graduan Malaysia bekerja di bawah kelayakan mereka pada 2024 (+3.9% tahunan)',
      zh: '2024年马来西亚毕业生从事低于其资格的工作（同比+3.9%）',
      ru: 'малайзийских выпускников в 2024 г. работали ниже своей квалификации (+3.9% за год)',
    },
    publisher: 'DOSM (official statistics)',
    title: 'Graduates Statistics 2024',
    url: 'https://www.dosm.gov.my/uploads/release-content/file_20260401145140.pdf',
    date: '2024 (published 2025)',
    status: 'verified',
  },
  {
    id: 'dosm-youth',
    value: '9.9%',
    claim: {
      en: 'Youth unemployment rate in Malaysia (ages 15–24), Q1 2025 — roughly triple the overall rate',
      ms: 'Kadar pengangguran belia di Malaysia (15–24 tahun), S1 2025 — kira-kira tiga kali kadar keseluruhan',
      zh: '马来西亚青年失业率（15–24岁），2025年第一季度——约为总体失业率的三倍',
      ru: 'уровень молодёжной безработицы в Малайзии (15–24 года), Q1 2025 — примерно втрое выше общего',
    },
    publisher: 'DOSM (official statistics)',
    title: 'Labour Market Review Q1 2025',
    url: 'https://storage.dosm.gov.my/analysis/lmr_2025-q1_en.pdf',
    date: 'May 2025',
    status: 'verified',
  },
  {
    id: 'google-113b',
    value: 'USD 113.4B',
    claim: {
      en: 'Annual economic value generative AI could unlock for Malaysia by transforming how work is done',
      ms: 'Nilai ekonomi tahunan yang boleh dibuka oleh AI generatif untuk Malaysia dengan mengubah cara kerja',
      zh: '生成式AI通过变革工作方式每年可为马来西亚释放的经济价值',
      ru: 'годовой экономической ценности может открыть генеративный ИИ для Малайзии, преобразуя способы работы',
    },
    publisher: 'ai.gov.my (National AI Office)',
    title: 'The Economic Impact of Generative AI in Malaysia',
    url: 'https://ai.gov.my/media/thought-leadership/Reports-06-EN-Economic-Impact-of-Generative-AI-MY-1.pdf',
    date: '2025',
    status: 'verified',
  },
  {
    id: 'msft-wti-24',
    value: '24%',
    claim: {
      en: 'Of Malaysian workers are “Frontier Professionals” — the most advanced AI users — vs 16% globally',
      ms: 'Pekerja Malaysia ialah “Frontier Professionals” — pengguna AI paling mahir — berbanding 16% global',
      zh: '的马来西亚员工属于“前沿专业人士”——最资深的AI用户——全球比例为16%',
      ru: 'работников Малайзии — «профессионалы фронтира», самые продвинутые пользователи ИИ (в мире — 16%)',
    },
    publisher: 'Microsoft',
    title: '2026 Work Trend Index — Malaysia',
    url: 'https://news.microsoft.com/source/asia/features/microsofts-2026-work-trend-index-malaysian-workforce-is-ready-for-ai-and-organizations-must-keep-pace',
    date: '23 Jun 2026',
    status: 'verified',
  },
  {
    id: 'iba-12',
    value: '12%',
    claim: {
      en: 'Of Malaysian employees receive sufficient AI training to benefit fully from AI at work',
      ms: 'Pekerja Malaysia menerima latihan AI yang mencukupi untuk manfaat penuh di tempat kerja',
      zh: '的马来西亚员工接受了足以充分受益于AI的培训',
      ru: 'малайзийских сотрудников получают достаточное обучение ИИ для полноценной пользы на работе',
    },
    publisher: 'International Bar Association',
    title: 'Artificial intelligence at work: a Malaysian perspective',
    url: 'https://www.ibanet.org/artificial-intelligence-at-work-a-Malaysian-perspective',
    date: 'Apr 2026',
    status: 'verified',
    note: {
      en: 'Verified replacement for the brief’s unverified “26% formally trained” claim (see below).',
      ms: 'Pengganti tersahkan untuk dakwaan “26% dilatih formal” yang tidak disahkan.',
      zh: '已核实的替代数据，对应简报中未获核实的“26%受过正式培训”。',
      ru: 'Проверенная замена неверифицируемого показателя брифа «26% прошли формальное обучение».',
    },
  },
  {
    id: 'sim-620k',
    value: '~620,000',
    claim: {
      en: 'Jobs in Malaysia are at high risk of being replaced or made obsolete by automation',
      ms: 'Pekerjaan di Malaysia berisiko tinggi digantikan atau lupus akibat automasi',
      zh: '马来西亚岗位面临被自动化取代或淘汰的高风险',
      ru: 'рабочих мест в Малайзии под высоким риском замещения или упразднения из-за автоматизации',
    },
    publisher: 'WEF (HR Minister Steven Sim)',
    title: 'How Malaysia has been preparing its workforce for the future',
    url: 'https://www.weforum.org/stories/jobs-and-the-future-of-work/malaysia-steven-sim-workforce-future-ai',
    date: 'Jun 2025',
    status: 'verified',
  },
  {
    id: 'mckinsey-25h',
    value: '25%',
    claim: {
      en: 'Of work hours in Malaysia could be displaced by automation by 2030 (~4.5M full-time-equivalent workers)',
      ms: 'Jam bekerja di Malaysia mungkin terjejas oleh automasi menjelang 2030 (~4.5 juta pekerja setara)',
      zh: '到2030年，马来西亚约25%的工时可能被自动化取代（约450万全时等效员工）',
      ru: 'рабочих часов в Малайзии может быть вытеснено автоматизацией к 2030 г. (~4,5 млн эквивалентных работников)',
    },
    publisher: 'McKinsey & Company',
    title: 'Automation and adaptability: the future of work in Malaysia',
    url: 'https://www.mckinsey.com/featured-insights/asia-pacific/automation-and-adaptability-how-malaysia-can-navigate-the-future-of-work',
    date: 'Feb 2020',
    status: 'verified',
  },
  {
    id: 'hays-56',
    value: '56%',
    claim: {
      en: 'Of Malaysian professionals already use AI tools at work — competition-brief claim attributed to the Hays Asia Salary Guide 2025',
      ms: 'Profesional Malaysia sudah menggunakan alat AI di tempat kerja — dakwaan taklimat pertandingan daripada Hays Asia Salary Guide 2025',
      zh: '的马来西亚职场人已在使用AI工具——出自竞赛简报所引的《瀚纳仕亚洲薪酬指南2025》',
      ru: 'малайзийских профессионалов уже используют ИИ-инструменты — данные брифа конкурса со ссылкой на Hays Asia Salary Guide 2025',
    },
    publisher: 'Hays Malaysia',
    title: 'Asia Salary Guide 2025 (form-gated PDF)',
    url: 'https://www.hays.com.my/salary-guide',
    date: '2025',
    status: 'indicative',
    note: {
      en: 'Could not be independently re-verified online (gated publication). The same guide reports 54% of Asia respondents use AI tools. We lead with verified stats instead.',
      ms: 'Tidak dapat disahkan semula secara dalam talian (penerbitan berpagar). Panduan yang sama melaporkan 54% responden Asia menggunakan alat AI. Kami dahulukan statistik tersahkan.',
      zh: '无法在线独立复核（需注册下载）。同指南报告54%的亚洲受访者使用AI工具。产品中优先使用已核实数据。',
      ru: 'Не удалось независимо перепроверить онлайн (доступ по регистрации). Тот же отчёт указывает, что 54% респондентов в Азии используют ИИ. В продукте приоритет — проверенные данные.',
    },
  },
  {
    id: 'hays-26',
    value: '26%',
    claim: {
      en: 'Have received formal AI training — competition-brief claim attributed to the Hays Asia Salary Guide 2025',
      ms: 'Menerima latihan AI formal — dakwaan taklimat pertandingan daripada Hays Asia Salary Guide 2025',
      zh: '接受过正式AI培训——出自竞赛简报所引的《瀚纳仕亚洲薪酬指南2025》',
      ru: 'прошли формальное обучение ИИ — данные брифа конкурса со ссылкой на Hays Asia Salary Guide 2025',
    },
    publisher: 'Hays Malaysia',
    title: 'Asia Salary Guide 2025 (form-gated PDF)',
    url: 'https://www.hays.com.my/salary-guide',
    date: '2025',
    status: 'indicative',
    note: {
      en: 'Unverified online. Verified alternatives shown in this ledger: 12% receive sufficient AI training (IBA, 2026); 29% of Malaysians self-fund AI training (Microsoft/LinkedIn SEA, 2026).',
      ms: 'Tidak disahkan dalam talian. Alternatif tersahkan: 12% menerima latihan AI mencukupi (IBA, 2026); 29% membiayai latihan AI sendiri (Microsoft/LinkedIn SEA, 2026).',
      zh: '未在线核实。已核实的替代数据：12%接受了充分的AI培训（IBA，2026）；29%自费学习AI（Microsoft/LinkedIn东南亚，2026）。',
      ru: 'Онлайн не подтверждено. Проверенные альтернативы: 12% получают достаточное обучение ИИ (IBA, 2026); 29% оплачивают обучение ИИ сами (Microsoft/LinkedIn SEA, 2026).',
    },
  },
];

// Headline stats for the landing page (order matters)
export const FACTS_HEADLINE = ['mosti-600k', 'isis-4-2m', 'wef-foj-170m', 'dosm-underemp'];

export const FACT_MAP: Record<string, FactDef> = Object.fromEntries(
  FACTS.map((f) => [f.id, f]),
);
