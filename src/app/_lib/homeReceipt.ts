/**
 * Homepage "Receipt" demo + sold-comp Tape — server-side data layer.
 *
 * Fetches real price snapshots for a curated set of figures from the same
 * r2proxy endpoint the figure pages use (1h revalidate), and derives the
 * exact same numbers the figure page shows — median, P10–P90, confidence —
 * so the homepage receipt can NEVER contradict the figure page it links to.
 *
 * Honesty rules:
 *  - A figure with a failed fetch, thin comps (<5), or no true median is
 *    dropped. No avg-as-median substitution, ever.
 *  - If fewer than 2 figures survive, the caller hides the whole module.
 *  - No sold dates are exposed (sold_date hygiene pass still pending in D1).
 *  - Tape prices are individual real sold comps from the same snapshots.
 */

import { getFigureById, prettyFigureUrl } from '@/data/kb'
import { thumb } from '@/lib/imageUrl'
import { compCountToConfidence, prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'

const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'

export type ReceiptFigure = {
  fid: string
  href: string
  chipLabel: string
  name: string
  line: string
  genre: string
  image: string | null
  median: number
  p10: number
  p90: number
  compCount: number
  confidence: 1 | 2 | 3 | 4 | 5
  /** Normalized 0–1 positions of recent sold comps within [p10, p90], clamped. */
  ticks: number[]
  spread: 'tight' | 'wide' | null
  fieldNote?: string
}

/** One cell of the sold-comp ticker: a real individual sale, no date shown. */
export type TapeItem = {
  label: string
  price: number
  href: string
}

/**
 * Curated demo figures — genre-diverse, verified 2026-06-11 to have 12–50
 * real sold comps each. NOTE: a Rollins "field note" (owner listed his own
 * UE30 at $30 off this data, from his phone — true, M1 validation 6/10)
 * shipped here briefly; pulled 2026-06-12 because anonymous self-reference
 * reads as a fake testimonial. If a note ever returns it must be both real
 * AND self-explanatory to a stranger.
 *
 * Order matters: fetchHomeMarket() preserves this order (failures drop
 * silently, survivors keep their relative position), and the hero only
 * shows receiptFigures.slice(0, 3) as chips — so the FIRST three entries
 * that resolve are what a cold visitor actually sees. Webaudit's homepage-
 * journey audit (2026-07-10) found the original 5 all read as SKU-speak to
 * an unfamiliar visitor ("Rollins UE30") and carried zero DC signal despite
 * DC Multiverse being a top-6 lane — hand-ordered the top 3 below to fix
 * both in one move rather than adding per-build rotation logic for a
 * one-line copy problem. Hogan/Batman fids confirmed against the KB directly
 * (grep) before adding, not guessed; Batman reuses the exact fid already
 * proven live in the homepage shelf pool (page.tsx SHELF_POOL).
 */
const CURATED: Array<{ fid: string; chipLabel: string; fieldNote?: string }> = [
  { fid: 'fp_wrestling_hasbro_wwf-hasbro_1_hulk-hogan_474714', chipLabel: "Hulk Hogan Hasbro '90" },
  { fid: 'fp_dc_mcfarlane_multiverse_mcfarlane_batman_5efc4c', chipLabel: 'Batman DC Multiverse' },
  { fid: 'fp_star-wars_hasbro_black-series_force-awakens-2015-2018_darth-vader_9476c8', chipLabel: 'Vader Black Series' },
  { fid: 'fp_wrestling_mattel_ultimate-edition_30_seth-rollins_6dfa66', chipLabel: 'Rollins UE30' },
  { fid: 'fp_marvel-comics_hasbro_marvel-legends_galactus-baf_spider-man_b05f79', chipLabel: 'Spider-Man ML' },
  { fid: 'fp_gi-joe_hasbro_classified-series_classified_snake-eyes_ae7414', chipLabel: 'Snake Eyes Classified' },
  { fid: 'fp_wrestling_mattel_elite_122_stone-cold-steve-austin_a8fd30aa3a7e', chipLabel: 'Stone Cold E122' },
]

type R2Snapshot = {
  figure_id: string
  avg_sold: number | null
  median_sold: number | null
  min_sold: number | null
  max_sold: number | null
  sold_count: number
  recent: Array<{ price: number }>
}

function pctile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0]
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/**
 * Spread classification — defined ONCE, server-side, so a figure can't flip
 * badges between renders:
 *  - 'wide'  : raw (max−min) / median > 4 — same rule as the figure page's
 *              dispersion_warning (contaminated/graded/lot comps likely).
 *  - 'tight' : (P90−P10) / median ≤ 0.35 — solds genuinely cluster. Held
 *              deliberately strict: a spread equal to 80% of the median is
 *              not "tight" to any collector, so most figures get no badge.
 *  - null    : everything in between gets no badge.
 */
