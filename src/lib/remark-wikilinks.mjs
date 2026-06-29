import { visit } from 'unist-util-visit';
import { buildIndex } from './content-index.mjs';
import { BASE } from './base.mjs';

// Built once per process. Lets prose write `[[react-fiber-reconciliation]]`
// (or `[[slug|自定义文字]]`) and have it resolve to the right in-site link.
const index = buildIndex(BASE);

const WIKILINK = /\[\[([^\]]+)\]\]/g;

/**
 * Resolve [[slug]] / [[slug|label]] inside prose to site links. Unknown slugs
 * render as a visible broken span (and the content validator fails the build),
 * so a typo can never ship as silently-missing.
 */
export default function remarkWikiLinks() {
  return (tree) => {
    visit(tree, 'text', (node, i, parent) => {
      if (!parent || typeof i !== 'number') return;
      if (!node.value.includes('[[')) return;

      const out = [];
      let last = 0;
      let m;
      WIKILINK.lastIndex = 0;
      while ((m = WIKILINK.exec(node.value))) {
        if (m.index > last) out.push({ type: 'text', value: node.value.slice(last, m.index) });
        const [rawId, rawLabel] = m[1].split('|').map((s) => s.trim());
        const entry = index.get(rawId);
        const label = rawLabel || (entry ? entry.title : rawId);
        if (entry) {
          out.push({
            type: 'link',
            url: entry.href,
            data: { hProperties: { className: ['wikilink'] } },
            children: [{ type: 'text', value: label }],
          });
        } else {
          out.push({
            type: 'html',
            value: `<span class="wikilink-broken" title="未找到条目：${rawId}">${label}</span>`,
          });
        }
        last = m.index + m[0].length;
      }
      if (last < node.value.length) out.push({ type: 'text', value: node.value.slice(last) });

      parent.children.splice(i, 1, ...out);
      return i + out.length;
    });
  };
}
