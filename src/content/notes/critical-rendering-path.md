---
title: 关键渲染路径：从字节到像素
category: 性能
description: 浏览器拿到 HTML 后，到底经过哪几步才把像素画到屏幕上。
updated: 2026-06-28
order: 1
series: Web 性能
seriesOrder: 1
---

浏览器把代码变成画面，走的是一条相对固定的流水线：

```
HTML  ─► DOM  ┐
              ├─► Render Tree ─► Layout(重排) ─► Paint(重绘) ─► Composite(合成)
CSS   ─► CSSOM ┘
```

## 几个要记住的点

- **CSS 阻塞渲染**：CSSOM 没构建完，浏览器不会渲染——所以关键 CSS 要尽早、尽小。
- **JS 阻塞解析**：`<script>` 默认会暂停 DOM 解析。用 `defer`（保序、DOMContentLoaded 前执行）或 `async`（下载完即执行、不保序）解开。
- **Layout ≠ Paint ≠ Composite**，代价依次递减。

## 重排 vs 重绘 vs 合成

| 改动 | 触发 | 代价 |
|---|---|---|
| `width` / `top` / `font-size` 等几何属性 | 重排 → 重绘 → 合成 | 最贵 |
| `color` / `background` / `visibility` | 重绘 → 合成 | 中 |
| `transform` / `opacity` | 仅合成（可走 GPU） | 最便宜 |

## 黄金法则

> 做动画优先用 `transform` 和 `opacity`；它们不碰布局，能交给合成线程，主线程卡了也照样丝滑。

避免**强制同步布局**：写样式后紧接着读 `offsetWidth` / `getBoundingClientRect()`，会逼浏览器当场重排。读写分批，别在循环里交替。
