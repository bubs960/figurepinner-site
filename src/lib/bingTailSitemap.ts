import type { MetadataRoute } from 'next'
import { getFigureById, prettyFigureUrl } from '@/data/kbLite'
import { tierOneFids } from '@/data/indexValueCensus'
import { lastContentDate } from '@/data/enrichmentDates'

const BASE = 'https://figurepinner.com'

/**
 * Bing-only tail sitemap (corpus focus spec v3 §4.2, 2026-09-08): every
 * tier-1 figure URL. Served at /sitemap/bing-tail.xml by
 * app/sitemap/bing-tail.xml/route.ts. Deliberately NOT listed in robots.txt
 * and NOT in the sitemap index — submitted only in Bing Webmaster Tools, so
 * Google never learns of it. Same lastmod honesty as sitemap.ts's figure
 * entries (real last content change, never a fabricated `now`).
 * Lives here rather than in app/sitemap.ts because a sibling app/sitemap/
 * directory makes an extensionless '@/app/sitemap' import ambiguous.
 */
export function bingTailSitemap(now: Date = new Date()): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = []
  const seen = new Set<string>()
  for (const fid of tierOneFids()) {
    const f = getFigureById(fid)
    if (!f || f.is_canary) continue
    const url = `${BASE}${prettyFigureUrl(f)}`
    if (seen.has(url)) continue
    seen.add(url)
    out.push({ url, lastModified: lastContentDate(fid) ?? now, changeFrequency: 'weekly' as const, priority: 0.7 })
  }
  return out
}
