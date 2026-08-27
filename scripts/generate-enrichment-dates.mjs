#!/usr/bin/env node
/**
 * generate-enrichment-dates.mjs — build the fid → enrichment-pour-date map
 * that sitemap lastmods read (2026-08-27, WEBAUDIT-TO-WEB-SITEMAP-LASTMOD-
 * ENRICHMENT-GAP-2026-08-26 + its 8/27 addendum).
 *
 * WHY: sitemap.ts stamps figure lastmod from comp-change dates only, so an
 * enrichment deploy (prose fields, no comps) moves ZERO lastmods — Google
 * refetches the sitemaps and is told nothing changed, silently losing the
 * rolling-fandom program's entire Google-side signal.
 *
 * SOURCE: the provenance sidecar metas (src/data/figures-provenance/
 * *.meta.json). kbTypes has no enrichment date field, but every meta carries
 * `poured_at` (matcher's real pour date) and `identity_hashes` keyed by
 * figure_id — real per-URL dates, honoring the 0b727b8 honesty rule (never
 * blanket-`now`). A fid appearing in multiple sidecars keeps its NEWEST date.
 *
 * OUTPUT: src/data/enrichment-dates.generated.json — committed, statically
 * imported by src/data/enrichmentDates.ts. tests/enrichmentDates.test.mjs
 * rebuilds this map and fails if the committed file is stale, so a sidecar
 * sync can't ship without regenerating (npm test runs inside `npm run deploy`).
 *
 * Rerun after any provenance sidecar sync:  npm run kb:enrichment-dates
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SIDECAR_DIR = join(ROOT, 'src', 'data', 'figures-provenance')
const OUT = join(ROOT, 'src', 'data', 'enrichment-dates.generated.json')

export function buildEnrichmentDateMap(sidecarDir) {
  const map = new Map()
  let metaCount = 0
  let skipped = 0
  for (const name of readdirSync(sidecarDir).sort()) {
    if (!name.endsWith('.meta.json')) continue
    metaCount += 1
    const meta = JSON.parse(readFileSync(join(sidecarDir, name), 'utf8'))
    const poured = meta.poured_at
    // Real dates only — a meta without a well-formed poured_at contributes
    // nothing rather than a guess.
    if (typeof poured !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(poured)) {
      skipped += 1
      continue
    }
    for (const fid of Object.keys(meta.identity_hashes ?? {})) {
      const existing = map.get(fid)
      if (!existing || poured > existing) map.set(fid, poured)
    }
  }
  const sorted = Object.fromEntries([...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)))
  return { dates: sorted, metaCount, skipped }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { dates, metaCount, skipped } = buildEnrichmentDateMap(SIDECAR_DIR)
  const fidCount = Object.keys(dates).length
  writeFileSync(OUT, `${JSON.stringify(dates, null, 1)}\n`)
  console.log(`[enrichment-dates] ${metaCount} sidecar metas scanned (${skipped} without a usable poured_at), ${fidCount} fids mapped`)
  console.log(`[enrichment-dates] wrote src/data/enrichment-dates.generated.json`)
}
