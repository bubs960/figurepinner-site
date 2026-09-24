#!/usr/bin/env node
/**
 * Layer 2 pre-flight probe runner (Steve ruling 2026-09-19, standalone relay
 * STANDALONE-TO-MATCHER-WEB-STEVE-RULING-D1-ONESHOT-RETIRED-NIGHTLY-LOADER-SPEC-LAYER1-LAYER2).
 *
 * Question it answers: can the whole KB land in D1 WITHOUT import mode?
 * `wrangler d1 execute --file` is import mode and blocks site reads per file;
 * this sends the `--multirow` emit as ordinary batched queries to the D1 HTTP
 * `/query` endpoint instead, into a THROWAWAY table, and measures.
 *
 *   node scripts/build-kb-d1-sql.mjs --out .tmp/kb-d1-probe --table kb_figures_probe --multirow 500
 *   node scripts/kb-d1-probe-http.mjs --dir .tmp/kb-d1-probe --dry-run
 *   node scripts/kb-d1-probe-http.mjs --dir .tmp/kb-d1-probe --authorized   (trough window, live session)
 *
 * Stop rules, verbatim from the ruling, all enforced here:
 *  - D1 rejects the batch size            -> any non-success response
 *  - wall time > 20 min                   -> --max-wall-min
 *  - site p95 on /wrestling/wwf-hasbro moves -> --watch-url sampler; rolling p95
 *    over max(baseline p95 x --p95-factor, baseline p95 + --p95-floor-ms), or any 5xx
 * The watch FAILS CLOSED: if the baseline sampling can't get 200s (Bot Fight 403s
 * scripted clients, the reason PR #31 exists) the load never starts, since the
 * third stop rule could not be enforced. A lone 403 is noise (CLAUDE.md truth #3),
 * so a non-200 baseline sample is retried --baseline-retries times, --retry-pause-ms
 * apart, before it counts (a 5xx is a real reading and is never retried; the
 * receipt records what was retried). Mid-load the same rule holds: --blind-trip
 * consecutive non-200 samples, or one curl timeout, stops the load ("watch went
 * blind"). --baseline-only runs just the watch check (site GETs, no D1 access).
 *
 * Safety: the target table must end in `_probe` (never kb_figures / _new / _old),
 * every statement is checked to target only that table, remote needs
 * --authorized (CLAUDE.md rule 5) plus a D1 token (CLOUDFLARE_API_TOKEN, else
 * CF_API_TOKEN from ~/.figurepinner-secrets.env; never printed). The probe table is dropped at the end
 * unless --keep. The live kb_figures is never touched.
 *
 * Output: OBSERVED VALUES (R10) on stdout and in <dir>/probe-receipt.json.
 */

