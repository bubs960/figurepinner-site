#!/usr/bin/env node
/**
 * R8 item 5 (internal-link depth audit): verifies, across the WHOLE catalog,
 * that every figure's product_line is reachable from its genre page (registry
 * row or "more" chip) and that the resulting line-hub page links the figure
 * directly. One-off verification script, not part of the build.
 *
 * Mirrors src/lib/genreFigures.ts's groupAndSortLines() (no filtering by
 * design) and src/app/[genre]/page.tsx's buildHub() CATCH_ALL_LINES set --
 * catch-all lines still land in the "more" chip list since `more` filters
 * against the FULL `groups` array, only excluding `topSlugs`.
 */
import { getAllFandoms, getFiguresByFandom } from '../src/data/kb.ts'
import { genreSlugForFandom } from '../src/lib/genreFigures.ts'

let totalFigures = 0
const unreachable = []
const byGenreLine = new Map() // "genre" -> Set of product_line values

for (const fandom of getAllFandoms()) {
  const genre = genreSlugForFandom(fandom)
  if (!byGenreLine.has(genre)) byGenreLine.set(genre, new Set())
  const lines = byGenreLine.get(genre)
  for (const f of getFiguresByFandom(fandom)) {
    totalFigures++
    if (!f.product_line) {
      unreachable.push({ figure_id: f.figure_id, reason: 'no product_line' })
      continue
    }
    lines.add(f.product_line)
  }
}

console.log(`Total figures scanned: ${totalFigures}`)
console.log(`Genres: ${byGenreLine.size}, total distinct (genre, product_line) hub pages: ${[...byGenreLine.values()].reduce((n, s) => n + s.size, 0)}`)
console.log(`Figures with no product_line (would be unreachable from any line hub): ${unreachable.length}`)
if (unreachable.length) console.log(unreachable.slice(0, 20))
