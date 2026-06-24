import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 博客：按时间发布的文章 / 思考
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
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
  }),
});

export const collections = { posts, notes };
