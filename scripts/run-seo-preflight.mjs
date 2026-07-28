#!/usr/bin/env node
/**
 * run-seo-preflight.mjs — build+serve+run+teardown wrapper for the G1 SEO
 * guardrail (scripts/seo-preflight.mjs), plus the ISR declaration audit.
 *
 * WHY THIS FILE EXISTS: seo-preflight.mjs's own header comment says it needs
 * a locally-running server at --base to test against, but flags that nothing
 * in the deploy chain starts one -- an explicitly unresolved design question
 * left for whoever wires it in. This script is that missing piece: it builds
 * a fresh server, serves it, runs the guardrail against it, and tears it
 * down again, all as one deploy-chain step.
 *
 * ── ALSO RUNS isr-declaration-audit.mjs (added 2026-07-27) ──────────────────
 * Straight off the `next build` output, before the server even spawns: it
 * sweeps every `src/app/**\/page.tsx` for `export const revalidate` on a
 * dynamic path segment that ISN'T registered in the prerender-manifest --
 * the bug class that left /[genre] and /[genre]/[line] serving uncached SSR
 * for ~6 weeks with no test, type error, or lint catching it. See that
 * script's own header for the full mechanism. A FAIL here exits 1 (a real
 * finding, same STOP semantics as G1) before the more expensive build+serve
 * steps below even start.
 *
 * ── WHY PLAIN `next build` / `next start`, NOT `@opennextjs/cloudflare build` ──
 * The deploy chain's own Workers build (`npx @opennextjs/cloudflare build`)
 * needs D1/KV bindings that are not available locally without extra dev
 * setup (initOpenNextCloudflareForDev()) -- a documented pre-existing gap:
 * src/data/kbDb.ts's getKbDb() -> getCloudflareContext() throws under bare
 * `next dev`/`next start`, which is why the D1-backed API routes (e.g.
 * /api/v1/figure/[figure_id]) 500 locally. This repo's own precedent
 * (predeploy-clean-check.mjs, post-deploy-smoke-probe.mjs) already treats a
 * plain next server as the right thing to smoke-test against, not the
 * Workers build.
 *
 * VERIFIED (read, not assumed) before writing this script: every page/route
 * seo-preflight.mjs actually touches goes through src/data/kb.ts, which is a
 * PURE, synchronous reader of the bundled src/data/figures-reference-v2.slim.js
 * array (a plain `require()`, no D1/KV, no getCloudflareContext() call
 * anywhere in its module or import graph):
 *   - src/app/sitemap.ts            (sitemap children, checks 1 & 2)  -> kb.ts
 *   - src/app/robots.ts             (prod sitemap-id census, check 2) -> kb.ts
 *   - src/app/figure/[figure_id]/page.tsx (served figure pages, check 1) -> kb.ts
 *   - src/app/[genre]/page.tsx                    (genre hub)        -> kb.ts (via genreFigures.ts)
 *   - src/app/[genre]/[line]/page.tsx             (line hub)         -> kb.ts (via genreFigures.ts)
 *   - src/app/[genre]/character/[character_slug]/page.tsx (char hub) -> kb.ts (via genreFigures.ts)
 * None of these import src/data/kbDb.ts (the D1-backed sibling module) or
 * call getCloudflareContext() directly. So a plain `next start` genuinely
 * serves correct data for every check this guardrail runs -- the D1/KV gap
 * does not change this design.
 *
 * The ONE place in this script's own request path that touches Cloudflare
 * context at all is /api/healthz (src/app/api/healthz/route.ts), used below
 * only as a "the server is up and answering HTTP" liveness probe. It wraps
 * its own getCloudflareContext() call in try/catch and degrades to a plain
 * 503 JSON body rather than crashing the process or the request -- so it is
 * safe to poll locally. This script deliberately treats ANY HTTP response
 * (including a 503) as "ready", NOT a specific ok:true payload, because
 * ok:true requires a live D1 binding that will never be present under a bare
 * `next start` and waiting for it would hang until the timeout every time.
 *
 * ── WHY A DEDICATED, NON-3000 PORT ──────────────────────────────────────────
 * A stray `next dev` server from an unrelated session was found listening on
 * port 3000 earlier the same day this script was written. Testing against
 * whatever happens to already be on 3000 instead of a fresh build of the
 * code about to ship would be a silent false-pass -- exactly the failure
 * mode G1 exists to prevent (a build could look clean against a stale server
 * while the actual candidate build has a real regression). So this script
 * picks a fixed, unusual port far from Next's common defaults (3000, 3001,
 * 3002, 4000, 8080, ...) and ACTIVELY VERIFIES it is free (a TCP connect
 * probe that should fail) before ever spawning `next start` on it -- if
 * something is already listening there, this script refuses loudly instead
 * of silently reusing it. Override with SEO_PREFLIGHT_PORT if 4791 ever
 * genuinely collides on a given machine.
 *
 * ── WHY THE CLEANUP IS LAYERED (finally + explicit calls + 'exit' handler) ──
 * `next start` is a long-running server process. If this script exits without
 * killing it -- because the build failed, the preflight script threw, or a
 * human hit Ctrl+C mid-run -- an orphaned Next server is left listening on
 * 4791 forever, silently answering requests with an increasingly stale build
 * on every future run (the exact false-pass risk this whole design is meant
 * to avoid, just self-inflicted instead of inherited from a stray session).
 * Four layers, added in this order because the first version of this file
 * shipped with only the first two and that combination has a real gap:
 *   1. A `finally` block around the readiness/preflight steps -- but
 *      `process.exit()` called from INSIDE the enclosing try does NOT run a
 *      pending finally (Node terminates immediately); this was originally
 *      undocumented and caused a real, confirmed bug (see git history).
 *   2. Explicit `killServer()` calls immediately before each such
 *      `process.exit()`, to cover exactly the gap in (1).
 *   3. `process.on('exit', ...)` as a deterministic backstop for (2): it
 *      fires on EVERY process.exit() call and on normal/thrown completion,
 *      so a FUTURE early-exit that forgets its own explicit killServer()
 *      call (the same mistake (1) already made once) still gets cleaned up.
 *   4. `SIGINT`/`SIGTERM` handlers for a human interrupt (Ctrl+C, an
 *      external `kill`/`Stop-Process`) mid-run. Empirically, on Windows, an
 *      EXTERNALLY delivered signal (as opposed to Ctrl+C in an attached
 *      terminal) has been observed to NOT reliably invoke this handler at
 *      all -- a Node/Windows platform quirk, not something fixable from
 *      here. In every such test, the `next start` child was still reaped
 *      anyway, but only as a side effect of Windows tying non-detached
 *      child processes to the parent's Job Object and killing them when the
 *      parent dies by ANY means -- an OS behavior this script does not
 *      control, arrange, or get to rely on (the POSIX branch below spawns
 *      `detached: true` specifically so it can process-group-kill the
 *      child, which opts OUT of that exact Windows safety net). The
 *      port-free-check at the top of the NEXT run is the real backstop if
 *      an orphan ever does slip through: it refuses loudly rather than
 *      silently reusing whatever is left listening. A hard kill of THIS
 *      wrapper itself (SIGKILL, `taskkill /F` on the wrapper's own PID) is
 *      irreducibly unhandleable by any userspace code in any language --
 *      that failure mode is caught by the same port-free-check, not by
 *      anything in this process.
 * Windows has no real process-group signals, so killServer() uses
 * `taskkill /T /F` (kill the whole process tree) rather than a plain
 * child.kill(), which does not reliably reach worker processes Next spawns
 * under the hood.
 *
 * Exit codes:
 *   0                    -- preflight ran and PASSED (0 real STOPs)
 *   1                    -- preflight ran and STOPPED (>=1 real SEO defect
 *                            found) -- this script exits with the guardrail's
 *                            OWN exit code unchanged, so `&&` deploy chaining
 *                            halts on a real finding exactly like any other
 *                            deploy-chain step failure.
 *   ORCH_FAIL_EXIT (2)   -- THIS SCRIPT's own orchestration broke (port
 *                            occupied, build failed, server never came up).
 *                            Distinct from 1 on purpose: a future reader of a
 *                            failed deploy log needs to tell "the guardrail
 *                            found a real defect" apart from "the harness
 *                            around the guardrail is broken" without having
 *                            to dig -- the banner text says which, and the
 *                            exit code backs it up.
 *
 * Pure Node stdlib only (child_process, net, fs, path, url). No new npm
 * dependencies. ASCII-only console output (PowerShell cp1252-safe).
 */

