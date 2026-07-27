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
 * Default mode is DRY RUN: discovers/reports what WOULD be deleted, deletes
 * nothing, touches no local state. Pass --execute to actually delete. This
 * is deliberate -- a script that defaults to destructive on a namespace with
 * a live user-data prefix next to it is exactly the kind of thing that
 * shouldn't be one typo away from wiping the wrong keys.
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
 *
 * RESUMABLE / CHUNKED DESIGN (added 2026-07-09, cursor-chunked interleaved
 * loop, per webaudit recommendation after the first real-prod execute run):
 * the original version listed the ENTIRE namespace (500k+ keys, ~500+
 * sequential wrangler-internal HTTP calls) on every single `npm run deploy`
 * invocation just to re-derive a stale-build-id list that's mostly unchanged
 * from the previous run, then tried to bulk-delete the entire backlog in one
 * pass. Both were expensive AND fragile: the first real execute (2026-07-09)
 * hit a transient CF auth error during listing (recovered via retry) and
 * then a real rate limit partway through the giant delete pass, leaving
 * ~203k of ~345k stale keys undeleted with no memory of what had already
 * been cleared.
 *
 * This version instead persists a queue of stale build ids to
 * `.kv-purge-state.json` (gitignored, local to the machine running deploys)
 * and processes it build-by-build:
 *   - The expensive full-namespace scan only runs when there's no persisted
 *     queue (first run, or after a prior queue fully drains) -- "the
 *     re-listing tax."
 *   - Each build's keys are listed + deleted with small, SCOPED calls
 *     (`--prefix isr-cache/<buildId>/` for listing, <=1000-key chunks for
 *     deleting) instead of one namespace-wide operation -- far fewer
 *     wrangler-internal HTTP calls per unit of work, and a rate-limit hit
 *     mid-run only costs progress on the ONE chunk in flight, never the
 *     whole backlog -- "the rate-limit fragility."
 *   - State is persisted after every completed (or failed, or deferred)
 *     build, not just at the end, so an interruption at any point leaves a
 *     resumable, self-consistent queue for the next `npm run deploy`.
 *   - A run stops early (deferring the rest of the queue) once ANY of three
 *     independent budgets trips -- build count, actual wrangler-call count
 *     (checked before every real call, including mid-build), wall clock --
 *     so no single deploy's cleanup step can run away.
 *
 * HARDENED 2026-07-09 (4-lens adversarial review before first use, mirroring
 * the review that caught the empty-BUILD_ID bug in the original version):
 *   - The freshly-discovered queue is persisted BEFORE the per-build loop
 *     starts, not just after each iteration -- an interruption processing
 *     the very first build no longer silently discards an entire full scan.
 *   - withRetry() no longer retries an AnomalyError -- the one safety signal
 *     that could catch a live-user-data leak (assertAllPrefixed) used to be
 *     indistinguishable from routine transient noise and could be silently
 *     washed away by a lucky retry.
 *   - Non-array wrangler JSON output now throws an AnomalyError instead of
 *     silently degrading to "found zero keys" (which would have marked
 *     builds as cleaned-up without ever deleting them).
 *   - The per-run budget is now a single wrangler-CALL count, checked before
 *     every real call (not just between builds) and incremented on every
 *     ATTEMPT (not just successes) -- a run dominated by an oversized build
 *     or a failure storm is now actually bounded, not just nominally.
 *   - bulkDelete is now chunked at <=1000 keys per call (matches wrangler's
 *     own internal batch size) so a single oversized build can't blow past
 *     the call budget in one shot; a mid-build budget trip defers the WHOLE
 *     build (deletion is idempotent, so partial progress is never lost, just
 *     re-discovered as "fewer keys" next time).
 *   - The state file now also tracks the previous run's current build id, so
 *     the build that JUST got superseded is queued immediately instead of
 *     waiting for the whole existing backlog to drain before a fresh scan
 *     would ever notice it.
 *   - `--build-id=` override can no longer be combined with `--execute` --
 *     it exists for dry-run inspection/testing only; production deletion
 *     always derives the current build id from .next/BUILD_ID.
 *   - Every build id is validated against an allowlist pattern before it can
 *     reach a shell:true'd wrangler invocation, since build ids are read
 *     back from live KV key content (external data this script doesn't
 *     itself write), not generated by this script.
 *   - State-file writes are now atomic (temp file + rename) so a hard kill
 *     mid-write can never leave a torn/corrupt state file.
 * Deliberately NOT added yet (real but lower-priority, noted for a
 * fast-follow rather than blocking this hardening pass): a lock file for
 * genuinely concurrent invocations (mitigated by idempotent deletes + atomic
 * writes), and escalation after many consecutive fully-failed runs (would
 * need an alerting channel this script doesn't have -- for now, repeated
 * failure is still visible as repeated console.warn output in deploy logs).
 *
 * WARM-THEN-RETRY (added 2026-07-25, webaudit ruling after a real incident):
 * the keptCount===0 safety valve below used to just throw and skip cleanup,
 * on the theory that it was a rare "very fresh low-traffic deploy" edge
 * case. Live incident on the cb1ee06 deploy showed that's actually the
 * ROUTINE starting state, not an edge case: with ~22,700 distinct
 * figure-detail paths each getting very few individual visits, essentially
 * nothing has been requested on a brand-new build yet, so keptCount==0 right
 * after every deploy. Worse, Next's ISR stale-while-revalidate behavior
 * means a path with NO current-build entry keeps serving the PRIOR build's
 * cached HTML indefinitely until either something requests that exact path
 * (triggering a background re-render) or this script deletes the old
 * build's keys outright (forcing a true cache miss on next request) -- so a
 * skipped purge doesn't just cost KV storage, it can leave whole route
 * groups silently serving stale pre-deploy content. Confirmed live: a green
 * `cb1ee06` deploy still served `b304ac3` HTML on figure-detail pages until
 * this was caught by checking <meta fp-build> per route group (not just
 * healthz + homepage) and the purge was re-run by hand after the site had
 * taken some real traffic.
 * Fix: instead of throwing immediately, actively fetch one representative
 * URL per major route group against the LIVE site (see WARM_PATHS below),
 * forcing a real render on the new build, then re-scan once. Only throw the
 * anomaly if keptCount is STILL 0 after an active warm attempt -- at that
 * point "hasn't been visited yet" is no longer a credible explanation and
 * something is actually wrong (wrong build id, the warm requests didn't
 * reach the site, a genuine race). This only fires in --execute mode --
 * dry-run stays side-effect-free by design, so a dry run can still hit the
 * immediate-throw path and that's expected, not a regression.
 */

