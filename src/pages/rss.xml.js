import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import sanitizeHtml from 'sanitize-html';
import { SITE } from '../lib/site';

// 全文 RSS：用 Astro 容器 API 把每篇文章渲染成与页面一致的 HTML（保真 callouts、
// [[双向链接]]、Shiki 高亮），再用 sanitize-html 清洗并把相对链接绝对化，写入
// <content:encoded>。阅读器即可直接读全文，而不只是摘要。
export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  // 频道与每篇 item 的基准 URL：context.site 是 astro.config 的 site，BASE_URL 是
  // '/zlog'（无尾斜杠）。务必补上尾斜杠——否则 new URL('posts/x/', base) 会把末段
  // 'zlog' 当文件名替换掉，导致 item 链接丢失 /zlog 子路径而 404。
  const siteBase = new URL(import.meta.env.BASE_URL.replace(/\/?$/, '/'), context.site);
  // 纯 .md（glob loader、无 MDX）时 Content 已是编译好的 HTML，无需注册渲染器。
  const container = await AstroContainer.create();

  // 把站内相对 / 根相对链接解析为绝对 URL；锚点与已绝对的（http/mailto/data）原样保留。
  const absolutize = (value, base) => {
    if (!value || /^(https?:|mailto:|data:|#)/i.test(value)) return value;
    try {
      return new URL(value, base).href;
    } catch {
      return value;
    }
  };

  const items = await Promise.all(
    posts.map(async (post) => {
      const itemUrl = new URL(`posts/${post.id}/`, siteBase);
      const { Content } = await render(post);
      const rawHtml = await container.renderToString(Content);

      const content = sanitizeHtml(rawHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          'img', 'figure', 'figcaption', 'picture', 'source',
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          // 保留 class / style：Shiki（astro-code、--shiki-* 变量）、callout、
          // wikilink 都靠 class/style 着色与定位。
          '*': ['class', 'style', 'id'],
          a: ['href', 'name', 'target', 'rel'],
          img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
          source: ['src', 'srcset', 'media', 'type', 'width', 'height'],
        },
        transformTags: {
          a: (tagName, attribs) => {
            if (attribs.href) attribs.href = absolutize(attribs.href, itemUrl);
            return { tagName, attribs };
          },
          img: (tagName, attribs) => {
            if (attribs.src) attribs.src = absolutize(attribs.src, itemUrl);
            return { tagName, attribs };
          },
        },
      });

      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description ?? '',
        categories: post.data.tags,
        link: itemUrl.pathname, // '/zlog/posts/<id>/'，由 rss 对 site 解析为绝对 URL
        content,
      };
    }),
  );

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: siteBase.href,
    items,
    // <content:encoded> 属于 content 命名空间，显式声明一次。
    xmlns: { content: 'http://purl.org/rss/1.0/modules/content/' },
    customData: `<language>zh-cn</language>`,
  });
}
