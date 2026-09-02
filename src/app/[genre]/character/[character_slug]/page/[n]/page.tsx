/**
 * Character hub, pages 2+ — /[genre]/character/[character_slug]/page/[n]
 *
 * Page 1 is the bare hub URL; this route serves the rest. /page/1 308s to the
 * hub, a non-integer or past-the-end N is a real 404. Same ISR pair as the hub
 * (revalidate + generateStaticParams([]) registers the dynamic route so OpenNext
 * emits s-maxage — isr-declaration-audit.mjs enforces it).
 *
 * Release F (2026-09-02): the character-hub half of the hub pagination — see
 * ../../../_lib/characterHub.tsx and [genre]/[line]/_lib/lineHubPaging.ts.
 */

import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { loadCharacterHubFigures, characterHubMetadata, CharacterHubView } from '../../../_lib/characterHub'
import { parsePageSegment, totalPagesFor } from '@/app/[genre]/[line]/_lib/lineHubPaging'

export const revalidate = 86400

export function generateStaticParams() {
  return []
}

type PageProps = { params: Promise<{ genre: string; character_slug: string; n: string }> }

/** Shared param gate: 308 page 1 to the hub, null for anything that is not a page. */
function pageNumberOrRedirect(genre: string, slug: string, n: string): number | null {
  const page = parsePageSegment(n)
  if (page === 1) permanentRedirect(`/${genre}/character/${slug}`)
  return page
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre, character_slug, n } = await params
  const page = pageNumberOrRedirect(genre, character_slug, n)
  if (page === null) return { title: 'Not Found', robots: { index: false, follow: false } }
  const figures = await loadCharacterHubFigures(genre, character_slug, `/page/${page}`)
  if (!figures.length || page > totalPagesFor(figures.length)) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }
  return characterHubMetadata(genre, character_slug, figures, page)
}

export default async function CharacterHubPagedPage({ params }: PageProps) {
  const { genre, character_slug, n } = await params
  const page = pageNumberOrRedirect(genre, character_slug, n)
  if (page === null) notFound()
  const figures = await loadCharacterHubFigures(genre, character_slug, `/page/${page}`, { guardGenre: true })
  if (!figures.length) notFound()
  if (page > totalPagesFor(figures.length)) notFound()
  return <CharacterHubView genre={genre} characterSlug={character_slug} figures={figures} page={page} />
}
