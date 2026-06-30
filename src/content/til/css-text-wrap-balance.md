---
title: "用 text-wrap: balance 让标题换行更好看"
date: 2026-06-29
tags: ["CSS"]
source: "https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap"
sourceLabel: "MDN: text-wrap"
---

标题折行时，最后一行经常只剩一个孤零零的词（业内叫 orphan），很丑。`text-wrap: balance` 让浏览器把多行文字的宽度尽量均摊，几行长度更接近：

```css
h1, h2, h3 {
  text-wrap: balance;
}
```

它有行数上限（一般 ≤6 行才生效），所以**只适合标题这类短文本**，别全局套到正文段落上。正文想避免行尾孤字，用 `text-wrap: pretty` 更合适——它只优化最后一两行，性能开销小得多。
