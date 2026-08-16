/**
 * build-fandom-most-checked.mjs — demand-ranked "most checked" precompute for
 * the FandomHub rail that replaces the Babyfaces/Heels wall (guides-conversion
 * v1 Phase 8, design brief: "Demand-ranked tiles match what value-checkers
 * actually look up... it will help us see at scale any gaps [Steve, 2026-08-15]").
 *
 * Source of truth: Cloudflare Analytics Engine (`fp_funnel` dataset, written by
 * src/app/api/funnel/route.ts). NOT a matcher/KB dependency — figure_view
 * events already fire on every figure-page load today; this only reads them.
 * Queried directly via the SQL API (same endpoint/auth shape as
 * src/app/api/funnel-stats/route.ts), since a standalone script has no access
 * to the FUNNEL_ANALYTICS binding itself (write-only, Workers-runtime-only).
 *
 * Unlike build-fandom-top-comps.mjs, figures are NEVER dropped for lacking a
 * price/comp — a high-demand figure with thin KB/pricing data is exactly the
 * gap this rail is meant to surface, not hide.
 *
 * Fandom bucketing: fp_funnel rows carry no fandom dimension, so this queries
 * globally (all figure_view events in the window) and joins each figure_id
 * against the local slim KB's `.fandom` field — same KB the sibling builders
 * read, same join key. The three wrestling sub-dataKeys are NOT a KB fandom
 * value (there is only one: "wrestling") — empirically confirmed against the
 * committed fandom-top-comps output: wwe-elite = wrestling + manufacturer
 * "mattel", wrestling-jakks = wrestling + manufacturer "jakks-pacific",
 * wrestling (parent) = the unscoped union. Mirrored exactly below.
 *
 * Usage:
 *   node scripts/build-fandom-most-checked.mjs [dataKey]
 *   TOP_N=10 DAYS=30 node scripts/build-fandom-most-checked.mjs masters-of-the-universe
 * Output: src/data/fandom-most-checked/<dataKey>.json
 * Needs CF_API_TOKEN (from ~/.figurepinner-secrets.env or env) with Analytics
 * Engine read access; CF_ACCOUNT_ID falls back to the same account id
 * daily-uniques.mjs already hardcodes if unset.
 * Run where the slim KB is intact (real disk / git HEAD), not a truncated
 * mount copy.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import vm from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'
const ACCOUNT_ID_FALLBACK = '9b94d79e0038f311a605168af9aaafe9' // same account daily-uniques.mjs uses
const TOP_N = Number(process.env.TOP_N || 8)
const DAYS = Number(process.env.DAYS || 30)
const CONCURRENCY = Number(process.env.CONCURRENCY || 16)
const OUT_DIR = join(ROOT, 'src', 'data', 'fandom-most-checked')

// Wrestling has one KB fandom value ("wrestling") but three hub dataKeys.
// Empirically verified against src/data/fandom-top-comps/{wwe-elite,
// wrestling-jakks}.json sample figure_ids, not guessed.
const WRESTLING_SUB_KEYS = {
  'wwe-elite': (f) => f.manufacturer === 'mattel',
  'wrestling-jakks': (f) => f.manufacturer === 'jakks-pacific',
}

function loadEnvFile() {
  const path = join(homedir(), '.figurepinner-secrets.env')
  const out = {}
  try {
    const txt = readFileSync(path, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // Optional: env vars are enough in CI/Worker-like shells.
  }
  return out
}

function loadFigures() {
  const slim = join(ROOT, 'src', 'data', 'figures-reference-v2.slim.js')
  const raw = readFileSync(slim, 'utf8')
  const sandbox = { module: { exports: {} }, exports: {} }
  sandbox.exports = sandbox.module.exports
  vm.createContext(sandbox)
  vm.runInContext(raw, sandbox, { timeout: 30000 })
  const figs = sandbox.module.exports.FIGURES_V2 ?? sandbox.module.exports
  if (!Array.isArray(figs)) throw new Error('Could not load FIGURES_V2 from slim KB')
  return figs
}

function prettify(s) {
  return String(s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
function deriveDisplayName(f) { return f.v1_name || prettify(f.character_canonical) }

function rarityFlag(f) {
  const line = (f.product_line || '').toLowerCase()
  const excl = (f.exclusive_to || '').toLowerCase()
  if (line === 'original' || /vintage/.test(line)) return 'VINTAGE'
  if (line === 'classics') return 'MOTUC'
  if (excl && excl !== 'none' && excl !== '') return 'EXCLUSIVE'
  return ''
}

async function fetchSnapshot(figure_id) {
  try {
    const res = await fetch(
      `${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(figure_id)}.json`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
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

// SQL API has no parameterized-query support; DAYS is validated as a finite
// positive integer above before this ever runs, same safety shape as
// funnel-stats/route.ts's `hours` interpolation.
function buildSql(days) {
  return `SELECT
  blob5 AS figure_id,
  SUM(_sample_interval) AS views
FROM fp_funnel
WHERE index1 = 'figure_view'
  AND blob5 != ''
  AND timestamp > NOW() - INTERVAL '${days}' DAY
GROUP BY blob5
ORDER BY views DESC
LIMIT 5000
FORMAT JSON`
}

async function queryMostViewed(accountId, apiToken, days) {
  const sqlUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`
  const raw = await fetch(sqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', Authorization: `Bearer ${apiToken}` },
    body: buildSql(days),
  })
  const bodyText = await raw.text()
  let parsed = null
  try { parsed = JSON.parse(bodyText) } catch { /* leave null */ }
  if (!raw.ok || !parsed) {
    throw new Error(`Analytics Engine SQL failed HTTP ${raw.status}: ${bodyText.slice(0, 500)}`)
  }
  const rows = Array.isArray(parsed?.data) ? parsed.data : []
  if (rows.length >= 5000) {
    console.warn('  WARNING: query hit the 5000-row cap — lowest-viewed tail may be truncated (top figures unaffected, ORDER BY views DESC).')
  }
  return rows.map(r => ({ figure_id: String(r.figure_id), views: Number(r.views) || 0 }))
}

