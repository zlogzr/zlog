---
title: Next.js 渲染模式：SSG / SSR / ISR / Streaming
category: Next.js
description: 同一个页面在“何时生成 HTML”上有几种选择。选错了，要么数据陈旧，要么服务器白扛压力。
updated: 2026-06-29
order: 2
---

「渲染模式」回答的是一个问题：**这个页面的 HTML 是什么时候生成的？** 不同答案对应不同的速度 / 新鲜度 / 成本权衡。

## 四种模式

| 模式 | HTML 何时生成 | 适合 |
|---|---|---|
| **SSG**（静态生成） | **构建时**，一次 | 内容很少变：博客、文档、营销页 |
| **SSR**（服务端渲染） | **每次请求时** | 强个性化 / 实时：用户面板、搜索结果 |
| **ISR**（增量静态再生成） | 构建时生成，**到期后后台悄悄重建** | 量大但更新不频繁：商品页、文章 |
| **Streaming**（流式） | 边生成边发，分块到达 | 页面里有快有慢的部分，先发快的 |

## ISR：SSG 的新鲜度补丁

SSG 快（纯静态、可上 CDN）但数据会陈旧——商品改了价，得重新构建整站。ISR 是折中：页面照样静态缓存，但设一个 `revalidate` 时间，**到期后第一个访客触发后台重建**，新 HTML 替换旧的。访客永远拿到缓存（快），数据又能定期更新。

```tsx
// App Router：给这次取数据设定 60 秒再验证 → 该页表现为 ISR
const res = await fetch(url, { next: { revalidate: 60 } });
```

## Streaming：别让最慢的部分拖住整页

App Router 里用 **Suspense** 把页面切块：能立刻渲染的（标题、布局）先发给浏览器，慢的部分（要查数据库的推荐列表）用 `loading` 占位，**算好了再流式补上**。

```tsx
export default function Page() {
  return (
    <>
      <Header />                              {/* 立刻发出 */}
      <Suspense fallback={<Skeleton />}>
        <SlowRecommendations />               {/* 算好后流式补到这 */}
      </Suspense>
    </>
  );
}
```

好处是 **TTFB 和首屏不被最慢的数据拖累**——直接改善 LCP（见性能分类）。

## 结论

- 默认追求**静态**（SSG / ISR），它最快、最省、最稳。只有「必须每次请求都不同」才用 SSR。
- 内容会变但不必秒级新鲜 → ISR，几乎是电商详情页的标准答案。
- 一个页面里数据有快有慢 → 用 Suspense 流式，别让用户对着白屏等最慢那块。
- App Router 里这些不是「选一个模式」的全局开关，而是**按每次 `fetch` 的缓存配置 + Suspense 边界**细粒度决定的。
