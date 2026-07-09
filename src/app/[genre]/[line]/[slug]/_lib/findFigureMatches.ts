import { getFiguresByFandom, type KBFigure } from '@/data/kb'
import { getFandom } from '@/lib/genreFigures'

function normalizeSlug(s: string) {
  return s.toLowerCase().trim()
}

/**
 * Shared figure lookup for the SEO-canonical pretty URL (/:fandom/:line/:character),
 * used by both the page and its opengraph-image. `fandom` is the URL [genre] slug,
 * which diverges from the KB fandom for remapped fandoms (gijoe→gi-joe,
 * marvel→marvel-comics, teenage-mutant-ninja-turtles→tmnt) — remap via getFandom.
 */
export function findFigureMatches(fandom: string, line: string, slug: string): KBFigure[] {
  const candidates = getFiguresByFandom(getFandom(fandom))
  if (!candidates.length) return []

  const lineNorm = normalizeSlug(line)
  const slugNorm = normalizeSlug(slug)

  function lineMatches(f: KBFigure): boolean {
    const pl = normalizeSlug(f.product_line)
    const mfr = normalizeSlug(f.manufacturer)
    if (pl === lineNorm) return true
    if (`${mfr}-${pl}` === lineNorm) return true
    return false
  }

  const matches = candidates.filter(
    f => lineMatches(f) && normalizeSlug(f.character_canonical) === slugNorm
  )

  return matches.sort((a, b) => {
    const wA = parseInt(a.release_wave) || 0
    const wB = parseInt(b.release_wave) || 0
    return wB - wA
  })
}
