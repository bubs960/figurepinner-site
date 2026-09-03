#!/usr/bin/env node
/**
 * post-deploy-prewarm.mjs — warm the edge + ISR cache for the ~650 paths that
 * carry the site's hub surface plus a figure sample, right after the deploy
 * chain's purge_everything and BEFORE the IndexNow ping (webaudit "deploy
 * freeze + prewarm" ask, 2026-09-02; NEXT-STEPS item 4). Zero cost beyond the
 * paced requests.
 *
 * Release M (2026-09-04, speed program S2, Steve-approved 9/3): widened from
 * 50 line hubs / 20 character hubs to EVERY genre + line hub (+ /page/2 for
 * every line over PAGE_SIZE) and the 150 largest character hubs by figure
 * count (Steve's ruling: traffic is 20–50 visits/day, no signal to rank by;
 * NOT all ~10.6k character hubs — the average one holds two figures).
 * TOTAL_BUDGET_MS raised in the same change: sleep time alone for the hub
 * groups is ~5.5 min, so the old 6-min budget would have cut the run short.
 *
 * WHY: `purge-cache.mjs` purges the whole zone, so for the next ~30 min every
 * visitor (and Googlebot) pays a cold origin render — measured 2026-09-02:
 * warm edge-hit rate fell from 9/10 to 7/10 for over half an hour after
 * Release G, and Steve reported "still slow" on a day with five deploys.
 *
 * ORDER (sequential, paced — never a burst): healthz → genre hubs → every
 * line hub, largest first (+ /page/2 where the hub paginates) → 50 figure
 * pages → the 150 largest character hubs. Hubs are not rate-limited; figure
 * pages are (100 req/min/IP, middleware.ts) so they get a wider gap. If the
 * time budget trips, the LAST groups are what gets cut — hence largest-first
 * ordering inside each group.
 *
 * SOURCES (all build-time, on disk, no D1): `kb-stats.generated.json` (fandom
 * → line counts), `kb-lite.generated.json` (tuples: figure_id, fandom, …,
 * character_canonical at index 4), and the live genre-hub slug set parsed
 * from `src/lib/genreFigures.ts` GENRE_HUB_LABELS (keeps this in lockstep
 * with the hubs that actually serve 200 — the seven NECA-rollup fandoms 404
 * at /<fandom>, see kbTypes.genreSlugForFandom's note).
 *
 * "50 most-visited figure pages" per the ask needs a CF top-URL export that
 * does not exist on disk — SKIPPED; substitute = the first figure of each of
 * the 50 largest lines. Add the real list when `scripts/cf-top-urls.json`
 * exists (read it here first, fall back to the substitute).
 *
 * TRANSPORT: curl.exe with a desktop-Chrome UA — Node fetch/undici is 403'd
 * by Bot Fight on this zone regardless of UA (CLAUDE.md truth #3).
 *
 * NEVER fails the deploy chain: exits 0 whatever happens, prints one summary
 * line (counts + HIT/MISS + p50) so the deploy log carries an observed value.
 *
 * Usage: node scripts/post-deploy-prewarm.mjs [--dry-run] [--limit N]
 *        FP_SKIP_PREWARM=1 skips entirely.
 */

import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { recordStep } from './deploy-status.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.FP_PREWARM_BASE ?? 'https://figurepinner.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl'
const HUB_GAP_MS = 250
const FIGURE_GAP_MS = 700 // < 100 req/min on the rate-limited figure route
const LINE_HUBS = Infinity // Release M: every line hub (was 50)
const FIGURES = 50
const CHARACTER_HUBS = 150 // Release M: was 20; Steve 9/3: by size, not traffic
const PAGE_SIZE = 96 // must match lineHubPaging.LINE_HUB_PAGE_SIZE
// Release M: ~412 hub paths × 250 ms + 50 figures × 700 ms + 150 char hubs × 250 ms
// ≈ 5.5 min of sleep before any network time; 15 min leaves headroom without
// letting a stalled origin hold the deploy chain hostage.
const TOTAL_BUDGET_MS = 15 * 60 * 1000

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.indexOf('--limit')
const limit = limitArg !== -1 ? Number(args[limitArg + 1]) : Infinity