import { execFile, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CF_API = 'https://api.cloudflare.com/client/v4'
const KB_DB_NAME = 'figurepinner-kb'
const D1_MAX_STATEMENT_BYTES = 100_000

function die(msg) {
  console.error(`[kb:d1:probe] ${msg}`)
  process.exit(1)
}

// ── args ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = {
    dir: null,
    perRequest: 1,
    watchUrl: 'https://figurepinner.com/wrestling/wwf-hasbro',
    watchIntervalMs: 2000,
    baselineSamples: 15,
    baselineRetries: 3,
    retryPauseMs: 5000,
    blindTrip: 6,
    baselineOnly: false,
    p95Factor: 1.5,
    p95FloorMs: 150,
    maxWallMin: 20,
    dryRun: false,
    authorized: false,
    keep: false,
    skipParity: false,
    apiBase: null,
    slim: null,
  }
  const num = (i, name, lo, hi) => {
    const v = Number(argv[i + 1])
    if (!Number.isFinite(v) || v < lo || v > hi) die(`${name} needs a number ${lo}..${hi}`)
    return v
  }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--dir') { opts.dir = resolve(ROOT, argv[++i] ?? die('--dir needs a path')) }
    else if (a === '--per-request') { opts.perRequest = num(i, a, 1, 50); i += 1 }
    else if (a === '--watch-url') { opts.watchUrl = argv[++i] ?? die('--watch-url needs a URL') }
    else if (a === '--watch-interval-ms') { opts.watchIntervalMs = num(i, a, 250, 60_000); i += 1 }
    else if (a === '--baseline-samples') { opts.baselineSamples = num(i, a, 5, 200); i += 1 }
    else if (a === '--baseline-retries') { opts.baselineRetries = num(i, a, 0, 10); i += 1 }
    else if (a === '--retry-pause-ms') { opts.retryPauseMs = num(i, a, 0, 60_000); i += 1 }
    else if (a === '--blind-trip') { opts.blindTrip = num(i, a, 2, 100); i += 1 }
    else if (a === '--baseline-only') opts.baselineOnly = true
    else if (a === '--p95-factor') { opts.p95Factor = num(i, a, 1.05, 10); i += 1 }
    else if (a === '--p95-floor-ms') { opts.p95FloorMs = num(i, a, 0, 10_000); i += 1 }
    else if (a === '--max-wall-min') { opts.maxWallMin = num(i, a, 0.1, 20); i += 1 }
    else if (a === '--slim') { opts.slim = resolve(ROOT, argv[++i] ?? die('--slim needs a path')) }
    // Test-only: point at a mock /query server. Parity via wrangler is skipped there.
    else if (a === '--api-base') { opts.apiBase = argv[++i] ?? die('--api-base needs a URL') }
    else if (a === '--dry-run') opts.dryRun = true
    else if (a === '--authorized') opts.authorized = true
    else if (a === '--keep') opts.keep = true
    else if (a === '--skip-parity') opts.skipParity = true
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/kb-d1-probe-http.mjs --dir <multirow emit> [--per-request K] [--watch-url URL] [--dry-run] [--baseline-only] [--authorized] [--keep]')
      process.exit(0)
    } else die(`unknown argument ${a}`)
  }
  if (!opts.dir) die('--dir is required (a build-kb-d1-sql.mjs --multirow emit)')
  // --max-wall-min caps at the ruling's 20; it may be tightened, never loosened.
  return opts
}

// ── load the emit ────────────────────────────────────────────────────────────

function loadEmit(dir) {
  const statsPath = join(dir, 'stats.json')
  if (!existsSync(statsPath)) die(`missing ${statsPath}`)
  const stats = JSON.parse(readFileSync(statsPath, 'utf8'))
  if (!stats.multirow) die('stats.json has no multirow field: build with --multirow N (single-row emit is the import-mode path this probe replaces)')
  const table = stats.table
  if (!/^[a-z_][a-z0-9_]*_probe$/.test(table ?? '')) die(`table "${table}" must end in _probe (build with --table kb_figures_probe)`)

  const schemaSql = stripComments(readFileSync(join(dir, '000_schema.sql'), 'utf8'))
  for (const stmt of splitStatements(schemaSql)) assertTargetsOnly(stmt, table)

  const files = readdirSync(dir).filter((f) => /^001_load_\d+\.sql$/.test(f)).sort()
  if (!files.length) die(`no 001_load_*.sql files in ${dir}`)
  const statements = []
  let declaredRows = 0
  for (const f of files) {
    const text = readFileSync(join(dir, f), 'utf8')
    const header = text.match(/^-- rows: (\d+)\n/)
    if (!header) die(`${f} has no "-- rows:" header (not a multirow emit)`)
    declaredRows += Number(header[1])
    for (const s of text.slice(header[0].length).split(/^(?=INSERT INTO )/m)) {
      const stmt = s.trim()
      if (!stmt) continue
      assertTargetsOnly(stmt, table)
      const bytes = Buffer.byteLength(stmt)
      if (bytes > D1_MAX_STATEMENT_BYTES) die(`${f}: a statement is ${bytes} B, over D1's ${D1_MAX_STATEMENT_BYTES} B cap`)
      statements.push({ sql: stmt, bytes, file: f })
    }
  }
  if (declaredRows !== stats.rowCount) die(`chunk headers declare ${declaredRows} rows, stats.json says ${stats.rowCount}`)
  if (stats.statements != null && statements.length !== stats.statements) die(`parsed ${statements.length} statements, stats.json says ${stats.statements}`)
  return { stats, table, schemaSql, statements, rows: declaredRows }
}

function stripComments(sql) {
  return sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
}

function splitStatements(sql) {
  return sql.split(';').map((s) => s.trim()).filter(Boolean)
}

