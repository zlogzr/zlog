/**
 * Cross-collection helpers that treat 博客(posts) 与 知识库(notes) as one graph.
 * Powers 系列/学习路径 (series) and 双向链接/反向链接 (related + backlinks).
 *
 * Entries are referenced by their bare `id` (the filename without extension).
 * Post and note ids don't collide today; if one ever did, notes win — kept
 * deterministic so links never silently point at the wrong thing.
 */
import { getCollection } from 'astro:content';
import { withBase } from './url';

export interface Entry {
  id: string;
  kind: 'post' | 'note';
  title: string;
  description?: string;
  href: string;
  /** 知识库分类（仅 note）。 */
  category?: string;
  series?: string;
  seriesOrder?: number;
  related: string[];
}

function toEntry(kind: 'post' | 'note', e: any): Entry {
  return {
    id: e.id,
    kind,
    title: e.data.title,
    description: e.data.description,
    href: withBase(`/${kind === 'post' ? 'posts' : 'notes'}/${e.id}`),
    category: e.data.category,
    series: e.data.series,
    seriesOrder: e.data.seriesOrder,
    related: e.data.related ?? [],
  };
}

/** All published entries across both collections, as a flat unified list. */
export async function getAllEntries(): Promise<Entry[]> {
  const [posts, notes] = await Promise.all([
    getCollection('posts', ({ data }) => !data.draft),
    getCollection('notes', ({ data }) => !data.draft),
  ]);
  // notes pushed first so they take precedence in the id map on any collision
  return [...notes.map((n) => toEntry('note', n)), ...posts.map((p) => toEntry('post', p))];
}

/** id → Entry, for resolving `related` targets and series membership. */
export function indexById(entries: Entry[]): Map<string, Entry> {
  const m = new Map<string, Entry>();
  for (const e of entries) if (!m.has(e.id)) m.set(e.id, e);
  return m;
}

export interface Series {
  name: string;
  items: Entry[];
}

/** Group entries by `series`, each ordered by seriesOrder then title. */
export function getSeries(entries: Entry[]): Series[] {
  const m = new Map<string, Entry[]>();
  for (const e of entries) {
    if (!e.series) continue;
    if (!m.has(e.series)) m.set(e.series, []);
    m.get(e.series)!.push(e);
  }
  const list = [...m.entries()].map(([name, items]) => ({
    name,
    items: items.sort(
      (a, b) =>
        (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0) || a.title.localeCompare(b.title, 'zh'),
    ),
  }));
  // Larger series first; stable by name otherwise.
  return list.sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name, 'zh'));
}

/**
 * For one entry: the series it belongs to (with neighbours) + its outgoing
 * related links + incoming backlinks (others that list it in `related`).
 */
export function getConnections(entry: Entry, entries: Entry[]) {
  const byId = indexById(entries);

  const series = entry.series
    ? getSeries(entries).find((s) => s.name === entry.series) ?? null
    : null;
  const seriesIndex = series ? series.items.findIndex((e) => e.id === entry.id) : -1;

  const related = entry.related.map((id) => byId.get(id)).filter((e): e is Entry => Boolean(e));

  const backlinks = entries.filter(
    (e) => e.id !== entry.id && e.related.includes(entry.id) && !entry.related.includes(e.id),
  );

  return { series, seriesIndex, related, backlinks };
}
