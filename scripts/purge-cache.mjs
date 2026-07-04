/**
 * purge-cache.mjs - zone cache purge, run as the last step of `npm run deploy`.
 *
 * WHY (C1, 2026-07-04 hygiene plan): edge-cache-entry.mjs's HTML_TTL_CAP was
 * raised 1h -> 24h to cut needless origin re-renders under recrawl load. That
 * TTL raise is only safe if a deploy's new build reaches every colo right
 * away instead of waiting up to 24h for the old cached HTML to expire.
 * Cloudflare's zone "Purge Everything" clears both the zone edge cache AND
 * this Worker's own Cache API entries (edge-cache-entry.mjs's own comment
 * already documented this as the existing manual emergency procedure) -- this
 * script just automates that call after every deploy instead of leaving it
 * as a thing Steve has to remember to click in the dashboard.
 *
 * Token source, same convention as scripts/daily-uniques.mjs (never in the
 * git repo): process.env.CF_PURGE_TOKEN, else CF_PURGE_TOKEN in
 * ~/.figurepinner-secrets.env. Zone ID: same dashboard-verified fallback
 * constant used by src/app/api/daily-uniques/route.ts, override via
 * CF_ZONE_ID if it ever changes.
 *
 * Deliberately non-fatal: a failed purge must NOT fail `npm run deploy` and
 * roll back a successful build+deploy over a purge hiccup. Old HTML still
 * expires within 24h either way (the TTL cap is the safety net, not this
 * script). Prints a clear warning + the manual fallback instead.
 */

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ZONE_ID_FALLBACK = '66a98bfaa6a2992c9ed3c32f9f3c1702'

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
    // Optional: env var alone is enough in CI/Worker-like shells.
  }
  return out
}

async function main() {
  const env = loadEnvFile()
  const token = process.env.CF_PURGE_TOKEN || env.CF_PURGE_TOKEN
  const zoneId = process.env.CF_ZONE_ID || env.CF_ZONE_ID || ZONE_ID_FALLBACK

  if (!token) {
    console.warn('\n[purge-cache] CF_PURGE_TOKEN not found (checked env + ~/.figurepinner-secrets.env).')
    console.warn('              Skipping purge -- new build will still reach every colo within 24h (HTML_TTL_CAP).')
    console.warn('              To enable instant purge-on-deploy, add CF_PURGE_TOKEN to ~/.figurepinner-secrets.env')
    console.warn('              (Cloudflare dash -> My Profile -> API Tokens -> Custom Token -> Zone:Cache Purge:Purge, scoped to figurepinner.com).\n')
    return
  }

  const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    })
  } catch (error) {
    console.warn(`\n[purge-cache] Purge request failed to send: ${error?.message || String(error)}`)
    console.warn('              Non-fatal -- deploy already succeeded. New build reaches every colo within 24h regardless.')
    console.warn('              Manual fallback: Cloudflare dash -> figurepinner.com -> Caching -> Configuration -> Purge Everything.\n')
    return
  }

  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* leave null */ }

  if (!response.ok || !json?.success) {
    console.warn(`\n[purge-cache] Purge request returned HTTP ${response.status}, success=${json?.success}.`)
    console.warn(`              Body: ${text.slice(0, 400)}`)
    console.warn('              Non-fatal -- deploy already succeeded. New build reaches every colo within 24h regardless.')
    console.warn('              Manual fallback: Cloudflare dash -> figurepinner.com -> Caching -> Configuration -> Purge Everything.\n')
    return
  }

  console.log(`[purge-cache] Zone ${zoneId} purged (purge_everything). Deploy propagation is now instant, not 24h-bounded.`)
}

await main()
