---
title: Node 多核：cluster、worker_threads 与进程
category: Node.js
description: Node 单线程跑 JS，吃不满多核。用多进程扛并发、用 worker 线程扛 CPU——两者解决的问题不同。
updated: 2026-06-29
order: 3
series: Node.js 服务端
seriesOrder: 3
related: [node-event-loop-libuv]
---

Node 跑 JS 是单线程的。一台 16 核机器，默认只用 1 核。怎么用满？要先分清你缺的是哪种能力。

## 两个不同的问题

| 你的瓶颈 | 用什么 | 为什么 |
|---|---|---|
| **并发请求多**（I/O 密集） | `cluster` / 多进程 | 多个进程各跑一个事件循环，共享端口分摊连接 |
| **单个任务算得久**（CPU 密集） | `worker_threads` | 把重计算挪出主线程，别卡住事件循环 |

## cluster：多进程分摊连接

`cluster` 用 `fork` 起多个 worker 进程（通常等于 CPU 核数），它们**共享同一个监听端口**，由系统 / 主进程把进来的连接分给空闲 worker。

```js
const cluster = require('node:cluster');
const os = require('node:os');
if (cluster.isPrimary) {
  for (let i = 0; i < os.availableParallelism(); i++) cluster.fork();
} else {
  require('./server.js');   // 每个 worker 跑一份完整的服务
}
```

进程之间**内存完全隔离**——这意味着内存里的 session、缓存、计数器**不共享**，得放到 Redis 这类外部存储。生产环境通常直接用 PM2 / 容器编排（k8s）来做这件事，比手写 cluster 省心。

## worker_threads：把 CPU 重活挪走

`cluster` 解决不了「一个请求里要做一段耗时计算」——那会卡住该 worker 的事件循环，它负责的所有连接一起卡。这时用 `worker_threads`：

```js
const { Worker } = require('node:worker_threads');
function runHeavy(data) {
  return new Promise((resolve, reject) => {
    const w = new Worker('./heavy-task.js', { workerData: data });
    w.on('message', resolve);
    w.on('error', reject);
  });
}
// 主线程的事件循环不被阻塞，照常处理别的请求
```

worker 线程**在同进程内**，可通过 `SharedArrayBuffer` 共享内存（比进程间拷贝快），适合图像处理、加解密、大数据变换这类纯计算。

## 结论

- **I/O 密集**（大多数 Web 服务）：单进程的事件循环已经很能扛并发，先把代码写成全异步；要用满多核就多开进程（cluster / PM2 / 多容器）。
- **CPU 密集**：别在主线程硬算，丢给 `worker_threads`，否则一个慢请求拖垮所有人。
- 进程隔离内存、线程可共享内存——这是选型时最实际的一条分界线。
