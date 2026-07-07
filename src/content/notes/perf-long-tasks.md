---
title: 长任务与 INP：卡顿是主线程被占用
category: 性能
description: 找到超过 50ms 的长任务，用切片、调度器、Worker 把主线程还给用户。
updated: 2026-07-07
order: 5
series: Web 性能
seriesOrder: 5
related: [core-web-vitals, event-loop-microtasks, inp-and-the-main-thread]
---

页面"卡"，本质只有一句话：**用户交互时，主线程正忙着别的**。点击事件排在队列里，前面一个 300ms 的任务不跑完，浏览器连"按钮按下去了"都画不出来。[[core-web-vitals]]里的 INP 量的就是这个：从交互到下一帧绘制的延迟，超过 200ms 用户就觉得"不跟手"。

## 什么是长任务

主线程一次跑超过 **50ms** 的任务就是长任务（Long Task）。为什么是 50：假设用户随时可能交互，交互平均落在任务中间，50ms 的任务平均让用户等 25ms，加上渲染开销还能挤进 100ms 的"瞬时"感知阈值。

在 Performance 面板录一段交互，红色三角标出的就是长任务；线上环境用 `PerformanceObserver` 采：

```js
new PerformanceObserver((list) => {
  for (const t of list.getEntries()) report('long-task', t.duration);
}).observe({ type: 'longtask', buffered: true });
```

## 治理手段，按侵入性排序

**1. 别做/晚做。**最长的任务往往根本不该跑：首屏就初始化埋点 SDK、渲染看不见的 tab 内容、一次 setState 触发整树重渲染。先问"这段能不能删/能不能等"，再谈优化。

**2. 切片让出主线程。**长循环拆成小段，段间把控制权还给浏览器，让排队的交互先处理：

```js
async function processAll(items) {
  for (const [i, item] of items.entries()) {
    process(item);
    if (i % 50 === 0) await scheduler.yield?.() ?? new Promise(r => setTimeout(r));
  }
}
```

`scheduler.yield()` 比 `setTimeout` 好在恢复执行时**优先于其它排队任务**，切片不会被饿死。注意微任务不行——`await Promise.resolve()` 不给渲染让路，原因见[[event-loop-microtasks]]。

**3. 交互处理只做"必须在下一帧前完成"的事。**INP 优化的核心套路：事件回调里先更新可见反馈，重活推迟到绘制之后：

```js
button.addEventListener('click', () => {
  setOpen(true);                        // 用户立刻看到面板打开
  requestAnimationFrame(() =>
    setTimeout(() => rebuildSearchIndex(), 0)  // 一帧之后再干重活
  );
});
```

**4. 真正的重计算下 Worker。**加密、大 JSON 解析、图像处理这类纯计算，主线程根本不该碰。`postMessage` 的序列化成本比想象中低，比 300ms 的冻结便宜太多。

## React 场景的对应物

React 18+ 的并发特性就是"切片"的框架内置版：`startTransition` 把非紧急更新标记为可打断，`useDeferredValue` 让输入框先响应、大列表慢慢跟上。但它们只能切 React 自己的渲染工作——你在事件回调里写的同步重计算，React 救不了，还是要靠上面 2~4。

主线程为什么这么金贵、任务和渲染怎么排队，展开见[[inp-and-the-main-thread]]。
