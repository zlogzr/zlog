---
title: Tree-shaking：为什么没用上的代码还在产物里
category: 工程化
description: 摇掉死代码的前提、以及 sideEffects 这个常被忽略的开关。
updated: 2026-06-28
order: 2
series: 前端工程化
seriesOrder: 2
---

Tree-shaking = 打包时**静态分析**出哪些导出从没被用到，把它们从产物里摇掉。

## 三个前提，缺一不可

1. **用 ESM**。`import`/`export` 是静态的，能在不运行代码时分析依赖；CJS 的 `require` 做不到。
2. **没有副作用**，或副作用被标注清楚。
3. 打包器开启了 tree-shaking（生产模式下 Rollup / webpack 默认开）。

## 关键开关：sideEffects

打包器不敢乱删——万一某个模块"仅仅被导入"就会执行重要副作用（比如注册全局、引入 CSS）呢？所以它保守。你需要主动告诉它哪些文件是「纯」的：

```jsonc
// package.json
{
  "sideEffects": false           // 整个包都没副作用，放心摇
}
// 或者只保护特定文件：
{
  "sideEffects": ["*.css", "./src/polyfill.js"]
}
```

## 实战提醒

- **按名导入，别整包导入**：`import { debounce } from 'lodash-es'` 可摇；`import _ from 'lodash'`（CJS）摇不动。
- 导入了 CSS（`import './a.css'`）却标了 `sideEffects:false`，样式会被错误摇掉——所以要把 CSS 列进 `sideEffects`。
- 想知道到底打进了什么，用 bundle 分析工具（如 `rollup-plugin-visualizer`）去看，别凭感觉。
