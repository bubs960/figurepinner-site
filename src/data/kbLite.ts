/**
 * kbLite — Worker-runtime KB access over the PROSE-FREE catalog projection.
 *
 * Drop-in for the sync kb.ts API (same function names, same semantics -- now
 * ASYNC, see below) for every runtime reader that only needs identity /
 * route / name / image fields: search index, sitemap rows, homepage shelf,
 * guide comp links, hub payload URL resolution.
 *
 * WHY (OOM incident 2026-08-31 -> 09-01): OpenNext emits ONE server bundle, so
 * a single import of kb.ts anywhere in the app inlines the full 22MB slim
 * catalog (mostly match_represented / key_features prose) into the handler,
 * and every cold isolate pays for it before serving anything. kb.ts is now
 * build-script-only; tests/kbRuntimeImports.test.mjs fails the build if any
 * src/ module imports it again, and scripts/assert-no-runtime-kb-in-handler.mjs
 * checks the compiled handler after `build:cf`.
 *
 * OUT-OF-BUNDLE LOAD (2026-09-15, SCALE-ALERT 9/9-9/12 + LANE-STATE #1 cost
 * lever): a static `import lite from './kb-lite.generated.json'` here used to
 * get the ~8MB tuple string INLINED into the compiled handler as one JS
 * string literal -- the exact "longest line" the deploy-gate's 12MB ceiling
 * was tracking (growing ~0.07-0.1MB/day, ~34 days to cross) and a chunk of
 * the 29.4MB cold-render handler eval cost. scripts/build-kb-stats.mjs now
 * writes the SAME artifact to `public/kb-lite.generated.json` instead of
 * `src/data/`, so it ships as a static asset (like every other public/ file,
 * copied verbatim into `.open-next/assets`) rather than a bundled module.
 * This module reads it via the `ASSETS` binding already declared in
 * wrangler.toml (`env.ASSETS.fetch`, same "out-of-bundle, read via a
 * binding" shape src/lib/priceStore.ts already uses for R2 price reads) --
 * ONE fetch per isolate, memoized, same lazy-materialise pattern as before.
 * Falls back to a direct disk read of `public/kb-lite.generated.json` when
 * the binding is absent (next dev, `node --test`, build scripts) -- there is
 * no real filesystem inside a Worker, so that branch never fires in
 * production; it only exists for non-Worker execution. See loadLite() below.
 * That fallback's `node:fs`/`node:path`/`node:url` imports are DYNAMIC and
 * gated behind `typeof window === 'undefined'`, not top-level static imports
 * -- this module is (transitively, via kbDb.ts) reachable from at least one
 * 'use client' component today (VaultClient.tsx -> vaultData.ts), and a
 * static node: import broke that client webpack build the first time this
 * fallback existed. Next's client compiler statically resolves `typeof
 * window` to `"object"` and dead-code-eliminates the guarded branch (the
 * standard isomorphic-module pattern); the server/Worker bundle keeps it as
 * a real runtime check.
 *
 * ASYNC CONTRACT: every function below that touches the catalog is now
 * `async` (getAllFandoms is the one exception -- it reads the tiny
 * kb-stats.generated.json, still a normal bundled import, no change). Every
 * call site was converted to `await` in the same change; see
 * WEB-TO-STANDALONE... 2026-09-15 relay / board line for the full call-site
 * list.
 *
 * CONTRACT: returned objects are typed KBFigure so callers don't change, but
 * the prose fields (match_represented, key_features), scale, pack_size,
 * sub_fandom and exclusive_to are ALWAYS empty here. Anything rendering those
 * must read D1 via kbDb.ts. is_canary figures are excluded at generation.
 *
 * Full catalog readers: kbDb.ts (D1, request time). Build-only: kb.ts.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { inNextBuild } from '../lib/inNextBuild'
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

const ASSET_NAME = 'kb-lite.generated.json'

let LITE_PROMISE: Promise<LiteGenerated> | null = null

/** One-time, per-isolate load: ASSETS binding first, disk read as the
 *  non-Worker fallback (see the module header for why each path exists). */
function loadLite(): Promise<LiteGenerated> {
  if (!LITE_PROMISE) LITE_PROMISE = fetchLite()
  return LITE_PROMISE
}

async function fetchLite(): Promise<LiteGenerated> {
  // During `next build` the ASSETS attempt can only spawn a local workerd and
  // then 404 (the simulated binding never has this file) -- go straight to the
  // disk read. Why this matters: src/lib/inNextBuild.ts.
  if (!inNextBuild()) {
    try {
      const { env } = await getCloudflareContext({ async: true })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assets = (env as any)?.ASSETS as { fetch(input: string): Promise<Response> } | undefined
      if (assets && typeof assets.fetch === 'function') {
        const res = await assets.fetch(`http://assets.local/${ASSET_NAME}`)
        if (res.ok) return (await res.json()) as LiteGenerated
        console.warn(`[kb-lite] ASSETS fetch for ${ASSET_NAME} returned ${res.status}, falling back to disk`)
      }
    } catch (err) {
      console.warn('[kb-lite] ASSETS binding unavailable, falling back to disk:', err instanceof Error ? err.message : String(err))
    }
  }
  // `typeof window === 'undefined'` isn't just a Worker-vs-browser runtime
  // check here -- Next's CLIENT webpack build statically replaces it with
  // `"object"` and dead-code-eliminates this whole branch, which is the
  // POINT: kbDb.ts (and so kbLite.ts) gets pulled into at least one client
  // bundle today (VaultClient.tsx -> vaultData.ts -> kbDb.ts), and a
  // top-level `node:fs`/`node:path`/`node:url` import broke that build
  // (UnhandledSchemeError) the first time this module tried one -- dynamic
  // + guarded is what keeps those Node builtins out of the client graph
  // entirely while still reachable at runtime on the server/Worker, where
  // this branch is the non-ASSETS-binding fallback (next dev, node --test,
  // build scripts).
  if (typeof window === 'undefined') {
    const { readFileSync } = await import('node:fs')
    const { join, dirname } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const diskPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', ASSET_NAME)
    return JSON.parse(readFileSync(diskPath, 'utf8')) as LiteGenerated
  }
  throw new Error('[kb-lite] no ASSETS binding and no server-side fallback available (running in a browser context)')
}

