/**
 * priceReadThrough — the pure, binding-agnostic half of the price KV mirror.
 *
 * Release O (2026-09-04, speed program, Steve-approved "yes lets try"):
 * Release K/L moved price reads from the r2proxy Worker to the R2 binding
 * and measured the result — the R2 GET itself costs ~230–260 ms per object
 * from IAD (bucket ENAM, objects 1–5 KB): a per-request floor, not distance
 * or size. KV edge reads are ~10–20 ms hot / ~100 ms cold, so a KV mirror in
 * front of R2 is the lever for the cold figure render (383 ms p50 → ~150).
 *
 * Shape: read-through. KV first; on a miss, read R2 (or the proxy fallback),
 * return it, and write it to KV in the background. Nothing bulk-writes KV
 * and no nightly job changes. Missing objects are cached as a NEGATIVE
 * sentinel for a shorter TTL so a figure with no snapshot does not pay the
 * R2 floor on every render.
 *
 * Freshness: entries live 24 h — the SAME bound every consumer already
 * accepted (`revalidate = 86400` on the figure page and its price fetches;
 * hubs/home are 24 h ISR). The API Worker's aggregation cron rewrites the
 * R2 snapshots hourly (500 fids/run, ~22 h per full cycle), so a 24 h mirror
 * is never staler than the page that shows it. Keys also carry a GENERATION
 * segment read from the `price-gen` KV key (memoised per isolate for
 * GEN_MEMO_MS): a deliberate `wrangler kv key put price-gen <new>` flushes
 * the whole mirror at once when someone needs prices re-read NOW (e.g. the
 * eBay comps source resuming after the 2026-08-19 suspension). Default 'g0'.
 *
 * This module has NO Workers imports; priceStore.ts hands it the live
 * bindings. tests/priceReadThrough.test.mjs drives it with fakes.
 */

export type KvLike = {
  get(key: string, opts?: { type?: 'text'; cacheTtl?: number }): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}

export type ReadThroughDeps = {
  kv: KvLike | null
  /** The slow source: R2 binding read or proxy fetch. Resolves null when absent. */
  origin: (kind: string, figure_id: string) => Promise<unknown | null>
  /** Background scheduler (ctx.waitUntil). Absent → the put is awaited inline. */
  waitUntil?: (p: Promise<unknown>) => void
  /** Injectable clock for the gen memo (tests). */
  now?: () => number
}

export const PRICE_KV_TTL_S = 24 * 3600          // positive entries — matches revalidate=86400
export const PRICE_KV_NEG_TTL_S = 24 * 3600      // "no snapshot" entries
export const PRICE_KV_EDGE_CACHE_S = 3600        // kv.get cacheTtl for price keys
export const GEN_KEY = 'price-gen'
export const GEN_DEFAULT = 'g0'
export const GEN_MEMO_MS = 5 * 60 * 1000
export const NEG_SENTINEL = '{"__none":1}'

let genMemo: { at: number; value: Promise<string> } | null = null

/** Test hook: forget the memoised generation. */
export function resetGenMemo(): void { genMemo = null }

async function currentGen(kv: KvLike, now: number): Promise<string> {
  if (genMemo && now - genMemo.at < GEN_MEMO_MS) return genMemo.value
  const value = kv.get(GEN_KEY, { type: 'text', cacheTtl: 60 })
    .then(v => (v && /^[A-Za-z0-9._-]{1,64}$/.test(v) ? v : GEN_DEFAULT))
    .catch(() => GEN_DEFAULT)
  genMemo = { at: now, value }
  return value
}

export function priceKey(gen: string, kind: string, figure_id: string): string {
  return `${gen}/${kind}/${figure_id}`
}

/**
 * Returns the parsed price object for `<kind>/<figure_id>.json`, or null when
 * no such object exists. Never throws. KV outage → behaves exactly like the
 * pre-O path (origin read, no caching).
 */
export async function readThroughPrice<T>(deps: ReadThroughDeps, kind: string, figure_id: string): Promise<T | null> {
  const { kv, origin } = deps
  const now = deps.now ? deps.now() : Date.now()
  let key: string | null = null

  if (kv) {
    try {
      const gen = await currentGen(kv, now)
      key = priceKey(gen, kind, figure_id)
      const hit = await kv.get(key, { type: 'text', cacheTtl: PRICE_KV_EDGE_CACHE_S })
      if (hit !== null) {
        if (hit === NEG_SENTINEL) return null
        try { return JSON.parse(hit) as T } catch { /* corrupt entry → fall through to origin */ }
      }
    } catch (err) {
      console.warn('[price-kv] get failed, skipping mirror for this read:', err instanceof Error ? err.message : String(err))
      key = null // KV unavailable: skip caching this read
    }
  }

  let obj: unknown | null = null
  try { obj = await origin(kind, figure_id) } catch { obj = null }

  if (kv && key) {
    const value = obj === null ? NEG_SENTINEL : JSON.stringify(obj)
    const ttl = obj === null ? PRICE_KV_NEG_TTL_S : PRICE_KV_TTL_S
    const put = kv.put(key, value, { expirationTtl: ttl }).catch((err: unknown) => {
      // a failed mirror write never affects the response — but it must be visible in the tail
      console.warn('[price-kv] put failed:', key, err instanceof Error ? err.message : String(err))
    })
    if (deps.waitUntil) deps.waitUntil(put)
    else await put
  }
  return obj as T | null
}
