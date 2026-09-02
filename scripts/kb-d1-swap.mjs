#!/usr/bin/env node
/**
 * kb_figures atomic table-swap orchestrator (2026-08-26).
 *
 * Replaces the retired direct-apply path (whose first statement was
 * `DROP TABLE IF EXISTS kb_figures` against the table serving live traffic —
 * vetoed by the 2026-08-25 standalone ruling). Sequence:
 *
 *   build   (build-kb-d1-sql.mjs --table kb_figures_new)   [not this script]
 *   load            schema + chunks into kb_figures_new; live table untouched
 *   verify-staging  ALL-18-column parity vs the slim KB, BY NAME, pre-rename
 *   swap            single batched command:
 *                     ALTER TABLE kb_figures     RENAME TO kb_figures_old;
 *                     ALTER TABLE kb_figures_new RENAME TO kb_figures;
 *   verify-live     row-count + column parity on the now-live kb_figures
 *   finalize        DROP kb_figures_old, normalize index names to canonical
 *   rollback        (only before finalize) put kb_figures_old back as kb_figures
 *
 * Design notes, each tied to a 2026-08-25 audit finding:
 *  - Old table is KEPT (as kb_figures_old) until an explicit `finalize`, so
 *    rollback is a rename of a still-present table, not a re-load (finding 5).
 *  - verify-staging runs check-kb-d1-remote.mjs --table kb_figures_new: the
 *    full 18-column gate runs BEFORE the rename, against the staging table by
 *    name (finding 2).
 *  - No schema changes ride along. The staging DDL is the canonical
 *    option-e-kb_figures.sql with only names rewritten (finding 3).
 *  - Remote execution is gated: --remote requires --authorized, which exists
 *    to name the CLAUDE.md rule 5 / standalone-authorization step that the
 *    original design left implicit (finding 4). The flag is an attestation
 *    that the 2026-08-25 conditional authorization applies (atomic-swap
 *    sequence, low-traffic window), not a bypass.
 *  - The swap/rollback renames are sent as ONE multi-statement command so D1
 *    executes them as a single batch (batches are transactional per D1 docs).
 *    `rehearse` exists to OBSERVE that behavior with forced failures on a
 *    local database instead of assuming it (findings 1/5 — "unsourced
 *    atomicity reassurance").
 *
 * Rehearsal (all local, disposable, no authorization needed):
 *   node scripts/kb-d1-swap.mjs rehearse
 */

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_DB = 'figurepinner-kb'
const LIVE = 'kb_figures'
const STAGING = 'kb_figures_new'
const OLD = 'kb_figures_old'
const WRANGLER_BIN = resolve(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler')
const DDL_PATH = join(ROOT, 'scripts', 'option-e-kb_figures.sql')

// ── args ─────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const PHASES = ['status', 'load', 'verify-staging', 'swap', 'verify-live', 'finalize', 'rollback', 'rehearse', 'probe-atomicity']
const phase = argv[0]

function argValue(flag) {
  const i = argv.indexOf(flag)
  return i !== -1 ? argv[i + 1] : null
}

const opts = {
  db: argValue('--db') ?? DEFAULT_DB,
  local: argv.includes('--local'),
  authorized: argv.includes('--authorized'),
  dir: argValue('--dir') ? resolve(ROOT, argValue('--dir')) : join(ROOT, '.tmp', 'kb-d1-swap'),
  expectRows: argValue('--expect-rows') ? Number(argValue('--expect-rows')) : null,
  dryRun: argv.includes('--dry-run'),
  resume: argv.includes('--resume'),
  // --pace <ms>: sleep between chunk files. A remote `d1 execute --file` puts D1
  // into import mode, which REJECTS concurrent site queries for the length of
  // each file (`D1_ERROR: Currently processing a long-running import`, observed
  // 2026-09-02 12:45 UTC: 5x 500 on production during a daytime load). Pacing
  // spreads those windows so the site recovers between them; loads still belong
  // in the traffic trough. 0 = today's behaviour.
  pace: argValue('--pace') ? Number(argValue('--pace')) : 0,
}

function die(message) {
  console.error(`[kb:d1:swap] ERROR: ${message}`)
  process.exit(1)
}

if (!phase || !PHASES.includes(phase)) {
  console.log(`Usage: node scripts/kb-d1-swap.mjs <phase> [--db name] [--local] [--dir path] [--expect-rows n] [--dry-run] [--authorized] [--resume]

Phases (run in order): status | load | verify-staging | swap | verify-live | finalize
  load --resume        continue a load that died mid-way (network blip): skips the schema and
                       every chunk whose rows are already in kb_figures_new, ONLY if the
                       existing row count sits exactly on a file boundary; otherwise refuses.
  load --pace <ms>     sleep <ms> between chunk files (recommended 1500 for any daytime
                       remote load: each file import blocks production reads while it runs).
Recovery:              rollback   (before finalize only)
Rehearsal:             rehearse   (fully local, disposable, exercises everything incl. forced failures)

Remote runs additionally require --authorized — the CLAUDE.md rule 5 gate.
This flag attests the 2026-08-25 standalone conditional authorization applies
(atomic-swap sequence, low-traffic window). It is a named step, not a formality.`)
  process.exit(phase ? 1 : 0)
}

// Rule 5 gate: remote execution of anything that writes must be explicitly
// authorized. status is read-only and exempt; rehearse forces --local anyway.
if (!opts.local && phase !== 'status' && phase !== 'rehearse' && !opts.authorized) {
  die(`phase "${phase}" against REMOTE requires --authorized (CLAUDE.md rule 5 / 2026-08-25 standalone ruling). Rehearse locally with: node scripts/kb-d1-swap.mjs rehearse`)
}

// ── wrangler plumbing ────────────────────────────────────────────────────────

function quoteWindowsArg(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`
}

function runWrangler(args, { allowFail = false } = {}) {
  const command = [WRANGLER_BIN, ...args].map(quoteWindowsArg).join(' ')
  try {
    return {
      ok: true,
      output: execSync(command, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 64,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
        windowsHide: true,
      }),
    }
  } catch (error) {
    if (allowFail) {
      return { ok: false, output: `${error.stdout ?? ''}${error.stderr ?? ''}` }
    }
    console.error(`[kb:d1:swap] wrangler failed:\n${error.stdout ?? ''}${error.stderr ?? ''}`)
    process.exit(1)
  }
}

function locFlag() {
  return opts.local ? '--local' : '--remote'
}

function runSql(command, { allowFail = false } = {}) {
  const res = runWrangler(
    ['d1', 'execute', opts.db, locFlag(), '--json', '--command', command.replace(/\s+/g, ' ').trim()],
    { allowFail },
  )
  if (!res.ok) return { ok: false, results: [], raw: res.output }
  const parsed = JSON.parse(res.output)
  const first = Array.isArray(parsed) ? parsed[0] : parsed
  return { ok: true, results: first?.results ?? first?.result?.[0]?.results ?? [], raw: res.output }
}

// Known wrangler 4.x quirk (observed live 2026-09-01, wrangler 4.107.0, first
// swap attempt at head E85134B3): `d1 execute --remote --file` prints
// "Processed N queries." (the import COMPLETED) and then exits non-zero with
// "Not currently importing anything." from its post-import status poll. The
// original code trusted the exit code, died on file 1 of 99, and left an
// empty kb_figures_new. Same class as the bin-ingest "wrangler can exit
// nonzero after a successful import" note in task-health-check.ps1.
// Fix: never trust the exit code alone in either direction. Accept that
// exact signature ONLY, then prove the rows landed with a COUNT(*) against
// the expected running total; anything else is still fatal.
// Synchronous sleep for the pacing option (the script is execSync-driven end to end).
function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

const WRANGLER_POLL_BUG = /Not currently importing anything/i
const WRANGLER_IMPORT_DONE = /Processed \d+ quer/i

function runSqlFile(path, { table = null, expectRowsAfter = null } = {}) {
  if (opts.dryRun) {
    console.log(`[kb:d1:swap] (dry-run) would execute file: ${path}`)
    return
  }
  const res = runWrangler(['d1', 'execute', opts.db, locFlag(), '--file', path], { allowFail: true })
  if (!res.ok) {
    const pollBug = WRANGLER_IMPORT_DONE.test(res.output) && WRANGLER_POLL_BUG.test(res.output)
    if (!pollBug) {
      console.error(`[kb:d1:swap] wrangler failed on ${basename(path)}:\n${res.output}`)
      process.exit(1)
    }
    console.log(`[kb:d1:swap]     wrangler post-import poll failed AFTER "Processed N queries" (known 4.x quirk) -- verifying rows landed instead of trusting the exit code`)
  }
  if (table && expectRowsAfter !== null) {
    const have = rowCount(table)
    if (have !== expectRowsAfter) {
      die(`row count after ${basename(path)}: expected ${expectRowsAfter}, got ${have} -- that file did NOT land. Re-run load from the top (000_schema.sql is DROP TABLE IF EXISTS, a restart is safe).`)
    }
    console.log(`[kb:d1:swap]     ${table} = ${have} rows (expected ${expectRowsAfter}) OK`)
  }
}

// Rows a load chunk will insert = its single-row INSERT statements (the
// emitter writes one INSERT per figure). Schema files contribute 0.
function rowsInSqlFile(path) {
  const sql = readFileSync(path, 'utf8')
  return (sql.match(/^INSERT INTO /gm) ?? []).length
}

// ── table inspection ─────────────────────────────────────────────────────────

function tableExists(name) {
  const { results } = runSql(`SELECT name FROM sqlite_master WHERE type='table' AND name='${name}'`)
  return results.length > 0
}

function rowCount(name) {
  const { results } = runSql(`SELECT COUNT(*) AS c FROM ${name}`)
  return Number(results[0]?.c ?? 0)
}

function indexNames() {
  const { results } = runSql(`SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'`)
  return results
}

function printStatus() {
  console.log(`[kb:d1:swap] db: ${opts.db} (${opts.local ? 'local' : 'remote'})`)
  for (const name of [LIVE, STAGING, OLD]) {
    if (tableExists(name)) {
      console.log(`[kb:d1:swap]   ${name}: EXISTS, ${rowCount(name)} rows`)
    } else {
      console.log(`[kb:d1:swap]   ${name}: absent`)
    }
  }
  for (const idx of indexNames()) {
    console.log(`[kb:d1:swap]   index ${idx.name} on ${idx.tbl_name}`)
  }
}

// ── canonical index definitions (parsed from the DDL, not duplicated here) ───

function canonicalIndexes() {
  const ddl = readFileSync(DDL_PATH, 'utf8')
  const out = []
  const re = /CREATE INDEX (idx_[a-z0-9_]+)\s+ON kb_figures \(([^)]+)\)/gi
  let m
  while ((m = re.exec(ddl)) !== null) {
    out.push({ name: m[1], columns: m[2].replace(/\s+/g, ' ').trim() })
  }
  if (out.length === 0) die(`no CREATE INDEX statements parsed from ${DDL_PATH}`)
  return out
}