import { readFileSync, existsSync, writeFileSync, unlinkSync, renameSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir, homedir } from 'node:os'

const NAMESPACE_ID = 'e1858bb16a4f41f5b81afe8cf53519f5' // FP_KV, shared PRO_KV/NEXT_INC_CACHE_KV
const KEEP_PREFIX = 'isr-cache/'
const MAX_BUFFER = 500 * 1024 * 1024 // 500MB -- namespace has ~500k+ keys

// Local, gitignored, machine-specific -- deliberately NOT committed. Holds
// only build-id strings (no secrets, no key contents); safe to delete by
// hand at any time -- worst case is one extra full rescan on the next run,
// never a wrong deletion (the queue only ever narrows what gets touched, it
// never widens it beyond what a fresh scan would find anyway).
const STATE_FILE = join(process.cwd(), '.kv-purge-state.json')

// Real OpenNext/Next.js build ids are alphanumeric + '-'/'_' only. Build ids
// this script processes are read back from live KV key content, not
// generated by this script -- validate before any of them reach a
// shell:true'd wrangler invocation.
const BUILD_ID_PATTERN = /^[A-Za-z0-9_-]+$/

// Chunk size for bulk-delete calls -- matches wrangler's own internal
// per-HTTP-call batch size (checked against the installed 4.107.0 source),
// so handing it a <=1000-key file means exactly one real HTTP call, which
// is what makes the call-count budget below an accurate proxy for actual
// API call volume instead of a rough guess.
const DELETE_CHUNK_SIZE = 1000

