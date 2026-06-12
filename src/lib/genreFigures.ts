/**
 * genreFigures.ts — shared genre→figures helpers for the genre page and the
 * /api/genre-line-figures route (S20 payload cut: the genre page ships only
 * the first line's cards; the accordion fetches the rest on open).
 *
 * Extracted from src/app/[genre]/page.tsx so both surfaces serialize rows
 * identically. The line `slug` here is always the raw KB product_line value
 * (the accordion groups by product_line), NOT the pretty URL slug forms the
 * line-hub route also accepts.
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

// The 'neca' (Horror & Film) UI genre rolls up several KB fandoms — same
// rollup kb-stats uses for the homepage count.
export const NECA_FANDOMS = ['horror', 'aliens-predator', 'terminator', 'robocop']

export function figuresForGenre(genre: string): KBFigure[] {
  if (genre === 'neca') return NECA_FANDOMS.flatMap(f => getFiguresByFandom(f))
  return getFiguresByFandom(getFandom(genre))
}

export const MAX_PER_LINE = 60

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

/** Wire shape for one accordion card. href is derived client-side from
 *  figure_id, so it is deliberately NOT serialized. */
export interface FigureRowWire {
  figure_id: string
  name: string
  series: string | null
  exclusive: string | null
  imageUrl: string | null
}

export function toFigureRow(f: KBFigure): FigureRowWire {
  return {
    figure_id: f.figure_id,
    name:      cardName(f),
    series:    f.release_wave ?? null,
    exclusive: (f.exclusive_to && f.exclusive_to !== 'None') ? f.exclusive_to : null,
    imageUrl:  f.canonical_image_url ?? null,
  }
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

/** Up to MAX_PER_LINE serialized rows for one product_line of a genre,
 *  sorted exactly like the genre page's first line. Empty array = unknown
 *  genre/line. */
export function figuresForLine(genre: string, lineSlug: string): FigureRowWire[] {
  const inLine = figuresForGenre(genre).filter(f => f.product_line === lineSlug)
  if (!inLine.length) return []
  inLine.sort((a, b) => {
    const wA = parseInt(a.release_wave ?? '') || 0
    const wB = parseInt(b.release_wave ?? '') || 0
    if (wA !== wB) return wB - wA
    return a.character_canonical.localeCompare(b.character_canonical)
  })
  return inLine.slice(0, MAX_PER_LINE).map(toFigureRow)
}
