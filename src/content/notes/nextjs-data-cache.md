---
title: Next.js 数据缓存：fetch 被悄悄改写了
category: Next.js
description: App Router 里 fetch 不再是你认识的那个 fetch。它默认带缓存与去重——不懂这点会被“数据不更新”坑惨。
updated: 2026-06-29
order: 3
---

App Router 最反直觉的一点：它**扩展了全局 `fetch`**。同样一行 `await fetch(url)`，行为和浏览器 / 旧 Node 里的不一样——它默认会缓存、会去重。这是「数据怎么也不更新」一类问题的头号原因。

## 两层缓存

| 缓存 | 作用 | 范围 |
|---|---|---|
| **Request Memoization** | 一次渲染中，相同的 `fetch` 只真正发一次 | 单次请求内，自动 |
| **Data Cache** | 跨请求、跨用户持久缓存 fetch 结果 | 服务端，可配置失效 |

Request Memoization 让你**不必把数据提到顶层往下传**——多个组件各自 `fetch` 同一个 URL，框架自动合并成一次。这鼓励「谁要数据谁就地取」的写法。

## 控制 Data Cache：三种写法

```tsx
// 1. 默认（取决于 Next 版本）—— 务必显式声明意图，别赌默认值
fetch(url);

// 2. 永不缓存，每次都取最新（等价于 SSR 行为）
fetch(url, { cache: 'no-store' });

// 3. 缓存但定期失效（ISR 行为）：60 秒后台再验证
fetch(url, { next: { revalidate: 60 } });
```

> 经验法则：**不要依赖默认缓存行为**（它在 Next 版本间变过）。每个 `fetch` 都显式写出 `cache` 或 `revalidate`，把意图写在脸上。

## 按需失效：tag 与路径

定时失效之外，写操作后可以**主动**让缓存失效（比如管理员改了商品）：

```tsx
// 取数据时打标签
fetch(url, { next: { tags: ['product-42'] } });

// 改完数据后，在 Server Action / Route Handler 里精准失效
import { revalidateTag, revalidatePath } from 'next/cache';
revalidateTag('product-42');     // 所有带这个 tag 的缓存失效
revalidatePath('/products');     // 这个路径的缓存失效
```

## 结论

- App Router 的 `fetch` ≠ 普通 fetch：默认带缓存与去重。**遇到「改了数据库页面却不变」，先查缓存配置。**
- 用 `cache: 'no-store'` 拿实时数据，用 `revalidate` 做 ISR，用 `revalidateTag/Path` 在写入后精准刷新。
- 把每个 `fetch` 的缓存意图显式写出来——这是 App Router 里最值得养成的习惯。
