import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { derivePriceContract, INSUFFICIENT_COMPS_LABEL, quotableBuckets } from '../src/app/figure/[figure_id]/_lib/priceContract.ts'
import { priceCompTier, MIN_COMPS_TO_QUOTE, TRUSTWORTHY_COMPS } from '../src/app/figure/[figure_id]/_lib/figureFormatters.ts'

// FPPS-01 (2026-07-15) -- Steve's binding product decisions:
//   1. No single headline price, ever, when both conditions have data.
//   2. Comp-count tiers: 10+ trustworthy, 3-9 thin data, <3 suppress the
//      number entirely.
//   3. Any surface that showed a pooled number instead shows the SAME
//      condition-split breakdown (sealed + loose), not a new pattern.
//
// This fixtures the exact numbers webaudit's work order specified: the real
// Hogan page (sealed $180/8 comps, loose $20/42 comps), a thin-data case
// (3-9 comps, one condition), and an under-3-comps case.

describe('priceCompTier (Steve\'s exact 3-tier boundaries)', () => {
  test('10+ is trustworthy', () => {
    assert.equal(priceCompTier(10), 'trustworthy')
    assert.equal(priceCompTier(50), 'trustworthy')
  })
  test('3-9 is thin', () => {
    assert.equal(priceCompTier(3), 'thin')
    assert.equal(priceCompTier(9), 'thin')
  })
  test('0-2 is suppress', () => {
    assert.equal(priceCompTier(0), 'suppress')
    assert.equal(priceCompTier(1), 'suppress')
    assert.equal(priceCompTier(2), 'suppress')
  })
})

describe('one floor, one verdict (2026-09-02, webaudit pass-1 defect 1)', () => {
  test('the exported floor IS the tier boundary the contract uses', () => {
    assert.equal(MIN_COMPS_TO_QUOTE, 3)
    assert.equal(TRUSTWORTHY_COMPS, 10)
    assert.equal(priceCompTier(MIN_COMPS_TO_QUOTE - 1), 'suppress')
    assert.equal(priceCompTier(MIN_COMPS_TO_QUOTE), 'thin')
    assert.equal(priceCompTier(TRUSTWORTHY_COMPS), 'trustworthy')
  })

  test('quotableBuckets: the JD McDonagh case -- a 2-comp loose bucket is NOT quotable, so the hero shows no number for it', () => {
    const loose = { median: 25, count: 2, avg: 25, min: 20, max: 30, p10: null, p90: null }
    const { sealed, loose: q } = quotableBuckets(null, loose)
    assert.equal(sealed, null)
    assert.equal(q, null, 'a bucket under the floor must come back null -- the hero renders no dollar figure for it')
    // and the same input through derivePriceContract agrees: median suppressed, count kept
    const c = derivePriceContract({ soldCount: 2, medianSold: 25, loose })
    assert.equal(c.loose?.median, null)
    assert.equal(c.loose?.count, 2)
    assert.equal(c.loose?.tier, 'suppress')
  })

  test('quotableBuckets: 3 comps is quotable (thin), 10+ is quotable (trustworthy); a bucket without a median is never quotable', () => {
    const thin = { median: 40, count: 3 }
    const deep = { median: 180, count: 12 }
    const noMedian = { median: null, count: 50 }
    const r = quotableBuckets(deep, thin)
    assert.equal(r.sealed, deep)
    assert.equal(r.loose, thin)
    assert.equal(quotableBuckets(noMedian, null).sealed, null)
  })
})

