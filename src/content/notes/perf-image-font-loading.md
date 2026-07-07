---
title: 图片与字体：页面重量的大头怎么减
category: 性能
description: 图片选格式、给尺寸、分优先级；字体子集化、fallback 调优。LCP 和 CLS 的分数大半在这。
updated: 2026-07-07
order: 3
series: Web 性能
seriesOrder: 3
related: [core-web-vitals, http-caching]
---

一个典型页面的传输量里，图片通常占一半以上，字体紧随其后。LCP 元素十有八九是图，CLS 的经典来源是字体切换和无尺寸图片——把这两类资源治好，[[core-web-vitals]]三个指标就好了一大半。

## 图片：四件事按顺序做

**1. 选对格式。**AVIF > WebP > JPEG，同等画质体积依次大 30%~50%。用 `<picture>` 做渐进增强，老浏览器自动兜底：

```html
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="…" width="1200" height="600" />
</picture>
```

**2. 按屏幕发尺寸。**给手机发 2400px 宽的原图是纯浪费。`srcset + sizes` 让浏览器按视口和 DPR 自己挑：

```html
<img srcset="p-480.webp 480w, p-960.webp 960w, p-1920.webp 1920w"
     sizes="(max-width: 600px) 100vw, 50vw" src="p-960.webp" alt="…" />
```

**3. 分清优先级。**首屏之外全部 `loading="lazy"`；但 LCP 大图**绝对不能 lazy**（lazy 会把它推迟到布局后才请求），反而要提权：

```html
<img src="hero.avif" fetchpriority="high" alt="…" />
<!-- 或者更早：在 <head> 里 preload -->
<link rel="preload" as="image" href="hero.avif" fetchpriority="high" />
```

**4. 永远写 width/height。**浏览器据此预留纵横比占位，图片加载完不推挤下面的内容——这是最便宜的 CLS 修复，没有之一。

## 字体：闪一下没关系，跳一下才要命

自定义字体的两个经典问题：**FOIT**（字体没来之前文字隐身）和**布局偏移**（fallback 字体和目标字体宽度不同，切换瞬间整页文字重排）。

- **`font-display: swap`**：先用系统字体立刻显示，字体到了再换。文字永远可见，代价是有一次切换。
- **子集化**：中文字体全量 8~15MB，是不可能直接上线的。按站点实际用到的字形裁剪（`subset-font`、`glyphhanger`），几千个常用字通常能压到几百 KB；配合 `unicode-range` 还能按需分片加载。
- **preload 关键字体**：正文字体在 `<head>` 里 `<link rel="preload" as="font" type="font/woff2" crossorigin>`，别等 CSS 解析完才发现要请求它。
- **调 fallback 减少跳动**：用 `size-adjust` / `ascent-override` 把 fallback 字体的度量调到接近目标字体，切换时几乎无位移：

```css
@font-face {
  font-family: 'Inter-fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
}
```

## 别忘了缓存

图片和字体是最该"一年不过期"的资源：文件名带 hash，`Cache-Control: max-age=31536000, immutable`。字体基本不换版本，回头客一次都不用重新下——策略细节见[[http-caching]]。
