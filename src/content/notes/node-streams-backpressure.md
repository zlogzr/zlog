---
title: Node 流与背压：别把数据一次性读进内存
category: Node.js
description: 流的全部意义在于“边读边处理”。背压是消费者对生产者说“慢点，我还没处理完”。
updated: 2026-06-29
order: 2
series: Node.js 服务端
seriesOrder: 2
---

处理一个 10GB 的文件，`fs.readFile` 会把它整个读进内存——内存爆掉。流（Stream）的存在就是为了**分块、边读边处理**，内存占用恒定。

## 四种流

| 类型 | 例子 |
|---|---|
| Readable | `fs.createReadStream`、HTTP 请求体 |
| Writable | `fs.createWriteStream`、HTTP 响应 |
| Duplex | TCP socket（可读可写） |
| Transform | `zlib.createGzip`、加密（边读边变换） |

## 背压（backpressure）是核心

想象一根水管：读得快、写得慢，中间的数据往哪去？如果不管，它们堆在内存的缓冲区里，越堆越多，最终 OOM。

**背压**就是消费者向生产者反向施压：「我的缓冲满了，你先停一下」。`writable.write()` 返回 `false` 时，就是在说这句话——你应该暂停可读流，等 `drain` 事件再继续。

手写这套暂停/恢复很容易错。**`pipe` 和 `pipeline` 自动处理背压**，这才是正确姿势：

```js
// ❌ 手动转发，不处理背压：写得慢会撑爆内存
readable.on('data', chunk => writable.write(chunk));

// ✅ pipe 自动按背压暂停/恢复
readable.pipe(writable);

// ✅✅ pipeline：pipe + 统一的错误处理 + 自动清理（推荐）
const { pipeline } = require('node:stream/promises');
await pipeline(
  fs.createReadStream('in.txt'),
  zlib.createGzip(),               // 边读边压缩
  fs.createWriteStream('out.gz'),
);
```

## 为什么优先用 `pipeline` 而不是 `pipe`

`pipe` 有个著名陷阱：**中间某段流报错时，前后的流不会自动销毁**，导致文件句柄 / socket 泄漏。`stream.pipeline` 修了这个——任何一环出错，它会销毁链路上所有流，并把错误集中抛出 / 回调给你。

## 结论

- 处理「大」或「来源不定大小」的数据（文件、上传、HTTP 代理）→ 用流，别 `readFile` / 全量 buffer。
- 转发数据用 `pipeline`，不要手写 `on('data')` + `write()`——背压和清理都帮你做了。
- 背压不是 Node 独有的概念，它是所有「生产快、消费慢」系统的通用问题（消息队列、TCP 本身都有）。理解它，受益的不止 Node。
