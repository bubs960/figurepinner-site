/**
 * Line hub, pages 2+ — /[genre]/[line]/page/[n]
 *
 * Page 1 is the bare hub URL (/[genre]/[line]); this route serves the rest.
 * /page/1 308s to the hub (one URL per page, never two), a non-integer or
 * past-the-end N is a real 404. Same ISR pair as the hub (force-static +
 * revalidate) — see [genre]/[line]/page.tsx for why both lines are required
 * on a dynamic segment (isr-declaration-audit.mjs enforces it).
 *
 * Why this exists: hub pagination, the durable fix for the 6 MB hubs and the
 * 2026-09-02 marvel-legends Error 1102 — see _lib/lineHubPaging.ts.
 */

import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { loadLineHubFigures, lineHubMetadata, LineHubView } from '../../_lib/lineHub'
import { parsePageSegment, totalPagesFor } from '../../_lib/lineHubPaging'

export const dynamic = 'force-static'
export const revalidate = 86400

type PageProps = { params: Promise<{ genre: string; line: string; n: string }> }

/** Shared param gate: 308 page 1 to the hub, null for anything that is not a page. */
function pageNumberOrRedirect(genre: string, line: string, n: string): number | null {
  const page = parsePageSegment(n)
  if (page === 1) permanentRedirect(`/${genre}/${line}`)
  return page
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre, line, n } = await params
  const page = pageNumberOrRedirect(genre, line, n)
  if (page === null) return { title: 'Not Found', robots: { index: false, follow: false } }
  // Genre-alias / line-alias 308s fire here (pre-streaming) with the page
  // suffix carried through; the body repeats them as the fallback.
  const figures = await loadLineHubFigures(genre, line, `/page/${page}`)
  if (!figures.length || page > totalPagesFor(figures.length)) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }
  return lineHubMetadata(genre, line, figures, page)
}

export default async function LineHubPagedPage({ params }: PageProps) {
  const { genre, line, n } = await params
  const page = pageNumberOrRedirect(genre, line, n)
  if (page === null) notFound()
  const figures = await loadLineHubFigures(genre, line, `/page/${page}`, { guardGenre: true })
  if (!figures.length) notFound()
  if (page > totalPagesFor(figures.length)) notFound()
  return <LineHubView genre={genre} line={line} figures={figures} page={page} />
}
