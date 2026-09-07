/**
 * priceDecision.ts — Phase 1b tiered-quote evaluator (section 2b).
 *
 * Contract: PHASE1B-PUBLICATION-DECISION-CONTRACT-2026-09-07.md section 2b,
 * amending STEVE-RULING-QUOTE-TIERS-90-180-270-2026-09-07.md (R14, FINAL).
 *
 * The API decides what is publishable; this module is the ONE place the site
 * turns a `decision.sold_*` / `decision.asking_*` bucket into a render
 * decision. No consumer re-derives a quote from raw numbers, and no consumer
 * renders a bucket whose `method_version` this evaluator does not support or
 * whose validity window has passed — both are read-time checks, not baked
 * into the snapshot at fetch time, because a cached snapshot can outlive its
 * own validity window.
 *
 * Pure, no I/O — snapshots come from priceStore.ts; this only interprets them.
 */

/** The only method_version this evaluator understands. Anything else (including
 *  the pre-tier `phase1b-2026-09-07` and any pre-1b snapshot with no `decision`
 *  block at all) renders as unsupported → unavailable. */
export const SUPPORTED_METHOD_VERSION = 'phase1b-tiers-2026-09-07'

export type QuoteTier = 'fresh' | 'recent' | 'historical' | 'thin' | 'none'

/** The shape of one `decision.sold_*` / `decision.asking_*` bucket, per
 *  section 2 + 2b. Optional fields are ones only sold buckets carry. */
export type DecisionBucket = {
  publishable: boolean
  reason:
    | 'ok'
    | 'no_validated_evidence'
    | 'insufficient_recent_sold_evidence'
    | 'insufficient_recent_asking_evidence'
    | 'condition_split_required'
    | 'thin_evidence'
  evidence_type: 'sold_observed' | 'asking_observed'
  /** The Phase 1b 90-day (fresh-window) count/statistic — NOT what the tier
   *  evaluator renders for recent/historical (matcher confirm, 2026-09-07:
   *  these keep their 90-day meaning even on a recent/historical bucket;
   *  use tier_count/tier_statistic instead). */
  count: number
  statistic: number | null
  valid_until: string | null
  method_version: string
  // Sold-only, section 2b:
  tier?: QuoteTier
  window_days?: 90 | 180 | 270 | null
  label?: string | null
  last_sold_date?: string | null
  last_sold_price?: number | null
  tier_valid_until?: string | null
  /** The tier's OWN count/statistic (recency-weighted for recent/historical,
   *  equal to statistic/count on fresh) — this is what renders. */
  tier_count?: number | null
  tier_statistic?: number | null
} | null | undefined

/** Render-ready output — the ONLY shape any consumer (hero, Decision Passport,
 *  price-check, JSON-LD, guides LiveMedian, sparklines) should read from. */
export type PriceRenderDecision =
  | {
      state: 'quote'
      tier: Exclude<QuoteTier, 'thin' | 'none'>
      statistic: number
      count: number
      label: string | null
      /** Verbatim from the API — never reformatted. Absent on 'fresh' (no caveat). */
      lastSoldDate: string | null
      lastSoldPrice: number | null
      /** JSON-LD offers are eligible for fresh + recent only (section 2b). */
      jsonLdEligible: boolean
      /** Cache lifetime ceiling — the earlier of tier_valid_until and valid_until,
       *  capped at generation + 7 d by the API already; the site must not
       *  extend it further (KV mirror TTL, ISR/edge lifetime, negative sentinel). */
      cacheUntil: string
    }
  | {
      state: 'thin'
      /** Thin never carries a statistic — last-sold only, per the ruling. */
      lastSoldDate: string
      lastSoldPrice: number
      cacheUntil: string
    }
  | {
      /** No validated dated sale in 270 d, OR the bucket/snapshot is
       *  unsupported (missing, wrong method_version, or past its validity
       *  window). `reason` distinguishes "genuinely no data" from "stale
       *  cache, refresh" for logging — callers show the same copy either way
       *  ("Insufficient recent sold evidence") per contract section 3.2. */
      state: 'unavailable'
      reason: 'none' | 'unsupported_method_version' | 'expired' | 'missing'
    }

