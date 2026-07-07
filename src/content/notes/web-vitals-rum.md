---
title: RUM：性能不是测出来的，是真实用户跑出来的
category: 监控
description: Lighthouse 分数不等于用户体验。用 web-vitals 采真实数据、用 sendBeacon 送回来、看分位数而不是平均值。
updated: 2026-07-07
order: 3
series: 前端监控
seriesOrder: 3
related: [core-web-vitals, frontend-error-tracking, caching-is-a-promise-you-have-to-keep]
---

Lighthouse 跑 95 分，用户还是抱怨慢——因为实验室数据（Lab）是**你的电脑、你的网络、一次冷加载**，而真实用户（RUM，Real User Monitoring）在地铁里、在三年前的安卓机上、带着满满的缓存或完全没有。两者是互补关系：Lab 用来在上线前回归对比，**RUM 才是体验的事实来源**——Google 排名用的 CrUX 数据就是 RUM。

## 采集：web-vitals 库封装好了所有坑

[[core-web-vitals]]的三个指标自己用 PerformanceObserver 采并不简单（LCP 要等交互后才定稿、CLS 要处理会话窗口、INP 要聚合全生命周期的交互）。官方 `web-vitals` 库都处理好了：

```js
import { onLCP, onINP, onCLS } from 'web-vitals';

function send(metric) {
  const body = JSON.stringify({
    name: metric.name,        // 'LCP' | 'INP' | 'CLS'
    value: metric.value,
    rating: metric.rating,    // 'good' | 'needs-improvement' | 'poor'
    page: location.pathname,
    navigationType: metric.navigationType,  // 冷加载 / 回退缓存 / 预渲染，分开看
  });
  navigator.sendBeacon('/api/vitals', body);
}

onLCP(send); onINP(send); onCLS(send);
```

## 上报：sendBeacon，在页面关闭时也能送出去

这几个指标很多要**到页面卸载才定稿**（CLS、INP 是累计/取最大），而卸载时发普通 fetch 大概率被浏览器掐断。`navigator.sendBeacon` 就是为此设计的：浏览器保证在页面销毁后把这包数据送完，不阻塞卸载。触发时机监听 `visibilitychange` 到 `hidden`（移动端没有可靠的 unload）。

## 分析：平均值是骗人的

1000 个用户里 950 个 1s 打开、50 个 15s 打开，平均值 1.7s——看起来挺好，但那 50 个用户已经走了。性能数据永远看**分位数**：

- **p75**：Google 判定 Core Web Vitals 达标的线（75 分位 ≤ 阈值才算 good）；
- **p95/p99**：最差体验有多差，长尾往往集中暴露某类设备或某个地区的问题。

维度切分比总量有用：按页面类型（首页 / 商品页 / 结算页）、设备档位、网络类型、地理区域切开看。"整站 LCP p75 = 2.1s" 是废话，"东南亚安卓端商品页 LCP p75 = 5.8s，因为主图没走本地 CDN" 才是行动项。

## 除了 Vitals，还值得采什么

- **资源与导航计时**：`performance.getEntriesByType('navigation'/'resource')`，能定位慢在 DNS、TTFB 还是下载——TTFB 高常常意味着缓存没命中，参见[[caching-is-a-promise-you-have-to-keep]]。
- **自定义业务节点**：`performance.mark/measure` 打"首个商品可点击""支付按钮可用"这类业务毫秒数，比通用指标更贴近转化。
- **错误与性能同源关联**：同一个会话 ID 串起错误上报（[[frontend-error-tracking]]）和性能数据，"变慢"和"报错"经常是同一个故障的两面。

和错误监控一样，RUM 要采样（大站 10% 足够）并砍掉爬虫流量，否则数据量和噪音都失控。
