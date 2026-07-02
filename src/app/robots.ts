import type { MetadataRoute } from 'next'
import { getAllFandoms } from '@/data/kb'

const BASE = 'https://figurepinner.com'

export default function robots(): MetadataRoute.Robots {
  // D3 hygiene split (2026-07-02) replaced the single /sitemap.xml with one
  // child sitemap per fandom (see src/app/sitemap.ts generateSitemaps). Next.js
  // does not auto-generate an index at /sitemap.xml for a split sitemap, so
  // that bare URL 404s — list every child explicitly instead (found live 7/2,
  // robots.txt was still pointing at the dead index).
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
