import { bingTailSitemap } from '@/lib/bingTailSitemap'

// Bing-only tail sitemap (corpus focus spec v3 §4.2, 2026-09-08).
// Lists tier-1 figure URLs (generic index,follow + googlebot noindex,follow).
// NOT referenced from robots.txt or the sitemap index on purpose — it is
// submitted only in Bing Webmaster Tools, so Google never learns of it.
// Lives beside the metadata-route children (/sitemap/<fandom>.xml) as a
// concrete static segment; sitemap.ts's dynamicParams=false 404s unknown
// ids, so this file is the only thing that can answer this URL.
export const dynamic = 'force-static'
export const revalidate = 86400

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET(): Promise<Response> {
  const entries = bingTailSitemap()
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries
      .map((e) => {
        const lm = e.lastModified instanceof Date ? e.lastModified.toISOString().slice(0, 10) : e.lastModified
        return `<url><loc>${esc(e.url)}</loc>${lm ? `<lastmod>${lm}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.7</priority></url>`
      })
      .join('\n') +
    '\n</urlset>\n'
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      // Belt and suspenders: even if something links it, no engine indexes the file itself.
      'X-Robots-Tag': 'noindex',
    },
  })
}