// Per-run budgets -- whichever trips first stops new work (the rest of the
// queue, or the rest of the current build, is deferred, never lost).
// WRANGLER_CALLS_BUDGET_PER_RUN is the PRIMARY cap: it's checked before
// every real wrangler invocation (list calls AND each delete chunk, not
// just once per build) and incremented on every ATTEMPT, not just
// successes -- so it correctly bounds a run dominated by one oversized
// build or by a run of transient failures, not just a "normal" run.
// MAX_BUILDS_PER_RUN is a secondary, simpler guard kept alongside it.
// WALL_CLOCK_BUDGET_MS is a tertiary, best-effort safety net -- execFileSync
// is fully synchronous, so this can only be checked BETWEEN wrangler calls,
// never preempt one already in flight; a single call's own timeout (below)
// is the real ceiling on how long any one call can block.
// Deliberately conservative -- the goal is to stay well under whatever
// call-volume range trips CF's undocumented KV rate limit (observed
// 2026-07-09: a run of several hundred sequential wrangler-internal calls
// hit it), not to maximize throughput of any single `npm run deploy`
// invocation. With ~140 stale builds typically queued, draining the full
// backlog takes several runs -- acceptable, this is explicitly non-urgent
// cleanup (Phase 3 risk register).
const WRANGLER_CALLS_BUDGET_PER_RUN = 60
const MAX_BUILDS_PER_RUN = 15
const WALL_CLOCK_BUDGET_MS = 3 * 60 * 1000

// Warm-then-retry target set (see file header, 2026-07-25). One representative
// path per route group from the post-deploy verification protocol (homepage,
// genre hub, line hub, figure detail, /today, guides) -- not exhaustive, just
// enough to prove the new build CAN write ISR-KV entries across the major
// route shapes, not only the homepage. Fixed to real, long-lived catalog
// entries (Cohort A-1's line/figure; a stable evergreen guide slug) rather
// than looked up dynamically -- this script deliberately has no KB
// dependency, and a warm target only needs to exist, not be representative
// of catalog content.
const WARM_BASE_URL = 'https://figurepinner.com'
const WARM_PATHS = [
  '/',
  '/wrestling',
  '/wrestling/deluxe-aggression',
  '/wrestling/deluxe-aggression/rob-conway',
  '/today',
  '/guides/most-valuable-star-wars-black-series',
]
// figurepinner.com's Bot Fight Mode 403s (and silently lies to) plain
// non-browser HTTP clients -- verified recipe (post-deploy-smoke-probe.mjs,
// check-kb-d1-canary-live.mjs) is a real desktop-Chrome User-Agent, curl.exe
// on Windows. Duplicated here rather than shared to avoid coupling this
// script's only job (KV cleanup) to another script's module surface.
const WARM_BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const WARM_KV_CONSISTENCY_DELAY_MS = 5000

// ── Self-purge of warmed URLs (webaudit ruling, 2026-07-26) ──
// The warm fetches above go through the Cloudflare edge, so their RESPONSES
// get cached there. When this script ran after purge-cache in the deploy
// chain, that re-cached whatever the origin served mid-deploy — stale content,
// AFTER the purge, with nothing purging again. Live incident 2026-07-26:
// rob-conway (WARM_PATHS[203]'s successor) served the previous build with
// cf-cache-status: HIT on the exact deploy meant to prove the Social Bar gone.
// The chain is now reordered (purge-cache runs after this script), but this
// targeted purge is NOT redundant belt-and-braces: this script ALSO runs
// STANDALONE (nightly auto-retry), where no purge-cache follows it in any
// order. Without this, the nightly path can silently re-poison the edge.
//
// Token/zone loading duplicated from purge-cache.mjs rather than imported —
// same reasoning as WARM_BROWSER_UA above: this script's only job is KV
// cleanup, and coupling it to another script's module surface is worse than
// 15 duplicated lines. Purge-by-URL is exact-match, available on all CF plans.
const CF_ZONE_ID_FALLBACK = '66a98bfaa6a2992c9ed3c32f9f3c1702'

