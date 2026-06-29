---
title: Next.js：Route Handlers 与 Middleware
category: Next.js
description: 不是所有逻辑都属于组件。需要纯 API 端点用 Route Handler；需要“请求到达页面前先拦一下”用 Middleware。
updated: 2026-06-29
order: 5
---

App Router 里大部分取数在服务端组件里直接做。但有两类活儿不属于组件：**对外提供一个纯 HTTP 端点**，和**在请求抵达任何页面之前统一拦截**。它们分别对应 Route Handler 和 Middleware。

## Route Handlers：写 API 端点

放在 `app/.../route.ts`，按 HTTP 方法导出函数，就是一个 API：

```ts
// app/api/products/route.ts
export async function GET(request: Request) {
  const products = await db.product.findAll();
  return Response.json(products);
}
export async function POST(request: Request) {
  const body = await request.json();
  // ...校验、写库
  return Response.json({ ok: true }, { status: 201 });
}
```

什么时候需要它（而不是直接在服务端组件取数）？

- 给**外部 / 第三方**提供接口（webhook 回调、移动端 App 调用）。
- 客户端组件要主动发请求的端点（搜索联想、轮询）。
- 返回非 HTML：JSON、文件、图片、RSS。

注意：**页面内部自己用的数据，不必先写 Route Handler 再 fetch**——服务端组件直接 `await` 取就行，多绕一层 HTTP 反而慢。Route Handler 是给「组件之外的调用方」用的。

## Middleware：请求的前置关卡

`middleware.ts` 放在项目根，在请求**到达路由之前**运行，对**每个**匹配的请求都生效。它在 Edge 运行时跑，要快、要轻。

```ts
// middleware.ts
import { NextResponse } from 'next/server';
export function middleware(request) {
  const token = request.cookies.get('token');
  // 未登录访问后台 → 重定向到登录页
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*'] };  // 限定生效范围
```

典型用途：**鉴权重定向、A/B 分流、地区/语言重定向、加全局响应头、限流**。

## 边界与取舍

- Middleware 跑在每个请求的关键路径上，**别在里面做重活 / 查数据库**——它要快。复杂鉴权放进页面 / Route Handler，Middleware 只做轻量判断（有没有 token）。
- Middleware 在 Edge 运行时，**Node API 受限**（没有完整的 `fs`、某些 npm 包不可用）。
- `matcher` 一定要配好，否则它会拦下静态资源等无关请求，白白增加延迟。

## 结论

- 组件内取数 → 默认方式，处理「这个页面要什么数据」。
- **Route Handler** → 给组件之外的调用方提供 HTTP 端点（webhook、客户端请求、非 HTML 响应）。
- **Middleware** → 请求到页面前的统一关卡（鉴权重定向、分流、头部），保持轻快。
三者分工清楚，就不会把 API 逻辑、拦截逻辑和渲染逻辑揉成一团。
