---
title: "CSRF：浏览器太「热心」带上了你的 Cookie"
category: Web 安全
description: CSRF 利用的是浏览器自动携带 Cookie 的机制。理解它，关键是分清「能不能读响应」和「请求发没发出去」是两回事。
updated: 2026-06-30
order: 2
series: Web 安全
seriesOrder: 2
related: [security-xss, security-token-storage, security-cookie-storage]
---

CSRF（跨站请求伪造）和 [[security-xss|XSS]] 经常被一起提，但它们是两种完全不同的攻击。XSS 是「攻击者在你的站点上执行脚本」；CSRF 是「攻击者借你的浏览器，冒充你向你信任的站点发请求」。攻击者全程**读不到任何响应**，他要的只是那个请求被**发出去并生效**。

## 它怎么得逞的

根源是浏览器的一个「贴心」设计：**只要向某个域名发请求，就自动带上该域名下的 Cookie**——不管这个请求是从哪个页面发起的。

设想你登录了 `bank.com`，Cookie 里存着会话。这时你访问了攻击者的 `evil.com`，页面里藏了这么一段：

```html
<!-- 你一打开页面，这个请求就自动发往 bank.com，并带上你的登录 Cookie -->
<img src="https://bank.com/transfer?to=attacker&amount=10000">

<!-- 或者用一个自动提交的隐藏表单发 POST -->
<form action="https://bank.com/transfer" method="POST" id="f">
  <input name="to" value="attacker"><input name="amount" value="10000">
</form>
<script>document.getElementById('f').submit()</script>
```

浏览器看到目标是 `bank.com`，老老实实带上了你的会话 Cookie。服务端一看 Cookie 合法，就执行了转账。攻击者读不到响应没关系——钱已经转走了。

> CSRF 的要害：**身份凭证是浏览器自动带的，不是攻击者偷的。** 所以「凭证存得有多安全」防不住它，要防的是「这个请求到底是不是用户本人在我的页面上发起的」。

## 防御一：SameSite Cookie（现在的第一道防线）

现代浏览器给 Cookie 加了 `SameSite` 属性，直接掐断「跨站自动带 Cookie」这个前提：

| 取值 | 行为 |
|---|---|
| `Strict` | 任何跨站请求都不带这个 Cookie |
| `Lax`（多数浏览器默认） | 跨站的「顶级导航 GET」会带，其它（POST、iframe、img、fetch）不带 |
| `None` | 总是带，但必须同时 `Secure`（仅 HTTPS） |

把会话 Cookie 设成 `SameSite=Lax`（或对敏感操作用 `Strict`），上面那个伪造 POST 就直接失效了——因为它是跨站的非导航请求，Cookie 根本不会被带上。这也是为什么 CSRF 这几年「没那么可怕」了：浏览器把默认值改成了 `Lax`。

```
Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax
```

## 防御二：CSRF Token（仍然需要的纵深防御）

SameSite 不是银弹：老浏览器、某些 `Lax` 仍放行的 GET 场景、或你确实需要 `SameSite=None`（跨站嵌入）时，还得靠 Token。

思路是：服务端下发一个**攻击者拿不到、也猜不到**的随机 token，要求每个改状态的请求都带上它。

- **Synchronizer Token**：服务端生成 token 存进会话，渲染表单时埋进去，提交时比对。
- **Double Submit Cookie**：token 同时放在 Cookie 和请求头里，服务端校验两者是否一致。攻击者能让浏览器带 Cookie，但**读不到 Cookie 的值**，也就没法在请求头里复现它（同源策略保护）。

前后端分离项目里，常见做法是让前端从一个 `XSRF-TOKEN` Cookie 读出 token，放进自定义请求头（如 `X-XSRF-TOKEN`）——axios 默认就支持这套。**自定义请求头本身就有防护意义**：跨站的简单请求加不了自定义头，会触发 [[security-cors|CORS 预检]]而被拦下。

## 一个常见误解

「我用了 JWT 存在 localStorage、用 `Authorization` 头传，就天然免疫 CSRF 了。」——这话**对一半**。

因为 token 不在 Cookie 里、不会被浏览器自动携带，CSRF 确实打不到你。但代价是：放在 localStorage 的 token 会暴露在 [[security-xss|XSS]] 面前（JS 能直接读）。你只是把风险从 CSRF 换成了 XSS。这两种存储方式的完整权衡，见 [[security-token-storage|前端令牌该存哪]]。
