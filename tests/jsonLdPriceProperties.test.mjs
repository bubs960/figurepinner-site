// jsonLdPriceProperties -- pre-mortem item 4/10 (2026-09-08): "JSON-LD
// additionalProperty publishes historical medians unlabelled." Contract 2b:
// JSON-LD offers are eligible for fresh + recent only, never historical.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { jsonLdPriceProperties } from '../src/app/figure/[figure_id]/_lib/jsonLdPriceProperties.ts'
import { deriveTieredPriceContract, derivePriceContract } from '../src/app/figure/[figure_id]/_lib/priceContract.ts'

const NOW = Date.parse('2026-09-07T13:00:00Z')

function load(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/quote-tiers-2026-09-07/${name}.decision.json`, import.meta.url), 'utf8'))
}

describe('jsonLdPriceProperties', () => {
  test('fresh tier -> one PropertyValue, no age caveat in the name', () => {
    const c = deriveTieredPriceContract(load('fresh'), NOW)
    const props = jsonLdPriceProperties(c)
    assert.equal(props.length, 1)
    assert.doesNotMatch(props[0].name, /based on|older evidence/)
  })

  test('recent tier -> included, name carries the 6-month age caveat (item 10: no consumer previously labelled this)', () => {
    const c = deriveTieredPriceContract(load('recent'), NOW)
    const props = jsonLdPriceProperties(c)
    assert.ok(props.length >= 1)
    assert.ok(props.some((p) => /based on sales over the last 6 months/.test(p.name)))
  })

  test('historical tier -> EXCLUDED entirely (contract 2b: offers eligible for fresh+recent only), not shown unlabelled', () => {
    // Fixture: sold_loose is the historical-tier bucket, sold_sealed is 'none'.
    const c = deriveTieredPriceContract(load('historical'), NOW)
    assert.equal(c.loose?.evidenceTier, 'historical', 'fixture precondition')
    const props = jsonLdPriceProperties(c)
    assert.deepEqual(props, [], 'a historical-only contract must emit zero JSON-LD price properties, never a bare unlabelled median')
  })

  test('thin tier -> no median exists, so no PropertyValue for that condition either way', () => {
    const c = deriveTieredPriceContract(load('thin'), NOW)
    const props = jsonLdPriceProperties(c)
    assert.ok(props.every((p) => !/\bthin\b/i.test(p.name)))
  })

  test('none tier (regenerated, zero evidence) -> zero properties', () => {
    const c = deriveTieredPriceContract(load('none'), NOW)
    assert.deepEqual(jsonLdPriceProperties(c), [])
  })

  test('legacy (unmigrated) figure -> included exactly as production does today, no regression from the historical gate', () => {
    const c = derivePriceContract({ soldCount: 12, medianSold: 44, avgSold: null, sealed: null, loose: null })
    const props = jsonLdPriceProperties(c)
    assert.equal(props.length, 1)
    assert.equal(props[0].name, 'Median sold price')
    assert.equal(props[0].value, '$44')
  })

  test('both conditions present, one fresh one historical -> only the eligible one appears', () => {
    const c = {
      hasNoData: false,
      hasBothConditions: true,
      sealed: { condition: 'sealed', label: 'Sealed / carded', median: 100, count: 5, tier: 'trustworthy', needsThinDataLabel: false, evidenceTier: 'fresh' },
      loose: { condition: 'loose', label: 'Loose / opened', median: 20, count: 5, tier: 'trustworthy', needsThinDataLabel: false, evidenceTier: 'historical', evidenceLabel: 'last sold 2026-02-19' },
      pooled: null,
    }
    const props = jsonLdPriceProperties(c)
    assert.equal(props.length, 1)
    assert.match(props[0].name, /^Sealed \/ carded median sold price$/)
  })
})
