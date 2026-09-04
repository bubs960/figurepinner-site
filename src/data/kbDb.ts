/**
 * Request-time KB access layer (Option E — KB moved out of the build graph)
 *
 * The full slim figure array (src/data/figures-reference-v2.slim.js, read by
 * src/data/kb.ts) is what OOM'd `next build`: every static-gen worker instantiated
 * its own copy. Option E moves the catalog to a D1 table (`kb_figures`) read at
 * request/ISR time, so the array stops entering the build graph entirely.
 *
 * This module mirrors the sync helpers in src/data/kb.ts but reads D1 (binding
 * KB_DB) instead of the bundled array. Pure helpers live in kbTypes.ts so this
 * module does not pull the slim JS catalog into the build graph. The SQL itself
 * lives in kbDbQueries.ts (D1-free) so scripts/kb-d1-parity-local.mjs can run the
 * identical statements against the local SQLite file.
 *
 * OOM stage 2 (2026-09-02, plan §6 "bounded query contracts"): every public route
 * now resolves through an indexed equality and a bounded projection —
 *   • route resolution: (character_canonical) seek, never a fandom scan;
 *   • line hubs: (fandom, product_line) seeks (bare + compound splits) in ONE batch;
 *   • figure page related rows: wave companions + character cards, compact cols;
 *   • pretty-URL resolution for lists: one narrow ROUTE_COLS read → in-request
 *     count map (prettyUrlRouterCountKeys), never N COUNT queries;
 *   • vault line-completion: GROUP BY in SQL, never a row scan in JS.
 * The whole-fandom FULL_COLS reader (getFiguresByFandom) is gone: kbLite.ts is
 * the build-time/bulk reader, getCardsByFandom (compact) serves the genre hub.
 *
 * Surfaces convert by swapping the `@/data/kb` import for `@/data/kbDb` and
 * adding `await`. Build-time-only readers (homepage shelf, sitemap) do NOT use
 * this module — they read kbLite.ts.
 *
 * Plan + column map: Bridge/MATCHER-TO-WEB-OPTION-E-SPEC-2026-06-14.md.
 */

import { cache } from 'react'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
  deriveName, figureUrl, prettyUrlRouterCountKeys, prettyUrlRouterLookupKey,
  genreSlugForFandom, type KBFigure,
} from './kbTypes'
import { SQL, FULL_COLS, CARD_COLS, ROUTE_COLS, IN_CHUNK, norm, chunk, lineQueryPlan, sortLikeFandomScan, type WithRid } from './kbDbQueries'
import { getFigureByStableSuffix as liteFigureByStableSuffix, getAllFandoms as liteAllFandoms } from './kbLite'

// Re-export the pure parts so a converted surface can import everything from
// one place (`import { getFigureById, deriveName } from '@/data/kbDb'`).
export { deriveName, figureUrl }
export type { KBFigure }

/**
 * Raw D1 row shape. kb_figures is all-TEXT (D1 = SQLite): every column comes
 * back as string | null. The 18 columns are the slim KEEP set minus v1_figure_id
 * (dropped from the slim whitelist 2026-06-14, zero readers). mapRow() coerces
 * these into the KBFigure contract the rest of the app already expects.
 */
interface KBRow {
  figure_id: string
  fandom: string
  character_canonical: string
  manufacturer: string
  product_line: string
  sub_fandom: string | null
  character_variant: string | null
  release_wave: string | null
  scale: string | null
  pack_size: string | null
  exclusive_to: string | null
  canonical_image_url: string | null
  name: string | null
  v1_name: string | null
  v1_line: string | null
  v1_series: string | null
  match_represented: string | null
  key_features: string | null
}

/** CARD_COLS row: the two prose columns are simply absent. */
type KBCardRow = Omit<KBRow, 'match_represented' | 'key_features'> &
  Partial<Pick<KBRow, 'match_represented' | 'key_features'>>

/** ROUTE_COLS row — exactly what prettyUrlRouterCountKeys needs. */
interface KBRouteRow {
  figure_id: string
  fandom: string
  manufacturer: string
  product_line: string
  character_canonical: string
}

/**
 * One element of a db.batch() result. The local shim (src/types/cloudflare.d.ts)
 * types batch<T>() as Promise<T[]> where T is the whole per-statement result, so
 * T is spelled out as the { results } envelope here.
 */
