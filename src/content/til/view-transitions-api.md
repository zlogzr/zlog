---
title: "View Transitions：两行代码给 DOM 变更加转场"
date: 2026-07-07
tags: ["CSS", "JavaScript"]
source: "https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API"
sourceLabel: "MDN: View Transition API"
---

以前做"列表删除一项，其余项平滑补位"要手写 FLIP 动画。View Transitions 把它变成一次包裹：

```js
document.startViewTransition(() => {
  item.remove();  // 任意 DOM 变更
});
```

浏览器给变更前后各截一张"快照"，自动在两者间做交叉淡入；给元素指定 `view-transition-name: hero-img` 后，同名元素还会**在新旧状态间平移缩放**——商品列表图放大成详情主图的效果就是免费的。

MPA 也能用：两个页面的 CSS 里都写上 `@view-transition { navigation: auto; }`，跨页导航直接带转场，Astro 的页面过渡就是基于这个。不支持的浏览器自然降级成瞬时切换，可以放心渐进增强。
