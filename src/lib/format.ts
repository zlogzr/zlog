/** Formatting helpers shared across pages. */

/**
 * Stable, locale-independent short date (e.g. `2026-06-26`). Pairs with the
 * monospaced UI treatment used for metadata throughout the site.
 */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Full ISO string for `<time datetime>` attributes. */
export function isoDateTime(date: Date): string {
  return date.toISOString();
}

/**
 * Estimate reading time in minutes for mixed 中文 / Latin prose.
 * CJK reads ~350 chars/min; Latin ~220 words/min. Code fences are excluded.
 */
export function readingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ') // links / images
    .replace(/^[#>\-*+\s]+/gm, ' '); // markdown markers

  const cjk = (text.match(/[一-鿿぀-ヿ가-힯]/g) || []).length;
  const words = (text.match(/[A-Za-z0-9]+/g) || []).length;
  const minutes = Math.ceil(cjk / 350 + words / 220);
  return Math.max(1, minutes);
}
