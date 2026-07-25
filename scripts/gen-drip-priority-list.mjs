#!/usr/bin/env node
/**
 * gen-drip-priority-list.mjs — ranked recrawl-drip priority list, v2.
 *
 * v2 (2026-07-25): wires the R2 real price/demand signal PLAN V2 named as
 * signal (b) -- v1 shipped only signal (a) (enriched-copy quality), with
 * comp-recency as a cheap LOCAL STAND-IN for demand because pricing lives in
 * R2 (figurepinner-r2proxy/price-summaries/<fid>.json), a network call per
 * figure. v2 fetches a real median-sold price for every figure that clears
 * the copy-first gate (measured 2026-07-25: 6,967 figures -- larger than the
 * ~1,000 the original v1 comment estimated). Comp-recency now falls back
 * only for rows R2 has no comps snapshot for yet. `--no-price` skips this
 * entirely for a fast, v1-parity dry run. Determinism is no longer
 * byte-for-byte guaranteed run-to-run -- real prices move with the market,
 * so a re-run days later can legitimately reorder rows near a price
 * boundary; only the hard filters and the copy-first gate stay fixed
 * against a given KB snapshot.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ ⚠️  PROVISIONAL — this is NOT matcher's official ranked money-tier list.  │
 * │                                                                          │
 * │ Required by webaudit's guardrail #1 (WEBAUDIT-TO-WEB-P2-P3-SCOPING-      │
 * │ AUDIT-VERDICT-2026-07-24) and repeated in this file's output header.     │
 * │                                                                          │
 * │ v2 (2026-07-25) wires the real R2 price/demand signal, gated by webaudit │
 * │ CONDITIONALLY before this output replaces v1 in practice                 │
 * │ (WEBAUDIT-TO-WEB-QUEUE-GATE-VERDICTS-4-ITEMS-2026-07-25):                │
 * │   1. PIN, don't stream — the drip must consume ONE dated, deliberately   │
 * │      regenerated output file (weekly / pre-8/5), never a fresh ad hoc    │
 * │      run feeding submissions directly. This restores at the artifact     │
 * │      level the determinism v2 gives up per-run (see below).             │
 * │   2. Retry nulls, don't trust the raw rate — DONE, see the retry pass.   │
 * │      Root cause diagnosed, not just patched: CONCURRENCY=16 (inherited   │
 * │      from build-fandom-top-comps.mjs's much smaller per-fandom sweeps)   │
 * │      self-rate-limited this script's 6,967-figure sweep, LOOKING like    │
 * │      noisy proxy flakiness (14.8%/29.3% across two runs) but actually    │
 * │      being a concurrency mismatch. Default lowered to 8: 60-73%          │
 * │      coverage measured at comparable wall-clock time, no cost tradeoff.  │
 * │   3. The standing top-20 pre-drip review applies to the pinned artifact, │
 * │      unchanged from v1 — someone reads it before it's used.             │
 * │                                                                          │
 * │ Still not matcher's P3 census (70.8% usable) — that ran on a different, │
 * │ D1-derived demand proxy over a different population. Do not conflate.   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * RANKING (v2, "copy-first gate + real price + cheap local fallback"):
 *   0. HARD FILTERS — above the index bar, unambiguous pretty URL. A drip must
 *      never be handed an ambiguous URL (guardrail #3). UNCHANGED from v1.
 *   1. Enriched copy passes `enrichedDescription()`  ← the copy-first GATE.
 *      A recrawl is most valuable where the page now says something genuinely
 *      differentiated; re-crawling a templated page teaches Google little.
 *      Price does not override this gate — a pricier figure with a templated
 *      page still sits below a cheap one with real enriched copy.
 *   2. Has a real R2 price snapshot (median_sold ?? avg_sold, sold_count>0) —
 *      PLAN V2's named signal (b), now real rather than a proxy.
 *   3. The price itself, descending, among rows that have one.
 *   4. Comp recency from index-value-census.json (last sold-comp date) — now
 *      a FALLBACK for rows with no R2 price (network miss or genuinely no
 *      comps yet), not the primary demand signal.
 *   5. Has a canonical image (a complete page is a better crawl target).
 *   6. Has key_features (more unique on-page content).
 *   7. Enriched copy length, capped at the 200-char meta budget.
 *   8. figure_id, purely to make the order TOTAL and reproducible.
 *
 * Determinism was a v1 feature (the drip is consumed ~11/day over many days,
 * so a reshuffling list would silently re-submit some URLs and skip others)
 * and is now a v2 PROPERTY OF THE PINNED ARTIFACT, not of this script: two
 * runs of this script minutes apart are NOT guaranteed byte-identical (real
 * prices move; R2 fetch success varies) — the fix is condition #1 above
 * (generate deliberately, pin the file, consume only that pin), not
 * expecting the generator itself to be reproducible on demand.
 *
 * Usage:
 *   node --import ./scripts/register-ts-loader.mjs scripts/gen-drip-priority-list.mjs <out.tsv> [n] [--handoff <out.md>] [--exclude <fids.txt>] [--no-price]
 *   CONCURRENCY=8 node ...    (R2 fetch concurrency, default 8 -- see the constant below for why
 *                              this differs from build-fandom-top-comps.mjs's 16)
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
const noPrice = argv.includes('--no-price')
// Stamped once into both output files (webaudit condition #1, 2026-07-25):
// a "pinned artifact" needs to be unambiguously datable so a later diff
// against "the prior pin" is diffing the right two files, not guessing from
// filesystem mtimes.
const generatedAt = new Date().toISOString()

if (!outPath) {
  console.error('Usage: gen-drip-priority-list.mjs <out.tsv> [n] [--handoff <out.md>] [--exclude <fids.txt>] [--no-price]')
  process.exit(1)
}

// ── R2 price/demand signal (v2) ─────────────────────────────────────────────
// Same recipe as scripts/build-fandom-top-comps.mjs -- reused deliberately,
// not reinvented, since it's already proven live against this exact
// endpoint (8s per-call timeout, bounded concurrency, graceful null on any
// failure so one bad fetch never aborts the run).
const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'
// Default 8, NOT build-fandom-top-comps.mjs's 16 -- that script fetches per
// fandom (dozens-to-low-hundreds per invocation); this one sweeps the whole
// enriched-gate population (6,967 measured) in one run. Measured live
// 2026-07-25: concurrency 16 -> 18-30% coverage (looks like proxy flakiness
// but is self-inflicted rate-limiting from over-concurrent load); concurrency
// 8 -> 60-73% coverage at comparable wall-clock time, no cost tradeoff found.
const CONCURRENCY = Number(process.env.CONCURRENCY || 8)

// Distinguishes "the fetch itself failed" (network error, timeout, non-2xx --
// worth retrying, see the retry pass below) from "the fetch succeeded and
// genuinely has no priced comp" (2xx with no median/avg or sold_count<=0 --
// retrying that changes nothing, it's real data, not noise).
const FETCH_FAILED = Symbol('fetch-failed')

async function fetchSnapshot(figure_id) {
  try {
    const res = await fetch(
      `${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(figure_id)}.json`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return FETCH_FAILED
    return await res.json()
  } catch {
    return FETCH_FAILED
  }
}

function applySnapshot(row, snap) {
  const price = snap.median_sold ?? snap.avg_sold
  const soldCount = snap.sold_count ?? 0
  if (price == null || soldCount <= 0) return false
  row.hasPrice = true
  row.price = Math.round(price)
  return true
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx) }
  })
  await Promise.all(workers)
  return out
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
    hasPrice: false, // filled in by the R2 fetch pass below (v2), unless --no-price
    price: null,
  })
}

/*
 * R2 PRICE/DEMAND FETCH (v2; skipped entirely with --no-price).
 *
 * Only fetched for rows that already cleared the copy-first gate
 * (enriched === true) -- price never overrides that gate (see RANKING
 * comment above), so pricing a non-enriched row could never change its
 * position anyway. Bounds the fetch to the real eligible population
 * (6,967 measured 2026-07-25) instead of either all ~18,700 above-bar
 * figures (wasteful -- most can never outrank an enriched row) or an
 * arbitrary top-N slice of `rows` taken BEFORE price is known (which would
 * make a high-value figure outside that slice permanently invisible to the
 * v2 signal it's the whole point of adding).
 */
