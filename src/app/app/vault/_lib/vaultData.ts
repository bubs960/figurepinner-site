/**
 * vaultData.ts — server-side data assembly for the Vault shelf page.
 *
 * Sources, in order:
 *  - D1 (vault_items + wantlist_items) via getCloudflareContext — same access
 *    pattern as the /api/vault route.
 *  - KB via kbDb (D1 request-time reads, Option E) for display names, line
 *    tags, images, hrefs. KB wins over the stored row copy (rows snapshot
 *    name/line at add time and go stale; the KB is re-synced on every deploy).
 *    Converted from the bundled @/data/kb 2026-08-16: this page is fully
 *    dynamic (per-user, uncacheable) so it's the one live consumer that
 *    forced the whole 20MB slim KB array into the runtime Worker bundle.
 *    CORRECTION 2026-08-25 (webaudit postdeploy audit of 50d8dd0): the old
 *    claim that other @/data/kb consumers "get tree-shaken out" is wrong —
 *    the deployed handler is 40MB with the whole KB array inlined verbatim
 *    (canonical_image_url appears 22,417 times in the built bundle against
 *    22,357 figures that have one). Next.js/OpenNext does not tree-shake a
 *    module-level array export reachable from any route in the same Worker.
 *    Phase 7 (migrating all @/data/kb consumers onto kbDb) is what actually
 *    removes the bundled array — this comment is not a reason to leave it
 *    at 2 call sites. That single reachability pushed the Worker past
 *    Cloudflare's 62 MiB deploy traversal limit (code 10027) once matcher's
 *    passport pours grew the KB past the margin. See
 *    Bridge/MATCHER-TO-WEB-OPTION-E-SPEC-2026-06-14.md for the kbDb design.
 *  - R2 price snapshots (r2proxy, same endpoint + revalidate the figure page
 *    uses) for median / comp counts. Fetches are parallel, individually
 *    timeboxed, and capped — a missing snapshot renders as "no recent solds",
 *    never an error.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getFiguresByIds, getLineWaveCounts, figureUrl, type KBFigure } from '@/data/kbDb'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import { thumb } from '@/lib/imageUrl'

const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'
/** Median fetches per page load are capped (newest items first). Items past
 *  the cap still render — just without a median line. */
const MEDIAN_FETCH_CAP = 60

export type VaultShelfItem = {
  rowId: string
  fid: string
  href: string
  name: string
  tag: string
  img: string | null
  condition: string
  paid: number
  median: number | null
  comps: number
  /** Which market the median describes: the item's own condition bucket when
   *  the snapshot's split is statistically valid, else the blended market. */
  medianKind: 'sealed' | 'loose' | 'all'
  /** 30-day sold-price movement (WP4 shelf ticker); null = not enough dated
   *  comps in one or both windows to call a trend. */
  trend30d: { delta: number; pct: number | null } | null
  /** Claiming Ritual Phase B — "complete a line and the shelf row pulses
   *  gold." Set only when this figure belongs to a real assortment/wave
   *  (LINE_GROUP_MIN-LINE_GROUP_MAX figures in the KB, guards against a
   *  generic "" release_wave bucket reading as one giant fake line) and the
   *  user owns every figure in it. */
  lineComplete: boolean
  lineLabel: string | null
  lineOwned: number
  lineTotal: number
}

export type HuntItem = {
  rowId: string
  fid: string
  href: string
  name: string
  tag: string
  img: string | null
  median: number | null
  comps: number
  targetPrice: number
  /** Real signal only: median exists, a target is set, and median <= target. */
  targetHit: boolean
}

export type ShelfMover = { fid: string; name: string; href: string; delta: number; pct: number | null }

export type VaultShelfData = {
  items: VaultShelfItem[]
  hunt: HuntItem[]
  totals: {
    figures: number
    estValue: number
    paid: number
    /** Sum of item-level trend30d deltas, counting only items where a trend
     *  could be computed. null when zero items have enough dated comps —
     *  the ticker shows an honest "not enough sales history yet" state. */
    trend30d: number | null
    /** How many items actually contributed to trend30d — shown alongside
     *  the number so a 1-of-40-items delta doesn't read as shelf-wide. */
    trend30dCoverage: number
    topMovers: ShelfMover[]
  }
  /** True when D1 was unreachable — render the honest error state. */
  loadFailed: boolean
}

type VaultRow = {
  id: string; figure_id: string; name: string | null; line: string | null
  paid: number | null; condition: string | null
}
type WantRow = {
  id: string; figure_id: string; name: string | null; line: string | null
  target_price: number | null
}

async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

/** Display name + line tag, KB-first with stored-row fallback. Sync — takes a
 *  pre-fetched fid→KBFigure map (built once per request in getVaultShelfData)
 *  rather than hitting D1 per row. */
