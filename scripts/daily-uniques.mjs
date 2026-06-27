/**
 * daily-uniques.mjs — REAL daily visitor count for figurepinner.com (R1 scoreboard)
 *
 * WHY THIS EXISTS (2026-06-26, web chat):
 * Ground rule R1 — FigurePinner must hit 50 real human visits/day by 2026-07-03
 * or the figures vertical is decommissioned. We cannot grade that without a real,
 * verified daily-visitor number. The "traffic" CSV Steve dropped earlier was cached
 * BYTES (crawler-shaped), not visitors. This script produces the actual number from
 * Cloudflare zone analytics.
 *
 * WHAT IT QUERIES:
 *   CF GraphQL Analytics API → httpRequests1dGroups → uniq.uniques + sum.requests,
 *   grouped by date, last 7 days. `uniques` = CF's own de-duplicated daily visitor
 *   estimate (by IP+UA). NOTE: at zone level this still INCLUDES bot/crawler IPs —
 *   so treat it as an UPPER BOUND on human traffic, not the human number itself.
 *   The honest human floor is GSC clicks (run that cross-check separately — R2).
 *
 *   There is NO CF Web Analytics (RUM) beacon on the site as of 2026-06-26 (verified:
 *   no cloudflareinsights/beacon.min.js in src/), so rumPageloadEventsAdaptiveGroups
 *   would return empty. Zone uniques is the only server-side signal available.
 *
 * AUTH:
 *   Reads CF_API_TOKEN from C:\Users\bubs9\.figurepinner-secrets.env (same file every
 *   local script uses). Token name "cidcache", scope Account Analytics:Read (set 6/19).
 *   Account ID falls back to the known constant if CF_ACCOUNT_ID isn't in the env file.
 *   Zone ID is resolved at runtime from the token (no hardcoded/guessed zone tag).
 *
 * USAGE (on Steve's machine, from the figurepinner-site repo root):
 *   node scripts/daily-uniques.mjs
 *   node scripts/daily-uniques.mjs --days 30      # wider window
 *   node scripts/daily-uniques.mjs --json         # machine-readable, for the scoreboard
 *
 * If a GraphQL field is rejected, the script prints the raw CF error and exits non-zero
 * — it does NOT silently return zeros (that bug cost the cache-stats endpoint 24h+).
 */

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ACCOUNT_ID_FALLBACK = '9b94d79e0038f311a605168af9aaafe9'
const ZONE_NAME = 'figurepinner.com'
const GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql'
const REST = 'https://api.cloudflare.com/client/v4'

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const asJson = args.includes('--json')
const daysArg = args.indexOf('--days')
const DAYS = daysArg !== -1 && args[daysArg + 1] ? Math.max(1, parseInt(args[daysArg + 1], 10)) : 7

// ── load secrets (off-repo file, same pattern as every local script) ─────────
function loadEnvFile() {
  const path = join(homedir(), '.figurepinner-secrets.env')
  const out = {}
  try {
    const txt = readFileSync(path, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch (e) {
    fail(`Could not read ${path}\n  ${e.message}\n  This script must run on Steve's machine where the secrets file lives.`)
  }
  return out
}

function fail(msg) {
  console.error('\n❌ ' + msg + '\n')
  process.exit(1)
}

const env = loadEnvFile()
const TOKEN = env.CF_API_TOKEN || process.env.CF_API_TOKEN
const ACCOUNT_ID = env.CF_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || ACCOUNT_ID_FALLBACK
if (!TOKEN) fail('CF_API_TOKEN not found in secrets file or environment.')

const authHeaders = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

// ── 0. verify the token actually has the scope (fail fast, clear message) ────
async function verifyToken() {
  const r = await fetch(`${REST}/user/tokens/verify`, { headers: authHeaders })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j?.success) {
    fail(
      `Token verify failed (HTTP ${r.status}). The CF_API_TOKEN is not valid or lacks scope.\n` +
      `Raw: ${JSON.stringify(j?.errors || j)}`,
    )
  }
}

// ── 1. resolve the zone id from the token (never hardcode/guess it) ──────────
async function resolveZoneId() {
  const r = await fetch(`${REST}/zones?name=${encodeURIComponent(ZONE_NAME)}`, { headers: authHeaders })
  const j = await r.json().catch(() => null)
  const zone = j?.result?.find?.((z) => z.name === ZONE_NAME)
  if (!zone?.id) {
    fail(
      `Could not resolve zone id for ${ZONE_NAME} (HTTP ${r.status}).\n` +
      `If this token is Account-Analytics-only it may not list zones — in that case\n` +
      `add the zone id manually. Raw: ${JSON.stringify(j?.errors || j?.result || j)}`,
    )
  }
  return zone.id
}

// ── 2. query daily uniques + requests ────────────────────────────────────────
async function queryUniques(zoneTag) {
  const end = new Date()
  const start = new Date(end.getTime() - DAYS * 24 * 60 * 60 * 1000)
  const fmt = (d) => d.toISOString().slice(0, 10) // YYYY-MM-DD

  const query = `
    query Uniques($zoneTag: String!, $start: String!, $end: String!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(
            limit: 100
            filter: { date_geq: $start, date_leq: $end }
            orderBy: [date_ASC]
          ) {
            dimensions { date }
            uniq { uniques }
            sum { requests pageViews }
          }
        }
      }
    }`

  const r = await fetch(GRAPHQL, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ query, variables: { zoneTag, start: fmt(start), end: fmt(end) } }),
  })
  const j = await r.json().catch(() => null)

  if (!r.ok || j?.errors?.length) {
    fail(
      `CF GraphQL rejected the query (HTTP ${r.status}). NOT returning zeros.\n` +
      `Fix the flagged field and re-run. Raw errors:\n${JSON.stringify(j?.errors || j, null, 2)}`,
    )
  }

  const groups = j?.data?.viewer?.zones?.[0]?.httpRequests1dGroups
  if (!Array.isArray(groups)) {
    fail(`Unexpected response shape — no httpRequests1dGroups array.\nRaw: ${JSON.stringify(j, null, 2)}`)
  }
  return groups.map((g) => ({
    date: g.dimensions.date,
    uniques: g.uniq?.uniques ?? 0,
    requests: g.sum?.requests ?? 0,
    pageViews: g.sum?.pageViews ?? 0,
  }))
}

// ── run ──────────────────────────────────────────────────────────────────────
await verifyToken()
const zoneTag = await resolveZoneId()
const rows = await queryUniques(zoneTag)

if (asJson) {
  console.log(JSON.stringify({ zone: ZONE_NAME, days: DAYS, rows }, null, 2))
  process.exit(0)
}

const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0)
const uniqAvg = avg(rows.map((r) => r.uniques))
const last = rows[rows.length - 1]

console.log(`\n  figurepinner.com — daily traffic (CF zone analytics, last ${DAYS}d)`)
console.log('  ' + '─'.repeat(58))
console.log('  date         uniques*   requests   pageViews')
for (const r of rows) {
  console.log(
    `  ${r.date}   ${String(r.uniques).padStart(7)}   ${String(r.requests).padStart(8)}   ${String(r.pageViews).padStart(8)}`,
  )
}
console.log('  ' + '─'.repeat(58))
console.log(`  avg uniques/day: ${uniqAvg}     latest day (${last?.date}): ${last?.uniques ?? 0}`)
console.log(`\n  * uniques INCLUDES bot/crawler IPs — this is the UPPER BOUND, not the`)
console.log(`    human number. R1 needs the human floor: cross-check vs GSC clicks (R2).`)
console.log(`    R1 target: 50 real human visits/day by 2026-07-03.\n`)