type BatchRows<T> = { results?: T[] }

async function getKbDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).KB_DB as D1Database
}

/**
 * Map a raw D1 row → KBFigure.
 *  - pack_size: stored as the STRING "1" in the KB (matcher CORRECTION #1);
 *    coerced string→number here so the `number` contract holds for every reader
 *    (FigureDetailContent already does Number(...) defensively; this makes the
 *    type honest without changing it).
 *  - release_wave: type is `string` but the column is nullable; null→'' keeps
 *    isNumericWave('')===false, identical behavior to a null wave.
 *  - optional fields (name, v1_*, match_represented, key_features): null→undefined
 *    to satisfy the `field?: string` (not `| null`) contract in KBFigure. A
 *    CARD_COLS row never carries the two prose fields — they stay undefined.
 *  - v1_figure_id: dropped from the slim/D1 set, no readers; '' satisfies the type.
 */
function mapRow(r: KBCardRow): KBFigure {
  return {
    figure_id: r.figure_id,
    v1_figure_id: '',
    fandom: r.fandom,
    sub_fandom: r.sub_fandom,
    character_canonical: r.character_canonical,
    character_variant: r.character_variant,
    manufacturer: r.manufacturer,
    product_line: r.product_line,
    release_wave: r.release_wave ?? '',
    scale: r.scale,
    pack_size: r.pack_size == null ? 1 : Number(r.pack_size) || 1,
    exclusive_to: r.exclusive_to,
    canonical_image_url: r.canonical_image_url,
    name: r.name ?? undefined,
    v1_name: r.v1_name ?? undefined,
    v1_line: r.v1_line ?? undefined,
    v1_series: r.v1_series ?? undefined,
    match_represented: r.match_represented ?? undefined,
    key_features: r.key_features ?? undefined,
  }
}

// Request-level memo (2026-09-02, gap sweep finding 5): generateMetadata, the
// page body and FigureDetailContent each called getFigureById for the SAME id
// in one render (3 PK reads per figure regen; the hub's metadata + body each
// ran the line plan, 2× per hub render). React's cache() dedupes identical-
// argument calls within one server render and is a passthrough everywhere else
// (scripts via ts-loader, route handlers), so no caller changed. Only pure
// reads keyed by their string args are wrapped; getFiguresByIds takes an array
// (identity-keyed, would never hit) and stays as is.
// ── Point lookups ─────────────────────────────────────────────────────────────

/** Look up a single figure by figure_id (PK). Mirrors kb.getFigureById. */
export const getFigureById = cache(async function getFigureById(figure_id: string): Promise<KBFigure | null> {
  const db = await getKbDb()
  const row = await db.prepare(SQL.figureById).bind(figure_id).first<KBRow>()
  return row ? mapRow(row) : null
})

/** Batch PK lookup (vault, guides). Chunked under D1's bound-parameter limit, one batch round trip. */
export async function getFiguresByIds(ids: string[]): Promise<Map<string, KBFigure>> {
  const out = new Map<string, KBFigure>()
  const unique = [...new Set(ids)].filter(Boolean)
  if (!unique.length) return out
  const db = await getKbDb()
  const stmts = chunk(unique, IN_CHUNK).map(part => db.prepare(SQL.figuresByIds(part.length)).bind(...part))
  for (const res of await db.batch<BatchRows<KBRow>>(stmts)) {
    for (const row of res.results ?? []) out.set(row.figure_id, mapRow(row))
  }
  return out
}

/**
 * Resolve stale/truncated generated IDs when their final stable hash is unique.
 * 404-path only.
 *
 * 2026-09-03 (SCALE-ALERT 9/3, D1 rows/query 4,294): the D1 form
 * (SQL.stableSuffix, a SUBSTR() predicate the planner cannot index) was the
 * single largest KB read on the account — 560 M rows / 24 h, ~23.5k
 * executions at ~23.8k rows each, i.e. bots re-hitting stale /figure/<id>
 * URLs paying a full PK-index scan per 404. The suffix → figure map already
 * exists in memory (kbLite.bySuffix, built lazily from the prose-free
 * catalog projection, same unique-or-null semantics as `LIMIT 2` /
 * `length !== 1`), so resolve there and spend ONE indexed PK seek on D1 for
 * the full record. Skipped: an expression index on the suffix — a schema
 * change routed through the emitter + swap (plan §6 rule 5); add it if the
 * lite map's lazy parse ever shows up in isolate memory on the 404 path.
 */
