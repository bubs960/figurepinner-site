// PriceBlock's Phase 1b helpers (usable, thinEvidence, tierCaption) --
// verified against matcher's real fixtures via deriveTieredPriceContract,
// the same contract FigureDetailContent now passes into PriceBlock's
// sealed/loose props.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveTieredPriceContract } from '../src/app/figure/[figure_id]/_lib/priceContract.ts'
import { usable, thinEvidence, tierCaption } from '../src/app/figure/[figure_id]/_lib/priceBlockView.ts'

function contractFor(name) {
  const dec = JSON.parse(readFileSync(new URL(`./fixtures/quote-tiers-2026-09-07/${name}.decision.json`, import.meta.url), 'utf8'))
  return deriveTieredPriceContract(dec, Date.parse('2026-09-07T13:00:00Z'))
}

describe('PriceBlock tiered helpers against matcher\'s real fixtures', () => {
  test('fresh: usable, plain "last 90 days" caption, not thin', () => {
    const c = contractFor('fresh')
    assert.equal(usable(c.sealed), true)
    assert.equal(thinEvidence(c.sealed), null)
    assert.equal(tierCaption(c.sealed), 'median, last 90 days')
  })

  test('recent: usable, 6-month caption', () => {
    const c = contractFor('recent')
    assert.equal(usable(c.sealed), true)
    assert.equal(tierCaption(c.sealed), 'median, based on sales over the last 6 months')
  })

  test('historical: usable, last-sold-date caption verbatim from the API label', () => {
    const c = contractFor('historical')
    assert.equal(usable(c.loose), true)
    assert.equal(tierCaption(c.loose), 'median · last sold 2026-02-19, older evidence')
  })

  test('thin: NOT usable, thinEvidence returns the last-sold pair', () => {
    const c = contractFor('thin')
    assert.equal(usable(c.sealed), false)
    const t = thinEvidence(c.sealed)
    assert.ok(t)
    assert.equal(t.price, 40)
    assert.equal(t.date, '2026-08-08')
  })

  test('none/pre-tier/expired: neither usable nor thin (bucket is null -- condition not rendered at all)', () => {
    for (const name of ['none', 'pre-tier', 'expired']) {
      const c = contractFor(name)
      assert.equal(c.sealed, null, name)
      assert.equal(usable(c.sealed), false, name)
      assert.equal(thinEvidence(c.sealed), null, name)
    }
  })

  test('null bucket: neither usable nor thin', () => {
    assert.equal(usable(null), false)
    assert.equal(thinEvidence(null), null)
  })
})
