'use client'

// railMedianBatch.ts — shared client-side batcher for related-rail medians
// (v4 Phase 4, build plan §4). Every CardMedian on a page registers its fid
// here; one debounced /api/sparklines?ids= call serves them all — the exact
// batching the plan mandates instead of N per-card fetches. The endpoint
// caps batches at 40 ids and rate-limits at 30/min/IP, so one page load
// (two rails ≤ 25 fids total) costs a single request.

export interface RailMedian {
  median: number | null
  soldCount: number
  /** Which aggregate `median` actually holds — snapshots without a true
   *  median fall back to avg, and the label must say so (FTC
   *  label-truthfulness, S55). */
  stat: 'median' | 'avg'
}

type SparklineResponse = Record<string, { median: number | null; soldCount: number; stat: 'median' | 'avg' }>

const BATCH_DELAY_MS = 50
const BATCH_MAX_IDS = 40

const pending = new Map<string, Array<(m: RailMedian | null) => void>>()
let flushTimer: ReturnType<typeof setTimeout> | null = null
const cache = new Map<string, RailMedian | null>()

async function flush(): Promise<void> {
  flushTimer = null
  const batch = [...pending.entries()].slice(0, BATCH_MAX_IDS)
  for (const [id] of batch) pending.delete(id)
  if (pending.size > 0) scheduleFlush() // remainder goes in the next batch

  const ids = batch.map(([id]) => id)
  let data: SparklineResponse = {}
  try {
    const res = await fetch(`/api/sparklines?ids=${encodeURIComponent(ids.join(','))}`)
    if (res.ok) data = await res.json() as SparklineResponse
  } catch {
    // network failure → every waiter resolves null; cards simply omit the price
  }
  for (const [id, resolvers] of batch) {
    const row = data[id]
    const value: RailMedian | null = row ? { median: row.median, soldCount: row.soldCount, stat: row.stat } : null
    cache.set(id, value)
    resolvers.forEach(resolve => resolve(value))
  }
}

function scheduleFlush(): void {
  if (flushTimer == null) flushTimer = setTimeout(() => { void flush() }, BATCH_DELAY_MS)
}

/** Resolve the median for one fid, batched with all other same-tick callers. */
export function requestRailMedian(figureId: string): Promise<RailMedian | null> {
  if (cache.has(figureId)) return Promise.resolve(cache.get(figureId) ?? null)
  return new Promise(resolve => {
    const waiters = pending.get(figureId)
    if (waiters) {
      waiters.push(resolve)
    } else {
      pending.set(figureId, [resolve])
    }
    scheduleFlush()
  })
}
