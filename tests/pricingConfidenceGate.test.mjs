import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { dataQualityState, isStaleComp, formatListingFormat, STALE_COMP_DAYS, priceCompTier } from '../src/app/figure/[figure_id]/_lib/figureFormatters.ts'

// Pricing-confidence gate, web's slice (2026-09-22, Steve's go 9/21 ~21:15 ET,
// MATCHER-TO-STANDALONE-WEB-PRICING-GATE-GO-SEQUENCED-WEB-NOW-AGGREGATOR-9-25-
// 2026-09-21.md). The Codex growth review names 6 validation case types before
// any paid pricing product (Bet 2) can ship: good / ambiguous / mismatched /
// mixed-condition / stale / unsupported-price. Web owns the evidence-freshness
// half (this file); match-quality (ambiguous/mismatched) needs match_type_v2 /
// source / confidence_v2 per comp, which stay aggregator-side until matcher's
// 9/25 field-exposure work lands (WEB-TO-STANDALONE-PRICING-CONFIDENCE-GATE-
// SCOPE-ESTIMATE-LABEL-ONLY-DOES-NOT-CLEAR-IT-2026-09-21.md) -- those two
// cases are `test.todo` below, not faked with data the site doesn't have yet.
//
// This tests the pure functions only (house style: see priceContract.test.mjs)
// -- DataQualityBadge/MarketPanel are React server components with no render
// harness in this repo; each describe block below says what its function-level
// fixture proves and what a live-page R10 check should confirm once deployed.

const NOW = new Date('2026-09-22T12:00:00Z')
const daysAgo = n => new Date(NOW.getTime() - n * 86_400_000).toISOString()

describe('case 1: good -- plenty of comps, fresh', () => {
  test('10+ comps, newest sold 5 days ago -> reliable, not stale', () => {
    assert.equal(dataQualityState(12), 'reliable')
    assert.equal(isStaleComp(daysAgo(5), NOW), false)
  })
})

describe('case 5: stale -- comps exist but are old (this ticket\'s own name for it)', () => {
  test('10+ comps, newest sold 200 days ago -> still reliable (count is still true), but isStaleComp flags it', () => {
    assert.equal(dataQualityState(12), 'reliable', 'staleness must NOT silently change the count-based tier -- that would be a second, undiscussed suppression policy')
    assert.equal(isStaleComp(daysAgo(200), NOW), true)
  })
  test('the threshold is a boundary, not a vibe', () => {
    assert.equal(isStaleComp(daysAgo(STALE_COMP_DAYS), NOW), false, 'exactly at the floor is not yet stale')
    assert.equal(isStaleComp(daysAgo(STALE_COMP_DAYS + 1), NOW), true, 'one day past it is')
  })
  test('no dated comp at all is NOT double-flagged as stale -- dataQualityState(0) already says "none"', () => {
    assert.equal(isStaleComp(null, NOW), false)
    assert.equal(isStaleComp(undefined, NOW), false)
  })
  test('a malformed date string fails closed (not stale) rather than throwing or flagging on NaN', () => {
    assert.equal(isStaleComp('not-a-date', NOW), false)
  })
})

describe('case 6: unsupported-price -- no usable evidence at all', () => {
  test('0 comps -> none (already suppresses: DataQualityBadge shows no median claim, priceCompTier agrees)', () => {
    assert.equal(dataQualityState(0), 'none')
    assert.equal(priceCompTier(0), 'suppress')
  })
})

describe('case 4: mixed-condition -- sealed AND loose both real', () => {
  // DataQualityBadge's `mixedConditions` prop (WO-3, 2026-07-17) already
  // covers this: FigureDetailContent passes `sealedPresent && loosePresent`
  // and the badge appends "across conditions" to the comp-count label. No
  // NEW mechanism needed for this ticket -- live check only.
  test.todo('R10 (live, post-deploy): a figure with both sealed and loose data shows "N comps across conditions" on its badge -- mechanism unchanged, verify it still renders after the stale/format edits')
})

describe('per-comp listing_format -- the other review-required fact (dates were already shown via "Latest sold comp")', () => {
  test('known formats get plain-English labels', () => {
    assert.equal(formatListingFormat('buy_it_now'), 'Buy It Now')
    assert.equal(formatListingFormat('auction'), 'Auction')
    assert.equal(formatListingFormat('best_offer'), 'Best Offer')
  })
  test('missing/unrecognized format is an honest "Unknown", not a blank cell or a crash', () => {
    // Matcher's 2026-09-22 D1 distribution: 39% of the 90-day sold window --
    // every `surgical`-match-type row -- carries no listing_format. This is
    // the common case on recent comps, not a rare edge case.
    assert.equal(formatListingFormat(null), 'Format unknown')
    assert.equal(formatListingFormat(undefined), 'Format unknown')
    assert.equal(formatListingFormat(''), 'Format unknown')
    assert.equal(formatListingFormat('surgical'), 'Format unknown', 'an unrecognized raw value fails closed to Unknown, never echoes the raw string verbatim to the page')
  })
})

describe('case 2 + 3: ambiguous / mismatched -- match-quality, not evidence-freshness', () => {
  // These need per-comp match_type_v2 / source / confidence_v2, which the R2
  // price summary does not carry today (verified in figureFormatters.ts's
  // R2Snapshot / PriceData types -- `recent`/`soldHistory` rows have
  // price/title/condition/sold_date/listing_format/condition_effective only).
  // Matcher's aggregator field-exposure work starts 2026-09-25 (after the
  // TMNT/Masterpiece D1 quarantine nights). Faking these two cases against
  // fields that don't exist would validate nothing real -- todo until the
  // aggregator ships, per the go relay's own sequencing.
  test.todo('ambiguous: a comp whose match_type_v2 is not `exact`/`ext_supervised` (e.g. `surgical`, 39% of recent rows per the 9/22 D1 distribution) should read differently from a confirmed exact match -- blocked on per-comp match_type_v2 reaching the site (matcher, 9/25+)')
  test.todo('mismatched: a comp whose figure_id_v2 binding is wrong (KPI 7 measured this at 44.8%/54.5% on TMNT/Masterpiece exact rows pre-guard) should be excluded or flagged, not silently pooled into the median -- blocked on the same per-comp fields, and on which KPI-7-graded lines clear a quality bar (matcher/Steve judgment call, not a web threshold)')
})
