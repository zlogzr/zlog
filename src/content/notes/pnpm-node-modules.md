---
title: pnpm 为什么又快又省，还更安全
category: 工程化
description: 内容寻址存储 + 硬链接，以及它如何顺手堵掉「幽灵依赖」。
updated: 2026-06-28
order: 4
series: 前端工程化
seriesOrder: 4
---

npm / yarn 的经典 `node_modules` 有两个老毛病：**占空间**（每个项目复制一份所有依赖）和**幽灵依赖**（扁平化后，你能 import 到自己没声明的包）。pnpm 用两招把它们都解决了。

## 一、全局存储 + 硬链接

pnpm 把所有下载过的包，按内容哈希存进一个**全局 store**，项目里的 `node_modules` 只是**硬链接**回那个 store。

```
~/.pnpm-store/        ← 同一个包全机器只存一份真实文件
project-a/node_modules/.pnpm/react@18.2.0/  ← 硬链接，不占额外空间
project-b/node_modules/.pnpm/react@18.2.0/  ← 同样链接到 store
```

结果：十个项目都用 React 18.2.0，磁盘上只有一份；装依赖大多是「建链接」而非「拷文件」，所以快。

## 二、严格的 node_modules，堵住幽灵依赖

npm 把依赖**扁平**铺在 `node_modules` 顶层，于是你**没声明**的间接依赖也能被 import——这就是幽灵依赖，哪天它在依赖树里消失，你的代码毫无征兆地崩。

pnpm 用**符号链接**搭出一个嵌套结构：顶层只暴露你在 `package.json` 里**真正声明过**的包，其余间接依赖藏在 `.pnpm/` 里。你想 import 没声明的东西，直接报错——逼你把依赖关系写诚实。

> 省空间和快只是甜头，**「你只能用你声明过的依赖」** 才是 pnpm 给工程化带来的真正纪律。

外加一句：pnpm 内建 workspaces，是搭 monorepo 的顺手之选。
