/**
 * Daily Grail Spotlight (W3, P3 §3 wow #2) — picks one real figure per UTC
 * day by genuine sold-comp momentum, deterministically, from a small curated
 * pool (Steve's call 2026-07-13: small+safe over a broader live-scanned
 * pool). Written ONCE per date to daily_spotlight (migration 0006) so the
 * archive stays stable — see that migration's own header for why.
 *
 * Honesty rule carried over from every other price surface on this site:
 * a day where nothing in the pool clears the trend floor renders an honest
 * "nothing to spotlight" state, never a fabricated pick.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { computeTrend } from '@/app/figure/[figure_id]/_lib/figureFormatters'

async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

// Reused verbatim from the homepage's own SHELF_POOL (page.tsx) — already
// real, KB-verified, genre-diverse fids with real photos. A dedicated copy
// here (not an import) so this feature doesn't couple to the homepage
// array's shape/count changing independently later.
const SPOTLIGHT_POOL: string[] = [
  'fp_wrestling_mattel_elite_112_becky-lynch_3d7e12',
  'fp_wrestling_mattel_elite_100_the-rock_3c447b',
  'fp_wrestling_mattel_ultimate-edition_25_cody-rhodes_83188e',
  'fp_wrestling_mattel_elite_116_jade-cargill_dd785b',
  'fp_wrestling_mattel_elite_1_edge_f3ac96',
  'fp_wrestling_mattel_elite_1_undertaker_6eadf3',
  'fp_wrestling_mattel_elite_26_roman-reigns_ed6a97',
  'fp_wrestling_mattel_elite_25_seth-rollins_4f0cf5',
  'fp_wrestling_mattel_ultimate-edition_5_john-cena_2b9a45',
  'fp_wrestling_mattel_ultimate-edition_9_stone-cold-steve_41cafb',
  'fp_wrestling_mattel_elite_84_rhea-ripley_10845a',
  'fp_wrestling_mattel_elite_81_bianca-belair_786a59',
  'fp_star-wars_hasbro_the-vintage-collection_the-vintage-collection-action-figures_darth-vader_a039ff',
  'fp_star-wars_hasbro_the-vintage-collection_the-vintage-collection-action-figures_boba-fett_3bc65d',
  'fp_star-wars_hasbro_black-series_galaxy_luke-skywalker_234457',
  'fp_star-wars_hasbro_black-series_orange-wave-2013_stormtrooper_ff3e42',
  'fp_gi-joe_hasbro_a-real-american-hero_3-75-action-figures_snake-eyes_c47357',
  'fp_gi-joe_hasbro_a-real-american-hero_3-75-action-figures_cobra-commander_a9ccf4',
  'fp_gi-joe_hasbro_classified-series_classified_duke_23109e',
  'fp_gi-joe_hasbro_classified-series_classified_storm-shadow_e06f94',
  'fp_masters-of-the-universe_mattel_origins_origins-action-figures_skeletor_87c6a1',
  'fp_masters-of-the-universe_mattel_origins_origins-action-figures_he-man_6814e4',
  'fp_transformers_hasbro_war-for-cybertron-kingdom_leader_optimus-prime_9524b9',
  'fp_transformers_hasbro_studio-series_deluxe-class_bumblebee_5fe8e0',
  'fp_marvel-comics_hasbro_marvel-legends_avengers_thanos_59d1dd',
  'fp_marvel-comics_hasbro_marvel-legends_sentinel-baf_wolverine_c8b1f7',
  'fp_dc_mcfarlane_multiverse_mcfarlane_batman_5efc4c',
  'fp_dc_mcfarlane_multiverse_mcfarlane_joker_00a342',
  'fp_tmnt_neca_ultimate_2024_leonardo_a6f2d6',
]

// Rotate through the top N movers by |trend| magnitude rather than always
// the single #1 mover — keeps the pick genuinely different day to day (the
// "return-visit habit" the feature is for) instead of freezing on one
// figure until the data itself shifts.
const TOP_N = 8

const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'

type Candidate = { figureId: string; trendPct: number; compCount: number }

async function fetchCandidate(figureId: string): Promise<Candidate | null> {
  // Same no-AbortSignal-timeout pattern as every other R2 price fetch in
  // this repo (S32) -- combining a dynamic signal with next:{revalidate}
  // forces the fetch out of ISR cache.
  const res = await fetch(
    `${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(figureId)}.json`,
    { next: { revalidate: 3600 } },
  ).catch(() => null)
  if (!res?.ok) return null

  const snap = await res.json() as { sold_count: number; recent?: Array<{ price: number; sold_date: string | null }> }
  const history = (snap.recent ?? []).map(r => ({ price: r.price, sold_date: r.sold_date ?? '' }))
  // computeTrend() IS the comp-count floor: it returns null under 6 total
  // comps by construction (needs >=3 in both the last-30d and prior-30-90d
  // windows) -- the exact "thin data never embarrasses a real figure" guard
  // the spec asks for, reused rather than re-invented with a second number.
  const trendPct = computeTrend(history)
  if (trendPct == null) return null

  return { figureId, trendPct, compCount: snap.sold_count }
}

function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysSinceEpochUTC(d: Date): number {
  return Math.floor(d.getTime() / 86400000)
}

/** Real momentum pick for "right now" -- only meaningful the FIRST time it's
 *  called for a given date (see getOrCreateTodaysSpotlight); calling it
 *  again later the same day could return a different candidate if new sold
 *  comps landed in between, which is exactly why the result gets persisted
 *  rather than re-derived on every request. */
