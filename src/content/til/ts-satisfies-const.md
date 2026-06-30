---
title: "satisfies + as const：既要校验又要窄类型"
date: 2026-06-27
tags: ["TypeScript"]
---

想给一个配置对象做类型校验，又不想丢掉字面量的精确类型，老办法（`: Type` 注解）会两头不讨好——注解上去，值就被拓宽成了声明类型。`satisfies` 解决这个矛盾：

```ts
const routes = {
  home: '/',
  post: '/posts/:id',
} satisfies Record<string, `/${string}`>;

// routes.home 的类型仍是字面量 '/'，而不是 string
// 同时 TS 校验了每个值都满足 `/${string}` 这个约束
```

`satisfies` 只校验、不改变推断出的类型；`as const` 让结构整体只读 + 字面量化。两者常一起用：先 `as const` 锁住值，再 `satisfies` 验形状。
