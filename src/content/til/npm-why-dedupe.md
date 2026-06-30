---
title: "依赖装重了？npm why 帮你揪出是谁拉进来的"
date: 2026-06-13
tags: ["工程化", "Node.js"]
---

bundle 里冒出一个你没直接装的包、或者同一个库装了两个版本，想知道「到底是谁的依赖把它带进来的」：

```bash
npm why lodash      # 列出所有引入 lodash 的依赖路径
pnpm why lodash     # pnpm 同名命令
```

它会把整条依赖链打印出来，一眼看清是哪个间接依赖在引用。配合 `npm dedupe` 可以把能合并的重复版本拍平，减小 `node_modules` 和 bundle 体积。排查「为什么这个包在我树里」时，比手翻 lockfile 快太多。
