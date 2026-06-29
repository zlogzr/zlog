---
title: useState 闭包陷阱：为什么读到的是旧值
category: React
description: 每次 render 都是一帧快照，函数闭包捕获的是那一帧的 state。理解这点，一半的 hooks bug 自解。
updated: 2026-06-29
order: 3
series: React 进阶
seriesOrder: 3
related: [react-useeffect-dependencies, react-fiber-reconciliation]
---

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      console.log(count); // 永远打印 0
    }, 1000);
    return () => clearInterval(id);
  }, []); // 空依赖
}
```

定时器里的 `count` 永远是 0。不是 bug，是闭包按设计工作。

## 关键心智模型：每次 render 是一帧快照

每次 render，组件函数**整个重新执行一遍**。这一帧里的 `count` 是一个**普通的 const**，值就是这次渲染时的那个数字。函数（effect 回调、事件处理、定时器回调）在定义时**闭包捕获了这一帧的 `count`**。

> state 不是一个会变的盒子，而是一串快照。第 3 次 render 里的 `count` 永远是 3，它不会“跟着更新”——更新会触发**新的一帧**，里面有个新的 `count`。

上面的 effect 因为依赖数组是空的，**只在首帧执行一次**，于是定时器永远闭包着第 0 帧的 `count === 0`。

## 三种解法

```jsx
// 1. 函数式更新：不读旧 state，让 React 把最新值喂给你
setCount(c => c + 1);

// 2. 把依赖如实写进数组：count 变 → effect 重建定时器（拿到新闭包）
useEffect(() => { /* 用到 count */ }, [count]);

// 3. 要“总是读到最新值”又不想重建：用 ref 当可变盒子
const countRef = useRef(count);
countRef.current = count;          // 每次 render 同步
// 回调里读 countRef.current → 永远是最新的
```

## 结论

- 看到「effect / 回调里拿到旧值」，先问：**这个函数闭包的是哪一帧的 state？** 答案几乎总在依赖数组里。
- 累加、基于旧值算新值 → 优先用**函数式更新** `setX(prev => …)`，它绕开了闭包问题。
- 需要「持有最新值但不想触发重渲染 / 重订阅」→ 用 **ref**。ref 是 React 里唯一“可变且跨 render 持久”的盒子。
- 不要为了消警告乱填依赖数组——依赖数组是 React 判断「闭包过期了，该重建」的依据，骗它的代价就是 stale closure。
