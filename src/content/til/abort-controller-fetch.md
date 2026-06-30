---
title: "用 AbortController 取消过期的 fetch"
date: 2026-06-23
tags: ["JavaScript", "性能"]
---

搜索框联想、快速切 Tab 拉数据，常出现「后发的请求先回、先发的后回」，结果旧响应覆盖了新结果。`AbortController` 能把上一次请求取消掉：

```js
let controller;
async function search(q) {
  controller?.abort();            // 取消上一次还没回来的请求
  controller = new AbortController();
  try {
    const res = await fetch(`/api/search?q=${q}`, { signal: controller.signal });
    return await res.json();
  } catch (e) {
    if (e.name === 'AbortError') return; // 被主动取消，不是错误
    throw e;
  }
}
```

React 里在 `useEffect` 的清理函数里 `abort()`，能顺手解决组件卸载后 setState 的告警。一个 controller 也能同时控制多个 fetch——它们共享同一个 `signal` 即可。
