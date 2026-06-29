import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getAllEntries } from '../../lib/collections';
import { SITE, AUTHOR } from '../../lib/site';

// Resolve from project root: import.meta.url would point inside dist/ after the
// endpoint is bundled, where the font asset isn't copied.
const fontData = readFileSync(join(process.cwd(), 'src/assets/og/cjk-subset.woff'));

export async function getStaticPaths() {
  const entries = await getAllEntries();
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const sizeFor = (len: number) => (len <= 14 ? 66 : len <= 24 ? 54 : len <= 36 ? 46 : 38);

export const GET: APIRoute = async ({ props }) => {
  const entry = (props as any).entry;
  const title: string = entry.title;
  const kind = entry.kind === 'post' ? '文章 / 思考' : entry.category ?? '知识库';

  const tree = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '76px 84px',
        background: 'linear-gradient(135deg, #ffffff 0%, #eef1fd 100%)',
        fontFamily: 'CJK',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', fontSize: 30, color: '#3b5bdb' },
            children: `// ${SITE.name}`,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: sizeFor(title.length),
              fontWeight: 700,
              color: '#16181d',
              lineHeight: 1.28,
              letterSpacing: '-0.01em',
            },
            children: title,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 26,
              color: '#5b626d',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 20px',
                    borderRadius: '999px',
                    background: '#3b5bdb',
                    color: '#ffffff',
                    fontSize: 24,
                  },
                  children: kind,
                },
              },
              { type: 'div', props: { style: { display: 'flex' }, children: `~/${AUTHOR.name}` } },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(tree as any, {
    width: 1200,
    height: 630,
    fonts: [{ name: 'CJK', data: fontData, weight: 400, style: 'normal' }],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
