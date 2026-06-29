// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import remarkDirective from 'remark-directive';
import remarkMermaid from './src/lib/remark-mermaid.mjs';
import remarkWikiLinks from './src/lib/remark-wikilinks.mjs';
import remarkCallouts from './src/lib/remark-callouts.mjs';
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
    // remarkMermaid 把 ```mermaid 转原始 HTML（需先于 Shiki）；
    // remarkWikiLinks 把正文 [[slug]] 解析为站内链接。
    remarkPlugins: [remarkDirective, remarkCallouts, remarkMermaid, remarkWikiLinks],
    shikiConfig: {
      // 双主题：浅色 github-light，深色 github-dark。
      // defaultColor: false → 每个 token 同时输出 --shiki-light / --shiki-dark
      // 两套 CSS 变量，由 global.css 里基于 [data-theme] 的规则切换，
      // 从而让代码块跟随站点的「手动」主题开关，而非系统配色。
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: true,
    },
  },
});
