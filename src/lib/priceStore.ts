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
import { readThroughPrice, type KvLike } from './priceReadThrough'

export const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'
export type PriceKind = 'price-summaries' | 'price-history'

type R2Like = { get(key: string): Promise<{ json<T>(): Promise<T> } | null> }
type Bindings = { r2: R2Like | null; kv: KvLike | null; waitUntil?: (p: Promise<unknown>) => void }

// Release O (2026-09-04): the KV mirror (PRICE_KV, its own namespace so
// kv-purge-stale-isr can never sweep it) sits in front of the R2 binding —
// see priceReadThrough.ts for the why and the freshness contract. All three
// bindings are optional: no KV → K/L behaviour; no R2 → proxy fallback.
async function bindings(): Promise<Bindings> {
  try {
    // O-fix (2026-09-06): async form — the sync form throws when OpenNext judges the
    // context SSG/ISR-flavoured (see @opennextjs/cloudflare cloudflare-context.js);
    // vaultData.ts already uses async. Train #3 showed 0 mirror writes with every
    // failure path silent, so each swallowed branch now names itself in the tail.
    const { env, ctx } = await getCloudflareContext({ async: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = env as any
    const r2 = e?.PRICE_ASSETS as R2Like | undefined
    const kv = e?.PRICE_KV as KvLike | undefined
    const waitUntil = ctx && typeof ctx.waitUntil === 'function' ? (p: Promise<unknown>) => ctx.waitUntil(p) : undefined
    return {
      r2: r2 && typeof r2.get === 'function' ? r2 : null,
      kv: kv && typeof kv.get === 'function' && typeof kv.put === 'function' ? kv : (console.warn('[price-kv] PRICE_KV binding missing on env'), null),
      waitUntil,
    }
  } catch (err) {
    console.warn('[price-kv] bindings unavailable:', err instanceof Error ? err.message : String(err))
    return { r2: null, kv: null }
  }
}

async function readOrigin<T>(r2: R2Like | null, kind: string, figure_id: string, revalidate: number): Promise<T | null> {
  if (r2) {
    try {
      const obj = await r2.get(`${kind}/${figure_id}.json`)
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

/**
 * Read `<kind>/<figure_id>.json`: KV mirror first, then the R2 binding (or the
 * proxy when the binding is absent), mirroring the result. Returns the parsed
 * object, or null when the object does not exist / is not valid JSON. Never
 * throws. `revalidate` only matters on the proxy fallback (Next fetch cache).
 */
export async function readPriceObject<T>(kind: PriceKind, figure_id: string, revalidate = 86400): Promise<T | null> {
  const { r2, kv, waitUntil } = await bindings()
  return readThroughPrice<T>(
    { kv, waitUntil, origin: (k, fid) => readOrigin<T>(r2, k, fid, revalidate) },
    kind,
    figure_id,
  )
}