describe('derivePriceContract -- Hogan fixture (sealed $180/8, loose $20/42, both real)', () => {
  const hoganPrice = {
    soldCount: 50,
    medianSold: 23, // the OLD pooled/blended figure this whole ticket exists to stop surfacing
    avgSold: 45,
    segmentation: 'split',
    sealed: { median: 180, count: 8 },
    loose: { median: 20, count: 42 },
  }

  test('hasBothConditions is true -- decision 1 must fire', () => {
    const c = derivePriceContract(hoganPrice)
    assert.equal(c.hasBothConditions, true)
    assert.equal(c.hasNoData, false)
  })

  test('sealed bucket (n=8) is tier=thin, number STILL shows (3-9 tier), needsThinDataLabel true', () => {
    const c = derivePriceContract(hoganPrice)
    assert.equal(c.sealed.tier, 'thin')
    assert.equal(c.sealed.median, 180, 'thin tier still renders the number')
    assert.equal(c.sealed.needsThinDataLabel, true)
    assert.equal(c.sealed.count, 8)
  })

  test('loose bucket (n=42) is tier=trustworthy, no caveat needed', () => {
    const c = derivePriceContract(hoganPrice)
    assert.equal(c.loose.tier, 'trustworthy')
    assert.equal(c.loose.median, 20)
    assert.equal(c.loose.needsThinDataLabel, false)
    assert.equal(c.loose.count, 42)
  })

  test('the OLD pooled medianSold ($23) never appears anywhere in the contract when both buckets exist', () => {
    const c = derivePriceContract(hoganPrice)
    assert.equal(c.pooled, null, 'pooled fallback must not be used when real condition buckets exist')
    // Explicit guard against the exact regression this ticket fixes: neither
    // condition price may equal the stale pooled figure.
    assert.notEqual(c.sealed.median, 23)
    assert.notEqual(c.loose.median, 23)
  })
})

describe('derivePriceContract -- thin-data fixture (3-9 comps, ONE condition only)', () => {
  const thinPrice = {
    soldCount: 5,
    medianSold: 75,
    avgSold: 75,
    segmentation: 'sealed-only',
    sealed: { median: 75, count: 5 },
    loose: null,
  }

  test('hasBothConditions is false -- only one condition has real data', () => {
    const c = derivePriceContract(thinPrice)
    assert.equal(c.hasBothConditions, false)
  })

  test('the single condition renders WITH a thin-data flag, not suppressed', () => {
    const c = derivePriceContract(thinPrice)
    assert.equal(c.sealed.tier, 'thin')
    assert.equal(c.sealed.median, 75)
    assert.equal(c.sealed.needsThinDataLabel, true)
  })

  test('loose is null (no bucket at all) -- not a suppressed bucket, just absent', () => {
    const c = derivePriceContract(thinPrice)
    assert.equal(c.loose, null)
  })
})

describe('derivePriceContract -- under-3-comps fixture (must suppress, never show a number)', () => {
  const sparsePrice = {
    soldCount: 2,
    medianSold: 40,
    avgSold: 40,
    segmentation: 'sealed-only',
    sealed: { median: 40, count: 2 },
    loose: null,
  }

  test('sealed bucket tier is suppress', () => {
    const c = derivePriceContract(sparsePrice)
    assert.equal(c.sealed.tier, 'suppress')
  })

  test('sealed.median is null -- NO number renders, even though the snapshot has one', () => {
    const c = derivePriceContract(sparsePrice)
    assert.equal(c.sealed.median, null, 'a median computed from 1-2 sales must never render')
    assert.equal(c.sealed.count, 2, 'count is still exposed so callers can render "insufficient comps (2)"')
  })

  test('needsThinDataLabel is false for a suppressed bucket (thin-data label is only for the 3-9 tier)', () => {
    const c = derivePriceContract(sparsePrice)
    assert.equal(c.sealed.needsThinDataLabel, false)
  })
})