async function computeSpotlightPick(): Promise<Candidate | null> {
  const settled = await Promise.allSettled(SPOTLIGHT_POOL.map(fetchCandidate))
  const candidates = settled
    .filter((s): s is PromiseFulfilledResult<Candidate> => s.status === 'fulfilled' && s.value !== null)
    .map(s => s.value)
  if (candidates.length === 0) return null

  const ranked = [...candidates].sort((a, b) => Math.abs(b.trendPct) - Math.abs(a.trendPct))
  const shortlist = ranked.slice(0, Math.min(TOP_N, ranked.length))
  const idx = daysSinceEpochUTC(new Date()) % shortlist.length
  return shortlist[idx]
}

export type SpotlightRow = { date: string; figureId: string; trendPct: number; compCount: number }

type SpotlightDbRow = { date: string; figure_id: string; trend_pct: number; comp_count: number }
function mapRow(r: SpotlightDbRow): SpotlightRow {
  return { date: r.date, figureId: r.figure_id, trendPct: r.trend_pct, compCount: r.comp_count }
}

/** Read-only -- never writes, never computes. Archive pages call this so a
 *  past date always shows exactly what was actually spotlighted that day. */
export async function getSpotlightByDate(date: string): Promise<SpotlightRow | null> {
  const db = await getDB()
  const row = await db
    .prepare('SELECT date, figure_id, trend_pct, comp_count FROM daily_spotlight WHERE date = ?')
    .bind(date)
    .first<SpotlightDbRow>()
  return row ? mapRow(row) : null
}

/** /today's own data source: read today's row if it already exists, else
 *  compute + persist it (first visitor of the day pays the pool-fetch cost,
 *  everyone else that day just reads). Race-safe the same way shelf_shares'
 *  mint route is: a UNIQUE/PK insert collision re-reads instead of erroring.
 *  Returns null only when NOTHING in the pool cleared the trend floor today
 *  -- the caller renders an honest empty state, never a fake pick. */
export async function getOrCreateTodaysSpotlight(): Promise<SpotlightRow | null> {
  const today = utcDateString(new Date())
  const existing = await getSpotlightByDate(today)
  if (existing) return existing

  const pick = await computeSpotlightPick()
  if (!pick) return null

  const db = await getDB()
  try {
    await db
      .prepare('INSERT INTO daily_spotlight (date, figure_id, trend_pct, comp_count) VALUES (?, ?, ?, ?)')
      .bind(today, pick.figureId, pick.trendPct, pick.compCount)
      .run()
  } catch {
    const row = await getSpotlightByDate(today)
    return row // null only if the race-loser's own re-read somehow still finds nothing (shouldn't happen; not fatal either way)
  }
  return { date: today, figureId: pick.figureId, trendPct: pick.trendPct, compCount: pick.compCount }
}
