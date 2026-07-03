// Server-side price-snapshot fetch for guide `comp` blocks.
//
// Split out of LiveMedian.tsx (2026-07-02) when that file gained 'use client'
// for the tracked eBay CTA — a 'use client' directive marks the WHOLE module
// client-only, which broke this function's use from the server-side guide
// page (`Error: Attempted to call fetchPriceSnaps() from the server but
// fetchPriceSnaps is on the client`). This file has no browser APIs and no
// React, so it stays a plain server module.

const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'

export type PriceSnap = {
  median_sold: number | null
  avg_sold: number | null
  min_sold: number | null
  max_sold: number | null
  sold_count: number
}

/** Batched, ISR-cached (1h) fetch of price snapshots for a set of fids.
 *  Returns only fids that have a usable snapshot. */
export async function fetchPriceSnaps(fids: string[]): Promise<Map<string, PriceSnap>> {
  const unique = [...new Set(fids)]
  const entries = await Promise.all(
    unique.map(async (fid) => {
      try {
        const r = await fetch(`${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(fid)}.json`, {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(4000),
        })
        if (!r.ok) return [fid, null] as const
        const j = (await r.json()) as PriceSnap
        if (!j || Object.keys(j).length === 0) return [fid, null] as const
        return [fid, j] as const
      } catch {
        return [fid, null] as const
      }
    }),
  )
  return new Map(entries.filter((e): e is readonly [string, PriceSnap] => e[1] !== null))
}
