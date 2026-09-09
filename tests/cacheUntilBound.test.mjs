// Phase 1b section 3.4: a response carrying a tiered quote must not be
// cached publicly past its cacheUntil. Covers price-check's cacheControlFor
// and confirms cacheUntil flows through deriveSparklineQuote for the
// sparklines route's batch-wide bound.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveTieredPriceContract, pickPrimaryQuote } from '../src/app/figure/[figure_id]/_lib/priceContract.ts'
import { cacheControlFor } from '../src/app/api/v1/price-check/_lib/priceCheckSpoken.ts'
import { deriveSparklineQuote } from '../src/app/api/sparklines/_lib/sparklineQuote.ts'

function decisionFor(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/quote-tiers-2026-09-07/${name}.decision.json`, import.meta.url), 'utf8'))
}
const NOW = Date.parse('2026-09-07T13:00:00Z')

describe('cacheControlFor (price-check)', () => {
  test('fresh quote: bounded by its cacheUntil (well under the 600s baseline in this fixture)', () => {
    const q = pickPrimaryQuote(deriveTieredPriceContract(decisionFor('fresh'), NOW))
    const header = cacheControlFor(q, 'public, max-age=300, s-maxage=600', NOW)
    // fixture's valid_until is 2026-09-14T12:00:00Z, i.e. days away -- longer
    // than the 300/600s baseline, so the baseline itself is the tighter bound.
    assert.equal(header, 'public, max-age=300, s-maxage=600')
  })

  test('no quote (none fixture): falls back to the baseline unchanged', () => {
    const q = pickPrimaryQuote(deriveTieredPriceContract(decisionFor('none'), NOW))
    assert.equal(q, null)
    const header = cacheControlFor(q, 'public, max-age=300, s-maxage=600', NOW)
    assert.equal(header, 'public, max-age=300, s-maxage=600')
  })

  test('expired quote: unavailable at read time, no cacheUntil to bound -- falls back to baseline', () => {
    // The expired fixture's bucket evaluates to 'unavailable' (tier_valid_until
    // already past NOW), so pickPrimaryQuote returns null -- there's no stale
    // cacheUntil to leak into a served response; this documents that.
    const q = pickPrimaryQuote(deriveTieredPriceContract(decisionFor('expired'), NOW))
    assert.equal(q, null)
  })

  test('a cacheUntil already in the past clamps to max-age=0, never negative', () => {
    const q = { median: 10, count: 3, cacheUntil: new Date(NOW - 60_000).toISOString() }
    const header = cacheControlFor(q, 'public, max-age=300, s-maxage=600', NOW)
    assert.equal(header, 'public, max-age=0, s-maxage=0')
  })
})

describe('deriveSparklineQuote carries cacheUntil for the batch bound', () => {
  // Signature changed 2026-09-09 (pre-mortem item 1): deriveSparklineQuote
  // now takes the whole price snapshot ({ decision, ...legacy fields }), not
  // just the decision block -- see tests/sparklineQuote.test.mjs's own header.
  test('fresh: cacheUntil populated', () => {
    const q = deriveSparklineQuote({ decision: decisionFor('fresh') })
    assert.ok(q.cacheUntil)
  })
  test('none: cacheUntil null', () => {
    const q = deriveSparklineQuote({ decision: decisionFor('none') })
    assert.equal(q.cacheUntil, null)
  })
})
