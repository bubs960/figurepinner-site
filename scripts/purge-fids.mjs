#!/usr/bin/env node
/**
 * purge-fids.mjs — per-fid cache purge (Phase 1b contract section 3.5).
 *
 * WHY: matcher's `POST /api/v1/internal/regenerate` re-writes specific fids'
 * price snapshots in R2 (receipts: `{fid, ok, key, ...}`, max 50/call) mid-
 * cycle, outside the normal deploy chain. Without this, those fids keep
 * serving their OLD PRICE_KV mirror entry (24h TTL, priceReadThrough.ts) and
 * OLD figure-page ISR HTML until either expires on its own — up to 24h of a
 * stale quote after a deliberate regeneration, which the coordinated Phase
 * 1b release specifically exists to avoid (MATCHER-TO-WEB-QUOTE-TIER-WIRING-
 * REVIEW-2026-09-07.md item 2). Neither existing purge script covers this:
 * kv-purge-stale-isr.mjs only sweeps the isr-cache/<buildId>/ prefix by
 * build, and purge-cache.mjs only does zone-wide purge_everything — neither
 * takes a fid list.
 *
 * Three purges per run:
 *   1. PRICE_KV mirror entries (`<gen>/price-summaries/<fid>` and
 *      `<gen>/price-history/<fid>`, priceReadThrough.ts's own key format) —
 *      `wrangler kv key delete`, reusing wrangler's authenticated session
 *      (no separate token), same convention as kv-purge-stale-isr.mjs. The
 *      live generation is read from the `price-gen` key first (defaults to
 *      the same 'g0' fallback priceReadThrough.ts uses).
 *   2. The figure page's edge cache, by URL, via Cloudflare's purge_cache
 *      API with a `files` list (same token/zone convention as purge-cache.mjs)
 *      — cheaper and more targeted than that script's purge_everything for a
 *      handful of fids. URL comes from figureIdToPrettyPath.generated.json
 *      (the cutoff regen's own map) when a fid has a pretty path, else the
 *      canonical `/figure/<fid>` fallback route.
 *   3. The CURRENT build's whole `isr-cache/<buildId>/` prefix in the shared
 *      FP_KV namespace (Next's incremental cache -- open-next.config.ts /
 *      src/lib/kv-incremental-cache-ttl.ts, binding NEXT_INC_CACHE_KV).
 *      ADDED 2026-09-09 (pre-mortem item 2, CODEX-PREMORTEM-QUOTE-TIER-
 *      RELEASE-2026-09-09.md): steps 1+2 above never touched this cache, so
 *      a purged figure's page (and the R2 price fetch's own "fetch" cache
 *      entry) could keep refilling stale from the incremental cache even
 *      after a fresh regenerate — a page could show the OLD price on both
 *      the "cold" (edge-purged) and "warm" read, exactly the gap the item's
 *      own test asks for ("inspect both cold and warm page output ... after
 *      regeneration/purge"). This purges the WHOLE current build's ISR
 *      cache (page cache AND fetch/data cache both live under this one
 *      prefix, see computeCacheKey's `.cache`/`.fetch` suffix) rather than
 *      computing a per-URL hash key: OpenNext's exact cache-key string
 *      (pathname? locale? build id composition?) is an internal
 *      implementation detail not worth reverse-engineering under a release
 *      deadline when a full-build sweep is unambiguously correct and reuses
 *      kv-purge-stale-isr.mjs's own already-hardened list/delete idiom
 *      (assertAllPrefixed defense-in-depth, chunked bulk delete) — see that
 *      file's header for the fuller incident history behind those guards.
 *      Deliberately NOT importing that script (it has an unconditional
 *      top-level `main()` that would fire the stale-build sweep as a side
 *      effect); the small subset needed is reimplemented here, scoped to
 *      the CURRENT build instead of prior ones. Cost is bounded: this only
 *      runs once per coordinated release window, not per request or per
 *      deploy, and the accepted risk is identical to what every deploy
 *      already accepts ("worst case is one cold revalidation per page").
 *      Non-fatal on failure (network/`.next/BUILD_ID` missing) -- the rest
 *      of the purge already completed; a failure here is surfaced loudly in
 *      the run's own output so the operator re-checks cold+warm by hand.
 *
 * Default mode is DRY RUN, same convention as kv-purge-stale-isr.mjs: prints
 * what would be purged, touches nothing. Pass --execute to actually purge.
 *
 * Usage:
 *   node scripts/purge-fids.mjs --fids fp_a,fp_b,fp_c [--execute]
 *   node scripts/purge-fids.mjs --file receipts.json [--execute]
 *     (receipts.json: an array of {fid} or {figure_id} objects, or a plain
 *     array of fid strings — matches the shape of matcher's regenerate
 *     receipts either way)
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isrPrefixForBuild, assertAllPrefixed, parseKvKeyNames } from './lib/purge-fids-core.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PRICE_KV_NAMESPACE_ID = 'fb4c1bd0cee4467380818383357094e9' // wrangler.toml PRICE_KV
const ISR_KV_NAMESPACE_ID = 'e1858bb16a4f41f5b81afe8cf53519f5' // FP_KV, shared PRO_KV/NEXT_INC_CACHE_KV (same id kv-purge-stale-isr.mjs uses)
const ZONE_ID_FALLBACK = '66a98bfaa6a2992c9ed3c32f9f3c1702' // same fallback purge-cache.mjs uses
const GEN_KEY = 'price-gen'
const GEN_DEFAULT = 'g0' // must match src/lib/priceReadThrough.ts

function argValue(name) {
  const i = process.argv.indexOf(name)
  return i !== -1 ? process.argv[i + 1] : undefined
}
const execute = process.argv.includes('--execute')

function parseFids() {
  const raw = argValue('--fids')
  if (raw) return [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))]
  const file = argValue('--file')
  if (file) {
    const data = JSON.parse(readFileSync(file, 'utf8'))
    const list = Array.isArray(data) ? data : []
    const fids = list.map(x => (typeof x === 'string' ? x : x.fid ?? x.figure_id)).filter(Boolean)
    return [...new Set(fids)]
  }
  console.error('[purge-fids] usage: node scripts/purge-fids.mjs --fids fp_a,fp_b [--execute]')
  console.error('                 or: node scripts/purge-fids.mjs --file receipts.json [--execute]')
  process.exit(1)
}

function loadEnvFile() {
  const p = join(homedir(), '.figurepinner-secrets.env')
  const out = {}
  try {
    const txt = readFileSync(p, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* env var alone is fine */ }
  return out
}