describe('derivePriceContract -- pooled fallback (no condition buckets exist at all)', () => {
  test('pooled figure with 15 comps: median renders, no thin flag', () => {
    const c = derivePriceContract({ soldCount: 15, medianSold: 60, avgSold: 58, segmentation: 'pooled', sealed: null, loose: null })
    assert.equal(c.hasBothConditions, false)
    assert.equal(c.sealed, null)
    assert.equal(c.loose, null)
    assert.equal(c.pooled.median, 60)
    assert.equal(c.pooled.tier, 'trustworthy')
    assert.equal(c.pooled.needsThinDataLabel, false)
    assert.equal(c.pooled.isAvg, false)
  })

  test('pooled figure with 5 comps: median renders WITH thin flag', () => {
    const c = derivePriceContract({ soldCount: 5, medianSold: 60, avgSold: 58, segmentation: 'pooled', sealed: null, loose: null })
    assert.equal(c.pooled.median, 60)
    assert.equal(c.pooled.needsThinDataLabel, true)
  })

  test('pooled figure with 2 comps: median suppressed entirely', () => {
    const c = derivePriceContract({ soldCount: 2, medianSold: 60, avgSold: 58, segmentation: 'pooled', sealed: null, loose: null })
    assert.equal(c.pooled.median, null)
    assert.equal(c.pooled.tier, 'suppress')
  })

  test('pooled figure falls back to avgSold when medianSold is null, isAvg is true', () => {
    const c = derivePriceContract({ soldCount: 15, medianSold: null, avgSold: 58, segmentation: 'pooled', sealed: null, loose: null })
    assert.equal(c.pooled.median, 58)
    assert.equal(c.pooled.isAvg, true)
  })

  // webaudit gate, 2026-07-30 -- offers-suppression fix. Regression case:
  // a present-but-suppressed 1-2-comp bucket used to block the pooled
  // fallback even though the bucket itself renders nothing, so the page
  // showed no price at all despite a real, well-supported pooled median.
  test('a suppressed sealed bucket (n=1) does NOT block a usable pooled fallback', () => {
    const c = derivePriceContract({
      soldCount: 20, medianSold: 44, avgSold: 44, segmentation: 'pooled',
      sealed: { median: 999, count: 1 },
      loose: null,
    })
    assert.equal(c.sealed.tier, 'suppress')
    assert.equal(c.sealed.median, null, 'the suppressed bucket itself must still render nothing')
    assert.notEqual(c.pooled, null, 'the well-supported pooled median must NOT be blocked by the suppressed bucket')
    assert.equal(c.pooled.median, 44, 'pooled falls back to the real medianSold')
    assert.equal(c.pooled.tier, 'trustworthy')
  })

  test('a usable (non-suppressed) sealed bucket DOES still block the pooled fallback', () => {
    const c = derivePriceContract({
      soldCount: 20, medianSold: 44, avgSold: 44, segmentation: 'pooled',
      sealed: { median: 180, count: 8 },
      loose: null,
    })
    assert.equal(c.sealed.tier, 'thin')
    assert.equal(c.sealed.median, 180, 'the usable thin bucket still renders its own number')
    assert.equal(c.pooled, null, 'pooled must stay null when a real condition bucket is usable -- unchanged prior behavior')
  })
})

describe('derivePriceContract -- zero-data case', () => {
  test('soldCount 0: hasNoData true, everything else null', () => {
    const c = derivePriceContract({ soldCount: 0, medianSold: null, avgSold: null, segmentation: 'pooled', sealed: null, loose: null })
    assert.equal(c.hasNoData, true)
    assert.equal(c.hasBothConditions, false)
    assert.equal(c.sealed, null)
    assert.equal(c.loose, null)
    assert.equal(c.pooled, null)
  })

  test('null price input: hasNoData true', () => {
    const c = derivePriceContract(null)
    assert.equal(c.hasNoData, true)
  })
})

describe('derivePriceContract -- both conditions present but one is suppressed (Hogan-shaped, thinner)', () => {
  test('sealed n=2 (suppress) + loose n=42 (trustworthy): hasBothConditions still true, sealed number suppressed', () => {
    const c = derivePriceContract({
      soldCount: 44, medianSold: 22, avgSold: 22, segmentation: 'split',
      sealed: { median: 180, count: 2 },
      loose: { median: 20, count: 42 },
    })
    // hasBothConditions checks BUCKET PRESENCE, not tier -- both buckets
    // exist (median != null, count >= 1), so this is still "both conditions
    // have data" per Steve's rule, even though sealed itself is suppressed.
    assert.equal(c.hasBothConditions, true)
    assert.equal(c.sealed.median, null, 'sealed must suppress -- only 2 comps')
    assert.equal(c.sealed.tier, 'suppress')
    assert.equal(c.loose.median, 20, 'loose renders normally -- 42 comps')
    assert.equal(c.loose.tier, 'trustworthy')
  })
})

test('INSUFFICIENT_COMPS_LABEL is exported and non-empty (single source of wording)', () => {
  assert.equal(typeof INSUFFICIENT_COMPS_LABEL, 'string')
  assert.ok(INSUFFICIENT_COMPS_LABEL.length > 0)
})
