// bidCheckResolve.ts — Bid Check's column source, as a pure function so the
// rule is testable and cannot drift from the placard/ledger again.
//
// Release S (2026-09-07, external audit F1, reproduced on Darth Vader ANH):
// Bid Check showed "Used · Median $28 · 30 sales" beside a condition table
// saying "Loose: 1 sale on record -- not enough to quote". Cause: when the
// snapshot's bucket was under MIN_COMPS_TO_QUOTE the old resolver fell back
// to the recent ~30-comp sample split by eBay ITEM CONDITION (untagged = used),
// a different classifier from the snapshot's title-based sealed/loose split.
// Two classifiers, one label.
//
// Rule now: if the snapshot carries a condition split at all, it is the ONLY
// source -- a thin bucket is an honest blank with its count, never a number
// from another classifier. The recent-sample split survives only for pooled
// figures whose snapshot has no bucket data, and is labelled as such.

import { MIN_COMPS_TO_QUOTE } from './figureFormatters'

export type BidColumnSource = 'snapshot' | 'sample'

export interface BidColumn {
  key: 'new' | 'used'
  med: number
  n: number
  source: BidColumnSource
}

export interface BidResolveInput {
  segmentation: 'split' | 'sealed-only' | 'loose-only' | 'pooled'
  sealedMedian: number | null
  sealedCount: number
  looseMedian: number | null
  looseCount: number
  /** Recent-sample prices already split by eBay item condition (parity with MarketPanel). */
  newPrices: number[]
  usedPrices: number[]
}

export function median(arr: number[]): number {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** True when the price snapshot knows about conditions for this figure. */
export function snapshotHasSplit(i: Pick<BidResolveInput, 'segmentation' | 'sealedCount' | 'looseCount'>): boolean {
  return i.segmentation !== 'pooled' || i.sealedCount > 0 || i.looseCount > 0
}

export function resolveBidColumns(i: BidResolveInput): [BidColumn, BidColumn] {
  if (snapshotHasSplit(i)) {
    return [
      { key: 'new',  med: i.sealedMedian ?? 0, n: i.sealedCount, source: 'snapshot' },
      { key: 'used', med: i.looseMedian ?? 0,  n: i.looseCount,  source: 'snapshot' },
    ]
  }
  return [
    { key: 'new',  med: median(i.newPrices),  n: i.newPrices.length,  source: 'sample' },
    { key: 'used', med: median(i.usedPrices), n: i.usedPrices.length, source: 'sample' },
  ]
}

/** A column may quote a median only at or above the site-wide floor. */
export function columnQuotable(c: BidColumn): boolean {
  return c.n >= MIN_COMPS_TO_QUOTE && c.med > 0
}
