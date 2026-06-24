# zlog 的技术笔记

基于 [Astro](https://astro.build) 的个人博客 + 知识库站点。

## 本地开发

```bash
npm install
npm run dev      # 启动开发服务器，默认 http://localhost:4321
npm run build    # 构建到 dist/
npm run preview  # 本地预览构建产物
```

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

## 部署

构建产物是纯静态文件（`dist/`），可托管到任意平台：

- **Vercel / Netlify**：导入 Git 仓库，框架选 Astro，自动构建。
- **GitHub Pages**：用 Astro 官方 Action，或把 `dist/` 推到 `gh-pages` 分支。

部署前记得把 `astro.config.mjs` 里的 `site` 改成你的正式域名。
