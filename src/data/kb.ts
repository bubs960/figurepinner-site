/**
 * Build-time KB access layer
 *
 * figures-reference-v2.js is the source of truth — committed to this repo,
 * updated by running: cp <extension-repo>/API/figures-reference-v2.js src/data/
 * then git push, which triggers a new Cloudflare Pages build.
 *
 * This module is ONLY used at build time (generateStaticParams, generateMetadata).
 * It never ships to the client bundle.
 */

import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'

// eslint-disable-next-line @typescript-eslint/no-require-imports
// Slim variant: matcher's lockstep field-strip emit (whitelisted KBFigure
// fields only; −17.7% raw / −13.5% gz vs the full file). The FULL file stays
// committed alongside as the 4-way-lockstep source of truth — do not delete.
// Activation: MATCHER-TO-WEB-KB-SLIM-CONFIRMED-2026-06-12.
const { FIGURES_V2 } = require('./figures-reference-v2.slim.js') as { FIGURES_V2: KBFigure[] }

export type KBFigure = {
  figure_id: string
  v1_figure_id: string
  fandom: string               // genre slug e.g. "wrestling"
  sub_fandom: string | null
  character_canonical: string  // e.g. "rey-mysterio"
  character_variant: string | null
  manufacturer: string         // e.g. "mattel"
  product_line: string         // e.g. "elite"
  release_wave: string         // e.g. "11"
  scale: string | null
  pack_size: number
  exclusive_to: string | null
  canonical_image_url?: string | null
  name?: string                // display name — may be absent, derive from fields
  // Legacy v1 fields — clean human-readable values carried over from the v1 KB.
  // Present on ~99% of figures (v1_name 21,620/21,811; v1_line/v1_series 21,373).
  // deriveName() prefers these over slug reconstruction (W2.1, 2026-06-06).
  v1_name?: string             // e.g. "Snake Eyes"
  v1_line?: string             // e.g. "Classified Series"
  v1_series?: string           // e.g. "1" (numeric wave) or "turtles-of-grayskull" (sub-line)
  // Per-figure enrichment (matcher's character-enrichment program). Optional —
  // only ~262 wrestling fids have these today; the figure page renders them
  // only when present, so this is safe before full KB coverage. Both are plain
  // strings; key_features is a comma-separated list. Feeds site + eBay listings.
  match_represented?: string   // what match/moment/era/attire this figure depicts
  key_features?: string        // accessories, deco, variant, exclusivity notes
}

/** All figures — only use at build time */
export function getAllFigures(): KBFigure[] {
  return FIGURES_V2
}

/** All unique fandom slugs */
export function getAllFandoms(): string[] {
  return [...new Set(FIGURES_V2.map((f: KBFigure) => f.fandom))]
}

const FIGURES_BY_ID: Map<string, KBFigure> = (() => {
  const byId = new Map<string, KBFigure>()
  for (const f of FIGURES_V2) byId.set(f.figure_id, f)
  return byId
})()

function stableIdSuffix(figure_id: string): string | null {
  return /_([0-9a-f]{6})$/i.exec(figure_id)?.[1]?.toLowerCase() ?? null
}

const FIGURES_BY_STABLE_SUFFIX: Map<string, KBFigure | null> = (() => {
  const bySuffix = new Map<string, KBFigure | null>()
  for (const f of FIGURES_V2) {
    const suffix = stableIdSuffix(f.figure_id)
    if (!suffix) continue
    bySuffix.set(suffix, bySuffix.has(suffix) ? null : f)
  }
  return bySuffix
})()

/** Look up a single figure by figure_id */
export function getFigureById(figure_id: string): KBFigure | null {
  return FIGURES_BY_ID.get(figure_id) ?? null
}

/** Resolve stale/truncated generated IDs when their final stable hash is unique. */
export function getFigureByStableSuffix(figure_id: string): KBFigure | null {
  const suffix = stableIdSuffix(figure_id)
  if (!suffix) return null
  return FIGURES_BY_STABLE_SUFFIX.get(suffix) ?? null
}

