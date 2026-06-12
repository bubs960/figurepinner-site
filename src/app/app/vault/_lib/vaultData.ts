/**
 * vaultData.ts — server-side data assembly for the Vault shelf page.
 *
 * Sources, in order:
 *  - D1 (vault_items + wantlist_items) via getCloudflareContext — same access
 *    pattern as the /api/vault route.
 *  - KB (build-time bundle) for display names, line tags, images, hrefs.
 *    KB wins over the stored row copy (rows snapshot name/line at add time
 *    and go stale; the KB is re-synced on every deploy).
 *  - R2 price snapshots (r2proxy, same endpoint + revalidate the figure page
 *    uses) for median / comp counts. Fetches are parallel, individually
 *    timeboxed, and capped — a missing snapshot renders as "no recent solds",
 *    never an error.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getFigureById, figureUrl } from '@/data/kb'
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

export type VaultShelfData = {
  items: VaultShelfItem[]
  hunt: HuntItem[]
  totals: { figures: number; estValue: number; paid: number }
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

/** Display name + line tag, KB-first with stored-row fallback. */
function resolveDisplay(fid: string, storedName: string | null, storedLine: string | null) {
  const kb = getFigureById(fid)
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

type Snapshot = { median: number | null; comps: number }

async function fetchSnapshot(fid: string): Promise<Snapshot> {
  const res = await fetch(
    `${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(fid)}.json`,
    { next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) }
  ).catch(() => null)
  if (!res?.ok) return { median: null, comps: 0 }
  const snap = await res.json() as { median_sold: number | null; avg_sold: number | null; sold_count: number }
  return { median: snap.median_sold ?? snap.avg_sold ?? null, comps: snap.sold_count ?? 0 }
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
  const snaps = new Map<string, Snapshot>(
    await Promise.all(toFetch.map(async fid => [fid, await fetchSnapshot(fid)] as const))
  )

  const items: VaultShelfItem[] = vaultRows.map(r => {
    const d = resolveDisplay(r.figure_id, r.name, r.line)
    const s = snaps.get(r.figure_id)
    return {
      rowId: r.id,
      fid: r.figure_id,
      ...d,
      condition: r.condition ?? 'Loose',
      paid: r.paid ?? 0,
      median: s?.median ?? null,
      comps: s?.comps ?? 0,
    }
  })

  const hunt: HuntItem[] = wantRows.map(r => {
    const d = resolveDisplay(r.figure_id, r.name, r.line)
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

  return { items, hunt, totals: { figures: items.length, estValue, paid }, loadFailed }
}
