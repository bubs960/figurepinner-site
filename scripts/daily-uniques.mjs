/**
 * daily-uniques.mjs - human traffic scoreboard for figurepinner.com.
 *
 * Source of truth: Cloudflare Web Analytics RUM pageload events. The beacon
 * fires in real browsers and excludes most crawler/bot traffic, so this is the
 * number we use for the R1 target instead of zone-level uniques.
 *
 * Usage:
 *   node scripts/daily-uniques.mjs
 *   node scripts/daily-uniques.mjs --days 30
 *   node scripts/daily-uniques.mjs --json
 */

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ACCOUNT_ID_FALLBACK = '9b94d79e0038f311a605168af9aaafe9'
const GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql'
const PUBLIC_ENDPOINT = 'https://figurepinner.com/api/daily-uniques'
const TARGET = 50

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const daysArg = args.indexOf('--days')
const days = daysArg !== -1 && args[daysArg + 1] ? Math.max(1, parseInt(args[daysArg + 1], 10)) : 7

function fail(message) {
  console.error(`\n${message}\n`)
  process.exitCode = 1
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

function pctToTarget(visits) {
  return Math.round((visits / TARGET) * 1000) / 10
}

function fmt(date) {
  return date.toISOString().slice(0, 10)
}
function publicEndpointRows() {
  try {
    const body = execFileSync('curl.exe', [
      '-s',
      '-A',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
      '-H',
      'Accept: application/json,text/plain,*/*',
      `${PUBLIC_ENDPOINT}?days=${encodeURIComponent(String(days))}`,
    ], { encoding: 'utf8', maxBuffer: 1024 * 1024 })
    const payload = JSON.parse(body)
    if (payload?.error) throw new Error(JSON.stringify(payload))
    return {
      rows: Array.isArray(payload.rows) ? payload.rows : [],
      avgVisits: Number(payload.avg_visits_per_day || 0),
      ts: payload.ts,
      source: 'cloudflare_web_analytics_rum_public_endpoint',
    }
  } catch (error) {
    throw new Error(`No CF_API_TOKEN found and public endpoint fallback failed: ${error?.message || String(error)}`)
  }
}

async function cfGraphql(token, query, variables) {
  const response = await fetch(GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* leave null */ }
  if (!response.ok || !json || json.errors?.length) {
    throw new Error(`Cloudflare GraphQL failed HTTP ${response.status}: ${text.slice(0, 1000)}`)
  }
  return json
}

async function resolveRumSiteTag(token, accountId, start, end) {
  if (process.env.CF_RUM_SITE_TAG) return process.env.CF_RUM_SITE_TAG
  const query = `query($accountTag: String!, $start: String!, $end: String!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        rumPageloadEventsAdaptiveGroups(
          limit: 50
          filter: { date_geq: $start, date_leq: $end }
        ) {
          dimensions { siteTag }
          sum { visits }
        }
      }
    }
  }`
  const json = await cfGraphql(token, query, { accountTag: accountId, start, end })
  const groups = json?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? []
  const best = groups.reduce((a, b) => ((b?.sum?.visits ?? 0) > (a?.sum?.visits ?? 0) ? b : a), null)
  if (!best?.dimensions?.siteTag) throw new Error('Could not resolve Cloudflare RUM siteTag for this account/window.')
  return best.dimensions.siteTag
}

async function queryRumRows(token, accountId, siteTag, start, end) {
  const query = `query($accountTag: String!, $siteTag: String!, $start: String!, $end: String!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        rumPageloadEventsAdaptiveGroups(
          limit: 100
          filter: { siteTag: $siteTag, date_geq: $start, date_leq: $end }
          orderBy: [date_ASC]
        ) {
          dimensions { date }
          sum { visits }
          count
        }
      }
    }
  }`
  const json = await cfGraphql(token, query, { accountTag: accountId, siteTag, start, end })
  const groups = json?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups
  if (!Array.isArray(groups)) throw new Error('Unexpected Cloudflare RUM response shape.')
  return groups.map((group) => ({
    date: group.dimensions?.date,
    uniques: group.sum?.visits ?? 0,
    requests: group.count ?? 0,
    pageViews: group.count ?? 0,
  }))
}

const env = loadEnvFile()
const token = process.env.CF_API_TOKEN || env.CF_API_TOKEN
const accountId = process.env.CF_ACCOUNT_ID || env.CF_ACCOUNT_ID || ACCOUNT_ID_FALLBACK
try {
  if (!token) {
    const fallback = publicEndpointRows()
    render(fallback.rows, fallback.avgVisits, fallback.source, fallback.ts)
  } else {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
    const start = fmt(startDate)
    const end = fmt(endDate)
    const siteTag = await resolveRumSiteTag(token, accountId, start, end)
    const rows = await queryRumRows(token, accountId, siteTag, start, end)
    const avgVisits = rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.uniques || 0), 0) / rows.length) : 0
    render(rows, avgVisits, 'cloudflare_web_analytics_rum_graphql', new Date().toISOString())
  }
} catch (error) {
  fail(error?.message || String(error))
}

function render(rows, avgVisits, source, ts) {
  const latest = rows[rows.length - 1] || null
  const latestVisits = Number(latest?.uniques || 0)
  const gap = Math.max(0, TARGET - latestVisits)

  if (asJson) {
    console.log(JSON.stringify({
        source,
        target: TARGET,
        latest_day: latest,
        gap_to_target: gap,
        pct_to_target: pctToTarget(latestVisits),
        avg_visits_per_day: avgVisits,
        rows,
        ts,
      }, null, 2))
  } else {
    console.log(`\nfigurepinner.com - human traffic scoreboard (CF Web Analytics RUM, last ${days}d)`)
      console.log('-'.repeat(76))
      console.log('date         visits   pageViews   target%')
      for (const row of rows) {
        const visits = Number(row.uniques || 0)
        console.log(
          `${String(row.date).padEnd(12)} ${String(visits).padStart(6)}   ${String(row.pageViews || 0).padStart(9)}   ${String(pctToTarget(visits)).padStart(6)}%`,
        )
      }
      console.log('-'.repeat(76))
      console.log(`avg visits/day: ${avgVisits}`)
      console.log(`latest day (${latest?.date || 'n/a'}): ${latestVisits} visits, ${gap} short of ${TARGET}`)
    console.log('source: Cloudflare Web Analytics RUM beacon; bot-filtered browser sessions, not zone-level crawler traffic.\n')
  }
}
