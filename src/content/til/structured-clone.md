---
title: "深拷贝不用再 JSON.parse(JSON.stringify) 了"
date: 2026-06-17
tags: ["JavaScript"]
---

`JSON.parse(JSON.stringify(obj))` 这个深拷贝老套路有一堆坑：`Date` 变字符串、`undefined`/函数被丢掉、`Map`/`Set` 直接没了、循环引用直接抛错。现在有原生的 `structuredClone`：

```js
const copy = structuredClone(original);
```

它能正确处理 `Date`、`Map`、`Set`、`ArrayBuffer`、循环引用等。注意它**拷不了函数和 DOM 节点**（会抛错），也不保留原型链（拷出来是普通对象）。这两点之外，日常深拷贝它基本够用，且是浏览器和 Node 都内置的。