/** All figures for a given fandom */
export function getFiguresByFandom(fandom: string): KBFigure[] {
  return FIGURES_V2.filter((f: KBFigure) => f.fandom === fandom)
}

/** A wave value is a real wave number ("1", "11", "1a") vs a text/sub-line slug. */
function isNumericWave(w: string | null | undefined): boolean {
  if (!w) return false
  return /^[0-9]+[a-z]?$/i.test(String(w).trim())
}

/**
 * Title-case a value that may be hyphen- OR space-separated ("turtles-of-grayskull"
 * or "turtles of grayskull" → "Turtles of Grayskull"). Consults the override map
 * first (acronyms/branded casing). Small words stay lowercase mid-phrase.
 */
const SMALL_WORDS = new Set(['of', 'the', 'and', 'a', 'an', 'to', 'in', 'vs'])
function titleCaseValue(raw: string): string {
  if (!raw) return ''
  const words = raw.trim().split(/[\s-]+/)
  return words
    .map((w, i) => {
      const lw = w.toLowerCase()
      const override = prettifySlug(lw)
      // prettifySlug returns an override (e.g. "NECA") only when the FULL token matches;
      // for a single word it returns the word title-cased, so detect a real override:
      if (override !== lw.charAt(0).toUpperCase() + lw.slice(1) && !override.includes(' ')) {
        return override // acronym / branded casing (NECA, LJN, DC…)
      }
      if (i > 0 && SMALL_WORDS.has(lw)) return lw
      return lw.charAt(0).toUpperCase() + lw.slice(1)
    })
    .join(' ')
}

/** Token set of a display string, lowercased, for redundancy comparison. */
function tokenSet(s: string): Set<string> {
  return new Set(s.toLowerCase().split(/[\s\-·()]+/).filter(Boolean))
}

/** True if `inner`'s tokens are all already present in `outer` (sub-line dupes line). */
function isTokenSubset(inner: string, outer: string): boolean {
  const o = tokenSet(outer)
  const i = tokenSet(inner)
  if (i.size === 0) return true
  for (const t of i) if (!o.has(t)) return false
  return true
}

/**
 * True if a stored display name already contains the specific garbage this fix
 * targets — so we regenerate it instead of trusting it. Narrow on purpose:
 *  - "Series Series" (the doubled-Series bug), or
 *  - " Series <raw-lowercase-hyphen-slug>" inside parens (e.g. "Series classified",
 *    "Series turtles-of-grayskull") — a raw wave slug appended after "Series".
 * Does NOT match legitimate hyphenated variants like "(zero-year)" or clean
 * numeric waves like "(... Series 11)".
 */
function isGarbageName(s: string): boolean {
  if (/Series\s+Series/i.test(s)) return true
  // " Series " immediately followed by a lowercase word that is itself a slug
  // (lowercase, or contains a hyphen) rather than a number or Capitalized word.
  return /\bSeries\s+([a-z]+-[a-z-]+|[a-z]{2,})\b/.test(s)
}

/**
 * Derive a display name from KB fields.
 *
 * Resolution order (W2.1, 2026-06-06 — fixes the "Series Series classified"
 * garbage that hit ~16,300 figures / 75% of the catalog):
 *  1. f.name — but only if present AND not itself garbage.
 *  2. Clean v1_* fields (v1_name 99.1% present, v1_line/v1_series 98%):
 *     "Snake Eyes (Classified Series · 1)" or "Batista (Deluxe Aggression Series 1)".
 *  3. Defensive slug derivation for the ~191 with no v1_name — never emits
 *     "Series Series" or a raw un-prettified wave slug.
 */
