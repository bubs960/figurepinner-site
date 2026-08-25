// goldenCorpus.ts — loader for matcher's evidence-locked golden-corpus claims docs
// (figure-claims-2 schema, v4.2 typed-claims pipeline). Pilot per
// MATCHER-TO-WEB-GOLDEN-CORPUS-CANDIDATE-CODY-2026-08-12.md: the page reads the
// claims doc DIRECTLY — this is deliberately NOT a KB pour; pour-schema design
// (PB12, new KB fields) is matcher's punch-list item. Every rendered value must
// carry its verbatim quote + source URL; fields the pipeline could not support
// stay unresolved and the page renders that honestly.

// Track 1 scale-up (2026-08-24, WEBAUDIT-TO-WEB-GOLDEN-CORPUS-TRACK1-ACTIONABLE):
// was a single hardcoded Hela import (the 8/13 pilot doc); now loads lazily from
// any of the 320 per-wave sidecars in src/data/figures-provenance/, the same
// dynamic-import pattern ScalePassport.tsx already uses for its receipts lookup
// (fig.passport.sidecar names the file). Hela's doc lives in one of those wave
// files too (marvel-comics--marvel-legends--thor-ragnarok.json) — no data lost.

export type EvidenceClass = 'primary_exact' | 'single_secondary' | string

export interface ClaimsSource {
  source_id: string
  url: string
  source_type: string
  fetch_status: string
  retrieved_at: string | null
}

export interface ClaimsQuote {
  quote_id: string
  source_id: string
  text: string
}

export interface PriceDetail {
  amount: number
  currency: string
  price_kind: string
  region: string | null
  as_of: string | null
  source_id: string
}

export interface ConflictValue {
  value: string
  evidence_quote_ids: string[]
  price_detail?: PriceDetail
}

export interface Claim {
  field_path: string
  status: 'resolved' | 'unresolved' | 'not_applicable' | 'conflict'
  value?: string
  evidence_quote_ids?: string[]
  evidence_class?: EvidenceClass
  price_detail?: PriceDetail
  conflicting_values?: ConflictValue[]
}

export interface FigureClaimsDoc {
  schema_version: string
  figure_id: string
  evidence: {
    sources: ClaimsSource[]
    quotes: ClaimsQuote[]
  }
  claims: Claim[]
}

/** Returns the claims doc for a figure, or null when this figure isn't in the
 *  golden corpus (no sidecar, sidecar not synced, or fid absent from it). The
 *  doc itself is the render gate — no separate allowlist. Render-safe: any
 *  failure degrades to null rather than throwing (same contract as
 *  ScalePassport's loadSidecarDoc, which this mirrors). */
export async function getGoldenCorpusClaims(
  figureId: string,
  sidecar: string | undefined
): Promise<FigureClaimsDoc | null> {
  if (!sidecar || !/^[a-z0-9-]+(--[a-z0-9-]+){2}$/.test(sidecar)) return null
  try {
    const mod = await import(`@/data/figures-provenance/${sidecar}.json`)
    const docs = (mod.default ?? mod) as Record<string, FigureClaimsDoc>
    const doc = docs[figureId]
    return doc && doc.schema_version === 'figure-claims-2' ? doc : null
  } catch {
    return null
  }
}

/** Resolve a claim's quote ids to the actual verbatim quotes + their sources. */
export function resolveEvidence(
  doc: FigureClaimsDoc,
  quoteIds: string[] | undefined
): Array<{ quote: ClaimsQuote; source: ClaimsSource | null }> {
  if (!quoteIds?.length) return []
  return quoteIds
    .map(id => doc.evidence.quotes.find(q => q.quote_id === id))
    .filter((q): q is ClaimsQuote => q != null)
    .map(quote => ({
      quote,
      source: doc.evidence.sources.find(s => s.source_id === quote.source_id) ?? null,
    }))
}
