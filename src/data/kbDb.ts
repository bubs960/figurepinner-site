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
 * module does not pull the slim JS catalog into the build graph.
 *
 * Surfaces convert by swapping `from '@/data/kb'` → `from '@/data/kbDb'` and
 * adding `await`. Build-time-only readers (homepage shelf, sitemap) do NOT use
 * this module the same way — see homepage fixture + async sitemap.
 *
 * Plan + column map: Bridge/MATCHER-TO-WEB-OPTION-E-SPEC-2026-06-14.md.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { deriveName, figureUrl, prettyFigureUrlKey, stableIdSuffix, type KBFigure } from './kbTypes'

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

// Column list for full-figure reads (detail page, genre/line lists). Order is
// irrelevant to mapRow (keyed access) but kept stable for readability.
const FULL_COLS =
  'figure_id, fandom, character_canonical, manufacturer, product_line, ' +
  'sub_fandom, character_variant, release_wave, scale, pack_size, exclusive_to, ' +
  'canonical_image_url, name, v1_name, v1_line, v1_series, match_represented, key_features'

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
 *    to satisfy the `field?: string` (not `| null`) contract in KBFigure.
 *  - v1_figure_id: dropped from the slim/D1 set, no readers; '' satisfies the type.
 */
function mapRow(r: KBRow): KBFigure {
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

/** Look up a single figure by figure_id (PK). Mirrors kb.getFigureById. */
export async function getFigureById(figure_id: string): Promise<KBFigure | null> {
  const db = await getKbDb()
  const row = await db
    .prepare(`SELECT ${FULL_COLS} FROM kb_figures WHERE figure_id = ?`)
    .bind(figure_id)
    .first<KBRow>()
  return row ? mapRow(row) : null
}

/** Resolve stale/truncated generated IDs when their final stable hash is unique. */
export async function getFigureByStableSuffix(figure_id: string): Promise<KBFigure | null> {
  const suffix = stableIdSuffix(figure_id)
  if (!suffix) return null

  const db = await getKbDb()
  const { results } = await db
    .prepare(
      `SELECT figure_id FROM kb_figures
       WHERE SUBSTR(figure_id, -7, 1) = '_' AND LOWER(SUBSTR(figure_id, -6)) = ?
       LIMIT 2`,
    )
    .bind(suffix)
    .all<{ figure_id: string }>()

  const matches = results ?? []
  if (matches.length !== 1) return null
  return getFigureById(matches[0].figure_id)
}

/** All figures for a given fandom. Mirrors kb.getFiguresByFandom. */
export async function getFiguresByFandom(fandom: string): Promise<KBFigure[]> {
  const db = await getKbDb()
  const { results } = await db
    .prepare(`SELECT ${FULL_COLS} FROM kb_figures WHERE fandom = ?`)
    .bind(fandom)
    .all<KBRow>()
  return (results ?? []).map(mapRow)
}

/**
 * All figures for a fandom + product_line combination. lineSlug can be either
 * the bare product_line ("elite") or manufacturer-prefixed ("wwe-elite") —
 * matched in SQL exactly like the original kb.getFiguresByLine OR-branch.
 */
export async function getFiguresByLine(fandom: string, lineSlug: string): Promise<KBFigure[]> {
  const norm = lineSlug.toLowerCase().trim()
  const db = await getKbDb()
  const { results } = await db
    .prepare(
      `SELECT ${FULL_COLS} FROM kb_figures
       WHERE fandom = ?
         AND (LOWER(product_line) = ? OR LOWER(manufacturer || '-' || product_line) = ?)`,
    )
    .bind(fandom, norm, norm)
    .all<KBRow>()
  return (results ?? []).map(mapRow)
}

/** All unique fandom slugs. Mirrors kb.getAllFandoms. */
export async function getAllFandoms(): Promise<string[]> {
  const db = await getKbDb()
  const { results } = await db
    .prepare('SELECT DISTINCT fandom FROM kb_figures')
    .all<{ fandom: string }>()
  return (results ?? []).map(r => r.fandom)
}

/** All unique product_line values for a fandom. Mirrors kb.getLinesByFandom. */
export async function getLinesByFandom(fandom: string): Promise<string[]> {
  const db = await getKbDb()
  const { results } = await db
    .prepare('SELECT DISTINCT product_line FROM kb_figures WHERE fandom = ?')
    .bind(fandom)
    .all<{ product_line: string }>()
  return (results ?? []).map(r => r.product_line)
}

// ── Pretty-URL uniqueness (sitemap + figure-page canonical) ──────────────────
// kb.ts builds a module-level count map over the whole array. At request time we
// can't hold that map, so:
//   • single figure (detail-page canonical) → one COUNT query (isPrettyUrlUnique)
//   • bulk (sitemap) → scan a narrow projection once, build the map in-handler
//     (buildPrettyUrlMap + prettyFigureUrlFromMap below).

/** True if (fandom, product_line, character_canonical) maps to exactly one figure. */
export async function isPrettyUrlUnique(
  f: Pick<KBFigure, 'fandom' | 'product_line' | 'character_canonical'>,
): Promise<boolean> {
  const db = await getKbDb()
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS c FROM kb_figures
       WHERE fandom = ? AND product_line = ? AND character_canonical = ?`,
    )
    .bind(f.fandom, f.product_line, f.character_canonical)
    .first<{ c: number }>()
  return (row?.c ?? 0) === 1
}

/**
 * Keyword-rich canonical URL for a single figure (figure detail page).
 * Ambiguous (fandom/line/char shared by >1 wave) → stable /figure/[id], so one
 * release can't canonicalize as another. Mirrors kb.prettyFigureUrl semantics.
 */
export async function prettyFigureUrl(f: KBFigure): Promise<string> {
  if (await isPrettyUrlUnique(f)) {
    return `/${f.fandom}/${f.product_line}/${f.character_canonical}`
  }
  return figureUrl(f)
}

// ── Sitemap bulk path ────────────────────────────────────────────────────────
// The sitemap needs every figure's URL + a global uniqueness decision. Pull a
// narrow 4-column projection (not all 18) to keep the scan light, build the
// count map once, then resolve each URL against it with pure helpers.

export interface SitemapRow {
  figure_id: string
  fandom: string
  product_line: string
  character_canonical: string
}

/** Narrow projection of every figure for sitemap URL generation. */
export async function getFiguresForSitemap(): Promise<SitemapRow[]> {
  const db = await getKbDb()
  const { results } = await db
    .prepare('SELECT figure_id, fandom, product_line, character_canonical FROM kb_figures')
    .all<SitemapRow>()
  return results ?? []
}

/** Count map keyed by fandom/product_line/character_canonical for the sitemap. */
export function buildPrettyUrlMap(rows: SitemapRow[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const key = prettyFigureUrlKey(r)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/** Resolve one sitemap row's URL against a prebuilt count map (pure, no I/O). */
export function prettyFigureUrlFromMap(r: SitemapRow, counts: Map<string, number>): string {
  if (counts.get(prettyFigureUrlKey(r)) === 1) {
    return `/${r.fandom}/${r.product_line}/${r.character_canonical}`
  }
  return `/figure/${r.figure_id}`
}
