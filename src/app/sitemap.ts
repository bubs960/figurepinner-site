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
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${base}/pro`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

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