if (process.env.FP_SKIP_PREWARM === '1') {
  console.log('[prewarm] FP_SKIP_PREWARM=1 -- skipped')
  process.exit(0)
}

// Mirrors kbTypes.SLUG_TO_FANDOM inverse — tiny, stable; parsed live below
// from the source so a new mapping cannot drift silently.
function readSlugToFandom() {
  const src = readFileSync(path.join(ROOT, 'src/data/kbTypes.ts'), 'utf8')
  const block = src.match(/export const SLUG_TO_FANDOM[^{]*\{([\s\S]*?)\n\}/)
  const map = {}
  for (const m of (block?.[1] ?? '').matchAll(/'([a-z0-9-]+)':\s*'([a-z0-9-]+)'/g)) map[m[2]] = m[1]
  return map // fandom -> genre slug
}

function readGenreHubSlugs() {
  const src = readFileSync(path.join(ROOT, 'src/lib/genreFigures.ts'), 'utf8')
  const block = src.match(/export const GENRE_HUB_LABELS[^{]*\{([\s\S]*?)\n\}/)
  const slugs = []
  for (const m of (block?.[1] ?? '').matchAll(/^\s+'?([a-z0-9-]+)'?\s*:/gm)) slugs.push(m[1])
  return slugs
}

function buildPaths() {
  const fandomToSlug = readSlugToFandom()
  const slugFor = fandom => fandomToSlug[fandom] ?? fandom
  const stats = JSON.parse(readFileSync(path.join(ROOT, 'src/data/kb-stats.generated.json'), 'utf8'))
  const lite = JSON.parse(readFileSync(path.join(ROOT, 'src/data/kb-lite.generated.json'), 'utf8'))
  const rows = JSON.parse(lite.rows)

  const lines = []
  for (const [fandom, info] of Object.entries(stats.fandoms)) {
    for (const [line, count] of Object.entries(info.lines ?? {})) lines.push({ fandom, line, count })
  }
  lines.sort((a, b) => b.count - a.count)
  const topLines = Number.isFinite(LINE_HUBS) ? lines.slice(0, LINE_HUBS) : lines

  const lineHubPaths = []
  for (const l of topLines) {
    lineHubPaths.push(`/${slugFor(l.fandom)}/${l.line}`)
    if (l.count > PAGE_SIZE) lineHubPaths.push(`/${slugFor(l.fandom)}/${l.line}/page/2`)
  }

  // Figures: CF top-URL export if present, else first figure of each top line.
  let figurePaths = []
  const topUrlsFile = path.join(ROOT, 'scripts/cf-top-urls.json')
  if (existsSync(topUrlsFile)) {
    try {
      figurePaths = JSON.parse(readFileSync(topUrlsFile, 'utf8')).filter(p => typeof p === 'string' && p.startsWith('/')).slice(0, FIGURES)
    } catch { figurePaths = [] }
  }
  if (figurePaths.length === 0) {
    const firstByLine = new Map()
    for (const r of rows) {
      const key = `${r[1]}|${r[3]}`
      if (!firstByLine.has(key)) firstByLine.set(key, r[0])
    }
    for (const l of topLines) {
      const id = firstByLine.get(`${l.fandom}|${l.line}`)
      if (id) figurePaths.push(`/figure/${id}`)
      if (figurePaths.length >= FIGURES) break
    }
  }

  const charCounts = new Map()
  for (const r of rows) {
    const key = `/${slugFor(r[1])}/character/${r[4]}`
    charCounts.set(key, (charCounts.get(key) ?? 0) + 1)
  }
  const characterPaths = [...charCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, CHARACTER_HUBS).map(([p]) => p)

  const genrePaths = readGenreHubSlugs().map(s => `/${s}`)

  return [
    { group: 'healthz', gap: HUB_GAP_MS, paths: ['/api/healthz', '/', '/guides'] },
    { group: 'genre-hub', gap: HUB_GAP_MS, paths: genrePaths },
    { group: 'line-hub', gap: HUB_GAP_MS, paths: lineHubPaths },
    { group: 'figure', gap: FIGURE_GAP_MS, paths: figurePaths },
    { group: 'character-hub', gap: HUB_GAP_MS, paths: characterPaths },
  ]
}

function warm(url) {
  const res = spawnSync(CURL, [
    '-s', '-o', process.platform === 'win32' ? 'NUL' : '/dev/null', '-D', '-',
    '--max-time', '25', '-A', UA,
    '-w', '\nSTATUS:%{http_code}\nTTFB:%{time_starttransfer}\n',
    url,
  ], { encoding: 'utf8' })
  const out = res.stdout ?? ''
  const status = Number(/STATUS:(\d+)/.exec(out)?.[1] ?? 0)
  const ttfb = Math.round(Number(/TTFB:([\d.]+)/.exec(out)?.[1] ?? 0) * 1000)
  const cache = /cf-cache-status:\s*([A-Z]+)/i.exec(out)?.[1] ?? '-'
  return { status, ttfb, cache }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  let groups
  try {
    groups = buildPaths()
  } catch (err) {
    console.log(`[prewarm] could not build the path list (${err?.message ?? err}) -- skipped, deploy continues`)
    recordStep('prewarm', 'FAILED', `path list: ${err?.message ?? err}`)
    return
  }
  const total = groups.reduce((n, g) => n + g.paths.length, 0)
  console.log(`[prewarm] ${total} paths: ${groups.map(g => `${g.group}=${g.paths.length}`).join(' ')} (base ${BASE})`)
  if (dryRun) {
    for (const g of groups) for (const p of g.paths) console.log(`  ${g.group.padEnd(13)} ${p}`)
    return
  }

  const started = Date.now()
  const ttfbs = []
  const tally = { ok: 0, err: 0, hit: 0, miss: 0 }
  let n = 0
  outer: for (const g of groups) {
    for (const p of g.paths) {
      if (n >= limit) break outer
      if (Date.now() - started > TOTAL_BUDGET_MS) {
        console.log(`[prewarm] time budget reached after ${n} requests -- stopping, deploy continues`)
        break outer
      }
      n++
      const r = warm(`${BASE}${p}`)
      if (r.status >= 200 && r.status < 400) tally.ok++; else tally.err++
      if (r.cache === 'HIT') tally.hit++; else if (r.cache === 'MISS' || r.cache === 'EXPIRED') tally.miss++
      ttfbs.push(r.ttfb)
      if (r.status === 0 || r.status >= 500 || r.status === 429) console.log(`[prewarm]   ${r.status} ${p} (${r.ttfb} ms, ${r.cache})`)
      await sleep(g.gap)
    }
  }
  ttfbs.sort((a, b) => a - b)
  const p50 = ttfbs[Math.floor(ttfbs.length / 2)] ?? 0
  const p95 = ttfbs[Math.floor(ttfbs.length * 0.95)] ?? 0
  const secs = Math.round((Date.now() - started) / 1000)
  console.log(`[prewarm] done: ${n} requests in ${secs}s, ok=${tally.ok} err=${tally.err}, edge HIT=${tally.hit} MISS/EXPIRED=${tally.miss} (first-touch MISSes are the point), origin TTFB p50=${p50}ms p95=${p95}ms`)
  recordStep('prewarm', tally.err > n / 4 ? 'FAILED' : 'OK', `${n} req, ok=${tally.ok} err=${tally.err}, p50=${p50}ms`)
}

main().catch(err => {
  console.log(`[prewarm] unexpected error (${err?.message ?? err}) -- deploy continues`)
  recordStep('prewarm', 'FAILED', `unexpected: ${err?.message ?? err}`)
}).finally(() => process.exit(0))