function rowToFigure(r: LiteRow, LITE: LiteGenerated): KBFigure {
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
// In-flight promises: the builders below `await` before they assign, so N
// concurrent first callers each used to pass the `!X` check and each build a
// full copy (a hub's Promise.all of 15 url lookups = 15 catalog-sized builds).
let ALL_P: Promise<KBFigure[]> | null = null
let BY_ID_P: Promise<Map<string, KBFigure>> | null = null
let PRETTY_COUNTS_P: Promise<Map<string, number>> | null = null

async function all(): Promise<KBFigure[]> {
  if (ALL) return ALL
  return (ALL_P ??= (async () => {
    const LITE = await loadLite()
    const rows = JSON.parse(LITE.rows) as LiteRow[]
    ALL = rows.map(r => rowToFigure(r, LITE))
    return ALL
  })())
}

async function byId(): Promise<Map<string, KBFigure>> {
  if (BY_ID) return BY_ID
  return (BY_ID_P ??= (async () => {
    const m = new Map<string, KBFigure>()
    for (const f of await all()) m.set(f.figure_id, f)
    BY_ID = m
    return m
  })())
}

async function byFandom(): Promise<Map<string, KBFigure[]>> {
  if (!BY_FANDOM) {
    const m = new Map<string, KBFigure[]>()
    for (const f of await all()) {
      const bucket = m.get(f.fandom)
      if (bucket) bucket.push(f)
      else m.set(f.fandom, [f])
    }
    BY_FANDOM = m
  }
  return BY_FANDOM
}

async function bySuffix(): Promise<Map<string, KBFigure | null>> {
  if (!BY_SUFFIX) {
    const m = new Map<string, KBFigure | null>()
    for (const f of await all()) {
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
async function prettyCounts(): Promise<Map<string, number>> {
  if (PRETTY_COUNTS) return PRETTY_COUNTS
  return (PRETTY_COUNTS_P ??= (async () => {
    const counts = new Map<string, number>()
    for (const f of await all()) {
      for (const key of prettyUrlRouterCountKeys(f)) {
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    PRETTY_COUNTS = counts
    return counts
  })())
}

// ── Public API (mirrors kb.ts; ASYNC since 2026-09-15 — see module header) ──

/** Every non-canary figure, catalog order. Materialises the lite catalog. */
export async function getAllFigures(): Promise<KBFigure[]> {
  return all()
}

/**
 * All unique fandom slugs in catalog encounter order — same order kb.ts
 * returns. Deliberately does NOT parse the tuple string (stays SYNC): reads
 * the small kb-stats.generated.json aggregate, still a normal bundled import.
 */
export function getAllFandoms(): string[] {
  if (!FANDOMS) FANDOMS = Object.keys((kbStats as { fandoms: Record<string, unknown> }).fandoms)
  return FANDOMS
}

export async function getFigureById(figure_id: string): Promise<KBFigure | null> {
  return (await byId()).get(figure_id) ?? null
}

/** Resolve stale/truncated generated IDs when their final stable hash is unique. */
export async function getFigureByStableSuffix(figure_id: string): Promise<KBFigure | null> {
  const suffix = stableIdSuffix(figure_id)
  if (!suffix) return null
  return (await bySuffix()).get(suffix) ?? null
}

export async function getFiguresByFandom(fandom: string): Promise<KBFigure[]> {
  return (await byFandom()).get(fandom) ?? []
}

/**
 * fandom + product_line, where lineSlug is either the bare product_line
 * ("elite") or manufacturer-prefixed ("wwe-elite") — identical OR-branch to
 * kb.getFiguresByLine and kbDb.getFiguresByLine.
 */
export async function getFiguresByLine(fandom: string, lineSlug: string): Promise<KBFigure[]> {
  const norm = lineSlug.toLowerCase().trim()
  return (await getFiguresByFandom(fandom)).filter(f => {
    const pl = f.product_line.toLowerCase()
    const mfr = f.manufacturer.toLowerCase()
    return pl === norm || `${mfr}-${pl}` === norm
  })
}

export async function getLinesByFandom(fandom: string): Promise<string[]> {
  return [...new Set((await getFiguresByFandom(fandom)).map(f => f.product_line))]
}

export async function hasUniquePrettyFigureUrl(f: KBFigure): Promise<boolean> {
  return (await prettyCounts()).get(prettyUrlRouterLookupKey(f)) === 1
}

/**
 * Keyword-rich canonical URL, or the stable /figure/[id] URL when the pretty
 * path is ambiguous. MUST emit genreSlugForFandom(f.fandom), never raw
 * f.fandom — see kb.ts prettyFigureUrl for the 2026-07 index-collapse history.
 */
export async function prettyFigureUrl(f: KBFigure): Promise<string> {
  if (!(await hasUniquePrettyFigureUrl(f))) return figureUrl(f)
  return `/${genreSlugForFandom(f.fandom)}/${f.product_line}/${f.character_canonical}`
}