import { spawn, spawnSync, execFileSync } from 'node:child_process'
import { createConnection } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const NEXT_BIN = join(REPO_ROOT, 'node_modules', 'next', 'dist', 'bin', 'next')
const PREFLIGHT_SCRIPT = join(REPO_ROOT, 'scripts', 'seo-preflight.mjs')
const ISR_AUDIT_SCRIPT = join(REPO_ROOT, 'scripts', 'isr-declaration-audit.mjs')

const PORT = Number(process.env.SEO_PREFLIGHT_PORT || 4791)
const HOST = '127.0.0.1'
const BASE_URL = `http://${HOST}:${PORT}`
const READY_TIMEOUT_MS = 60_000
const READY_POLL_INTERVAL_MS = 1000
const ORCH_FAIL_EXIT = 2

const LOG = '[run-seo-preflight]'
const LINE = '='.repeat(66)

const t0 = Date.now()
const timings = {}
function mark(label, start) { timings[label] = Date.now() - start }

function banner(...lines) {
  console.log('\n' + LINE)
  for (const l of lines) console.log(`${LOG} ${l}`)
  console.log(LINE)
}

function log(msg) { console.log(`${LOG} ${msg}`) }

// ── Server child process state (module-level so cleanup can reach it from
// the finally block AND from signal handlers) ──────────────────────────────
let serverProc = null
let serverOutput = [] // ring buffer of recent stdout/stderr for failure debugging
const SERVER_OUTPUT_CAP = 400 // lines

