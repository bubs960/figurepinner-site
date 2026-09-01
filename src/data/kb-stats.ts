/**
 * Build-time KB statistics — single source of truth for figure counts.
 *
 * WHY THIS EXISTS:
 * Figure counts were hardcoded across the site as marketing numbers and had
 * drifted badly out of sync with the actual KB (home said 21,906, search said
 * 22,000, about said 18,000 — the real KB had 18,455). Genre tile counts were
 * inflated 2–6x (Power Rangers tile claimed 1,200+; KB has 200). This destroys
 * collector trust, which the site lives or dies on.
 *
 * Counts here are generated from the KB before Next builds, so they
 * self-correct on every KB sync without placing the full catalog in the
 * Worker dependency graph.
 */

import generated from './kb-stats.generated.json'
import { SLUG_TO_FANDOM } from './kbTypes'

export type FandomSummary = {
  count: number
  lines: Record<string, number>
  manufacturerLines: Record<string, { count: number; productLine: string }>
}

export type KbStatsGenerated = {
  totalFigures: number
  totalFiguresLabel: string
  totalFandoms: number
  fandoms: Record<string, FandomSummary>
}

/** Compact, build-generated aggregates; never contains figure records. */
const KB_STATS: KbStatsGenerated = generated

/**
 * UI genre slug → KB fandom slug, and the NECA-rollup fandom list. Keep these
 * historical exports so existing consumers remain unchanged. genreFigures.ts
 * cannot be the source here because it imports kb.ts for other helpers.
 */
export { SLUG_TO_FANDOM as UI_SLUG_TO_FANDOM } from './kbTypes'
export const NECA_FANDOMS = [
  'horror', 'aliens-predator', 'terminator', 'robocop', 'scifi', 'pop-culture',
]

/** Total distinct figures in the KB. Computed once at build. */
export const TOTAL_FIGURES: number = KB_STATS.totalFigures

/** Number of distinct fandoms present in the KB. */
const TOTAL_FANDOMS: number = KB_STATS.totalFandoms

/**
 * Real figure count for a homepage UI genre slug.
 * Handles the pretty-slug→fandom remap and the neca→horror many-to-one rollup.
 */
function fandomCountForUISlug(uiSlug: string): number {
  if (uiSlug === 'neca') {
    return NECA_FANDOMS.reduce((sum, fandom) => sum + (KB_STATS.fandoms[fandom]?.count ?? 0), 0)
  }
  const fandom = SLUG_TO_FANDOM[uiSlug] ?? uiSlug
  return KB_STATS.fandoms[fandom]?.count ?? 0
}

/**
 * Round DOWN to a clean "X,000+" style floor for marketing copy.
 * Honest (never overstates) and stable across small KB changes.
 * e.g. 18,455 → 18,000 ; 4,777 → 4,500 ; 200 → 200.
 */
function floorCount(n: number): number {
  if (n >= 1000) return Math.floor(n / 500) * 500
  if (n >= 100)  return Math.floor(n / 50) * 50
  return n
}

/**
 * Format a count as a marketing label, never overstating.
 *  - under 100  → exact number, no "+"  (e.g. 48 → "48")
 *  - 100–999    → floored to 50, with "+" (e.g. 143 → "100+")
 *  - 1000+      → floored to 500, with "+" (e.g. 4,777 → "4,500+")
 */
export function plusLabel(n: number): string {
  if (n < 100) return n.toLocaleString()
  return `${floorCount(n).toLocaleString()}+`
}

/** The sitewide topline string, e.g. "18,000+". Use everywhere. */
export const TOTAL_FIGURES_LABEL: string = plusLabel(TOTAL_FIGURES)
