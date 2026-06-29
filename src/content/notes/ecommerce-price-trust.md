---
title: 价格：前端绝不能传价格
category: 电商
description: 下单时金额必须由服务端用 SKU 重新计算。任何从客户端传上来的价格都是攻击面。
updated: 2026-06-29
order: 5
series: 电商系统设计
seriesOrder: 5
related: [nextjs-server-actions, ecommerce-cart-consistency]
---

电商安全里最低级、却最常被犯的错误：**下单接口接受前端传来的价格**。这等于把收银台交给顾客自己填金额。

## 攻击长这样

```js
// ❌ 前端把价格一起提交
POST /order { skuId: 'x', qty: 1, price: 9999 }
// 攻击者把 price 改成 0.01 —— 一行 DevTools 的事
```

只要服务端信了这个 `price`，就能 1 分钱下单。这类漏洞在真实电商里反复出现，损失实打实。

## 正确做法：服务端按 SKU 重算

客户端**只传「买什么、买多少」**（skuId、qty、用了哪张券的 id），**金额一律由服务端查库重算**：

```js
// ✅ 服务端是金额的唯一权威
async function createOrder({ skuId, qty, couponId }, user) {
  const sku = await db.sku.find(skuId);          // 价格从库里取，不信前端
  assert(sku && sku.status === 'on_sale');
  assert(Number.isInteger(qty) && qty > 0);

  let amount = sku.price * qty;                   // 用金额最小单位（分）算
  amount = await applyCoupon(amount, couponId, user);  // 券也在服务端校验归属/有效期/门槛
  amount = await applyPromotions(amount, sku);    // 满减、活动价同理

  // 用这个 amount 去创建订单 / 发起支付
}
```

## 连带的几条铁律

- **前端展示的价格仅供参考**，最终以服务端为准。可以做「下单时价格变动二次确认」提升体验，但**判定金额的永远是服务端**。
- **优惠券 / 活动同样不可信**：券能不能用、是不是这个用户的、满没满门槛、过没过期、互不互斥——全在服务端校验。前端传的只能是「券 id」，不能是「优惠后的价」。
- **用整数分，不用浮点元**：`0.1 + 0.2 !== 0.3`，金额用浮点迟早算错。一律用最小货币单位（分）存整数，展示时再除。
- **校验数量**：`qty` 必须是正整数、有上限（防止 `qty = -1` 或天文数字溢出）。
- **价格快照**：下单时把当时的成交价**写进订单**，之后商品改价不影响历史订单。

## 结论

记住一句话：**客户端传「意图」（买什么、多少、用哪张券），服务端定「金额」。** 凡是涉及钱的数字，前端传的都只是显示，绝不作数。这条不是优化，是底线。和「Server Actions 要自己校验」是同一个道理——便利的接口不改变信任边界。