function resolveDisplaySync(fid: string, storedName: string | null, storedLine: string | null, kbByFid: Map<string, KBFigure | null>) {
  const kb = kbByFid.get(fid)
  if (kb) {
    const name = prettifySlug(kb.character_canonical)
    const wave = kb.release_wave && /^\d+$/.test(kb.release_wave) ? ` ${kb.release_wave}` : ''
    return {
      name,
      tag: `${prettifySlug(kb.product_line)}${wave}`,
      img: kb.canonical_image_url ? (thumb(kb.canonical_image_url, 225) ?? kb.canonical_image_url) : null,
      href: figureUrl(kb),
    }
  }
  return {
    name: storedName ?? fid,
    tag: storedLine ?? '',
    img: null,
    href: `/figure/${fid}`,
  }
}

type CondBucket = { median: number | null; count: number }
type Snapshot = {
  median: number | null
  comps: number
  sealed: CondBucket | null
  loose: CondBucket | null
  segmentation: string
  /** 30-day sold-price movement, derived from the same snapshot's dated
   *  comps — no new data source, no D1, no second fetch. null when either
   *  window (last 30d / prior 30d) has fewer than MIN_TREND_COMPS priced
   *  sales; a shelf-ticker trend is never fabricated from thin data. */
  trend30d: { delta: number; pct: number | null } | null
}

const MIN_TREND_COMPS = 2
const DAY_MS = 24 * 60 * 60 * 1000

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Bucket dated comps into "sold in the last 30 days" vs "sold 30-60 days
 *  ago" and compare medians. Mirrors Bid Check's own honesty rule (never
 *  derive a number from too few sales) rather than inventing a new gate. */
function computeTrend30d(recent: { price: number; sold_date: string | null }[]): Snapshot['trend30d'] {
  const now = Date.now()
  const last30: number[] = []
  const prior30: number[] = []
  for (const r of recent) {
    if (!r.sold_date || typeof r.price !== 'number') continue
    const t = Date.parse(r.sold_date)
    if (isNaN(t)) continue
    const ageDays = (now - t) / DAY_MS
    if (ageDays < 0) continue
    if (ageDays <= 30) last30.push(r.price)
    else if (ageDays <= 60) prior30.push(r.price)
  }
  if (last30.length < MIN_TREND_COMPS || prior30.length < MIN_TREND_COMPS) return null
  const mNow = median(last30)
  const mPrior = median(prior30)
  const delta = mNow - mPrior
  return { delta, pct: mPrior > 0 ? (delta / mPrior) * 100 : null }
}

async function fetchSnapshot(fid: string): Promise<Snapshot> {
  // AbortSignal.timeout() intentionally omitted — combining it with
  // next:{revalidate} forces the fetch out of ISR cache (S32, 2026-06-18).
  const res = await fetch(
    `${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(fid)}.json`,
    { next: { revalidate: 3600 } }
  ).catch(() => null)
  const EMPTY: Snapshot = { median: null, comps: 0, sealed: null, loose: null, segmentation: 'pooled', trend30d: null }
  if (!res?.ok) return EMPTY
  // D1-audit follow-up (2026-08-25, WEBAUDIT-POSTDEPLOY-AUDIT-50D8DD0 finding
  // #3): the fetch() above already has .catch()+res.ok guarding it, but the
  // JSON parse itself didn't -- a 200 with a malformed body would throw
  // uncaught into the SAME Promise.all the D1 fix (52a2f16) just hardened.
  // Low probability (r2proxy returns a valid `{}` for a missing object) but
  // the same "never an error" rule this function's fetch already follows.
  try {
    const snap = await res.json() as {
      median_sold: number | null; avg_sold: number | null; sold_count: number
      sealed?: CondBucket | null; loose?: CondBucket | null; condition_segmentation?: string
      recent?: { price: number; sold_date: string | null }[]
    }
    return {
      median: snap.median_sold ?? snap.avg_sold ?? null,
      comps: snap.sold_count ?? 0,
      sealed: snap.sealed ?? null,
      loose: snap.loose ?? null,
      segmentation: snap.condition_segmentation ?? 'pooled',
      trend30d: computeTrend30d(snap.recent ?? []),
    }
  } catch {
    return EMPTY
  }
}

/** The median that matches the item's own condition — sealed bucket for MOC,
 *  loose bucket for Loose/Opened/Damaged — but ONLY when the snapshot's
 *  segmentation says that bucket is statistically valid (gate on
 *  segmentation, not bucket presence: below-threshold buckets ship under
 *  'pooled'). Near Mint is ambiguous (carded-NM vs loose-NM) → blended. */
