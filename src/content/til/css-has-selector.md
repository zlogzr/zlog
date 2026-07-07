---
title: ":has() 终于让 CSS 能「看孩子选爹」了"
date: 2026-07-07
tags: ["CSS"]
source: "https://developer.mozilla.org/en-US/docs/Web/CSS/:has"
sourceLabel: "MDN: :has()"
---

以前"根据子元素改父元素样式"只能上 JS，现在一行选择器：

```css
/* 里面有校验失败输入框的表单项，整块标红 */
.field:has(input:invalid) { border-color: red; }

/* 购物车非空时，图标出小红点 */
.cart-icon:has(.badge:not(:empty))::after { content: ''; /* … */ }
```

它不止能选父级——`h2:has(+ p)` 选"后面紧跟段落的标题"，本质是**任意方向的关系选择**。注意 `:has()` 内部不能再嵌 `:has()`，并且它让选择器匹配成本变高，别挂在 `*` 这种超宽的选择器上。主流浏览器已全绿。
