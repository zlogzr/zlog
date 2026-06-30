---
title: 类型收窄与 satisfies
category: TypeScript
description: 让 TS 在分支里自动推断更精确的类型，以及用 satisfies 校验而不丢失字面量。
updated: 2026-06-30
order: 6
series: TypeScript 类型系统
seriesOrder: 5
related: [ts-generics, ts-conditional-infer]
---

## 类型收窄（narrowing）

在分支里，TS 会根据判断把联合类型收窄成更精确的类型：

```ts
function len(x: string | string[]) {
  if (typeof x === 'string') return x.length;   // 这里 x 是 string
  return x.reduce((n, s) => n + s.length, 0);    // 这里 x 是 string[]
}
```

常用的收窄手段：`typeof`、`instanceof`、`in`、真值判断、`===` 比较。最好用的是**可辨识联合**——用一个公共字面量字段当"标签"：

```ts
type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'rect'; w: number; h: number };

function area(s: Shape) {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2; // s 收窄为 circle
    case 'rect': return s.w * s.h;            // s 收窄为 rect
  }
}
```

## satisfies（TS 4.9+）

`satisfies` 校验值符合某个类型，**但保留更窄的推断结果**，不把类型拓宽：

```ts
const palette = {
  brand: '#3b5bdb',
  bg: '#fff',
} satisfies Record<string, string>;

palette.brand.toUpperCase(); // ✅ 仍被推断成 string（字面量保留）
// 若写成 : Record<string,string>，取值会被拓宽，丢掉键的精确性
```

> 一句话：注解（`:`）是"把值塞进类型"，`satisfies` 是"用类型检查值、但不动值本身的推断"。要约束又要精确，用后者。
