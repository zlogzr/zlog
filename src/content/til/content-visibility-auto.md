---
title: "content-visibility: auto 跳过屏幕外的渲染"
date: 2026-06-20
tags: ["性能", "CSS"]
source: "https://web.dev/articles/content-visibility"
sourceLabel: "web.dev"
---

长列表 / 长文档首屏卡，很多时候卡在「浏览器把屏幕外的内容也排版渲染了」。`content-visibility: auto` 让浏览器跳过视口外元素的渲染工作，滚到附近再渲染：

```css
.card {
  content-visibility: auto;
  /* 给个占位尺寸，避免滚动条乱跳和布局抖动 */
  contain-intrinsic-size: auto 320px;
}
```

实测对「几百个卡片」这类页面，首屏渲染时间能砍掉一大截。关键是别忘了 `contain-intrinsic-size`——没有它，未渲染元素高度算 0，滚动条会疯狂跳动。它本质是把虚拟列表的部分收益，用一行 CSS 拿到手。
