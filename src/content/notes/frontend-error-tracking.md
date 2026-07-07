---
title: 前端错误采集：你的 try/catch 抓不到的那些
category: 监控
description: onerror、unhandledrejection、跨域脚本的 Script error.、React 错误边界——把错误捞全，再谈上报。
updated: 2026-07-07
order: 1
series: 前端监控
seriesOrder: 1
related: [sourcemap-in-production, node-error-handling, security-cors]
---

后端出错有日志，前端出错在**用户的浏览器里**——你看不见，用户也不会告诉你，他们只会关掉页面。错误监控要解决的第一个问题不是"上报"，而是**捞全**：错误发生的位置五花八门，单靠一种手段都会漏。

## 四张网，一张都不能少

**1. `window.onerror` / `error` 事件**——同步执行错误的主网：

```js
window.addEventListener('error', (e) => {
  // e.message / e.filename / e.lineno / e.colno / e.error?.stack
  report({ type: 'js-error', message: e.message, stack: e.error?.stack });
}, true); // 捕获阶段，还能顺带抓到资源加载失败（img/script 的 error 不冒泡）
```

**2. `unhandledrejection`**——异步时代一半以上的错误在这：没有 catch 的 Promise 拒绝，`window.onerror` 完全看不见：

```js
window.addEventListener('unhandledrejection', (e) => {
  report({ type: 'promise', reason: serialize(e.reason) });
});
```

**3. 框架的错误钩子**。React 渲染期的错误会被错误边界拦下而不到 window：类组件 `componentDidCatch`，或 react-dom 19 的 `onUncaughtError` / `onCaughtError` 根选项。Vue 用 `app.config.errorHandler`。**框架拦了但你没上报 = 静默丢失**。

**4. 接口错误**。fetch 返回 500 不是 JS 异常，任何一张网都抓不到。要么在请求封装层统一上报非 2xx 和超时，要么 patch fetch/XHR。业务上最疼的错误（下单失败）恰恰全在这类。

## Script error. ——最著名的坑

CDN 上的跨域脚本抛错时，你只能拿到一句 `Script error.`，没有堆栈没有位置。这是浏览器故意的：不让 A 站探测 B 站脚本的内部信息（同源策略的延伸，机制同[[security-cors]]的出发点）。解法是两边配合：

```html
<script src="https://cdn.example.com/app.js" crossorigin="anonymous"></script>
```

同时 CDN 响应头加 `Access-Control-Allow-Origin: *`。两者缺一个，你收到的错误就全是废话。

## 上报之前：降噪与聚合

裸采集会把你淹死。上线前想清楚三件事：

- **指纹聚合**：同一个 bug 在 1 万个用户那各报一次，必须按"错误类型 + 消息 + 堆栈顶帧"归并成一个 issue，看的是"新增了哪种错误"而不是错误流水。
- **采样与限流**：错误风暴（一个 bug 在死循环里每秒抛百次）能打挂你的上报服务；单会话同指纹错误只报前 N 条。
- **过滤三方噪音**：浏览器插件注入的脚本、爬虫环境的报错和你无关，按堆栈来源过滤，不然信噪比归零。

带上下文才可排查：发生页面、用户 ID、release 版本号、设备与浏览器、错误前的行为面包屑（路由跳转、点击、请求）。其中 release 版本号是下一篇 sourcemap 还原的钥匙——没有它，堆栈只是一串压缩后的乱码坐标。
