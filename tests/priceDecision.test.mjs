// Phase 1b tier evaluator (section 2b). One fixture per tier + none + the
// tier-drop expiry case + the pre-tier/unsupported-method_version case, per
// PHASE1B-PUBLICATION-DECISION-CONTRACT-2026-09-07.md section 3.6.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluateSoldBucket,
  isQuotable,
  SUPPORTED_METHOD_VERSION,
} from '../src/lib/priceDecision.ts'

const NOW = Date.parse('2026-09-08T00:00:00Z')
const FUTURE = '2026-09-15T00:00:00Z'
const PAST = '2026-09-01T00:00:00Z'

function bucket(overrides) {
  return {
    publishable: true,
    reason: 'ok',
    evidence_type: 'sold_observed',
    count: 5,
    statistic: 42.5,
    valid_until: FUTURE,
    method_version: SUPPORTED_METHOD_VERSION,
    tier: 'fresh',
    window_days: 90,
    label: null,
    last_sold_date: '2026-09-05',
    last_sold_price: 45,
    tier_valid_until: FUTURE,
    ...overrides,
  }
}

describe('evaluateSoldBucket — one fixture per tier', () => {
  test('fresh: quote, no label, JSON-LD eligible', () => {
    const d = evaluateSoldBucket(bucket({ tier: 'fresh', label: null }), NOW)
    assert.equal(d.state, 'quote')
    assert.ok(isQuotable(d))
    if (isQuotable(d)) {
      assert.equal(d.tier, 'fresh')
      assert.equal(d.statistic, 42.5)
      assert.equal(d.jsonLdEligible, true)
      assert.equal(d.label, null)
    }
  })

  test('recent: quote with 6-month label, JSON-LD eligible', () => {
    const d = evaluateSoldBucket(
      bucket({ tier: 'recent', window_days: 180, label: 'based on sales over the last 6 months' }),
      NOW,
    )
    assert.equal(d.state, 'quote')
    if (isQuotable(d)) {
      assert.equal(d.tier, 'recent')
      assert.equal(d.jsonLdEligible, true)
      assert.equal(d.label, 'based on sales over the last 6 months')
    }
  })

  test('historical: quote with last-sold-date label, NOT JSON-LD eligible', () => {
    const d = evaluateSoldBucket(
      bucket({ tier: 'historical', window_days: 270, label: 'last sold 2026-06-01' }),
      NOW,
    )
    assert.equal(d.state, 'quote')
    if (isQuotable(d)) {
      assert.equal(d.tier, 'historical')
      assert.equal(d.jsonLdEligible, false)
    }
  })

  test('thin: last-sold line only, never a statistic', () => {
    const d = evaluateSoldBucket(
      bucket({
        tier: 'thin',
        window_days: 270,
        publishable: false,
        reason: 'thin_evidence',
        statistic: null,
        count: 2,
      }),
      NOW,
    )
    assert.equal(d.state, 'thin')
    assert.ok(!('statistic' in d))
    assert.equal(d.lastSoldPrice, 45)
    assert.equal(d.lastSoldDate, '2026-09-05')
  })

  test('none: unavailable, reason none', () => {
    const d = evaluateSoldBucket(bucket({ tier: 'none', publishable: false, reason: 'no_validated_evidence', statistic: null, count: 0, last_sold_date: null, last_sold_price: null }), NOW)
    assert.equal(d.state, 'unavailable')
    assert.equal(d.reason, 'none')
  })

  test('missing bucket (condition_split_required pooled, etc.): unavailable/missing', () => {
    const d = evaluateSoldBucket(null, NOW)
    assert.equal(d.state, 'unavailable')
    assert.equal(d.reason, 'missing')
  })
})

describe('read-time enforcement', () => {
  test('tier-drop expiry: tier_valid_until in the past -> unavailable/expired even though tier says fresh', () => {
    const d = evaluateSoldBucket(bucket({ tier: 'fresh', tier_valid_until: PAST, valid_until: FUTURE }), NOW)
    assert.equal(d.state, 'unavailable')
    assert.equal(d.reason, 'expired')
  })

  test('cacheUntil is the EARLIER of tier_valid_until and valid_until', () => {
    const d = evaluateSoldBucket(bucket({ tier: 'fresh', tier_valid_until: '2026-09-10T00:00:00Z', valid_until: '2026-09-20T00:00:00Z' }), NOW)
    assert.equal(d.state, 'quote')
    if (isQuotable(d)) assert.equal(d.cacheUntil, '2026-09-10T00:00:00Z')
  })

  test('unsupported method_version (pre-tier phase1b-2026-09-07): unavailable, never rendered', () => {
    const d = evaluateSoldBucket(bucket({ method_version: 'phase1b-2026-09-07' }), NOW)
    assert.equal(d.state, 'unavailable')
    assert.equal(d.reason, 'unsupported_method_version')
  })

  test('unmigrated snapshot (no decision block at all): missing', () => {
    const d = evaluateSoldBucket(undefined, NOW)
    assert.equal(d.state, 'unavailable')
    assert.equal(d.reason, 'missing')
  })

  test('contract violation: fresh tier but publishable:false -> fail closed, not a rendered number', () => {
    const d = evaluateSoldBucket(bucket({ tier: 'fresh', publishable: false }), NOW)
    assert.equal(d.state, 'unavailable')
  })

  test('contract violation: fresh tier but statistic null -> fail closed', () => {
    const d = evaluateSoldBucket(bucket({ tier: 'fresh', statistic: null }), NOW)
    assert.equal(d.state, 'unavailable')
  })
})