// Every DDL/DML statement must name the probe table (indexes are renamed with it)
// and nothing that could be the live, staging or old table.
function assertTargetsOnly(stmt, table) {
  const head = stmt.slice(0, 300)
  if (!head.includes(table)) die(`statement does not target ${table}: ${head.slice(0, 80)}...`)
  if (/\bkb_figures(_new|_old)?\b(?!_probe)/.test(head.replaceAll(table, ''))) {
    die(`statement names a non-probe kb table: ${head.slice(0, 80)}...`)
  }
}

// ── D1 target ────────────────────────────────────────────────────────────────

function kbDatabaseIds() {
  const toml = readFileSync(join(ROOT, 'wrangler.toml'), 'utf8')
  const account = toml.match(/^account_id\s*=\s*"([^"]+)"/m)?.[1]
  // The active [[d1_databases]] block for figurepinner-kb (commented-out copies start with #).
  const db = toml.match(/^database_name\s*=\s*"figurepinner-kb"\s*\n^database_id\s*=\s*"([^"]+)"/m)?.[1]
  if (!account || !db) die(`could not read account_id / ${KB_DB_NAME} database_id from wrangler.toml`)
  return { account, db }
}

// Same source + key the nightly D1 writers use (run-matcher-window.ps1; D1 write
// scope verified 2026-09-10). Read in-process, never printed.
const SECRETS_FILE = join(homedir(), '.figurepinner-secrets.env')
function secretsFileToken() {
  if (!existsSync(SECRETS_FILE)) return null
  const line = readFileSync(SECRETS_FILE, 'utf8').split(/\r?\n/).find((l) => l.startsWith('CF_API_TOKEN='))
  return line ? line.slice('CF_API_TOKEN='.length).trim().replace(/^["']|["']$/g, '') : null
}

function makeClient(opts) {
  if (opts.apiBase) {
    return { url: `${opts.apiBase.replace(/\/$/, '')}/query`, headers: { 'content-type': 'application/json' }, mock: true }
  }
  const token = process.env.CLOUDFLARE_API_TOKEN || secretsFileToken()
  if (!token) die(`no D1 token: set CLOUDFLARE_API_TOKEN, or CF_API_TOKEN in ${SECRETS_FILE}`)
  const { account, db } = kbDatabaseIds()
  return {
    url: `${CF_API}/accounts/${account}/d1/database/${db}/query`,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    mock: false,
  }
}

async function query(client, sql) {
  const t0 = performance.now()
  let res
  let body
  try {
    res = await fetch(client.url, { method: 'POST', headers: client.headers, body: JSON.stringify({ sql }) })
    body = await res.json().catch(() => null)
  } catch (err) {
    return { ok: false, ms: performance.now() - t0, error: `fetch failed: ${err.message}` }
  }
  const ms = performance.now() - t0
  if (!res.ok || !body?.success) {
    const error = body?.errors?.map((e) => `[${e.code}] ${e.message}`).join('; ') || `HTTP ${res.status}`
    return { ok: false, ms, status: res.status, error }
  }
  const results = Array.isArray(body.result) ? body.result : []
  const changes = results.reduce((n, r) => n + (r?.meta?.changes ?? 0), 0)
  const d1Ms = results.reduce((n, r) => n + (r?.meta?.duration ?? 0), 0)
  return { ok: true, ms, status: res.status, changes, d1Ms, results }
}

// ── site watch ───────────────────────────────────────────────────────────────

function p95(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]
}

// curl.exe with a browser UA (Steve, 9/22 decision A): Bot Fight 403s Node's
// fetch even with a browser UA (TLS fingerprint), while curl.exe + this UA is the
// queue's standing read path. If Bot Fight starts 403ing curl too, the baseline
// fails and the probe refuses to start. ms = curl's time_total.
const WATCH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl'
async function sample(url) {
  // Cache-busting query so the edge cache can't hide D1 read latency.
  const target = `${url}${url.includes('?') ? '&' : '?'}_probe=${Date.now()}`
  try {
    const { stdout } = await execFileAsync(CURL, ['-s', '-o', process.platform === 'win32' ? 'NUL' : '/dev/null',
      '-A', WATCH_UA, '--max-time', '15', '-w', '%{http_code} %{time_total}', target])
    const [code, secs] = stdout.trim().split(' ')
    return { status: Number(code), ms: Number(secs) * 1000 }
  } catch (err) {
    // curl exit 28 = --max-time hit: the page hung, which is a reading, not noise.
    return { status: 0, ms: 15_000, error: err.message, timeout: err.code === 28 }
  }
}

// Baseline noise filter. A 403 (Bot Fight), 429 or curl failure is retried `retries` times,
// `pauseMs` apart, before it counts (CLAUDE.md truth #3: a shell 403 is a non-signal; the
// 9/24 live run refused on ONE 403 in 15). A 5xx is a real reading and is never retried.
// ms is the final attempt's time_total; `noise` lists the statuses that were retried.
async function sampleRetry(url, { retries, pauseMs }) {
  let s = await sample(url)
  const noise = []
  while (s.status !== 200 && s.status < 500 && noise.length < retries) {
    noise.push(s.status)
    await new Promise((r) => setTimeout(r, pauseMs))
    s = await sample(url)
  }
  return { ...s, noise }
}

async function baseline(opts) {
  const samples = []
  for (let i = 0; i < opts.baselineSamples; i += 1) {
    samples.push(await sampleRetry(opts.watchUrl, { retries: opts.baselineRetries, pauseMs: opts.retryPauseMs }))
    await new Promise((r) => setTimeout(r, opts.watchIntervalMs))
  }
  const statuses = [...new Set(samples.map((s) => s.status))]
  const bad = samples.filter((s) => s.status !== 200)
  const noise = samples.flatMap((s) => s.noise)
  return {
    samples, statuses, bad: bad.length, retried: noise.length, noise: [...new Set(noise)],
    p95: p95(samples.filter((s) => s.status === 200).map((s) => s.ms)),
  }
}

function startWatch(opts, base, onTrip) {
  const during = []
  const threshold = Math.max(base.p95 * opts.p95Factor, base.p95 + opts.p95FloorMs)
  let stopped = false
  let run = 0
  let maxRun = 0
  const loop = (async () => {
    while (!stopped) {
      const s = await sample(opts.watchUrl)
      during.push(s)
      if (s.status >= 500) onTrip(`site returned ${s.status} during the load`)
      if (s.timeout) onTrip('site timed out (curl 15 s) during the load')
      // A lone 403 is noise, but a run of non-200s means the watch went blind mid-load.
      run = s.status === 200 ? 0 : run + 1
      maxRun = Math.max(maxRun, run)
      if (run >= opts.blindTrip) onTrip(`watch went blind: ${run} consecutive non-200 samples (last ${s.status}) mid-load`)
      const window = during.slice(-10).filter((x) => x.status === 200).map((x) => x.ms)
      const rolling = window.length >= 5 ? p95(window) : null
      if (rolling != null && rolling > threshold) onTrip(`site p95 moved: rolling ${Math.round(rolling)} ms > threshold ${Math.round(threshold)} ms`)
      await new Promise((r) => setTimeout(r, opts.watchIntervalMs))
    }
  })()
  return {
    threshold,
    maxNon200Run: () => maxRun,
    async stop() { stopped = true; await loop; return during },
  }
}

// ── parity ───────────────────────────────────────────────────────────────────

function runParity(table, rows, slimPath) {
  const args = ['scripts/check-kb-d1-remote.mjs', '--table', table, '--expect-rows', String(rows)]
  if (slimPath) args.push('--slim', slimPath)
  const res = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' })
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}`
  return { pass: res.status === 0, exit: res.status, tail: out.trim().split('\n').slice(-6).join('\n') }
}

// ── main ─────────────────────────────────────────────────────────────────────

const opts = parseArgs(process.argv.slice(2))
const emit = loadEmit(opts.dir)
const requests = []
for (let i = 0; i < emit.statements.length; i += opts.perRequest) requests.push(emit.statements.slice(i, i + opts.perRequest))
const maxStmt = Math.max(...emit.statements.map((s) => s.bytes))
const maxReq = Math.max(...requests.map((r) => r.reduce((n, s) => n + s.bytes, 0)))

// The parity gate reads a slim; it must be the bytes the emit was built from.
const slimPath = opts.slim ?? join(ROOT, 'src', 'data', 'figures-reference-v2.slim.js')
const slimHead = existsSync(slimPath) ? createHash('md5').update(readFileSync(slimPath)).digest('hex').toUpperCase() : null
const headMatches = emit.stats.head ? slimHead === emit.stats.head : null

console.log(`[kb:d1:probe] emit: ${emit.rows} rows, ${emit.statements.length} statements (multirow ${emit.stats.multirow}, cap ${emit.stats.statementBytes} B), max statement ${maxStmt} B`)
console.log(`[kb:d1:probe] plan: ${requests.length} requests x <=${opts.perRequest} statements, max request SQL ${maxReq} B -> ${emit.table}`)
console.log(`[kb:d1:probe] slim head ${slimHead ?? 'MISSING'} vs emit head ${emit.stats.head ?? 'n/a'}: ${headMatches === false ? 'MISMATCH (parity would fail; rebuild or pass --slim)' : 'ok'}`)
console.log(`[kb:d1:probe] stop rules: D1 rejects a request | wall > ${opts.maxWallMin} min | site p95 moves (x${opts.p95Factor} or +${opts.p95FloorMs} ms) or 5xx on ${opts.watchUrl}`)
if (opts.dryRun) {
  console.log('[kb:d1:probe] DRY RUN: no network. Plan validated.')
  process.exit(0)
}

// Baseline + verdict, shared by the live run and --baseline-only.
async function checkedBaseline() {
  console.log(`[kb:d1:probe] baseline: ${opts.baselineSamples} samples of ${opts.watchUrl} (a non-200 is retried up to ${opts.baselineRetries}x, ${opts.retryPauseMs} ms apart) ...`)
  const base = await baseline(opts)
  const summary = { statuses: base.statuses, non200: base.bad, retried: base.retried, noise: base.noise, p95Ms: base.p95 && Math.round(base.p95) }
  const blind = base.bad || base.p95 == null
    ? `watch blind: baseline statuses ${base.statuses.join(',')} (${base.bad}/${base.samples.length} non-200 after ${opts.baselineRetries} retries each${base.noise.length ? `; retried noise ${base.noise.join(',')}` : ''})`
    : null
  return { base, summary, blind }
}

if (opts.baselineOnly) {
  // Watch check only: GETs on the site, no D1 token read, no D1 write, so no --authorized.
  const { base, summary, blind } = await checkedBaseline()
  console.log('[kb:d1:probe] ── OBSERVED VALUES (baseline only, no D1 access) ──')
  console.log(`[kb:d1:probe] statuses ${summary.statuses.join(',')} | non-200 ${summary.non200}/${base.samples.length} | retried ${summary.retried}${summary.noise.length ? ` (${summary.noise.join(',')})` : ''} | p95 ${summary.p95Ms ?? 'n/a'} ms`)
  console.log(`[kb:d1:probe] watch: ${blind ? `BLIND (${blind})` : 'OK, the p95 stop rule can be enforced'}`)
  process.exit(blind ? 2 : 0)
}
if (!opts.apiBase && !opts.authorized) die('remote D1 writes require --authorized (CLAUDE.md rule 5): run only in a trough window, with a go, in a live session')
if (headMatches === false && !opts.skipParity) die('slim head does not match the emit; parity would fail. Rebuild the emit or pass --slim <snapshot>.')

const client = makeClient(opts)
const receipt = {
  date: new Date().toISOString(), target: client.mock ? 'mock' : `${KB_DB_NAME}/${emit.table}`,
  rows: emit.rows, statements: emit.statements.length, perRequest: opts.perRequest, requests: requests.length,
  maxStatementBytes: maxStmt, maxRequestBytes: maxReq, head: emit.stats.head ?? null,
  pass: false, stop: null,
}
const writeReceipt = () => writeFileSync(join(opts.dir, 'probe-receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`)

