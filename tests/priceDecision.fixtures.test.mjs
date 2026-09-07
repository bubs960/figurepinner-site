// Drives evaluateSoldBucket() against matcher's REAL cron-generated fixtures
// (Bridge/fixtures/quote-tiers-2026-09-07/, copied into tests/fixtures/ —
// see MATCHER-TO-WEB-QUOTE-TIER-FIXTURES-AND-CONFIRMS-2026-09-07.md).
// Fixed clock matches the fixtures' generation time (2026-09-07T12:00:00Z);
// tests use a NOW just after it so `expired` is genuinely past and the
// live tiers are genuinely future.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { evaluateSoldBucket, isQuotable } from '../src/lib/priceDecision.ts'

const NOW = Date.parse('2026-09-07T13:00:00Z')

function load(name) {
  const d = JSON.parse(readFileSync(new URL(`./fixtures/quote-tiers-2026-09-07/${name}.decision.json`, import.meta.url), 'utf8'))
  return d
}

describe('priceDecision against matcher\'s real fixtures', () => {
  test('fresh: sealed quotes 42.5, no label, JSON-LD eligible', () => {
    const dec = load('fresh')
    const d = evaluateSoldBucket(dec.sold_sealed, NOW)
    assert.equal(d.state, 'quote')
    if (isQuotable(d)) {
      assert.equal(d.tier, 'fresh')
      assert.equal(d.statistic, 42.5)
      assert.equal(d.label, null)
      assert.equal(d.jsonLdEligible, true)
    }
  })

  test('fresh: loose bucket (no evidence) is unavailable/none', () => {
    const dec = load('fresh')
    const d = evaluateSoldBucket(dec.sold_loose, NOW)
    assert.equal(d.state, 'unavailable')
    assert.equal(d.reason, 'none')
  })

  test('fresh: pooled bucket is condition_split_required (tier none) -> unavailable', () => {
    const dec = load('fresh')
    const d = evaluateSoldBucket(dec.sold_pooled, NOW)
    assert.equal(d.state, 'unavailable')
  })

  test('recent: renders tier_statistic (30), NOT the fresh-window statistic/count (count:0)', () => {
    const dec = load('recent')
    const b = dec.sold_sealed
    assert.equal(b.count, 0) // fresh-window count is 0 — must not be what renders
    assert.equal(b.tier_statistic, 30)
    const d = evaluateSoldBucket(b, NOW)
    assert.equal(d.state, 'quote')
    if (isQuotable(d)) {
      assert.equal(d.tier, 'recent')
      assert.equal(d.statistic, 30)
      assert.equal(d.count, 3) // tier_count, not the fresh-window count
      assert.equal(d.label, 'based on sales over the last 6 months')
      assert.equal(d.jsonLdEligible, true)
    }
  })

  test('historical: last-sold-date label, NOT JSON-LD eligible', () => {
    const dec = load('historical')
    const b = dec.sold_loose // historical fixture's tiered bucket is sold_loose
    const d = evaluateSoldBucket(b, NOW)
    assert.equal(d.state, 'quote')
    if (isQuotable(d)) {
      assert.equal(d.tier, 'historical')
      assert.equal(d.statistic, 22)
      assert.equal(d.label, 'last sold 2026-02-19')
      assert.equal(d.jsonLdEligible, false)
    }
  })

  test('thin: last-sold line verbatim ("$40.00", two decimals), no statistic rendered', () => {
    const dec = load('thin')
    const b = dec.sold_sealed
    assert.equal(b.label, 'last sold 2026-08-08, $40.00')
    const d = evaluateSoldBucket(b, NOW)
    assert.equal(d.state, 'thin')
    assert.equal(d.lastSoldDate, '2026-08-08')
    assert.equal(d.lastSoldPrice, 40)
    assert.ok(!('statistic' in d))
  })

  test('none: unavailable/none across all three buckets', () => {
    const dec = load('none')
    for (const key of ['sold_sealed', 'sold_loose', 'sold_pooled']) {
      const d = evaluateSoldBucket(dec[key], NOW)
      assert.equal(d.state, 'unavailable')
    }
  })

  test('pre-tier (method_version phase1b-2026-09-07, no tier fields): unsupported, never renders', () => {
    const dec = load('pre-tier')
    const d = evaluateSoldBucket(dec.sold_sealed, NOW)
    assert.equal(d.state, 'unavailable')
    assert.equal(d.reason, 'unsupported_method_version')
  })

  test('expired (tier_valid_until already past the fixed clock): unavailable/expired even though tier=recent', () => {
    const dec = load('expired')
    const b = dec.sold_sealed
    assert.equal(b.tier, 'recent')
    assert.ok(Date.parse(b.tier_valid_until) < NOW)
    const d = evaluateSoldBucket(b, NOW)
    assert.equal(d.state, 'unavailable')
    assert.equal(d.reason, 'expired')
  })
})
