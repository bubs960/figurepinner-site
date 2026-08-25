// INDEXING PROGRAM Part B (2026-07-18) — index-target curation.
//
// Source: matcher's read-only value census, `MATCHER-TO-WEB-INDEX-VALUE-CENSUS-2026-07-18.md`,
// one row per KB fid via a gated D1 query (confidence_v2>=0.65, quarantined=0). Full CSV lives at
// `Bridge/scrape-results/INDEX-VALUE-CENSUS-2026-07-18.csv` (22,790 rows).
//
// `index-value-census.json` is a compact derivative: fid -> last_comp_date, ONLY for fids that
// clear the ratified index bar (sold_comp_count >= 1, matching the work order's own recommended
// default — 18,886 of 22,790 fids, 82.9%). A fid absent from this map is below-bar.
//
// This bar is intentionally the SAME test as the figure page's existing `hasConfirmedZeroSoldData`
// noindex flag (soldCount === 0) — the sitemap and the on-page robots meta must agree, or a
// crawler gets a mixed signal (submitted-but-noindexed = wasted crawl budget, the exact defect the
// external-research gap matrix named). Keeping them in lockstep here means neither can drift
// without the other being touched.
//
// Regen: re-run matcher's census script and re-derive this JSON whenever `last_comp_date` data
// meaningfully changes (e.g. after a scrape/top-up campaign lands). Stale is not dangerous (worst
// case: a newly-qualifying fid stays out of the sitemap one cycle longer than ideal, or a fid that
// dropped below the bar stays in one cycle longer) — there is no correctness requirement to
// regenerate on every deploy, only periodically.
import censusJson from './index-value-census.json'

const CENSUS: Record<string, string> = censusJson as Record<string, string>

// Bing-protection guard (board amendment, 2026-07-18 PM): a below-bar fid with real, measured
// referral traffic from an external discovery channel (Bing, DuckDuckGo, Yahoo, etc. — the guard
// is engine-agnostic, not Bing-literal) is exempt from exclusion even though its comp count is 0.
// Cross-checked via CF Web Analytics RUM (30d window, our known-good non-edge-injected site tag)
// against the current build's below-bar population — exactly ONE fid qualified. See the Part B
// completion relay for the full query + the 10 other externally-referred paths that were already
// above-bar or are non-fid content (hubs/guides/character pages, always kept regardless of this
// bar). Re-run the cross-check if this bar or the below-bar population changes meaningfully.
const BING_PROTECTED_FIDS = new Set<string>([
  'fp_wrestling_mattel_basic_ex_mountain-dew-maj_cfec51', // /wrestling/basic/mountain-dew-major-melon-john-cena — 10 Bing-referred visits/30d, 0 comps
])

/** True if this fid clears the ratified index bar, or is Bing-protection-exempted. */
export function isAtOrAboveIndexBar(figureId: string): boolean {
  return Object.prototype.hasOwnProperty.call(CENSUS, figureId) || BING_PROTECTED_FIDS.has(figureId)
}

/**
 * Character-hub index gate (webaudit F1/F2, Steve-authorized 2026-08-20 as a
 * narrow §7.4 stop-loss override — WEBAUDIT-CHARACTER-CLASS-ROOTCAUSE-AND-FIX-2026-08-20).
 * A /[genre]/character/* page is index-worthy iff it has ≥2 member figures AND
 * ≥1 of them clears the figure index bar. Below that, the page is either a
 * one-figure wrapper duplicating an already-submitted figure page (69.6% of the
 * class) or a wrapper around only below-bar figures (17.5%) — both read to
 * Google as thin/duplicate and demoted the whole URL pattern.
 *
 * LOCKSTEP RULE (same contract as the figure bar above): the sitemap's
 * character-page filter and the character page's own robots meta MUST both call
 * THIS function — submitting a noindexed page is the exact mixed signal this
 * file exists to prevent. Callers pass non-canary member fids only.
 */
export function characterHubMeetsIndexBar(memberFids: string[]): boolean {
  return memberFids.length >= 2 && memberFids.some(isAtOrAboveIndexBar)
}

/**
 * Line-hub index gate, Track A only (webaudit round-2 revision,
 * WEBAUDIT-EXTERNAL-AUDIT-PLAN-REVISION-ROUND2-2026-08-24 §2, Steve-authorized
 * via the same narrow §7.4 override as the character-hub fix).
 *
 * Deliberately NOT a port of characterHubMeetsIndexBar's price-coverage logic
 * (members>=2 AND >=1 above-bar) — round-2 verification found that would
 * deindex ~61 genuinely large, useful collector checklists (up to 153
 * releases) purely for weak sold-comp coverage, which is not a content-
 * quality signal for a checklist page. This gate excludes ONLY the singleton
 * lines (a one-figure line hub duplicates the figure page it wraps, same
 * justification already accepted for one-figure character hubs) — Track B
 * (a total-member-count floor for the 61 multi-member/zero-above-bar lines)
 * needs a Steve/matcher-confirmed threshold and is NOT implemented here.
 */
export function lineHubMeetsIndexBar(memberFids: string[]): boolean {
  return memberFids.length >= 2
}

/** Real last-comp-change date for an at-bar fid, or null (below-bar / no census entry / exempted with no known date). */
export function censusLastCompDate(figureId: string): Date | null {
  const raw = CENSUS[figureId]
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}
