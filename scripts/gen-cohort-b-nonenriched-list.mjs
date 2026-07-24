#!/usr/bin/env node
/**
 * gen-cohort-b-nonenriched-list.mjs — emits GENUINELY non-enriched candidates
 * for PLAN V2's Cohort B.
 *
 * WHY THIS EXISTS (2026-07-24): the Cohort B named in PLAN V2 is not actually
 * non-enriched. `check-cohort-b-enrichment.mjs` found that 5 of the 6 named
 * figures — including B-1, already submitted 7/22 — have `match_represented`
 * that passes every `enrichedDescription()` gate, so those pages ship enriched
 * meta descriptions AND enriched JSON-LD, exactly like Cohort A. All 3 named
 * spares are enriched too, so swapping in a spare does not fix it. Only
 * dakota-kai (B-3) is genuinely non-enriched.
 *
 * This script produces a replacement pool selected on the ONE criterion the
 * original B list was never filtered on: `enrichedDescription(f) === null`.
 *
 * Deliberately a SEPARATE script from gen-cohort-a-list.mjs rather than a flag
 * on it — that script's output was independently verified by webaudit and is
 * the provenance of an already-submitted cohort; changing its code would
 * invalidate that verification for no benefit.
 *
 * Filters (same bar as Cohort A, plus the inversion):
 *   - at or above the index bar (present in index-value-census.json)
 *   - unambiguous pretty URL (hasUniquePrettyFigureUrl)
 *   - enrichedDescription() === null   <-- the point
 *   - disjoint from Cohort A (6 + 4 spares) and from the current Cohort B names
 *   - one-per-fandom round-robin, so B is fandom-diverse like A
 *
 * Usage: node --import ./scripts/register-ts-loader.mjs scripts/gen-cohort-b-nonenriched-list.mjs <out-file> [n]
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
const n = Number(process.argv[3]) || 10
if (!outPath) {
  console.error('Usage: gen-cohort-b-nonenriched-list.mjs <out-file> [n]')
  process.exit(1)
}

// Cohort A as delivered + spares (WEB-TO-WEBAUDIT-COHORT-A-LIST / -SPARES, 2026-07-24).
const COHORT_A_CHARACTERS = new Set([
  'rob-conway', 'boba-fett-and-han-carbonite', 'apocalypse-black-variant',
  'optimus-prime-convoy-mp-1', 'red-ninja', 'prince-adam-and-he-man-2-pack', // named
  'teenage-mutant-ninja-turtles-4-pack', 'dino-charge-red-ranger',
  'grapnel-blaster', 'lion-o', // spares
])
// Current (invalid) Cohort B names — excluded so a replacement pool is clean of
// the compromised set. dakota-kai is the one genuinely-non-enriched member and
// could legitimately be retained by webaudit; excluded here so this pool is
// purely NEW candidates, not a re-offer of what's already submitted.
const CURRENT_COHORT_B_CHARACTERS = new Set([
  'chris-masters', 'ken-kennedy', 'dakota-kai', 'nightsister-merrin',
  'han-solo-deluxe', 'logan',
  'crankcase-a-w-e-striker', 'tung-lashor', 'the-merciless',
])

const byFandom = new Map()
let aboveBar = 0, uniqueUrl = 0, nonEnriched = 0
for (const fandom of getAllFandoms()) {
  for (const f of getFiguresByFandom(fandom)) {
    if (!isAtOrAboveIndexBar(f.figure_id)) continue
    aboveBar++
    if (!hasUniquePrettyFigureUrl(f)) continue
    uniqueUrl++
    if (enrichedDescription(f) !== null) continue   // keep ONLY non-enriched
    nonEnriched++
    if (COHORT_A_CHARACTERS.has(f.character_canonical)) continue
    if (CURRENT_COHORT_B_CHARACTERS.has(f.character_canonical)) continue
    if (!byFandom.has(fandom)) byFandom.set(fandom, [])
    byFandom.get(fandom).push({ id: f.figure_id, path: prettyFigureUrl(f) })
  }
}

const total = [...byFandom.values()].reduce((s, a) => s + a.length, 0)
console.log(`funnel: ${aboveBar} above-bar -> ${uniqueUrl} unambiguous URL -> ${nonEnriched} NON-enriched`)
console.log(`${total} eligible candidates across ${byFandom.size} fandoms (Cohort-A + current-B excluded)`)

const picked = []
const lists = [...byFandom.values()]
for (let round = 0; picked.length < n && round < 50; round++) {
  for (const list of lists) {
    if (picked.length >= n) break
    if (list[round]) picked.push(list[round])
  }
}

writeFileSync(outPath, picked.map(c => `${c.id}\t${c.path}`).join('\n') + '\n')
console.log(`wrote ${picked.length} genuinely-non-enriched Cohort-B candidates -> ${outPath}`)
