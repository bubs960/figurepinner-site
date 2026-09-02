/**
 * Line hub page — /[genre]/[line]   (page 1 of the hub)
 * e.g. /wrestling/wwe-elite  or  /wrestling/elite
 *
 * SEO purpose: ranks for "[Line Name] price guide" queries.
 * Shows the line's figures grouped by series/wave, links to /figure/[id].
 * No external pricing fetched — KB data only. Fast, cacheable, crawlable.
 *
 * Pagination (2026-09-02): this URL is page 1; pages 2+ live at
 * /[genre]/[line]/page/[n] (96 cards per page, waves may straddle). Both
 * routes render through _lib/lineHub.tsx — the whole hub implementation moved
 * there because Next restricts what a page file may export. Sitemap lists
 * this URL only; pages 2+ are reached by rel=next and the in-page nav.
 *
 * Sits alongside [genre]/[line]/[slug]/page.tsx (3-level pretty URL alias).
 * Next.js resolves them cleanly: 2-segment → this page, 3-segment → alias.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadLineHubFigures, lineHubMetadata, LineHubView } from './_lib/lineHub'

// ISR — KB-only line hub, no user-specific data. "Fast, cacheable, crawlable"
// (header above) requires this. Was force-dynamic; restored per Genta audit 2026-06-06 P1.
// force-static added 2026-07-27 (hub-ISR root cause): on a dynamic segment,
// `revalidate` alone never registers the route in the prerender-manifest, so
// OpenNext served every line hub as uncached SSR (`no-store`) since 6/14.
// See [genre]/page.tsx for the full mechanism note; same fix, same pair.
export const dynamic = 'force-static'
// 24h, not 1h (2026-09-02, webaudit hub deep-dive breakthrough 2): hub content only
// changes at KB pours, and the deploy chain already purges both cache layers
// (kv-purge-stale-isr.mjs + purge-cache.mjs). Matches the figure + character routes.
export const revalidate = 86400

type PageProps = { params: Promise<{ genre: string; line: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre, line } = await params
  // Genre-alias 308 (2026-07-12 root-cause FIX-2) and the legacy/typo line
  // alias 308 both fire inside loadLineHubFigures — HERE, in generateMetadata,
  // because it runs before the response streams, so this emits a real 308.
  // The page body repeats the call as the fallback.
  const figures = await loadLineHubFigures(genre, line)
  return lineHubMetadata(genre, line, figures, 1)
}

export default async function LineHubPage({ params }: PageProps) {
  const { genre, line } = await params
  const figures = await loadLineHubFigures(genre, line, '', { guardGenre: true })
  if (!figures.length) notFound()
  return <LineHubView genre={genre} line={line} figures={figures} page={1} />
}
