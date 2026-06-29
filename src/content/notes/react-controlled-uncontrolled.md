---
title: 受控与非受控组件：谁持有这个值
category: React
description: 输入框的值，是 React state 说了算，还是 DOM 自己说了算？这个选择决定了你的表单怎么写。
updated: 2026-06-29
order: 9
---

表单是 React 里最容易写乱的地方，乱的根源往往是没想清一个问题：**这个输入框的当前值，到底由谁持有？** 答案只有两个，对应两种模式。

## 两种模式

| | 受控（controlled） | 非受控（uncontrolled） |
|---|---|---|
| 值的归属 | React state | DOM 自己 |
| 读值 | 随时从 state 读 | 提交时用 ref 从 DOM 读 |
| 写法 | `value` + `onChange` | `defaultValue` + `ref` |

```jsx
// 受控：每次输入都进 state，React 是唯一真相
const [name, setName] = useState('');
<input value={name} onChange={e => setName(e.target.value)} />

// 非受控：DOM 自己存值，提交时才去取
const ref = useRef();
<input defaultValue="" ref={ref} />
// 提交：ref.current.value
```

## 受控的代价与价值

受控组件每敲一个字符都触发 `setState` → 重渲染。**价值**是 React 始终掌握最新值，于是可以：实时校验、根据输入联动其他 UI、格式化（自动加 `-`）、禁用提交按钮。**代价**是大表单里每个字符都重渲染，可能卡——这时配合 `useMemo` 或拆分组件。

> 关键直觉：`value` 一旦绑了 state 又不给 `onChange`，输入框就**变成只读**——因为你每次按键后 React 又用旧 state 把它覆盖回去了。这是受控组件最经典的「输入框打不了字」bug。

## 什么时候用哪个

- **需要对输入做实时反应**（校验、联动、格式化、按内容启停按钮）→ **受控**。这是大多数业务表单的选择。
- **只是收集、提交时一次性读取**，中途不关心 → **非受控**更省事、性能更好。
- **文件上传 `<input type="file">` 只能非受控**——它的值出于安全不能被 JS 设置。

## 现实里：用表单库

字段一多，手写受控的样板（每个字段一个 state、一个 onChange、一套校验）会爆炸。生产中通常用 **React Hook Form**（偏非受控、性能好）或 **Formik**（偏受控）这类库，它们把校验、错误、提交、脏值追踪都封装好了。React 19 还引入了 Server Actions + `useActionState`，让表单提交能更贴近原生 `<form>`（见「Next.js Server Actions」「React 19 新特性」）。

## 结论

写表单前先回答「这个值谁持有」：要实时反应就受控，只在提交时取就非受控。`value` 没配 `onChange` = 只读输入框，是新手第一坑。字段一多别硬写，交给表单库。
