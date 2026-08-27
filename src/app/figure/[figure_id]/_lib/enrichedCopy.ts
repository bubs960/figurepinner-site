/**
 * enrichedCopy.ts — gated access to KB enrichment prose for SEO surfaces.
 *
 * Wires match_represented into meta descriptions + JSON-LD per matcher's ask
 * (Bridge/MATCHER-TO-WEB-ENRICHMENT-META-WIRING-2026-07-02): ~22K pages ship
 * near-identical templated descriptions today, which is the same disease as
 * the 2,784 GSC "duplicate without user-selected canonical" pages. Enriched
 * prose differentiates them at zero marginal cost.
 *
 * WHY GATED (S52 stratified audit, 80 samples + exhaustive dedup over all
 * 19,346 match_represented entries): overall quality is high, but
 *   - ~11 entries leak internal QA language ("pending photo verification",
 *     "not confirmed in our records", one says the figure may not exist),
 *   - 19.3% exceed 200 chars (max 859) — paragraph-length, not snippet-length,
 *   - 212 entries (1.1%) share exact text with another figure — re-shipping
 *     those as meta would recreate the duplicate problem this fixes.
 * Gated-out figures keep the existing template; nothing gets worse.
 *
 * Server/build-time only (reads the KB module).
 */

import { getAllFigures, type KBFigure } from '@/data/kb'

// Internal-QA / hedge language that must never reach a customer-facing
// surface. Pattern families from the S52 audit — keep additive; a false
// positive just means one figure keeps the template.
const HEDGE_RE =
  /pending (photo )?verification|unconfirmed (from|pending|without)|not confirmed in our records|flagged for review|no authoritative .* exists|cross-reference packaging|catalog source|requires? (photo )?verification|in our records/i

// Placeholder/artifact sweep — zero hits in the current KB, kept as a
// permanent gate because future enrichment batches are unaudited by default.
// "null ray(s)" / "null-ray" is a real Transformers weapon (G1 Starscream,
// Legacy Dirge) — the lookahead keeps those rows live (webaudit claims-3
// verification, 2026-08-27: 2 of 5 raw \bnull\b hits were this weapon).
const ARTIFACT_RE = /\bN\/A\b|\bundefined\b|\bnull\b(?![ -]rays?\b)|\bNaN\b|\bTBD\b|\bFIXME\b|lorem ipsum/i

const MIN_LEN = 30
const META_BUDGET = 200 // hard ceiling after sentence-boundary truncation

// Exact-duplicate set: any match_represented text shared by >1 figure is
// skipped entirely (fall back to template) rather than heuristically allowed
// for multipacks — duplicate meta text is exactly what this wiring exists to
// eliminate. One O(n) pass at module init, build/ISR time only.
const DUPLICATE_TEXTS: Set<string> = (() => {
  const counts = new Map<string, number>()
  for (const f of getAllFigures()) {
    const t = f.match_represented?.trim()
    if (!t) continue
    counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([t]) => t))
})()

/** Truncate at the last sentence boundary within `budget` chars; null if no
 *  complete sentence fits (better to keep the template than ship a fragment). */
function truncateAtSentence(text: string, budget: number): string | null {
  if (text.length <= budget) return text
  const head = text.slice(0, budget + 1)
  const cut = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '))
  if (cut < MIN_LEN) return null
  return head.slice(0, cut + 1)
}

/**
 * The figure's enrichment prose if it passes every quality gate, else null
 * (caller keeps its existing templated copy). Sentence-truncated to fit a
 * meta-description budget.
 */
export function enrichedDescription(f: KBFigure): string | null {
  const raw = f.match_represented?.trim()
  if (!raw) return null
  if (raw.length < MIN_LEN) return null
  if (HEDGE_RE.test(raw)) return null
  if (ARTIFACT_RE.test(raw)) return null
  if (DUPLICATE_TEXTS.has(raw)) return null
  return truncateAtSentence(raw, META_BUDGET)
}

/**
 * Body-copy variant for on-page surfaces (HeroBand lore slot). Same safety
 * gates as enrichedDescription — internal-QA hedge language, placeholder
 * artifacts, exact-duplicate text — but no meta-length truncation, since the
 * hero paragraph is body copy, not a snippet. Added 2026-08-13 to close the
 * 7/24 board finding: HeroBand rendered raw match_represented, bypassing the
 * gate this module exists to enforce (the catchall-085/IRS incident class).
 */
export function gatedLoreText(f: KBFigure): string | null {
  const raw = f.match_represented?.trim()
  if (!raw) return null
  if (raw.length < MIN_LEN) return null
  if (HEDGE_RE.test(raw)) return null
  if (ARTIFACT_RE.test(raw)) return null
  if (DUPLICATE_TEXTS.has(raw)) return null
  return raw
}

/**
 * key_features if it passes the QA-language gates, else null (the Key
 * Features section simply doesn't render). Added 2026-08-28 per webaudit's
 * claims-3 verification: only 3 of 21,934 rows currently trip the gates
 * (matcher owns fixing those KB rows), but future enrichment batches are
 * unaudited by default — same rationale as ARTIFACT_RE existing at zero hits.
 * No length/duplicate gates: key_features is a comma list, not prose — short
 * rows and shared phrasing ("articulated joints") are legitimate there.
 */
export function gatedKeyFeatures(f: KBFigure): string | null {
  const raw = f.key_features?.trim()
  if (!raw) return null
  if (HEDGE_RE.test(raw)) return null
  if (ARTIFACT_RE.test(raw)) return null
  return raw
}
