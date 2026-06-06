import { NextRequest, NextResponse } from 'next/server'

const R2_PROXY = 'https://figurepinner-r2proxy.bubs960.workers.dev'

export const runtime = 'edge'
export const revalidate = 300

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean).slice(0, 48) ?? []
  if (!ids.length) return NextResponse.json({})

  const results: Record<string, { points: number[]; trend: 'up' | 'down' | 'flat'; median: number | null; soldCount: number }> = {}

  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const res = await fetch(`${R2_PROXY}/price-summaries/${encodeURIComponent(id)}.json`, {
          signal: AbortSignal.timeout(3000),
        })
        if (!res.ok) return
        const snap = await res.json() as {
          recent?: Array<{ price: number }>
          median_sold?: number | null
          avg_sold?: number | null
          sold_count?: number
        }
        const prices = (snap.recent ?? []).map((r) => r.price).filter((p) => p > 0)
        const median = snap.median_sold ?? snap.avg_sold ?? null
        // trend needs at least 2 points; median can stand alone
        if (prices.length < 2 && median == null) return
        const first = prices.slice(0, Math.ceil(prices.length / 2))
        const last  = prices.slice(-Math.ceil(prices.length / 2))
        const avgFirst = first.length ? first.reduce((a, b) => a + b, 0) / first.length : 0
        const avgLast  = last.length  ? last.reduce((a, b) => a + b, 0)  / last.length  : 0
        const trend: 'up' | 'down' | 'flat' =
          prices.length < 2  ? 'flat' :
          avgLast > avgFirst * 1.05 ? 'up' :
          avgLast < avgFirst * 0.95 ? 'down' : 'flat'
        results[id] = { points: prices, trend, median, soldCount: snap.sold_count ?? 0 }
      } catch {
        // skip missing snapshots
      }
    })
  )

  return NextResponse.json(results, {
  