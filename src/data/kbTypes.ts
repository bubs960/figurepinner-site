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
export function isNumericWave(w: string | null | undefined): boolean {
  if (!w) return false
  return /^[0-9]+[a-z]?$/i.test(String(w).trim())
}

/**
 * Title-case a value that may be hyphen- or space-separated. Consults the
 * override map first, and keeps small words lowercase mid-phrase.
 */
const SMALL_WORDS = new Set(['of', 'the', 'and', 'a', 'an', 'to', 'in', 'vs'])
export function titleCaseValue(raw: string): string {
  if (!raw) return ''
  // Split on whitespace, or a hyphen NOT flanked by digits on both sides
  // (matcher bug report 2026-07-12): a digit-hyphen-digit run ("2013-2014")
  // is a real year/numeric range, not a slug separator -- the old
  // [\s-]+ pattern split it into two unrelated-looking numbers. A normal
  // slug hyphen (at least one side non-digit, e.g. "elite-100") still
  // splits exactly as before -- the OR condition only refuses to split
  // when BOTH neighbors are digits.
  const words = raw.trim().split(/\s+|(?:(?<!\d)-|-(?!\d))/).filter(Boolean)
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

// ── Pretty-URL uniqueness, using the ROUTER's own match semantics ────────────
// Added 2026-07-27. prettyFigureUrlKey above answers "same exact field values",
// which is NOT the question that decides whether a pretty URL resolves to one
// figure. The router (findFigureMatches.ts) accepts a URL's line segment if it
// equals EITHER `product_line` OR the `manufacturer-product_line` compound,
// lowercased. Build-time and request-time therefore disagreed, and the sitemap
// emitted 6 pretty URLs that 308 to a DIFFERENT figure — all
// /horror/neca-ultimate/*, because a row with product_line "neca-ultimate" has
// a unique exact key while also colliding at request time with every
// manufacturer "neca" + product_line "ultimate" row for the same character.
//
// Three consumers answer "which URL is this figure's real one" — router,
// canonical, sitemap. The canonical layer already resolved these to a single
// winner; the sitemap was the lone dissenter. These two helpers exist so kb.ts
// and kbDb.ts cannot drift apart again: one predicate, both callers.
//
// Measured before adoption, over all 22,725 figures: exact-key unique 11,331 →
// router-unique 11,325. Exactly 6 verdicts change, all unique→ambiguous, none
// the other way — so this can only ever REMOVE a pretty URL, never mint one.
const normSeg = (s: string | undefined | null) => String(s ?? '').toLowerCase().trim()

type RouterKeyFields =
  Pick<KBFigure, 'fandom' | 'product_line' | 'character_canonical'> & { manufacturer?: string }

/**
 * Every key a figure must be COUNTED under: one per line token the router
 * would accept for it. Deduped, because a figure with no manufacturer would
 * otherwise be counted twice under near-identical keys.
 */
export function prettyUrlRouterCountKeys(f: RouterKeyFields): string[] {
  const base = `${f.fandom}|${normSeg(f.character_canonical)}|`
  const pl = normSeg(f.product_line)
  const compound = `${normSeg(f.manufacturer)}-${pl}`
  return compound === pl ? [base + pl] : [base + pl, base + compound]
}

/**
 * The single key to LOOK UP for a figure — keyed on the line segment its own
 * pretty URL would emit, which is always the bare `product_line`.
 */
export function prettyUrlRouterLookupKey(f: RouterKeyFields): string {
  return `${f.fandom}|${normSeg(f.character_canonical)}|${normSeg(f.product_line)}`
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
// covers fandoms whose slug already matches (wrestling, dc, …).
//
// ⚠️ 2026-07-27: this comment used to claim the NECA-rollup fandoms "resolve at
// /<fandom>". That was MEASURED FALSE — all seven of /horror /aliens-predator
// /terminator /robocop /scifi /pop-culture /generic-fantasy return 404; only
// the /neca rollup hub serves. The false comment sat on the exact function the
// breadcrumb trusted, telling every reader the bug wasn't there while ~1,922
// live pages linked into those 404s from both the visible crumb and
// BreadcrumbJsonLd.
//
// The identity fallback itself is CORRECT here and load-bearing for tens of
// thousands of working figure/line/character canonicals — do not "fix" it.
// This function answers "what URL segment does this fandom use", which is a
// different question from "is there a hub page to link to". For the latter use
// hubGenreForFandom() / genreCrumbForFandom() in @/lib/genreFigures.
const FANDOM_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_FANDOM).map(([slug, fandom]) => [fandom, slug]),
)
export function genreSlugForFandom(fandom: string): string {
  return FANDOM_TO_SLUG[fandom] ?? fandom
}