export async function getFigureByStableSuffix(figure_id: string): Promise<KBFigure | null> {
  const lite = liteFigureByStableSuffix(figure_id)
  if (!lite) return null
  return getFigureById(lite.figure_id)
}

// ── Bounded set reads ─────────────────────────────────────────────────────────

/**
 * Every figure of one character within a fandom, FULL_COLS — the route
 * resolver's candidate set (findFigureMatches.ts), which renders the winner.
 * `character` is bound exactly as given (the router normalizes its own slug;
 * the character hub passes the raw URL segment, matching its old exact filter).
 */
export const getFiguresByCharacter = cache(async function getFiguresByCharacter(fandom: string, character: string): Promise<KBFigure[]> {
  const db = await getKbDb()
  const { results } = await db.prepare(SQL.figuresByCharacter(FULL_COLS)).bind(fandom, character).all<KBRow & WithRid>()
  return sortLikeFandomScan(results ?? []).map(mapRow)
})

/** Same set as getFiguresByCharacter, compact cards (character hub, figure-page variants). */
export const getCardsByCharacter = cache(async function getCardsByCharacter(fandom: string, character: string): Promise<KBFigure[]> {
  const db = await getKbDb()
  const { results } = await db.prepare(SQL.figuresByCharacter(CARD_COLS)).bind(fandom, character).all<KBCardRow & WithRid>()
  return sortLikeFandomScan(results ?? []).map(mapRow)
})

/**
 * Compact cards for a whole fandom — the genre hub (ISR) renders the fandom's
 * line groups and counts. The one remaining whole-fandom read; no prose.
 */
export const getCardsByFandom = cache(async function getCardsByFandom(fandom: string): Promise<KBFigure[]> {
  const db = await getKbDb()
  const { results } = await db.prepare(SQL.cardsByFandom).bind(fandom).all<KBCardRow & WithRid>()
  return sortLikeFandomScan(results ?? []).map(mapRow)
})

/**
 * All figures for a fandom + product_line combination. lineSlug can be either
 * the bare product_line ("elite") or manufacturer-prefixed ("wwe-elite") —
 * the same OR the router accepts (findFigureMatches.ts), now served as ONE
 * db.batch of (fandom, product_line[, manufacturer]) index lookups instead of
 * a fandom scan evaluating LOWER(manufacturer || '-' || product_line) per row.
 * Results are merged back into table order (rowid), so callers that take the
 * first N (JSON-LD ItemList) see the same rows the old single scan returned.
 */
export const getFiguresByLine = cache(async function getFiguresByLine(fandom: string, lineSlug: string): Promise<KBFigure[]> {
  const db = await getKbDb()
  const plan = lineQueryPlan(FULL_COLS, fandom, lineSlug)
  const results = await db.batch<BatchRows<KBRow & WithRid>>(plan.map(q => db.prepare(q.sql).bind(...q.params)))
  const seen = new Set<string>()
  const rows: Array<KBRow & WithRid> = []
  for (const res of results) {
    for (const row of res.results ?? []) {
      if (seen.has(row.figure_id)) continue
      seen.add(row.figure_id)
      rows.push(row)
    }
  }
  return sortLikeFandomScan(rows).map(mapRow)
})

/**
 * Figures sharing the current figure's (fandom, product_line, release_wave) —
 * the figure page's "full wave" (includes the current figure; caller excludes
 * it). Compact cards. `releaseWave` is the mapped value ('' for a null wave).
 */
export async function getWaveCompanions(fandom: string, productLine: string, releaseWave: string): Promise<KBFigure[]> {
  const db = await getKbDb()
  const empty = releaseWave === ''
  const stmt = empty
    ? db.prepare(SQL.waveCompanions(CARD_COLS, true)).bind(fandom, productLine)
    : db.prepare(SQL.waveCompanions(CARD_COLS, false)).bind(fandom, productLine, releaseWave)
  const { results } = await stmt.all<KBCardRow & WithRid>()
  return sortLikeFandomScan(results ?? []).map(mapRow)
}

/**
 * Per-(product_line, release_wave) figure counts for one fandom, waves only
 * (null/'' waves excluded — a wave-less bucket is not a completable line).
 * Vault line-completion denominators; replaces a whole-fandom row read.
 */
