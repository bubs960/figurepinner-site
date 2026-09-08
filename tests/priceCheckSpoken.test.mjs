// primaryQuote / spokenLine — the pure helpers behind /api/v1/price-check's
// Phase 1b tiered response. Verified against matcher's real fixtures.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveTieredPriceContract } from '../src/app/figure/[figure_id]/_lib/priceContract.ts'
import { primaryQuote, spokenLine } from '../src/app/api/v1/price-check/_lib/priceCheckSpoken.ts'

const NOW = Date.parse('2026-09-07T13:00:00Z')

function contractFor(name) {
  const dec = JSON.parse(readFileSync(new URL(`./fixtures/quote-tiers-2026-09-07/${name}.decision.json`, import.meta.url), 'utf8'))
  return deriveTieredPriceContract(dec, NOW)
}

describe('primaryQuote', () => {
  test('picks sealed when sealed is usable (fresh fixture)', () => {
    const q = primaryQuote(contractFor('fresh'))
    assert.equal(q.condition, 'sealed')
    assert.equal(q.median, 42.5)
  })

  test('picks loose when sealed is not usable (historical fixture)', () => {
    const q = primaryQuote(contractFor('historical'))
    assert.equal(q.condition, 'loose')
    assert.equal(q.median, 22)
  })

  test('none fixture: no quote at all', () => {
    assert.equal(primaryQuote(contractFor('none')), null)
  })

  test('pre-tier / expired fixtures: no quote (unsupported / expired, not a stale number)', () => {
    assert.equal(primaryQuote(contractFor('pre-tier')), null)
    assert.equal(primaryQuote(contractFor('expired')), null)
  })
})

describe('spokenLine', () => {
  test('fresh: plain median line, no caveat', () => {
    const s = spokenLine('Batista', 'Jakks', 'Deluxe Aggression', primaryQuote(contractFor('fresh')))
    assert.match(s, /^Batista, Jakks Deluxe Aggression: median \$42\.50 from 4 sold\.$/)
  })

  test('recent: 6-month caveat', () => {
    const s = spokenLine('Fixture', 'Brand', 'Line', primaryQuote(contractFor('recent')))
    assert.match(s, /based on sales over the last 6 months\.$/)
  })

  test('historical: last-sold-date caveat', () => {
    const s = spokenLine('Fixture', 'Brand', 'Line', primaryQuote(contractFor('historical')))
    assert.match(s, /last sold 2026-02-19, older evidence\.$/)
  })

  test('thin: last-sold line, no median spoken', () => {
    const s = spokenLine('Fixture', 'Brand', 'Line', primaryQuote(contractFor('thin')))
    assert.match(s, /^Fixture, Brand: last sold 2026-08-08 for \$40, not enough recent sales for a median\.$/)
  })

  test('none: honest no-data line', () => {
    const s = spokenLine('Fixture', 'Brand', 'Line', primaryQuote(contractFor('none')))
    assert.equal(s, 'Fixture, Brand: no sold sales on record yet.')
  })
})
