---
title: git rebase 的心智模型
category: Git
description: rebase 到底改了什么，以及什么时候别用它。
updated: 2026-06-24
order: 1
---

`rebase` 做的事只有一件：**把一串提交，搬到另一个基底上重新播放一遍**。

## 常用

```bash
# 把当前分支变基到最新的 main
git switch feature
git rebase main
```

## 黄金法则

> 不要对已经推送、别人可能基于它工作的分支做 rebase。

因为 rebase 会重写提交历史（生成新的 commit hash），共享分支上这么做会让协作者的历史对不上。

## 对比 merge

| | merge | rebase |
|---|---|---|
| 历史 | 保留分叉，多一个合并提交 | 线性、干净 |
| 安全性 | 高 | 重写历史，需谨慎 |
| 适用 | 公共分支 | 自己的本地分支整理 |