function conditionMatchedMedian(s: Snapshot | undefined, condition: string): {
  median: number | null; comps: number; medianKind: 'sealed' | 'loose' | 'all'
} {
  if (!s) return { median: null, comps: 0, medianKind: 'all' }
  const sealedValid = (s.segmentation === 'split' || s.segmentation === 'sealed-only') && s.sealed?.median != null
  const looseValid = (s.segmentation === 'split' || s.segmentation === 'loose-only') && s.loose?.median != null
  if (condition === 'MOC' && sealedValid) {
    return { median: s.sealed!.median, comps: s.sealed!.count, medianKind: 'sealed' }
  }
  if ((condition === 'Loose' || condition === 'Opened' || condition === 'Damaged') && looseValid) {
    return { median: s.loose!.median, comps: s.loose!.count, medianKind: 'loose' }
  }
  return { median: s.median, comps: s.comps, medianKind: 'all' }
}

// A real assortment/wave is small — a boxed set, a series release. Below the
// floor it's not a "line" at all (a lone repaint); above the ceiling it's a
// generic bucket (e.g. figures with no real release_wave sharing "" — the KB
// has plenty of those) and calling it "complete" would be meaningless.
const LINE_GROUP_MIN = 2
const LINE_GROUP_MAX = 12

function lineGroupKey(fandom: string, productLine: string, releaseWave: string): string {
  return `${fandom}/${productLine}/${releaseWave}`
}

type LineCompletion = { lineComplete: boolean; lineLabel: string | null; lineOwned: number; lineTotal: number }
const NO_LINE: LineCompletion = { lineComplete: false, lineLabel: null, lineOwned: 0, lineTotal: 0 }

/** Per-figure_id line-completion lookup for a set of owned rows. Two passes:
 *  one over the (small) owned set to find which line-groups are in play, one
 *  over just the fandom(s) actually in play to size only those groups — never
 *  a scan of the whole KB (kbDb has no bulk getAllFigures; the owned set's
 *  fandoms are typically 1-4, so per-fandom D1 reads stay small). */
async function computeLineCompletion(vaultRows: VaultRow[], kbByFid: Map<string, KBFigure | null>): Promise<Map<string, LineCompletion>> {
  const result = new Map<string, LineCompletion>()
  const ownedByKey = new Map<string, string[]>() // lineKey -> owned figure_ids
  const fandoms = new Set<string>()

  for (const r of vaultRows) {
    const kb = kbByFid.get(r.figure_id)
    if (!kb || !kb.release_wave) continue
    fandoms.add(kb.fandom)
    const key = lineGroupKey(kb.fandom, kb.product_line, kb.release_wave)
    const list = ownedByKey.get(key)
    if (list) list.push(r.figure_id)
    else ownedByKey.set(key, [r.figure_id])
  }
  if (ownedByKey.size === 0) return result

  const totals = new Map<string, number>()
  // Same D1-error-handling fix as the batched KB read above: a fandom
  // whose D1 read fails degrades to an empty set (that fandom's owned items
  // just don't get a line-completion badge this load) rather than rejecting
  // the whole Promise.all and losing line-completion for every owned item
  // across every fandom over one transient error.
  // Stage 2 (2026-09-02): the denominators come back GROUPED from D1
  // (product_line, release_wave, count — wave-less rows excluded, exactly the
  // rows the old JS loop skipped) instead of every row of the fandom.
  type WaveCounts = Awaited<ReturnType<typeof getLineWaveCounts>>
  const fandomCounts = await Promise.all(
    [...fandoms].map(fandom =>
      getLineWaveCounts(fandom)
        .then(rows => ({ fandom, rows }))
        .catch(() => ({ fandom, rows: [] as WaveCounts })),
    ),
  )
  for (const { fandom, rows } of fandomCounts) {
    for (const r of rows) {
      const key = lineGroupKey(fandom, r.product_line, r.release_wave)
      if (!ownedByKey.has(key)) continue
      totals.set(key, (totals.get(key) ?? 0) + r.count)
    }
  }

  for (const [key, fids] of ownedByKey) {
    const total = totals.get(key) ?? 0
    if (total < LINE_GROUP_MIN || total > LINE_GROUP_MAX) continue
    const complete = fids.length >= total
    // Label from any one member of the group — they share fandom/line/wave.
    const sample = kbByFid.get(fids[0])
    if (!sample) continue
    const label = `${prettifySlug(sample.product_line)} ${sample.release_wave}`
    for (const fid of fids) {
      result.set(fid, { lineComplete: complete, lineLabel: label, lineOwned: fids.length, lineTotal: total })
    }
  }
  return result
}

