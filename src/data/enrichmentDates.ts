/**
 * enrichmentDates.ts — real per-figure enrichment pour dates for sitemap
 * lastmods (2026-08-27, closes WEBAUDIT-TO-WEB-SITEMAP-LASTMOD-ENRICHMENT-GAP).
 *
 * Source: enrichment-dates.generated.json (fid → 'YYYY-MM-DD'), built by
 * scripts/generate-enrichment-dates.mjs from the provenance sidecar metas'
 * `poured_at` — matcher's actual pour dates, never a fabricated `now`.
 * tests/enrichmentDates.test.mjs fails the (deploy-chain) test run when the
 * committed map is stale against the sidecars, so this can't silently drift.
 *
 * NOTE: this feeds ONLY lastmod freshness. It must never touch
 * isAtOrAboveIndexBar — whether enrichment moves the index bar itself is a
 * policy question routed to standalone/Steve (webaudit 8/27 addendum §4).
 */
import ENRICHMENT_DATES from './enrichment-dates.generated.json'

const DATES = ENRICHMENT_DATES as Record<string, string>

/** Real enrichment pour date for a fid, or null when it has no provenance sidecar. */
export function enrichmentPourDate(figureId: string): Date | null {
  const raw = DATES[figureId]
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}
