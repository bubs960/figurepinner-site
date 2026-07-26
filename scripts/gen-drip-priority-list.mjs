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

// Retry pass tuning (2026-07-26). Sequential + spaced, NOT concurrent-at-a-
// lower-number: webaudit measured the proxy returning 403 (a refusal, not a
// timeout) on 103/103 requests at concurrency 4, while a sequential sweep at
// ~1.5s spacing recovered every target in <=3 tries. Rounds loop until one
// recovers nothing new; the cap only exists so a genuinely dead proxy can't
// hang a full-population run.
const RETRY_SPACING_MS = Number(process.env.RETRY_SPACING_MS || 1500)
const MAX_RETRY_ROUNDS = Number(process.env.MAX_RETRY_ROUNDS || 5)
const sleep = ms => new Promise(r => setTimeout(r, ms))

/*
 * GLOBAL RATE LIMIT (2026-07-26) — the actual fix, replacing the concurrency knob.
 *
 * webaudit's conclusion from 103 live probes was "this is a rate problem, not a
 * parallelism problem; spacing beats lowering the worker count." A run on
 * 2026-07-26 measured how right that is: the FIRST pass at the tuned
 * CONCURRENCY=8 returned 776/6967 priced — **11.1% coverage, 6,094 fetch
 * failures** — against 84.6% from the same code the previous evening. Nothing
 * changed but the proxy's mood, which is the whole point: a concurrency setting
 * tuned against one evening's rate ceiling is not a fix, it's a lucky guess that
 * silently degrades into "this figure has no comps" for 87% of the catalog.
 *
 * So every request in this file — first pass and retries alike — now goes
 * through one global minimum-interval gate. Workers still exist (they overlap
 * latency, which spacing alone wastes), but they can never issue requests faster
 * than MIN_REQUEST_INTERVAL_MS apart in aggregate.
 *
 * Default 700ms: measured the same day, 125 sequential snapshot fetches at 700ms
 * spacing returned **0 failures** (the offers-suppression census). That is the
 * only spacing figure in evidence with a zero-failure result behind it; webaudit's
 * own verified figure is 1500ms, which is strictly safer and slower. Raise it if
 * a run still reports a high still_failed count — that number is now in the
 * output header precisely so this is tunable against evidence instead of vibes.
 */
const MIN_REQUEST_INTERVAL_MS = Number(process.env.MIN_REQUEST_INTERVAL_MS || 700)
let _nextSlot = 0
async function rateLimit() {
  const now = Date.now()
  const slot = Math.max(now, _nextSlot)
  _nextSlot = slot + MIN_REQUEST_INTERVAL_MS
  if (slot > now) await sleep(slot - now)
}

// Rows whose fetch never succeeded even after the retry loop. Reported in the
// output header so a coverage delta between two runs is interpretable.
let stillFailedCount = 0

// Distinguishes "the fetch itself failed" (network error, timeout, non-2xx --
// worth retrying, see the retry pass below) from "the fetch succeeded and
// genuinely has no priced comp" (2xx with no median/avg or sold_count<=0 --
// retrying that changes nothing, it's real data, not noise).
const FETCH_FAILED = Symbol('fetch-failed')