function classifySpread(min: number | null, max: number | null, p10: number, p90: number, median: number): 'tight' | 'wide' | null {
  if (median <= 0) return null
  const rawSpread = (max ?? 0) - (min ?? 0)
  if (rawSpread / median > 4) return 'wide'
  if ((p90 - p10) / median <= 0.35) return 'tight'
  return null
}

/** Evenly sample up to `n` values across a sorted array, always keeping the last. */
function sampleEven(sorted: number[], n: number): number[] {
  if (sorted.length <= n) return sorted
  const step = sorted.length / n
  const out: number[] = []
  for (let i = 0; i < n - 1; i++) out.push(sorted[Math.floor(i * step)])
  out.push(sorted[sorted.length - 1])
  return out
}

async function fetchOne(entry: { fid: string; chipLabel: string; fieldNote?: string }): Promise<{ figure: ReceiptFigure; prices: number[] } | null> {
  const kb = getFigureById(entry.fid)
  if (!kb || !kb.canonical_image_url) return null

  // AbortSignal.timeout() omitted — same reason as FigureDetailContent:
  // dynamic signal busts Next 15 fetch cache → revalidate=0 → page no-store.
  // (Fix: S32, 2026-06-18)
  const res = await fetch(
    `${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(entry.fid)}.json`,
    { next: { revalidate: 3600 } }
  ).catch(() => null)
  if (!res?.ok) return null

  const snap = await res.json() as R2Snapshot
  // True median only — substituting the avg under a "MEDIAN SOLD" label is
  // the one kind of lie this page exists to fight.
  const median = snap.median_sold
  // Unfiltered, like the figure page's P10/P90 path — parity beats hygiene
  // here; if a bad $0 comp ever lands, both surfaces show it together.
  const prices = (snap.recent ?? []).map(r => r.price).sort((a, b) => a - b)
  if (!median || median <= 0 || snap.sold_count < 5 || prices.length < 3) return null

  const p10 = pctile(prices, 10)
  const p90 = pctile(prices, 90)
  const span = p90 - p10
  // One tick per recent comp, sampled evenly when the snapshot is deep so the
  // high tail is never silently dropped.
  const ticks = sampleEven(prices, 40)
    .map(p => span > 0 ? Math.min(1, Math.max(0, (p - p10) / span)) : 0.5)
    .map(t => Math.round(t * 1000) / 1000)

  const spread = classifySpread(snap.min_sold, snap.max_sold, p10, p90, median)
  const base = compCountToConfidence(snap.sold_count)
  // Same cap the figure page applies: a wide raw spread caps confidence at 4.
  const confidence: 1 | 2 | 3 | 4 | 5 = spread === 'wide' && base > 4 ? 4 : base

  const seriesNum = /^[0-9]+[a-z]?$/i.test((kb.v1_series ?? '').trim()) ? kb.v1_series : null

  return {
    figure: {
      fid: entry.fid,
      href: prettyFigureUrl(kb),
      chipLabel: entry.chipLabel,
      name: kb.v1_name ?? prettifySlug(kb.character_canonical),
      line: `${kb.v1_line ?? prettifySlug(kb.product_line)}${seriesNum ? ` ${seriesNum}` : ''}`,
      genre: prettifySlug(kb.fandom),
      image: thumb(kb.canonical_image_url, 480),
      median,
      p10,
      p90,
      compCount: snap.sold_count,
      confidence,
      ticks,
      spread,
      fieldNote: entry.fieldNote,
    },
    prices,
  }
}

/**
 * Fetch all curated figures (failures drop silently, order preserved) and
 * build the sold-comp tape: 3 real individual sale prices per figure, sampled
 * low/mid/high across each figure's recent solds, round-robin interleaved so
 * consecutive ticker cells rotate through figures.
 */
export async function fetchHomeMarket(): Promise<{ figures: ReceiptFigure[]; tape: TapeItem[] }> {
  const settled = await Promise.allSettled(CURATED.map(fetchOne))
  const figures: ReceiptFigure[] = []
  const perFigure: TapeItem[][] = []
  for (const s of settled) {
    if (s.status !== 'fulfilled' || !s.value) continue
    const { figure, prices } = s.value
    figures.push(figure)
    const picks = prices.length >= 3
      ? [prices[Math.floor(prices.length * 0.25)], prices[Math.floor(prices.length * 0.5)], prices[Math.floor(prices.length * 0.85)]]
      : prices
    perFigure.push(picks.map(p => ({
      label: figure.chipLabel.toUpperCase(),
      price: p,
      href: figure.href,
    })))
  }
  const tape: TapeItem[] = []
  for (let round = 0; round < 3; round++) {
    for (const items of perFigure) {
      if (items[round]) tape.push(items[round])
    }
  }
  return { figures, tape }
}
