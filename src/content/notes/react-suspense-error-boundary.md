---
title: Suspense 与错误边界：声明式地处理“还没好”和“出错了”
category: React
description: 加载中和出错，是每个异步 UI 的两种必然状态。Suspense 和 Error Boundary 把它们从散落的 if 里提出来，变成边界。
updated: 2026-06-29
order: 8
series: React 进阶
seriesOrder: 7
related: [nextjs-rendering-modes, react-router-defer-streaming, node-error-handling]
---

任何要取数据的 UI，都逃不开三种状态：**加载中、出错了、成功了**。传统写法是在每个组件里用 `if (loading)` / `if (error)` 手动分支，散得到处都是。React 提供了两个「边界」组件，把前两种状态**声明式**地抽出来。

## Suspense：声明“加载中显示什么”

`<Suspense>` 包住一棵子树，并给一个 `fallback`。当子树里有组件「挂起」（数据还没好）时，React 显示 fallback；好了再换成真正的内容。

```jsx
<Suspense fallback={<Skeleton />}>
  <Comments postId={id} />     {/* 数据没好时，自动显示 Skeleton */}
</Suspense>
```

关键在于：**`Comments` 内部不用再写 `if (loading) return <Spinner />`**。加载态被提升到了边界上，由 Suspense 统一接管。多个组件可以共用一个边界，也可以各包各的、独立加载。

## Error Boundary：声明“出错时显示什么”

Suspense 管「还没好」，**错误边界**管「出错了」。它捕获子树渲染期间抛出的错误，显示兜底 UI，而不是让整个应用白屏崩掉。

```jsx
<ErrorBoundary fallback={<p>评论加载失败，请重试</p>}>
  <Suspense fallback={<Skeleton />}>
    <Comments postId={id} />
  </Suspense>
</ErrorBoundary>
```

注意两点：

- 错误边界目前仍需**类组件**实现（`getDerivedStateFromError` / `componentDidCatch`），或直接用 `react-error-boundary` 库。这是 React 里少数还离不开 class 的地方。
- 它**只捕获渲染期间**的错误，**抓不到**事件处理函数里的错误（那些得自己 try/catch）、也抓不到异步回调里的——和「Node 错误处理」里 try/catch 抓不住异步是同一类道理：错误得在它发生的同步栈上被接住。

## 两者合体：异步 UI 的标准骨架

把它们套在一起，就得到了处理异步 UI 的干净结构——三种状态各归其位：

```jsx
<ErrorBoundary fallback={错误UI}>   {/* 出错了 */}
  <Suspense fallback={加载UI}>      {/* 还没好 */}
    <RealContent />                  {/* 成功了：组件只管这一种 */}
  </Suspense>
</ErrorBoundary>
```

`RealContent` 因此可以**假设数据一定存在**，只写成功路径，干净专注。加载和错误都被边界吸收了。

## 结论

- Suspense 把「加载中」从组件内部的 if 提升为一道边界；Error Boundary 把「出错了」同样提升为边界。
- 好处是组件本体只写「成功」这一条路径，loading / error 在外层统一、可复用地处理。
- 这套是 RSC、数据路由、流式渲染共同依赖的底座（见「Next.js 渲染模式」「别让最慢的数据卡住整页」）——它们的「占位 + 流式补上」都建立在 Suspense 之上。
