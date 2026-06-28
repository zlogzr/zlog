---
title: 事件循环：宏任务、微任务与渲染时机
category: JavaScript
description: 一句话讲清 Promise 为什么总比 setTimeout 先跑，以及渲染插在哪。
updated: 2026-06-28
order: 1
---

JS 是单线程的，靠**事件循环**调度。核心只有一句话：

> 每跑完**一个**宏任务，就把**所有**微任务清空，然后浏览器**有机会**渲染一帧。

## 谁是宏任务，谁是微任务

| 微任务（microtask） | 宏任务（macrotask） |
|---|---|
| `Promise.then/catch/finally` | `setTimeout` / `setInterval` |
| `queueMicrotask` | I/O、UI 事件回调 |
| `MutationObserver` | `MessageChannel`、`setImmediate` |

## 顺序题

```js
console.log(1);
setTimeout(() => console.log(2));      // 宏任务
Promise.resolve().then(() => console.log(3)); // 微任务
console.log(4);
// 输出：1 4 3 2
```

同步代码先跑完（1、4）→ 清空微任务（3）→ 下一个宏任务（2）。

## 两个实战结论

- **微任务会饿死渲染**：在微任务里不停 `queueMicrotask` 递归，浏览器永远轮不到画面，页面假死。要让出主线程，用宏任务（`setTimeout`、`scheduler.yield()`）。
- **`requestAnimationFrame` 在重绘前执行**，是改样式做动画的正确时机；`requestIdleCallback` 则用于不紧急的活儿。