function loadPurgeCreds() {
  const out = {}
  try {
    const txt = readFileSync(join(homedir(), '.figurepinner-secrets.env'), 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* optional — env vars alone are enough */ }
  return {
    token: process.env.CF_PURGE_TOKEN || out.CF_PURGE_TOKEN,
    zoneId: process.env.CF_ZONE_ID || out.CF_ZONE_ID || CF_ZONE_ID_FALLBACK,
  }
}

/**
 * Purge exactly the URLs the warm pass just fetched, so the edge never keeps
 * what warming cached. Warn-and-continue on any failure — this script must
 * never fail `npm run deploy` (see AnomalyError note below), and a missed
 * targeted purge is recoverable (deploy chain: purge-cache still runs after;
 * standalone: next deploy's purge_everything clears it).
 */
async function purgeWarmedUrls() {
  const { token, zoneId } = loadPurgeCreds()
  if (!token) {
    console.warn('[kv-purge-stale-isr] CF_PURGE_TOKEN not found -- skipping the warmed-URL purge. In the deploy chain purge-cache covers this; on a STANDALONE run the 6 warmed URLs may serve the pre-warm edge copy until the next purge.')
    return
  }
  const files = WARM_PATHS.map((p) => `${WARM_BASE_URL}${p}`)
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files }),
    })
    const body = await res.json().catch(() => null)
    if (res.ok && body?.success) {
      console.log(`[kv-purge-stale-isr] purged the ${files.length} warmed URL(s) from the edge -- warming can no longer re-poison the cache.`)
    } else {
      console.warn(`[kv-purge-stale-isr] warmed-URL purge returned HTTP ${res.status}${body?.errors?.length ? ' -- ' + JSON.stringify(body.errors) : ''} (non-fatal, see note above).`)
    }
  } catch (err) {
    console.warn(`[kv-purge-stale-isr] warmed-URL purge failed to send (non-fatal): ${String(err?.message || err).split('\n')[0]}`)
  }
}

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

// ── Persisted queue state ────────────────────────────────────────────────

// pendingBuildIds: null means "no queue -- do a fresh full scan"; an array
// (possibly empty) means "resume this exact queue, don't rescan." A missing
// or corrupt/unreadable state file is treated the same as null -- the safe
// fallback in both directions is "do the expensive full scan," never
// "assume an empty queue and silently do nothing." lastKeptBuildId records
// which build id was "current" as of the last save, so a newly-superseded
// build can be queued immediately instead of waiting for a full rescan.
function loadState() {
  if (!existsSync(STATE_FILE)) return { pendingBuildIds: null, lastKeptBuildId: null, lastRun: null }
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
    const pendingBuildIds =
      parsed.pendingBuildIds === null || Array.isArray(parsed.pendingBuildIds)
        ? parsed.pendingBuildIds
        : null
    const lastKeptBuildId = typeof parsed.lastKeptBuildId === 'string' ? parsed.lastKeptBuildId : null
    // lastRun (2026-07-11, webaudit observability endorsement): pure pass-through --
    // this script never reads its own lastRun back, it's written for an external
    // reader (webhealth) to detect a stale/silently-skipped purge step.
    const lastRun = parsed.lastRun && typeof parsed.lastRun === 'object' ? parsed.lastRun : null
    return { pendingBuildIds, lastKeptBuildId, lastRun }
  } catch {
    return { pendingBuildIds: null, lastKeptBuildId: null, lastRun: null }
  }
}

// Atomic write (temp file + rename) -- a hard kill (SIGKILL, terminal
// closed, laptop sleep) mid-write can never leave a torn/corrupt state
// file this way; the rename is a single filesystem operation.
//
// Windows-only wrinkle (hit live 2026-07-10): renameSync onto an existing
// destination can throw EPERM if something else (antivirus, an indexer)
// has the destination handle open for a moment -- purely transient, clears
// in well under a second. Retries via the existing withRetry() helper with
// a short local-filesystem delay (its 5000ms default is tuned for network
// calls like wrangler, not a local rename); a repeated/persistent failure
// still surfaces as the same non-fatal top-level warning as before.
async function saveState(state) {
  const tmpPath = `${STATE_FILE}.tmp-${process.pid}`
  writeFileSync(tmpPath, JSON.stringify(state, null, 2))
  await withRetry(() => renameSync(tmpPath, STATE_FILE), { attempts: 3, baseDelayMs: 50, label: 'state-file rename' })
}

// Call the locally-installed binary directly (not `npx wrangler`) -- avoids
// npx's own resolution overhead. `shell: true` is required on Windows to
// invoke the .cmd shim at all (Node refuses to exec .cmd/.bat files
// directly as of the CVE-2024-27980 hardening); every arg passed through it
// is either an internally-generated constant (namespace id, hardcoded
// prefix, a tmpdir()+Date.now() path) or a build id that's been validated
// against BUILD_ID_PATTERN first (see validateBuildId) -- never raw,
// unchecked external input.
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

function validateBuildId(id) {
  if (!BUILD_ID_PATTERN.test(id)) {
    throw new AnomalyError(`Build id "${id}" doesn't match the expected shape (${BUILD_ID_PATTERN}) -- refusing to use untrusted KV key content in a shell command.`)
  }
}

