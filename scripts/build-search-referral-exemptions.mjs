#!/usr/bin/env node
/**
 * build-search-referral-exemptions.mjs — corpus-focus exemption list (b)
 * (spec v3 §4.4 b): every fid whose page received >= 1 external-search
 * referral in the last 30 days, from CF Web Analytics RUM (engine-agnostic:
 * Google, Bing family, other search engines, AI assistants). Such a page is
 * demonstrably discoverable and must never be demoted to T1 by the comps
 * rule, whatever its comps count.
 *
 * Output: src/data/google-index-bar.exemptions-rum.json
 *   { asof, window: {geq, leq, days}, source, referer_families, fids: [...],
 *     paths_total, paths_unmapped: [...] }
 * Inert data until wave 1 (build-google-index-bar.mjs reads it then).
 *
 * Fail-closed (spec 4.4): no token file / token, GraphQL error, or an empty
 * referral set (the RUM tag has never returned zero search referrals in 30 d
 * — zero means the query broke, not that traffic vanished) all exit 1 and
 * leave the previous file untouched.
 *
 * Token: ~/.figurepinner-secrets.env CF_API_TOKEN (read-only analytics token
 * the daily FP-SearchChannelDaily task already uses). Never printed.
 * Referer classification mirrors Bridge/scripts/cf-search-channel-daily.ps1.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src/data/google-index-bar.exemptions-rum.json')
const PRETTY = resolve(ROOT, 'src/data/figureIdToPrettyPath.generated.json')
const WINDOW_DAYS = 30

function fail(msg) {
  console.error(`[rum-exemptions] FAIL-CLOSED: ${msg}`)
  process.exit(1)
}

// ── token ────────────────────────────────────────────────────────────────
const envFile = join(homedir(), '.figurepinner-secrets.env')
if (!existsSync(envFile)) fail(`missing ${envFile}`)
const tokenLine = readFileSync(envFile, 'utf8').split(/\r?\n/).find((l) => l.startsWith('CF_API_TOKEN='))
if (!tokenLine) fail('CF_API_TOKEN missing from secrets file')
const token = tokenLine.slice('CF_API_TOKEN='.length).trim()
if (!token) fail('CF_API_TOKEN empty')
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

// ── account ──────────────────────────────────────────────────────────────
async function accountId() {
  const r = await fetch('https://api.cloudflare.com/client/v4/accounts', { headers: H }).then((x) => x.json()).catch(() => null)
  if (r?.success && r.result?.length) return r.result[0].id
  const toml = resolve(ROOT, 'wrangler.toml')
  if (existsSync(toml)) {
    const m = readFileSync(toml, 'utf8').match(/account_id"?\s*[:=]\s*"?([0-9a-f]{32})/)
    if (m) return m[1]
  }
  fail('no account id')
}

// ── referer classification (same families as cf-search-channel-daily.ps1) ─
function family(host) {
  if (!host) return 'direct'
  const h = host.toLowerCase()
  if (h.startsWith('com.google') || h.includes('mail')) return 'app'
  if (/(^|\.)bing\.com$/.test(h) || h.includes('duckduckgo') || h.startsWith('search.yahoo') || h.includes('ecosia')) return 'bing-family'
  if (/(^|\.)google\.[a-z.]+$/.test(h) || h === 'news.google.com') return 'google'
  if (h.includes('brave') || h.includes('startpage') || h.includes('qwant') || h.includes('yandex')) return 'other-search'
  if (h.includes('chatgpt') || h.includes('openai') || h.includes('perplexity') || h.includes('copilot') || h.includes('claude.ai') || h.includes('gemini')) return 'ai'
  if (h.includes('grailpulse') || h.includes('figurepinner')) return 'family-sites'
  return 'other-referral'
}
const SEARCH_FAMILIES = new Set(['google', 'bing-family', 'other-search', 'ai'])

// ── query ────────────────────────────────────────────────────────────────
const leqDate = new Date()
const geqDate = new Date(leqDate.getTime() - WINDOW_DAYS * 86400e3)
const geq = geqDate.toISOString()
const leq = leqDate.toISOString()

async function pull(acct) {
  const q = `{ viewer { accounts(filter: {accountTag: "${acct}"}) {
    rumPageloadEventsAdaptiveGroups(limit: 10000, filter: {datetime_geq: "${geq}", datetime_leq: "${leq}"}, orderBy: [sum_visits_DESC])
    { dimensions { refererHost requestPath } sum { visits } } } } }`
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ query: q }) })
    .then((x) => x.json())
    .catch((e) => ({ errors: [{ message: String(e) }] }))
  if (r.errors?.length) fail(`GraphQL: ${r.errors.map((e) => e.message).join('; ')}`)
  return r.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? []
}

// ── path -> fid ──────────────────────────────────────────────────────────
const prettyMap = JSON.parse(readFileSync(PRETTY, 'utf8')) // fid -> pretty path
const pathToFid = new Map()
for (const [fid, p] of Object.entries(prettyMap)) pathToFid.set(p, fid)
function fidForPath(pathRaw) {
  if (!pathRaw) return null
  let p = pathRaw.split('?')[0].split('#')[0]
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  const m = p.match(/^\/figure\/(fp_[A-Za-z0-9_.-]+)$/)
  if (m) return m[1]
  return pathToFid.get(p) ?? null
}

const acct = await accountId()
const rows = await pull(acct)
const referred = rows.filter((r) => SEARCH_FAMILIES.has(family(r.dimensions.refererHost)))
if (referred.length === 0) fail('0 search-referred rows in 30 d — the query or tag is broken, refusing to write an empty exemption list')

const fids = new Set()
const unmapped = new Map()
const familyCounts = {}
for (const r of referred) {
  const fam = family(r.dimensions.refererHost)
  familyCounts[fam] = (familyCounts[fam] ?? 0) + Number(r.sum.visits)
  const fid = fidForPath(r.dimensions.requestPath)
  if (fid) fids.add(fid)
  else unmapped.set(r.dimensions.requestPath, (unmapped.get(r.dimensions.requestPath) ?? 0) + Number(r.sum.visits))
}

const artifact = {
  asof: leq.slice(0, 10),
  window: { geq: geq.slice(0, 10), leq: leq.slice(0, 10), days: WINDOW_DAYS },
  source: 'cf-rum rumPageloadEventsAdaptiveGroups (account-wide, refererHost x requestPath)',
  referer_families: familyCounts,
  fids: [...fids].sort(),
  paths_total: rows.length,
  paths_search_referred: referred.length,
  paths_unmapped: [...unmapped.entries()].sort((a, b) => b[1] - a[1]).map(([path, visits]) => ({ path, visits })),
}
writeFileSync(OUT, JSON.stringify(artifact, null, 2) + '\n')
console.log(`[rum-exemptions] wrote ${OUT}: ${fids.size} fid(s) from ${referred.length} search-referred path rows (${rows.length} total rows, ${geq.slice(0, 10)}..${leq.slice(0, 10)}); unmapped non-figure paths: ${unmapped.size}`)
