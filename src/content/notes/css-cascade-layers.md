---
title: "@layer：把 CSS 优先级管起来"
category: CSS
description: 用级联层取代「特异性军备竞赛」，让"谁覆盖谁"变成一个架构决定。
updated: 2026-06-28
order: 1
---

`@layer` 让你先声明一套优先级顺序，**层之间后定义的胜出，无视各自内部的特异性**。

```css
/* 一次性定好秩序，越靠后优先级越高 */
@layer reset, base, components, utilities;

@layer components {
  .btn#primary { color: gray; }   /* 特异性很高 */
}
@layer utilities {
  .text-brand { color: blue; }    /* 仍然赢，因为层在后面 */
}
```

## 三条核心规则

1. **层内**仍按特异性决胜；**层间**只看层的先后。
2. **未分层的样式，优先级高于所有分层样式**（除非用 `!important`）。
3. `!important` 会让层的顺序**整个反转**——最先定义的层反而最强。

## 典型用法

```css
/* 把第三方 CSS 关进低优先级的层，从此盖不住你的样式 */
@import url("vendor.css") layer(vendor);
@layer vendor, components, utilities;
```

> 它真正解决的，不是"写法"问题，而是"谁说了算"的架构问题：你不再靠堆类名、加 `id`、甩 `!important` 去赢优先级，而是回答一个问题——reset、库、组件、工具类，谁该压过谁。
