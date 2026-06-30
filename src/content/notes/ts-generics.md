---
title: "泛型：不是「任意类型」，是「保持类型之间的关系」"
category: TypeScript
description: 泛型最大的误解是把它当成 any 的高级写法。它真正的作用是建立输入与输出之间的类型联动，外加 extends 约束让「任意」变「任意的某一类」。
updated: 2026-06-30
order: 2
series: TypeScript 类型系统
seriesOrder: 1
related: [ts-conditional-infer, ts-mapped-types, typescript-narrowing-satisfies]
---

很多人第一次看泛型，理解成「一个能接受任意类型的口子」，于是觉得它和 `any` 差不多，只是写法更装。这是最大的误解。泛型的价值不在「任意」，而在**关系**——它让函数的输入类型和输出类型**联动**起来。

## 对比一下就懂了

```ts
// ❌ any：类型信息在进门那一刻就丢光了
function first(arr: any[]): any { return arr[0]; }
const a = first([1, 2, 3]); // a 是 any，后面爱写什么写什么，全无保护

// ✅ 泛型：T 把「传进来的元素类型」一路带到了返回值
function first<T>(arr: T[]): T { return arr[0]; }
const b = first([1, 2, 3]); // b 是 number，类型一路守住了
const c = first(['x', 'y']); // c 是 string
```

区别一目了然：`any` 是「我放弃了解类型」，泛型是「我先不知道是什么类型，但我保证**进来什么、出去就是什么**」。`T` 是个**类型变量**，调用时由实参反推填入。这种「保持关系」的能力，才是泛型的本体。

## extends：从「任意」收紧到「任意的某一类」

光是「任意类型」往往太宽。我想要「任意**有 length 属性的**类型」「任意 `T` 的**键名**」——这就要用 `extends` 给类型变量加约束：

```ts
// 约束 T 必须有 length，于是函数体里可以安全访问 .length
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
longest([1, 2], [1, 2, 3]); // ✅ 数组有 length
longest('ab', 'abc');        // ✅ 字符串有 length
longest(1, 2);               // ❌ number 没有 length，编译报错
```

> 记住：泛型里的 `extends` 不是「继承」，是「**满足……的约束**」——读作「T 必须能赋值给这个类型」。

## 一个高频实战：用 `keyof` 锁住属性访问

约束最经典的应用，是让「取对象某个属性」这件事类型安全：

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: '张三', age: 30 };
getProp(user, 'name'); // 返回类型自动是 string
getProp(user, 'age');  // 返回类型自动是 number
getProp(user, 'email'); // ❌ 'email' 不是 user 的键，编译期就拦住
```

`K extends keyof T` 把 `key` 约束成「只能是 `T` 真实存在的键」，返回类型 `T[K]` 则**精确到那个键对应的类型**。这一个小工具，就杜绝了一整类「拿错字段名」的运行时 bug。

## 默认参数与多个类型变量

泛型也能有默认值，也能有多个：

```ts
interface ApiResponse<TData = unknown, TError = Error> {
  data: TData | null;
  error: TError | null;
}

// 用的时候按需指定，不指定就用默认
type UserResp = ApiResponse<User>; // TError 用默认的 Error
```

## 心法

写泛型时，别问「这里要不要支持任意类型」，要问「**这两处类型之间有没有该被保持的关系**」。有关系——参数和返回值联动、参数之间联动、键和值联动——就是泛型该上场的地方；没有关系、纯粹「什么都行」，那往往说明你该用 `unknown` 再做[[typescript-narrowing-satisfies|类型收窄]]，而不是泛型。下一篇 [[ts-conditional-infer|条件类型与 infer]] 会把这种「保持关系」的能力推到极致——让类型自己根据输入做判断。
