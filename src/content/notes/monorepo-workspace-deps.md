---
title: Workspace：monorepo 里的依赖是怎么连起来的
category: 工程化
description: workspace 协议、内部包互链、依赖版本统一、以及"改一个包要重建谁"。
updated: 2026-07-07
order: 5
series: 前端工程化
seriesOrder: 5
related: [pnpm-node-modules, semver-and-lockfile, monorepo-is-not-a-silver-bullet]
---

把多个包放进一个仓库只是 monorepo 的表象，真正的机制是 **workspace**：包管理器把仓库里的包互相"接上"，让 `packages/ui` 改一行，`apps/web` 立刻用到，不需要发版。至于该不该上 monorepo，是另一个问题（见[[monorepo-is-not-a-silver-bullet]]）；这篇讲的是上了之后依赖怎么管。

## workspace 协议：内部包用链接，不走 registry

```yaml
# pnpm-workspace.yaml
packages: ['apps/*', 'packages/*']
```

```jsonc
// apps/web/package.json
{ "dependencies": { "@acme/ui": "workspace:*" } }
```

`workspace:*` 告诉 pnpm：这个依赖**永远解析到仓库内的那个目录**（做成符号链接），绝不从 registry 下载。两个关键行为：

- **改动即生效**：链接指向源目录，`@acme/ui` 的修改不需要发布、不需要重装，消费方直接可见。
- **发布时自动替换**：`pnpm publish` 会把 `workspace:*` 改写成当时的真实版本号（如 `^1.4.2`），发出去的包对外部用户是正常依赖。

不用 workspace 协议、写死 `"@acme/ui": "^1.4.0"` 的坑在于：registry 上恰好有这个版本时，pnpm 可能装远端的旧包而不是链接本地——"我明明改了怎么没生效"的头号来源。

## 版本统一：一个仓库别有三个 React

内部包各自声明 `react: ^18`，语义化版本的浮动范围（回顾[[semver-and-lockfile]]）可能让不同包解析到不同小版本，React、TS 这类"必须全仓一份"的依赖尤其危险（两份 React = hooks 直接崩）。治理手段：

- **catalog（pnpm 9+）**：版本号集中定义在 `pnpm-workspace.yaml` 的 `catalog:` 里，各包写 `"react": "catalog:"`，升级只改一处。
- **`pnpm dedupe`** 定期跑，把无谓分裂的版本合并；`pnpm why react` 查谁引入了第二份。
- 公共 devDependencies（eslint、typescript、vitest）提到仓库根，各包不重复声明。

## 幽灵依赖在 monorepo 里加倍危险

扁平 node_modules 下，`apps/web` 能 import 到 `packages/ui` 依赖的包——本地能跑，把 `ui` 单独发布后消费方直接炸。pnpm 的严格链接结构（见[[pnpm-node-modules]]）天然堵住这条路：**每个包只能 import 自己 package.json 里声明的东西**，这在 monorepo 里不是洁癖，是包能被独立发布的前提。

## 改了一个包，要重建/重测谁

依赖图的另一半价值是**任务编排**。`pnpm --filter '...[origin/main]' build` 只构建"自上次合并以来变过的包 + 依赖它们的包"；turborepo / Nx 在此之上加远程缓存——输入没变的任务直接复用上次产物。CI 时间从"全量 40 分钟"到"增量 3 分钟"，靠的就是这张图。缓存的正确性话题下一篇 CI 缓存继续。
