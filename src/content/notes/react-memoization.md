---
title: useMemo / useCallback：什么时候才真有用
category: React
description: 它们不是“加上就更快”的咒语。多数时候是噪音；少数几个场景里是必需。分清这几个场景。
updated: 2026-06-29
order: 5
---

到处包 `useMemo`、`useCallback`，是 React 代码里最常见的「假优化」。它们本身有成本（额外的函数、依赖数组比较、占内存），无脑加反而更慢、更难读。

## 先记住：它们解决的是「引用相等」问题

每次 render，组件里的对象 / 数组 / 函数字面量都是**全新的引用**（`{} !== {}`）。`useMemo` / `useCallback` 让你在依赖不变时**返回上一次的同一个引用**。

它真正有意义，只在「下游会拿这个引用做相等比较」的时候：

| 场景 | 需要 memo 吗 |
|---|---|
| 普通的值传给普通子组件 | **不需要**——子组件本就会跟着重渲染，省不掉 |
| 传给 `React.memo` 包裹的子组件 | **需要**——否则新引用让 `React.memo` 失效，白包 |
| 作为另一个 `useEffect` / `useMemo` 的依赖 | **需要**——否则每帧都变，effect 每帧重跑 |
| render 里一段确实昂贵的计算 | **需要**（`useMemo`）——缓存计算结果本身 |
| 一段廉价计算（拼字符串、过滤小数组） | **不需要**——比较依赖比重算还贵 |

## 例子：什么时候 useCallback 是必需的

```jsx
const Child = React.memo(function Child({ onSave }) { /* ... */ });

function Parent() {
  // ❌ 每次 render 都是新函数 → React.memo(Child) 永远失效
  const onSave = () => save();
  // ✅ 引用稳定 → Child 真的能跳过重渲染
  const onSave = useCallback(() => save(), []);
  return <Child onSave={onSave} />;
}
```

注意：`useCallback` 只有在配合 `React.memo` 的 `Child`（或被当依赖）时才有意义。给一个普通 `Child` 传 `useCallback`，纯属浪费。

## 结论

- 默认**不加**。先让代码跑起来、跑对，再用 Profiler 找出真正重渲染 / 重计算的热点，**针对性**地加。
- 三个真正需要的信号：**①** 下游是 `React.memo` 组件；**②** 这个值是别的 hook 的依赖；**③** 计算本身昂贵。其余都是噪音。
- React 19 的 **React Compiler** 能自动插入这类记忆化。它普及后，手写 `useMemo`/`useCallback` 会越来越少——又一个「编译器比人更适合做的活」。
