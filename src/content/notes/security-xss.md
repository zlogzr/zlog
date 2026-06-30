---
title: "XSS：浏览器为什么会把数据当代码执行"
category: Web 安全
description: XSS 的本质是「数据被当成代码执行」。分清存储型/反射型/DOM 型，记住一条铁律：永远不要把不可信数据拼进 HTML 或 JS。
updated: 2026-06-30
order: 1
series: Web 安全
seriesOrder: 1
related: [security-csp, security-token-storage, security-csrf]
---

XSS（跨站脚本）这个名字起得很糟，让人以为它是个高深的攻击。它的本质其实只有一句话：**你让浏览器把「数据」当成「代码」执行了。**

所有 XSS 都长一个样——某段本该是纯文本的用户输入，最终被浏览器当作 HTML 或 JavaScript 解析了。攻击者控制了那段「数据」，于是也就控制了在你域名下执行的「代码」：偷 Cookie、冒充用户发请求、改页面、装键盘记录器，全都行，因为它跑在**你的源（origin）**里，拥有和你页面一样的权限。

## 三种类型，区别只在「数据从哪来」

| 类型 | 恶意脚本存在哪 | 典型场景 |
|---|---|---|
| **存储型（Stored）** | 存进了你的数据库 | 评论区写 `<script>`，每个看评论的人都中招 |
| **反射型（Reflected）** | 在 URL / 请求参数里，被服务端原样回显 | 搜索页把 `?q=<script>` 直接拼进结果页 |
| **DOM 型（DOM-based）** | 全程在前端，服务端没参与 | 前端读 `location.hash` 直接 `innerHTML` 写进页面 |

存储型危害最大（一次注入、长期生效、波及所有人），DOM 型最隐蔽（抓服务端响应根本看不到，问题全在客户端 JS 里）。但**防御思路完全一样**，不用分类记。

## 一条铁律：不可信数据，永远不要进入「代码上下文」

> 把不可信数据当作**纯文本**对待，不要让它有机会变成结构（HTML 标签、JS 语句、CSS、URL 协议）。

这句话能覆盖 90% 的场景。具体到代码：

```js
// ❌ 把数据拼进 HTML 结构 —— 经典 XSS 入口
el.innerHTML = `<div>${userInput}</div>`;

// ✅ 当作文本写入，浏览器不会解析其中的标签
el.textContent = userInput;
```

在 React/Vue 这类框架里，默认行为已经帮你转义了——`{userInput}` 永远是文本。真正的危险是你**主动绕过**这层保护：

```jsx
// ⚠️ dangerouslySetInnerHTML 这个名字里的 dangerously 是认真的
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

每一处 `innerHTML`、`dangerouslySetInnerHTML`、`v-html`、`document.write`、`eval`、`new Function`、`setTimeout('字符串')`，都是一道你亲手打开的门。审计 XSS，本质就是把这些点全找出来，逐个确认：进去的数据可信吗？

## 必须渲染富文本怎么办

有时候业务就是要让用户提交带格式的内容（富文本编辑器、Markdown）。这时不能转义，只能**净化（sanitize）**——用白名单解析一遍 HTML，只保留安全的标签和属性，剔除 `<script>`、`onerror`、`javascript:` 这些。

```js
import DOMPurify from 'dompurify';
el.innerHTML = DOMPurify.sanitize(userHtml);
```

关键是：**用经过实战检验的库，不要自己写正则过滤。** 自己写的过滤几乎一定会被绕过——HTML 解析的边界情况多到你想不到（大小写、编码、畸形标签、各种事件属性）。

## 别忘了 URL 也是代码上下文

一个容易漏的点：把用户数据拼进 `href` / `src`。

```jsx
// ❌ 用户传 javascript:alert(1) 就执行了
<a href={userUrl}>链接</a>
```

`javascript:` 伪协议会让点击变成代码执行。渲染前要校验协议，只允许 `http`/`https`/`mailto` 等。

## 纵深防御：把 CSP 当最后一道墙

前面都是「不让脚本注入进来」。但人会犯错，总有漏网的注入点。所以还要有一层**就算脚本注进来了也跑不起来**的兜底——这就是 [[security-csp|内容安全策略 CSP]]：通过 HTTP 头声明「这个页面只允许执行来自这些来源的脚本」，内联脚本和外部恶意脚本一律拒绝。

安全从来不是单点防御。转义/净化负责堵入口，CSP 负责在入口失守时止损。两层一起上，才叫纵深防御。
