---
title: Sourcemap：让线上堆栈变回人话，但别泄漏源码
category: 监控
description: 压缩代码的堆栈没法看。怎么生成、怎么只给监控平台不给浏览器、怎么和 release 对上号。
updated: 2026-07-07
order: 2
series: 前端监控
seriesOrder: 2
related: [frontend-error-tracking, what-we-pay-build-tools-for]
---

线上抓到的错误堆栈长这样：`at t (index-B3xQ9.js:1:48213)`。构建器把代码压缩改名之后（这正是我们付给构建工具的代价之一，见[[what-we-pay-build-tools-for]]），堆栈坐标对人类毫无意义。sourcemap 就是那张"压缩后坐标 → 源码位置"的映射表，让 `1:48213` 变回 `src/cart/checkout.ts:42` 里的 `submitOrder`。

## 生成：hidden 是生产环境的正确姿势

```js
// vite.config.ts
export default defineConfig({
  build: { sourcemap: 'hidden' },
});
```

三个档位的区别在**谁能拿到映射**：

| 配置 | 产物 | 谁看得到源码 |
|---|---|---|
| `true` | .map 文件 + JS 末尾的指向注释 | **所有人**——浏览器 DevTools 直接还原你的源码 |
| `'hidden'` | .map 文件，但**不加注释** | 只有拿到 .map 文件的人 |
| `false` | 无 | 没人，包括你自己 |

`true` 等于把源码（含注释、内部路径、有时还有没删干净的密钥）公开发布；`false` 等于放弃排查能力。生产环境几乎总是 `'hidden'`：**map 照生成，但只上传给错误监控平台，不部署到静态服务器**。

## 上传：map 跟着 release 走

还原的前提是"这条堆栈用哪份 map"。对不上版本的 map 会还原出张冠李戴的源码位置，比不还原更害人。所以流水线里的顺序是固定的：

```bash
# CI 构建阶段
npm run build                      # 产出 JS + .map
sentry-cli releases new "$GIT_SHA"
sentry-cli sourcemaps upload --release "$GIT_SHA" ./dist
rm dist/**/*.map                   # 上传后从部署产物中删掉
```

前端运行时上报错误时带上同一个版本号（构建时注入 `import.meta.env` 即可），平台按 release 取对应的 map 做符号化。自建的话核心也一样：存 map、按 release 索引、用 `source-map` 库把 `(line, column)` 反查回源位置。

## 三个容易翻车的细节

- **map 上传失败别静默**。CI 里上传步骤挂了但构建继续发布，等于这个版本的错误全变乱码——把上传失败设为阻断，或至少强告警。
- **hash 文件名是天然的版本隔离**，但 HTML 这类不带 hash 的入口要小心缓存：用户跑着旧 JS、你已经删了旧 map，堆栈就永远还原不了。map 至少保留最近几个 release。
- **第三方脚本没 map**。堆栈里混着 CDN SDK 的帧很正常，符号化时跳过它们，聚合指纹也别把三方帧算进去，否则 SDK 一发版你的"新错误"全线爆炸。

错误捞全（上一篇）+ 堆栈可读（这一篇），排查链路才算通。下一篇解决"不报错但很慢"的问题——性能监控。
