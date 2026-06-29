---
title: Next.js 的 Metadata：让每个页面都有对的标题与分享卡
category: Next.js
description: SEO 和社交分享靠的是每页正确的 title / description / og 图。App Router 用 Metadata API 把它做成数据，而非手插标签。
updated: 2026-06-29
order: 6
---

一个商品页被分享到微信、发到搜索引擎，长什么样，取决于它的 `<title>`、`description`、和 Open Graph 标签。App Router 不让你手动往 `<head>` 里插标签，而是用 **Metadata API**——把元数据声明成数据，框架负责渲染。

## 静态 metadata：导出一个对象

```ts
// app/about/page.tsx
export const metadata = {
  title: '关于我们',
  description: '团队介绍与联系方式',
  openGraph: { title: '关于我们', images: ['/og/about.png'] },
};
```

## 动态 metadata：根据数据生成

商品页的标题得是具体商品名——用 `generateMetadata`，它能 `await` 取数：

```ts
// app/products/[id]/page.tsx
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);
  return {
    title: `${product.name} - 我的商店`,
    description: product.summary,
    openGraph: {
      title: product.name,
      images: [product.coverImage],     // 每个商品自己的分享图
    },
  };
}
```

> 关键好处：`generateMetadata` 里的 `fetch` 和页面组件里的 `fetch` **会被去重**（见「Next.js 数据缓存」的 Request Memoization）——同一个商品数据不会因为「一次给 meta、一次给页面」而取两遍。

## 几个 SEO 必做项

- **title 模板**：在根 `layout` 设 `title: { template: '%s | 我的商店', default: '我的商店' }`，子页只写自己那段，自动拼上站名。
- **canonical**：用 `alternates: { canonical: url }` 声明规范链接，避免同内容多 URL 被判重复。
- **结构化数据（JSON-LD）**：商品页加 `Product` schema（含价格、库存、评分），能让搜索结果出现富媒体卡片。直接在组件里渲染一个 `<script type="application/ld+json">`。
- **sitemap 与 robots**：用 `app/sitemap.ts` 和 `app/robots.ts` 以代码生成，商品多时可动态列出所有 URL。

## 结论

- App Router 把元数据当**数据**管理：静态用 `metadata` 对象，依赖数据的用 `generateMetadata`。
- 别手动拼 `<head>`——框架会处理合并、去重、继承（子页 metadata 覆盖父布局）。
- SEO 的核心始终没变：**每个页面有准确、独立的 title / description / og 图 / 结构化数据**。Metadata API 只是让这件事在 RSC 架构下做得干净。
