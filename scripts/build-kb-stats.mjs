#!/usr/bin/env node
/**
 * build-kb-stats.mjs — precompute the compact KB aggregates that are safe to
 * import from application layouts at Worker runtime.
 *
 * SOURCE: src/data/figures-reference-v2.slim.js. This script deliberately
 * loads the full catalog only on the developer/CI build machine; the emitted
 * JSON contains aggregate counts and line slugs, never figure objects.
 */

import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'data', 'kb-stats.generated.json')
const ENRICHED_COPY_OUT = join(ROOT, 'src', 'data', 'enriched-copy.generated.json')
const KB_LITE_OUT = join(ROOT, 'src', 'data', 'kb-lite.generated.json')
const require = createRequire(import.meta.url)

// This is the exact build-time source used by src/data/kb.ts. Do not import
// kb.ts here: its module-level indexes are application runtime code, while
// this generator only needs the raw catalog.
const { FIGURES_V2 } = require(join(ROOT, 'src', 'data', 'figures-reference-v2.slim.js'))

function floorCount(n) {
  if (n >= 1000) return Math.floor(n / 500) * 500
  if (n >= 100) return Math.floor(n / 50) * 50
  return n
}

function plusLabel(n) {
  if (n < 100) return n.toLocaleString()
  return `${floorCount(n).toLocaleString()}+`
}

/**
 * Preserve source-array encounter order inside each map. genre-lines.ts keeps
 * the existing stable tie behavior when it turns these aggregates into tiles.
 */
export function buildKbStats(figures) {
  const fandoms = {}

  for (const figure of figures) {
    const fandom = figure.fandom
    const summary = fandoms[fandom] ?? (fandoms[fandom] = {
      count: 0,
      lines: {},
      manufacturerLines: {},
    })

    summary.count += 1
    summary.lines[figure.product_line] = (summary.lines[figure.product_line] ?? 0) + 1

    // This matches genre-lines.ts's manufacturer-prefixed URL alias logic.
    const manufacturerLine = `${figure.manufacturer}-${figure.product_line}`
    if (manufacturerLine !== figure.product_line) {
      const existing = summary.manufacturerLines[manufacturerLine]
      summary.manufacturerLines[manufacturerLine] = {
        count: (existing?.count ?? 0) + 1,
        productLine: figure.product_line,
      }
    }
  }

  return {
    totalFigures: figures.length,
    totalFiguresLabel: plusLabel(figures.length),
    totalFandoms: Object.keys(fandoms).length,
    fandoms,
  }
}

/**
 * Exact match_represented texts shared by multiple figures. enrichedCopy.ts
 * uses this compact sidecar at runtime so its quality gate never has to scan
 * the full catalog during Worker module initialization.
 */
export function buildDuplicateTexts(figures) {
  const counts = new Map()
  for (const figure of figures) {
    const text = figure.match_represented?.trim()
    if (!text) continue
    counts.set(text, (counts.get(text) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([text]) => text)
}

/**
 * kb-lite: the prose-free catalog projection that src/data/kbLite.ts serves at
 * Worker runtime (search index, sitemap rows, homepage/guide figure lookups).
 *
 * Why it exists (OOM incident, 2026-08-31 → 09-01): every runtime importer of
 * kb.ts drags the full 22MB slim catalog (match_represented + key_features
 * prose is most of it) into the single OpenNext handler bundle. Those readers
 * only ever touch identity/route/name/image fields, so this emits exactly
 * that set as positional tuples, and stores the tuple array as ONE JSON
 * string so the bundle holds a string at module load and kbLite.ts only
 * materialises objects on first use (lazy parse). is_canary figures are
 * dropped here so no runtime reader can surface one.
 *
 * Tuple layout (keep in sync with LITE_* indexes in kbLite.ts):
 *   0 figure_id, 1 fandom, 2 manufacturer, 3 product_line,
 *   4 character_canonical, 5 character_variant, 6 release_wave,
 *   7 image host index (into `hosts`, -1 = none), 8 image path/remainder,
 *   9 name, 10 v1_name, 11 v1_line, 12 v1_series
 */
export function buildKbLite(figures) {
  const hosts = []
  const hostIdx = new Map()
  const rows = []
  for (const f of figures) {
    if (f.is_canary) continue
    let h = -1
    let path = null
    const url = f.canonical_image_url ?? null
    if (url) {
      const m = /^(https?:\/\/[^/]+\/)(.*)$/.exec(url)
      if (m) {
        if (!hostIdx.has(m[1])) { hostIdx.set(m[1], hosts.length); hosts.push(m[1]) }
        h = hostIdx.get(m[1])
        path = m[2]
      } else {
        path = url
      }
    }
    rows.push([
      f.figure_id, f.fandom, f.manufacturer, f.product_line, f.character_canonical,
      f.character_variant ?? null, f.release_wave ?? null,
      h, path,
      f.name ?? null, f.v1_name ?? null, f.v1_line ?? null, f.v1_series ?? null,
    ])
  }
  return { hosts, count: rows.length, rows: JSON.stringify(rows) }
}

const stats = buildKbStats(FIGURES_V2)
const lite = buildKbLite(FIGURES_V2)
writeFileSync(KB_LITE_OUT, JSON.stringify(lite))
const duplicateTexts = buildDuplicateTexts(FIGURES_V2)
writeFileSync(OUT, `${JSON.stringify(stats, null, 2)}\n`)
writeFileSync(ENRICHED_COPY_OUT, `${JSON.stringify({ duplicateTexts }, null, 2)}\n`)
console.log(`[kb-stats] ${stats.totalFigures.toLocaleString()} figures across ${stats.totalFandoms} fandoms`)
console.log('[kb-stats] wrote src/data/kb-stats.generated.json')
console.log(`[kb-stats] wrote ${duplicateTexts.length} duplicate enrichment texts`)
console.log(`[kb-stats] wrote src/data/kb-lite.generated.json (${lite.count.toLocaleString()} rows, ${(lite.rows.length / 1e6).toFixed(2)} MB tuple string)`)
