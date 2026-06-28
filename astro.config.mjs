// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

// GitHub Pages 子路径部署：站点根域名 + 项目子路径
export default defineConfig({
  site: 'https://zlogzr.github.io',
  base: '/zlog',
  // 注意：pagefind 需放在最后，它依赖其它集成已完成构建
  integrations: [sitemap(), pagefind()],
  markdown: {
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
