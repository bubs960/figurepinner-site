import type { MetadataRoute } from 'next'
import { getAllFandoms } from '@/data/kb'

const BASE = 'https://figurepinner.com'

// Same safety net as sitemap.ts — static until next deploy either way at
// current cadence, this just bounds staleness explicitly.
export const revalidate = 86400

export default function robots(): MetadataRoute.Robots {
  // D3 hygiene split (2026-07-02) replaced the single /sitemap.xml with one
  // child sitemap per fandom (see src/app/sitemap.ts generateSitemaps). Next.js
  // does not auto-generate an index at /sitemap.xml for a split sitemap, so
  // that bare URL 404'd until 7/3, when src/app/sitemap.xml/route.ts started
  // serving a sitemapindex there. Keep listing every child here anyway —
  // explicit robots entries and the index are both valid and cost nothing.
  const sitemaps = [
    `${BASE}/sitemap/static.xml`,
    ...getAllFandoms().map(fandom => `${BASE}/sitemap/${fandom}.xml`),
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block authenticated app routes from crawling
        disallow: ['/app/', '/sign-in/', '/sign-up/', '/api/'],
      },
    ],
    sitemap: sitemaps,
    host: BASE,
  }
}
