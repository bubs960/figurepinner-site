/**
 * kv-purge-stale-isr.mjs - deletes ISR incremental-cache keys from prior
 * builds out of the shared FP_KV namespace (webaudit Phase 3, P1 SS1.4).
 *
 * WHY: @opennextjs/cloudflare's NEXT_INC_CACHE_KV binding writes every ISR
 * cache entry as `isr-cache/<buildId>/<hash>.(cache|fetch)`. There has never
 * been a cleanup step, so every deploy since the binding was added
 * (2026-05-21) has left its build's keys behind forever. Confirmed live
 * 2026-07-09: isr-cache prefix truncates a 5000-key admin audit sample,
 * namespace billed at 68GB / $11.50 (partial period).
 *
 * Only ever touches the `isr-cache/` prefix. Never touches `pro:` (real user
 * data) or any other key in the shared FP_KV namespace
 * (e1858bb16a4f41f5b81afe8cf53519f5).
 *
 * Default mode is DRY RUN: lists + counts + samples what WOULD be deleted,
 * deletes nothing. Pass --execute to actually delete. This is deliberate --
 * a script that defaults to destructive on a namespace with a live user-data
 * prefix next to it is exactly the kind of thing that shouldn't be one typo
 * away from wiping the wrong keys.
 *
 * Keeps ONLY the current build's keys (no "previous build" grace window --
 * ISR is fully re-populatable; worst case is one cold revalidation per page,
 * already the accepted risk per the Phase 3 plan's risk register). Current
 * build id is read from .next/BUILD_ID, which is only trustworthy right
 * after a build+deploy -- this script is meant to run as the last step of
 * `npm run deploy`, after the opennextjs deploy step, not standalone against
 * a stale local build.
 *
 * Auth: shells out to `wrangler kv key list` / `wrangler kv bulk delete`
 * rather than calling the CF REST API directly, so it reuses wrangler's own
 * authenticated session (same as purge-cache.mjs's deploy-time neighbors) --
 * no separate CF_API_TOKEN needs to exist on disk for this script to work.
 */

import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const NAMESPACE_ID = 'e1858bb16a4f41f5b81afe8cf53519f5' // FP_KV, shared PRO_KV/NEXT_INC_CACHE_KV
const KEEP_PREFIX = 'isr-cache/'
const MAX_BUFFER = 500 * 1024 * 1024 // 500MB -- namespace has ~500k+ keys

// Distinguishes "something is actually wrong, a human should notice" from
// routine non-fatal noise (missing .next/BUILD_ID on a standalone run, a
// transient wrangler hiccup). Both still exit 0 -- this script must never
// fail `npm run deploy` -- but an anomaly gets a loud banner instead of the
// same shrug-toned wording as everything else, so it doesn't disappear into
// scrollback (audit finding, 2026-07-09).
class AnomalyError extends Error {
  constructor(message) {
    super(message)
    this.anomaly = true
  }
}

function currentBuildId() {
  const OVERRIDE_FLAG = '--build-id='
  const override = process.argv.find((a) => a.startsWith(OVERRIDE_FLAG))
  if (override) {
    const id = override.slice(OVERRIDE_FLAG.length) // not .split('=')[1] -- that truncates ids containing '='
    if (!id) throw new Error(`${OVERRIDE_FLAG} was passed with an empty value`)
    return id
  }

  const path = join(process.cwd(), '.next', 'BUILD_ID')
  if (!existsSync(path)) {
    throw new Error(`.next/BUILD_ID not found at ${path} -- run this after the build/deploy step, not standalone.`)
  }
  const id = readFileSync(path, 'utf8').trim()
  if (!id) {
    throw new Error(`.next/BUILD_ID at ${path} is empty -- refusing to run (an empty keep-id would match no real key, misclassifying the current build's own keys as stale).`)
  }
  return id
}

// Call the locally-installed binary directly (not `npx wrangler`) -- avoids
// npx's own resolution overhead. `shell: true` is required on Windows to
// invoke the .cmd shim at all (Node refuses to exec .cmd/.bat files
// directly as of the CVE-2024-27980 hardening); safe here because every
// arg is an internally-generated constant (namespace id, hardcoded prefix,
// a tmpdir()+Date.now() path) -- never user input -- so shell's
// unescaped-concatenation risk does not apply.
const WRANGLER_BIN = join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler')

function wrangler(args, { timeoutMs } = {}) {
  return execFileSync(WRANGLER_BIN, args, {
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
    windowsHide: true,
    shell: true,
    timeout: timeoutMs, // undefined = no timeout; set explicitly per-call below
  })
}