// Observed live 2026-07-09: `wrangler kv key list` paginates internally over
// many sequential HTTP calls for a large result set, with no per-page
// retry -- a single transient failure anywhere in that sequence (a 5xx, or
// the CF auth-error code 10000 seen live) kills the whole command. Retrying
// the whole operation a handful of times is safe (read-only for listing;
// idempotent for delete -- re-deleting an already-deleted key is a no-op)
// and cheap relative to how often a multi-call sequence hits at least one
// blip. An AnomalyError is different in kind from a routine transient
// failure -- it means a SAFETY check tripped (e.g. a key outside the
// expected prefix), and retrying it risks silently washing away the one
// signal that would have caught a real problem if a later attempt happens
// not to reproduce it. So it's rethrown immediately, never retried.
async function withRetry(fn, { attempts = 4, baseDelayMs = 5000, label, onAttempt } = {}) {
  let lastErr
  for (let attempt = 1; attempt <= attempts; attempt++) {
    onAttempt?.()
    try {
      return fn()
    } catch (err) {
      if (err?.anomaly) throw err
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

// Defense in depth shared by both the full-scan and per-build scoped list
// calls: don't just trust wrangler/CF's server-side --prefix filter
// blindly -- if it ever regressed and returned a key outside the given
// prefix (e.g. a live `pro:` user-data key leaking into an isr-cache/
// listing), that key would otherwise silently flow into the delete path.
function assertAllPrefixed(names, prefix, context) {
  const outOfPrefix = names.filter((n) => !n.startsWith(prefix))
  if (outOfPrefix.length) {
    throw new AnomalyError(`${context} got ${outOfPrefix.length} key(s) NOT starting with "${prefix}" (e.g. "${outOfPrefix[0]}") despite the --prefix filter -- refusing to proceed.`)
  }
}

// Any valid-but-non-array JSON response is a signal something about
// wrangler's output shape changed (e.g. a future version wrapping results
// in {result:[...]}) -- treating it as "found zero keys" would silently
// mark builds as cleaned-up without ever deleting anything, so this raises
// an anomaly instead of degrading quietly.
function parseKeyNames(out, context) {
  const parsed = JSON.parse(out)
  if (!Array.isArray(parsed)) {
    throw new AnomalyError(`${context} got non-array JSON from wrangler (typeof ${typeof parsed}) -- refusing to treat this as "zero keys".`)
  }
  return parsed.map((k) => k.name)
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
  const names = parseKeyNames(out, 'listIsrKeys()')
  assertAllPrefixed(names, KEEP_PREFIX, 'listIsrKeys()')
  return names
}

// Scoped to a single build id -- the small, cheap call the resumable loop
// makes per queue item instead of re-listing the whole namespace.
function listBuildKeys(buildId) {
  const buildPrefix = `${KEEP_PREFIX}${buildId}/`
  const out = wrangler([
    'kv', 'key', 'list',
    '--namespace-id', NAMESPACE_ID,
    '--remote',
    '--prefix', buildPrefix,
  ], { timeoutMs: 2 * 60 * 1000 })
  const names = parseKeyNames(out, `listBuildKeys(${buildId})`)
  assertAllPrefixed(names, buildPrefix, `listBuildKeys(${buildId})`)
  return names
}

// keys.length is always <= DELETE_CHUNK_SIZE (1000) here -- callers chunk
// before calling this, so this is exactly one wrangler-internal HTTP call.
function bulkDelete(keys) {
  const tmpPath = join(tmpdir(), `kv-purge-stale-isr-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
  writeFileSync(tmpPath, JSON.stringify(keys))
  try {
    const out = wrangler([
      'kv', 'bulk', 'delete', tmpPath,
      '--namespace-id', NAMESPACE_ID,
      '--remote',
      '-f',
    ], { timeoutMs: 90 * 1000 })
    console.log(out)
  } finally {
    unlinkSync(tmpPath)
  }
}

// Full namespace scan -- only run when there's no persisted queue to resume.
// Returns the stale build-id list (current build's own id excluded) plus
// enough context for the safety valve below.
function discoverStaleBuilds(keepBuildId) {
  const allKeys = listIsrKeys()
  const buildIds = new Set()
  let keptCount = 0
  for (const name of allKeys) {
    const buildId = name.slice(KEEP_PREFIX.length).split('/')[0]
    if (buildId === keepBuildId) keptCount++
    else buildIds.add(buildId)
  }
  return { totalKeys: allKeys.length, keptCount, buildIds: [...buildIds] }
}

// Best-effort: fetch each WARM_PATHS entry against the live site to force a
// real render (and therefore an ISR-KV write) under the current build.
// Never throws -- a single warm request failing (timeout, transient 5xx,
// Bot Fight hiccup) doesn't invalidate the attempt; the caller's re-scan is
// the actual check, not this function's return value.
async function warmCurrentBuild() {
  console.log(`[kv-purge-stale-isr] keptCount is 0 -- warming ${WARM_PATHS.length} representative path(s) on ${WARM_BASE_URL} before treating this as an anomaly...`)
  for (const path of WARM_PATHS) {
    const url = `${WARM_BASE_URL}${path}`
    try {
      if (process.platform === 'win32') {
        execFileSync('curl.exe', [
          '-sS', '-o', 'NUL', '-w', '%{http_code}',
          '-H', `User-Agent: ${WARM_BROWSER_UA}`,
          url,
        ], { encoding: 'utf8', windowsHide: true, timeout: 15000 })
      } else {
        await fetch(url, { headers: { 'user-agent': WARM_BROWSER_UA } })
      }
    } catch (err) {
      console.warn(`[kv-purge-stale-isr] warm request to ${path} failed (non-fatal): ${String(err.message || err).split('\n')[0]}`)
    }
  }
  // The warm fetches just seeded the edge with whatever the origin served —
  // purge those exact URLs immediately so the cache can't keep a mid-deploy
  // stale copy (the 2026-07-26 re-poisoning defect).
  await purgeWarmedUrls()
  // KV is eventually consistent -- give the writes a moment to become
  // visible to a subsequent list call before re-scanning.
  await new Promise((resolve) => setTimeout(resolve, WARM_KV_CONSISTENCY_DELAY_MS))
}

async function main() {
  const execute = process.argv.includes('--execute')
  const buildIdOverridePassed = process.argv.some((a) => a.startsWith('--build-id='))
  if (execute && buildIdOverridePassed) {
    // --build-id exists purely for dry-run inspection/testing against a
    // specific real build id. Combined with --execute it becomes a way to
    // (mis)classify the ACTUAL live build's own cache as "stale" -- the
    // zero-match safety valve below only catches an override that matches
    // NOTHING, not one that coincidentally still has live keys from before
    // it was superseded. Production always derives the current build id
    // from .next/BUILD_ID; there's no legitimate reason to combine an
    // explicit override with real deletion.
    throw new Error('--build-id override cannot be combined with --execute -- override is for dry-run inspection only. Production execute always uses the real .next/BUILD_ID.')
  }

  const keepBuildId = currentBuildId()
  const state = loadState()

  let pending = state.pendingBuildIds

  if (pending === null) {
    console.log(`[kv-purge-stale-isr] no persisted queue -- running a full namespace scan (keeping build ${keepBuildId})...`)
    let { totalKeys, keptCount, buildIds } = await withRetry(
      () => discoverStaleBuilds(keepBuildId),
      { label: 'full scan (discoverStaleBuilds)' }
    )

    // Safety valve: if NONE of the listed keys matched the current build id
    // while the namespace clearly isn't empty, something upstream MIGHT be
    // wrong (empty/wrong .next/BUILD_ID, a build-id race with a concurrent
    // deploy) -- refuse to queue anything for deletion rather than risk
    // eventually wiping the live build's own cache. This is also the
    // ROUTINE state right after every deploy (see file header, 2026-07-25)
    // -- with this site's per-path traffic pattern, essentially nothing has
    // been requested on a brand-new build yet. In --execute mode, warm a
    // handful of representative paths and re-scan once before deciding this
    // is a real anomaly; a dry run stays side-effect-free and hits the
    // immediate throw, same as before.
    if (keptCount === 0 && totalKeys > 0) {
      if (execute) {
        await warmCurrentBuild()
        ;({ totalKeys, keptCount, buildIds } = await withRetry(
          () => discoverStaleBuilds(keepBuildId),
          { label: 'post-warm rescan (discoverStaleBuilds)' }
        ))
      }
      if (keptCount === 0) {
        const afterWarm = execute ? ` after warming ${WARM_PATHS.length} representative path(s)` : ''
        throw new AnomalyError(`keptCount is 0 out of ${totalKeys} keys for keep-build-id "${keepBuildId}"${afterWarm} -- refusing to queue anything for deletion. Either the current build's own keys aren't recognized (wrong/stale/empty build id, a concurrent deploy race, or ${WARM_BASE_URL} isn't actually serving this deploy) OR this is a dry run / a deploy that legitimately hasn't taken any traffic yet -- verify .next/BUILD_ID matches the live deployed build before assuming the latter.`)
      }
      if (execute) console.log(`[kv-purge-stale-isr] warm-then-retry succeeded: ${keptCount} key(s) now on the current build after warming.`)
    }

    console.log(`[kv-purge-stale-isr] full scan: ${totalKeys} total keys, ${keptCount} on current build, ${buildIds.length} stale build(s) discovered.`)
    if (buildIds.length) {
      console.log(`[kv-purge-stale-isr] stale build ids (up to 20): ${buildIds.slice(0, 20).join(', ')}`)
    }
    pending = buildIds

    // Persist the fresh scan's result BEFORE entering the per-build loop --
    // an interruption (including a genuine AnomalyError) on the very first
    // build processed used to discard this entire scan silently, forcing
    // every subsequent run to redo it from scratch.
    if (execute) await saveState({ pendingBuildIds: pending, lastKeptBuildId: keepBuildId })
  } else {
    console.log(`[kv-purge-stale-isr] resuming persisted queue from a prior run: ${pending.length} stale build(s) remaining.`)
  }

  // The build that was "current" as of the last save is now definitely
  // stale if a different build is current today -- queue it immediately
  // instead of waiting for the existing backlog to fully drain before a
  // fresh scan would ever notice it (a real gap under a frequent-deploy
  // cadence: draining ~140 builds at 15/run takes ~10 deploys).
  if (state.lastKeptBuildId && state.lastKeptBuildId !== keepBuildId && !pending.includes(state.lastKeptBuildId)) {
    console.log(`[kv-purge-stale-isr] previous run's current build (${state.lastKeptBuildId}) is now superseded -- adding it to the queue.`)
    pending = [...pending, state.lastKeptBuildId]
  }

  if (!pending.length) {
    console.log('[kv-purge-stale-isr] nothing to do.')
    if (execute) await saveState({ pendingBuildIds: null, lastKeptBuildId: keepBuildId, lastRun: { at: new Date().toISOString(), status: 'ok', deleted: 0, calls: 0, queueDepth: 0 } })
    return
  }

  if (!execute) {
    console.log(`[kv-purge-stale-isr] DRY RUN -- ${pending.length} stale build(s) queued, nothing deleted, no local state written. Re-run with --execute to process.`)
    return
  }

  // Defense in depth: never process the keep-build-id even if it somehow
  // ended up in a persisted queue from an earlier run against a DIFFERENT
  // deploy (e.g. a revert that redeployed a previously-current build id).
  pending = pending.filter((id) => id !== keepBuildId)

  // Validate every queued id up front, before any of them can reach a
  // shell:true'd wrangler invocation -- build ids are read back from live
  // KV key content, not generated by this script.
  for (const id of pending) validateBuildId(id)

  const startedAt = Date.now()
  let deletedThisRun = 0
  let processedBuilds = 0
  let callsThisRun = 0
  let budgetExhausted = false
  const nextQueue = []

  const budgetOk = () =>
    processedBuilds < MAX_BUILDS_PER_RUN &&
    callsThisRun < WRANGLER_CALLS_BUDGET_PER_RUN &&
    Date.now() - startedAt < WALL_CLOCK_BUDGET_MS

  const countCall = () => { callsThisRun++ }

  for (let i = 0; i < pending.length; i++) {
    const buildId = pending[i]

    if (!budgetExhausted && !budgetOk()) {
      budgetExhausted = true
      console.log(`[kv-purge-stale-isr] per-run budget reached (${processedBuilds} builds processed, ${callsThisRun} wrangler calls, ${deletedThisRun} keys deleted, ${((Date.now() - startedAt) / 1000).toFixed(0)}s elapsed) -- deferring remaining ${pending.length - i} build(s) to the next run.`)
    }

    let buildCompleted = false

    if (!budgetExhausted) {
      try {
        const keys = await withRetry(
          () => listBuildKeys(buildId),
          { label: `list build ${buildId}`, attempts: 3, onAttempt: countCall }
        )
        buildCompleted = true
        if (keys.length) {
          for (let c = 0; c < keys.length; c += DELETE_CHUNK_SIZE) {
            if (!budgetOk()) {
              budgetExhausted = true
              buildCompleted = false
              console.log(`[kv-purge-stale-isr] per-run budget reached mid-build (${buildId}) -- deferring the rest of this build and the remaining ${pending.length - i - 1} build(s) to the next run.`)
              break
            }
            const chunk = keys.slice(c, c + DELETE_CHUNK_SIZE)
            await withRetry(
              () => bulkDelete(chunk),
              { label: `delete build ${buildId} chunk ${Math.floor(c / DELETE_CHUNK_SIZE) + 1} (${chunk.length} keys)`, attempts: 3, onAttempt: countCall }
            )
            deletedThisRun += chunk.length
          }
        }
      } catch (err) {
        // A safety-relevant anomaly (e.g. an out-of-prefix key, an invalid
        // build id, malformed wrangler output) is not a routine per-build
        // hiccup -- don't silently skip it and move on, surface it loudly
        // via the top-level handler and stop the whole run. Everything
        // processed in EARLIER iterations of this loop is already safely
        // persisted below, so nothing already-done is lost.
        if (err?.anomaly) throw err
        console.warn(`[kv-purge-stale-isr] build ${buildId} failed after retries: ${String(err.message || err).split('\n')[0]} -- leaving it queued, moving to the next build.`)
      }
    }

    if (buildCompleted) {
      processedBuilds++
    } else {
      nextQueue.push(buildId)
    }

    // Persist after EVERY iteration (success, failure, or budget-defer) --
    // this is the actual resumability guarantee: an interruption on the
    // NEXT build only ever loses progress on that one build in flight;
    // every prior outcome this run (and everything from before this run)
    // is already saved.
    await saveState({ pendingBuildIds: [...nextQueue, ...pending.slice(i + 1)], lastKeptBuildId: keepBuildId })
  }

  console.log(`[kv-purge-stale-isr] this run: processed ${processedBuilds} build(s), ${callsThisRun} wrangler calls, deleted ${deletedThisRun} keys. ${nextQueue.length} build(s) still queued.`)
  if (!nextQueue.length) console.log('[kv-purge-stale-isr] queue fully drained -- next run will do a fresh full scan for any newly-accumulated stale builds.')
  // lastRun persists here regardless of drain state -- an external reader (webhealth)
  // needs every run's outcome, not just the terminal "fully drained" one.
  await saveState({
    pendingBuildIds: nextQueue.length ? nextQueue : null,
    lastKeptBuildId: keepBuildId,
    lastRun: { at: new Date().toISOString(), status: 'ok', deleted: deletedThisRun, calls: callsThisRun, queueDepth: nextQueue.length },
  })
}

await main().catch(async (err) => {
  // Persist the failure too (webaudit 2026-07-11 observability endorsement) -- this
  // handler used to be console.warn-only, whose only surface was transient deploy-log
  // output nobody reads passively -- the exact failure shape that let the original
  // ~523k-key backlog go unnoticed. Wrapped in its own .catch so a state-file hiccup
  // here can never turn this already-non-fatal path into a real failure.
  if (process.argv.includes('--execute')) {
    const prior = loadState()
    await saveState({
      pendingBuildIds: prior.pendingBuildIds,
      lastKeptBuildId: prior.lastKeptBuildId,
      lastRun: {
        at: new Date().toISOString(),
        status: err?.anomaly ? 'anomaly' : 'failed',
        deleted: 0,
        calls: 0,
        queueDepth: prior.pendingBuildIds?.length ?? 0,
      },
    }).catch(() => {})
  }
  if (err?.anomaly) {
    console.warn('\n\u{1F6A8}\u{1F6A8}\u{1F6A8} [kv-purge-stale-isr] ANOMALY -- cleanup SKIPPED/PAUSED, this is not routine \u{1F6A8}\u{1F6A8}\u{1F6A8}')
    console.warn(`              ${err.message}`)
    console.warn('              Deploy is NOT blocked (exit 0) -- but this run did not clean up isr-cache keys. Investigate before assuming this is benign.\n')
    return
  }
  console.warn(`\n[kv-purge-stale-isr] ${err?.message || String(err)}`)
  console.warn('              Non-fatal -- deploy already succeeded regardless of this cleanup step.\n')
})
