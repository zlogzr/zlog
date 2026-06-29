---
title: 别让最慢的数据卡住整页：defer 与流式
category: 路由
description: 页面里有快数据也有慢数据时，不必等齐。先渲染快的，慢的用 Suspense 占位、好了再补。
updated: 2026-06-29
order: 3
series: React 数据与路由
seriesOrder: 3
related: [react-suspense-error-boundary, nextjs-rendering-modes]
---

loader「进页面前取齐数据」有个副作用：**它会等齐所有数据才渲染**。如果页面里混着快数据（商品基本信息，50ms）和慢数据（评论、推荐，800ms），整页就被那 800ms 拖着——明明商品信息早就能显示了。

## 思路：关键数据等，非关键数据流

把数据分两类：**首屏必需的**（等它）和**可以晚一点的**（先占位）。React Router 用 `Await` + Suspense，Next.js App Router 用 Suspense，本质是同一招。

```jsx
// React Router loader：关键数据 await，慢数据不 await（返回 promise）
async function loader({ params }) {
  const product = await getProduct(params.id);   // 快，等它
  const reviews = getReviews(params.id);          // 慢，先不等，丢 promise
  return { product, reviews };
}

function ProductPage() {
  const { product, reviews } = useLoaderData();
  return (
    <>
      <ProductInfo product={product} />          {/* 立刻渲染 */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Await resolve={reviews}>
          {(data) => <Reviews data={data} />}     {/* 好了再补上 */}
        </Await>
      </Suspense>
    </>
  );
}
```

时间线从「等齐 800ms 才出现整页」，变成「50ms 出现商品信息 + 骨架屏，800ms 时评论补进来」。

## 这背后是同一个模式

| 框架 | 关键数据 | 慢数据占位 |
|---|---|---|
| React Router / Remix | loader 里 `await` | 返回 promise + `<Await>` + Suspense |
| Next.js App Router | 服务端组件直接 `await` | 拆进 `<Suspense>` 子组件，服务端流式补发 |
| 纯 React | —— | `<Suspense>` + 支持 suspense 的数据源 |

共同点：**Suspense 是「这块还没好，先显示 fallback」的统一机制**；流式则是「服务端边算边发、客户端边收边补」的传输方式。两者配合，让首屏不被尾部的慢数据绑架。

## 结论

- 不要默认「等所有数据齐了再渲染」。先问：哪些是首屏真正必需的？只等那些。
- 慢的、非关键的（评论、推荐、销量统计）→ Suspense 占位，流式补上。直接改善 LCP 和「感知速度」。
- 代价是要写骨架屏、要想清楚数据的优先级——但用户对「立刻看到东西」的感受，远好过对着白屏等齐。
