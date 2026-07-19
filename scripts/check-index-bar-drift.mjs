#!/usr/bin/env node
/**
 * check-index-bar-drift.mjs — Part B freshness monitor (SHOULD-2 from
 * WEBAUDIT-TO-WEB-PARTB-BAR-RATIFIED-PLUS-FRESHNESS-CONDITIONS-2026-07-19.md):
 * "a drift check comparing live at-bar fid count vs. live sitemap URL count,
 * alarms instead of silently rotting."
 *
 * ── WHAT THIS ACTUALLY CHECKS (be honest about scope) ───────────────────
 * This compares two things computed from the SAME static census file
 * (src/data/index-value-census.json, matcher's read-only value census
 * snapshot): (1) what this repo's OWN sitemap.ts logic says the live sitemap
 * SHOULD contain right now (recomputed here from the real isAtOrAboveIndexBar
 * + prettyFigureUrl functions, not a re-derived copy of the bar rule), vs.
 * (2) what the LIVE production sitemap actually contains, fetched fresh over
 * HTTP. A mismatch here means the deployed build doesn't match what the
 * current checkout's code+census would produce -- a real, catchable
 * class of bug (a deploy that shipped a stale bundle, a build that silently
 * dropped the census file, a code regression in the exclusion logic itself).
 *
 * This does NOT (and cannot, from this repo alone) detect the OTHER kind of
 * staleness the ratification relay named: the census.json snapshot itself
 * going stale relative to matcher's live sold-comp data (a figure gains its
 * first real sale, but the static census file doesn't know until the next
 * regen). Catching THAT requires a live read against matcher's own comp data
 * source, which this repo has no access to. Flagging the boundary honestly
 * rather than overclaiming -- see the SHOULD-1 freshness condition (chaining
 * census regen to the comps pipeline) for the piece that actually addresses
 * snapshot staleness; this script only catches deploy/build-level drift.
 *
 * ── WAF NOTE ─────────────────────────────────────────────────────────────
 * Reuses the same curl.exe + browser-UA recipe as
 * scripts/post-deploy-smoke-probe.mjs / scripts/seo-preflight.mjs --
 * figurepinner.com's Bot Fight Mode 403s and lies to plain curl/fetch.
 *
 * Usage: node scripts/check-index-bar-drift.mjs
 * Exit 0 = counts match (or within TOLERANCE). Exit 1 = drift found.
 * Pure read-only: fetches prod over HTTP, reads the local census file. Never
 * writes anything, never touches the KB or D1.
 */

import { execFileSync } from 'node:child_process'
import { register } from 'node:module'

register('./ts-loader.mjs', import.meta.url)

const { getAllFandoms, getFiguresByFandom, prettyFigureUrl } = await import('../src/data/kb.ts')
const { isAtOrAboveIndexBar } = await import('../src/data/indexValueCensus.ts')
const { isFigurePageRoute } = await import('../src/lib/routeClassification.ts')

const PROD_BASE = 'https://figurepinner.com'
const LOG = '[check-index-bar-drift]'
const LINE = '='.repeat(66)

// Small nonzero tolerance: a fid can legitimately cross the bar or get newly
// added to the KB in the gap between "this script reads the local census"
// and "it fetches the live sitemap a few seconds later" on a busy day. Zero
// tolerance would false-positive on that timing gap alone.
const TOLERANCE = 3

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function parseCurlResponse(raw) {
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
      '--max-time', '60',
      '-H', `User-Agent: ${BROWSER_UA}`,
      url,
    ], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 30, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
    return parseCurlResponse(raw)
  }
  return fetch(url, { headers: { 'user-agent': BROWSER_UA } })
    .then(async res => ({ status: res.status, body: await res.text().catch(() => '') }))
}

function extractLocs(xmlBody) {
  const out = []
  const re = /<loc>([^<]+)<\/loc>/g
  let m
  while ((m = re.exec(xmlBody))) out.push(m[1].trim())
  return out
}

async function fetchProdSitemapIds() {
  const res = await requestText(`${PROD_BASE}/robots.txt`)
  if (res.status !== 200) throw new Error(`robots.txt returned ${res.status}, cannot read prod sitemap child list`)
  const ids = []
  const re = /^Sitemap:\s*(\S+)/gim
  let m
  while ((m = re.exec(res.body))) {
    const mm = /\/sitemap\/([^/]+)\.xml$/.exec(m[1])
    if (mm) ids.push(mm[1])
  }
  return ids
}

async function main() {
  console.log(LINE)
  console.log(`${LOG} Part B drift check -- comparing this checkout's expected sitemap figure-URL count against live prod`)
  console.log(LINE)

  // ── Expected count, computed the same way sitemap.ts computes it ────────
  // Reuses the real isAtOrAboveIndexBar + prettyFigureUrl functions (not a
  // redefinition of the bar rule), mirroring fandomSitemap()'s own
  // per-fandom dedup-by-URL loop so a figure that shares a pretty URL with
  // another (ambiguous multi-match cases) isn't double-counted.
  let expectedCount = 0
  for (const fandom of getAllFandoms()) {
    const figs = getFiguresByFandom(fandom)
    const seenUrls = new Set()
    for (const f of figs) {
      if (!isAtOrAboveIndexBar(f.figure_id)) continue
      const url = prettyFigureUrl(f)
      if (!seenUrls.has(url)) {
        seenUrls.add(url)
        expectedCount++
      }
    }
  }
  console.log(`${LOG} expected (local checkout, at-bar + dedup): ${expectedCount} figure URLs`)

  // ── Live count, fetched fresh from prod ──────────────────────────────────
  const prodIds = await fetchProdSitemapIds()
  console.log(`${LOG} fetching ${prodIds.length} live sitemap children from ${PROD_BASE} ...`)
  let liveCount = 0
  const liveFigureUrls = new Set()
  for (const id of prodIds) {
    if (id === 'static') continue
    const res = await requestText(`${PROD_BASE}/sitemap/${id}.xml`)
    if (res.status !== 200) {
      console.log(`${LOG} WARN sitemap child "${id}" returned ${res.status}, skipping (not counted as drift)`)
      continue
    }
    for (const loc of extractLocs(res.body)) {
      let path
      try { path = new URL(loc).pathname } catch { continue }
      if (isFigurePageRoute(path)) liveFigureUrls.add(loc)
    }
  }
  liveCount = liveFigureUrls.size
  console.log(`${LOG} live (prod, deduped): ${liveCount} figure URLs`)

  const diff = Math.abs(expectedCount - liveCount)
  console.log(LINE)
  if (diff > TOLERANCE) {
    console.log(`${LOG} DRIFT: expected ${expectedCount} vs live ${liveCount} (diff ${diff}, tolerance ${TOLERANCE})`)
    console.log(`${LOG} This means the live deploy does not match what this checkout's code + census would`)
    console.log(`${LOG} produce -- a stale build, a dropped census file, or a real regression in the`)
    console.log(`${LOG} exclusion logic. Investigate before assuming this is just census staleness (see`)
    console.log(`${LOG} the header comment on scope -- this check cannot tell the two apart on its own).`)
    console.log(LINE)
    process.exit(1)
  }
  console.log(`${LOG} PASS: expected ${expectedCount} vs live ${liveCount} (diff ${diff}, within tolerance ${TOLERANCE})`)
  console.log(LINE)
}

main().catch(e => {
  console.log('\n' + LINE)
  console.log(`${LOG} UNEXPECTED ERROR: ${e && e.stack ? e.stack : e}`)
  console.log(LINE)
  process.exit(1)
})
