---
title: Playwright：E2E 只测你赔不起的链路
category: 测试
description: E2E 贵在维护而不是编写。选路径、防 flaky、管测试数据，比会写脚本重要。
updated: 2026-07-07
order: 5
series: 前端测试
seriesOrder: 5
related: [testing-strategy, msw-api-mocking]
---

E2E 是唯一"真浏览器 + 真后端 + 真数据库"全链路跑通的测试，信心最足，也最贵——不是写起来贵，是**养起来贵**：慢、易 flaky、环境依赖重。所以第一原则是克制：**只测出了事故要赔钱的链路**。电商站就是那几条：注册登录、搜索到商品、加购、下单支付、查订单。十条以内，别贪。

## 为什么是 Playwright

相比 Selenium/Cypress 一代的工具，Playwright 解决的核心痛点是**自动等待**：每个操作前自动等元素可见、可点、不在动画中，绝大多数 `sleep(2000)` 式的坑从根上消失。加上多浏览器引擎（Chromium/Firefox/WebKit）、并行隔离的 context、trace 回放，基本是当前默认选择。

```ts
import { test, expect } from '@playwright/test';

test('游客下单主链路', async ({ page }) => {
  await page.goto('/products/mechanical-keyboard');
  await page.getByRole('button', { name: '加入购物车' }).click();
  await page.getByRole('link', { name: '去结算' }).click();
  await page.getByLabel('收货地址').fill('杭州市余杭区…');
  await page.getByRole('button', { name: '提交订单' }).click();
  await expect(page.getByText('订单提交成功')).toBeVisible();
});
```

定位器沿用 Testing Library 的哲学：优先 `getByRole`/`getByLabel`，CSS 选择器是最后手段——`.btn-primary:nth-child(2)` 这种选择器改个样式就碎。

## 防 flaky 的几条纪律

flaky 的 E2E 比没有更糟：红了没人信，绿了不敢信，最后整个流水线被 `--skip-e2e`。

- **禁止固定 sleep**。要等就等**状态**：`await expect(locator).toBeVisible()` 自带重试轮询。
- **测试之间零依赖**。每条测试自己造数据自己清理，能并行、能单跑。靠"上一条测试留下的购物车"的测试，重排顺序就死。
- **登录态用 storageState 复用**。别每条测试都走一遍 UI 登录——又慢又把登录页变成全局单点故障：

```ts
// 全局 setup 登录一次，存下 cookie/localStorage
await page.context().storageState({ path: 'auth.json' });
// 之后所有测试直接带着登录态开跑
test.use({ storageState: 'auth.json' });
```

- **失败必留 trace**。`trace: 'on-first-retry'`，flaky 复现不了的时候，trace 回放（DOM 快照 + 网络 + console 逐帧）是唯一的破案工具。

## 测试数据是真正的难题

E2E 最难的不是脚本是数据：下单会真扣库存、真生成订单。可行的解法按投入排序：专用测试环境每晚重置种子数据；测试账号 + 测试商品白名单；支付这类外部依赖切到沙箱模式（Stripe test mode 之类）。**千万别在 E2E 里 mock 自家后端**——那它就退化成了一个又慢又贵的集成测试，MSW 那层（参见[[msw-api-mocking]]）早就覆盖了。

## 在流水线里的位置

PR 上跑集成测试（分钟级），E2E 挂在合并后 / 部署预发之后跑（十分钟级），失败阻断上生产。让最贵的测试只在最接近发布的时刻花钱。