function captureServerOutput(chunk) {
  const text = chunk.toString('utf8')
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue
    serverOutput.push(line)
    if (serverOutput.length > SERVER_OUTPUT_CAP) serverOutput.shift()
  }
}

function printCapturedServerOutput() {
  if (!serverOutput.length) {
    log('(no server output was captured)')
    return
  }
  console.log(LINE)
  log(`captured next start output (last ${serverOutput.length} line(s)):`)
  for (const l of serverOutput) console.log('  ' + l)
  console.log(LINE)
}

let cleanedUp = false

/**
 * Kill the `next start` child process tree, idempotently. Safe to call
 * multiple times (finally block AND signal handlers can both reach here).
 */
function killServer() {
  if (cleanedUp) return
  cleanedUp = true
  if (!serverProc || serverProc.exitCode !== null || serverProc.killed) {
    if (serverProc) log('server process already exited, nothing to clean up.')
    return
  }
  const pid = serverProc.pid
  log(`tearing down next start server (pid ${pid}) ...`)
  try {
    if (process.platform === 'win32') {
      // Plain child.kill() on Windows does not reliably reach worker
      // processes `next start` spawns under the hood, leaving orphans
      // listening on PORT. /T kills the whole process tree, /F forces it.
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
      // Server was spawned with detached:true on POSIX -> it is its own
      // process group leader; killing -pid reaches the whole group.
      process.kill(-pid, 'SIGTERM')
    }
  } catch (e) {
    // Process may have already exited between the exitCode check above and
    // the kill call (race) -- not a real failure, just log it.
    log(`(kill attempt for pid ${pid} raised: ${String(e.message || e).split('\n')[0]} -- likely already exited)`)
  }
}

// Tear down on Ctrl+C / external terminate too, not just normal completion.
process.on('SIGINT', () => { log('SIGINT received, tearing down server before exit...'); killServer(); process.exit(ORCH_FAIL_EXIT) })
process.on('SIGTERM', () => { log('SIGTERM received, tearing down server before exit...'); killServer(); process.exit(ORCH_FAIL_EXIT) })

// Deterministic last-resort net: Node's 'exit' event fires synchronously on
// EVERY process.exit() call -- including one buried inside a try block that
// would otherwise skip a pending finally -- and on normal completion and on
// an uncaught exception. Unlike the explicit killServer() calls sprinkled
// before each process.exit() above (easy for a future edit to add a new
// early-exit and forget the call -- exactly the bug this file shipped with
// once already), this handler makes cleanup structurally automatic for any
// exit path this process reaches under its own control. killServer() is
// idempotent, so this is a harmless no-op everywhere it isn't the one that
// actually does the work. See header comment for what this does NOT cover.
process.on('exit', () => { try { killServer() } catch { /* best-effort at the very end of the process lifetime */ } })

// ── Port free-check ─────────────────────────────────────────────────────────