let pricedCount = 0
if (!noPrice) {
  const priceable = rows.filter(r => r.enriched)
  console.log(`[drip-v2] fetching R2 price snapshots for ${priceable.length} enriched-gate figure(s) (concurrency ${CONCURRENCY})...`)
  const failed = []
  await mapLimit(priceable, CONCURRENCY, async (row) => {
    const snap = await fetchSnapshot(row.fid)
    if (snap === FETCH_FAILED) { failed.push(row); return }
    if (applySnapshot(row, snap)) pricedCount++
  })
  console.log(`[drip-v2] first pass: ${pricedCount}/${priceable.length} priced (${((100 * pricedCount) / (priceable.length || 1)).toFixed(1)}%); ${failed.length} fetch failure(s) (network/timeout/non-2xx, not "no comps").`)

  /*
   * RETRY PASS on fetch-failed rows only (webaudit condition #2, 2026-07-25).
   * The 14.8%->29.3% coverage swing measured across two back-to-back runs on
   * the identical figure population was fetch-load reliability against a
   * live proxy under concurrent load, not the market moving in minutes --
   * this is the fix for that, not a second attempt at "no comps" rows (those
   * are real data, not noise, and get zero benefit from retrying).
   * Lower concurrency than the first pass on purpose: a smaller, second wave
   * of requests is less likely to reproduce the same load-driven failures.
   */
  if (failed.length) {
    const RETRY_CONCURRENCY = Math.max(2, Math.floor(CONCURRENCY / 4))
    console.log(`[drip-v2] retry pass: ${failed.length} fetch-failed figure(s) at concurrency ${RETRY_CONCURRENCY}...`)
    let recovered = 0
    await mapLimit(failed, RETRY_CONCURRENCY, async (row) => {
      const snap = await fetchSnapshot(row.fid)
      if (snap === FETCH_FAILED) return
      if (applySnapshot(row, snap)) { pricedCount++; recovered++ }
    })
    console.log(`[drip-v2] retry pass recovered ${recovered}/${failed.length} previously fetch-failed figure(s).`)
  }
  console.log(`[drip-v2] R2 price coverage (post-retry): ${pricedCount}/${priceable.length} enriched figures (${((100 * pricedCount) / (priceable.length || 1)).toFixed(1)}%) returned a valid priced comp.`)
}

