// Build-time integrity checks for the content graph. The series/related/wikilink
// relationships are easy to break silently (a typo'd slug just vanishes), so we
// fail the build the moment one doesn't resolve. Run via the Astro integration
// in astro.config (every build) or `npm run validate`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildIndex } from './content-index.mjs';

const WIKILINK = /\[\[([^\]]+)\]\]/g;

// Codepoints covered by the committed OG subset font, written by make-og-font.
function loadOgGlyphs() {
  try {
    const p = fileURLToPath(new URL('../assets/og/cjk-glyphs.json', import.meta.url));
    return new Set(JSON.parse(readFileSync(p, 'utf8')));
  } catch {
    return null;
  }
}

export function validateContent() {
  const index = buildIndex('');
  const ids = new Set(index.keys());
  const entries = [...index.values()];
  const errors = [];
  const warnings = [];

  // 1. related: every target must exist; no self-references.
  for (const e of entries) {
    for (const rel of e.related) {
      if (rel === e.id) errors.push(`[related] ${e.id} 引用了自己`);
      else if (!ids.has(rel)) errors.push(`[related] ${e.id} → 未知条目「${rel}」`);
    }
  }

  // 2. series: seriesOrder must be present, unique, and contiguous from 1.
  const bySeries = new Map();
  for (const e of entries) {
    if (e.draft || !e.series) continue;
    if (!bySeries.has(e.series)) bySeries.set(e.series, []);
    bySeries.get(e.series).push(e);
  }
  for (const [name, items] of bySeries) {
    const seen = new Map();
    for (const e of items) {
      if (e.seriesOrder === undefined || Number.isNaN(e.seriesOrder)) {
        errors.push(`[series] 「${name}」中 ${e.id} 缺少 seriesOrder`);
        continue;
      }
      if (seen.has(e.seriesOrder)) {
        errors.push(
          `[series] 「${name}」seriesOrder=${e.seriesOrder} 重复：${seen.get(e.seriesOrder)} 与 ${e.id}`,
        );
      } else {
        seen.set(e.seriesOrder, e.id);
      }
    }
    const orders = [...seen.keys()].sort((a, b) => a - b);
    orders.forEach((o, i) => {
      if (o !== i + 1) {
        warnings.push(`[series] 「${name}」seriesOrder 不连续：期望 ${i + 1}，实际 ${o}`);
      }
    });
  }

  // 3. wikilinks: every [[slug]] in prose must resolve.
  for (const e of entries) {
    let m;
    WIKILINK.lastIndex = 0;
    while ((m = WIKILINK.exec(e.body || ''))) {
      const target = m[1].split('|')[0].trim();
      if (!ids.has(target)) errors.push(`[wikilink] ${e.id} → 未知条目「${target}」`);
    }
  }

  // 4. OG font coverage: warn if a title/description char isn't in the subset
  //    font (it would render as tofu on the share card). Fix: re-run
  //    `npm run og:font <source-font>` to regenerate the subset.
  const ogGlyphs = loadOgGlyphs();
  if (ogGlyphs) {
    const missing = new Set();
    for (const e of entries) {
      for (const ch of (e.title || '') + (e.description || '') + (e.category || '')) {
        const cp = ch.codePointAt(0);
        if (cp > 0x20 && !ogGlyphs.has(cp)) missing.add(ch);
      }
    }
    if (missing.size) {
      warnings.push(
        `[og-font] 分享图字体缺少 ${missing.size} 个字形：${[...missing].join('')} —— 运行 npm run og:font 重新生成`,
      );
    }
  }

  return { errors, warnings, count: entries.length };
}
