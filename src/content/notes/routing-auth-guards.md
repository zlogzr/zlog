---
title: 路由鉴权：前端守卫只是体验，后端校验才是安全
category: 路由
description: 「未登录跳登录页」是路由守卫的活，但它只防君子。真正的访问控制，必须在每个数据接口上再做一遍。
updated: 2026-06-29
order: 5
---

「这个页面要登录才能看」「这个操作只有管理员能做」——几乎每个应用都要做访问控制。路由层能帮你把未授权的人挡在页面外，但有一条铁律不能忘：**前端的路由守卫只是体验，不是安全。**

## 前端：路由守卫管“看不看得到”

在路由层判断身份，未授权就重定向。几种实现：

```tsx
// React Router：包一层守卫组件
function RequireAuth({ children }) {
  const user = useUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// React Router 数据路由：在 loader 里拦截（更早，进页面前就判断）
async function loader() {
  const user = await getUser();
  if (!user) throw redirect('/login');   // 数据未取、组件未渲染就跳走
  return user;
}
```

```ts
// Next.js：Middleware 在请求到页面前拦截（见「Route Handlers 与 Middleware」）
if (!token && path.startsWith('/admin')) return NextResponse.redirect('/login');
```

> 在 **loader / middleware** 里鉴权，比在组件里用 `useEffect` 判断后跳转**更好**——后者会先渲染一下受保护页面、再闪一下跳走（内容闪现），前者在渲染之前就拦住了。

## 后端：每个接口都要再校验一遍

这是最关键、最容易被忽略的一点。前端守卫**只防君子**——它能阻止普通用户点进不该进的页面，但**拦不住直接调接口的人**。攻击者完全可以绕过你的 UI，直接 `POST /api/admin/delete-user`。

所以：

> **前端做了多少鉴权，后端就要在每个数据接口上独立地再做一遍。** 前端守卫是体验（别让用户进了页面才发现没权限），后端校验才是安全边界。

```ts
// 每个受保护的接口 / Server Action 内部都要重新鉴权
export async function deleteUser(id) {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') throw new Error('无权限');   // 不信任前端拦过没
  // ...
}
```

这和「Server Actions 要自己校验」「价格必须服务端算」是同一个原则：**任何来自客户端的东西都不可信，包括「他不该能调到这里」这个假设本身。**

## 几个实务点

- **区分「未登录（401）」和「已登录但无权限（403）」**：前者跳登录页，后者显示「无权访问」，别混为一谈。
- **登录后跳回原页**：守卫重定向到登录页时带上 `?from=原路径`，登录成功跳回去。
- **权限粒度**：页面级（能不能进）之外，还有元素级（按钮显不显示）和数据级（只能看自己的数据）——后端尤其要管住数据级。

## 结论

路由守卫负责「未授权的人看不到页面」，提升体验、避免内容闪现，最好放在 loader / middleware 里。但它**不是安全机制**。真正的访问控制在后端：每个接口、每个 Server Action 都要独立校验身份与权限，绝不假设「前端已经拦过了」。
