import { getFiguresByCharacter, type KBFigure } from '@/data/kbDb'
import { getFandom } from '@/lib/genreFigures'

function normalizeSlug(s: string) {
  return s.toLowerCase().trim()
}

/**
 * Shared figure lookup for the SEO-canonical pretty URL (/:fandom/:line/:character),
 * used by both the page and its opengraph-image. `fandom` is the URL [genre] slug,
 * which diverges from the KB fandom for remapped fandoms (gijoe→gi-joe,
 * marvel→marvel-comics, teenage-mutant-ninja-turtles→tmnt) — remap via getFandom.
 *
 * OOM stage 2 (2026-09-02, plan §6 rule 4): the candidate set is now the
 * (character_canonical) index seek for this slug within the fandom — a handful
 * of rows — instead of every figure in the fandom (6,500+ full records for
 * wrestling) filtered in JS. The filter below is unchanged, so the router's
 * semantics are byte-identical: line segment matches EITHER product_line OR the
 * manufacturer-product_line compound, lowercased; character matches exactly
 * after the same normalization. Full-catalog parity is checked by
 * scripts/kb-d1-parity-local.mjs.
 */
export async function findFigureMatches(fandom: string, line: string, slug: string): Promise<KBFigure[]> {
  const lineNorm = normalizeSlug(line)
  const slugNorm = normalizeSlug(slug)

  const candidates = await getFiguresByCharacter(getFandom(fandom), slugNorm)
  if (!candidates.length) return []

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
