---
title: React 渲染机制：Fiber 与协调
category: React
description: render 不是“画到屏幕”，而是算出差异；commit 才动 DOM。两个阶段分开，才有可中断的渲染。
updated: 2026-06-29
order: 1
series: React 进阶
seriesOrder: 1
related: [react-key-and-diff, react-closure-stale-state]
---

很多人把 React 的 "render" 理解成「把组件画到屏幕上」，这是误会的源头。React 的一次更新分成**两个阶段**：

| 阶段 | 干什么 | 能否中断 |
|---|---|---|
| **Render（协调）** | 调用组件函数、算出新的虚拟树、和旧树做 diff | 可中断、可丢弃、可重来 |
| **Commit** | 把算出来的差异真正写进 DOM | 同步、不可中断 |

> render 是**纯计算**——算出「该变成什么样」；commit 才**碰 DOM**。把这两件事分开，是理解 React 一切性能行为的前提。

## Fiber 是什么

React 16 起，内部把每个组件 / DOM 节点表示成一个 **fiber 节点**——一个普通 JS 对象，记着类型、props、对应的 DOM、以及指向父 / 子 / 兄弟的指针。整棵树是一个可遍历的链表结构。

为什么要这套结构？因为链表可以**遍历到一半停下来，记住进度，下一帧再接着走**。这就是 **并发渲染（concurrent）** 的物理基础：render 阶段被切成很多小块，穿插在浏览器的空闲时间里跑，高优先级的更新（比如用户输入）可以**插队**，把正在进行的低优先级 render 丢弃重来。

## 协调（reconciliation）：怎么决定复用还是重建

diff 新旧两棵树时，React 用两条朴素规则把 O(n³) 的通用树 diff 砍成 O(n)：

- **类型不同 → 整棵子树重建**。`<div>` 变成 `<span>`，下面的所有节点全部卸载重挂，state 也丢了。
- **类型相同 → 复用节点，只更新变化的 props**。

列表则靠 `key` 来匹配「这一项还是不是上次那一项」（见本知识库「key 的作用」一条）。

## 三个实战结论

- **render 多 ≠ 慢**。重新调用组件函数很便宜；真正贵的是 commit（动 DOM）和你在 render 里塞的重计算。优化前先分清你慢在哪个阶段。
- **组件函数必须是纯的**。因为 render 可能被中断、丢弃、重跑——你在渲染期间做的副作用（改全局变量、发请求）可能执行多次或半途作废。副作用要放进 effect 或事件处理里。
- **state 跟着 fiber 的位置走**。同一位置、同一类型的组件，更新时复用同一个 fiber，state 得以保留；位置或类型一变，state 就没了。这解释了一大半「state 莫名其妙被重置」的 bug。
