# zlog 的技术笔记

基于 [Astro](https://astro.build) 的个人博客 + 知识库站点。

🔗 线上地址：**https://zlogzr.github.io/zlog/**

## 本地开发

```bash
npm install
npm run dev      # 启动开发服务器，默认 http://localhost:4321
npm run build    # 构建到 dist/（含 Pagefind 搜索索引）
npm run preview  # 本地预览构建产物
```

> 本仓库用项目级 [.npmrc](.npmrc) 锁定了公网 npm 源（`registry.npmjs.org`）。
> 这是为了避免锁文件指向公司内网私服，导致 GitHub Actions 拉不到依赖。请勿删除。

## 怎么写内容

### 写一篇博客
在 `src/content/posts/` 新建一个 `.md` 文件，开头加上：

```yaml
---
title: 文章标题
date: 2026-06-24
description: 一句话摘要（可选）
tags: [标签1, 标签2]
draft: false   # true 则不会发布
---

正文用 Markdown 书写……
```

文件名就是 URL，例如 `my-post.md` → `/posts/my-post`。

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

写完照常 `git push`，约 1–2 分钟后自动上线，**搜索索引和 RSS 会自动更新**，无需手动操作。

## 功能

### 🔍 全文搜索
- 由 [Pagefind](https://pagefind.app) 提供，构建时索引、纯前端、完全自托管（无外部依赖，国内可访问）。
- 搜索框在知识库页顶部（[/notes](https://zlogzr.github.io/zlog/notes)），索引范围是**博客文章 + 知识库笔记的正文**。
- 只索引带 `data-pagefind-body` 标记的文章/笔记正文（见 `src/pages/posts/[...slug].astro`、`src/pages/notes/[...slug].astro`），列表页和导航不会污染搜索结果。
- 搜索框组件：[src/components/Search.astro](src/components/Search.astro)，UI 跟随站点深浅色主题、已汉化。

### 📡 RSS 订阅
- 地址：**https://zlogzr.github.io/zlog/rss.xml** （页脚也有入口）。
- 只收录博客文章（`posts`），按时间倒序。
- 源文件：[src/pages/rss.xml.js](src/pages/rss.xml.js)。新增文章后自动出现在订阅里。

### 💬 评论（giscus）
- 基于 [giscus](https://giscus.app)，评论存到本仓库的 **GitHub Discussions**（Announcements 分类）。
- 每篇博客和笔记底部都有评论区，深浅色跟随站点切换、已设为中文。
- 组件：[src/components/Comments.astro](src/components/Comments.astro)。
- 访客需用 **GitHub 账号**登录才能评论；`giscus.app` 在国内可能偏慢。

#### ⚠️ 首次启用需安装 giscus App（一次性）
评论代码已就绪，但要真正能用，需仓库管理员安装一次 giscus 的 GitHub App：

1. 打开 https://github.com/apps/giscus
2. 点 **Install**
3. 选 **Only select repositories** → 勾选 **`zlogzr/zlog`** → **Install**

装完刷新任意文章页即可评论。若要换分类/改配置，修改 `Comments.astro` 里的 `data-*` 参数
（`data-repo-id`、`data-category-id` 等可在 https://giscus.app 配置页生成）。

## 部署（GitHub Pages + Actions，已配置好）

每次 `git push` 到 `main` 分支，[.github/workflows/deploy.yml](.github/workflows/deploy.yml)
会自动构建并发布到 GitHub Pages，无需手动操作。

关键配置：

- 站点是 **项目页**，部署在子路径 `/zlog/` 下。`astro.config.mjs` 里设了
  `site: 'https://zlogzr.github.io'` 与 `base: '/zlog'`。
- 因此**所有站内链接都要用** [src/lib/url.ts](src/lib/url.ts) 里的 `withBase()` 包一层，
  否则子路径下会 404。

### 想绑定自定义域名？
1. 在 `astro.config.mjs` 把 `site` 改成你的域名、删掉 `base`（根域名部署不需要子路径）。
2. 把 `withBase()` 的调用可保留（根路径下它等价于原路径），无需逐个改回。
3. 在仓库 Settings → Pages → Custom domain 填域名，并在 DNS 加对应解析记录。
