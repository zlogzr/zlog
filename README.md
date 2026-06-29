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
updated: 2026-06-30   # 可选，填了文章页与结构化数据会显示「更新于」
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
series: 系列名         # 可选，归入某条学习路径（可跨博客 / 知识库）
seriesOrder: 1        # 系列内顺序，从 1 连续递增
related: [slug-a, slug-b]  # 可选，相关条目（反向链接自动反推）
---
```

写完照常 `git push`，约 1–2 分钟后自动上线，**搜索索引、RSS、站点地图都会自动更新**，无需手动操作。

### 把内容连成网：系列 / 双向链接

内容多了之后，靠这两样把它们串起来（博客与知识库视为同一张图）：

- **系列（series）**：同名 `series` 的条目按 `seriesOrder` 串成一条**有序学习路径**，文章顶部显示「第 N / M 篇」，[/series](https://zlogzr.github.io/zlog/series) 有总览。
- **双向链接**：`related` 写出链，**反向链接自动反推**，都显示在文末。正文里也可写 `[[slug]]` 或 `[[slug|自定义文字]]` 内联成链。

> **内容校验**：`related` / `series` / `[[wikilink]]` 关系图由[构建时校验](src/lib/validate-content.mjs)兜底——slug 写错、`seriesOrder` 撞号、wikilink 指向不存在的条目，**都会让构建失败**。本地随时可跑 `npm run validate`。

### 提示框（Callout）

正文里可用 `:::类型` 容器语法插入提示框，类型有 `tip` / `note` / `info` / `warning` / `danger`，可选自定义标题：

```markdown
:::warning[最容易踩的坑]
遇到「改了数据库页面却不更新」，先查这次 fetch 的缓存配置。
:::
```

### 图表（Mermaid）

正文里用 ` ```mermaid ` 代码块画流程图 / 状态图等。图表在**构建期**渲染成浅 / 深两份
静态 SVG（落到 `public/beoe/`，按图表源码哈希命名），页面**零 mermaid 运行时**、随主题
切换显示对应版本。实现见 [src/lib/rehype-mermaid-build.mjs](src/lib/rehype-mermaid-build.mjs)。

> **改图后要先本地构建、再提交。** 渲染依赖 Playwright + Chromium，而 CI 不带浏览器、
> 只复用已提交的 SVG。首次准备一次环境：
>
> ```bash
> npx playwright install chromium
> ```
>
> 之后新增 / 修改图表，本地跑一次 `npm run build`（会自动渲染并更新 `public/beoe/`），
> 把 `public/beoe/` 一起 `git add` 提交即可。若忘了重渲，CI 会因缺图**显式失败**，
> 而非静默发布旧图。

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
- **社交分享卡片（每篇自动生成）**：每篇文章 / 笔记在构建时用 [satori](https://github.com/vercel/satori) + [resvg](https://github.com/yisibl/resvg-js)
  生成专属的 1200×630 PNG（带标题、分类、站名），无需无头浏览器。源码：[src/pages/og/[...slug].png.ts](src/pages/og/[...slug].png.ts)。
  - 中文字形来自 [src/assets/og/cjk-subset.woff](src/assets/og/)：一份**按现有标题用字裁剪过**的极小子集字体（OFL 的 Noto Sans SC）。
  - 若新标题用到子集里没有的生僻字，构建会**警告**（`[og-font]`）。届时下载一份源字体后重新生成子集：
    ```bash
    curl -L -o /tmp/notosc.otf \
      https://github.com/notofonts/noto-cjk/raw/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf
    npm run og:font -- /tmp/notosc.otf
    ```
  - 首页等非文章页仍用 [public/og.png](public/og.png) 作默认卡片。

### 📡 RSS 订阅
- 地址：**https://zlogzr.github.io/zlog/rss.xml** （页脚也有入口）。只收录博客文章，按时间倒序。
- **全文输出**：用 Astro 容器 API 把每篇渲染成与页面一致的 HTML（保真 callout、双向链接、代码高亮），
  写入 `<content:encoded>`，阅读器里能读全文而非摘要。
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
