/**
 * genreFigures.ts — the single home for URL-genre → KB-fandom resolution
 * (SLUG_TO_FANDOM + inverse + NECA rollup, consolidated S53) and the genre
 * page's figure grouping/serialization helpers (extracted from
 * src/app/[genre]/page.tsx in the S20 payload cut).
 *
 * The line `slug` in groupAndSortLines is always the raw KB product_line
 * value, NOT the pretty URL slug forms the line-hub route also accepts.
 */
import { getFiguresByFandom, type KBFigure } from '@/data/kb'

// URL slug ↔ KB fandom mapping now lives in @/data/kbTypes (leaf module) so
// kb.ts's prettyFigureUrl can use it without a circular import (2026-07-12
// Google-zero root-cause fix). Re-exported here unchanged for the existing
// consumers of this module.
export { SLUG_TO_FANDOM, getFandom, genreSlugForFandom } from '@/data/kbTypes'
// genreSlugForFandom is re-exported above, but that form creates no local
// binding — hubGenreForFandom() below needs it in module scope too.
import { getFandom, genreSlugForFandom } from '@/data/kbTypes'

// The 'neca' (Horror & Film) UI genre rolls up several KB fandoms — same
// rollup kb-stats uses for the homepage count.
//
// 2026-07-27: added 'scifi' (170 figures) and 'pop-culture' (57). Both are
// **100% NECA-manufactured** per webaudit's D1 triage
// (WEBAUDIT-TO-WEB-ORPHANED-NAMESPACES-TRIAGE-2026-07-26.md), and both were
// orphaned — no genre hub of their own (`/scifi` and `/pop-culture` 404'd)
// while sitting next to the NECA rollup that should have covered them. The
// original 4 entries answered "which fandoms does the /neca hub already show",
// where the correct question was "which fandoms does NECA manufacture"; that
// gap is what left them out.
//
// Two consequences, both intended: the /neca hub grows by ~227 figures
// (748 → ~975) and gains line entries it didn't carry (neca-godzilla,
// neca-video-games, legacy); and searchGenreForFandom() below now maps them to
// 'neca', which is what stops a "godzilla" search rendering no genre pill row
// at all (measured pre-fix: q=godzilla → 49 results tagged raw 'scifi').
//
// 'generic-fantasy' (141) is deliberately NOT here — only 37 of its 141 are
// NECA (the rest LJN 67 / Hasbro 21 / Super7 16, ~62% D&D-adjacent), so it is
// a real dedicated-hub question, not a rollup. It stays on the annotated
// exclusion list in tests/searchGenreCoverage.test.mjs until that call is made.
export const NECA_FANDOMS = [
  'horror', 'aliens-predator', 'terminator', 'robocop', 'scifi', 'pop-culture',
]

/**
 * Genre slugs with a hub-page ENTRY. Mirrors the keys of GENRE_META in
 * src/app/[genre]/page.tsx, which is the source of truth.
 *
 * NECESSARY but not SUFFICIENT for a 200: that page has a second guard,
 * `if (!figures.length) notFound()`. Membership here only means "a hub is
 * configured," not "it serves." Callers are safe because hubGenreForFandom()
 * is only ever fed real KB fandoms, which have figures by construction.
 * (Live example of the gap: 'dungeons-dragons' is a GENRE_META key with ZERO
 * KB figures, so it 404s either way — and its slug pair is inconsistent, with
 * /dungeons-dragons redirecting to /dungeons-and-dragons, which has no
 * GENRE_META entry at all. Dead config; never reaches the sitemap because no
 * fandom maps to it.)
 *
 * Kept separate from GENRE_META because Next.js restricts which exports a page
 * file may declare, so it cannot be imported from here. The drift test in
 * tests/genre-hub-slugs.test.mjs parses the page and fails the build if the
 * two ever diverge.
 *
 * Added 2026-07-26: the sitemap was emitting a genre URL for EVERY KB fandom,
 * so 7 of its 22 genre entries (32%) were 404s — the 3 fandoms with no hub at
 * all, plus the 4 NECA-family fandoms, because the NECA rollup was only ever
 * built in the genre->fandom direction (fandomsForGenre below) and never its
 * inverse. Google was being handed all 7.
 */
