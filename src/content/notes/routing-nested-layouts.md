---
title: 嵌套路由与共享布局：壳不动，内容换
category: 路由
description: 切换子页面时，外层导航、侧边栏不该重新渲染、不该丢状态。嵌套布局就是为这个而生。
updated: 2026-06-29
order: 4
series: React 数据与路由
seriesOrder: 4
related: [react-router-data-apis, data-fetching-waterfalls]
---

一个后台应用：左侧菜单常驻，右侧内容随路由切换。切换右侧时，左侧菜单**不该重新渲染、不该丢掉滚动位置和展开状态**。实现这个体验的机制，就是嵌套路由 + 共享布局。

## 路由是一棵树，布局逐层包裹

URL 的层级天然是一棵树：`/dashboard/orders/42` 对应 `dashboard → orders → 42` 三层。每一层都可以挂一个**布局**，它包裹自己这一层及所有子层；导航时，**没变的那几层布局保持挂载、状态保留**，只有变化的最深层被替换。

```
/dashboard           → RootLayout > DashboardLayout > 概览页
/dashboard/orders    → RootLayout > DashboardLayout > OrdersLayout > 列表
/dashboard/orders/42 → RootLayout > DashboardLayout > OrdersLayout > 详情
                       ▲ 这两层在三个 URL 间一直不变 → 不重渲染、状态留存
```

## 两个框架的写法

```tsx
// Next.js App Router：每层一个 layout.tsx，children 是下一层
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div class="grid">
      <Sidebar />          {/* 切换子页时它不会重渲染 */}
      <main>{children}</main>
    </div>
  );
}
```

```tsx
// React Router：用 <Outlet /> 标记子路由的插入点
function DashboardLayout() {
  return (
    <div className="grid">
      <Sidebar />
      <Outlet />           {/* 子路由渲染到这里 */}
    </div>
  );
}
```

`children`（Next）和 `<Outlet />`（React Router）是同一个概念：**「子路由从这里嵌进来」的插槽**。

## 为什么这件事重要

- **状态保留**：侧边栏的展开/折叠、滚动位置、输入框内容，在子页切换间**不丢**——因为布局组件没被卸载重挂。
- **避免重复渲染**：不变的壳不重算，切换更快、更省。
- **天然的代码组织**：和某层相关的导航、面包屑、权限校验，就放在那一层的布局里，作用域清晰。
- **配合数据路由**：每层布局可以有自己的 loader / 数据需求，它们**并行**加载（见「React 数据路由」「请求瀑布」）。

## 结论

嵌套路由把「URL 的层级」映射成「布局的嵌套」。结果就是那个理想体验：**外层的壳稳稳不动，只有内容区随路由切换**——状态不丢、渲染不浪费。`children` / `<Outlet />` 是它的核心机关，认住这个插槽，两个框架的布局系统就是一回事。
