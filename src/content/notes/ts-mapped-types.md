---
title: "映射类型：遍历一个对象类型的每个键，批量改造"
category: TypeScript
description: 映射类型是「类型版的 for-in」。讲清 in keyof 的遍历、修饰符增删（?、readonly）、以及 as 子句做 key 重映射——Partial/Readonly/Record 都是它做的。
updated: 2026-06-30
order: 4
series: TypeScript 类型系统
seriesOrder: 3
related: [ts-generics, ts-conditional-infer, ts-utility-types]
---

如果说[[ts-conditional-infer|条件类型]]是类型层面的 if，那映射类型就是类型层面的 **for 循环**——遍历一个对象类型的每一个键，对每一项做统一改造，产出一个新类型。TS 内置的 `Partial`、`Readonly`、`Record` 全是它实现的。

## 基本形态：`[K in keyof T]`

```ts
// 遍历 T 的每个键 K，把每个属性的值类型保持为 T[K]
type Clone<T> = {
  [K in keyof T]: T[K];
};
```

`[K in keyof T]` 就是「让 `K` 依次取遍 `T` 的所有键」。这个骨架本身只是复制，威力在于你可以在遍历时**对每一项动手脚**——改值类型、改修饰符、改键名。

## 改造一：批量变换值类型

```ts
// 把每个属性都变成「函数返回该类型」—— 常用于把数据对象变成 getter 对象
type Getters<T> = {
  [K in keyof T]: () => T[K];
};

type X = Getters<{ name: string; age: number }>;
// { name: () => string; age: () => number }
```

## 改造二：增删修饰符（`?` 和 `readonly`）

映射时可以给修饰符加 `+`/`-` 前缀来**添加或移除**：

```ts
// 全部变可选 —— 这就是内置 Partial 的实现
type Partial<T> = { [K in keyof T]?: T[K] };

// 全部变只读 —— 这就是 Readonly
type Readonly<T> = { readonly [K in keyof T]: T[K] };

// 反过来：移除可选、移除只读
type Required<T> = { [K in keyof T]-?: T[K] };
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
```

看懂这几行，你就把四个最常用的内置工具类型的「魔法」拆穿了——它们没有任何黑魔法，全是映射 + 修饰符增删。

## 改造三：用 `as` 重映射键名

TS 4.1 起，可以在映射里用 `as` 子句**改键名本身**，配合模板字面量类型，能做出很灵活的变换：

```ts
// 给每个键加上 get 前缀并首字母大写，生成 getter 方法名
type GettersNamed<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type X = GettersNamed<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }
```

`as` 还能用来**过滤键**——把某个键重映射成 `never`，它就会从结果里被剔除：

```ts
// 只保留值为函数的属性（过滤掉非函数键）
type MethodsOnly<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};
```

这里就能看到三件武器的合体：**映射类型**（遍历键）+ **条件类型**（判断值是不是函数）+ **键重映射**（不满足就变 `never` 而被删掉）。复杂类型工具几乎都是这三者的组合。

## 实战意义

映射类型让你能从一个「真实来源」派生出一整族相关类型，而不必手写、手维护。比如：

- 从一份数据模型，派生出「表单状态」（每个字段加 `error`/`touched`）；
- 从一份 API 契约，派生出「请求参数」「响应结构」；
- 从一个配置对象，派生出「只读快照」。

> 它的根本价值和泛型一脉相承：**消除重复、保持类型之间的单一事实来源。** 改一处源类型，所有派生类型自动跟着变——这比任何注释都可靠。下一篇 [[ts-utility-types|内置工具类型]] 会把这些原料组合起来，看官方是怎么用映射 + 条件搭出整套工具箱的。