function wrangler(args, opts = {}) {
  const res = spawnSync('npx.cmd', ['wrangler', ...args], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, cwd: ROOT, timeout: opts.timeoutMs })
  if (res.status !== 0) {
    throw new Error(`wrangler ${args.join(' ')} exited ${res.status}: ${(res.stderr || res.stdout || '').slice(0, 500)}`)
  }
  return res.stdout
}

/** `.next/BUILD_ID` -- only trustworthy right after a build/deploy, same
 *  caveat kv-purge-stale-isr.mjs documents for its own read of this file. */
function currentBuildId() {
  const p = path.join(ROOT, '.next', 'BUILD_ID')
  let id
  try {
    id = readFileSync(p, 'utf8').trim()
  } catch (err) {
    throw new Error(`could not read ${p} (${err.message}) -- run this after the build/deploy step, not standalone against a stale local build.`)
  }
  if (!id) throw new Error(`${p} is empty -- refusing to sweep an empty build-id prefix.`)
  return id
}

/**
 * Sweep the CURRENT build's whole isr-cache/<buildId>/ prefix out of the
 * shared FP_KV namespace (pre-mortem item 2 -- see the file header for why
 * this is a full-build sweep rather than a per-URL targeted delete, and why
 * this reimplements kv-purge-stale-isr.mjs's list/delete idiom rather than
 * importing it). Non-fatal to the caller -- throws, caller decides.
 */
