#!/usr/bin/env node
/**
 * gen-drip-priority-list.mjs — ranked recrawl-drip priority list, v1.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ ⚠️  PROVISIONAL — this is NOT the official ranked money-tier list.        │
 * │                                                                          │
 * │ Required by webaudit's guardrail #1 (WEBAUDIT-TO-WEB-P2-P3-SCOPING-      │
 * │ AUDIT-VERDICT-2026-07-24) and repeated in this file's output header.     │
 * │                                                                          │
 * │ PLAN V2 names two ranking signals: (a) enriched-copy quality and         │
 * │ (b) price/demand. **Only (a) is computable locally.** Per-fid pricing    │
 * │ lives in R2 (figurepinner-r2proxy/price-summaries/<fid>.json) — ~1,000   │
 * │ network fetches, which is what makes it v2 work, not v1 work.            │
 * │                                                                          │
 * │ Consequence, stated so nobody has to infer it: matcher's P3 census       │
 * │ (70.8% usable) deliberately ran on a D1 demand-signal PROXY precisely    │
 * │ because the real ranked list does not exist. Treating this v1 as that    │
 * │ list would misapply the census's number to a population it never         │
 * │ measured. v2 (with price) is owed before the 8/5 readout.                │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * RANKING (v1, "copy-first + cheap local tiebreak" per the audit verdict):
 *   0. HARD FILTERS — above the index bar, unambiguous pretty URL. A drip must
 *      never be handed an ambiguous URL (guardrail #3).
 *   1. Enriched copy passes `enrichedDescription()`  ← the copy-first signal.
 *      A recrawl is most valuable where the page now says something genuinely
 *      differentiated; re-crawling a templated page teaches Google little.
 *   2. Comp recency from index-value-census.json (last sold-comp date) — the
 *      cheapest honest local stand-in for liveness. NOT price, NOT demand
 *      volume. Do not describe it as either.
 *   3. Has a canonical image (a complete page is a better crawl target).
 *   4. Has key_features (more unique on-page content).
 *   5. Enriched copy length, capped at the 200-char meta budget.
 *   6. figure_id, purely to make the order TOTAL and reproducible.
 *
 * Determinism is a feature, not an accident: the drip is consumed ~11/day over
 * many days, so a list that reshuffles between runs would silently re-submit
 * some URLs and skip others. Same KB + same census => byte-identical output.
 *
 * Usage:
 *   node --import ./scripts/register-ts-loader.mjs scripts/gen-drip-priority-list.mjs <out.tsv> [n] [--handoff <out.md>] [--exclude <fids.txt>]
 */
