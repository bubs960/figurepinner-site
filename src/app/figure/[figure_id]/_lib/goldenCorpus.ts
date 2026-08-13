// goldenCorpus.ts — loader for matcher's evidence-locked golden-corpus claims docs
// (figure-claims-2 schema, v4.2 typed-claims pipeline). Pilot per
// MATCHER-TO-WEB-GOLDEN-CORPUS-CANDIDATE-CODY-2026-08-12.md: the page reads the
// claims doc DIRECTLY — this is deliberately NOT a KB pour; pour-schema design
// (PB12, new KB fields) is matcher's punch-list item. Every rendered value must
// carry its verbatim quote + source URL; fields the pipeline could not support
// stay unresolved and the page renders that honestly.

// Candidate #2 (Hela, ML Thor Ragnarok) — the first to pass web's full
// acceptance gate (MATCHER-TO-WEB-GOLDEN-CORPUS-HELA-NOMINATION-2026-08-13:
// 11/11 fields, claim-by-claim receipt verification, clean wave). The rejected
// ME149 doc is deliberately NOT loaded — Steve's 8/13 bar: golden corpus =
// complete best-possible example only.
import claimsDocRaw from '../_data/golden-corpus-hela-2026-08-13.json'

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

const docs = claimsDocRaw as unknown as FigureClaimsDoc[]

/** Returns the claims doc for a figure, or null when this figure isn't in the
 *  golden corpus. The doc itself is the render gate — no separate allowlist. */
export function getGoldenCorpusClaims(figureId: string): FigureClaimsDoc | null {
  return docs.find(d => d.figure_id === figureId && d.schema_version === 'figure-claims-2') ?? null
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
