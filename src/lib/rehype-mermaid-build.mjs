import { visit } from 'unist-util-visit';
import { createMermaidRenderer } from 'mermaid-isomorphic';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 构建期把 ```mermaid 渲染成「浅 + 深」两份静态 SVG，写到磁盘并以 <img> 引用，
 * 完全不向浏览器发送 mermaid 运行时。
 *
 * 缓存即文件：SVG 文件名按「图表源码的 sha256」生成（确定性、与 Node 版本无关）。
 *   - 文件已存在 → 直接复用，绝不启动无头浏览器；
 *   - 文件缺失（新图或改了图）→ 用 mermaid-isomorphic + Playwright 渲染并写盘。
 * 因此：本地（有中文字体的环境）`npm run build` 渲染一次、把 public/beoe 一起提交，
 * 之后所有构建（含 CI 的 withastro/action）都命中已提交文件、零浏览器、零 mermaid JS。
 * 改图后忘了本地重渲？CI 会因缺浏览器而「显式失败」，而非静默发布旧图。
 *
 * 为什么不用 @beoe/rehype-mermaid：其 0.4.2 的 cache 选项被解构后并未传入底层
 * rehype-code-hook（实测空操作），无法实现「提交缓存、CI 免浏览器」。自实现更可控。
 *
 * 输出：<figure class="beoe mermaid"><div><img class="beoe-light"><img class="beoe-dark">
 * </div></figure>，由 global.css 基于 [data-theme] 切换显示。
 */
export default function rehypeMermaidBuild({
  fsPath = 'public/beoe',
  webPath = '/beoe',
  mermaidConfig = {},
} = {}) {
  let renderer;

  const renderSvg = async (source, dark, prefix) => {
    // 懒创建：全部命中缓存时永不创建 renderer，也就永不启动浏览器（CI 安全）。
    if (!renderer) renderer = createMermaidRenderer();
    const [res] = await renderer([source], {
      prefix,
      mermaidConfig: { ...mermaidConfig, ...(dark ? { theme: 'dark' } : {}) },
    });
    if (res.status !== 'fulfilled') throw new Error(String(res.reason));
    return res.value.svg;
  };

  return async (tree) => {
    const jobs = [];
    visit(tree, 'element', (node, index, parent) => {
      if (parent == null || index == null) return;
      if (node.tagName !== 'pre' || node.children?.length !== 1) return;
      const code = node.children[0];
      if (code?.tagName !== 'code') return;
      const cls = code.properties?.className;
      const lang = Array.isArray(cls) ? String(cls[0] ?? '').replace('language-', '') : '';
      if (lang !== 'mermaid') return;

      const source = code.children.map((c) => (c.type === 'text' ? c.value : '')).join('');
      const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
      const lightName = `${hash}.svg`;
      const darkName = `${hash}-dark.svg`;
      const lightFile = path.join(fsPath, lightName);
      const darkFile = path.join(fsPath, darkName);

      jobs.push(
        (async () => {
          if (!fs.existsSync(lightFile) || !fs.existsSync(darkFile)) {
            const [light, dark] = await Promise.all([
              renderSvg(source, false, `m${hash}`),
              renderSvg(source, true, `m${hash}d`),
            ]);
            fs.mkdirSync(fsPath, { recursive: true });
            fs.writeFileSync(lightFile, light);
            fs.writeFileSync(darkFile, dark);
          }
          parent.children[index] = figure(
            path.posix.join(webPath, lightName),
            path.posix.join(webPath, darkName),
          );
        })(),
      );
    });
    if (jobs.length) await Promise.all(jobs);
  };
}

const img = (src, className) => ({
  type: 'element',
  tagName: 'img',
  properties: { src, className: [className], loading: 'lazy', decoding: 'async' },
  children: [],
});

const figure = (lightUrl, darkUrl) => ({
  type: 'element',
  tagName: 'figure',
  properties: { className: ['beoe', 'mermaid'] },
  children: [
    {
      type: 'element',
      tagName: 'div',
      properties: {},
      children: [img(lightUrl, 'beoe-light'), img(darkUrl, 'beoe-dark')],
    },
  ],
});
