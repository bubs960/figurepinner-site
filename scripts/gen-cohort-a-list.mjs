#!/usr/bin/env node
/**
 * Emits candidate URLs for PLAN V2's P1 Cohort-A experiment (enriched pages):
 * above the index bar, has enriched copy, and has an unambiguous pretty URL
 * (excludes figures whose prettyFigureUrl() falls back to /figure/[id]).
 *
 * A one-off list, not a shared pipeline input like gen-curated-url-list.mjs
 * (that script feeds prewarm-curl-runner.sh -- kept separate deliberately so
 * this doesn't change that script's behavior).
 *
 * Usage: node --import ./scripts/register-ts-loader.mjs scripts/gen-cohort-a-list.mjs <out-file> [n]
 */
import { getAllFandoms, getFiguresByFandom, prettyFigureUrl, hasUniquePrettyFigureUrl } from '../src/data/kb.ts'
import { enrichedDescription } from '../src/app/figure/[figure_id]/_lib/enrichedCopy.ts'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CENSUS = JSON.parse(readFileSync(path.join(__dirname, '../src/data/index-value-census.json'), 'utf8'))
const BING_PROTECTED_FIDS = new Set([
  'fp_wrestling_mattel_basic_ex_mountain-dew-maj_cfec51',
])
function isAtOrAboveIndexBar(figureId) {
  return Object.prototype.hasOwnProperty.call(CENSUS, figureId) || BING_PROTECTED_FIDS.has(figureId)
}

const outPath = process.argv[2]
const n = Number(process.argv[3]) || 6
if (!outPath) {
  console.error('Usage: gen-cohort-a-list.mjs <out-file> [n]')
  process.exit(1)
}

// Cohort B is already named (PLAN V2, 2026-07-22) -- must stay disjoint from
// Cohort A or the enriched-vs-non-enriched experiment isn't testing anything.
const COHORT_B_CHARACTERS = new Set([
  'chris-masters', 'ken-kennedy', 'dakota-kai', 'nightsister-merrin',
  'han-solo-deluxe', 'logan', // named
  'crankcase-a-w-e-striker', 'tung-lashor', 'the-merciless', // spares
])

const byFandom = new Map()
for (const fandom of getAllFandoms()) {
  for (const f of getFiguresByFandom(fandom)) {
    if (!isAtOrAboveIndexBar(f.figure_id)) continue
    if (!hasUniquePrettyFigureUrl(f)) continue
    if (!enrichedDescription(f)) continue
    if (COHORT_B_CHARACTERS.has(f.character_canonical)) continue
    if (!byFandom.has(fandom)) byFandom.set(fandom, [])
    byFandom.get(fandom).push({ id: f.figure_id, path: prettyFigureUrl(f) })
  }
}

const totalCandidates = [...byFandom.values()].reduce((s, arr) => s + arr.length, 0)
console.log(`${totalCandidates} total candidates across ${byFandom.size} fandoms (above-bar + enriched + unambiguous URL, Cohort-B excluded)`)

// One-per-fandom round-robin so the sample isn't all the same product line.
const picked = []
const fandomLists = [...byFandom.values()]
for (let round = 0; picked.length < n && round < 50; round++) {
  for (const list of fandomLists) {
    if (picked.length >= n) break
    if (list[round]) picked.push(list[round])
  }
}

const lines = picked.map(c => `${c.id}\t${c.path}`)
writeFileSync(outPath, lines.join('\n') + '\n')
console.log(`wrote ${picked.length} Cohort-A candidates -> ${outPath}`)
