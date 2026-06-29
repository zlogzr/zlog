---
title: React 数据路由：loader 与 action
category: 路由
description: 路由不只是“哪个 URL 渲染哪个组件”。数据路由让路由也负责“进页面前先取数、提交时怎么写”。
updated: 2026-06-29
order: 1
series: React 数据与路由
seriesOrder: 1
related: [data-fetching-waterfalls, react-router-defer-streaming]
---

老式的 React Router 只管一件事：URL → 组件。取数据是组件**挂载之后**在 `useEffect` 里自己发请求。React Router 6.4+（及 Remix）引入的**数据路由**，把「取数」和「写入」也变成了路由的职责。

## loader：进页面前先把数据备好

每个路由可以挂一个 `loader`。导航到这个路由时，**React Router 先调 loader 拿到数据，数据就绪后才渲染组件**——组件一挂载就有数据，不再有「先白屏、effect 再去取」的两段式。

```jsx
const router = createBrowserRouter([{
  path: '/products/:id',
  loader: async ({ params }) => {
    return fetch(`/api/products/${params.id}`);   // 进页面前就发起
  },
  Component: ProductPage,
}]);

function ProductPage() {
  const product = useLoaderData();   // 直接拿，无 loading 分支
  return <h1>{product.name}</h1>;
}
```

## action：提交怎么写

`action` 是 loader 的写入版。表单提交（`<Form method="post">`）会路由到对应 action，由它处理 mutation，完成后 **React Router 自动重新运行相关 loader**，界面随之刷新——天然的「写完即刷新」。

```jsx
{
  path: '/products/:id',
  action: async ({ request, params }) => {
    const form = await request.formData();
    await updateProduct(params.id, form);
    return redirect(`/products/${params.id}`);   // 完成后跳转
  },
}
```

## 为什么这套更好

| | useEffect 取数 | loader 取数 |
|---|---|---|
| 时机 | 组件挂载**之后** | 导航**期间**，渲染之前 |
| loading 分支 | 组件里到处写 | 路由层统一处理 |
| 嵌套路由 | 各自串行触发 → 瀑布 | **并行**触发所有匹配路由的 loader |
| 竞态 / 取消 | 自己处理 | 框架处理 |

最关键的是**并行**：访问 `/products/42` 命中三层嵌套路由，它们的 loader **同时**发起，而不是一层渲染完才轮到下一层（见「请求瀑布」一条）。

## 结论

- 数据路由把「取数 / 写入」从组件内部上提到路由配置，换来：进页面即有数据、并行加载、自动处理竞态与重新验证。
- React Router 7 与 Remix 已合并，这套是其核心范式；它和 Next.js 用 RSC 在服务端取数是**两种不同路线**，但都在回答同一个问题：**别让取数等到组件挂载之后**。
