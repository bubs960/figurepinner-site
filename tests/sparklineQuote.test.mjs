// deriveSparklineQuote — the "latest comp" quote behind /api/sparklines.
// Verified against matcher's real fixtures.
//
// Signature changed 2026-09-09 (pre-mortem item 1): the function now takes
// the whole price snapshot ({ median_sold, avg_sold, sold_count, decision })
// instead of just the decision block, so an unmigrated snapshot can fall
// back to its legacy fields (resolvePriceContract) instead of going silent.
// Fixtures below are wrapped as { decision: <fixture> } with no legacy
// fields, which is deliberate: it keeps every existing expectation for a
// TIERED fixture unchanged, and the pre-tier/none/expired case still
// legitimately resolves to "no data" because no legacy median/soldCount was
// supplied either -- see the dedicated fallback test at the bottom for the
// case where legacy fields ARE present.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveSparklineQuote } from '../src/app/api/sparklines/_lib/sparklineQuote.ts'

function decisionFor(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/quote-tiers-2026-09-07/${name}.decision.json`, import.meta.url), 'utf8'))
}

describe('deriveSparklineQuote against matcher\'s real fixtures', () => {
  test('fresh: median populated, tier fresh', () => {
    const q = deriveSparklineQuote({ decision: decisionFor('fresh') })
    assert.equal(q.median, 42.5)
    assert.equal(q.soldCount, 4)
    assert.equal(q.tier, 'fresh')
  })

  test('recent: tier_statistic renders, not the fresh-window statistic', () => {
    const q = deriveSparklineQuote({ decision: decisionFor('recent') })
    assert.equal(q.median, 30)
    assert.equal(q.soldCount, 3)
    assert.equal(q.tier, 'recent')
  })

  test('historical: median populated with last-sold fields', () => {
    const q = deriveSparklineQuote({ decision: decisionFor('historical') })
    assert.equal(q.median, 22)
    assert.equal(q.tier, 'historical')
    assert.equal(q.lastSoldDate, '2026-02-19')
  })

  test('thin: median null, last-sold populated, soldCount 0 (never a comp count for a suppressed number)', () => {
    const q = deriveSparklineQuote({ decision: decisionFor('thin') })
    assert.equal(q.median, null)
    assert.equal(q.tier, 'thin')
    assert.equal(q.lastSoldPrice, 40)
    assert.equal(q.lastSoldDate, '2026-08-08')
  })

  test('none/pre-tier/expired, no legacy fields supplied: median null, tier none, no last-sold', () => {
    for (const name of ['none', 'pre-tier', 'expired']) {
      const q = deriveSparklineQuote({ decision: decisionFor(name) })
      assert.equal(q.median, null, name)
      assert.equal(q.tier, 'none', name)
      assert.equal(q.lastSoldDate, null, name)
    }
  })

  test('undefined price object: median null, tier none', () => {
    const q = deriveSparklineQuote(undefined)
    assert.equal(q.median, null)
    assert.equal(q.tier, 'none')
  })
})

describe('deriveSparklineQuote — pre-mortem item 1 fallback (2026-09-08)', () => {
  test('pre-tier decision WITH legacy fields present -> falls back to the legacy median, not null', () => {
    const q = deriveSparklineQuote({ median_sold: 61, avg_sold: null, sold_count: 9, decision: decisionFor('pre-tier') })
    assert.equal(q.median, 61)
    assert.equal(q.soldCount, 9)
    assert.equal(q.tier, 'none') // honest: we don't know a tier for a legacy quote
  })

  test('no decision at all, legacy fields present -> same legacy fallback (today\'s production behavior)', () => {
    const q = deriveSparklineQuote({ median_sold: 18, avg_sold: null, sold_count: 6, decision: undefined })
    assert.equal(q.median, 18)
    assert.equal(q.soldCount, 6)
  })

  test('migrated "none" decision WITH stale legacy fields still present -> hasNoData wins, never the stale legacy number', () => {
    const q = deriveSparklineQuote({ median_sold: 999, avg_sold: null, sold_count: 9, decision: decisionFor('none') })
    assert.equal(q.median, null)
    assert.equal(q.tier, 'none')
  })
})
