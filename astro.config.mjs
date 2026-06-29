// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import remarkDirective from 'remark-directive';
import remarkWikiLinks from './src/lib/remark-wikilinks.mjs';
import remarkCallouts from './src/lib/remark-callouts.mjs';
import rehypeMermaidBuild from './src/lib/rehype-mermaid-build.mjs';
import { BASE } from './src/lib/base.mjs';
import { validateContent } from './src/lib/validate-content.mjs';

// 构建时内容校验：related/series/wikilink 关系图出错即让构建失败，
// 防止 slug 拼错后静默失链。也可单独跑 `npm run validate`。
function contentValidator() {
  return {
    name: 'content-validator',
    hooks: {
      'astro:build:start': ({ logger }) => {
        const { errors, warnings, count } = validateContent();
        for (const w of warnings) logger.warn(w);
        if (errors.length) {
          for (const e of errors) logger.error(e);
          throw new Error(`内容校验失败：${errors.length} 个错误`);
        }
        logger.info(`内容校验通过：${count} 条内容`);
      },
    },
  };
}

// GitHub Pages 子路径部署：站点根域名 + 项目子路径
export default defineConfig({
  site: 'https://zlogzr.github.io',
  base: BASE,
  // 注意：pagefind 需放在最后，它依赖其它集成已完成构建
  integrations: [contentValidator(), sitemap(), pagefind()],
  markdown: {
    // remarkDirective 解析 :::tip 容器语法，remarkCallouts 再把它变成提示框；
    // remarkWikiLinks 把正文 [[slug]] 解析为站内链接。
    // Mermaid 不再走 remark + 客户端渲染，改为下方 rehypePlugins 在构建期渲染成静态 SVG。
    remarkPlugins: [remarkDirective, remarkCallouts, remarkWikiLinks],
    // 让 Shiki 跳过 ```mermaid，把原始 <code class="language-mermaid"> 留给 rehype-mermaid。
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: {
      // 双主题：浅色 github-light，深色 github-dark。
      // defaultColor: false → 每个 token 同时输出 --shiki-light / --shiki-dark
      // 两套 CSS 变量，由 global.css 里基于 [data-theme] 的规则切换，
      // 从而让代码块跟随站点的「手动」主题开关，而非系统配色。
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: true,
    },
    // 构建期把 ```mermaid 渲染成「浅 + 深」两份静态 SVG（落到 public/beoe/），由
    // .beoe-light / .beoe-dark + [data-theme] 的 CSS 切换显示，完全不向浏览器发送
    // mermaid 运行时。SVG 文件名按图表源码哈希生成、即缓存：本地渲染一次并提交
    // public/beoe 后，后续构建（含 CI）命中文件、无需浏览器（见该插件注释）。
    rehypePlugins: [
      [
        rehypeMermaidBuild,
        {
          fsPath: 'public/beoe',
          webPath: `${BASE}/beoe`,
          // 图中标签是中文，用 CJK 字体渲染避免豆腐块；securityLevel:'loose' 让流程图
          // 标签里的 <br/> 生效（图表源自站点自有内容、非用户输入，安全）。
          mermaidConfig: {
            securityLevel: 'loose',
            fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          },
        },
      ],
    ],
  },
});
