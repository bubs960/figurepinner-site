import type { MetadataRoute } from 'next'
import { getAllFigures, getAllFandoms } from '@/data/kb'

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
    { path: '/pro',      changeFrequency: 'monthly', priority: 0.8 },
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

  // ── Figure detail pages ──────────────────────────────────────────────────
  const figures = getAllFigures()
  const figurePages: MetadataRoute.Sitemap = figures.map(f => ({
    url: `${base}/figure/${f.figure_id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...genrePages, ...figurePages]
}
