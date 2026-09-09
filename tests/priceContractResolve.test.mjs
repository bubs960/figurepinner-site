// resolvePriceContract / isMigratedSnapshot -- pre-mortem item 1
// (CODEX-PREMORTEM-QUOTE-TIER-RELEASE-2026-09-09.md, 5x5 top-scored risk;
// MATCHER-TO-WEB-STANDALONE-PREMORTEM-VERDICT-DECOUPLE-9-9-2026-09-08.md
// item 1): a snapshot that has not yet been regenerated under Phase 1b
// tiers must fall back to today's legacy derivation, never "unavailable".
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  resolvePriceContract,
  isMigratedSnapshot,
  derivePriceContract,
  pickPrimaryQuote,
} from '../src/app/figure/[figure_id]/_lib/priceContract.ts'

const NOW = Date.parse('2026-09-07T13:00:00Z')

function load(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/quote-tiers-2026-09-07/${name}.decision.json`, import.meta.url), 'utf8'))
}

describe('isMigratedSnapshot', () => {
  test('no decision block -> false', () => {
    assert.equal(isMigratedSnapshot(undefined), false)
    assert.equal(isMigratedSnapshot(null), false)
  })

  test('decision present but every bucket carries the OLDER pre-tier method_version -> false', () => {
    assert.equal(isMigratedSnapshot(load('pre-tier')), false)
  })

  test('decision present with the supported method_version on at least one bucket -> true', () => {
    assert.equal(isMigratedSnapshot(load('fresh')), true)
    assert.equal(isMigratedSnapshot(load('none')), true) // 'none' tier is still a REGENERATED, supported snapshot
  })
})

describe('resolvePriceContract — the transition-safe entry point', () => {
  test('no decision at all -> identical to calling derivePriceContract directly (today\'s production behavior, unchanged)', () => {
    const legacyInput = { soldCount: 12, medianSold: 44, avgSold: null, sealed: null, loose: null }
    const resolved = resolvePriceContract(legacyInput, NOW)
    const direct = derivePriceContract(legacyInput)
    assert.deepEqual(resolved, direct)
    assert.equal(resolved.hasNoData, false)
    assert.equal(resolved.pooled.median, 44)
  })

  test('decision present but pre-tier method_version -> falls back to legacy fields, NOT unavailable', () => {
    const dec = load('pre-tier')
    const price = { soldCount: 4, medianSold: 42.5, avgSold: null, sealed: null, loose: null, decision: dec }
    const resolved = resolvePriceContract(price, NOW)
    // Must NOT be the tiered "unsupported_method_version -> hasNoData" path.
    assert.equal(resolved.hasNoData, false)
    assert.equal(resolved.pooled.median, 42.5)
    assert.equal(resolved.pooled.count, 4)
    // Legacy path never sets evidenceTier -- consumers must see it absent,
    // not accidentally inherit a stale tiered value.
    assert.equal(resolved.pooled.evidenceTier, undefined)
  })

  test('decision present with a genuinely zero-comp legacy figure AND no supported decision -> hasNoData (matches derivePriceContract on soldCount 0)', () => {
    const price = { soldCount: 0, medianSold: null, avgSold: null, sealed: null, loose: null, decision: undefined }
    const resolved = resolvePriceContract(price, NOW)
    assert.equal(resolved.hasNoData, true)
  })

  test('migrated fresh snapshot -> uses the tiered path (real evidenceTier, jsonLdEligible)', () => {
    const dec = load('fresh')
    const price = { soldCount: 4, medianSold: 999, avgSold: null, sealed: null, loose: null, decision: dec }
    const resolved = resolvePriceContract(price, NOW)
    assert.equal(resolved.sealed.evidenceTier, 'fresh')
    // Proves the TIERED number won, not the deliberately-wrong legacy stand-in (999) above.
    assert.notEqual(resolved.sealed.median, 999)
  })

  test('migrated "none" snapshot (regenerated, zero validated evidence) -> hasNoData true even if stale legacy fields still carry an old number', () => {
    const dec = load('none')
    const price = { soldCount: 9, medianSold: 30, avgSold: null, sealed: null, loose: null, decision: dec }
    const resolved = resolvePriceContract(price, NOW)
    // Once migrated, the tiered path owns the answer -- it must NOT silently
    // fall back to the stale legacy median (30) just because one exists.
    assert.equal(resolved.hasNoData, true)
  })

  test('legacy pooled fallback now carries .count (fix alongside item 1: was undefined, silently zeroed sample_size/soldCount at every consumer that reads it bare)', () => {
    const price = { soldCount: 17, medianSold: 55, avgSold: null, sealed: null, loose: null }
    const contract = derivePriceContract(price)
    assert.equal(contract.pooled.count, 17)
    const quote = pickPrimaryQuote(contract)
    assert.equal(quote.count, 17)
  })
})
