// Release R (2026-09-06): /today spotlight recency floor relaxed per Steve's
// ruling (STANDALONE-TO-WEB-TODAY-SPOTLIGHT-RULING-2026-09-06). The old
// computeTrend() needed >=3 comps in the last 30 days; with the sold-comps
// pipeline CAPTCHA-walled since ~7/22 that made every pool candidate null.
// computeTrendWindowed() compares the newer vs older half of the comps inside
// the last 90 days. These tests pin: (1) frozen-since-7/22 data still yields a
// trend 46 days later, (2) the 6-comp floor still holds, (3) comps outside the
// window are ignored, (4) computeTrend() itself is unchanged for the figure page.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { computeTrend, computeTrendWindowed } from '../src/app/figure/[figure_id]/_lib/figureFormatters.ts'

const DAY = 86400000
const NOW = Date.parse('2026-09-06T20:00:00Z')
const ago = (days) => new Date(NOW - days * DAY).toISOString()

// Six comps, newest 46 days old (data frozen 7/22), older three cheaper.
const frozen = [
  { price: 20, sold_date: ago(80) }, { price: 20, sold_date: ago(75) }, { price: 20, sold_date: ago(70) },
  { price: 30, sold_date: ago(60) }, { price: 30, sold_date: ago(50) }, { price: 30, sold_date: ago(46) },
]

describe('computeTrendWindowed (today spotlight floor, Option a)', () => {
  test('frozen 7/22 data clears the bar with a 90-day window', () => {
    const t = computeTrendWindowed(frozen, { windowDays: 90, minPerHalf: 3, now: NOW })
    assert.equal(t, 50)
  })
  test('the old 30/30-90 split returns null on the same data (why /today was empty)', () => {
    const realNow = Date.now
    Date.now = () => NOW
    try { assert.equal(computeTrend(frozen), null) } finally { Date.now = realNow }
  })
  test('floor: fewer than 6 comps in-window is null', () => {
    assert.equal(computeTrendWindowed(frozen.slice(1), { now: NOW }), null)
  })
  test('comps older than the window are ignored (and can push a figure under the floor)', () => {
    const stale = frozen.map((h, i) => i < 3 ? { ...h, sold_date: ago(120) } : h)
    assert.equal(computeTrendWindowed(stale, { now: NOW }), null)
  })
  test('bad or future dates are dropped, not NaN', () => {
    const withBad = [...frozen, { price: 999, sold_date: '' }, { price: 999, sold_date: ago(-5) }]
    assert.equal(computeTrendWindowed(withBad, { now: NOW }), 50)
  })
  test('direction: falling prices are negative', () => {
    const down = frozen.map((h, i) => ({ ...h, price: i < 3 ? 40 : 20 }))
    assert.equal(computeTrendWindowed(down, { now: NOW }), -50)
  })
})