function isFuture(iso: string | null | undefined, now: number): boolean {
  if (!iso) return false
  const t = Date.parse(iso)
  return Number.isFinite(t) && t > now
}

/** Cache lifetime precedence per matcher's confirm (2026-09-07): take
 *  tier_valid_until when present, else fall back to valid_until (the
 *  Phase 1b fresh-window field, which equals tier_valid_until on fresh
 *  and recent/historical anyway, and is null on thin/none where
 *  tier_valid_until carries the real value instead). */
function cacheLifetime(bucket: NonNullable<DecisionBucket>): string | null {
  return bucket.tier_valid_until ?? bucket.valid_until ?? null
}

/**
 * Evaluate one sold_* bucket (sealed/loose/pooled) into a render decision.
 *
 * `now` is injectable for tests; defaults to `Date.now()`.
 */
export function evaluateSoldBucket(bucket: DecisionBucket, now: number = Date.now()): PriceRenderDecision {
  if (!bucket) return { state: 'unavailable', reason: 'missing' }

  if (bucket.method_version !== SUPPORTED_METHOD_VERSION) {
    return { state: 'unavailable', reason: 'unsupported_method_version' }
  }

  const tier = bucket.tier
  if (!tier || tier === 'none') return { state: 'unavailable', reason: 'none' }

  const cacheUntil = cacheLifetime(bucket)

  if (tier === 'thin') {
    if (!cacheUntil || !isFuture(cacheUntil, now)) return { state: 'unavailable', reason: 'expired' }
    if (bucket.last_sold_date == null || bucket.last_sold_price == null) {
      // Contract requires last_sold_* to be populated whenever thin — a
      // missing pair here means an unsupported/malformed snapshot, not a
      // real thin state; fail closed rather than render a broken row.
      return { state: 'unavailable', reason: 'unsupported_method_version' }
    }
    return {
      state: 'thin',
      lastSoldDate: bucket.last_sold_date,
      lastSoldPrice: bucket.last_sold_price,
      cacheUntil,
    }
  }

  // fresh / recent / historical. Render tier_statistic/tier_count, NOT the
  // bare statistic/count — those keep their 90-day (fresh-window) meaning
  // even on a recent/historical bucket (matcher confirm, 2026-09-07: a
  // recent bucket can carry count:0/statistic:<value> because count/
  // statistic describe the FRESH window, which found nothing; tier_count/
  // tier_statistic are the tier's own and are what the ruling's label
  // describes). tier_statistic falls back to statistic for a fresh bucket
  // predating the tier fields (equal in that case, harmless fallback).
  const renderStatistic = bucket.tier_statistic ?? bucket.statistic
  const renderCount = bucket.tier_count ?? bucket.count
  if (!bucket.publishable || renderStatistic == null) {
    // A tier of fresh/recent/historical with publishable:false or no
    // statistic is a contract violation from the API's side — the ruling
    // says publishable is true for these three tiers unconditionally.
    // Fail closed instead of rendering a number the contract didn't promise.
    return { state: 'unavailable', reason: 'unsupported_method_version' }
  }
  if (!cacheUntil || !isFuture(cacheUntil, now)) return { state: 'unavailable', reason: 'expired' }

  return {
    state: 'quote',
    tier,
    statistic: renderStatistic,
    count: renderCount,
    label: bucket.label ?? null,
    lastSoldDate: bucket.last_sold_date ?? null,
    lastSoldPrice: bucket.last_sold_price ?? null,
    jsonLdEligible: tier === 'fresh' || tier === 'recent',
    cacheUntil,
  }
}

/** Convenience: does this decision produce a number the page can quote? */
export function isQuotable(d: PriceRenderDecision): d is Extract<PriceRenderDecision, { state: 'quote' }> {
  return d.state === 'quote'
}

/** Copy per contract section 3.2 — single source so wording can't drift
 *  across the hero, Decision Passport, guides, and price-check. Never "no
 *  sold sales on record" when a thin-tier last-sold exists; that state uses
 *  its own last-sold line, not this string. */
export const INSUFFICIENT_SOLD_EVIDENCE_LABEL = 'Insufficient recent sold evidence'
