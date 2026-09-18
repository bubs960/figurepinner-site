/**
 * price-snapshot-fetch.mjs -- the one way build scripts read a figure's price summary from the
 * r2proxy Worker (2026-09-18).
 *
 * WHY: the hub generators each had `try { fetch } catch { return null }` with `r.ok ? json : null`.
 * MEASURED 2026-09-18: one pass over the 6,507 wrestling fids at concurrency 16 got
 * **3,680 HTTP 429s (57%)** -- and every one was silently treated as "this figure has no comps".
 * The "top comps" lists were therefore the top of whatever random subset got through (the WWF
 * Hasbro Undertaker, $210.50 across 48 sold, was missing from the wrestling list). A price list
 * built from partial data is worse than a stale one, so:
 *   - requests are paced (SNAPSHOT_RPS, default 30/s) and a 429/5xx pauses EVERY worker, honours
 *     Retry-After, and backs off exponentially;
 *   - a fid that still fails after all attempts THROWS -- the generator exits non-zero before it
 *     writes its payload, so the previous (complete) payload survives;
 *   - "no data" is only ever an explicit answer from the proxy (404, or its 200 `{}` wrapper).
 * SNAPSHOT_CACHE_DIR (set by refresh-fandom-hub-data.mjs for the length of one run) shares results
 * across the three generators, which otherwise each re-fetch the same fids.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'
const RPS = Math.max(1, Number(process.env.SNAPSHOT_RPS || 30))
const CACHE_DIR = process.env.SNAPSHOT_CACHE_DIR || null
if (CACHE_DIR && !existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })

export class SnapshotFetchError extends Error {}

const state = { pauseUntil: 0, backoffMs: 2000, lastBump: 0, nextSlot: 0 }
const stats = { fetched: 0, cacheHits: 0, noData: 0, retries: 0, rateLimited: 0 }
export const snapshotStats = () => ({ ...stats })

const realSleep = (ms) => new Promise((r) => setTimeout(r, ms))
const cachePath = (fid) => join(CACHE_DIR, createHash('sha1').update(fid).digest('hex') + '.json')

/** Resolves to the summary object, or null when the proxy says the figure has no price data. Throws SnapshotFetchError when it cannot find out. */
export async function fetchPriceSnapshot(fid, { fetchImpl = fetch, sleepImpl = realSleep, maxAttempts = 8, now = Date.now } = {}) {
  if (CACHE_DIR) {
    const p = cachePath(fid)
    if (existsSync(p)) { stats.cacheHits++; return JSON.parse(readFileSync(p, 'utf8')).data }
  }
  const remember = (data) => { if (CACHE_DIR) writeFileSync(cachePath(fid), JSON.stringify({ fid, data })); return data }
  let last = 'no attempt made'
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // pace: one request start per 1/RPS s across all workers; then respect any global pause
    const slot = Math.max(now(), state.nextSlot)
    state.nextSlot = slot + 1000 / RPS
    const wait = Math.max(slot, state.pauseUntil) - now()
    if (wait > 0) await sleepImpl(wait)
    let res
    try {
      res = await fetchImpl(`${BASE}/price-summaries/${encodeURIComponent(fid)}.json`, { signal: AbortSignal.timeout(15000) })
    } catch (err) {
      last = 'network: ' + err.message
      stats.retries++
      await sleepImpl(Math.min(1000 * 2 ** attempt, 30000))
      continue
    }
    if (res.status === 404) { stats.noData++; return remember(null) }
    if (res.ok) {
      const data = await res.json()
      state.backoffMs = 2000
      if (!data || data.sold_count == null) { stats.noData++; return remember(null) }
      stats.fetched++
      return remember(data)
    }
    if (res.status === 429 || res.status >= 500) {
      last = 'HTTP ' + res.status
      stats.retries++
      if (res.status === 429) stats.rateLimited++
      const retryAfter = Number(res.headers?.get?.('retry-after'))
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : state.backoffMs
      state.pauseUntil = Math.max(state.pauseUntil, now() + delay)
      // sixteen workers hitting the same 429 burst must count as ONE backoff step
      if (now() - state.lastBump > 1000) { state.backoffMs = Math.min(state.backoffMs * 2, 60000); state.lastBump = now() }
      continue
    }
    last = 'HTTP ' + res.status
    break // other 4xx: retrying will not help
  }
  throw new SnapshotFetchError(`price summary for ${fid} unavailable after ${maxAttempts} attempt(s): ${last}`)
}
