// deriveSparklineQuote — the "latest comp" quote behind /api/sparklines.
// Verified against matcher's real fixtures.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveSparklineQuote } from '../src/app/api/sparklines/_lib/sparklineQuote.ts'

function decisionFor(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/quote-tiers-2026-09-07/${name}.decision.json`, import.meta.url), 'utf8'))
}

describe('deriveSparklineQuote against matcher\'s real fixtures', () => {
  test('fresh: median populated, tier fresh', () => {
    const q = deriveSparklineQuote(decisionFor('fresh'))
    assert.equal(q.median, 42.5)
    assert.equal(q.soldCount, 4)
    assert.equal(q.tier, 'fresh')
  })

  test('recent: tier_statistic renders, not the fresh-window statistic', () => {
    const q = deriveSparklineQuote(decisionFor('recent'))
    assert.equal(q.median, 30)
    assert.equal(q.soldCount, 3)
    assert.equal(q.tier, 'recent')
  })

  test('historical: median populated with last-sold fields', () => {
    const q = deriveSparklineQuote(decisionFor('historical'))
    assert.equal(q.median, 22)
    assert.equal(q.tier, 'historical')
    assert.equal(q.lastSoldDate, '2026-02-19')
  })

  test('thin: median null, last-sold populated, soldCount 0 (never a comp count for a suppressed number)', () => {
    const q = deriveSparklineQuote(decisionFor('thin'))
    assert.equal(q.median, null)
    assert.equal(q.tier, 'thin')
    assert.equal(q.lastSoldPrice, 40)
    assert.equal(q.lastSoldDate, '2026-08-08')
  })

  test('none/pre-tier/expired: median null, tier none, no last-sold', () => {
    for (const name of ['none', 'pre-tier', 'expired']) {
      const q = deriveSparklineQuote(decisionFor(name))
      assert.equal(q.median, null, name)
      assert.equal(q.tier, 'none', name)
      assert.equal(q.lastSoldDate, null, name)
    }
  })

  test('undefined decision: median null, tier none', () => {
    const q = deriveSparklineQuote(undefined)
    assert.equal(q.median, null)
    assert.equal(q.tier, 'none')
  })
})
