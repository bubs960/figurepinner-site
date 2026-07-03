#!/usr/bin/env node
/**
 * post-deploy-smoke-probe.mjs — Steve-runnable live smoke test after a deploy.
 *
 * WHY (2026-07-03, web S52+1 code-confidence punch list): the automated
 * site-sentinel worker (workers/site-sentinel.ts) already re-checks these
 * paths every 15 min, but that means a broken deploy can sit live for up to
 * 15 min (and up to 2h before a second failure email, per its cooldown)
 * before anyone is told. This script gives an immediate PASS/FAIL right
 * after `npm run deploy` finishes, run by hand.
 *
 * WAF NOTE: figurepinner.com's Bot Fight Mode 403s (and silently lies to)
 * plain non-browser HTTP clients — this bit PowerShell/.NET's HttpClient and
 * would bite Node's own fetch() too. The verified-working recipe (see
 * scripts/check-kb-d1-canary-live.mjs) is curl.exe with a full desktop-Chrome
 * User-Agent on Windows; this script reuses that exact recipe rather than
 * re-guessing at a fix.
 *
 * Checks:
 *   1. /api/healthz              — ok/db true, captures the deployed build sha
 *   2. /                         — <meta name="fp-build"> matches healthz's
 *                                   build (catches stale ISR HTML post-deploy)
 *   3. /api/v1/search (2 queries)— KB search + typo-forgiveness ladder alive
 *      (same "wwe elite 11" case that went silently broken for an unknown
 *      period before site-sentinel existed — S15)
 *   4. /api/v1/price-check       — Siri/voice price-lookup path, D1 read
 *   5. /api/waitlist/count       — cheap D1-reachability canary, distinct
 *                                   from healthz's bare SELECT 1
 *   6. one figure page           — renders + eBay affiliate campid present
 *
 * Usage:
 *   node scripts/post-deploy-smoke-probe.mjs
 *   node scripts/post-deploy-smoke-probe.mjs --base http://localhost:3000
 *
 * Exit 0 = all pass. Exit 1 = at least one failure (see printed detail).
 * Pure-stdlib except the Windows curl.exe shell-out. ASCII-only output.
 */

import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const baseIdx = args.indexOf('--base')
const BASE = (baseIdx !== -1 && args[baseIdx + 1] ? args[baseIdx + 1] : 'https://figurepinner.com').replace(/\/$/, '')

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const BROWSER_ACCEPT = 'application/json,text/html,application/xhtml+xml'

function parseCurlResponse(raw) {
  // Only the header block is line-oriented; the body can legitimately contain
  // blank lines (any real HTML page does), so split on the FIRST blank line
  // after the last "HTTP/" status line, not by naively splitting the whole
  // response on every "\n\n" — that fragments a multi-KB HTML body and grabs
  // only its last fragment.
  const normalized = raw.replace(/\r\n/g, '\n')
  const lastStatusAt = normalized.lastIndexOf('\nHTTP/')
  const headerStart = lastStatusAt === -1 ? 0 : lastStatusAt + 1
  const boundary = normalized.indexOf('\n\n', headerStart)
  const headerBlock = boundary === -1 ? normalized.slice(headerStart) : normalized.slice(headerStart, boundary)
  const body = boundary === -1 ? '' : normalized.slice(boundary + 2)
  const status = Number(/^HTTP\/\S+\s+(\d+)/m.exec(headerBlock)?.[1] ?? 0)
  return { status, body }
}

