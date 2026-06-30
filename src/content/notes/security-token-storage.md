---
title: "前端令牌该存哪：Cookie、localStorage 与那个被忽略的第三选项"
category: Web 安全
description: localStorage 怕 XSS，Cookie 怕 CSRF——这是个被讲烂但常被讲错的权衡。讲清两者的真实风险，以及更稳的「HttpOnly Cookie + 短时令牌」方案。
updated: 2026-06-30
order: 4
series: Web 安全
seriesOrder: 4
related: [security-xss, security-csrf, security-cookie-storage, routing-auth-guards]
---

「JWT 存 localStorage 还是 Cookie？」是前端面试和技术评审里的高频题，也是最容易给出错误「标准答案」的题。真相是：**两个选项各有一个致命要害，选哪个取决于你更能防住哪种攻击。**

## 两难的本质

| 存储方式 | 谁能读到 | 主要风险 | 是否被自动携带 |
|---|---|---|---|
| **localStorage** | 任何 JS 都能读 | XSS——脚本一注入就能偷走令牌 | 否，需手动放进 `Authorization` 头 |
| **普通 Cookie** | JS 能读，请求自动带 | XSS + CSRF 双重风险 | 是 |
| **HttpOnly Cookie** | **JS 读不到**，请求自动带 | CSRF（可被 SameSite 防住） | 是 |

把这张表读明白，就破除了那个流行的误解：「Cookie 不安全所以用 localStorage」。恰恰相反——

- 放 **localStorage** 的令牌，对 XSS 是**毫无防御**的。任何一个 XSS 漏洞，攻击者一行 `localStorage.getItem('token')` 就把令牌拿走了，且能带回自己服务器长期使用。
- 放 **HttpOnly Cookie** 的令牌，**JS 根本读不到**——就算页面被 XSS，攻击者也偷不走令牌本身（他只能借浏览器在当前页面发请求，关掉页面就结束）。代价是引入 CSRF 风险，而 CSRF 有 `SameSite` 这个成熟的解法。

> 结论先行：**对多数 Web 应用，「HttpOnly + Secure + SameSite 的 Cookie」是比 localStorage 更稳的默认选择。** 它把最难防的 XSS 偷令牌挡在门外，把换来的 CSRF 交给 SameSite 处理。

## 那为什么那么多人用 localStorage？

通常是因为**前后端分离 + 跨域**：API 在另一个域名，Cookie 跨站携带要处理 `SameSite=None`、`Secure`、CORS 凭证，比较麻烦；而 `Authorization: Bearer` 头简单直接、对移动端/第三方也统一。这是个真实的工程便利，但要清醒地知道：**你是用「免疫 CSRF」换了「对 XSS 不设防」。** 而 XSS 比 CSRF 更常见、更难根除。

## 更成熟的方案：短令牌在内存，刷新令牌在 HttpOnly Cookie

单选题之外其实有第三条路，也是现在比较推荐的做法：

1. **Access Token**（短时效，如 15 分钟）放在 **JS 内存里**（一个模块变量）——不进 localStorage、不进 Cookie。页面一刷新就没了，所以即便 XSS 偷到，窗口也极短。
2. **Refresh Token**（长时效）放在 **HttpOnly + Secure + SameSite=Strict 的 Cookie** 里——JS 读不到，XSS 偷不走；只在调用 `/refresh` 接口时被自动携带。
3. 页面加载或 access token 过期时，静默调一次 `/refresh`，用 cookie 里的 refresh token 换一个新的内存 access token。

这套组合把两种攻击的暴露面都压到最小：长期凭证 JS 碰不到，短期凭证活不过一次刷新。

## 不管存哪，先把 XSS 堵死

最后一句最重要：**令牌存储方案，永远只是 XSS 之后的「减害」措施，不是「免疫」。** 一旦页面被 XSS，攻击者哪怕偷不走 HttpOnly Cookie，也能在当前会话里冒充你发任意请求。所以真正的第一要务永远是——按 [[security-xss|XSS 防御]] 把注入点堵死，再用 [[security-csp|CSP]] 兜底。存储方式的选择，是这之后才轮到考虑的事。
