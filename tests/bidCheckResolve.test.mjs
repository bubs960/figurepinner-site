// Release S (2026-09-07): Bid Check must never quote a number from a
// different classifier than the placard/ledger. Pins the Vader case from the
// 9/6 external audit (snapshot loose = 1, item-condition sample 'used' = 30).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { resolveBidColumns, columnQuotable, snapshotHasSplit } from '../src/app/figure/[figure_id]/_lib/bidCheckResolve.ts'

const thirty = Array.from({ length: 30 }, (_, i) => 20 + i)

describe('resolveBidColumns', () => {
  test('Vader: thin snapshot loose bucket -> blank, never the 30-comp item-condition sample', () => {
    const [n, u] = resolveBidColumns({ segmentation: 'sealed-only', sealedMedian: 28.99, sealedCount: 7, looseMedian: null, looseCount: 1, newPrices: [], usedPrices: thirty })
    assert.equal(u.source, 'snapshot'); assert.equal(u.n, 1); assert.equal(columnQuotable(u), false)
    assert.equal(n.source, 'snapshot'); assert.equal(n.med, 28.99); assert.equal(columnQuotable(n), true)
  })
  test('pooled snapshot with zero bucket counts -> recent sample, labelled', () => {
    const [n, u] = resolveBidColumns({ segmentation: 'pooled', sealedMedian: null, sealedCount: 0, looseMedian: null, looseCount: 0, newPrices: [30, 32, 31], usedPrices: thirty })
    assert.equal(n.source, 'sample'); assert.equal(n.med, 31); assert.equal(u.n, 30)
  })
  test('pooled label but real buckets underneath -> snapshot (transparent-split class, 2026-07-17)', () => {
    const [, u] = resolveBidColumns({ segmentation: 'pooled', sealedMedian: 40, sealedCount: 12, looseMedian: 22, looseCount: 5, newPrices: [1], usedPrices: thirty })
    assert.equal(u.source, 'snapshot'); assert.equal(u.med, 22); assert.equal(u.n, 5)
  })
  test('floor is 3 and a zero median is never quotable', () => {
    assert.equal(columnQuotable({ key: 'new', med: 10, n: 2, source: 'snapshot' }), false)
    assert.equal(columnQuotable({ key: 'new', med: 10, n: 3, source: 'snapshot' }), true)
    assert.equal(columnQuotable({ key: 'new', med: 0, n: 9, source: 'snapshot' }), false)
    assert.equal(snapshotHasSplit({ segmentation: 'pooled', sealedCount: 0, looseCount: 0 }), false)
  })
})
