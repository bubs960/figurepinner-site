// goldenCorpus.ts — loader for matcher's evidence-locked golden-corpus claims docs
// (figure-claims-2 schema, v4.2 typed-claims pipeline). Pilot per
// MATCHER-TO-WEB-GOLDEN-CORPUS-CANDIDATE-CODY-2026-08-12.md: the page reads the
// claims doc DIRECTLY — this is deliberately NOT a KB pour; pour-schema design
// (PB12, new KB fields) is matcher's punch-list item. Fields the pipeline could
// not support stay unresolved and the page renders that honestly.
//
// Render policy (WEBAUDIT-TO-WEB-SOURCE-DISPLAY-REVIEW-SPEC-2026-08-30, Steve
// 8/30): the doc's verbatim quotes + source URLs (evidence.quotes/sources) are
// never rendered publicly — only the resolved claim.value. The quotes stay in
// the data for matcher's internal quality gates; this file's exported types
// still describe them so that data continues to type-check.
//
// STOPGAP GATE (2026-08-30, same day, second finding): removing the quote
// PANEL didn't guarantee the claim VALUE itself is clean — an independent
// audit found 1,520 resolved/conflict values across 620 of 1,020 figures
// (61%) contain a 40+ character run copied verbatim from their own linked
// source quote (e.g. a "visual identifier" value that's actually a reviewer's
// verbatim descriptive sentence, not an extracted fact). That's a
// harvest/extraction-pipeline defect (matcher's side, not web's rendering) —
// the real fix is regenerating those values from validated facts. Until then,
// `isVerbatimOverlap` below is the render-time stopgap: any value that still
// carries a long run shared with its own quote is withheld the same way an
// unresolved field is ("Not yet documented"), everywhere a claim value
// reaches the page (GoldenCorpusPassport, GoldenCorpusAtAGlance, and
// ScalePassport via its sidecar quote lookup). Threshold matches the audit
// exactly so the gate closes precisely what was measured — not a proxy for
// it. See WEB-TO-MATCHER-CLAIM-VALUE-VERBATIM-AUDIT-2026-08-30.md.

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
 *  failure degrades to null rather than throwing. */
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

// Same threshold used to measure the problem (see the module comment above) —
// keep these in lockstep if either changes.
const VERBATIM_OVERLAP_THRESHOLD = 40

/** Longest run of characters `a` and `b` share in common, case-insensitive.
 *  Classic O(len(a)*len(b)) DP; these strings are short (single field values
 *  and single quotes), so this is cheap per call. */
function longestCommonRun(a: string, b: string): number {
  const s = a.toLowerCase()
  const t = b.toLowerCase()
  let prev = new Array(t.length + 1).fill(0)
  let best = 0
  for (let i = 1; i <= s.length; i++) {
    const cur = new Array(t.length + 1).fill(0)
    for (let j = 1; j <= t.length; j++) {
      if (s[i - 1] === t[j - 1]) {
        cur[j] = prev[j - 1] + 1
        if (cur[j] > best) best = cur[j]
      }
    }
    prev = cur
  }
  return best
}

/** True if `value` shares a 40+ character verbatim run with any quote it
 *  cites as its own evidence — i.e. the "fact" is substantially the source's
 *  own sentence, not an extracted fact. Render callers withhold the value
 *  (treat it like an unresolved field) when this is true. */
export function isVerbatimOverlap(
  doc: FigureClaimsDoc,
  quoteIds: string[] | undefined,
  value: string | undefined
): boolean {
  if (!value || value.length < VERBATIM_OVERLAP_THRESHOLD || !quoteIds?.length) return false
  return quoteIds.some(id => {
    const quote = doc.evidence.quotes.find(q => q.quote_id === id)
    return quote ? longestCommonRun(value, quote.text) >= VERBATIM_OVERLAP_THRESHOLD : false
  })
}