function requestText(url) {
  if (process.platform === 'win32') {
    const raw = execFileSync('curl.exe', [
      '-sS', '-D', '-',
      '-H', `User-Agent: ${BROWSER_UA}`,
      '-H', `Accept: ${BROWSER_ACCEPT}`,
      url,
    ], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    return parseCurlResponse(raw)
  }
  return fetch(url, { headers: { 'user-agent': BROWSER_UA, accept: BROWSER_ACCEPT } })
    .then(async res => ({ status: res.status, body: await res.text() }))
}

/** name, url, check(status, body) -> failure detail string | null (pass) */
async function probe(name, url, check) {
  const t0 = Date.now()
  try {
    const { status, body } = await requestText(url)
    const failure = check(status, body)
    return { name, ok: failure === null, detail: failure ?? 'ok', ms: Date.now() - t0 }
  } catch (e) {
    return { name, ok: false, detail: `request threw: ${String(e).slice(0, 160)}`, ms: Date.now() - t0 }
  }
}

function searchCount(body) {
  try {
    const j = JSON.parse(body)
    return Array.isArray(j.figures) ? j.figures.length : -1
  } catch {
    return -1
  }
}

async function main() {
  let healthzBuild = null

  const results = []

  results.push(await probe('healthz ok/db', `${BASE}/api/healthz`, (status, body) => {
    // Parse + capture the build sha regardless of status: healthz returns 503
    // (with a still-valid JSON body) when only the DB check fails, and the
    // build sha is needed for the staleness check below either way.
    let j
    try {
      j = JSON.parse(body)
    } catch {
      return 'non-JSON body'
    }
    if (j.build) healthzBuild = j.build
    if (status !== 200) return `status ${status}`
    if (!j.ok || !j.db) return `ok=${j.ok} db=${j.db}`
    return null
  }))

  results.push(await probe('homepage fp-build matches healthz', `${BASE}/`, (status, body) => {
    if (status !== 200) return `status ${status}`
    const m = /<meta[^>]*name="fp-build"[^>]*content="([^"]+)"/i.exec(body)
    const pageBuild = m ? m[1] : null
    if (!pageBuild) return 'no <meta name="fp-build"> found on homepage'
    if (!healthzBuild || healthzBuild === 'unknown') return `healthz build unknown, page reports ${pageBuild} (cannot compare)`
    if (pageBuild !== healthzBuild) return `STALE: page fp-build=${pageBuild} != healthz build=${healthzBuild} (ISR cache serving pre-deploy HTML)`
    return null
  }))

  results.push(await probe('search: "wwe elite 11" > 0', `${BASE}/api/v1/search?q=wwe%20elite%2011`, (status, body) => {
    if (status !== 200) return `status ${status}`
    const n = searchCount(body)
    return n > 0 ? null : `returned ${n} results`
  }))

  results.push(await probe('search typo ladder: "hulk hogen" > 0', `${BASE}/api/v1/search?q=hulk%20hogen`, (status, body) => {
    if (status !== 200) return `status ${status}`
    const n = searchCount(body)
    return n > 0 ? null : `returned ${n} results — typo correction broken`
  }))

  results.push(await probe('price-check: "hulk hogan"', `${BASE}/api/v1/price-check?q=hulk%20hogan`, (status, body) => {
    if (status !== 200) return `status ${status}`
    try {
      const j = JSON.parse(body)
      if (!j.match || typeof j.spoken !== 'string') return 'missing match/spoken in response'
      return null
    } catch {
      return 'non-JSON body'
    }
  }))

  results.push(await probe('waitlist count reachable', `${BASE}/api/waitlist/count`, (status, body) => {
    if (status !== 200) return `status ${status}`
    try {
      const j = JSON.parse(body)
      return 'count' in j ? null : 'missing count field'
    } catch {
      return 'non-JSON body'
    }
  }))

  results.push(await probe('figure page + affiliate campid', `${BASE}/figure/fp_wrestling_mattel_elite-legends_30_michelle-mccool_51ea22`, (status, body) => {
    if (status !== 200) return `status ${status}`
    if (!body.includes('campid=5339147406')) return 'eBay affiliate campid MISSING — revenue leak'
    if (!body.includes('_nkw=')) return 'eBay search link missing'
    return null
  }))

  const failures = results.filter(r => !r.ok)
  const line = '='.repeat(66)

  console.log(line)
  console.log(`[smoke-probe] target: ${BASE}`)
  for (const r of results) {
    console.log(`[smoke-probe] ${r.ok ? 'PASS' : 'FAIL'} ${r.name} (${r.ms}ms)${r.ok ? '' : ' -- ' + r.detail}`)
  }
  console.log(line)

  if (failures.length) {
    console.log(`[smoke-probe] ${failures.length}/${results.length} check(s) FAILED.`)
    process.exit(1)
  }
  console.log(`[smoke-probe] all ${results.length} checks passed.`)
}

main()