export const GENRE_HUB_SLUGS: ReadonlySet<string> = new Set([
  'wrestling', 'marvel', 'star-wars', 'dc', 'transformers', 'gijoe',
  'masters-of-the-universe', 'teenage-mutant-ninja-turtles', 'power-rangers',
  'indiana-jones', 'ghostbusters', 'mythic-legions', 'thundercats',
  'action-force', 'dungeons-dragons', 'neca', 'spawn',
])

/**
 * Inverse of fandomsForGenre: the genre slug whose hub should REPRESENT this
 * fandom. Returns null when the fandom has no hub anywhere.
 *
 * Distinct from genreSlugForFandom(), which answers "what URL segment does
 * this fandom use" for figure/line/character paths and identity-falls-back for
 * unknown fandoms. That fallback is correct there and load-bearing for tens of
 * thousands of working canonicals — do NOT change it. This function is the
 * narrower "does a hub exist to link to" question.
 */
export function hubGenreForFandom(fandom: string): string | null {
  if (NECA_FANDOMS.includes(fandom)) return 'neca'
  const slug = genreSlugForFandom(fandom)
  return GENRE_HUB_SLUGS.has(slug) ? slug : null
}

const NECA_FANDOM_SET: ReadonlySet<string> = new Set(NECA_FANDOMS)

/**
 * The genre key the SEARCH surfaces use for a fandom — raw KB fandom for
 * everything except the NECA family, which rolls up to 'neca'.
 *
 * ⚠️ This is deliberately NOT hubGenreForFandom(). The search client's own
 * genre list (`GENRES` in src/app/search/_components/SearchInterface.tsx) is
 * keyed by RAW KB fandoms for 14 of its 16 entries — 'marvel-comics', 'gi-joe',
 * 'tmnt', not the hub slugs 'marvel', 'gijoe',
 * 'teenage-mutant-ninja-turtles' — plus 'neca', which is a UI-only rollup no KB
 * fandom is ever equal to. Routing search through hubGenreForFandom() would
 * "fix" NECA and simultaneously break the three pills that work today.
 *
 * Added 2026-07-27. /api/v1/search assigned `genre: f.fandom` raw and never
 * called any rollup, so the four NECA fandoms could never match a pill:
 * searching "predator" returned 298 results all tagged 'aliens-predator',
 * the NECA pill never appeared in availableGenres, the row badge printed the
 * raw fandom with a fallback accent, and the hero facet pill handed
 * `?genre=aliens-predator` to /search, where SearchInterface validates against
 * GENRES and silently dropped the prefilter — the reported "counts 297 then
 * drops the filter". Third instance of one-truth-many-consumers after the
 * sitemap and the IndexNow queue.
 */
export function searchGenreForFandom(fandom: string): string {
  return NECA_FANDOM_SET.has(fandom) ? 'neca' : fandom
}

/** KB fandom(s) a URL genre slug resolves to, handling the NECA rollup. */
export function fandomsForGenre(genre: string): string[] {
  if (genre === 'neca') return NECA_FANDOMS
  return [getFandom(genre)]
}

export function figuresForGenre(genre: string): KBFigure[] {
  return fandomsForGenre(genre).flatMap(f => getFiguresByFandom(f))
}

export function cardName(f: KBFigure): string {
  const base = f.character_canonical
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const variant = (f.character_variant && f.character_variant !== 'None')
    ? ` (${f.character_variant})`
    : ''
  return `${base}${variant}`
}

/** Group a genre's figures by product_line, sorted: newest wave first then
 *  alpha within a line; lines by total count descending. */
export function groupAndSortLines(figures: KBFigure[]): [string, KBFigure[]][] {
  const groups = new Map<string, KBFigure[]>()
  for (const f of figures) {
    if (!groups.has(f.product_line)) groups.set(f.product_line, [])
    groups.get(f.product_line)!.push(f)
  }
  for (const [, group] of groups) {
    group.sort((a, b) => {
      const wA = parseInt(a.release_wave ?? '') || 0
      const wB = parseInt(b.release_wave ?? '') || 0
      if (wA !== wB) return wB - wA
      return a.character_canonical.localeCompare(b.character_canonical)
    })
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
}
