---
title: "git restore 比 reset/checkout 更不容易误伤"
date: 2026-06-25
tags: ["Git"]
---

`git checkout` 和 `git reset` 各自身兼数职，参数稍微记错就可能丢掉改动。Git 2.23 起拆出了语义明确的 `git restore`，意图一眼可读：

```bash
# 把暂存区的某文件撤回到未暂存（不动工作区内容）
git restore --staged file.ts

# 丢弃工作区里对某文件的修改（危险，不可逆）
git restore file.ts

# 两个都来：彻底回到 HEAD 的样子
git restore --staged --worktree file.ts
```

配套的还有 `git switch` 专管切换/创建分支。从此「切分支」用 `switch`、「还原文件」用 `restore`，再不用靠 `checkout` 一个命令猜上下文。
