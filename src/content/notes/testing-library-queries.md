---
title: Testing Library：像用户一样查询，而不是像开发者
category: 测试
description: 查询优先级为什么把 getByTestId 排最后、user-event 和 fireEvent 差在哪、异步断言怎么写。
updated: 2026-07-07
order: 3
series: 前端测试
seriesOrder: 3
related: [testing-strategy, msw-api-mocking, react-controlled-uncontrolled]
---

Testing Library 的口号是它的全部哲学：**测试越像用户的真实用法，越能给你信心。**用户不知道组件叫什么、state 有几个，他们只看到"一个写着『加入购物车』的按钮"。所以它故意不给你访问组件实例的 API，只给你"从渲染结果里找东西"的查询。

## 查询优先级不是建议，是设计

官方排序背后有明确逻辑——**越靠前的查询，越接近用户（和辅助技术）感知页面的方式**：

1. `getByRole('button', { name: '加入购物车' })` —— 角色 + 可访问名称，首选
2. `getByLabelText` / `getByPlaceholderText` / `getByText` —— 表单和文本
3. `getByAltText` / `getByTitle` —— 图片等
4. `getByTestId` —— **最后手段**，它对用户不可见

坚持用 `getByRole` 有个副产品：**测试写不下去往往说明可访问性有问题**。按钮查不到 role？因为你用的是 `<div onClick>`。输入框没法用 label 查？因为 label 没关联。测试在免费帮你做 a11y 审查。

## get / query / find 的分工

| 前缀 | 找不到时 | 用途 |
|---|---|---|
| `getBy` | 立刻抛错 | 断言"现在就该在" |
| `queryBy` | 返回 null | **断言"不该在"**：`expect(queryByText('错误')).toBeNull()` |
| `findBy` | 等待后抛错 | **异步出现**：请求回来后才渲染的内容 |

最常见的坑是异步：数据请求回来后才出现的元素用 `getBy` 直接红。正确写法：

```tsx
render(<ProductList />);
// findBy 内置 waitFor，默认等 1s
expect(await screen.findByText('机械键盘')).toBeInTheDocument();
// 断言"加载态消失了"
await waitForElementToBeRemoved(() => screen.queryByText('加载中'));
```

## user-event，不是 fireEvent

```tsx
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.type(screen.getByLabelText('数量'), '3');
await user.click(screen.getByRole('button', { name: '加入购物车' }));
```

`fireEvent.click` 只派发一个孤立的 click 事件；`user.click` 会按真实浏览器的顺序走完 pointerdown → mousedown → focus → pointerup → click 整套。差别在细节处致命：`fireEvent.change` 能"改"一个 disabled 的输入框，`user.type` 不能——**后者会替你发现"用户根本做不到这个操作"**。受控组件的行为差异（参见[[react-controlled-uncontrolled]]）也只有 user-event 能如实暴露。

## 断言用户看到的，而非组件内部

```tsx
// ❌ 测实现：重构 state 结构就碎
expect(component.state.isOpen).toBe(true);
// ✅ 测行为：只要用户体验不变就一直绿
expect(screen.getByRole('dialog')).toBeVisible();
```

配合 MSW 把网络边界 mock 掉（下一篇），"渲染 → 交互 → 断言可见结果"这一套就是[[testing-strategy]]说的主力集成测试。
