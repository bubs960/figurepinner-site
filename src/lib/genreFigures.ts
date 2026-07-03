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

// URL slug → KB fandom slug mapping (URL slugs are pretty; KB slugs are canonical)
export const SLUG_TO_FANDOM: Record<string, string> = {
  'teenage-mutant-ninja-turtles': 'tmnt',
  'gijoe': 'gi-joe',
  'marvel': 'marvel-comics',
  'dungeons-and-dragons': 'dungeons-dragons',
}

export function getFandom(slug: string): string {
  return SLUG_TO_FANDOM[slug] ?? slug
}

// Inverse of SLUG_TO_FANDOM: KB fandom → genre URL slug. Used to build links to
// genre/line pages from a figure's raw fandom (e.g. fandom "marvel-comics" → the
// resolving genre route "/marvel", "tmnt" → "/teenage-mutant-ninja-turtles").
// Identity fallback covers fandoms whose slug already matches (wrestling, dc, …)
// and NECA-rollup fandoms (horror, terminator, …), which resolve at /<fandom>.
const FANDOM_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_FANDOM).map(([slug, fandom]) => [fandom, slug]),
)
export function genreSlugForFandom(fandom: string): string {
  return FANDOM_TO_SLUG[fandom] ?? fandom
}

// The 'neca' (Horror & Film) UI genre rolls up several KB fandoms — same
// rollup kb-stats uses for the homepage count.
export const NECA_FANDOMS = ['horror', 'aliens-predator', 'terminator', 'robocop']

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
