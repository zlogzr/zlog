import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 博客：按时间发布的文章 / 思考
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // 可选的最后更新日期；填写后文章页与结构化数据会展示「更新于」。
    updated: z.coerce.date().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // 系列 / 学习路径：同名 series 的条目（可跨博客与知识库）按 seriesOrder 串成有序路径
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    // 相关条目：指向其它条目的 id（注意 notes 的 id 即文件名，posts 同理），用于双向链接
    related: z.array(z.string()).default([]),
  }),
});

// 知识库：按主题分类的知识点
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    description: z.string().optional(),
    updated: z.coerce.date().optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    // 系列 / 学习路径：同名 series 的条目（可跨博客与知识库）按 seriesOrder 串成有序路径
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    // 相关条目：指向其它条目的 id，用于双向链接（反向链接由构建时自动反推）
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { posts, notes };
