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
 * Counts here are COMPUTED from the KB at build time, so they self-correct on
 * every KB sync and can never drift again. Build-time only — never ships to the
 * client bundle (same constraint as kb.ts).
 */

import { getAllFigures, getFiguresByFandom } from './kb'

/**
 * UI genre slug → KB fandom slug.
 * The homepage / nav use "pretty" genre slugs; the KB uses canonical fandom
 * slugs. Mirrors SLUG_TO_FANDOM in app/[genre]/page.tsx — keep in sync.
 */
export const UI_SLUG_TO_FANDOM: Record<string, string> = {
  'teenage-mutant-ninja-turtles': 'tmnt',
  'gijoe': 'gi-joe',
  'marvel': 'marvel-comics',
  'dungeons-and-dragons': 'dungeons-dragons',
  // 'neca' UI slug maps to the KB 'horror' fandom (+ a few sibling fandoms);
  // handled explicitly in fandomCountForUISlug below since it's many-to-one.
}

/** KB fandoms that roll up under the "Horror & Film" (neca) UI tile. */
const NECA_FANDOMS = ['horror', 'aliens-predator', 'terminator', 'robocop']

/** Total distinct figures in the KB. Computed once at build. */
export const TOTAL_FIGURES: number = getAllFigures().length

/** Number of distinct fandoms present in the KB. */
export const TOTAL_FANDOMS: number = new Set(
  getAllFigures().map(f => f.fandom)
).size

/**
 * Real figure count for a homepage UI genre slug.
 * Handles the pretty-slug→fandom remap and the neca→horror many-to-one rollup.
 */
export function fandomCountForUISlug(uiSlug: string): number {
  if (uiSlug === 'neca') {
    return NECA_FANDOMS.reduce((sum, f) => sum + getFiguresByFandom(f).length, 0)
  }
  const fandom = UI_SLUG_TO_FANDOM[uiSlug] ?? uiSlug
  return getFiguresByFandom(fandom).length
}

/**
 * Round DOWN to a clean "X,000+" style floor for marketing copy.
 * Honest (never overstates) and stable across small KB changes.
 * e.g. 18,455 → 18,000 ; 4,777 → 4,500 ; 200 → 200.
 */
export function floorCount(n: number): number {
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
