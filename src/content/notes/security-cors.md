---
title: "CORS：不是为了拦你，是浏览器在替用户把关"
category: 浏览器与网络
description: CORS 报错让无数人抓狂，但它拦的从来不是「请求发出去」，而是「你的 JS 读响应」。讲清同源策略、预检请求与凭证的完整模型。
updated: 2026-06-30
order: 2
series: 浏览器与网络
seriesOrder: 2
related: [security-cookie-storage, security-csrf, http-caching]
---

`Access-Control-Allow-Origin` 报错大概是前端最常见的「拦路虎」。但绝大多数人误解了它：CORS 不是服务器在拒绝你，多数情况下**请求其实已经到达服务器并执行了**，是浏览器在最后一步拦住了你的 JS——不让它读响应。要理解 CORS，先得理解它要保护的是什么。

## 根源：同源策略

浏览器有条铁律——**同源策略**：一个源（协议 + 域名 + 端口三者全同才叫同源）的脚本，默认不能读取另一个源的响应。

为什么？设想没有这条规则：你在 `evil.com`，它的 JS 用 `fetch('https://bank.com/account')` 发请求。因为浏览器会[[security-csrf|自动带上你的 bank.com Cookie]]，请求会带着你的登录态成功返回，然后 `evil.com` 的脚本就读到了你的账户信息。同源策略就是来掐断这条路的：请求可以发，但**跨源的响应，你的脚本读不到**。

CORS（跨源资源共享）则是一套「**例外机制**」：当服务端**明确表示**「我允许这个源读我的响应」时，浏览器才放行。

## 简单请求 vs 预检请求

CORS 把跨源请求分成两类：

**简单请求**（GET/POST/HEAD + 只用安全的头 + 特定 Content-Type）直接发出，服务端在响应里带上许可头：

```
Access-Control-Allow-Origin: https://yourapp.com
```

浏览器一看 origin 匹配，才把响应交给你的 JS；不匹配，请求虽然成功了，但 JS 拿到的是个报错。

**预检请求**：当请求「不简单」时（用了 `PUT`/`DELETE`、自定义头如 `Authorization`、或 `Content-Type: application/json`），浏览器会**先自动发一个 `OPTIONS` 请求**问服务端「我接下来想发这样一个请求，你允许吗」：

```
# 浏览器自动发的预检
OPTIONS /api/data
Origin: https://yourapp.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: authorization, content-type

# 服务端的许可应答
Access-Control-Allow-Origin: https://yourapp.com
Access-Control-Allow-Methods: PUT, POST, DELETE
Access-Control-Allow-Headers: authorization, content-type
Access-Control-Max-Age: 86400
```

只有预检通过，浏览器才发真正的请求。`Access-Control-Max-Age` 让浏览器缓存这个许可一段时间，避免每个请求都先预检一次（性能上很关键）。

> 这解释了一个常见困惑：「为什么我的接口收到了两个请求？」——一个是 `OPTIONS` 预检，一个是真实请求。也解释了为什么[[security-csrf|加自定义请求头能防 CSRF]]：自定义头会触发预检，而攻击者的跨站请求过不了预检。

## 带凭证（Cookie）的跨源请求

默认情况下，跨源的 `fetch` **不会带 Cookie**。要带，得两边都开：

```js
fetch(url, { credentials: 'include' })   // 前端：明确要求带凭证
```
```
Access-Control-Allow-Origin: https://yourapp.com   # 必须是具体源，不能是 *
Access-Control-Allow-Credentials: true             # 服务端：明确允许带凭证
```

有个硬性约束：**一旦允许带凭证，`Allow-Origin` 就不能是通配符 `*`**，必须回显具体的源。这是浏览器防止「任意网站都能带着用户 Cookie 读你接口」的保险。

## 摆正认知

CORS 报错时，第一反应不该是「我前端怎么绕过它」——你绕不过，它是浏览器的安全机制，不是 bug。正确的做法是：**这是服务端配置问题**，去让接口返回正确的 `Access-Control-Allow-*` 头。本地开发图省事可以用代理（让请求变成同源），但生产环境必须靠服务端正确配置 CORS。

记住那句最关键的：**CORS 限制的是「JS 读取响应」，不是「请求送达服务器」。** 想清楚这一点，一大半的 CORS 困惑就解开了。
