---
title: "浏览器存储：Cookie、localStorage、sessionStorage、IndexedDB 怎么选"
category: 浏览器与网络
description: 四种客户端存储的容量、生命周期、是否随请求发送、能否被 JS 读取各不相同。一张表 + 选型直觉，外加 Cookie 那几个最该懂的属性。
updated: 2026-06-30
order: 3
series: 浏览器与网络
seriesOrder: 3
related: [security-cors, security-token-storage, security-csrf]
---

浏览器给了你四种主要的客户端存储，它们不是「新的更好、旧的淘汰」的关系，而是各有各的定位。选错了，轻则体验差，重则埋下[[security-token-storage|安全隐患]]。

## 一张表看清区别

| | Cookie | localStorage | sessionStorage | IndexedDB |
|---|---|---|---|---|
| 容量 | ~4KB | ~5–10MB | ~5–10MB | 大（几百 MB+） |
| 生命周期 | 可设过期 | 永久（手动清） | 关标签页即清 | 永久 |
| 随请求自动发送 | **是** | 否 | 否 | 否 |
| JS 能否读取 | 看 `HttpOnly` | 能 | 能 | 能 |
| 数据结构 | 字符串 | 字符串 | 字符串 | 结构化（对象/二进制） |
| API | 同步 | 同步 | 同步 | 异步 |

读懂这张表，选型就有了依据。

## 选型直觉

- **Cookie**：唯一一个会**自动随请求发往服务端**的存储。所以它天生为「服务端要知道的身份信息」而生——会话 ID、认证令牌。也正因为自动携带，它才有 [[security-csrf|CSRF]] 风险。除了认证，别拿它存别的（每个请求都带着 4KB 数据来回跑，纯属浪费带宽）。
- **localStorage**：存「跨会话保留、且只有前端用」的小数据——主题偏好、草稿、非敏感的缓存。注意它是**同步**的，存大量数据会阻塞主线程。
- **sessionStorage**：和 localStorage 一样，但**关闭标签页就清空**，且不跨标签页共享。适合「只在当前这次浏览中有意义」的状态——多步表单的临时数据、单次流程的 UI 状态。
- **IndexedDB**：真正的客户端数据库，**异步**、容量大、能存结构化数据和二进制（Blob）。离线应用、缓存大量列表、存图片/文件就靠它。API 偏底层，实际项目里常配合 `idb`、`Dexie` 这类封装库用。

## Cookie 的几个关键属性

Cookie 的安全几乎全在它的属性上，每一个都该懂：

```
Set-Cookie: session=abc; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600
```

- **`HttpOnly`**：JS 读不到（`document.cookie` 看不见它）。认证 Cookie 必加——这是抵御 [[security-xss|XSS]] 偷令牌的关键。
- **`Secure`**：只在 HTTPS 下发送，防止明文链路被窃听。
- **`SameSite`**：控制跨站时是否携带，是 [[security-csrf|CSRF]] 的第一道防线（`Lax` / `Strict` / `None`）。
- **`Path` / `Domain`**：限定 Cookie 的作用范围。
- **`Max-Age` / `Expires`**：过期时间；不设则是「会话 Cookie」，关浏览器即失效。

## 一个常被忽略的点：存储是有「源」隔离的

这四种存储都遵循**同源隔离**——`a.com` 存的东西，`b.com` 读不到，连 `sub.a.com` 默认也读不到 localStorage。这既是安全保障，也是个坑：多个子域名想共享登录态时，得靠 Cookie 的 `Domain` 属性（设成父域），而 localStorage 是做不到跨子域共享的。这也是「为什么认证常用 Cookie 而不是 localStorage」的又一个现实原因。