// ── verification (delegates to the 18-column checker) ────────────────────────

function runVerify(table) {
  const args = ['node', 'scripts/check-kb-d1-remote.mjs', '--db', opts.db, '--table', table]
  if (opts.local) args.push('--local')
  if (opts.expectRows) args.push('--expect-rows', String(opts.expectRows))
  console.log(`[kb:d1:swap] verify: ${args.join(' ')}`)
  if (opts.dryRun) return
  execSync(args.map(quoteWindowsArg).join(' '), {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    windowsHide: true,
  })
}

// ── phases ───────────────────────────────────────────────────────────────────

function phaseLoad() {
  if (!existsSync(opts.dir)) {
    die(`build dir missing: ${opts.dir}\nBuild it first: node scripts/build-kb-d1-sql.mjs --out ${opts.dir} --table ${STAGING}`)
  }
  const stats = JSON.parse(readFileSync(join(opts.dir, 'stats.json'), 'utf8'))
  if (stats.table !== STAGING) {
    die(`build dir ${opts.dir} targets table "${stats.table}", expected "${STAGING}" — rebuild with --table ${STAGING}`)
  }
  const files = readdirSync(opts.dir).filter(f => f.endsWith('.sql')).sort()
  if (!files.includes('000_schema.sql')) die('000_schema.sql missing from build dir')
  console.log(`[kb:d1:swap] loading ${files.length} files (${stats.rowCount} rows) into ${STAGING} -- row count verified after EVERY file`)
  // --resume (2026-09-01): a remote load is ~99 uploads; a transient network
  // failure mid-way (seen live: "fetch failed" on the 2nd attempt) must not
  // cost a full restart. Resume is only legal when the rows already in staging
  // sit EXACTLY on a file boundary of this build dir -- then the schema file
  // (which would DROP the table) and every fully-landed chunk are skipped and
  // the per-file count checks continue from there. Anything else refuses and
  // says restart. Without --resume the schema's DROP TABLE IF EXISTS wins.
  const existing = (!opts.dryRun && opts.resume && tableExists(STAGING)) ? rowCount(STAGING) : 0
  let skipping = opts.resume && existing > 0
  if (opts.resume && !skipping) console.log(`[kb:d1:swap] --resume requested but ${STAGING} is absent/empty -- doing a normal full load`)
  if (skipping) console.log(`[kb:d1:swap] --resume: ${STAGING} already has ${existing} rows -- skipping files whose rows are present (boundary-checked)`)
  let expected = 0
  for (const file of files) {
    const path = join(opts.dir, file)
    const n = rowsInSqlFile(path)
    if (skipping) {
      if (expected + n <= existing) {
        expected += n
        console.log(`[kb:d1:swap]   ${file} (+${n} -> ${expected}) SKIPPED, already loaded`)
        continue
      }
      if (expected !== existing) {
        die(`--resume: ${STAGING} has ${existing} rows, which is not on a file boundary (previous boundary ${expected}, next ${expected + n}) -- a chunk half-landed. Restart WITHOUT --resume.`)
      }
      skipping = false
      console.log(`[kb:d1:swap] --resume: boundary ${expected} confirmed, continuing with ${file}`)
    }
    expected += n
    console.log(`[kb:d1:swap]   ${file} (+${n} -> ${expected})`)
    runSqlFile(path, { table: STAGING, expectRowsAfter: expected })
    if (opts.pace > 0 && !opts.dryRun) sleepMs(opts.pace)
  }
  if (expected !== stats.rowCount) {
    die(`emitted files sum to ${expected} INSERTs but stats.json says ${stats.rowCount} -- build dir inconsistent, rebuild it`)
  }
  if (!opts.dryRun) {
    const loaded = rowCount(STAGING)
    console.log(`[kb:d1:swap] load complete: ${STAGING} has ${loaded} rows (expected ${stats.rowCount})`)
    if (loaded !== stats.rowCount) die('row count after load does not match build stats')
  }
}

