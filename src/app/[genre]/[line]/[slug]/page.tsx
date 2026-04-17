/**
 * Pretty URL alias: /:fandom/:line/:character → /figure/:figure_id
 *
 * Supports two URL shapes:
 *   /wrestling/mattel-elite/rey-mysterio       (manufacturer-line combined)
 *   /wrestling/elite/rey-mysterio              (product_line only)
 *
 * Matching strategy:
 *   1. Match fandom exactly
 *   2. Match product_line: try full slug, then try manufacturer-prefixed form
 *   3. Match character_canonical exactly
 *   4. If multiple matches (same char, different waves) → take the highest wave number
 *
 * Falls back to genre page if no figure found, 404 if genre also invalid.
 */

import { redirect, notFound } from 'next/navigation'
import { getFiguresByFandom, getAllFandoms, type KBFigure } from '@/data/kb'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function normalizeSlug(s: string) {
  return s.toLowerCase().trim()
}

function findFigure(fandom: string, line: string, slug: string): KBFigure | null {
  const candidates = getFiguresByFandom(fandom)
  if (!candidates.length) return null

  const lineNorm = normalizeSlug(line)
  const slugNorm = normalizeSlug(slug)

  function lineMatches(f: KBFigure): boolean {
    const pl = normalizeSlug(f.product_line)
    const mfr = normalizeSlug(f.manufacturer)
    // exact product_line match
    if (pl === lineNorm) return true
    // "mattel-elite" → matches manufacturer="mattel" + product_line="elite"
    if (`${mfr}-${pl}` === lineNorm) return true
    return false
  }

  const matches = candidates.filter(
    f => lineMatches(f) && normalizeSlug(f.character_canonical) === slugNorm
  )

  if (!matches.length) return null
  if (matches.length === 1) return matches[0]

  // Multiple waves — return the highest numeric wave (most recent)
  return matches.sort((a, b) => {
    const wA = parseInt(a.release_wave) || 0
    const wB = parseInt(b.release_wave) || 0
    return wB - wA
  })[0]
}

export default async function PrettyFigurePage(
  { params }: { params: Promise<{ genre: string; line: string; slug: string }> }
) {
  const { genre, line, slug } = await params
  const figure = findFigure(genre, line, slug)

  if (figure) {
    redirect(`/figure/${figure.figure_id}`)
  }

  // No figure match — fall back to genre page if valid, else 404
  const fandoms = getAllFandoms()
  if (fandoms.includes(genre)) {
    redirect(`/${genre}`)
  }

  notFound()
}