type LineWaveCount = { product_line: string; release_wave: string; count: number }
// Release M (2026-09-04, speed program S2): per-isolate memo, keyed by fandom.
// The only caller is /app/vault (force-dynamic, no ISR), so every Vault view
// re-ran one GROUP BY per fandom in the shelf. Denominators change only on a
// KB pour, so a 1 h TTL — the same TTL the retired getAllFandoms memo used, deliberately
// NOT the hubs' 24 h — bounds staleness to the same window the fandom list
// already accepts. Same de-poison rule: a failed read clears its own entry.
const LINE_WAVE_TTL_MS = 60 * 60 * 1000
const lineWaveMemo = new Map<string, { at: number; value: Promise<LineWaveCount[]> }>()

export async function getLineWaveCounts(fandom: string): Promise<LineWaveCount[]> {
  const now = Date.now()
  const hit = lineWaveMemo.get(fandom)
  if (hit && now - hit.at < LINE_WAVE_TTL_MS) return hit.value
  const value = (async () => {
    const db = await getKbDb()
    const { results } = await db
      .prepare(SQL.lineWaveCounts)
      .bind(fandom)
      .all<{ product_line: string; release_wave: string; c: number }>()
    return (results ?? []).map(r => ({ product_line: r.product_line, release_wave: r.release_wave, count: Number(r.c) }))
  })()
  lineWaveMemo.set(fandom, { at: now, value })
  value.catch(() => { if (lineWaveMemo.get(fandom)?.value === value) lineWaveMemo.delete(fandom) })
  return value
}

// Release M (2026-09-04): kbDb's own `getAllFandoms` (the memoised
// `SELECT DISTINCT fandom` scan, Release H) was removed here — Release J's
// `isKnownFandom` below replaced its only render-path use, and a repo-wide
// check (src/, scripts/, tests/) found zero importers of the kbDb export; every
// `getAllFandoms` caller imports the build-time list from kb.ts / kbLite.ts.
// Its 1 h TTL pattern lives on in getLineWaveCounts above.

/**
 * Route-validity gate for hubs (2026-09-03, SCALE-ALERT 9/3 follow-up): is
 * `fandom` a real KB fandom? The build-time list (kb-stats, via kbLite) answers
 * for free; only a fandom NOT in that list -- i.e. one added by a D1 swap since
 * the last deploy -- falls through to a 1-row indexed existence probe. The
 * previous gate ran `SELECT DISTINCT fandom` (a 23.5k-row scan) per hub render,
 * ~7.7k times/day; the 1 h memo cut that to ~116/h because isolates churn.
 */
export const isKnownFandom = cache(async function isKnownFandom(fandom: string): Promise<boolean> {
  if (liteAllFandoms().includes(fandom)) return true
  const db = await getKbDb()
  const row = await db.prepare(SQL.fandomExists).bind(fandom).first<{ one: number }>()
  return Boolean(row)
})

/** All unique product_line values for a fandom. Mirrors kb.getLinesByFandom. */
export const getLinesByFandom = cache(async function getLinesByFandom(fandom: string): Promise<string[]> {
  const db = await getKbDb()
  const { results } = await db.prepare(SQL.linesByFandom).bind(fandom).all<{ product_line: string }>()
  return (results ?? []).map(r => r.product_line)
})

// ── Pretty-URL uniqueness (canonical + list links) ───────────────────────────
// kb.ts builds a module-level count map over the whole array. At request time:
//   • single figure (detail-page canonical) → one indexed COUNT (isPrettyUrlUnique)
//   • lists → ONE narrow ROUTE_COLS read for the characters involved, then the
//     shared prettyUrlRouterCountKeys map in-request (prettyUrlCountsForCharacters,
//     prettyFigureUrls, prettyUrlCountsForLineHub). Hubs that already hold every
//     row of a fandom/character build the map from their own rows with
//     buildPrettyUrlMap — zero extra queries, exact by construction, because a
//     count key `fandom|character|lineToken` is only ever contributed to by rows
//     of that fandom AND that character.