function phaseSwap({ skipVerify = false } = {}) {
  if (!tableExists(STAGING)) die(`${STAGING} does not exist — run load first`)
  if (!tableExists(LIVE)) die(`${LIVE} does not exist — nothing to swap away from (fresh DB? just rename staging manually)`)
  if (tableExists(OLD)) die(`${OLD} already exists — a previous swap was never finalized or rolled back. Resolve that first (finalize or rollback), never overwrite it.`)
  const stagingRows = rowCount(STAGING)
  const liveRows = rowCount(LIVE)
  console.log(`[kb:d1:swap] pre-swap: ${LIVE}=${liveRows} rows, ${STAGING}=${stagingRows} rows`)
  if (stagingRows === 0) die(`${STAGING} is empty — refusing to swap`)
  if (!skipVerify) runVerify(STAGING)

  const command = `ALTER TABLE ${LIVE} RENAME TO ${OLD}; ALTER TABLE ${STAGING} RENAME TO ${LIVE};`
  console.log(`[kb:d1:swap] executing batched swap: ${command}`)
  if (opts.dryRun) return
  const res = runSql(command, { allowFail: true })
  if (!res.ok) {
    console.error(`[kb:d1:swap] SWAP COMMAND FAILED. Observing actual state before anything else:`)
    printStatus()
    die('swap failed — see state above. If kb_figures is missing, run rollback IMMEDIATELY.')
  }
  console.log(`[kb:d1:swap] swap complete. post-swap state:`)
  printStatus()
  console.log(`[kb:d1:swap] next: verify-live, then finalize. Rollback stays available until finalize.`)
}

