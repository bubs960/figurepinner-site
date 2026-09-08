// deriveLiveMedianView — the pure render-state logic behind LiveMedian.tsx.
// Verified against matcher's real fixtures. No React-render harness needed
// (or available in this repo) since the logic is split out as plain data.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveLiveMedianView } from '../src/app/guides/_lib/liveMedianView.ts'

function snapFor(name) {
  const dec = JSON.parse(readFileSync(new URL(`./fixtures/quote-tiers-2026-09-07/${name}.decision.json`, import.meta.url), 'utf8'))
  return { median_sold: null, avg_sold: null, min_sold: null, max_sold: null, sold_count: 0, decision: dec }
}

describe('deriveLiveMedianView against matcher\'s real fixtures', () => {
  test('fresh: quote, no caveat', () => {
    const v = deriveLiveMedianView(snapFor('fresh'))
    assert.equal(v.hasData, true)
    if (v.hasData) {
      assert.equal(v.median, 42.5)
      assert.equal(v.count, 4)
      assert.equal(v.evidenceCaveat, null)
    }
  })

  test('recent: quote with the 6-month caveat', () => {
    const v = deriveLiveMedianView(snapFor('recent'))
    assert.equal(v.hasData, true)
    if (v.hasData) {
      assert.equal(v.median, 30)
      assert.equal(v.evidenceCaveat, 'based on last 6 months')
    }
  })

  test('historical: quote with a formatted last-sold-date caveat', () => {
    const v = deriveLiveMedianView(snapFor('historical'))
    assert.equal(v.hasData, true)
    if (v.hasData) {
      assert.equal(v.median, 22)
      assert.equal(v.evidenceCaveat, 'last sold Feb 19')
    }
  })

  test('thin: NOT hasData, isThin with the raw last-sold price/date', () => {
    const v = deriveLiveMedianView(snapFor('thin'))
    assert.equal(v.hasData, false)
    assert.equal(v.isThin, true)
    if (v.isThin) {
      assert.equal(v.lastSoldPrice, 40)
      assert.equal(v.lastSoldDate, '2026-08-08')
    }
  })

  test('none/pre-tier/expired: neither hasData nor isThin (honest blank)', () => {
    for (const name of ['none', 'pre-tier', 'expired']) {
      const v = deriveLiveMedianView(snapFor(name))
      assert.equal(v.hasData, false, name)
      assert.equal(v.isThin, false, name)
    }
  })

  test('no snapshot at all: honest blank', () => {
    const v = deriveLiveMedianView(null)
    assert.equal(v.hasData, false)
    assert.equal(v.isThin, false)
  })

  test('undefined snapshot: honest blank', () => {
    const v = deriveLiveMedianView(undefined)
    assert.equal(v.hasData, false)
    assert.equal(v.isThin, false)
  })
})
