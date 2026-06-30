---
title: "CSP：就算脚本注进来了，也让它跑不起来"
category: Web 安全
description: 内容安全策略是 XSS 的兜底防线——用一个 HTTP 头声明「只允许执行这些来源的代码」。讲清它的指令、nonce，以及为什么 unsafe-inline 等于没设。
updated: 2026-06-30
order: 3
series: Web 安全
seriesOrder: 3
related: [security-xss, security-csrf]
---

[[security-xss|XSS]] 的防御主线是「不让恶意脚本注入进来」。但只要项目够大、人够多，你不可能保证每一处输出都做对了转义。CSP（内容安全策略）就是那道**假设入口已经失守**的兜底墙：哪怕脚本被注进了页面，浏览器也拒绝执行它。

## 它是一个 HTTP 头

CSP 通过响应头（或 `<meta>`）声明：这个页面允许从哪些来源加载和执行各类资源。

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
```

逐条读：默认只信自己的源；脚本只能来自自己和指定 CDN；图片允许 `data:` URI；接口请求只能发往自己和指定 API；`frame-ancestors 'none'` 顺手防了点击劫持（不允许任何站点用 iframe 嵌入本页）。

关键效果在 `script-src`：攻击者就算成功注入了 `<script src="https://evil.com/x.js">`，浏览器一看来源不在白名单，**直接拒绝加载**。注入的内联 `<script>alert(1)</script>` 同样会被拦——因为默认情况下 CSP 禁止一切内联脚本。

## `unsafe-inline` 等于把门又拆了

这是最常见的踩坑。很多人为了让现有的内联脚本和 `onclick` 继续工作，加上了 `'unsafe-inline'`：

```
script-src 'self' 'unsafe-inline';   /* ⚠️ 这一行让 CSP 对 XSS 几乎失效 */
```

可是 XSS 注入的恰恰就是内联脚本。一旦允许内联，CSP 对 XSS 的防护就基本归零了。所以**真正有意义的 CSP，前提是页面里没有内联脚本**——要么把脚本都抽成外部文件，要么用 nonce / hash 放行特定内联块。

## nonce：给可信的内联脚本发「一次性通行证」

如果确实需要内联脚本（比如服务端注入初始数据），用 nonce：服务端每次响应生成一个随机值，写进 CSP 头，也写进对应的 `<script>` 标签。

```
Content-Security-Policy: script-src 'self' 'nonce-r4nd0m2026';
```
```html
<script nonce="r4nd0m2026">window.__DATA__ = {...}</script>
```

浏览器只执行 nonce 匹配的内联脚本。攻击者注入的脚本拿不到这个**每次都变的随机值**，自然过不了关。nonce 必须真随机、每次响应都不同——写死的 nonce 等于没有。

## 落地的正确姿势：先观察，再强制

直接上线一份严格 CSP，几乎一定会误伤——某个第三方脚本、某段祖传内联代码会突然失效。所以用 `Report-Only` 模式先跑一段时间：

```
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report;
```

这个模式**只上报、不拦截**：违规行为会被发到 `report-uri`，但页面照常工作。收集几天报告，把真正需要的来源补进白名单、把内联脚本清理掉，确认报告干净了，再切换成强制模式。

## 摆正它的位置

CSP 是**纵深防御里的最后一层**，不是第一层。它不能替代输出转义和输入净化——那些是堵 XSS 入口的主力。CSP 的价值在于：当主力百密一疏时，它把「一个 XSS 漏洞」的后果，从「攻击者完全控制你的页面」降级成「什么也没发生」。值不值得花力气配？对任何认真对待安全的站点，答案是肯定的。
