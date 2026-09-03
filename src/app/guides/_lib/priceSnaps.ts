// Server-side price-snapshot fetch for guide `comp` blocks.
//
// Split out of LiveMedian.tsx (2026-07-02) when that file gained 'use client'
// for the tracked eBay CTA — a 'use client' directive marks the WHOLE module
// client-only, which broke this function's use from the server-side guide
// page (`Error: Attempted to call fetchPriceSnaps() from the server but
// fetchPriceSnaps is on the client`). This file has no browser APIs and no
// React, so it stays a plain server module.

import { readPriceObject } from '@/lib/priceStore'

export type PriceSnap = {
  median_sold: number | null
  avg_sold: number | null
  min_sold: number | null
  max_sold: number | null
  sold_count: number
}

/** Batched fetch of price snapshots for a set of fids — one R2 binding read
 *  each (Release L, 2026-09-03; proxy fallback only when the binding is
 *  absent). The guide page's own 24 h ISR is what caches the result now.
 *  Returns only fids that have a usable snapshot. */
export async function fetchPriceSnaps(fids: string[]): Promise<Map<string, PriceSnap>> {
  const unique = [...new Set(fids)]
  const entries = await Promise.all(
    unique.map(async (fid) => {
      const j = await readPriceObject<PriceSnap>('price-summaries', fid, 86400)
      if (!j || Object.keys(j).length === 0) return [fid, null] as const
      return [fid, j] as const
    }),
  )
  return new Map(entries.filter((e): e is readonly [string, PriceSnap] => e[1] !== null))
}
