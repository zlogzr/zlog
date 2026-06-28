---
title: ESM vs CommonJS：为什么模块系统会打架
category: 工程化
description: 静态的 ESM 与动态的 CJS 差在哪，以及互操作为什么总出问题。
updated: 2026-06-28
order: 1
---

| | ESM | CommonJS |
|---|---|---|
| 语法 | `import` / `export` | `require` / `module.exports` |
| 加载 | 静态、异步 | 动态、同步 |
| 时机 | 编译期确定依赖 | 运行时才知道 |
| 环境 | 浏览器 / 现代 Node | Node 传统 |

## 为什么这事重要

**ESM 的 import 是静态的**——构建工具在不运行代码的前提下，就能分析出"谁依赖谁、谁导出了什么没被用到"。这正是 tree-shaking 的前提（见本知识库「Tree-shaking」一条）。CJS 的 `require()` 可以写在 `if` 里、可以拼字符串，运行时才确定，静态分析无能为力。

## 常见的坑

- **不能在 ESM 里直接 `require`**，也不能在 CJS 里直接 `import`（顶层）；互操作要靠动态 `import()` 或工具转译。
- **双包危机（dual package hazard）**：一个库同时发 ESM 和 CJS，若被两种方式各加载一次，会出现两份独立的实例与状态。
- Node 用 `package.json` 的 `"type"` 和 `"exports"` 字段决定走哪套；`.mjs` 强制 ESM，`.cjs` 强制 CJS。

## 结论

新项目优先全链路 ESM。发布库时用 `exports` 字段把入口标清楚，能只发 ESM 就别发双格式——少一种格式，少一类互操作的坑。