/**
 * True if this figure's pretty URL resolves to exactly one figure AT REQUEST
 * TIME — i.e. under the router's own match semantics, not exact field equality.
 *
 * 2026-07-27: this previously asked `product_line = ?`, which is the wrong
 * question. `/[genre]/[line]/[slug]` accepts a line segment matching EITHER
 * product_line OR the manufacturer-product_line compound (findFigureMatches.ts,
 * and the identical OR-branch in getFiguresByLine above), so a row whose exact
 * key is unique can still be ambiguous at request time and 308 away to a
 * different figure. That divergence put 6 bad URLs in the live sitemap via the
 * bundled-array twin of this function. Kept byte-aligned with
 * prettyUrlRouterCountKeys in kbTypes.ts — one predicate, three implementations
 * (array, SQL COUNT, in-request map); they must agree.
 *
 * Stage 2: the LOWER() wrappers are gone (catalog invariant: stored values are
 * already lowercase; parameters are normalized here) so the planner seeks the
 * (character_canonical) index instead of scanning the fandom.
 */
export async function isPrettyUrlUnique(
  f: Pick<KBFigure, 'fandom' | 'product_line' | 'character_canonical'>,
): Promise<boolean> {
  const line = norm(f.product_line)
  const char = norm(f.character_canonical)
  const db = await getKbDb()
  const row = await db.prepare(SQL.prettyUrlUniqueCount).bind(f.fandom, char, line, line).first<{ c: number }>()
  return (row?.c ?? 0) === 1
}

/**
 * Keyword-rich canonical URL for a single figure (figure detail page).
 * Ambiguous (fandom/line/char shared by >1 wave) → stable /figure/[id], so one
 * release can't canonicalize as another. Mirrors kb.prettyFigureUrl semantics.
 *
 * MUST emit the site's genre slug (genreSlugForFandom), never raw f.fandom —
 * same fix as kb.ts's prettyFigureUrl, same reason: the raw-fandom form
 * points canonicals/sitemap at namespaces with 404ing hubs and zero internal
 * links for the 4 remapped fandoms, which Google refused to index (the
 * 2026-07 index collapse). This module carried the bug independently of
 * kb.ts's fix (b01e823 never touched this file) — see
 * WEBAUDIT-FINAL-CYCLE-PLAN-2026-07-12.md §4 C1.
 *
 * Detail routes only. For a LIST of figures use prettyFigureUrls (one read).
 */
export async function prettyFigureUrl(f: KBFigure): Promise<string> {
  if (await isPrettyUrlUnique(f)) {
    return `/${genreSlugForFandom(f.fandom)}/${f.product_line}/${f.character_canonical}`
  }
  return figureUrl(f)
}

/**
 * Count map sufficient to resolve every figure of the given characters within
 * one fandom: ONE db.batch of narrow ROUTE_COLS IN-lookups (≤ IN_CHUNK
 * characters each), then the shared router-key counting.
 */
export async function prettyUrlCountsForCharacters(fandom: string, characters: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(characters.map(norm))].filter(Boolean)
  if (!unique.length) return new Map()
  const db = await getKbDb()
  const stmts = chunk(unique, IN_CHUNK).map(part =>
    db.prepare(SQL.routeRowsForCharacters(part.length)).bind(...part),
  )
  const rows: KBRouteRow[] = []
  // fandom is filtered here, not in SQL — see SQL.routeRowsForCharacters.
  for (const res of await db.batch<BatchRows<KBRouteRow>>(stmts)) {
    for (const r of res.results ?? []) if (r.fandom === fandom) rows.push(r)
  }
  return buildPrettyUrlMap(rows)
}

/**
 * Pretty URL for EVERY figure in a list, figure_id → URL, from one narrow read
 * per fandom involved (figure page related rows: ≤25 figures, ≤13 characters,
 * one statement). Same verdict as prettyFigureUrl for each figure.
 */
export async function prettyFigureUrls(figures: KBFigure[]): Promise<Map<string, string>> {
  const byFandom = new Map<string, KBFigure[]>()
  for (const f of figures) {
    const list = byFandom.get(f.fandom)
    if (list) list.push(f)
    else byFandom.set(f.fandom, [f])
  }
  const counts = new Map<string, number>()
  for (const [fandom, list] of byFandom) {
    const part = await prettyUrlCountsForCharacters(fandom, list.map(f => f.character_canonical))
    for (const [k, v] of part) counts.set(k, v)
  }
  const out = new Map<string, string>()
  for (const f of figures) out.set(f.figure_id, prettyFigureUrlFromMap(f, counts))
  return out
}