import { getAllFigures, prettyFigureUrl, hasUniquePrettyFigureUrl } from '../src/data/kb.ts'
import { enrichedDescription } from '../src/app/figure/[figure_id]/_lib/enrichedCopy.ts'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const positional = argv.filter(a => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--handoff' && argv[argv.indexOf(a) - 1] !== '--exclude')
const outPath = positional[0]
const n = Number(positional[1]) || 1000
const handoffPath = argv.includes('--handoff') ? argv[argv.indexOf('--handoff') + 1] : null
const excludePath = argv.includes('--exclude') ? argv[argv.indexOf('--exclude') + 1] : null

if (!outPath) {
  console.error('Usage: gen-drip-priority-list.mjs <out.tsv> [n] [--handoff <out.md>] [--exclude <fids.txt>]')
  process.exit(1)
}

const CENSUS = JSON.parse(readFileSync(path.join(__dirname, '../src/data/index-value-census.json'), 'utf8'))
const BING_PROTECTED_FIDS = new Set(['fp_wrestling_mattel_basic_ex_mountain-dew-maj_cfec51'])
const isAtOrAboveIndexBar = fid =>
  Object.prototype.hasOwnProperty.call(CENSUS, fid) || BING_PROTECTED_FIDS.has(fid)

/** Census values are mixed 'YYYY-MM-DD' and 'YYYY-MM-DD HH:MM:SS'. */
const compDate = fid => {
  const v = CENSUS[fid]
  return typeof v === 'string' && v.length >= 10 ? v.slice(0, 10) : ''
}

/*
 * GUARDRAIL #2 — the 10 D1↔KB drifted fids.
 *
 * Honest status (verified 2026-07-24, do not restate as done): the audit asked
 * to "exclude/flag the 10 D1↔KB drifted fids from matcher's census (known list,
 * cheap)". **That list is not published anywhere in the vault** — the census
 * (MATCHER-TO-WEBAUDIT-P3-MONEY-TIER-CENSUS-2026-07-24 §caveats) reports the
 * COUNT (11/1,000: one `__diecast__` sentinel + 10 real-looking fids) but never
 * enumerates them. Grepped Bridge + board; only the count exists.
 *
 * It is also a STRUCTURAL NO-OP here even once the list lands: those fids are
 * defined by having "zero or hash-mismatched KB matches" — i.e. they do not
 * resolve to a KB record. This script enumerates FROM the KB, so it cannot emit
 * a fid the KB doesn't contain. The exclusion is wired anyway (below) so the
 * guardrail is satisfiable the moment matcher publishes the list, and so any
 * overlap would be reported loudly rather than assumed absent.
 */
const EXCLUDED = new Set()
if (excludePath && existsSync(excludePath)) {
  for (const line of readFileSync(excludePath, 'utf8').split('\n')) {
    const fid = line.trim()
    if (fid && !fid.startsWith('#')) EXCLUDED.add(fid)
  }
}

const rows = []
let aboveBar = 0, uniqueUrl = 0, excludedHits = 0
for (const f of getAllFigures()) {
  if (!isAtOrAboveIndexBar(f.figure_id)) continue
  aboveBar++
  if (!hasUniquePrettyFigureUrl(f)) continue
  uniqueUrl++
  if (EXCLUDED.has(f.figure_id)) { excludedHits++; continue }

  const enriched = enrichedDescription(f)
  rows.push({
    fid: f.figure_id,
    url: prettyFigureUrl(f),
    enriched: enriched !== null,
    enrichedLen: enriched ? enriched.length : 0,
    lastComp: compDate(f.figure_id),
    hasImage: !!f.canonical_image_url,
    hasKeyFeatures: !!(f.key_features && String(f.key_features).trim()),
    fandom: f.fandom,
    line: f.product_line,
  })
}

rows.sort((a, b) =>
  Number(b.enriched) - Number(a.enriched) ||          // 1. copy-first
  b.lastComp.localeCompare(a.lastComp) ||             // 2. comp recency
  Number(b.hasImage) - Number(a.hasImage) ||          // 3. complete page
  Number(b.hasKeyFeatures) - Number(a.hasKeyFeatures) || // 4. more content
  b.enrichedLen - a.enrichedLen ||                    // 5. copy depth
  a.fid.localeCompare(b.fid)                          // 6. total order
)

/*
 * FANDOM ROUND-ROBIN (default; `--flat` opts out).
 *
 * Found by reading the actual v1 output instead of trusting a clean run: the
 * flat global ranking returned wrestling/elite for effectively the entire top
 * 1,000. Comp recency (tiebreak 2) is the cause — the nightly comps refresh is
 * wrestling-weighted, so wrestling pages always carry the freshest last-comp
 * date and monopolise every tier above it. At the drip's real rate (~11/day)
 * a flat list would spend MONTHS inside one product line and never reach
 * another fandom.
 *
 * This is the same defect gen-cohort-a-list.mjs already fixed for the same
 * reason ("the naive first 6 would've all been wrestling/deluxe-aggression"),
 * and it cuts directly against matcher's P3 census finding that 94.5% of the
 * fids needing work are NON-wrestling.
 *
 * Round-robin preserves the copy-first ranking WITHIN each fandom and only
 * changes emission order across fandoms, so nothing about the ranking's
 * meaning is lost — a fandom's #1 still outranks its own #2.
 */
const roundRobin = (list) => {
  const byFandom = new Map()
  for (const r of list) {
    if (!byFandom.has(r.fandom)) byFandom.set(r.fandom, [])
    byFandom.get(r.fandom).push(r)
  }
  const buckets = [...byFandom.values()]   // insertion order == global rank order
  const out = []
  for (let round = 0; out.length < list.length; round++) {
    let progressed = false
    for (const b of buckets) {
      if (b[round]) { out.push(b[round]); progressed = true }
    }
    if (!progressed) break
  }
  return out
}

const flat = argv.includes('--flat')
const ordered = flat ? rows : roundRobin(rows)
const picked = ordered.slice(0, n)

const HEADER = [
  '# PROVISIONAL drip-priority list v1 — NOT the official ranked money-tier list.',
  '# Ranked on locally-computable signals ONLY: enriched-copy gate, comp recency,',
  '# image presence, key_features, copy length. NO price/demand signal (that is v2,',
  '# owed before the 8/5 readout). Do not cite matcher\'s 70.8% census figure against',
  '# this population — the census ran on a different, D1-derived proxy.',
  `# ordering: ${flat ? 'FLAT global rank' : 'fandom round-robin (copy-first rank preserved WITHIN each fandom)'}`,
  '# columns: rank  figure_id  url  enriched  last_comp  has_image  has_key_features  fandom  line',
].join('\n')

writeFileSync(outPath,
  HEADER + '\n' + picked.map((r, i) =>
    [i + 1, r.fid, r.url, r.enriched ? 'yes' : 'no', r.lastComp || '-',
     r.hasImage ? 'yes' : 'no', r.hasKeyFeatures ? 'yes' : 'no', r.fandom, r.line].join('\t')
  ).join('\n') + '\n')

console.log(`funnel: ${aboveBar} above-bar -> ${uniqueUrl} unambiguous URL -> ${rows.length} ranked`)
if (excludePath) {
  console.log(existsSync(excludePath)
    ? `exclusion list: ${EXCLUDED.size} fids loaded, ${excludedHits} actually matched a KB figure`
    : `exclusion list: ${excludePath} NOT FOUND — nothing excluded`)
} else {
  console.log('exclusion list: none supplied (see guardrail #2 note in this file\'s header)')
}
console.log(`ordering: ${flat ? 'FLAT global rank (--flat)' : 'fandom round-robin (default)'}`)
console.log(`enriched in top ${picked.length}: ${picked.filter(r => r.enriched).length}`)
{
  const spread = new Map()
  for (const r of picked) spread.set(r.fandom, (spread.get(r.fandom) ?? 0) + 1)
  const top = [...spread.entries()].sort((a, b) => b[1] - a[1])
  console.log(`fandom spread in top ${picked.length}: ${spread.size} fandoms; largest = ${top[0][0]} (${top[0][1]}, ${(100 * top[0][1] / picked.length).toFixed(1)}%)`)
}
console.log(`wrote ${picked.length} ranked rows -> ${outPath}`)

// ── guardrail #4: top-20 handoff with per-signal columns ────────────────────
if (handoffPath) {
  const top = picked.slice(0, 20)
  const md = [
    '# Drip-priority v1 — top 20 (PROVISIONAL)',
    '',
    '**Not the official ranked money-tier list.** Ranked on local signals only; no price/demand',
    'signal is included (v2, owed before 8/5). `last_comp` is the last sold-comp DATE — a liveness',
    'proxy, NOT price and NOT demand volume.',
    '',
    '| # | URL | enriched | last comp | image | key_features | fandom |',
    '|---|---|---|---|---|---|---|',
    ...top.map((r, i) =>
      `| ${i + 1} | \`${r.url}\` | ${r.enriched ? '✅' : '—'} | ${r.lastComp || '—'} | ${r.hasImage ? '✅' : '—'} | ${r.hasKeyFeatures ? '✅' : '—'} | ${r.fandom} |`),
    '',
    `Generated from ${rows.length} eligible figures (above-bar + unambiguous pretty URL).`,
    'Deterministic: same KB + census produces byte-identical output.',
  ].join('\n')
  writeFileSync(handoffPath, md + '\n')
  console.log(`wrote top-20 handoff -> ${handoffPath}`)
}