function phaseFinalize() {
  if (!tableExists(OLD)) die(`${OLD} does not exist — nothing to finalize`)
  if (!tableExists(LIVE)) die(`${LIVE} missing — DO NOT finalize; run rollback`)
  console.log(`[kb:d1:swap] dropping ${OLD} (${rowCount(OLD)} rows) and normalizing index names`)
  if (opts.dryRun) return
  // Old table first: dropping it frees the canonical index names.
  runSql(`DROP TABLE ${OLD}`)
  const staged = canonicalIndexes()
  for (const idx of staged) {
    const stagedName = idx.name.replace(LIVE, STAGING)
    runSql(`DROP INDEX IF EXISTS ${stagedName}`)
    runSql(`CREATE INDEX IF NOT EXISTS ${idx.name} ON ${LIVE} (${idx.columns})`)
  }
  console.log(`[kb:d1:swap] finalized. final state:`)
  printStatus()
}

function phaseRollback() {
  if (!tableExists(OLD)) die(`${OLD} does not exist — nothing to roll back to (already finalized?)`)
  const liveExists = tableExists(LIVE)
  // If the bad new table still occupies the kb_figures name, move it aside in
  // the same batch that restores the old one — one transaction, same guarantee
  // as the forward swap.
  const command = liveExists
    ? `ALTER TABLE ${LIVE} RENAME TO kb_figures_rolledback; ALTER TABLE ${OLD} RENAME TO ${LIVE};`
    : `ALTER TABLE ${OLD} RENAME TO ${LIVE};`
  if (liveExists && tableExists('kb_figures_rolledback')) {
    die('kb_figures_rolledback already exists from an earlier rollback — drop or rename it first')
  }
  console.log(`[kb:d1:swap] executing rollback: ${command}`)
  if (opts.dryRun) return
  const res = runSql(command, { allowFail: true })
  if (!res.ok) {
    console.error('[kb:d1:swap] ROLLBACK COMMAND FAILED. Actual state:')
    printStatus()
    die('rollback failed — see state above')
  }
  console.log(`[kb:d1:swap] rollback complete (rejected table kept as kb_figures_rolledback if it existed). State:`)
  printStatus()
}

