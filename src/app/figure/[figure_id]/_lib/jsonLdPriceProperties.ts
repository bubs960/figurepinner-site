// Pure helper for FigureDetailContent's JSON-LD `additionalProperty` price
// entries, split out so it's testable without JSX (this repo's test loader
// can't import a .tsx file directly -- same reasoning priceBlockView.ts,
// liveMedianView.ts and sparklineQuote.ts already document for themselves).
import { evidenceCaveat, type ConditionPrice, type PriceContract } from './priceContract'
import { formatCurrency } from './figureFormatters'

export type JsonLdPropertyValue = { '@type': 'PropertyValue'; name: string; value: string }

/**
 * FPPS-01 (2026-07-15, Steve's binding decision 1 + 5): JSON-LD must never
 * emit a single pooled "Median sold price" when sealed and loose both have
 * real data. Both conditions present -> two labeled PropertyValues, no
 * single "Median sold price". One condition (or pooled) -> keep the single
 * labeled property, still tier-gated (suppressed <3-comp buckets emit no
 * price property at all for that condition).
 *
 * Pre-mortem item 4/10 (2026-09-08, CODEX-PREMORTEM-QUOTE-TIER-RELEASE-
 * 2026-09-09.md): "JSON-LD additionalProperty publishes historical medians
 * unlabelled." Contract 2b: JSON-LD offers are eligible for fresh + recent
 * only, never historical -- a historical bucket is dropped from this array
 * entirely rather than shown unlabelled. `recent` stays included but the
 * property name carries the same age caveat every other surface uses
 * (evidenceCaveat, priceContract.ts), so it can't drift. A LEGACY
 * (pre-migration) bucket's evidenceTier is undefined, which is
 * != 'historical' -- included exactly as production does today; this only
 * changes behavior for a bucket the tiered evaluator has actually marked
 * historical.
 */
function jsonLdEligible(b: { evidenceTier?: ConditionPrice['evidenceTier'] } | null | undefined): boolean {
  return b?.evidenceTier !== 'historical'
}

function jsonLdSuffix(b: { evidenceTier?: ConditionPrice['evidenceTier']; evidenceLabel?: string | null } | null | undefined): string {
  const caveat = evidenceCaveat(b?.evidenceTier, b?.evidenceLabel)
  return caveat ? ` (${caveat})` : ''
}

export function jsonLdPriceProperties(contract: PriceContract): JsonLdPropertyValue[] {
  if (contract.hasBothConditions) {
    return [
      contract.sealed?.median != null && jsonLdEligible(contract.sealed)
        ? { '@type': 'PropertyValue', name: `Sealed / carded median sold price${jsonLdSuffix(contract.sealed)}`, value: formatCurrency(contract.sealed.median) }
        : null,
      contract.loose?.median != null && jsonLdEligible(contract.loose)
        ? { '@type': 'PropertyValue', name: `Loose median sold price${jsonLdSuffix(contract.loose)}`, value: formatCurrency(contract.loose.median) }
        : null,
    ].filter((x): x is JsonLdPropertyValue => x != null)
  }
  const only = contract.sealed?.median != null && jsonLdEligible(contract.sealed) ? contract.sealed
    : contract.loose?.median != null && jsonLdEligible(contract.loose) ? contract.loose
    : null
  if (only) {
    return [{ '@type': 'PropertyValue', name: `${only.label} median sold price${jsonLdSuffix(only)}`, value: formatCurrency(only.median!) }]
  }
  if (contract.pooled?.median != null && jsonLdEligible(contract.pooled)) {
    return [{ '@type': 'PropertyValue', name: `${contract.pooled.isAvg ? 'Average sold price' : 'Median sold price'}${jsonLdSuffix(contract.pooled)}`, value: formatCurrency(contract.pooled.median) }]
  }
  return []
}
