import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'

export type KBFigure = {
  figure_id: string
  v1_figure_id: string
  fandom: string
  sub_fandom: string | null
  character_canonical: string
  character_variant: string | null
  manufacturer: string
  product_line: string
  release_wave: string
  scale: string | null
  pack_size: number
  exclusive_to: string | null
  canonical_image_url?: string | null
  name?: string
  v1_name?: string
  v1_line?: string
  v1_series?: string
  match_represented?: string
  key_features?: string
}

export function stableIdSuffix(figure_id: string): string | null {
  return /_([0-9a-f]{6})$/i.exec(figure_id)?.[1]?.toLowerCase() ?? null
}

/** A wave value is a real wave number ("1", "11", "1a") vs a text/sub-line slug. */
function isNumericWave(w: string | null | undefined): boolean {
  if (!w) return false
  return /^[0-9]+[a-z]?$/i.test(String(w).trim())
}

/**
 * Title-case a value that may be hyphen- or space-separated. Consults the
 * override map first, and keeps small words lowercase mid-phrase.
 */
const SMALL_WORDS = new Set(['of', 'the', 'and', 'a', 'an', 'to', 'in', 'vs'])
function titleCaseValue(raw: string): string {
  if (!raw) return ''
  const words = raw.trim().split(/[\s-]+/)
  return words
    .map((w, i) => {
      const lw = w.toLowerCase()
      const override = prettifySlug(lw)
      // prettifySlug returns a real override for acronym/branded casing.
      if (override !== lw.charAt(0).toUpperCase() + lw.slice(1) && !override.includes(' ')) {
        return override
      }
      if (i > 0 && SMALL_WORDS.has(lw)) return lw
      return lw.charAt(0).toUpperCase() + lw.slice(1)
    })
    .join(' ')
}

/** Token set of a display string, lowercased, for redundancy comparison. */
function tokenSet(s: string): Set<string> {
  return new Set(s.toLowerCase().split(/[\s\-\u00b7()]+/).filter(Boolean))
}

/** True if inner's tokens are all already present in outer. */
function isTokenSubset(inner: string, outer: string): boolean {
  const o = tokenSet(outer)
  const i = tokenSet(inner)
  if (i.size === 0) return true
  for (const t of i) if (!o.has(t)) return false
  return true
}

function isGarbageName(s: string): boolean {
  if (/Series\s+Series/i.test(s)) return true
  return /\bSeries\s+([a-z]+-[a-z-]+|[a-z]{2,})\b/.test(s)
}

/**
 * Derive a display name from KB fields.
 *
 * Resolution order:
 * 1. f.name, unless it contains a known generated-name artifact.
 * 2. Clean v1_* fields.
 * 3. Defensive slug derivation.
 */
export function deriveName(f: KBFigure): string {
  if (f.name && !isGarbageName(f.name)) return f.name

  if (f.v1_name) {
    const name = f.v1_name
    const line = f.v1_line ?? prettifySlug(f.product_line)
    const series = f.v1_series

    let variant = ''
    if (f.character_variant && f.character_variant !== 'None') {
      const vPretty = titleCaseValue(f.character_variant)
      if (!isTokenSubset(vPretty, name)) variant = ` (${vPretty})`
    }

    if (series && line) {
      let seriesPart = ''
      if (isNumericWave(series)) {
        seriesPart = ` Series ${series}`
      } else {
        let pretty = titleCaseValue(series)
        const lineLc = line.toLowerCase()
        if (pretty.toLowerCase().startsWith(lineLc + ' ')) {
          pretty = pretty.slice(line.length).trim()
        }
        const NOISE = /^(action figures?|figures?|action figure series)$/i
        if (pretty && !NOISE.test(pretty) && !isTokenSubset(pretty, line)) {
          seriesPart = ` \u00b7 ${pretty}`
        }
      }
      return `${name}${variant} (${line}${seriesPart})`
    }
    if (line) return `${name}${variant} (${line})`
    return `${name}${variant}`
  }

  const char = f.character_canonical
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const line = prettifySlug(f.product_line)
  const variant =
    f.character_variant && f.character_variant !== 'None'
      ? ` (${f.character_variant})`
      : ''
  const wave = isNumericWave(f.release_wave) ? ` Series ${f.release_wave}` : ''
  return `${char}${variant} (${line}${wave})`
}

/** Stable internal URL for a figure. */
export function figureUrl(f: Pick<KBFigure, 'figure_id'>): string {
  return `/figure/${f.figure_id}`
}

export function prettyFigureUrlKey(
  f: Pick<KBFigure, 'fandom' | 'product_line' | 'character_canonical'>,
): string {
  return `${f.fandom}/${f.product_line}/${f.character_canonical}`
}

// ── URL genre slug ↔ KB fandom mapping ──────────────────────────────────────
// Moved here from lib/genreFigures.ts (2026-07-12 Google-zero root-cause fix)
// so kb.ts can consume it without a circular import — genreFigures.ts imports
// from kb.ts and re-exports these for its existing consumers. Every URL the
// site emits (canonicals, sitemap, internal links) MUST use the genre-slug
// form via genreSlugForFandom(); emitting raw f.fandom mints a duplicate
// namespace with no hub and no internal links (the 2026-07 index collapse).

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

// Inverse of SLUG_TO_FANDOM: KB fandom → genre URL slug. Identity fallback
// covers fandoms whose slug already matches (wrestling, dc, …) and the
// NECA-rollup fandoms (horror, terminator, …), which resolve at /<fandom>.
const FANDOM_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_FANDOM).map(([slug, fandom]) => [fandom, slug]),
)
export function genreSlugForFandom(fandom: string): string {
  return FANDOM_TO_SLUG[fandom] ?? fandom
}
