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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FIGURES_V2 } = require('./figures-reference-v2.js') as { FIGURES_V2: KBFigure[] }

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
}

/** All figures — only use at build time */
export function getAllFigures(): KBFigure[] {
  return FIGURES_V2
}

/** All unique fandom slugs */
export function getAllFandoms(): string[] {
  return [...new Set(FIGURES_V2.map((f: KBFigure) => f.fandom))]
}

/** Look up a single figure by figure_id */
export function getFigureById(figure_id: string): KBFigure | null {
  return FIGURES_V2.find((f: KBFigure) => f.figure_id === figure_id) ?? null
}

/** All figures for a given fandom */
export function getFiguresByFandom(fandom: string): KBFigure[] {
  return FIGURES_V2.filter((f: KBFigure) => f.fandom === fandom)
}

/**
 * Derive a display name from KB fields.
 * KB doesn't always have a `name` field — construct from parts.
 * e.g. manufacturer=mattel, product_line=elite, release_wave=11, character=rey-mysterio
 * → "Rey Mysterio (Elite Series 11)"
 */
export function deriveName(f: KBFigure): string {
  if (f.name) return f.name
  const char = f.character_canonical
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const line = f.product_line
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const wave = f.release_wave ? ` Series ${f.release_wave}` : ''
  const variant = (f.character_variant && f.character_variant !== 'None') ? ` (${f.character_variant})` : ''
  return `${char}${variant} (${line}${wave})`
}

/**
 * Build the pretty URL path segment for a figure.
 * Format: /figure/<figure_id>  (stable, used for all internal links)
 * Pretty alias: /<fandom>/<product_line>/<character_canonical>  (canonical SEO URL)
 */
export function figureUrl(f: KBFigure): string {
  return `/figure/${f.figure_id}`
}

/**
 * Keyword-rich SEO canonical URL for a figure.
 * Used in sitemaps and <link rel="canonical"> tags.
 * Format: /<fandom>/<product_line>/<character_canonical>
 */
export function prettyFigureUrl(f: KBFigure): string {
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
