import re

path = 'src/lib/i18n.ts'
src = open(path, encoding='utf-8').read()

# 1) Remove obsolete unsourced stat keys (landing now renders from src/data/facts.ts)
for key in ['landing.stat1', 'landing.stat1v', 'landing.stat2', 'landing.stat2v', 'landing.stat3', 'landing.stat3v']:
    src = re.sub(rf"^\s*'{key}':.*\n", '', src, flags=re.M, count=1)

# 2) Insert new blocks after each dict's unique anchor line
anchors = {
    'en': "  'match.coach.fallback': 'Narration unavailable — showing structured explanation (the deterministic core is unaffected).',",
    'ms': "  'match.coach.fallback': 'Narasi tidak tersedia — menunjukkan penerangan berstruktur (teras deterministik tetap terjejas sifar).',",
    'zh': "  'match.coach.fallback': '叙述暂不可用——显示结构化解释（确定性核心不受影响）。',",
    'ru': "  'match.coach.fallback': 'Озвучка недоступна — показываем структурированное объяснение (ядро не пострадало).',",
}

for lang, anchor in anchors.items():
    block = open(f'scripts/i18n-block-{lang}.txt', encoding='utf-8').read().rstrip('\n')
    if anchor not in src:
        raise SystemExit(f'ANCHOR NOT FOUND for {lang}')
    src = src.replace(anchor, anchor + '\n\n' + block, 1)

open(path, 'w', encoding='utf-8').write(src)

# 3) Sanity: all four dicts now contain a sample of the new keys
sample_keys = ["'nav.institution'", "'facts.title'", "'onb.emp.step1.q'", "'inst.readiness'", "'tpl.marketing'"]
counts = {k: src.count(k + ':') for k in sample_keys}
print('sanity counts (should each be 4):', counts)
assert all(v == 4 for v in counts.values()), 'missing keys in some dict!'
print('OK: blocks inserted into all 4 dictionaries')
