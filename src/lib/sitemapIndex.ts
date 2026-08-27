/**
 * sitemapindex XML for /sitemap.xml — the well-known URL 404'd after the D3
 * per-fandom sitemap split (Next generates /sitemap/[id].xml children but no
 * index). Google consumes a sitemapindex natively, so external tools and
 * crawlers hitting the bare URL get the full child list instead of a 404.
 *
 * <lastmod> on entries (2026-08-27, webaudit build-verdict item A): each
 * fandom child carries the newest real content-change date among that
 * fandom's figures — max of comp-change and enrichment-pour dates, the SAME
 * lastContentDate predicate the child sitemaps stamp their own entries with
 * (@/data/enrichmentDates), so the index's first discovery hop signals the
 * same freshness the children do. This file's previous "no real per-entity
 * freshness field exists" justification became false when enrichment pour
 * dates landed (5b91482). Entries with no dated member (the static child, a
 * fandom with zero census/enrichment dates) omit <lastmod> entirely — the
 * same never-fabricate-`now` rule as sitemap.ts.
 */

const BASE = 'https://figurepinner.com'

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export interface SitemapIndexEntry {
  id: string
  /** Newest real content-change date in this child, or null/undefined to omit. */
  lastmod?: Date | null
}

export function sitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const lines = entries
    .map(({ id, lastmod }) => {
      const loc = `<loc>${escapeXml(`${BASE}/sitemap/${id}.xml`)}</loc>`
      const mod = lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''
      return `  <sitemap>${loc}${mod}</sitemap>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines}\n</sitemapindex>\n`
}