// Observed live 2026-07-09: `wrangler kv key list` paginates internally over
// ~500+ sequential HTTP calls for this namespace's size, with no per-page
// retry -- a single transient 5xx anywhere in that sequence kills the whole
// command (confirmed via wrangler's debug log: 180 consecutive 200s, one
// transient 500, command still failed). Retrying the whole operation a
// handful of times is safe (read-only for listing; idempotent for delete --
// re-deleting an already-deleted key is a no-op) and cheap relative to how
// often a run of 500+ calls hits at least one blip.
async function withRetry(fn, { attempts = 4, baseDelayMs = 5000, label }) {
  let lastErr
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return fn()
    } catch (err) {
      lastErr = err
      if (attempt < attempts) {
        const delay = baseDelayMs * attempt
        console.warn(`[kv-purge-stale-isr] ${label} failed (attempt ${attempt}/${attempts}): ${String(err.message || err).split('\n')[0]} -- retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  throw lastErr
}

function listIsrKeys() {
  // Real namespace has 500k+ keys; CF's list API pages internally inside
  // wrangler, which can take a couple minutes end-to-end -- not a hang.
  const out = wrangler([
    'kv', 'key', 'list',
    '--namespace-id', NAMESPACE_ID,
    '--remote',
    '--prefix', KEEP_PREFIX,
  ], { timeoutMs: 5 * 60 * 1000 })
  const parsed = JSON.parse(out)
  const names = Array.isArray(parsed) ? parsed.map((k) => k.name) : []

  // Defense in depth: don't just trust wrangler/CF's server-side --prefix
  // filter blindly -- if it ever regressed and returned a key outside
  // isr-cache/ (e.g. a live `pro:` user-data key), that key would otherwise
  // silently flow into the stale/delete path below.
  const outOfPrefix = names.filter((n) => !n.startsWith(KEEP_PREFIX))
  if (outOfPrefix.length) {
    throw new AnomalyError(`listIsrKeys() got ${outOfPrefix.length} key(s) NOT starting with "${KEEP_PREFIX}" (e.g. "${outOfPrefix[0]}") despite the --prefix filter -- refusing to proceed.`)
  }

  return names
}

function bulkDelete(keys) {
  const tmpPath = join(tmpdir(), `kv-purge-stale-isr-${Date.now()}.json`)
  writeFileSync(tmpPath, JSON.stringify(keys))
  try {
    // wrangler batches bulk-delete internally at 1000 keys/HTTP call (not
    // 10,000/5,000 as commonly assumed -- checked against the installed
    // 4.107.0 source). A large backlog is several hundred sequential calls,
    // so give this a generous timeout rather than none at all.
    const out = wrangler([
      'kv', 'bulk', 'delete', tmpPath,
      '--namespace-id', NAMESPACE_ID,
      '--remote',
      '-f',
    ], { timeoutMs: 20 * 60 * 1000 })
    console.log(out)
  } finally {
    unlinkSync(tmpPath)
  }
}

async function main() {
  const execute = process.argv.includes('--execute')
  const keepBuildId = currentBuildId()

  console.log(`[kv-purge-stale-isr] keeping build ${keepBuildId}, listing "${KEEP_PREFIX}" in namespace ${NAMESPACE_ID}...`)
  const allKeys = await withRetry(() => listIsrKeys(), { label: 'listIsrKeys' })

  const stale = []
  const distinctStaleBuilds = new Set()
  let keptCount = 0

  for (const name of allKeys) {
    const buildId = name.slice(KEEP_PREFIX.length).split('/')[0]
    if (buildId === keepBuildId) {
      keptCount++
    } else {
      stale.push(name)
      distinctStaleBuilds.add(buildId)
    }
  }

  console.log(`[kv-purge-stale-isr] scan complete: ${allKeys.length} total isr-cache keys. ${keptCount} on current build, ${stale.length} stale across ${distinctStaleBuilds.size} old build(s).`)
  if (distinctStaleBuilds.size) {
    console.log(`[kv-purge-stale-isr] stale build ids (up to 20): ${[...distinctStaleBuilds].slice(0, 20).join(', ')}`)
  }

  if (!stale.length) {
    console.log('[kv-purge-stale-isr] nothing to do.')
    return
  }

  if (!execute) {
    console.log(`[kv-purge-stale-isr] DRY RUN -- would delete ${stale.length} keys. Re-run with --execute to actually delete.`)
    return
  }

  // Safety valve: if NONE of the listed keys matched the current build id
  // while the namespace clearly isn't empty, something upstream MIGHT be
  // wrong (empty/wrong .next/BUILD_ID, a build-id race with a concurrent
  // deploy) -- refuse to delete rather than risk wiping the live build's
  // own cache. Known false-positive case (audit finding, 2026-07-09): on a
  // very fresh, low-traffic deploy the new build may legitimately have
  // written zero isr-cache keys yet (this pipeline has no cache-seed step
  // ahead of this script) -- that trips this same valve. That's an
  // acceptable false positive: worst case is "skip cleanup this run,
  // retry next deploy," never a wrong deletion.
  if (keptCount === 0 && allKeys.length > 0) {
    throw new AnomalyError(`keptCount is 0 out of ${allKeys.length} keys for keep-build-id "${keepBuildId}" -- refusing to delete. Either the current build's own keys aren't recognized (wrong/stale/empty build id, or a concurrent deploy race) OR this is a very fresh low-traffic deploy that hasn't written any isr-cache keys yet -- verify .next/BUILD_ID matches the live deployed build before assuming the latter.`)
  }

  await withRetry(() => bulkDelete(stale), { label: 'bulkDelete', attempts: 3 })
  console.log(`[kv-purge-stale-isr] done -- deleted ${stale.length} stale isr-cache keys.`)
}

await main().catch((err) => {
  if (err?.anomaly) {
    console.warn('\n\u{1F6A8}\u{1F6A8}\u{1F6A8} [kv-purge-stale-isr] ANOMALY -- cleanup SKIPPED, this is not routine \u{1F6A8}\u{1F6A8}\u{1F6A8}')
    console.warn(`              ${err.message}`)
    console.warn('              Deploy is NOT blocked (exit 0) -- but the isr-cache backlog was NOT cleaned up this run. Investigate before assuming this is benign.\n')
    return
  }
  console.warn(`\n[kv-purge-stale-isr] ${err?.message || String(err)}`)
  console.warn('              Non-fatal -- deploy already succeeded regardless of this cleanup step.\n')
})
