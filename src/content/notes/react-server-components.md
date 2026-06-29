---
title: Server Components：组件在哪台机器上运行
category: React
description: RSC 不是“更好的 SSR”。它是把组件树切成“服务端只跑一次”和“客户端可交互”两半。
updated: 2026-06-29
order: 7
series: React 进阶
seriesOrder: 9
related: [nextjs-app-vs-pages-router, react-suspense-error-boundary]
---

React Server Components（RSC）最容易被误解成「SSR 的升级版」。它们解决的是不同的问题。先把概念分清。

## SSR vs RSC：两件事

| | SSR | RSC |
|---|---|---|
| 解决 | 首屏快、SEO | 减少发到浏览器的 JS、让组件直连后端 |
| 组件代码 | 服务端跑一遍生成 HTML，**再到客户端 hydrate 跑第二遍** | 服务端组件**只在服务端跑**，代码**永不下发到浏览器** |
| 能否交互 | 可以（hydrate 后） | 服务端组件**不能**有 state / effect / 事件 |

SSR 是「把同一份组件在服务端先跑一次出 HTML」；RSC 是「有一部分组件**根本不属于浏览器**」。

## 两种组件的分工

- **Server Component（默认）**：在服务端运行。可以 `async/await` 直接读数据库、读文件、调内部 API；可以安全地用密钥。**代码体积不计入客户端 bundle**。但不能用 `useState`/`useEffect`/`onClick`，因为它不在浏览器里。
- **Client Component（`'use client'`）**：传统 React 组件。能有状态、能交互、会被打包发到浏览器 hydrate。

```jsx
// 服务端组件：直接读数据，零客户端 JS
async function ProductPage({ id }) {
  const product = await db.product.find(id);   // 直连数据库
  return (
    <>
      <ProductInfo product={product} />        {/* 也可以是服务端组件 */}
      <AddToCart id={product.id} />            {/* 这个需要交互 → client */}
    </>
  );
}
```

```jsx
'use client';                                   // 边界从这里开始
function AddToCart({ id }) {
  const [n, setN] = useState(1);                // 有状态 → 必须是 client
  return <button onClick={() => addToCart(id, n)}>加入购物车</button>;
}
```

## 关键直觉

- **`'use client'` 是一条边界，不是「这一个组件」的标记**。一旦标了，它**和它 import 的所有子组件**都进入客户端世界。所以要把 `'use client'` 推到树的**叶子**——交互按钮、输入框——让上面的壳尽量留在服务端。
- **服务端组件可以把客户端组件当 children 传**：`<ClientShell><ServerContent/></ClientShell>` 成立，服务端内容作为 props 穿过客户端边界。这是组合的核心技巧。
- props 从服务端传给客户端组件，必须是**可序列化**的（能 JSON 化）——不能传函数、Date 之外的类实例等。

## 结论

RSC 让「取数据」和「渲染静态部分」回到服务端，浏览器只为**真正需要交互的那一小块**下载 JS。心智负担从「这个组件该怎么写」变成多了一问：**「它该在哪台机器上跑」**。Next.js App Router 是目前最主流的 RSC 落地（见本知识库 Next.js 分类）。