export function deriveName(f: KBFigure): string {
  if (f.name && !isGarbageName(f.name)) return f.name

  // ── Prefer clean v1_* fields when present ──
  if (f.v1_name) {
    const name = f.v1_name
    const line = f.v1_line ?? prettifySlug(f.product_line)
    const series = f.v1_series

    // Append the variant only if v1_name doesn't already include it (avoids
    // "He-Man (Vintage Sculpt) (vintage-sculpt)").
    let variant = ''
    if (f.character_variant && f.character_variant !== 'None') {
      const vPretty = titleCaseValue(f.character_variant)
      if (!isTokenSubset(vPretty, name)) variant = ` (${vPretty})`
    }

    if (series && line) {
      // numeric series → "Line Series N"; text series → "Line · Pretty-Sub".
      let seriesPart = ''
      if (isNumericWave(series)) {
        seriesPart = ` Series ${series}`
      } else {
        let pretty = titleCaseValue(series)
        // Strip a leading copy of the line name from the sub-line
        // ("Origins" + "Origins Action Figures" → "Action Figures").
        const lineLc = line.toLowerCase()
        if (pretty.toLowerCase().startsWith(lineLc + ' ')) {
          pretty = pretty.slice(line.length).trim()
        }
        // Drop generic-category noise and pure line-dupes.
        const NOISE = /^(action figures?|figures?|action figure series)$/i
        if (pretty && !NOISE.test(pretty) && !isTokenSubset(pretty, line)) {
          seriesPart = ` · ${pretty}`
        }
      }
      return `${name}${variant} (${line}${seriesPart})`
    }
    if (line) return `${name}${variant} (${line})`
    return `${name}${variant}`
  }

  // ── Fallback: defensive slug derivation (no v1_name available) ──
  const char = f.character_canonical
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const line = prettifySlug(f.product_line) // override-aware caser (W2)
  const variant =
    f.character_variant && f.character_variant !== 'None'
      ? ` (${f.character_variant})`
      : ''

  // Only append a wave when it's a real wave NUMBER. Text-slug waves
  // (e.g. "classified", "turtles-of-grayskull") that produced the garbage
  // are dropped — the line already conveys the sub-line.
  const wave = isNumericWave(f.release_wave) ? ` Series ${f.release_wave}` : ''
  return `${char}${variant} (${line}${wave})`
}

/**
 * Build the pretty URL path segment for a figure.
 * Format: /figure/<figure_id>  (stable, used for all internal links)
 * Pretty alias: /<fandom>/<product_line>/<character_canonical> when unique.
 */
export function figureUrl(f: KBFigure): string {
  return `/figure/${f.figure_id}`
}

function prettyFigureUrlKey(f: KBFigure): string {
  return `${f.fandom}/${f.product_line}/${f.character_canonical}`
}

const prettyFigureUrlCounts: Map<string, number> = (() => {
  const counts = new Map<string, number>()
  for (const f of FIGURES_V2) {
    const key = prettyFigureUrlKey(f)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
})()

export function hasUniquePrettyFigureUrl(f: KBFigure): boolean {
  return prettyFigureUrlCounts.get(prettyFigureUrlKey(f)) === 1
}

/**
 * Keyword-rich SEO canonical URL for a figure.
 * Used in sitemaps and <link rel="canonical"> tags. Many characters have
 * multiple waves with the same pretty path, so ambiguous figures keep the
 * stable identity URL to prevent one release from resolving as another.
 */
export function prettyFigureUrl(f: KBFigure): string {
  if (!hasUniquePrettyFigureUrl(f)) return figureUrl(f)
  return `/${f.fandom}/${f.product_line}/${f.character_canonical}`
}

/**
 * All figures for a fandom + product_line combination.
 * lineSlug can be:
 *   "elite"       → matches product_line="elite"
 *   "wwe-elite"   → matches manufacturer="wwe" + product_line="elite"
 */
export function getFiguresByLine(fandom: string, lineSlug: string): KBFigure[] {
  const norm = lineSlug.toLowerCase().trim()
  return FIGURES_V2.filter((f: KBFigure) => {
    if (f.fandom !== fandom) return false
    const pl  = f.product_line.toLowerCase()
    const mfr = f.manufacturer.toLowerCase()
    return pl === norm || `${mfr}-${pl}` === norm
  })
}

/** All unique product_line values for a fandom */
export function getLinesByFandom(fandom: string): string[] {
  const figures = getFiguresByFandom(fandom)
  return [...new Set(figures.map(f => f.product_line))]
}
