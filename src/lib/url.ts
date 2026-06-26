const base = import.meta.env.BASE_URL; // 例如 '/zlog/'

/** 给内部链接加上 base 前缀，适配 GitHub Pages 子路径部署。 */
export function withBase(path = '/'): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base; // '/zlog'
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`; // withBase('/') -> '/zlog/'
}

/** 标签页链接。标签含中文，需对路径段做 URL 编码。 */
export function tagUrl(tag: string): string {
  return withBase(`/tags/${encodeURIComponent(tag)}`);
}
