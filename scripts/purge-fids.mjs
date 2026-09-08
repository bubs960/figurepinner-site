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
 * Two purges per fid:
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
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PRICE_KV_NAMESPACE_ID = 'fb4c1bd0cee4467380818383357094e9' // wrangler.toml PRICE_KV
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

function wrangler(args) {
  const res = spawnSync('npx.cmd', ['wrangler', ...args], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, cwd: ROOT })
  if (res.status !== 0) {
    throw new Error(`wrangler ${args.join(' ')} exited ${res.status}: ${(res.stderr || res.stdout || '').slice(0, 500)}`)
  }
  return res.stdout
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
  console.log('[purge-fids] done.')
}

await main()
