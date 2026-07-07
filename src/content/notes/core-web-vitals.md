---
title: Core Web Vitals：LCP / INP / CLS
category: 性能
description: 三个核心指标分别量什么、合格线在哪、怎么修。
updated: 2026-06-28
order: 2
series: Web 性能
seriesOrder: 2
---

Google 用三个指标量「真实用户体验」，也直接影响搜索排名。

| 指标 | 量什么 | 好 | 差 |
|---|---|---|---|
| **LCP** 最大内容绘制 | 加载速度（最大元素何时出现） | ≤ 2.5s | > 4s |
| **INP** 交互到下一次绘制 | 响应速度（交互多久看到反馈） | ≤ 200ms | > 500ms |
| **CLS** 累计布局偏移 | 视觉稳定（页面有没有乱跳） | ≤ 0.1 | > 0.25 |

> 2024 年 3 月，**INP 正式取代 FID** 成为核心指标——FID 只看首次交互的输入延迟，INP 看整个生命周期所有交互的完整耗时，残忍得多。

## 各自怎么修

- **LCP**：压缩/预加载首屏大图与字体、减少阻塞渲染的资源、用 CDN、服务端尽早吐出 HTML。
- **INP**：拆长任务、及时让出主线程（`scheduler.yield`、`useTransition`）、别在事件回调里干重活、避免强制同步布局（参见本知识库的「事件循环」与「关键渲染路径」两条）。
- **CLS**：给 `img`/`video`/`iframe` 写明宽高（或 `aspect-ratio`）、给广告/嵌入预留位、字体用 `font-display: swap` + `size-adjust` 减少回流。

## 一个提醒

实验室数据（Lighthouse）只是参考，真正算分的是**真实用户数据**（CrUX / `web-vitals` 库上报的现场数据）。本地 90 分、线上爆红，是常事。
