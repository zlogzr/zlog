---
title: 库存扣减与超卖：并发下怎么不卖飞
category: 电商
description: “查一下还有货 → 然后扣减”这两步之间，别人可能已经把货抢走了。超卖几乎都源于这个缝隙。
updated: 2026-06-29
order: 4
series: 电商系统设计
seriesOrder: 4
related: [ecommerce-idempotency, ecommerce-order-state-machine]
---

库存扣减是电商最容易出事的地方。问题的根源永远是同一个：**「检查」和「扣减」之间有缝隙**，高并发下多个请求挤进这条缝，就超卖了。

## 反例：读-改-写的经典竞态

```js
// ❌ 三步之间是缝隙，两个请求可能都读到 stock=1，都通过检查
const sku = await db.query('SELECT stock FROM sku WHERE id=?', [id]);
if (sku.stock < qty) throw new Error('库存不足');
await db.query('UPDATE sku SET stock = stock - ? WHERE id=?', [qty, id]);
```

两个并发请求都读到 `stock = 1`、都判断「够」、都扣减 → 卖出 2 件，库存变成 -1。

## 正解：把「检查 + 扣减」做成一个原子操作

### 1. 数据库原子扣减（带条件的 UPDATE）

把判断塞进 UPDATE 的 WHERE，靠数据库行锁保证原子性，看**影响行数**判断成败：

```sql
UPDATE sku SET stock = stock - :qty
WHERE id = :id AND stock >= :qty;     -- 库存够才扣
-- affectedRows = 1 → 扣减成功；= 0 → 库存不足，下单失败
```

这是最常用、最稳的做法。`stock >= qty` 的约束 + 单条 UPDATE 的原子性，从根上消除了竞态。再加一条 `CHECK (stock >= 0)` 兜底。

### 2. 乐观锁（版本号）

适合「读出来、改一堆字段、再写回」的场景：

```sql
UPDATE sku SET stock = stock - :qty, version = version + 1
WHERE id = :id AND version = :oldVersion AND stock >= :qty;
-- 影响 0 行 = 期间被别人改过，重试
```

### 3. Redis 预扣（秒杀 / 超高并发）

数据库扛不住瞬时洪峰时，用 Redis 原子操作（Lua 脚本保证「判断 + 扣减」原子）先扣缓存库存，挡掉绝大多数请求，再异步落库对账。

## 别忘了「回补」与「预占」

- **下单只是预占，不是最终扣减**：用户下单后库存要先**锁定（预占）**，超时未支付要**自动释放**回补，否则库存被没付款的订单占死。
- **取消 / 退款要回补库存**，且要**幂等**——同一个取消事件重复到达，不能补两次。
- **超时释放**常用延时队列 / 定时扫描实现。

## 结论

- 永远不要「先 SELECT 检查、再 UPDATE 扣减」——这两步之间的缝隙就是超卖的入口。
- 把判断和扣减压进**一条带 `WHERE stock >= qty` 的原子 UPDATE**，用影响行数判定成败。这是 90% 场景的正确答案。
- 秒杀级并发再叠 Redis 预扣 + 异步落库。
- 库存是「预占—确认—释放」的生命周期，不是一减了之；取消/退款的回补必须幂等。
