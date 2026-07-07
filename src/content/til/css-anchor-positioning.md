---
title: "锚点定位：tooltip 跟随不再需要 Floating UI"
date: 2026-07-07
tags: ["CSS"]
source: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning"
sourceLabel: "MDN: CSS anchor positioning"
---

tooltip / 下拉菜单"跟着触发元素走、快出屏幕时自动翻边"，以前是 Floating UI / Popper 的地盘，现在 CSS 原生：

```css
.trigger { anchor-name: --btn; }

.tooltip {
  position: fixed;
  position-anchor: --btn;
  top: anchor(bottom);          /* 贴在锚点下方 */
  justify-self: anchor-center;  /* 水平居中对齐锚点 */
  position-try-fallbacks: flip-block;  /* 下方放不下就翻到上方 */
}
```

`anchor()` 函数能引用锚点任意一条边，`position-try-fallbacks` 处理"空间不够怎么办"。配合 Popover API（`popover` 属性）连"点外面关闭、Esc 关闭、顶层渲染"都是免费的。Chrome/Edge 已支持，Safari/Firefox 还在路上——生产环境暂时还得留 JS 兜底，但方向已经很明确：浮层这件事正在从 JS 手里回到 CSS。
