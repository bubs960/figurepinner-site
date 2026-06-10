import type { MetadataRoute } from 'next'
import { getAllFigures, getAllFandoms, getFiguresByFandom, prettyFigureUrl } from '@/data/kb'

/**
 * Sitemap — generated at build time from the KB.
 * Covers: static pages, genre landing pages, individual figure pages.
 * Next.js splits this automatically if >50K URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://figurepinner.com'
  const now = new Date()

  // ── Static pages ────────────────────────────────────────────────────────
  // To add a new page: append an entry to this array.
  // changeFrequency: 'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never'
  // priority: 0.0 – 1.0 (1.0 = most important)
  const STATIC_PAGES: Array<{
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }> = [
    { path: '',          changeFrequency: 'weekly',  priority: 1.0 },
    { path: '/search',   changeFrequency: 'weekly',  priority: 0.9 },
    { path: '/news',     changeFrequency: 'daily',   priority: 0.85 },
    // /pro removed from sitemap 2026-06-06 (Steve): Pro tier disabled until
    // GrailPulse has ≥3 verticals; /pro now redirects to home. Re-add when restored.
    { path: '/about',    changeFrequency: 'monthly', priority: 0.6 },
    { path: '/privacy',  changeFrequency: 'yearly',  priority: 0.2 },
    { path: '/terms',    changeFrequency: 'yearly',  priority: 0.2 },
  ]

  const staticPages: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  // ── Genre landing pages ──────────────────────────────────────────────────
  const fandoms = getAllFandoms()
  const genrePages: MetadataRoute.Sitemap = fandoms.map(fandom => ({
    url: `${base}/${fandom}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // ── Line hub pages (/[genre]/[line]) ────────────────────────────────────
  // One page per unique product_line within each fandom.
  const linePages: MetadataRoute.Sitemap = fandoms.flatMap(fandom => {
    const figs = getFiguresByFandom(fandom)
    const lines = [...new Set(figs.map(f => f.product_line))]
    return lines.map(line => ({
      url: `${base}/${fandom}/${line}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  })

  // ── Figure detail pages ──────────────────────────────────────────────────
  // Use keyword-rich pretty URLs only when they map to one exact figure.
  // Ambiguous character/line paths stay on /figure/[id] so one wave cannot
  // canonicalize or sitemap as another wave.
  const figures = getAllFigures()
  const seenUrls = new Set<string>()
  const figurePages: MetadataRoute.Sitemap = []
  for (const f of figures) {
    const url = `${base}${prettyFigureUrl(f)}`
    if (!seenUrls.has(url)) {
      seenUrls.add(url)
      figurePages.push({
        url,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })
    }
  }

  return [...staticPages, ...genrePages, ...linePages, ...figurePages]
}
