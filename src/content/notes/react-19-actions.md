---
title: React 19：Actions、use 与 useOptimistic
category: React
description: React 19 把“提交表单 → pending → 错误 → 乐观更新”这套样板做成了一等公民。少写很多手动 state。
updated: 2026-06-29
order: 10
---

React 19 的主题之一，是把「异步提交」这件每个表单都要做的事，从一堆手写 state 升级成内置能力。以前你得自己管 `isPending`、`error`、提交后刷新——现在有专门的原语。

## Actions：async 函数直接当表单处理器

「Action」就是一个传给 `<form action={...}>` 或在 transition 里调用的 async 函数。React 自动帮你管理它的 **pending 状态、错误、和提交后的更新**。

```jsx
// 以前：手写一堆 state
const [isPending, setIsPending] = useState(false);
const [error, setError] = useState(null);
async function onSubmit() {
  setIsPending(true);
  try { await save(); } catch (e) { setError(e); } finally { setIsPending(false); }
}
```

## useActionState：把上面这坨收进一个 hook

```jsx
const [error, submitAction, isPending] = useActionState(
  async (prevState, formData) => {
    const res = await save(formData);
    if (res.error) return res.error;   // 返回值成为新的 state
    redirect('/done');
  },
  null,                                 // 初始 state
);
// <form action={submitAction}> —— isPending 自动管理，给按钮做 loading
```

`isPending` 不用自己设，React 全程托管。配合 Server Actions（见「Next.js Server Actions」），表单提交可以不写一行客户端请求代码。

## useOptimistic：先更新 UI，再等服务器

「乐观更新」是即时反馈的关键——点赞瞬间数字 +1，不等接口返回。以前要手动改 state、失败再回滚，繁琐易错。`useOptimistic` 把它内置了：

```jsx
const [optimisticLikes, addOptimistic] = useOptimistic(likes);
async function like() {
  addOptimistic(likes + 1);   // UI 立刻 +1
  await sendLike();            // 真正请求；失败时 React 自动回滚到真实值
}
```

请求进行中显示乐观值，**成功则被真实值覆盖、失败则自动回退**——回滚逻辑不用你写。

## use：在渲染里读 Promise / Context

`use` 是个新原语，能在渲染中「读取」一个 Promise（配合 Suspense 拿到 resolve 的值）或 Context。它比 `useContext` 灵活——**可以条件式调用**，打破了「Hook 必须在顶层」的限制（仅限 `use`）。

```jsx
const data = use(dataPromise);   // 挂起直到 resolve，配合 Suspense 用
const theme = use(ThemeContext); // 也能读 context，且可放在 if 里
```

## 结论

- React 19 把「异步表单提交」三件套——**pending（useActionState）、错误（Action 返回值）、乐观更新（useOptimistic）**——做成了内置，少写一大堆手动 state。
- 配合 Server Actions，「表单 → 提交 → 刷新」可以几乎零样板。
- 还有 **React Compiler** 在路上，能自动做记忆化（见「useMemo / useCallback」）。React 19 的方向很清楚：**把以前要手写的样板，交给框架和编译器。**
