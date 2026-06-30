---
title: "内置工具类型：会用是基础，会拆才算懂"
category: TypeScript
description: Pick/Omit/Record/Exclude/Extract/NonNullable…逐个拆解它们的实现，你会发现没有黑魔法，全是泛型 + 映射 + 条件类型的组合。
updated: 2026-06-30
order: 5
series: TypeScript 类型系统
seriesOrder: 4
related: [ts-generics, ts-conditional-infer, ts-mapped-types]
---

TS 内置了一批工具类型，日常几乎天天用。但「会用」只是起点——当你能把每一个的实现**手写出来**，才说明你真正掌握了前面几篇讲的[[ts-generics|泛型]]、[[ts-conditional-infer|条件类型]]、[[ts-mapped-types|映射类型]]。好消息是：它们没有一个是黑魔法，全是这三块积木的拼装。

## 按「积木」分类来记

| 工具类型 | 干什么 | 底层用了什么 |
|---|---|---|
| `Partial` / `Required` | 全可选 / 全必填 | 映射 + 修饰符增删 |
| `Readonly` | 全只读 | 映射 + 修饰符 |
| `Pick` / `Omit` | 挑出 / 排除部分键 | 映射 + 键约束 |
| `Record` | 构造键值类型 | 映射 |
| `Exclude` / `Extract` | 从联合里排除 / 提取 | 分布式条件类型 |
| `NonNullable` | 去掉 null/undefined | 条件类型 |
| `ReturnType` / `Parameters` | 提取函数返回值 / 参数 | 条件类型 + infer |

记忆窍门：**改造对象的（Partial/Pick/Record…）靠映射，处理联合的（Exclude/Extract）靠分布式条件，从函数里抽东西的（ReturnType/Parameters）靠 infer。**

## 逐个拆开看

**Pick / Record——纯映射：**

```ts
// 从 T 里挑出 K 指定的那几个键
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 构造一个「键是 K、值都是 V」的对象类型
type Record<K extends keyof any, V> = {
  [P in K]: V;
};
```

**Exclude / Extract——分布式条件类型：**

```ts
// 从 T 中剔除能赋值给 U 的成员
type Exclude<T, U> = T extends U ? never : T;
// 反过来，只保留能赋值给 U 的
type Extract<T, U> = T extends U ? T : never;

type A = Exclude<'a' | 'b' | 'c', 'a'>; // 'b' | 'c'
```

这里用到了上一篇说的[[ts-conditional-infer|分布式条件类型]]——`T` 是裸类型变量，联合会逐个分发，不匹配的变 `never`（而 `never` 在联合里会被自动吸收消失），匹配的留下。

**Omit——组合的典范：**

```ts
// Omit 自己不直接遍历，而是「先排除键，再 Pick」
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

`Omit` 特别能说明问题：它是**用 `Pick` + `Exclude` 拼出来的**——先用 `Exclude` 从所有键里剔掉不要的，再用 `Pick` 挑出剩下的。工具类型之间会互相搭建，这就是类型系统的「组合性」。

**NonNullable / ReturnType——条件 + infer：**

```ts
type NonNullable<T> = T extends null | undefined ? never : T;
type ReturnType<T extends (...a: any) => any> =
  T extends (...a: any) => infer R ? R : any;
```

## 为什么值得花这功夫去拆

两个很实在的理由：

1. **看懂报错。** 当你嵌套使用工具类型却报出一长串看不懂的类型错误时，知道它们的实现，你才能反推哪一步出了问题，而不是瞎试。
2. **写得出自己的工具。** 业务里总有内置工具覆盖不到的需求——「深度 Partial」「把某几个键变可选、其余不变」「提取 Promise 解析后的类型」。这些都得自己用同样的积木拼。能拆官方的，就能造自己的。

> 内置工具类型不是要你背的 API 清单，而是**一份现成的范例集**——TS 团队用泛型、映射、条件、infer 给你示范了「类型该怎么组合」。把它们拆穿，你就从「类型的使用者」变成了「类型的设计者」。这也是这个 TypeScript 系列想带你走到的地方。
