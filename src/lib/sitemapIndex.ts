/**
 * sitemapindex XML for /sitemap.xml — the well-known URL 404'd after the D3
 * per-fandom sitemap split (Next generates /sitemap/[id].xml children but no
 * index). Google consumes a sitemapindex natively, so external tools and
 * crawlers hitting the bare URL get the full child list instead of a 404.
 *
 * No <lastmod> on entries: child sitemaps stamp `now` for lack of a real
 * per-entity freshness field (see src/app/sitemap.ts D3 honesty note) —
 * repeating a fabricated date here adds nothing.
 */

const BASE = 'https://figurepinner.com'

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function sitemapIndexXml(ids: string[]): string {
  const entries = ids
    .map(id => `  <sitemap><loc>${escapeXml(`${BASE}/sitemap/${id}.xml`)}</loc></sitemap>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`
}
