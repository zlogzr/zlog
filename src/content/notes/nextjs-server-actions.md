---
title: Next.js Server Actions：不写 API 也能改数据
category: Next.js
description: 一个标了 'use server' 的函数，能从客户端直接调，框架替你生成 RPC。方便，但安全边界要自己守。
updated: 2026-06-29
order: 4
---

传统全栈写法：前端发请求 → 写一个 API 路由 → 校验 → 操作数据库 → 返回。Server Actions 把这套折叠成一个**函数**。

## 它是什么

一个标了 `'use server'` 的异步函数，**只在服务端运行**，但可以被客户端组件 / 表单直接「调用」。Next 在背后自动生成一个 RPC 端点，把调用变成网络请求。

```tsx
// app/actions.ts
'use server';
export async function addToCart(productId: string, qty: number) {
  const user = await getCurrentUser();           // 在服务端，能读 session
  await db.cart.add(user.id, productId, qty);     // 直接操作数据库
  revalidatePath('/cart');                        // 顺手刷新购物车缓存
}
```

```tsx
// 客户端组件里直接调，像调本地函数
'use client';
import { addToCart } from './actions';
<button onClick={() => addToCart(id, 1)}>加入购物车</button>
```

还能直接绑到 `<form action={...}>`，**不带 JS 也能提交**（渐进增强）：

```tsx
<form action={addToCart}>…</form>
```

## 必须自己守的边界

「像调本地函数」是错觉——它本质是个**公开的网络端点**，任何人都能伪造调用。所以：

- **永远在 action 内部重新做鉴权和参数校验**。别信任何从客户端传来的值（包括 `productId`、`qty`、价格——尤其是价格，绝不能让前端传价格）。
- 校验输入用 zod 之类（`qty` 是不是正整数？商品存不存在？库存够不够？）。
- 它和写普通 API 的安全要求**完全一样**，只是少写了路由样板。便利不等于可以省掉校验。

## 配合 useActionState 管理状态

表单提交的 pending / 错误 / 返回值，用 `useActionState`（React 19）接：

```tsx
'use client';
const [state, formAction, isPending] = useActionState(addToCart, null);
// isPending 给按钮做 loading；state 拿返回的错误信息渲染
```

## 结论

- Server Actions 消灭的是「为每个写操作手写一个 API 路由」的样板，特别适合表单和 mutation。
- 它没有消灭**安全责任**：鉴权、校验、不信任客户端输入，一样不能少。把它当成「省了路由文件的 API」，而不是「不用管安全的魔法」。
- 配合 `revalidatePath/Tag` 在写入后刷新缓存（见「Next.js 数据缓存」），形成「改数据 → 自动刷新视图」的闭环。
