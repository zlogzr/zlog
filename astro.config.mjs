// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages 子路径部署：站点根域名 + 项目子路径
export default defineConfig({
  site: 'https://zlogzr.github.io',
  base: '/zlog',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // 代码高亮主题，浅色用 github-light，深色用 github-dark
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
