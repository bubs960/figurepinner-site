#!/usr/bin/env node
/**
 * build-google-index-bar.mjs — corpus-focus tier artifact (spec v3 §4.5).
 *
 * Writes src/data/google-index-bar.generated.json:
 *   { rule, inputs: { kb_md5, census_file, grandfather_asof, exemptions_asof, canary_asof },
 *     tiers: { <fid>: 1 } }
 * The RESOLVED per-fid decision is the committed truth; runtime
 * (indexValueCensus.ts googleIndexTier) only reads it. A fid absent from
 * `tiers` keeps today's behaviour: tier 2 if at/above the T0 bar, else tier 0.
 *
 * CANARY MODE (this version, train #7 9/10): the only input is
 * src/data/google-index-bar.canary.json — an explicit fid list. The wave-1
 * comps rule, grandfather export and exemption lists are NOT applied yet;
 * their inputs are recorded as null so the drift checker / tests can tell a
 * canary artifact from a wave artifact. Fail-closed: a missing canary file,
 * an unknown fid, or a fid that is not servable above the T0 bar aborts the
 * build (spec 4.4/4.6 "fail-closed on missing inputs").
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CANARY = resolve(ROOT, 'src/data/google-index-bar.canary.json')
const CENSUS = resolve(ROOT, 'src/data/index-value-census.json')
const KB_SLIM = resolve(ROOT, 'src/data/figures-reference-v2.slim.js')
const OUT = resolve(ROOT, 'src/data/google-index-bar.generated.json')

const RULE = 'canary-only-2026-09-08'

function fail(msg) {
  console.error(`[google-index-bar] FAIL-CLOSED: ${msg}`)
  process.exit(1)
}

if (!existsSync(CANARY)) fail(`missing ${CANARY}`)
if (!existsSync(CENSUS)) fail(`missing ${CENSUS}`)
if (!existsSync(KB_SLIM)) fail(`missing ${KB_SLIM}`)

const canary = JSON.parse(readFileSync(CANARY, 'utf8'))
if (!canary || typeof canary.asof !== 'string' || !Array.isArray(canary.fids)) fail('canary file malformed (asof + fids[] required)')
if (canary.fids.length === 0) fail('canary list is empty — a canary artifact with no canary is a wave artifact in disguise')

const census = JSON.parse(readFileSync(CENSUS, 'utf8'))
const kbText = readFileSync(KB_SLIM, 'utf8')
const kb_md5 = createHash('md5').update(kbText).digest('hex').toUpperCase()

const tiers = {}
for (const fid of canary.fids) {
  if (typeof fid !== 'string' || !fid.startsWith('fp_')) fail(`bad fid ${JSON.stringify(fid)}`)
  if (!kbText.includes(`"figure_id":"${fid}"`)) fail(`${fid} is not in the KB`)
  if (!Object.prototype.hasOwnProperty.call(census, fid)) fail(`${fid} is below the T0 bar (no census entry) — T1 is only for above-bar pages`)
  tiers[fid] = 1
}

const artifact = {
  rule: RULE,
  inputs: {
    kb_md5,
    census_file: 'index-value-census.json',
    grandfather_asof: null,
    exemptions_asof: null,
    canary_asof: canary.asof,
  },
  tiers,
}

const next = JSON.stringify(artifact, null, 2) + '\n'
const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null
if (prev === next) {
  console.log(`[google-index-bar] unchanged (${Object.keys(tiers).length} tier-1 fid(s), rule ${RULE})`)
} else {
  writeFileSync(OUT, next)
  console.log(`[google-index-bar] wrote ${OUT} (${Object.keys(tiers).length} tier-1 fid(s), rule ${RULE}, kb ${kb_md5.slice(0, 8)})`)
}
