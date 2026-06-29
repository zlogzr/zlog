---
title: Next.js：App Router vs Pages Router
category: Next.js
description: 不只是目录名变了。App Router 默认是 Server Component，整套数据获取与渲染心智都换了。
updated: 2026-06-29
order: 1
series: Next.js 全栈
seriesOrder: 1
related: [react-server-components]
---

Next.js 现在有两套路由系统并存。新项目用 **App Router**（`app/` 目录），但老项目和大量教程还停在 **Pages Router**（`pages/` 目录）。差别远不止文件夹名字。

## 核心差异

| | Pages Router (`pages/`) | App Router (`app/`) |
|---|---|---|
| 组件默认 | 客户端组件 | **Server Component** |
| 数据获取 | `getServerSideProps` / `getStaticProps` | 组件里直接 `async/await` |
| 布局 | `_app.js` 一层全局 | 嵌套 `layout.tsx`，逐层包裹、可保留状态 |
| Loading 态 | 自己写 | `loading.tsx` + Suspense 自动接管 |
| 路由约定 | 文件即路由 | 文件夹 + 约定文件（`page` / `layout` / `loading` / `error`） |

## App Router 的约定文件

App Router 用一组**固定文件名**表达页面的各个部分，框架自动接线：

```
app/
  layout.tsx      # 根布局（包所有页面，导航栏放这）
  page.tsx        # 路由 "/"
  loading.tsx     # 加载时自动显示（基于 Suspense）
  error.tsx       # 出错时的 UI（必须是 client 组件）
  products/
    layout.tsx    # 嵌套布局：只包 /products 下的页面
    page.tsx      # "/products"
    [id]/
      page.tsx    # "/products/:id"
```

`layout.tsx` 嵌套是 App Router 的杀手锏：导航时**父布局不重渲染、状态保留**，只换变化的那层 `page`——天然的「壳不动、内容换」。

## 数据获取的心智变了

Pages Router 把取数据塞进特定的导出函数；App Router 里，**Server Component 本身就能 `await`**：

```tsx
// app/products/[id]/page.tsx —— 这就是个 async 服务端组件
export default async function Page({ params }) {
  const product = await getProduct(params.id);   // 直接取，无 getServerSideProps
  return <ProductView product={product} />;
}
```

## 结论

- 新项目直接上 App Router——它是 React Server Components 的官方落地，方向所在。
- 迁移可**渐进**：两套目录能共存，一个路由一个路由地搬。
- 学 App Router 前，先吃透 RSC 的「服务端组件 / 客户端组件」边界（见本知识库「React」分类下「Server Components」一条），否则会被各种「为什么这里不能 useState」绊住。