const { base, summary, blind } = await checkedBaseline()
receipt.baseline = summary
if (blind) {
  receipt.stop = `${blind}. The p95 stop rule can't be enforced, so the load did not start.`
  writeReceipt()
  die(receipt.stop)
}
console.log(`[kb:d1:probe] baseline p95 ${Math.round(base.p95)} ms (all 200${base.retried ? `, ${base.retried} retried after ${base.noise.join(',')}` : ''})`)

let trip = null
const watch = startWatch(opts, base, (why) => { trip ??= why })
const t0 = performance.now()
const timings = []
let changes = 0
let d1Ms = 0

const schema = await query(client, emit.schemaSql)
if (!schema.ok) trip ??= `D1 rejected the schema: ${schema.error}`

for (let i = 0; i < requests.length && !trip; i += 1) {
  const r = await query(client, requests[i].map((s) => s.sql).join('\n'))
  timings.push(r.ms)
  if (!r.ok) { trip = `D1 rejected request ${i + 1}/${requests.length} (${requests[i].length} statements): ${r.error}`; break }
  changes += r.changes
  d1Ms += r.d1Ms
  if ((performance.now() - t0) / 60_000 > opts.maxWallMin) trip = `wall time over ${opts.maxWallMin} min at request ${i + 1}/${requests.length}`
  if ((i + 1) % 25 === 0) console.log(`[kb:d1:probe]   ${i + 1}/${requests.length} requests, ${changes} rows, ${Math.round((performance.now() - t0) / 1000)} s`)
}
const wallMs = performance.now() - t0
const during = await watch.stop()
const duringOk = during.filter((s) => s.status === 200).map((s) => s.ms)

