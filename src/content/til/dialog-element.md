---
title: "原生 <dialog> 省掉一整套模态框逻辑"
date: 2026-06-09
tags: ["HTML", "可访问性"]
---

自己写模态框，要处理焦点陷阱、Esc 关闭、背景遮罩、滚动锁定、`aria` 属性……原生 `<dialog>` 把这些大部分都内建了：

```html
<dialog id="dlg">
  <form method="dialog"><button>关闭</button></form>
</dialog>
<script>
  dlg.showModal();   // 打开模态：自动加遮罩、陷住焦点、Esc 可关
</script>
```

`showModal()` 会自动管理焦点和 `::backdrop` 遮罩，Esc 默认关闭，`method="dialog"` 的表单提交即关闭。背景遮罩样式用 `dialog::backdrop` 选择器写。对绝大多数确认弹窗、抽屉，它已经够用，且无障碍行为开箱即对——比手搓一套靠谱得多。
