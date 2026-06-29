---
title: useEffect：它是“同步副作用”，不是“生命周期”
category: React
description: 别拿 useEffect 当 componentDidMount。它的真正语义是“让外部世界与某段 state 保持同步”。
updated: 2026-06-29
order: 4
---

从类组件转过来的人，习惯把 `useEffect(fn, [])` 当成 `componentDidMount`、把带依赖的当 `componentDidUpdate`。这个类比会带你写出一堆别扭的代码。

## 正确的心智模型：同步，而非时机

useEffect 的语义不是「在某个生命周期时刻跑一段代码」，而是：

> **让某个外部系统（DOM 订阅、定时器、网络连接、第三方库实例）与你的 state / props 保持同步。** 依赖变了就「重新同步」——先清理旧的，再建立新的。

所以 effect 的标准形状是「建立 + 清理」成对出现：

```jsx
useEffect(() => {
  const conn = connect(roomId);      // 建立：与 roomId 同步
  return () => conn.disconnect();    // 清理：roomId 变 / 卸载前，拆掉旧的
}, [roomId]);                        // roomId 变 → 自动断开旧房间、连上新房间
```

## 依赖数组的三种写法

| 写法 | 含义 |
|---|---|
| 不写第二个参数 | 每次 render 后都跑（几乎总是错的） |
| `[]` 空数组 | 只在挂载时跑一次、卸载时清理一次 |
| `[a, b]` | a 或 b 变化后重新同步 |

依赖数组要**如实列出 effect 内部用到的每一个响应式值**（props、state、由它们算出的变量）。漏写 → stale closure（见「useState 闭包陷阱」）；用 `eslint-plugin-react-hooks` 帮你查。

## 常见的「其实不需要 effect」

很多 effect 是多余的，社区共识是**能不用就不用**：

- **从 props/state 算出的派生值** → 直接在 render 里算，或 `useMemo`，不要 effect + setState。
- **响应用户事件**（点击后发请求） → 写在事件处理函数里，不是 effect 里。
- **STRICTMODE 下 effect 跑两次**是故意的：逼你写好清理函数。清理写对了，跑两次不会有问题。

## 结论

把 effect 当作「我要和 React 之外的世界同步什么」。如果一段逻辑既不订阅外部、也不响应外部，它大概率根本不该是 effect。