Object.assign(receipt, {
  wallMs: Math.round(wallMs), rowsChanged: changes, d1DurationMs: Math.round(d1Ms),
  requestMs: { p50: timings.length ? Math.round(timings.sort((a, b) => a - b)[Math.floor(timings.length / 2)]) : null, p95: timings.length ? Math.round(p95(timings)) : null, max: timings.length ? Math.round(Math.max(...timings)) : null },
  watch: { samples: during.length, non200: during.length - duringOk.length, maxNon200Run: watch.maxNon200Run(), p95Ms: duringOk.length ? Math.round(p95(duringOk)) : null, thresholdMs: Math.round(watch.threshold) },
  stop: trip,
})

if (!trip) {
  const count = await query(client, `SELECT COUNT(*) AS n FROM ${emit.table}`)
  receipt.countStar = count.ok ? count.results?.[0]?.results?.[0]?.n ?? null : `error: ${count.error}`
  if (changes !== emit.rows || receipt.countStar !== emit.rows) trip = receipt.stop = `row mismatch: changes ${changes}, COUNT(*) ${receipt.countStar}, expected ${emit.rows}`
}
if (!trip && !opts.skipParity && !client.mock) {
  receipt.parity = runParity(emit.table, emit.rows, opts.slim)
  if (!receipt.parity.pass) trip = receipt.stop = `parity failed (exit ${receipt.parity.exit})`
}
if (!opts.keep) {
  const drop = await query(client, `DROP TABLE IF EXISTS ${emit.table}`)
  receipt.dropped = drop.ok ? true : `error: ${drop.error}`
}
receipt.pass = !trip
writeReceipt()

