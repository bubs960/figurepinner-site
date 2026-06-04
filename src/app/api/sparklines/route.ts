import { NextRequest, NextResponse } from 'next/server'

const R2_PROXY = 'https://figurepinner-r2proxy.bubs960.workers.dev'

export const runtime = 'edge'
export const revalidate = 300

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean).slice(0, 48) ?? []
  if (!ids.length) return NextResponse.json({})

  const results: Record<string, { points: number[]; trend: 'up' | 'down' | 'flat' }> = {}

  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const res = await fetch(`${R2_PROXY}/price-summaries/${encodeURIComponent(id)}.json`, {
          signal: AbortSignal.timeout(3000),
        })
        if (!res.ok) return
        const snap = await res.json() as { recent?: Array<{ price: number }> }
        const prices = (snap.recent ?? []).map((r) => r.price).filter((p) => p > 0)
        if (prices.length < 2) return
        const first = prices.slice(0, Math.ceil(prices.length / 2))
        const last = prices.slice(-Math.ceil(prices.length / 2))
        const avgFirst = first.reduce((a, b) => a + b, 0) / first.length
        const avgLast = last.reduce((a, b) => a + b, 0) / last.length
        const trend: 'up' | 'down' | 'flat' =
          avgLast > avgFirst * 1.05 ? 'up' :
          avgLast < avgFirst * 0.95 ? 'down' : 'flat'
        results[id] = { points: prices, trend }
      } catch {
        // skip missing snapshots
      }
    })
  )

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}
