import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { withBase } from '../lib/url';
import { SITE } from '../lib/site';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  // 频道 link 指向博客首页（带 /zlog 子路径），item 用带子路径的绝对路径
  const site = new URL(import.meta.env.BASE_URL, context.site).href;

  return rss({
    title: SITE.name,
    description: SITE.description,
    site,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.description ?? '',
      categories: p.data.tags,
      link: withBase(`/posts/${p.id}/`),
    })),
    customData: `<language>zh-cn</language>`,
  });
}
