---
title: Bundle 体积：先测量，再谈优化
category: 性能
description: 分析产物构成、按路由切代码、动态 import 重组件、给体积上 CI 门禁。
updated: 2026-07-07
order: 4
series: Web 性能
seriesOrder: 4
related: [tree-shaking, perf-long-tasks, every-dependency-is-debt]
---

JS 是页面上最贵的字节：图片下载完就完了，JS 下载完还要解析、编译、执行，全在主线程上。砍 bundle 既是砍加载时间，也是砍交互卡顿（见[[perf-long-tasks]]）。但砍之前先测量——**凭感觉优化 bundle，通常砍错地方**。

## 第一步：看清产物里装了什么

- Vite/Rollup 用 `rollup-plugin-visualizer`，webpack 用 `webpack-bundle-analyzer`，一张 treemap 立刻现形：谁是最大的块、哪个依赖被重复打包、哪个"小工具库"其实有 300KB。
- 装依赖之前先查 [bundlephobia](https://bundlephobia.com)，很多"顺手装一个"的包体积会吓你一跳——每个依赖都是债，参见[[every-dependency-is-debt]]。

常见惊喜（按出现频率）：moment 连 locale 全量打包、lodash 整包引入、同一个库因版本冲突打了两份、一个只在管理后台用的图表库进了首页 bundle。

## 第二步：切分——用户没走到的路，代码就别发

**路由级切分**是收益最大的一刀，现代框架基本白送（Next.js 按页自动切；React Router 配 `lazy`）：

```tsx
const Settings = lazy(() => import('./pages/Settings'));
```

**组件级切分**针对"重但不一定用"的东西：富文本编辑器、图表库、地图、视频播放器——这些动辄几百 KB，却只有部分用户会触达：

```tsx
// 点击"写评价"才加载编辑器
const openEditor = async () => {
  const { RichEditor } = await import('./RichEditor');
  setEditor(() => RichEditor);
};
```

切分的度：**别切成粉末**。几 KB 的小 chunk 一堆，请求开销和瀑布反而变慢；按"用户路径的分叉点"切，而不是按文件切。

## 第三步：替换与瘦身

- **重库找轻替**：moment → dayjs（2KB）或原生 `Intl`；lodash → 按需引 `lodash-es` 或直接手写那三行。
- **只引用到的部分**：确保库走 ESM 让 tree-shaking 生效（原理见[[tree-shaking]]），`import { debounce } from 'lodash-es'` 而不是 `import _ from 'lodash'`。
- **polyfill 按目标浏览器给**：browserslist 定准了，别给 2026 年的浏览器发 ES5。

## 第四步：门禁，不然会反弹

体积优化是逆水行舟，一次大扫除之后每个 PR 都在偷偷加回来。把体积检查放进 CI：

```json
// size-limit 配置：超了直接挂 PR
[{ "path": "dist/assets/index-*.js", "limit": "150 KB" }]
```

数字本身不重要，重要的是**增长必须被看见**——一个 PR 让首屏 bundle 涨 40KB，应该在 review 里被问一句为什么。
