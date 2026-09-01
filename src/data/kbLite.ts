/**
 * kbLite — Worker-runtime KB access over the PROSE-FREE catalog projection.
 *
 * Drop-in for the sync kb.ts API (same function names, same semantics) for
 * every runtime reader that only needs identity / route / name / image fields:
 * search index, sitemap rows, homepage shelf, guide comp links, hub payload
 * URL resolution.
 *
 * WHY (OOM incident 2026-08-31 → 09-01): OpenNext emits ONE server bundle, so
 * a single import of kb.ts anywhere in the app inlines the full 22MB slim
 * catalog (mostly match_represented / key_features prose) into the handler,
 * and every cold isolate pays for it before serving anything. kb.ts is now
 * build-script-only; tests/kbRuntimeImports.test.mjs fails the build if any
 * src/ module imports it again, and scripts/assert-no-runtime-kb-in-handler.mjs
 * checks the compiled handler after `build:cf`.
 *
 * SHAPE: scripts/build-kb-stats.mjs writes src/data/kb-lite.generated.json as
 * { hosts, count, rows } where `rows` is the tuple array serialised as ONE
 * JSON string. The bundle therefore holds a ~7MB string at module load and
 * this module only materialises objects on first call (lazy parse) — an
 * isolate that never serves search/sitemap/home never builds them.
 *
 * CONTRACT: returned objects are typed KBFigure so callers don't change, but
 * the prose fields (match_represented, key_features), scale, pack_size,
 * sub_fandom and exclusive_to are ALWAYS empty here. Anything rendering those
 * must read D1 via kbDb.ts. is_canary figures are excluded at generation.
 *
 * Full catalog readers: kbDb.ts (D1, request time). Build-only: kb.ts.
 */

import lite from './kb-lite.generated.json'
import kbStats from './kb-stats.generated.json'
import {
  figureUrl,
  prettyUrlRouterCountKeys,
  prettyUrlRouterLookupKey,
  stableIdSuffix,
  genreSlugForFandom,
  type KBFigure,
} from './kbTypes'
export { deriveName, deriveEmbeddedLine, figurePageTitle, figureUrl, isNumericWave, titleCaseValue } from './kbTypes'
export type { KBFigure } from './kbTypes'

// Tuple layout — MUST match buildKbLite() in scripts/build-kb-stats.mjs.
type LiteRow = [
  string,          // 0 figure_id
  string,          // 1 fandom
  string,          // 2 manufacturer
  string,          // 3 product_line
  string,          // 4 character_canonical
  string | null,   // 5 character_variant
  string | null,   // 6 release_wave
  number,          // 7 image host index (-1 = none)
  string | null,   // 8 image path
  string | null,   // 9 name
  string | null,   // 10 v1_name
  string | null,   // 11 v1_line
  string | null,   // 12 v1_series
]

interface LiteGenerated {
  hosts: string[]
  count: number
  rows: string
}

const LITE: LiteGenerated = lite as LiteGenerated

function rowToFigure(r: LiteRow): KBFigure {
  const img = r[8] == null ? null : r[7] >= 0 ? `${LITE.hosts[r[7]]}${r[8]}` : r[8]
  return {
    figure_id: r[0],
    v1_figure_id: '',
    fandom: r[1],
    sub_fandom: null,
    character_canonical: r[4],
    character_variant: r[5],
    manufacturer: r[2],
    product_line: r[3],
    release_wave: r[6] ?? '',
    scale: null,
    pack_size: 1,
    exclusive_to: null,
    canonical_image_url: img,
    name: r[9] ?? undefined,
    v1_name: r[10] ?? undefined,
    v1_line: r[11] ?? undefined,
    v1_series: r[12] ?? undefined,
    match_represented: undefined,
    key_features: undefined,
  }
}

// ── Lazy materialisation ────────────────────────────────────────────────────
// Everything below is built on first call, once per isolate, and reused.

let ALL: KBFigure[] | null = null
let BY_ID: Map<string, KBFigure> | null = null
let BY_FANDOM: Map<string, KBFigure[]> | null = null
let BY_SUFFIX: Map<string, KBFigure | null> | null = null
let PRETTY_COUNTS: Map<string, number> | null = null
let FANDOMS: string[] | null = null

