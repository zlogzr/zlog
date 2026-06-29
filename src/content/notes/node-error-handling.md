---
title: Node 错误处理：异步错误为什么 try/catch 抓不住
category: Node.js
description: try/catch 只对同步调用栈有效。异步错误跨了 tick，栈早没了——你得在它发生的地方接住。
updated: 2026-06-29
order: 4
series: Node.js 服务端
seriesOrder: 4
related: [react-suspense-error-boundary]
---

```js
try {
  setTimeout(() => { throw new Error('boom'); }, 0);
} catch (e) {
  // 永远进不来——回调在下一个 tick 跑，那时 try 块的栈早出栈了
}
```

`try/catch` 只能捕获**同一条同步调用栈**上的异常。回调、定时器、事件触发的错误发生在**未来的某个 tick**，那时调用栈已经清空，catch 根本不在现场。

## 三种异步，三种接法

| 形式 | 怎么接错误 |
|---|---|
| **Promise / async-await** | `try/catch` 配 `await`（await 把异步“拉回”同步栈），或 `.catch()` |
| **回调（error-first）** | 回调第一个参数就是 err：`(err, data) => { if (err) … }` |
| **EventEmitter** | 监听 `'error'` 事件——**不监听会直接 crash 进程** |

```js
// async/await 能用 try/catch，正是因为 await 把错误带回了当前栈
async function load() {
  try {
    const data = await readFile('x');   // 拒绝会被下面接住
  } catch (e) { /* ✅ 抓得到 */ }
}

// EventEmitter 的 'error' 必须监听，否则进程退出
stream.on('error', (err) => log(err));
```

## 两类“兜底”事件——是诊断，不是恢复

```js
process.on('uncaughtException', (err) => { /* 记日志后退出 */ });
process.on('unhandledRejection', (reason) => { /* 同上 */ });
```

关键认知：**进了这两个 handler，说明你漏接了某处的错误，进程已处于未知状态。** 它们的正确用途是「记录日志 + 优雅关闭后退出」，**不是**「记下来然后假装没事继续跑」——带着脏状态硬撑，后面会出更隐蔽的 bug。让进程崩、由 PM2 / k8s 拉起一个干净的，往往比硬撑更安全。

## 结论

- 异步错误要**在它发生的地方就近接住**：`await` 的 `try/catch`、回调的 err 参数、emitter 的 `'error'`。
- 全异步项目优先全用 `async/await`，错误处理心智最接近同步代码。
- `uncaughtException` / `unhandledRejection` 是**最后的诊断网**，不是业务恢复手段。进了那里，记日志、退出、重启。
