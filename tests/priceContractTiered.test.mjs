// deriveTieredPriceContract — Phase 1b section 2b sibling of derivePriceContract.
// Verified against matcher's real fixtures (tests/fixtures/quote-tiers-2026-09-07/),
// same set priceDecision.fixtures.test.mjs uses. NOT wired to any consumer yet.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveTieredPriceContract } from '../src/app/figure/[figure_id]/_lib/priceContract.ts'

const NOW = Date.parse('2026-09-07T13:00:00Z')

function load(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/quote-tiers-2026-09-07/${name}.decision.json`, import.meta.url), 'utf8'))
}

describe('deriveTieredPriceContract', () => {
  test('null/undefined input -> hasNoData', () => {
    const c = deriveTieredPriceContract(undefined, NOW)
    assert.equal(c.hasNoData, true)
    assert.equal(c.sealed, null)
    assert.equal(c.loose, null)
    assert.equal(c.pooled, null)
  })

  test('fresh fixture: sealed quotes, loose has no evidence, no pooled fallback (sealed usable blocks it)', () => {
    const dec = load('fresh')
    const c = deriveTieredPriceContract(dec, NOW)
    assert.equal(c.hasNoData, false)
    assert.ok(c.sealed)
    assert.equal(c.sealed.median, 42.5)
    assert.equal(c.sealed.evidenceTier, 'fresh')
    assert.equal(c.sealed.evidenceLabel, null)
    assert.equal(c.sealed.jsonLdEligible, true)
    assert.equal(c.loose, null) // sold_loose has no validated evidence
    assert.equal(c.pooled, null) // sealed is usable, so pooled fallback is blocked
    // hasBothConditions checks bucket PRESENCE, not usability -- sold_loose
    // exists on the fixture (as an unavailable bucket) so both are "present"
    assert.equal(c.hasBothConditions, true)
  })

  test('recent fixture: sealed renders tier_statistic/tier_count, 6-month label, JSON-LD eligible', () => {
    const dec = load('recent')
    const c = deriveTieredPriceContract(dec, NOW)
    assert.ok(c.sealed)
    assert.equal(c.sealed.median, 30)
    assert.equal(c.sealed.count, 3)
    assert.equal(c.sealed.evidenceTier, 'recent')
    assert.equal(c.sealed.evidenceLabel, 'based on sales over the last 6 months')
    assert.equal(c.sealed.jsonLdEligible, true)
  })

  test('historical fixture: loose renders with last-sold-date label, NOT JSON-LD eligible', () => {
    const dec = load('historical')
    const c = deriveTieredPriceContract(dec, NOW)
    assert.ok(c.loose)
    assert.equal(c.loose.median, 22)
    assert.equal(c.loose.evidenceTier, 'historical')
    assert.equal(c.loose.evidenceLabel, 'last sold 2026-02-19')
    assert.equal(c.loose.jsonLdEligible, false)
  })

  test('thin fixture: sealed renders median:null (never a statistic) with last-sold populated', () => {
    const dec = load('thin')
    const c = deriveTieredPriceContract(dec, NOW)
    assert.ok(c.sealed)
    assert.equal(c.sealed.median, null)
    assert.equal(c.sealed.evidenceTier, 'thin')
    assert.equal(c.sealed.lastSoldDate, '2026-08-08')
    assert.equal(c.sealed.lastSoldPrice, 40)
    assert.equal(c.sealed.jsonLdEligible, false)
  })

  test('none fixture: hasNoData -- no legacy pooled fallback even if the snapshot had raw numbers elsewhere', () => {
    const dec = load('none')
    const c = deriveTieredPriceContract(dec, NOW)
    assert.equal(c.sealed, null)
    assert.equal(c.loose, null)
    assert.equal(c.pooled, null)
    assert.equal(c.hasNoData, true)
  })

  test('pre-tier fixture (unsupported method_version): unavailable, contract does not quote it', () => {
    const dec = load('pre-tier')
    const c = deriveTieredPriceContract(dec, NOW)
    assert.equal(c.sealed, null)
    assert.equal(c.hasNoData, true)
  })

  test('expired fixture: unavailable even though tier=recent, since tier_valid_until has passed', () => {
    const dec = load('expired')
    const c = deriveTieredPriceContract(dec, NOW)
    assert.equal(c.sealed, null)
    assert.equal(c.hasNoData, true)
  })
})