function all(): KBFigure[] {
  if (!ALL) {
    const rows = JSON.parse(LITE.rows) as LiteRow[]
    ALL = rows.map(rowToFigure)
  }
  return ALL
}

function byId(): Map<string, KBFigure> {
  if (!BY_ID) {
    const m = new Map<string, KBFigure>()
    for (const f of all()) m.set(f.figure_id, f)
    BY_ID = m
  }
  return BY_ID
}

function byFandom(): Map<string, KBFigure[]> {
  if (!BY_FANDOM) {
    const m = new Map<string, KBFigure[]>()
    for (const f of all()) {
      const bucket = m.get(f.fandom)
      if (bucket) bucket.push(f)
      else m.set(f.fandom, [f])
    }
    BY_FANDOM = m
  }
  return BY_FANDOM
}

function bySuffix(): Map<string, KBFigure | null> {
  if (!BY_SUFFIX) {
    const m = new Map<string, KBFigure | null>()
    for (const f of all()) {
      const suffix = stableIdSuffix(f.figure_id)
      if (!suffix) continue
      m.set(suffix, m.has(suffix) ? null : f)
    }
    BY_SUFFIX = m
  }
  return BY_SUFFIX
}

// Same predicate as kb.ts / kbDb.ts: counted under the ROUTER's match
// semantics (prettyUrlRouterCountKeys), never exact field equality. One
// predicate, now four implementations — tests/prettyFigureUrl.test.mjs guards
// the drift.
function prettyCounts(): Map<string, number> {
  if (!PRETTY_COUNTS) {
    const counts = new Map<string, number>()
    for (const f of all()) {
      for (const key of prettyUrlRouterCountKeys(f)) {
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    PRETTY_COUNTS = counts
  }
  return PRETTY_COUNTS
}

// ── Public API (mirrors kb.ts, sync) ────────────────────────────────────────

/** Every non-canary figure, catalog order. Materialises the lite catalog. */
export function getAllFigures(): KBFigure[] {
  return all()
}

/**
 * All unique fandom slugs in catalog encounter order — same order kb.ts
 * returns. Deliberately does NOT parse the tuple string: robots/sitemap-index
 * only need this list, so it comes from the compact kb-stats aggregate.
 */
export function getAllFandoms(): string[] {
  if (!FANDOMS) FANDOMS = Object.keys((kbStats as { fandoms: Record<string, unknown> }).fandoms)
  return FANDOMS
}

export function getFigureById(figure_id: string): KBFigure | null {
  return byId().get(figure_id) ?? null
}

/** Resolve stale/truncated generated IDs when their final stable hash is unique. */
export function getFigureByStableSuffix(figure_id: string): KBFigure | null {
  const suffix = stableIdSuffix(figure_id)
  if (!suffix) return null
  return bySuffix().get(suffix) ?? null
}

export function getFiguresByFandom(fandom: string): KBFigure[] {
  return byFandom().get(fandom) ?? []
}

/**
 * fandom + product_line, where lineSlug is either the bare product_line
 * ("elite") or manufacturer-prefixed ("wwe-elite") — identical OR-branch to
 * kb.getFiguresByLine and kbDb.getFiguresByLine.
 */
export function getFiguresByLine(fandom: string, lineSlug: string): KBFigure[] {
  const norm = lineSlug.toLowerCase().trim()
  return getFiguresByFandom(fandom).filter(f => {
    const pl = f.product_line.toLowerCase()
    const mfr = f.manufacturer.toLowerCase()
    return pl === norm || `${mfr}-${pl}` === norm
  })
}

export function getLinesByFandom(fandom: string): string[] {
  return [...new Set(getFiguresByFandom(fandom).map(f => f.product_line))]
}

export function hasUniquePrettyFigureUrl(f: KBFigure): boolean {
  return prettyCounts().get(prettyUrlRouterLookupKey(f)) === 1
}

/**
 * Keyword-rich canonical URL, or the stable /figure/[id] URL when the pretty
 * path is ambiguous. MUST emit genreSlugForFandom(f.fandom), never raw
 * f.fandom — see kb.ts prettyFigureUrl for the 2026-07 index-collapse history.
 */
export function prettyFigureUrl(f: KBFigure): string {
  if (!hasUniquePrettyFigureUrl(f)) return figureUrl(f)
  return `/${genreSlugForFandom(f.fandom)}/${f.product_line}/${f.character_canonical}`
}
