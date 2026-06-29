// Single source of truth for the deploy base path, shared by build-time
// consumers that can't read import.meta.env.BASE_URL (astro.config, remark
// plugins, validation scripts). Runtime code should keep using withBase()
// from url.ts, which derives from this via Astro's config.
//
// Bind to your own domain? Set this to '' (and update astro.config `site`).
export const BASE = '/zlog';
