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

import { figureUrl, prettyFigureUrlKey, stableIdSuffix, type KBFigure } from './kbTypes'
export { deriveName, figureUrl } from './kbTypes'
export type { KBFigure } from './kbTypes'

// eslint-disable-next-line @typescript-eslint/no-require-imports
// Slim variant: matcher's lockstep field-strip emit (whitelisted KBFigure
// fields only; −17.7% raw / −13.5% gz vs the full file). The FULL file stays
// committed alongside as the 4-way-lockstep source of truth — do not delete.
// Activation: MATCHER-TO-WEB-KB-SLIM-CONFIRMED-2026-06-12.
const { FIGURES_V2 } = require('./figures-reference-v2.slim.js') as { FIGURES_V2: KBFigure[] }

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