function bucketByDataKey(viewRows, allFigures) {
  const byId = new Map(allFigures.map(f => [f.figure_id, f]))
  const buckets = new Map() // dataKey -> [{f, views}]
  function push(dataKey, f, views) {
    if (!buckets.has(dataKey)) buckets.set(dataKey, [])
    buckets.get(dataKey).push({ f, views })
  }
  let unresolved = 0
  for (const row of viewRows) {
    const f = byId.get(row.figure_id)
    if (!f) { unresolved++; continue } // fid view-tracked but no longer in KB (renamed/dropped) — skip, no baked fallback exists
    push(f.fandom, f, row.views)
    if (f.fandom === 'wrestling') {
      for (const [subKey, test] of Object.entries(WRESTLING_SUB_KEYS)) {
        if (test(f)) push(subKey, f, row.views)
      }
    }
  }
  if (unresolved) console.log(`  ${unresolved} viewed figure_id(s) no longer resolve in the KB — skipped.`)
  return buckets
}

async function enrichAndWrite(dataKey, entries) {
  const ranked = entries.sort((a, b) => b.views - a.views).slice(0, TOP_N)
  process.stdout.write(`  ${dataKey}: ${entries.length} viewed figure(s), enriching top ${ranked.length}`)
  const enriched = await mapLimit(ranked, CONCURRENCY, async ({ f, views }) => {
    const s = await fetchSnapshot(f.figure_id)
    const price = s ? (s.median_sold ?? s.avg_sold) : null
    const soldCount = s?.sold_count ?? 0
    return {
      figure_id: f.figure_id,
      name: deriveDisplayName(f),
      line: f.v1_line || prettify(f.product_line),
      price: (price != null && soldCount > 0) ? Math.round(price) : null, // honest: null, never a derived/stale price
      sold_count: soldCount,
      views,
      flag: rarityFlag(f),
      image: f.canonical_image_url || null,
      url: `/figure/${f.figure_id}`, // non-canonical form on purpose — resolvedUrl() fixes up at load time (§0 pattern)
    }
  })
  process.stdout.write(` -> done (${enriched.filter(e => e.price != null).length} priced)\n`)
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  const payload = {
    fandom: dataKey,
    generated_at: new Date().toISOString(),
    window_days: DAYS,
    source: 'analytics_engine fp_funnel (figure_view events, all-time-in-window view count) + r2proxy price-summaries where available',
    figures: enriched,
  }
  writeFileSync(join(OUT_DIR, `${dataKey}.json`), JSON.stringify(payload, null, 2))
}

async function main() {
  const target = process.argv[2]
  const env = loadEnvFile()
  const apiToken = process.env.CF_API_TOKEN || env.CF_API_TOKEN
  const accountId = process.env.CF_ACCOUNT_ID || env.CF_ACCOUNT_ID || ACCOUNT_ID_FALLBACK
  if (!apiToken) throw new Error('No CF_API_TOKEN found (env or ~/.figurepinner-secrets.env)')

  console.log(`Querying fp_funnel for figure_view events, last ${DAYS} day(s)...`)
  const viewRows = await queryMostViewed(accountId, apiToken, DAYS)
  console.log(`  ${viewRows.length} distinct viewed figure_id(s) returned.`)

  const allFigures = loadFigures()
  const buckets = bucketByDataKey(viewRows, allFigures)

  const dataKeys = target ? [target] : [...buckets.keys()]
  console.log(`Building most-checked rails for ${dataKeys.length} dataKey(s)...`)
  for (const dataKey of dataKeys) {
    const entries = buckets.get(dataKey)
    if (!entries || !entries.length) { console.log(`  ${dataKey}: 0 viewed figures in window — skipped.`); continue }
    await enrichAndWrite(dataKey, entries)
  }
  console.log('Done.')
}

main().catch((e) => { console.error(e); process.exit(1) })