// ── rehearsal: full choreography + forced failures, local only ───────────────

function phaseRehearse() {
  opts.local = true
  opts.dryRun = false
  const failures = []
  const check = (label, condition, detail) => {
    const verdict = condition ? 'PASS' : 'FAIL'
    console.log(`[rehearse] ${verdict}: ${label}${detail ? ` — ${detail}` : ''}`)
    if (!condition) failures.push(label)
  }

  console.log('[rehearse] === kb_figures atomic-swap rehearsal (LOCAL, disposable) ===')

  // Clean slate.
  for (const t of [LIVE, STAGING, OLD, 'kb_figures_rolledback']) {
    runSql(`DROP TABLE IF EXISTS ${t}`)
  }

  // Build two small datasets: "old live" (300 rows) and "new" (500 rows).
  const oldDir = join(ROOT, '.tmp', 'kb-d1-rehearse-old')
  const newDir = join(ROOT, '.tmp', 'kb-d1-rehearse-new')
  const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh', windowsHide: true })
  sh(`node scripts/build-kb-d1-sql.mjs --out ${oldDir} --limit 300`)
  sh(`node scripts/build-kb-d1-sql.mjs --out ${newDir} --table ${STAGING} --limit 500`)

  // Seed the fake live table (canonical name + canonical indexes, 300 rows).
  for (const file of readdirSync(oldDir).filter(f => f.endsWith('.sql')).sort()) {
    runSqlFile(join(oldDir, file))
  }
  check('seeded fake live table', rowCount(LIVE) === 300, `${LIVE}=${rowCount(LIVE)} rows`)

  // Load staging.
  for (const file of readdirSync(newDir).filter(f => f.endsWith('.sql')).sort()) {
    runSqlFile(join(newDir, file))
  }
  check('staging loaded alongside live', rowCount(STAGING) === 500 && rowCount(LIVE) === 300,
    `${STAGING}=${rowCount(STAGING)}, ${LIVE}=${rowCount(LIVE)}`)

  // Full 18-column verify against staging BY NAME (pre-rename gate).
  opts.expectRows = 500
  try {
    runVerify(STAGING)
    check('pre-rename 18-column verify on staging', true)
  } catch {
    check('pre-rename 18-column verify on staging', false)
  }
  opts.expectRows = null

  // ── Forced failure 1: first rename blocked (OLD name occupied) ─────────────
  runSql(`CREATE TABLE ${OLD} (blocker TEXT)`)
  const f1 = runSql(`ALTER TABLE ${LIVE} RENAME TO ${OLD}; ALTER TABLE ${STAGING} RENAME TO ${LIVE};`, { allowFail: true })
  check('forced-fail 1: batch errors when OLD name occupied', !f1.ok)
  check('forced-fail 1: live table untouched', tableExists(LIVE) && rowCount(LIVE) === 300, `${LIVE}=${tableExists(LIVE) ? rowCount(LIVE) : 'MISSING'}`)
  check('forced-fail 1: staging untouched', tableExists(STAGING) && rowCount(STAGING) === 500)
  runSql(`DROP TABLE ${OLD}`)

  // ── Forced failure 2: second rename blocked (staging gone mid-batch) ───────
  // This is THE atomicity probe: statement 1 succeeds in isolation, statement 2
  // cannot. If the batch is transactional, kb_figures must still exist after.
  runSql(`ALTER TABLE ${STAGING} RENAME TO kb_figures_hidden`)
  const f2 = runSql(`ALTER TABLE ${LIVE} RENAME TO ${OLD}; ALTER TABLE ${STAGING} RENAME TO ${LIVE};`, { allowFail: true })
  const liveStillThere = tableExists(LIVE)
  const oldNotCreated = !tableExists(OLD)
  check('forced-fail 2: batch errors when staging missing', !f2.ok)
  check('forced-fail 2: ATOMICITY — kb_figures still present after mid-batch failure', liveStillThere,
    liveStillThere ? `${LIVE}=${rowCount(LIVE)} rows` : 'kb_figures LOST — batch is NOT transactional, swap design is UNSAFE')
  check('forced-fail 2: no orphaned kb_figures_old', oldNotCreated)
  runSql(`ALTER TABLE kb_figures_hidden RENAME TO ${STAGING}`)

  // ── The real swap ──────────────────────────────────────────────────────────
  const sw = runSql(`ALTER TABLE ${LIVE} RENAME TO ${OLD}; ALTER TABLE ${STAGING} RENAME TO ${LIVE};`, { allowFail: true })
  check('swap: batch succeeded', sw.ok)
  check('swap: kb_figures now has the NEW data', rowCount(LIVE) === 500, `${LIVE}=${rowCount(LIVE)}`)
  check('swap: old data preserved as kb_figures_old', tableExists(OLD) && rowCount(OLD) === 300, `${OLD}=${tableExists(OLD) ? rowCount(OLD) : 'MISSING'}`)

  // Post-swap verify on the live name (500-row expectation).
  opts.expectRows = 500
  try {
    runVerify(LIVE)
    check('post-swap 18-column verify on live name', true)
  } catch {
    check('post-swap 18-column verify on live name', false)
  }
  opts.expectRows = null

  // ── Rollback drill (undo the swap we just did) ─────────────────────────────
  const rb = runSql(`ALTER TABLE ${LIVE} RENAME TO kb_figures_rolledback; ALTER TABLE ${OLD} RENAME TO ${LIVE};`, { allowFail: true })
  check('rollback: batch succeeded', rb.ok)
  check('rollback: kb_figures is the OLD data again', rowCount(LIVE) === 300, `${LIVE}=${rowCount(LIVE)}`)
  check('rollback: new data preserved as kb_figures_rolledback', tableExists('kb_figures_rolledback') && rowCount('kb_figures_rolledback') === 500)

  // ── Roll forward again and finalize (index normalization included) ─────────
  runSql(`ALTER TABLE ${LIVE} RENAME TO ${OLD}; ALTER TABLE kb_figures_rolledback RENAME TO ${LIVE};`)
  runSql(`DROP TABLE ${OLD}`)
  for (const idx of canonicalIndexes()) {
    const stagedName = idx.name.replace(LIVE, STAGING)
    runSql(`DROP INDEX IF EXISTS ${stagedName}`)
    runSql(`CREATE INDEX IF NOT EXISTS ${idx.name} ON ${LIVE} (${idx.columns})`)
  }
  const finalIdx = indexNames().filter(i => i.tbl_name === LIVE).map(i => i.name).sort()
  const wantIdx = canonicalIndexes().map(i => i.name).sort()
  check('finalize: canonical index names restored', JSON.stringify(finalIdx) === JSON.stringify(wantIdx), finalIdx.join(', '))
  check('finalize: live table intact after finalize', rowCount(LIVE) === 500, `${LIVE}=${rowCount(LIVE)}`)

  // Cleanup local rehearsal tables.
  for (const t of [LIVE, STAGING, OLD, 'kb_figures_rolledback']) {
    runSql(`DROP TABLE IF EXISTS ${t}`)
  }

  console.log('')
  if (failures.length) {
    console.error(`[rehearse] ${failures.length} FAILURES:\n  - ${failures.join('\n  - ')}`)
    process.exit(1)
  }
  console.log('[rehearse] ALL CHECKS PASSED — swap choreography, atomicity under forced mid-batch failure, rollback, and finalize all observed working on local D1.')
}

