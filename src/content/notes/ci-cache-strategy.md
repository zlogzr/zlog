---
title: CI 缓存：key 算对了才叫缓存，算错了叫定时炸弹
category: 工程化
description: 依赖缓存、构建缓存、Docker 层缓存的 key 怎么设计，以及"缓存命中但结果错了"怎么防。
updated: 2026-07-07
order: 6
series: 前端工程化
seriesOrder: 6
related: [semver-and-lockfile, monorepo-workspace-deps, caching-is-a-promise-you-have-to-keep]
---

CI 慢的祸首通常不是测试，是**每次从零开始**：装一遍依赖、编译一遍没变的代码、拉一遍基础镜像。缓存能把十几分钟压到两三分钟，但它和所有缓存一样是一句承诺（参见[[caching-is-a-promise-you-have-to-keep]]）：**key 必须完整覆盖影响产物的所有输入**，少算一个输入，就会在某天命中一份陈旧缓存，产出一个"绿色的错误构建"。

## 依赖缓存：key = lockfile 的 hash

最基础也最值的一层。lockfile 精确钉死了整棵依赖树（见[[semver-and-lockfile]]），所以它的 hash 就是依赖安装结果的完美指纹：

```yaml
# GitHub Actions
- uses: actions/cache@v4
  with:
    path: ~/.pnpm-store
    key: pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: pnpm-${{ runner.os }}-   # 部分命中：旧 store 打底，增量下载
```

两个细节：

- **缓存 store，不缓存 node_modules**。pnpm 的内容寻址 store 天然适合跨分支复用；直接缓存 node_modules 则和 Node 版本、平台、脚本钩子耦合，坏起来很隐蔽。
- **restore-keys 是性能兜底，不是正确性兜底**。部分命中后仍会执行 `pnpm install` 校对 lockfile，所以旧 store 只省下载时间，不会装错版本——设计缓存时永远保留这道"命中后仍校验"的工序。

## 构建缓存：输入指纹要数全

Vite/tsc/turbo 的增量产物也能缓存，但输入比"源码"多得多：源文件、tsconfig、构建工具版本、环境变量、Node 大版本。turborepo 的远程缓存之所以能放心用，是因为它替你把这些都算进了 hash；自己手搓 `actions/cache` 缓存 `dist/` 时最容易漏 **构建配置和工具链版本**——升级了 Vite 但 key 没变，命中的产物就是旧编译器的输出。monorepo 里"哪些包需要重建"的依赖图（见[[monorepo-workspace-deps]]）同样属于输入。

拿不准某个输入影不影响产物时，把它算进 key：**过度失效只是慢一点，失效不足是错的**。

## Docker 层缓存：把最少变动的放最上面

镜像构建的缓存单位是"层"，一层失效则其后所有层重来。所以 Dockerfile 的顺序就是缓存策略：

```dockerfile
COPY package.json pnpm-lock.yaml ./   # 变动少的先进
RUN pnpm install --frozen-lockfile    # 只要 lockfile 没变，这层永远命中
COPY . .                              # 变动多的最后进
RUN pnpm build
```

反过来先 `COPY . .` 再 install，任何一行源码改动都会击穿安装层——最常见的 Dockerfile 性能错误。

## 两条纪律

- **给缓存设"熔断"**：所有 CI 平台都支持手动清缓存或在 key 里加个可手改的版本号（`v2-pnpm-...`）。诡异问题排查半天后发现是脏缓存的故事人人有份，留个一键全清的口子。
- **发布构建可以裸跑**：日常 PR 用满缓存追速度，打生产包的流水线不妨全量冷构建——多花十分钟，换"产物和缓存无关"的确定性，这笔交易通常划算。
