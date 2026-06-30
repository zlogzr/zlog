---
title: "条件类型与 infer：让类型自己做 if-else 和模式匹配"
category: TypeScript
description: "T extends U ? X : Y 是类型层面的三元表达式；infer 则能在条件里「捕获」一个类型。再加上分布式条件类型这个易踩的坑，一次讲透。"
updated: 2026-06-30
order: 3
series: TypeScript 类型系统
seriesOrder: 2
related: [ts-generics, ts-mapped-types, ts-utility-types]
---

泛型让类型能「传递」，条件类型让类型能「**判断**」。一旦类型系统有了 if-else，它就从「标注工具」变成了一门能在编译期做计算的小语言。这是 TS 类型能力的分水岭。

## 条件类型：类型层面的三元表达式

语法和 JS 的三元运算符几乎一样：

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<42>;      // false
```

`T extends U ? X : Y` 读作「如果 `T` 能赋值给 `U`，结果是 `X`，否则 `Y`」。配合泛型，类型就能根据传入的不同而**算出**不同的结果：

```ts
// 根据传入类型，决定返回的消息类型
type MessageOf<T> = T extends { message: unknown } ? T['message'] : never;

type A = MessageOf<{ message: string }>; // string
type B = MessageOf<{ data: number }>;    // never（没有 message）
```

## infer：在条件里「捕获」一个类型

`infer` 是条件类型的灵魂。它允许你在 `extends` 的右侧**声明一个占位类型变量，让 TS 帮你推断并填进去**——本质是类型层面的「模式匹配」。

```ts
// 我想提取「数组元素的类型」：先假设 T 长成 U[] 的样子，把 U 捕获出来
type ElementOf<T> = T extends (infer U)[] ? U : never;

type A = ElementOf<string[]>;       // string
type B = ElementOf<number[][]>;     // number[]
```

`infer U` 的意思是：「我不知道 `U` 具体是什么，但如果 `T` 真的能匹配 `(某个类型)[]` 这个模式，就把那个『某个类型』叫做 `U` 交给我。」

这正是内置工具类型的实现方式。比如 `ReturnType`——提取函数返回值类型：

```ts
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type A = MyReturnType<() => string>;        // string
type B = MyReturnType<(x: number) => void>; // void
```

「假设 `T` 是个函数，它的返回值我先叫它 `R`，匹配上就把 `R` 给我」——一句话，模式匹配。一个条件里也能用多个 `infer`，分别捕获参数、返回值等。

## 容易踩的坑：分布式条件类型

这是条件类型最反直觉的地方。**当条件类型作用在一个「裸的类型变量」上，而传入的是联合类型时，它会自动分发到联合的每个成员**：

```ts
type ToArray<T> = T extends any ? T[] : never;

// 你以为得到 (string | number)[]，实际得到 string[] | number[]
type R = ToArray<string | number>;
// 因为它分发成了：ToArray<string> | ToArray<number>
```

多数时候这正是你想要的（比如内置的 `Exclude` 就靠它工作）。但有时你**不想**它分发——办法是用 `[]` 把类型变量「包起来」，破坏「裸变量」这个触发条件：

```ts
// 用 [T] extends [any] 包一层，关闭分发
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type R = ToArrayNonDist<string | number>; // (string | number)[]
```

> 一句话记牢分发规则：**裸类型变量 + 联合类型 = 逐个分发**。想关掉，就给两边都套上 `[]`。这个坑几乎每个写复杂类型的人都踩过一次。

## 这能拿来干嘛

条件类型 + `infer` 是「类型体操」的核心引擎，但它不是炫技——它让你能为复杂 API 写出**精确到随输入而变**的类型。比如：根据传入的事件名推断回调参数类型、根据配置对象推断返回结构、给 ORM 的查询结果推断字段。下一篇 [[ts-mapped-types|映射类型]] 会把它和「遍历键」结合起来，那才是改造整个对象类型的利器。