/**
 * Count map for a LINE HUB's figures, given the complete per-fandom result sets
 * getFiguresByLine returned for `lineToken`. A figure matched by the bare token
 * (product_line === token) is fully counted by those rows already — every row
 * that contributes to its key is in the same line set. A figure matched via the
 * manufacturer-compound form has a DIFFERENT product_line, whose contributors
 * (same product_line under other manufacturers) are not in the set; those
 * (rare, alias-URL) cases fetch the narrow route rows for that product_line.
 * Common case: zero extra queries.
 */
export async function prettyUrlCountsForLineHub(figures: KBFigure[], lineToken: string): Promise<Map<string, number>> {
  const token = norm(lineToken)
  const byFandom = new Map<string, KBFigure[]>()
  for (const f of figures) {
    const list = byFandom.get(f.fandom)
    if (list) list.push(f)
    else byFandom.set(f.fandom, [f])
  }
  const rows = new Map<string, KBRouteRow>()
  for (const f of figures) rows.set(f.figure_id, f)
  const db = await getKbDb()
  for (const [fandom, list] of byFandom) {
    const otherLines = [...new Set(list.map(f => norm(f.product_line)))].filter(pl => pl !== token)
    if (!otherLines.length) continue
    const stmts = otherLines.flatMap(pl =>
      lineQueryPlan(ROUTE_COLS, fandom, pl).map(q => db.prepare(q.sql).bind(...q.params)),
    )
    for (const res of await db.batch<BatchRows<KBRouteRow>>(stmts)) {
      for (const r of res.results ?? []) if (!rows.has(r.figure_id)) rows.set(r.figure_id, r)
    }
  }
  return buildPrettyUrlMap([...rows.values()])
}

/** Pure: is `f` unique under a count map built for its fandom + character. */
export function prettyUrlIsUnique(f: SitemapRow, counts: Map<string, number>): boolean {
  return counts.get(prettyUrlRouterLookupKey(f)) === 1
}

// ── Count-map helpers (pure) ──────────────────────────────────────────────────
// Originally the sitemap bulk path (src/app/sitemap.ts reads kbLite.ts now, not
// D1 — 2026-07-20 cost audit removed the never-wired getFiguresForSitemap).
// SitemapRow + the two pure helpers are the in-request map every list surface
// above resolves through, and are regression-tested in
// tests/prettyFigureUrl.test.mjs (twin-namespace raw-fandom URL bug, b01e823).

export interface SitemapRow {
  figure_id: string
  fandom: string
  product_line: string
  character_canonical: string
  // Added 2026-07-27: required by the router-semantics uniqueness predicate —
  // the router matches a URL's line segment against `manufacturer-product_line`
  // as well as `product_line`, so uniqueness cannot be decided without it.
  // Optional so existing callers still typecheck; absent manufacturer simply
  // degrades to the bare-product_line token. Every D1 projection that feeds
  // these rows (ROUTE_COLS, CARD_COLS, FULL_COLS) includes manufacturer.
  manufacturer?: string
}

/**
 * Count map for pretty-URL uniqueness, using the ROUTER's match semantics.
 *
 * Shares prettyUrlRouterCountKeys with kb.ts deliberately: these two modules
 * answering the same question differently is exactly the defect this replaced
 * (build-time counted exact field equality, request-time matched the
 * mfr-line compound, and 6 sitemap URLs 308'd to a different figure). One
 * predicate, both callers — the parity test in tests/prettyFigureUrl.test.mjs
 * fails the build if they drift.
 */
export function buildPrettyUrlMap(rows: SitemapRow[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const r of rows) {
    for (const key of prettyUrlRouterCountKeys(r)) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * Resolve one row's URL against a prebuilt count map (pure, no I/O).
 * Same genre-slug requirement as prettyFigureUrl above — this is the second
 * of the two call sites that carried the raw-fandom bug in this file (the
 * sitemap bulk path, the higher-consequence one since it emits every
 * figure's canonical in one pass).
 */
export function prettyFigureUrlFromMap(r: SitemapRow, counts: Map<string, number>): string {
  if (counts.get(prettyUrlRouterLookupKey(r)) === 1) {
    return `/${genreSlugForFandom(r.fandom)}/${r.product_line}/${r.character_canonical}`
  }
  return `/figure/${r.figure_id}`
}
