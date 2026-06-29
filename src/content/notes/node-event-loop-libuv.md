---
title: Node 事件循环：和浏览器不一样的地方
category: Node.js
description: 浏览器只有“宏任务 + 微任务”；Node 的循环分成有序的几个阶段，还多了 process.nextTick。
updated: 2026-06-29
order: 1
---

事件循环的核心思想（一个宏任务 + 清空微任务）浏览器和 Node 一致（见「事件循环：宏任务、微任务与渲染时机」）。但 Node 的循环跑在 **libuv** 上，结构更细，几个差异常坑人。

## Node 的循环分阶段

libuv 的每一轮（tick）按**固定顺序**走过几个阶段，每个阶段有自己的回调队列：

| 阶段 | 处理什么 |
|---|---|
| **timers** | 到期的 `setTimeout` / `setInterval` |
| **poll** | I/O 回调（读文件、网络数据到达）——大部分时间在这 |
| **check** | `setImmediate` 的回调 |
| **close** | `close` 事件，如 socket 关闭 |

## 两个 Node 特有的“插队”队列

每**两个阶段之间**，Node 都会清空两个特殊队列，优先级高于普通微任务：

1. **`process.nextTick(fn)`** —— 最高优先级，当前操作一结束立刻执行。
2. **Promise 微任务**（`.then`）—— 紧随其后。

```js
setTimeout(() => console.log('timeout'));
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('sync');

// 输出：sync → nextTick → promise → (timeout / immediate 顺序不定)
```

`nextTick` 比 Promise 还靠前；`setTimeout` vs `setImmediate` 在主模块里顺序**不确定**（取决于进入循环的耗时），但在一个 I/O 回调内部，`setImmediate` 必定先于 `setTimeout`。

## 两个实战结论

- **别滥用 `process.nextTick` 递归**：它在阶段切换前就被清空，无限递归会**饿死 I/O**——文件读不进来、请求收不到，进程看着活着实则假死。要让出，用 `setImmediate`。
- **CPU 密集任务会阻塞整个循环**：Node 是单线程跑 JS。一段同步的大循环 / JSON 解析超大对象 / 同步加密，会卡住**所有**连接。这类活该丢给 `worker_threads` 或拆成异步分片（见「进程模型」一条）。

> 浏览器的事件循环还要操心「什么时候渲染一帧」；Node 没有渲染，但多了 I/O 阶段和 `nextTick` 这层。把「分阶段 + nextTick 插队」记住，Node 里那些诡异的执行顺序就讲得通了。