/** Resolves true if nothing answers a TCP connect on host:port (i.e. free). */
function checkPortFree(port, host) {
  return new Promise(resolve => {
    const sock = createConnection({ port, host, timeout: 1500 })
    let settled = false
    const finish = (free) => {
      if (settled) return
      settled = true
      sock.removeAllListeners()
      sock.destroy()
      resolve(free)
    }
    sock.on('connect', () => finish(false)) // something answered -> occupied
    sock.on('timeout', () => finish(true))  // nothing answered -> treat as free (next start's own bind is the final backstop)
    sock.on('error', (err) => {
      finish(err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET')
    })
  })
}

// ── Readiness poll ───────────────────────────────────────────────────────────

/**
 * Poll BASE_URL/api/healthz until it answers with ANY HTTP status (including
 * 503 -- see header comment on why 503 counts as "ready" here), or the
 * server process exits, or the timeout elapses.
 */
async function waitForServerReady() {
  const deadline = Date.now() + READY_TIMEOUT_MS
  let lastErr = null
  while (Date.now() < deadline) {
    if (serverProc.exitCode !== null) {
      return { ready: false, reason: `next start exited early with code ${serverProc.exitCode} before becoming ready` }
    }
    try {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 2000)
      const res = await fetch(`${BASE_URL}/api/healthz`, { signal: controller.signal })
      clearTimeout(t)
      // Any real HTTP response (even 503 -- see header comment) means the
      // server is up and routing requests.
      return { ready: true, status: res.status }
    } catch (e) {
      lastErr = e
    }
    await new Promise(r => setTimeout(r, READY_POLL_INTERVAL_MS))
  }
  return { ready: false, reason: `no response from ${BASE_URL}/api/healthz within ${READY_TIMEOUT_MS / 1000}s` + (lastErr ? ` (last error: ${String(lastErr.message || lastErr)})` : '') }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  banner(`G1 SEO preflight wrapper -- port ${PORT}, repo ${REPO_ROOT}`)

  // 1) Port must be free BEFORE we touch anything -- see header comment.
  const portStart = Date.now()
  const free = await checkPortFree(PORT, HOST)
  mark('port-check', portStart)
  if (!free) {
    banner(
      'ORCHESTRATION FAILURE (not a guardrail finding)',
      `Port ${PORT} is already occupied by something else.`,
      'Refusing to reuse whatever is already listening there -- that would risk',
      'silently testing a stale/unrelated server instead of this build (the exact',
      'false-pass failure mode G1 exists to prevent).',
      `Free the port, or set SEO_PREFLIGHT_PORT to a different value, then rerun.`,
    )
    process.exit(ORCH_FAIL_EXIT)
  }
  log(`port ${PORT} is free.`)

  // 2) Plain `next build` -- see header comment for why not the CF build.
  log('running next build (plain, not @opennextjs/cloudflare build) ...')
  const buildStart = Date.now()
  const build = spawnSync(process.execPath, [NEXT_BIN, 'build'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
  })
  mark('next-build', buildStart)
  if (build.status !== 0) {
    banner(
      'ORCHESTRATION FAILURE (not a guardrail finding)',
      `next build failed (exit code ${build.status ?? build.signal}).`,
      'The G1 guardrail never ran -- fix the build, then rerun.',
    )
    process.exit(ORCH_FAIL_EXIT)
  }
  log(`next build finished in ${(timings['next-build'] / 1000).toFixed(1)}s.`)

  // 2b) ISR declaration audit (2026-07-27) -- catches the WHOLE "revalidate is
  // a no-op on a dynamic segment" bug class (root cause of the /[genre] and
  // /[genre]/[line] hubs serving uncached SSR for ~6 weeks). Runs HERE,
  // straight off the manifest the build above just produced, deliberately
  // BEFORE spawning next start: it's read-only and cheap, so a route that
  // silently regressed to inert should fail the deploy immediately rather
  // than after paying for a server boot + full G1 run. Real defect, not an
  // orchestration failure -- exit 1, same STOP semantics as G1 itself, so
  // `&&` deploy chaining halts on it identically.
  log('running ISR declaration audit (bare-revalidate-on-dynamic-segment sweep) ...')
  const auditStart = Date.now()
  const audit = spawnSync(process.execPath, [ISR_AUDIT_SCRIPT], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
  })
  mark('isr-declaration-audit', auditStart)
  if (audit.status !== 0) {
    banner(
      'G1 PREFLIGHT STOP (real finding, not an orchestration failure)',
      'isr-declaration-audit.mjs found a route that declares `revalidate` on a',
      'dynamic segment but is NOT registered in the prerender-manifest -- the',
      'exact defect class that left /[genre] and /[genre]/[line] serving',
      'uncached SSR for ~6 weeks (see the audit output above for which route).',
      'Fix: add `export const dynamic = \'force-static\'` or generateStaticParams.',
    )
    process.exit(1)
  }
  log(`ISR declaration audit passed in ${timings['isr-declaration-audit']}ms.`)

  // 3) Spawn `next start -p PORT` as a background child. Captured (not
  //    inherited) stdio so a failed readiness wait can print recent output
  //    for debugging without letting the server's ongoing request logs spam
  //    the console for the rest of the run.
  log(`starting next start -p ${PORT} -H ${HOST} ...`)
  const spawnOpts = {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  }
  if (process.platform !== 'win32') spawnOpts.detached = true // POSIX: own process group, see killServer()
  serverProc = spawn(process.execPath, [NEXT_BIN, 'start', '-p', String(PORT), '-H', HOST], spawnOpts)
  serverProc.stdout.on('data', captureServerOutput)
  serverProc.stderr.on('data', captureServerOutput)
  serverProc.on('error', (e) => captureServerOutput(Buffer.from(`[spawn error] ${e.message}\n`)))

  let preflightExitCode = null

  try {
    // 4) Poll for readiness.
    const readyStart = Date.now()
    const readiness = await waitForServerReady()
    mark('server-ready-wait', readyStart)
    if (!readiness.ready) {
      printCapturedServerOutput()
      banner(
        'ORCHESTRATION FAILURE (not a guardrail finding)',
        `next start never became ready: ${readiness.reason}`,
        'The G1 guardrail never ran.',
      )
      killServer()
      process.exit(ORCH_FAIL_EXIT)
    }
    log(`server ready after ${(timings['server-ready-wait'] / 1000).toFixed(1)}s (healthz status ${readiness.status}; a non-200 here is expected -- see header comment, D1 is not bound locally).`)

    // 5) Run the real guardrail against this server, inherit stdio so its
    //    own banners/PASS/STOP output prints live and unmodified.
    log('running seo-preflight.mjs ...')
    const preflightStart = Date.now()
    const preflight = spawnSync(process.execPath, [PREFLIGHT_SCRIPT, '--base', BASE_URL], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: process.env,
    })
    mark('preflight-run', preflightStart)
    preflightExitCode = preflight.status
    if (preflightExitCode === null) {
      // Killed by signal rather than a normal exit.
      banner(
        'ORCHESTRATION FAILURE (not a guardrail finding)',
        `seo-preflight.mjs did not exit normally (signal ${preflight.signal}).`,
      )
      killServer()
      process.exit(ORCH_FAIL_EXIT)
    }
  } finally {
    // 6) ALWAYS tear the server down, on every exit path out of the try
    //    block above. NOTE: process.exit() called from inside this try block
    //    does NOT run this finally (Node terminates immediately; the pending
    //    finally is simply never reached) -- which is exactly why every
    //    early-exit above calls killServer() itself, right before its own
    //    process.exit(). killServer() is idempotent (see cleanedUp guard), so
    //    this finally is a harmless no-op on those paths and is the real
    //    cleanup only for normal completion or a thrown error.
    const teardownStart = Date.now()
    killServer()
    mark('teardown', teardownStart)
  }

  mark('total', t0)
  banner(
    `TIMING -- port-check ${timings['port-check']}ms, build ${(timings['next-build'] / 1000).toFixed(1)}s, ` +
    `isr-audit ${timings['isr-declaration-audit']}ms, ` +
    `server-ready ${(timings['server-ready-wait'] / 1000).toFixed(1)}s, preflight ${(timings['preflight-run'] / 1000).toFixed(1)}s, ` +
    `teardown ${timings['teardown']}ms, TOTAL ${(timings['total'] / 1000).toFixed(1)}s`,
    `G1 preflight exited with code ${preflightExitCode} (0=PASS, 1=STOP) -- passing that code through unchanged.`,
  )
  process.exit(preflightExitCode)
}

main().catch(e => {
  killServer()
  banner(
    'ORCHESTRATION FAILURE (not a guardrail finding)',
    `UNEXPECTED ERROR in run-seo-preflight.mjs: ${e && e.stack ? e.stack : e}`,
  )
  process.exit(ORCH_FAIL_EXIT)
})