console.log('[kb:d1:probe] ── OBSERVED VALUES ──')
console.log(`[kb:d1:probe] result: ${receipt.pass ? 'PASS' : `STOP (${receipt.stop})`}`)
console.log(`[kb:d1:probe] wall ${(receipt.wallMs / 1000).toFixed(1)} s | rows changed ${changes}/${emit.rows} | COUNT(*) ${receipt.countStar ?? 'n/a'} | D1 duration ${receipt.d1DurationMs} ms`)
console.log(`[kb:d1:probe] requests ${timings.length}/${requests.length} x ${opts.perRequest} stmts | request ms p50 ${receipt.requestMs.p50} p95 ${receipt.requestMs.p95} max ${receipt.requestMs.max}`)
console.log(`[kb:d1:probe] site: baseline p95 ${receipt.baseline.p95Ms} ms (${receipt.baseline.retried} retried) -> during p95 ${receipt.watch.p95Ms} ms (threshold ${receipt.watch.thresholdMs}), ${receipt.watch.non200} non-200 of ${receipt.watch.samples}, longest non-200 run ${receipt.watch.maxNon200Run}`)
if (receipt.parity) console.log(`[kb:d1:probe] parity: ${receipt.parity.pass ? 'PASS' : 'FAIL'}\n${receipt.parity.tail}`)
console.log(`[kb:d1:probe] probe table ${opts.keep ? 'KEPT' : receipt.dropped === true ? 'dropped' : receipt.dropped}; receipt ${join(opts.dir, 'probe-receipt.json')}`)
process.exit(receipt.pass ? 0 : 2)
