// Build-time content index read straight from the markdown files. Used by the
// wikilink remark plugin and the content validator — both run outside Astro's
// content layer, so they parse the lightweight frontmatter themselves.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(HERE, '..', 'content');

const unquote = (s) => s.trim().replace(/^["']/, '').replace(/["']$/, '');

/** Minimal frontmatter parse for the few fields these tools care about. */
function parse(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = m[1];
  const body = m[2];
  const get = (key) => {
    const r = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return r ? r[1].trim() : undefined;
  };
  const title = get('title');
  const description = get('description');
  const category = get('category');
  const series = get('series');
  const seriesOrderRaw = get('seriesOrder');
  const draftRaw = get('draft');
  const relatedRaw = get('related');
  let related = [];
  if (relatedRaw) {
    related = relatedRaw
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(',')
      .map((s) => unquote(s))
      .filter(Boolean);
  }
  return {
    title: title ? unquote(title) : undefined,
    description: description ? unquote(description) : undefined,
    category: category ? unquote(category) : undefined,
    series: series ? unquote(series) : undefined,
    seriesOrder: seriesOrderRaw !== undefined ? Number(seriesOrderRaw) : undefined,
    draft: draftRaw === 'true',
    related,
    body,
  };
}

/** id -> { id, kind, title, href, series, seriesOrder, draft, related, body } */
export function buildIndex(base = '') {
  const index = new Map();
  for (const [kind, dir] of [
    ['note', 'notes'],
    ['post', 'posts'],
  ]) {
    let files = [];
    try {
      files = readdirSync(join(CONTENT, dir)).filter((f) => f.endsWith('.md'));
    } catch {
      continue;
    }
    for (const file of files) {
      const id = file.replace(/\.md$/, '');
      const raw = readFileSync(join(CONTENT, dir, file), 'utf8');
      const data = parse(raw);
      if (!data) continue;
      // notes win on the (today nonexistent) chance of an id collision
      if (index.has(id) && kind === 'post') continue;
      index.set(id, {
        id,
        kind,
        href: `${base}/${dir}/${id}`,
        ...data,
      });
    }
  }
  return index;
}
