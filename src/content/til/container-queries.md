---
title: "容器查询：组件该看自己的容器，而不是视口"
date: 2026-07-07
tags: ["CSS"]
source: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries"
sourceLabel: "MDN: Container queries"
---

媒体查询问的是"屏幕多宽"，可组件真正关心的是"**我被塞进的格子**多宽"——同一个商品卡，在侧边栏里 300px、在主区里 800px，视口宽度帮不上忙。容器查询直接问容器：

```css
.card-wrapper { container-type: inline-size; }

.card { display: flex; flex-direction: column; }
@container (min-width: 500px) {
  .card { flex-direction: row; }  /* 容器够宽才横排 */
}
```

配套还有容器单位：`cqw`/`cqi` 是容器宽度的 1%，字号写 `font-size: clamp(1rem, 4cqi, 1.5rem)` 就能跟着容器缩放。这让"组件自适应"第一次不依赖使用方传 props/class，真正可移植。
