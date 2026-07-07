---
title: MSW：在网络层 mock，而不是在代码里
category: 测试
description: 为什么拦截请求比 mock fetch/axios 更可靠，以及一套 handler 同时喂测试和本地开发。
updated: 2026-07-07
order: 4
series: 前端测试
seriesOrder: 4
related: [vitest-unit-testing, testing-library-queries]
---

测试里处理网络请求的传统做法是 `vi.mock('axios')` 或者注入一个假的 request 函数。问题在于：**你 mock 的是自己的代码，而不是网络**。换请求库、加一层缓存封装、从 axios 迁到 fetch——业务行为没变，测试全要重写。

MSW（Mock Service Worker）换了个位置拦截：测试环境里 patch Node 的请求内部（`msw/node`），浏览器里注册真正的 Service Worker。你的应用代码**原封不动地发真实请求**，MSW 在"网线"上截住它返回假响应。

## 基本用法

```ts
// src/test/handlers.ts —— 用 REST 语义描述你的 API
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/products', () =>
    HttpResponse.json([{ id: 'p1', title: '机械键盘', price: 39900 }]),
  ),
  http.post('/api/cart', async ({ request }) => {
    const body = await request.json();
    if (!body.skuId) return HttpResponse.json({ error: 'skuId required' }, { status: 400 });
    return HttpResponse.json({ ok: true });
  }),
];
```

```ts
// src/test/setup.ts —— 接进 Vitest
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`onUnhandledRequest: 'error'` 值得强调：任何没被 handler 覆盖的请求直接让测试失败，而不是静默放过——**漏 mock 的请求是测试偶发超时的头号来源**。

## 单个测试覆盖异常分支

默认 handler 返回成功路径，某个测试要验证出错 UI 时临时覆盖：

```ts
it('接口 500 时展示重试按钮', async () => {
  server.use(http.get('/api/products', () => HttpResponse.json(null, { status: 500 })));
  render(<ProductList />);
  expect(await screen.findByRole('button', { name: '重试' })).toBeInTheDocument();
});
```

`afterEach` 的 `resetHandlers()` 保证这次覆盖不会泄漏到下个测试。加载态、慢网络也能模拟：`await delay(1000)` 后再返回。

## 一套 handler，三处复用

MSW 真正的杠杆在于同一份 handlers 可以喂给：

- **测试**（`msw/node`）：如上
- **本地开发**（Service Worker）：后端接口还没好时，前端照常开发，`npx msw init public/` 注册一次即可
- **Storybook**：组件预览直接带真实数据形态

API 的"假实现"只维护一份，而且它长得就像后端文档——新人读 handlers 比读散落各处的 `vi.mock` 快得多。

## 边界

MSW mock 的是**你和后端的契约**，契约本身错了它测不出来（后端实际返回的字段和你 handler 写的不一致）。这层要靠 E2E 或契约测试兜底——下一篇 Playwright 就是干这个的。