async function fetchSnapshot(figure_id) {
  await rateLimit()
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
    fetchFailed: false, // R2 never answered for this fid, even after the retry loop

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
   * RETRY PASS on fetch-failed rows only (webaudit condition #2, 2026-07-25;
   * REWRITTEN 2026-07-26 per webaudit's Item 4 verification).
   *
   * The 14.8%->29.3% coverage swing measured across two back-to-back runs on
   * the identical figure population was fetch-load reliability against a
   * live proxy under concurrent load, not the market moving in minutes --
   * this is the fix for that, not a second attempt at "no comps" rows (those
   * are real data, not noise, and get zero benefit from retrying).
   *
   * Two corrections webaudit's independent probe forced, both from evidence
   * outside this script (103 live requests, WEBAUDIT-TO-WEB-ITEM4-VERIFY-FALSE-
   * BLANKS-2026-07-25):
   *
   *  1. ONE retry round is not enough. 23 of the 58 unpriced enriched rows in
   *     the 7/25 pin had real comps in R2 the whole time -- ~40% of the
   *     "unpriced" remainder was instrument failure, silently ranked as if it
   *     were "no demand". So: loop until a full round recovers NOTHING new
   *     (loop-until-dry), capped so a genuinely dead proxy can't hang a run.
   *  2. It is a RATE problem, not a parallelism problem. The proxy answers a
   *     single request 200 and then returns 403 -- not a timeout -- for every
   *     request at concurrency 4. Lowering the worker count from 8 to 2 still
   *     leaves requests concurrent. Spacing is what actually works: webaudit's
   *     sequential probe at ~1.5s spacing recovered all 58 targets in <=3 tries.
   *     So the retry pass is now strictly SEQUENTIAL with deliberate spacing,
   *     not "the same shape at lower concurrency".
   */
  if (failed.length) {
    console.log(`[drip-v2] retry: ${failed.length} fetch-failed figure(s), sequential @ ${RETRY_SPACING_MS}ms extra spacing on top of the ${MIN_REQUEST_INTERVAL_MS}ms global rate limit, looping until a round recovers nothing new (max ${MAX_RETRY_ROUNDS} rounds)...`)
    let pending = failed
    for (let round = 1; round <= MAX_RETRY_ROUNDS && pending.length; round++) {
      const stillFailing = []
      let recovered = 0
      for (const row of pending) {
        // Extra spacing beyond the global limiter: these fids already failed
        // once, so back further off rather than re-hammering at the same rate
        // that lost them.
        if (RETRY_SPACING_MS > 0) await sleep(RETRY_SPACING_MS)
        const snap = await fetchSnapshot(row.fid)
        if (snap === FETCH_FAILED) { stillFailing.push(row); continue }
        recovered++
        if (applySnapshot(row, snap)) pricedCount++
      }
      console.log(`[drip-v2] retry round ${round}: recovered ${recovered}/${pending.length}; ${stillFailing.length} still failing.`)
      pending = stillFailing
      if (recovered === 0) break   // dry round -- further rounds are wasted requests
    }
    stillFailedCount = pending.length
    // A row whose fetch never succeeded is NOT the same thing as a figure with
    // no comps, and until now both emitted `has_price=no` + a last_comp
    // fallback -- indistinguishable to every downstream reader. Mark them so
    // "coverage" stops conflating data absence with instrument failure.
    for (const row of pending) row.fetchFailed = true
  }
  console.log(`[drip-v2] R2 price coverage (post-retry): ${pricedCount}/${priceable.length} enriched figures (${((100 * pricedCount) / (priceable.length || 1)).toFixed(1)}%) returned a valid priced comp; ${stillFailedCount} still fetch-failed after retry (reported in the output header, NOT counted as "no comps").`)
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

// Non-enriched rows in the emitted slice. The `enriched` sort key is tiebreak
// #1, NOT a hard filter -- once a fandom's enriched supply is exhausted the
// round-robin pulls its non-enriched rows in to keep the fandom represented.
// webaudit found 15 such rows in the 7/25 top-1000 while the header said
// "gate", and a reader dripping from the tail on that wording would submit
// exactly the arm the cohort experiment is measuring as the loser. The column
// was always honest; the prose was not. Stated as a count, computed, never
// asserted.
const nonEnrichedInSlice = picked.filter(r => !r.enriched).length

const HEADER = [
  `# generated_at: ${generatedAt}`,
  `# PROVISIONAL drip-priority list v2 — still NOT matcher's official ranked money-tier list.`,
  noPrice
    ? '# Ran with --no-price: v1-parity, NO real price/demand signal in this output.'
    : `# Ranked on: enriched-copy RANKING KEY (not a hard filter — see below), then REAL R2 price/demand (${pricedCount}/${rows.filter(r => r.enriched).length} enriched figures priced, ${((100 * pricedCount) / (rows.filter(r => r.enriched).length || 1)).toFixed(1)}% coverage), then comp-recency fallback, image, key_features, copy length.`,
  `# enriched=no rows CAN appear, in the tail, where a fandom's enriched supply runs short under`,
  `# round-robin: ${nonEnrichedInSlice} of the ${picked.length} rows below are enriched=no. Filter on the column, not the wording.`,
  ...(noPrice ? [] : [
    `# still_failed_after_retry: ${stillFailedCount} — R2 never answered for these fids. They carry`,
    `# has_price=fetch_failed, NOT has_price=no: instrument failure, not "this figure has no comps".`,
    `# A coverage delta between two runs is only interpretable against this number.`,
  ]),
  `# Do not cite matcher's 70.8% census figure against this population — the census ran on a`,
  `# different, D1-derived proxy over a different population.`,
  `# ordering: ${flat ? 'FLAT global rank' : 'fandom round-robin (copy-first rank preserved WITHIN each fandom)'}`,
  '# columns: rank  figure_id  url  enriched  has_price  price  last_comp  has_image  has_key_features  fandom  line',
  '#   has_price: yes | no (real: R2 answered, zero priced comps) | fetch_failed (R2 never answered)',
].join('\n')

writeFileSync(outPath,
  HEADER + '\n' + picked.map((r, i) =>
    [i + 1, r.fid, r.url, r.enriched ? 'yes' : 'no',
     r.hasPrice ? 'yes' : (r.fetchFailed ? 'fetch_failed' : 'no'), r.price ?? '-', r.lastComp || '-',
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
        `**Not matcher's official ranked money-tier list.** Ranked on the copy-first **ranking key** — a tiebreak, **not a hard filter**. Non-enriched rows can surface in the tail where a fandom's enriched supply runs short under round-robin (${nonEnrichedInSlice} of ${picked.length} in the full list this run). Then REAL R2 price/demand where available.`,
        `R2 price coverage this run: ${pricedCount}/${enrichedCount} enriched figures (${((100 * pricedCount) / (enrichedCount || 1)).toFixed(1)}%). \`price\` is blank where no valid comp was returned — those rows fall back to \`last_comp\`, the last sold-comp DATE (a liveness proxy, not price or demand volume).`,
        `**${stillFailedCount} fid(s) still fetch-failed after the retry loop** and carry \`has_price=fetch_failed\` in the TSV — R2 never answered for them, which is instrument failure, not "no comps". Coverage above excludes them from the numerator but not the denominator, so it is a floor, not a point estimate.`,
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
