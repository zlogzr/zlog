import { visit } from 'unist-util-visit';

// Container directives (`:::tip … :::`, parsed by remark-directive) → styled
// callout boxes. Supports an optional custom title: `:::warning[小心并发]`.
const TITLES = {
  tip: '提示',
  note: '笔记',
  info: '说明',
  warning: '注意',
  danger: '警告',
};

// Flatten a node's text content (avoids pulling in mdast-util-to-string).
function textOf(node) {
  if (!node) return '';
  if (node.value) return node.value;
  if (node.children) return node.children.map(textOf).join('');
  return '';
}

export default function remarkCallouts() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'containerDirective') return;
      const type = node.name;
      if (!TITLES[type]) return;

      // `:::tip[自定义标题]` — the label is the first paragraph flagged by remark-directive.
      let title = TITLES[type];
      const first = node.children[0];
      if (first && first.type === 'paragraph' && first.data && first.data.directiveLabel) {
        const label = textOf(first).trim();
        if (label) title = label;
        node.children.shift();
      }

      node.data = node.data || {};
      node.data.hName = 'div';
      node.data.hProperties = { className: ['callout', `callout-${type}`] };

      node.children.unshift({
        type: 'paragraph',
        data: { hName: 'div', hProperties: { className: ['callout-title'] } },
        children: [{ type: 'text', value: title }],
      });
    });
  };
}
