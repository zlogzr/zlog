---
title: Vitest：单元测试与 mock 的边界
category: 测试
description: 为什么选 Vitest、怎么组织单测，以及 mock 的第一原则——mock 得越多，测试越假。
updated: 2026-07-07
order: 2
series: 前端测试
seriesOrder: 2
related: [testing-strategy, msw-api-mocking]
---

Vitest 现在是前端单测的默认选择，理由很实际：**复用 Vite 的配置和转换管线**。Jest 时代"测试环境和构建环境各配一套 alias / 插件 / 转译"的双份维护没有了；ESM、TS、JSX 开箱即用，watch 模式复用 HMR 思路所以极快。API 与 Jest 基本兼容，迁移成本低。

## 单测的形态：Arrange-Act-Assert

```ts
import { describe, it, expect } from 'vitest';
import { applyCoupon } from './pricing';

describe('applyCoupon', () => {
  it('满减券不足门槛时原价返回', () => {
    const cart = { total: 99, items: 2 };            // Arrange
    const result = applyCoupon(cart, { type: 'threshold', min: 100, off: 20 }); // Act
    expect(result.total).toBe(99);                   // Assert
  });

  it('折扣券按比例向下取整到分', () => {
    expect(applyCoupon({ total: 100.05, items: 1 }, { type: 'percent', rate: 0.85 }).total)
      .toBe(85.04);
  });
});
```

测试名写**业务规则**而不是函数名（"不足门槛时原价返回"，而非 "test applyCoupon 1"）——测试挂掉时，名字本身就是需求文档。

## mock 的第一原则：只 mock 你不拥有的边界

`vi.mock()` 很好用，好用到容易滥用。判断标准：

- **该 mock**：网络请求、时间、随机数、localStorage、第三方 SDK——不确定、慢、或有副作用的**外部边界**。
- **不该 mock**：你自己的模块。把 `utils/price` mock 掉再测 `cart`，测的就是"cart 有没有按我想象的方式调用 price"——实现细节，重构即碎，而且两个模块间真实的集成 bug 一个也抓不到。

```ts
// 时间是最常见的必 mock 项
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => vi.useFakeTimers({ now: new Date('2026-07-07T10:00:00') }));
afterEach(() => vi.useRealTimers());

it('活动倒计时到点后返回已结束', () => {
  const timer = createCountdown('2026-07-07T10:00:30');
  vi.advanceTimersByTime(31_000);
  expect(timer.ended).toBe(true);
});
```

网络层的 mock 单独用 MSW 做（下一篇），比 `vi.mock('axios')` 靠谱得多——mock axios 意味着换成 fetch 时所有测试作废。

## 几个实用配置

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',        // 组件测试需要 DOM；纯逻辑用默认 node 更快
    globals: true,               // 免 import describe/it/expect
    coverage: { provider: 'v8', thresholds: { lines: 80 } },
    setupFiles: ['./src/test/setup.ts'],  // 注册 jest-dom 断言、MSW server
  },
});
```

覆盖率阈值卡在关键目录就好（如 `src/lib/pricing/`），全局一刀切 80% 只会逼人给不值得测的代码写凑数测试——参见[[testing-strategy]]里"该不该测"的两个轴。