rows.sort((a, b) =>
  Number(b.enriched) - Number(a.enriched) ||          // 1. copy-first gate
  Number(b.hasPrice) - Number(a.hasPrice) ||          // 2. real price/demand present
  (b.price ?? -1) - (a.price ?? -1) ||                // 3. the price itself
  b.lastComp.localeCompare(a.lastComp) ||             // 4. comp-recency fallback
  Number(b.hasImage) - Number(a.hasImage) ||          // 5. complete page
  Number(b.hasKeyFeatures) - Number(a.hasKeyFeatures) || // 6. more content
  b.enrichedLen - a.enrichedLen ||                    // 7. copy depth
  a.fid.localeCompare(b.fid)                          // 8. total order
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
  `# generated_at: ${generatedAt}`,
  `# PROVISIONAL drip-priority list v2 — still NOT matcher's official ranked money-tier list.`,
  noPrice
    ? '# Ran with --no-price: v1-parity, NO real price/demand signal in this output.'
    : `# Ranked on: enriched-copy gate, then REAL R2 price/demand (${pricedCount}/${rows.filter(r => r.enriched).length} enriched figures priced, ${((100 * pricedCount) / (rows.filter(r => r.enriched).length || 1)).toFixed(1)}% coverage), then comp-recency fallback, image, key_features, copy length.`,
  `# Do not cite matcher's 70.8% census figure against this population — the census ran on a`,
  `# different, D1-derived proxy over a different population.`,
  `# ordering: ${flat ? 'FLAT global rank' : 'fandom round-robin (copy-first rank preserved WITHIN each fandom)'}`,
  '# columns: rank  figure_id  url  enriched  has_price  price  last_comp  has_image  has_key_features  fandom  line',
].join('\n')

writeFileSync(outPath,
  HEADER + '\n' + picked.map((r, i) =>
    [i + 1, r.fid, r.url, r.enriched ? 'yes' : 'no', r.hasPrice ? 'yes' : 'no', r.price ?? '-', r.lastComp || '-',
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
  const enrichedCount = rows.filter(r => r.enriched).length
  const intro = noPrice
    ? [
        `**Not matcher's official ranked money-tier list.** Ranked on the copy-first gate, then comp-recency (--no-price run, no real price signal).`,
      ]
    : [
        `**Not matcher's official ranked money-tier list.** Ranked on the copy-first gate, then REAL R2 price/demand where available.`,
        `R2 price coverage this run: ${pricedCount}/${enrichedCount} enriched figures (${((100 * pricedCount) / (enrichedCount || 1)).toFixed(1)}%). \`price\` is blank where no valid comp was returned — those rows fall back to \`last_comp\`, the last sold-comp DATE (a liveness proxy, not price or demand volume).`,
      ]
  const footer = noPrice
    ? 'Deterministic: same KB + census produces byte-identical output (--no-price run).'
    : 'NOT byte-for-byte deterministic run-to-run: real sold prices move with the market, so rows near a price boundary can reorder on a later run. Hard filters and the copy-first gate stay fixed against a given KB snapshot.'
  const md = [
    '# Drip-priority v2 — top 20 (PROVISIONAL)',
    '',
    `Generated: ${generatedAt}`,
    '',
    ...intro,
    '',
    '| # | URL | enriched | price | last comp | image | key_features | fandom |',
    '|---|---|---|---|---|---|---|---|',
    ...top.map((r, i) =>
      `| ${i + 1} | \`${r.url}\` | ${r.enriched ? '✅' : '—'} | ${r.hasPrice ? '$' + r.price : '—'} | ${r.lastComp || '—'} | ${r.hasImage ? '✅' : '—'} | ${r.hasKeyFeatures ? '✅' : '—'} | ${r.fandom} |`),
    '',
    `Generated from ${rows.length} eligible figures (above-bar + unambiguous pretty URL).`,
    footer,
  ].join('\n')
  writeFileSync(handoffPath, md + '\n')
  console.log(`wrote top-20 handoff -> ${handoffPath}`)
}
