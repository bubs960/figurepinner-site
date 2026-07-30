/**
 * priceContract.ts — FPPS-01 (2026-07-15), Steve's binding product decisions.
 *
 * Single source of truth for "what price number(s), if any, may this figure
 * page show" — used by EVERY price-bearing surface (bottom summary ledger,
 * SeoSummary prose, page.tsx generateMetadata for <meta name="description">
 * and og:description, JSON-LD Product/offers, MobileActionBar) so they can
 * never again drift out of sync with each other or with the top-of-page
 * HeroBand placard, which is the existing correct pattern this reuses.
 *
 * Steve's three binding rules (do not re-derive or substitute defaults):
 *   1. No single headline price, ever. When sealed AND loose both have data,
 *      the page must show both -- always. There is no "main number" when two
 *      conditions exist. (Match HeroBand's existing headline+secondary
 *      layout, not a stricter fully-equal layout -- webaudit ruled HeroBand
 *      is the pattern to reuse, 2026-07-15.)
 *   2. Comp-count tiers (see figureFormatters.priceCompTier):
 *        10+  -> trustworthy, plain median, no caveat
 *        3-9  -> "thin data" label required, wherever that number shows
 *        <3   -> suppress the number entirely -- never show a median
 *                computed from 1-2 sales
 *   3. Any surface that used to show ONE pooled number must instead show the
 *      SAME condition-split breakdown HeroBand already uses (sealed row +
 *      loose row, each with its own tier), not a new visual pattern.
 *
 * This module is pure (no React, no fetch) so it can run in both the server
 * metadata function (page.tsx) and client components, and so it's directly
 * unit-testable without rendering anything.
 */

import { priceCompTier, type PriceCompTier } from './figureFormatters'

export type CondBucketLike = {
  median: number | null
  count: number
} | null | undefined

export type PriceContractInput = {
  soldCount: number
  medianSold?: number | null
  avgSold?: number | null
  sealed?: CondBucketLike
  loose?: CondBucketLike
  segmentation?: 'split' | 'sealed-only' | 'loose-only' | 'pooled'
}

/** One condition's presentable price -- render-ready, tier already applied. */
export type ConditionPrice = {
  condition: 'sealed' | 'loose'
  label: string
  /** null when this bucket's tier is 'suppress' -- caller must NOT render a
   *  number for this condition, only the suppressed-state copy. */
  median: number | null
  count: number
  tier: PriceCompTier
  /** True when tier === 'thin' -- convenience flag so callers don't have to
   *  re-check `tier === 'thin'` at every render site. */
  needsThinDataLabel: boolean
}

export type PriceContract = {
  /** No sold data at all (soldCount === 0). Every surface should show its
   *  own "no data" copy; no numbers anywhere. */
  hasNoData: boolean
  /** Both conditions present with real data (segmentation-independent --
   *  this checks bucket presence, since Steve's rule 1 is about what data
   *  EXISTS, not about the aggregation cron's segmentation label). When
   *  true, decision 1 applies: every surface must name both, never pick one
   *  as "the" price. */
  hasBothConditions: boolean
  /** Primary condition to lead with when only rendering one is unavoidable
   *  (e.g. a character count-constrained meta tag) -- sealed if both/sealed-
   *  only present, loose if loose-only. null when there's no usable bucket
   *  at all (falls back to the legacy pooled fields, see `pooled` below). */
  sealed: ConditionPrice | null
  loose: ConditionPrice | null
  /** Legacy pooled fallback (medianSold/avgSold) -- used when neither sealed
   *  nor loose has a USABLE bucket (old snapshots, pre-condition-split
   *  figures, or a bucket that exists but is suppressed for <3 comps).
   *  Also tiered by soldCount. Never used when a sealed and/or loose bucket
   *  actually RENDERS a number, even under 'pooled' segmentation -- a
   *  present-and-visible thin bucket is still more honest than the blended
   *  figure. A present-but-suppressed 1-2-comp bucket renders nothing on its
   *  own, though, so it must not block a real, well-supported pooled median
   *  sitting right there unused (webaudit gate, 2026-07-30 -- offers-
   *  suppression fix, FPPS-01 follow-up).
   */
  pooled: { median: number | null; tier: PriceCompTier; needsThinDataLabel: boolean; isAvg: boolean } | null
}

function bucketToConditionPrice(
  condition: 'sealed' | 'loose',
  label: string,
  bucket: CondBucketLike
): ConditionPrice | null {
  if (!bucket || bucket.median == null || bucket.count < 1) return null
  const tier = priceCompTier(bucket.count)
  return {
    condition,
    label,
    median: tier === 'suppress' ? null : bucket.median,
    count: bucket.count,
    tier,
    needsThinDataLabel: tier === 'thin',
  }
}

export function derivePriceContract(price: PriceContractInput | null | undefined): PriceContract {
  if (!price || price.soldCount === 0) {
    return { hasNoData: true, hasBothConditions: false, sealed: null, loose: null, pooled: null }
  }

  const sealed = bucketToConditionPrice('sealed', 'Sealed / carded', price.sealed)
  const loose = bucketToConditionPrice('loose', 'Loose / opened', price.loose)

  // hasBothConditions checks BUCKET PRESENCE (median != null, count >= 1),
  // not just tier !== 'suppress' -- a figure with sealed=$180/n=8 (thin) and
  // loose=$20/n=42 (trustworthy) still "has both conditions" per Steve's
  // rule even though the sealed number itself carries a thin-data label.
  // Suppression is a per-bucket render decision, not a has-both decision.
  const sealedBucketPresent = price.sealed != null && price.sealed.median != null && price.sealed.count >= 1
  const looseBucketPresent = price.loose != null && price.loose.median != null && price.loose.count >= 1
  const hasBothConditions = sealedBucketPresent && looseBucketPresent

  // Pooled fallback gates on USABLE, not merely present: a bucket that
  // exists but is suppressed (<3 comps, sealed.median/loose.median === null
  // above) renders nothing on its own, so it must not block a real, usable
  // pooled median. Without this, a figure with soldCount=20/medianSold=$44
  // and a stray sealed{count:1} bucket showed NO price anywhere, even
  // though a well-supported pooled number was sitting right there unused.
  const sealedUsable = sealed != null && sealed.median != null
  const looseUsable = loose != null && loose.median != null
  const pooled = (!sealedUsable && !looseUsable)
    ? (() => {
        const median = price.medianSold ?? price.avgSold ?? null
        if (median == null) return null
        const tier = priceCompTier(price.soldCount)
        return {
          median: tier === 'suppress' ? null : median,
          tier,
          needsThinDataLabel: tier === 'thin',
          isAvg: price.medianSold == null && price.avgSold != null,
        }
      })()
    : null

  return { hasNoData: false, hasBothConditions, sealed, loose, pooled }
}

/** "insufficient recent comps" (or equivalent) copy for a suppressed tier --
 *  single source so wording can't drift between surfaces. */
export const INSUFFICIENT_COMPS_LABEL = 'Insufficient recent comps'