export async function getVaultShelfData(userId: string): Promise<VaultShelfData> {
  let vaultRows: VaultRow[] = []
  let wantRows: WantRow[] = []
  let loadFailed = false

  try {
    const db = await getDB()
    const [v, w] = await Promise.all([
      db.prepare("SELECT id, figure_id, name, line, paid, condition FROM vault_items WHERE user_id = ? AND status = 'active' ORDER BY added_at DESC")
        .bind(userId).all<VaultRow>(),
      db.prepare("SELECT id, figure_id, name, line, target_price FROM wantlist_items WHERE user_id = ? AND status = 'active' ORDER BY added_at DESC")
        .bind(userId).all<WantRow>(),
    ])
    vaultRows = v.results ?? []
    wantRows = w.results ?? []
  } catch {
    loadFailed = true
  }

  // One snapshot fetch per distinct fid, newest-first across both lists.
  const fidOrder: string[] = []
  const seen = new Set<string>()
  for (const r of [...vaultRows, ...wantRows]) {
    if (!seen.has(r.figure_id)) { seen.add(r.figure_id); fidOrder.push(r.figure_id) }
  }
  const toFetch = fidOrder.slice(0, MEDIAN_FETCH_CAP)
  // D1 read error handling (2026-08-25, WEB-D1-SWAP-DESIGN-AUDIT finding #1):
  // getFigureById was unguarded -- one D1 exception (a transient rename
  // window during the pending table-swap, a connection blip, etc.) would
  // reject the WHOLE Promise.all and take down the entire Vault page for
  // every item, not just the one fid that hit it. kbByFid is already typed
  // KBFigure | null and resolveDisplaySync() already has a real fallback
  // path for a missing KB entry (the stored row's own name/line) -- same
  // "never an error" resilience this file's R2 snapshot fetches already
  // follow (see file header). The catch reuses that existing fallback
  // instead of adding a new one.
  //
  // One batched PK read, not N (2026-09-02, gap sweep finding 2): this was one
  // getFigureById statement per owned/wanted figure on every uncached Vault
  // view (100 items = 100 D1 statements). getFiguresByIds is the IN-chunked
  // batch helper built for exactly this (one db.batch round trip). The same
  // "never fail the page" contract holds: a failed batch degrades every row
  // to resolveDisplaySync's stored-name fallback, exactly as a missing entry
  // did before.
  const [snapEntries, kbLoaded] = await Promise.all([
    Promise.all(toFetch.map(async fid => [fid, await fetchSnapshot(fid)] as const)),
    getFiguresByIds(fidOrder).catch(() => new Map<string, KBFigure>()),
  ])
  const snaps = new Map<string, Snapshot>(snapEntries)
  const kbByFid = new Map<string, KBFigure | null>(fidOrder.map(fid => [fid, kbLoaded.get(fid) ?? null] as const))

  const lineCompletion = await computeLineCompletion(vaultRows, kbByFid)

  const items: VaultShelfItem[] = vaultRows.map(r => {
    const d = resolveDisplaySync(r.figure_id, r.name, r.line, kbByFid)
    const condition = r.condition ?? 'Loose'
    const matched = conditionMatchedMedian(snaps.get(r.figure_id), condition)
    return {
      rowId: r.id,
      fid: r.figure_id,
      ...d,
      condition,
      paid: r.paid ?? 0,
      ...matched,
      trend30d: snaps.get(r.figure_id)?.trend30d ?? null,
      ...(lineCompletion.get(r.figure_id) ?? NO_LINE),
    }
  })

  const hunt: HuntItem[] = wantRows.map(r => {
    const d = resolveDisplaySync(r.figure_id, r.name, r.line, kbByFid)
    const s = snaps.get(r.figure_id)
    const target = r.target_price ?? 0
    const median = s?.median ?? null
    return {
      rowId: r.id,
      fid: r.figure_id,
      ...d,
      median,
      comps: s?.comps ?? 0,
      targetPrice: target,
      targetHit: target > 0 && median != null && median <= target,
    }
  })

  // est. value: median where we have one, the user's paid price as the
  // honest floor where we don't.
  const estValue = items.reduce((s, i) => s + (i.median ?? i.paid ?? 0), 0)
  const paid = items.reduce((s, i) => s + (i.paid ?? 0), 0)

  return { items, hunt, totals: shelfTotals(items), loadFailed }
}

/** Shared totals math (server first paint + client re-derive after an
 *  optimistic edit) — one formula, so the two never drift. */
export function shelfTotals(items: VaultShelfItem[]): VaultShelfData['totals'] {
  const withTrend = items.filter(i => i.trend30d != null)
  const topMovers: ShelfMover[] = withTrend
    .map(i => ({ fid: i.fid, name: i.name, href: i.href, delta: i.trend30d!.delta, pct: i.trend30d!.pct }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3)
  return {
    figures: items.length,
    estValue: items.reduce((s, i) => s + (i.median ?? i.paid ?? 0), 0),
    paid: items.reduce((s, i) => s + (i.paid ?? 0), 0),
    trend30d: withTrend.length > 0 ? withTrend.reduce((s, i) => s + i.trend30d!.delta, 0) : null,
    trend30dCoverage: withTrend.length,
    topMovers,
  }
}
