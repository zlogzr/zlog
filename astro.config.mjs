// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 部署前把 site 改成你的正式域名，例如 https://yourname.dev
export default defineConfig({
  site: 'https://example.com',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // 代码高亮主题，浅色用 github-light，深色用 github-dark
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
