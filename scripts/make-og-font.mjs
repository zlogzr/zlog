#!/usr/bin/env node
// Subset a (large, OFL-licensed) CJK source font down to only the glyphs the OG
// cards actually use — every title/description/category/tag char + ASCII +
// common punctuation. Produces a tiny font committed to the repo so the build
// is self-contained (no font download, no headless browser) and CI-safe.
//
// Usage: node scripts/make-og-font.mjs <source-font.otf>
// Get a source font once, e.g. Noto Sans SC (OFL):
//   curl -L -o /tmp/notosc.otf \
//     https://github.com/notofonts/noto-cjk/raw/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import subsetFont from 'subset-font';
import { buildIndex } from '../src/lib/content-index.mjs';

// Inlined from src/lib/site.ts (a .ts module can't be imported by plain Node).
// These rarely change; the subset only needs their characters.
const SITE = { name: 'zlog 的技术笔记', shortName: 'zlog' };
const AUTHOR = { name: 'zlog', role: '前端工程师 · 写代码的人' };

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', 'src', 'assets', 'og');

const src = process.argv[2];
if (!src) {
  console.error('用法: node scripts/make-og-font.mjs <source-font.otf>');
  process.exit(1);
}

// Gather every character the cards can render.
const entries = [...buildIndex('').values()];
let chars = '';
for (const e of entries) {
  chars += (e.title || '') + (e.description || '') + (e.category || '');
}
chars += SITE.name + SITE.shortName + AUTHOR.name + AUTHOR.role;
// ASCII + common CJK punctuation + the static label glyphs used on cards.
chars +=
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
  ' .,:;!?@#%&*()[]{}<>/\\|-_=+~`\'"' +
  '。，、：；！？「」『』（）【】《》—…·　／' +
  '文章笔记思考知识库系列第篇分钟阅读更新于';

const text = [...new Set(chars)].join('');
const buf = readFileSync(src);
const subset = await subsetFont(buf, text, { targetFormat: 'woff' });

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'cjk-subset.woff'), subset);

const codepoints = [...new Set(text)].map((c) => c.codePointAt(0));
writeFileSync(join(OUT_DIR, 'cjk-glyphs.json'), JSON.stringify(codepoints));

console.log(
  `✓ 子集字体生成：${text.length} 个字形，${(subset.length / 1024).toFixed(1)} KB → src/assets/og/cjk-subset.woff`,
);
