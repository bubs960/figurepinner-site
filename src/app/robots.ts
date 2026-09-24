import type { MetadataRoute } from 'next'
import { getAllFandoms } from '@/data/kbLite'

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
      // SEO-tool crawlers (2026-09-18, Steve's go): they feed third-party
      // backlink/keyword databases, send no visitors, and every uncached page
      // they fetch is a full Worker render (~440 ms CPU avg). Measured
      // 2026-09-17: SemrushBot 2,836 + DotBot 863 + DataForSeoBot 361 renders
      // in 24 h, ~27% of all renders, while Workers CPU ran ~10x the plan's
      // included 30M cpu-ms/month. AhrefsBot and MJ12bot are the same class.
      // All five honor robots.txt. Search engines (Google, Bing, Applebot,
      // Baidu) and AI crawlers are deliberately NOT listed here; SeznamBot and
      // PetalBot have their own rules below.
      {
        userAgent: ['SemrushBot', 'DotBot', 'DataForSeoBot', 'AhrefsBot', 'MJ12bot'],
        disallow: '/',
      },
      // SeznamBot (2026-09-21, Steve's go): the Czech search engine's crawler.
      // Unlike the SEO tools above it IS a search crawler, so this is a business
      // decision, not a hygiene one: this site's audience is US collectors, and
      // the crawl is not free. Measured 2026-09-21 13:00-14:05Z: 306 requests, all
      // uncached hub/character/line renders (/wrestling/character,
      // /star-wars/character, /star-wars/black-series), against ~0 the day before,
      // in the hour Worker CPU/request rose from 250 to 381 ms. No referral data
      // was checked. Seznam documents that SeznamBot honors robots.txt. Re-open if
      // Seznam ever shows up as a referrer in FP-SearchChannelDaily.
      {
        userAgent: 'SeznamBot',
        disallow: '/',
      },
      // PetalBot (2026-09-22, awaiting Steve's go): Huawei's Petal Search crawler.
      // Excluded from the 9/18 SEO-tool block as a search engine; this reverses
      // that on the same business ground as SeznamBot above. Measured 2026-09-15
      // to 09-21 (CF zone analytics, status 200 only): 7,049 renders, ~1,000/day,
      // steady rather than bursty. Referral side: FP-SearchChannelDaily has no
      // Petal bucket, and the whole other-referral bucket was 4 visits in the
      // same 7 days. Re-open if Petal ever shows up as a referrer.
      {
        userAgent: 'PetalBot',
        disallow: '/',
      },
      // ClaudeBot (2026-09-24, Steve's go): Anthropic's model-TRAINING crawler.
      // Measured 2026-09-15 to 09-21 (CF zone analytics): 8,800 rendered pages,
      // the largest AI crawler by volume, 12,805 requests on 9/19 alone, with no
      // referral path at all. Same business ground as SeznamBot/PetalBot above.
      // Deliberately narrow: `Claude-SearchBot` (citations in Claude answers,
      // ~1,083 requests/week) and `Claude-User` (a person asking Claude about a
      // page) are NOT listed and stay allowed. Anthropic documents that all
      // three honor robots.txt and are distinguished by exact UA token.
      {
        userAgent: 'ClaudeBot',
        disallow: '/',
      },
    ],
    sitemap: sitemaps,
    host: BASE,
  }
}
