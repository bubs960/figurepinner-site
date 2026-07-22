#!/usr/bin/env node
/**
 * KV route-tree consolidation (2026-07-22, STANDALONE-web cost review):
 * /figure/[figure_id] and /[genre]/[line]/[slug] render the identical
 * FigureDetailContent for the same figure, but Next's ISR/KV incremental
 * cache keys by resolved route+params, not figure identity -- so a figure
 * visited via both URL shapes writes TWO separate page-cache entries,
 * doubling KV write volume for every figure with real traffic on both
 * routes (see Bridge/WEB-TO-STANDALONE-COST-SCALING-REVIEW-2026-07-20.md).
 *
 * The fix is a middleware rewrite from /figure/:id to the figure's pretty
 * path BEFORE Next resolves which page to render, so both URLs converge on
 * one cache entry -- see src/middleware.ts. Middleware CANNOT import kb.ts
 * directly to do that lookup: kb.ts pulls in the full KB data file (18.5MB
 * even in the slim variant), and open-next.config.ts's
 * `enableCacheInterception` exists specifically so cache-hit requests never
 * load that "26MB server module." Loading it in middleware -- which runs on
 * EVERY request, cache hit or not -- would defeat that optimization
 * entirely and likely blow past Workers middleware size/cold-start budgets.
 *
 * This script emits a minimal figure_id -> pretty-path STRING map (no other
 * KBFigure fields) as a small, git-committed JSON file middleware can import
 * cheaply. Only includes figures whose pretty URL is unique (hasUniquePrettyFigureUrl)
 * -- ambiguous figures already keep the stable-ID URL as their canonical, so
 * there's nothing to rewrite to.
 *
 * Regenerate whenever the KB syncs (same cadence as other KB-derived
 * artifacts like index-value-census.json) -- a stale map just means some
 * figures miss the KV-consolidation optimization until regenerated, not a
 * correctness bug (middleware falls through to normal figure-page rendering
 * for any figure_id not in the map).
 *
 * Usage: node --import ./scripts/register-ts-loader.mjs scripts/gen-figure-id-pretty-map.mjs <out-file>
 */
import { getAllFandoms, getFiguresByFandom, prettyFigureUrl, figureUrl } from '../src/data/kb.ts'
import { writeFileSync } from 'node:fs'

const outPath = process.argv[2]
if (!outPath) {
  console.error('Usage: gen-figure-id-pretty-map.mjs <out-file>')
  process.exit(1)
}

const map = {}
let skipped = 0
for (const fandom of getAllFandoms()) {
  for (const f of getFiguresByFandom(fandom)) {
    const pretty = prettyFigureUrl(f)
    if (pretty === figureUrl(f)) {
      skipped++ // ambiguous figure -- pretty URL falls back to the id URL itself, nothing to rewrite
      continue
    }
    map[f.figure_id] = pretty
  }
}

writeFileSync(outPath, JSON.stringify(map))
console.log(`wrote ${Object.keys(map).length} figure_id->pretty-path entries -> ${outPath} (${skipped} ambiguous figures skipped)`)