function purgeIsrForCurrentBuild() {
  const buildId = currentBuildId()
  const prefix = isrPrefixForBuild(buildId)
  console.log(`[purge-fids] listing ISR cache keys under ${prefix} ...`)
  const out = wrangler(['kv', 'key', 'list', '--namespace-id', ISR_KV_NAMESPACE_ID, '--remote', '--prefix', prefix], { timeoutMs: 5 * 60 * 1000 })
  const names = parseKvKeyNames(out, 'purgeIsrForCurrentBuild()')
  assertAllPrefixed(names, prefix, 'purgeIsrForCurrentBuild()')
  console.log(`[purge-fids] ${names.length} ISR cache key(s) found for build ${buildId}`)
  for (let i = 0; i < names.length; i += 1000) {
    const batch = names.slice(i, i + 1000)
    const tmpPath = join(tmpdir(), `purge-fids-isr-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
    writeFileSync(tmpPath, JSON.stringify(batch))
    try {
      wrangler(['kv', 'bulk', 'delete', tmpPath, '--namespace-id', ISR_KV_NAMESPACE_ID, '--remote', '-f'], { timeoutMs: 90 * 1000 })
      console.log(`[purge-fids] deleted ISR chunk ${Math.floor(i / 1000) + 1}: ${batch.length} key(s)`)
    } finally {
      unlinkSync(tmpPath)
    }
  }
  return { buildId, deleted: names.length }
}

function currentGen() {
  try {
    const out = wrangler(['kv', 'key', 'get', GEN_KEY, '--namespace-id', PRICE_KV_NAMESPACE_ID, '--remote'])
    const gen = out.trim()
    return /^[A-Za-z0-9._-]{1,64}$/.test(gen) ? gen : GEN_DEFAULT
  } catch {
    return GEN_DEFAULT
  }
}

function loadPrettyPathMap() {
  try {
    return JSON.parse(readFileSync(path.join(ROOT, 'src/data/figureIdToPrettyPath.generated.json'), 'utf8'))
  } catch {
    return {}
  }
}

function urlForFid(fid, prettyMap) {
  const pretty = prettyMap[fid]
  return pretty ? `https://figurepinner.com${pretty}` : `https://figurepinner.com/figure/${fid}`
}

async function purgeUrls(urls, env) {
  const token = process.env.CF_PURGE_TOKEN || env.CF_PURGE_TOKEN
  const zoneId = process.env.CF_ZONE_ID || env.CF_ZONE_ID || ZONE_ID_FALLBACK
  if (!token) {
    console.warn('[purge-fids] CF_PURGE_TOKEN not found (checked env + ~/.figurepinner-secrets.env) -- skipping edge-cache purge.')
    console.warn('             KV mirror purge above still ran; the page itself expires on its normal ISR cadence.')
    return
  }
  // CF's purge-by-URL API caps at 30 files per call.
  for (let i = 0; i < urls.length; i += 30) {
    const chunk = urls.slice(i, i + 30)
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: chunk }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) {
      console.warn(`[purge-fids] URL purge chunk ${i / 30 + 1} FAILED: HTTP ${res.status}, ${JSON.stringify(json).slice(0, 300)}`)
    } else {
      console.log(`[purge-fids] URL purge chunk ${i / 30 + 1}: ${chunk.length} URL(s) OK`)
    }
  }
}

async function main() {
  const fids = parseFids()
  console.log(`[purge-fids] ${fids.length} fid(s), mode=${execute ? 'EXECUTE' : 'DRY RUN'}`)

  const gen = execute ? currentGen() : GEN_DEFAULT
  const kvKeys = fids.flatMap(fid => [`${gen}/price-summaries/${fid}`, `${gen}/price-history/${fid}`])
  const prettyMap = loadPrettyPathMap()
  const urls = fids.map(fid => urlForFid(fid, prettyMap))

  console.log(`[purge-fids] generation=${gen}`)
  console.log(`[purge-fids] would delete ${kvKeys.length} PRICE_KV key(s):`)
  for (const k of kvKeys) console.log(`  ${k}`)
  console.log(`[purge-fids] would purge ${urls.length} URL(s):`)
  for (const u of urls) console.log(`  ${u}`)
  console.log('[purge-fids] would also sweep the current build\'s whole isr-cache/<buildId>/ prefix (item 2 fix -- full-build sweep, see file header).')

  if (!execute) {
    console.log('[purge-fids] dry run only -- pass --execute to actually purge.')
    return
  }

  for (const key of kvKeys) {
    try {
      wrangler(['kv', 'key', 'delete', key, '--namespace-id', PRICE_KV_NAMESPACE_ID, '--remote'])
      console.log(`[purge-fids] deleted ${key}`)
    } catch (err) {
      // A missing key (never mirrored, or already expired) is not an error --
      // wrangler's own exit code doesn't distinguish it, so this stays
      // non-fatal for the whole run rather than aborting on the first miss.
      console.warn(`[purge-fids] delete failed for ${key}: ${err.message.slice(0, 200)}`)
    }
  }

  await purgeUrls(urls, loadEnvFile())

  try {
    const { buildId, deleted } = purgeIsrForCurrentBuild()
    console.log(`[purge-fids] ISR/incremental cache: deleted ${deleted} key(s) for build ${buildId}.`)
  } catch (err) {
    console.warn(`[purge-fids] ISR purge FAILED (non-fatal -- the PRICE_KV + edge purges above already completed): ${err.message.slice(0, 300)}`)
    console.warn('             A stale ISR entry can still serve the target fid(s) until it naturally expires. Verify with a cold+warm read; re-run this script if the ISR sweep is the only thing that failed.')
  }

  console.log('[purge-fids] done.')
}

await main()