// ── remote atomicity probe: disposable names only, never touches kb_figures ──
// Local rehearsal proved the batch is transactional on miniflare's SQLite, but
// local ≠ the remote D1 service. This runs the SAME mid-batch-failure probe
// against remote using throwaway table names, so the executor can observe
// remote batch semantics before the real swap. Safe by construction: only
// swapprobe_* names are ever created, renamed, or dropped.
function phaseProbeAtomicity() {
  const A = 'swapprobe_a'
  const B = 'swapprobe_b'
  const failures = []
  const check = (label, condition, detail) => {
    console.log(`[probe] ${condition ? 'PASS' : 'FAIL'}: ${label}${detail ? ` — ${detail}` : ''}`)
    if (!condition) failures.push(label)
  }

  runSql(`DROP TABLE IF EXISTS ${A}`)
  runSql(`DROP TABLE IF EXISTS ${B}`)
  runSql(`CREATE TABLE ${A} (v TEXT)`)
  runSql(`INSERT INTO ${A} (v) VALUES ('probe')`)

  // Statement 1 succeeds in isolation; statement 2 must fail (no such table B).
  // Transactional batch ⇒ A keeps its name afterwards.
  const res = runSql(`ALTER TABLE ${A} RENAME TO ${A}_renamed; ALTER TABLE ${B} RENAME TO ${B}_renamed;`, { allowFail: true })
  check('batch errors on mid-batch failure', !res.ok)
  const aIntact = tableExists(A)
  const aRenamed = tableExists(`${A}_renamed`)
  check('ATOMICITY — first rename rolled back (table kept its original name)', aIntact && !aRenamed,
    aIntact ? `${A} present` : `${A} GONE, ${A}_renamed=${aRenamed} — batch is NOT transactional here, DO NOT run the swap`)

  runSql(`DROP TABLE IF EXISTS ${A}`)
  runSql(`DROP TABLE IF EXISTS ${A}_renamed`)

  console.log('')
  if (failures.length) {
    console.error(`[probe] FAILURES: ${failures.join('; ')} — the swap's atomicity assumption does NOT hold on this target. Stop.`)
    process.exit(1)
  }
  console.log(`[probe] atomicity holds on ${opts.local ? 'local' : 'REMOTE'} ${opts.db} — swap batch semantics confirmed transactional.`)
}

// ── dispatch ─────────────────────────────────────────────────────────────────

switch (phase) {
  case 'status': printStatus(); break
  case 'load': phaseLoad(); break
  case 'verify-staging': runVerify(STAGING); break
  case 'swap': phaseSwap(); break
  case 'verify-live': runVerify(LIVE); break
  case 'finalize': phaseFinalize(); break
  case 'rollback': phaseRollback(); break
  case 'rehearse': phaseRehearse(); break
  case 'probe-atomicity': phaseProbeAtomicity(); break
}
