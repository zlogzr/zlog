/**
 * Single source of truth for site-wide metadata.
 * Imported by the layout, RSS feed, structured data, and pages so identity,
 * SEO copy, and social links never drift out of sync.
 */
export const SITE = {
  /** Full site name — used in <title> suffix and feed title. */
  name: 'zlog 的技术笔记',
  /** Short brand shown in the header / PWA. */
  shortName: 'zlog',
  /** Default meta description / tagline. */
  description: '一个写代码的人的博客与知识库 —— 记录工程实践、技术思考，和那些想明白与还没想明白的问题。',
  /** Production origin (no trailing slash). Mirrors astro.config `site`. */
  origin: 'https://zlogzr.github.io',
  locale: 'zh-CN',
  ogLocale: 'zh_CN',
} as const;

export const AUTHOR = {
  name: 'zlog',
  /** One-line role shown in the hero. */
  role: '前端工程师 · 写代码的人',
  github: 'https://github.com/zlogzr',
  githubUser: 'zlogzr',
  email: 'zylogzr@163.com',
} as const;

/** Primary navigation — drives the header and is reused for sitemaps/JSON-LD. */
export const NAV = [
  { href: '/posts', label: '博客' },
  { href: '/notes', label: '知识库' },
  { href: '/projects', label: '作品' },
  { href: '/til', label: '随手记' },
  { href: '/about', label: '关于' },
] as const;
