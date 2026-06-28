# zlog 的技术笔记

基于 [Astro](https://astro.build) 的个人博客 + 知识库站点。自托管、无第三方追踪、国内可访问。

🔗 线上地址：**https://zlogzr.github.io/zlog/**

## 本地开发

```bash
npm install
npm run dev      # 启动开发服务器，默认 http://localhost:4321
npm run build    # 构建到 dist/（含 Pagefind 搜索索引）
npm run preview  # 本地预览构建产物
```

> **Node 版本**：Astro 要求 Node **≥ 18.20.8**（或 20.3+ / 22+）。版本过低 `npm run build` 会直接报错。
> GitHub Actions 用的是官方 `withastro/action`，自带合适的 Node，无需操心。
>
> **npm 源**：本仓库用项目级 [.npmrc](.npmrc) 锁定了公网 npm 源（`registry.npmjs.org`），
> 避免锁文件指向公司内网私服导致 CI 拉不到依赖。请勿删除。

## 怎么写内容

### 写一篇博客
在 `src/content/posts/` 新建一个 `.md` 文件，开头加上：

```yaml
---
title: 文章标题
date: 2026-06-24
description: 一句话摘要（可选，会用于列表、SEO 和社交分享）
tags: [标签1, 标签2]
draft: false   # true 则不会发布
---

正文用 Markdown 书写……
```

文件名就是 URL，例如 `my-post.md` → `/posts/my-post`。阅读时长、上一篇/下一篇会**自动**生成。

### 写一条知识库笔记
在 `src/content/notes/` 新建 `.md`：

```yaml
---
title: 笔记标题
category: 分类名      # 知识库按这个分组
description: 一句话说明（可选）
updated: 2026-06-24   # 可选
order: 1              # 同分类内排序，越小越靠前
---
```

写完照常 `git push`，约 1–2 分钟后自动上线，**搜索索引、RSS、站点地图都会自动更新**，无需手动操作。

## 设计与架构

站点本身也当作一份作品集来打磨，几处值得说明的地方：

- **设计系统**：所有颜色、字号、间距、圆角、阴影、动效都集中在 [src/styles/global.css](src/styles/global.css)
  顶部的 design tokens 里，浅色 / 深色两套主题由此派生，组件只引用变量，不写死值。
- **排版**：自托管 [Inter](https://rsms.me/inter/) 可变字体（仅 Latin 子集）+ 系统中文字体（PingFang / 微软雅黑）的混排，
  无需访问字体 CDN，国内打开即用。
- **站点元数据单一来源**：站名、作者、社交链接等集中在 [src/lib/site.ts](src/lib/site.ts)，
  布局、RSS、结构化数据共用，避免到处改。
- **页面过渡**：启用了 Astro 原生 [View Transitions](https://docs.astro.build/en/guides/view-transitions/)，
  跨页切换是平滑淡入而非整页刷新；顶部导航栏在切换时保持不动。
- **主题切换**：深浅色为「手动开关 + 跟随系统」，存于 `localStorage`，在 `<head>` 内联脚本里于首帧前应用，无闪烁；
  代码高亮（Shiki 双主题）也跟随这个手动开关，而非系统配色。
- **可访问性**：跳到主内容链接、`:focus-visible` 焦点环、`prefers-reduced-motion` 全量降级、语义化标签与 ARIA。

## 功能

### 🔍 全文搜索
- 由 [Pagefind](https://pagefind.app) 提供，构建时索引、纯前端、完全自托管（无外部依赖，国内可访问）。
- 搜索框在知识库页顶部（[/notes](https://zlogzr.github.io/zlog/notes)），索引范围是**博客文章 + 知识库笔记的正文**。
- 只索引带 `data-pagefind-body` 标记的正文，列表页和导航不会污染搜索结果。
- 组件：[src/components/Search.astro](src/components/Search.astro)，UI 跟随主题、已汉化。

### 📖 阅读体验
- **阅读进度条**、**目录（TOC）** 带滚动高亮、**代码块一键复制 + 语言标签**、**标题悬停锚点**、**上一篇/下一篇**——
  这些都是渐进增强：关掉 JS，文章依然是一篇干净可读的文档。
- 相关组件：[ReadingProgress](src/components/ReadingProgress.astro)、[TableOfContents](src/components/TableOfContents.astro)、
  [ProseEnhancer](src/components/ProseEnhancer.astro)（复制按钮 / 锚点）、[PrevNext](src/components/PrevNext.astro)。

### 🔎 SEO 与分享
- 每页输出 canonical、Open Graph、Twitter Card、以及 JSON-LD 结构化数据（文章为 `BlogPosting`）。
- 站点地图由 `@astrojs/sitemap` 自动生成，[robots.txt](public/robots.txt) 指向它。
- **社交分享卡片**：[public/og.png](public/og.png)（1200×630）。要改版重新生成时，可编辑卡片 HTML 后用无头浏览器截图，例如：
  `chrome --headless --window-size=1200,630 --screenshot=public/og.png file:///path/to/card.html`。

### 📡 RSS 订阅
- 地址：**https://zlogzr.github.io/zlog/rss.xml** （页脚也有入口）。只收录博客文章，按时间倒序。
- 源文件：[src/pages/rss.xml.js](src/pages/rss.xml.js)，新增文章后自动出现。

### 💬 评论（giscus）
- 基于 [giscus](https://giscus.app)，评论存到本仓库的 **GitHub Discussions**（Announcements 分类），深浅色跟随站点。
- 组件：[src/components/Comments.astro](src/components/Comments.astro)。访客需用 **GitHub 账号**登录才能评论。

#### ⚠️ 首次启用需安装 giscus App（一次性）
1. 打开 https://github.com/apps/giscus → **Install**
2. 选 **Only select repositories** → 勾选 **`zlogzr/zlog`** → **Install**

装完刷新任意文章页即可评论。换分类/改配置在 `Comments.astro` 里的 `data-*` 参数（可在 https://giscus.app 生成）。

## 部署（GitHub Pages + Actions，已配置好）

每次 `git push` 到 `main` 分支，[.github/workflows/deploy.yml](.github/workflows/deploy.yml)
会自动构建并发布到 GitHub Pages，无需手动操作。

关键配置：

- 站点是 **项目页**，部署在子路径 `/zlog/` 下。`astro.config.mjs` 里设了
  `site: 'https://zlogzr.github.io'` 与 `base: '/zlog'`。
- 因此**所有站内链接都要用** [src/lib/url.ts](src/lib/url.ts) 里的 `withBase()`（标签等中文路径用 `tagUrl()`）包一层，
  否则子路径下会 404。

### 想绑定自定义域名？
1. 在 `astro.config.mjs` 把 `site` 改成你的域名、删掉 `base`（根域名部署不需要子路径）。
2. `withBase()` 的调用可保留（根路径下等价于原路径），无需逐个改回。
3. 仓库 Settings → Pages → Custom domain 填域名，并在 DNS 加对应解析记录。
4. 记得同步更新 [src/lib/site.ts](src/lib/site.ts) 的 `origin` 和 [public/robots.txt](public/robots.txt) 里的 Sitemap 地址。
