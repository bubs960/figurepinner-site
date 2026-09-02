/**
 * Character hub page — /[genre]/character/[character_slug]   (page 1)
 * e.g. /wrestling/character/john-cena
 *      /marvel/character/spider-man
 *      /dc/character/batman
 *
 * SEO purpose: ranks for "[Character] action figure" queries — shows every
 * release of that character across all lines, grouped by product line then wave.
 * No external pricing fetched — KB data only. Fast, cacheable, crawlable.
 *
 * Pagination (Release F, 2026-09-02): this URL is page 1; pages 2+ live at
 * /[genre]/character/[character_slug]/page/[n] (96 cards/page). Both routes
 * render through ../_lib/characterHub.tsx. Sitemap lists this URL only.
 *
 * ISR: generateStaticParams returns [] — on-demand ISR, no build-time prerender.
 * Same pattern as /figure/[figure_id] (S32 fix, 2026-06-18).
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadCharacterHubFigures, characterHubMetadata, CharacterHubView } from '../_lib/characterHub'

export const revalidate = 86400

// On-demand ISR — no pre-builds at build time (returns []), but registers
// the route in PrerenderManifest.dynamicRoutes so OpenNext emits s-maxage.
export function generateStaticParams() {
  return []
}

type PageProps = { params: Promise<{ genre: string; character_slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre, character_slug } = await params
  // Genre-alias 308 (2026-07-12 root-cause FIX-2) fires inside the loader — in
  // generateMetadata for a real pre-streaming 308; page body carries the fallback.
  const figures = await loadCharacterHubFigures(genre, character_slug)
  return characterHubMetadata(genre, character_slug, figures, 1)
}

export default async function CharacterHubPage({ params }: PageProps) {
  const { genre, character_slug } = await params
  const figures = await loadCharacterHubFigures(genre, character_slug, '', { guardGenre: true })
  if (!figures.length) notFound()
  return <CharacterHubView genre={genre} characterSlug={character_slug} figures={figures} page={1} />
}
