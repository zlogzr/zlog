import { visit } from 'unist-util-visit';

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Turn ```mermaid fenced blocks into `<pre class="mermaid">` raw HTML *before*
 * Shiki sees them, so the syntax highlighter leaves them alone. The client-side
 * Mermaid component renders them to SVG on load; with JS off, the diagram source
 * stays visible as a readable code block (progressive enhancement).
 */
export default function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (!parent || node.lang !== 'mermaid') return;
      parent.children[index] = {
        type: 'html',
        value: `<pre class="mermaid">${escapeHtml(node.value)}</pre>`,
      };
    });
  };
}
