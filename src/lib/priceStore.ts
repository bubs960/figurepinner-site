// priceStore — read price snapshots straight from the R2 bucket binding
// instead of round-tripping through the figurepinner-r2proxy Worker.
//
// WHY (2026-09-03, Release J `[figure-timing]` breakdown over 209 prod
// renders): a cold figure render spent p50 623 ms on the price-summaries
// fetch and 443 ms on price-history — 646 ms of the 769 ms total, more than
// every D1 read and the kbLite work combined. Both were `fetch()`es to
// `figurepinner-r2proxy.bubs960.workers.dev`, i.e. Worker → HTTP → Worker →
// R2, with the proxy's per-IP rate limiter (120/min) in the path. The bucket
// (`figurepinner-assets`) is now bound directly (wrangler.toml PRICE_ASSETS),
// so the read is one R2 GET (~tens of ms), no second Worker, no rate limit.
//
// COST: the same R2 class-B read the proxy was already doing, minus one
// Worker invocation per fetch. Nothing new is paid for.
//
// FALLBACK: when the binding is absent (a build/runtime without it — plain
// `next dev`, or a misconfigured wrangler.toml) the proxy path is used, so a
// missing binding degrades to today's behaviour rather than to "no prices".
// A MISSING OBJECT is a real "no price" and returns null either way.
//
// Callers keep their own shape checks; this only fetches + parses JSON.

import { getCloudflareContext } from '@opennextjs/cloudflare'

export const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'
export type PriceKind = 'price-summaries' | 'price-history'

type R2Like = { get(key: string): Promise<{ json<T>(): Promise<T> } | null> }

async function bucket(): Promise<R2Like | null> {
  try {
    const { env } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = (env as any)?.PRICE_ASSETS as R2Like | undefined
    return b && typeof b.get === 'function' ? b : null
  } catch {
    return null
  }
}

/**
 * Read `<kind>/<figure_id>.json`. Returns the parsed object, or null when the
 * object does not exist / is not valid JSON. Never throws.
 * `revalidate` only matters on the proxy fallback (Next fetch cache).
 */
export async function readPriceObject<T>(kind: PriceKind, figure_id: string, revalidate = 86400): Promise<T | null> {
  const key = `${kind}/${figure_id}.json`
  const b = await bucket()
  if (b) {
    try {
      const obj = await b.get(key)
      if (!obj) return null
      return await obj.json<T>()
    } catch {
      return null
    }
  }
  try {
    const res = await fetch(`${R2_PROXY_BASE}/${kind}/${encodeURIComponent(figure_id)}.json`, { next: { revalidate } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
