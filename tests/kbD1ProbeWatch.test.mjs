// Layer 2 probe runner (scripts/kb-d1-probe-http.mjs), site watch behavior.
// 2026-09-24: the live run refused on ONE Bot Fight 403 in 15 baseline samples. A lone 403 is a
// non-signal (CLAUDE.md truth #3), so the baseline retries it; but the watch must still fail closed
// when it really is blind, and stop the load if it goes blind mid-run. Everything here runs the real
// runner as a child process against local mock servers (a /query stub and a watch URL): no D1, no network.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import http from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RUNNER = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'kb-d1-probe-http.mjs')
const TABLE = 'kb_figures_probe'

// A synthetic --multirow emit: `statements` INSERTs of 2 rows each.
function makeEmit(statements) {
  const dir = mkdtempSync(join(tmpdir(), 'kb-d1-probe-test-'))
  const inserts = Array.from({ length: statements }, (_, i) => `INSERT INTO ${TABLE} (figure_id) VALUES ('s${i}a'),('s${i}b');`)
  writeFileSync(join(dir, 'stats.json'), JSON.stringify({ multirow: 2, table: TABLE, rowCount: statements * 2, statements, statementBytes: 100000 }))
  writeFileSync(join(dir, '000_schema.sql'), `-- test schema\nCREATE TABLE IF NOT EXISTS ${TABLE} (figure_id TEXT PRIMARY KEY);\n`)
  writeFileSync(join(dir, '001_load_0001.sql'), `-- rows: ${statements * 2}\n${inserts.join('\n')}\n`)
  return dir
}

// One server for both endpoints: POST /query is the D1 stub, anything else is the watch URL whose
// status is chosen per request number by `watch(n)`.
function startMock({ watch, queryDelayMs = 0 }) {
  const seen = { watch: 0, query: 0, drops: 0, rows: 0 }
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/query') {
      let body = ''
      req.on('data', (c) => { body += c })
      req.on('end', () => {
        seen.query += 1
        const { sql } = JSON.parse(body)
        let results = []
        let changes = 0
        if (/^\s*INSERT INTO/i.test(sql)) { changes = (sql.match(/\('/g) ?? []).length; seen.rows += changes }
        else if (/^\s*SELECT COUNT/i.test(sql)) results = [{ n: seen.rows }]
        else if (/^\s*DROP TABLE/i.test(sql)) seen.drops += 1
        setTimeout(() => {
          res.writeHead(200, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ success: true, result: [{ meta: { changes, duration: 1 }, results }] }))
        }, queryDelayMs)
      })
      return
    }
    seen.watch += 1
    res.writeHead(watch(seen.watch))
    res.end('ok')
  })
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done({ server, seen, base: `http://127.0.0.1:${server.address().port}` })))
}

function runRunner(dir, base, extra) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [RUNNER, '--dir', dir, '--api-base', base, '--watch-url', `${base}/watch`,
      '--baseline-samples', '5', '--watch-interval-ms', '250', '--retry-pause-ms', '100', '--p95-floor-ms', '5000', '--skip-parity', ...extra])
    let out = ''
    child.stdout.on('data', (c) => { out += c })
    child.stderr.on('data', (c) => { out += c })
    child.on('close', (code) => done({ code, out }))
  })
}

async function scenario({ watch, statements = 6, queryDelayMs = 0, extra = [] }) {
  const dir = makeEmit(statements)
  const mock = await startMock({ watch, queryDelayMs })
  try {
    const { code, out } = await runRunner(dir, mock.base, extra)
    const receiptPath = join(dir, 'probe-receipt.json')
    return { code, out, receipt: existsSync(receiptPath) ? JSON.parse(readFileSync(receiptPath, 'utf8')) : null, seen: mock.seen, dir }
  } finally {
    mock.server.closeAllConnections?.()
    await new Promise((done) => mock.server.close(done))
  }
}

const cleanup = (r) => rmSync(r.dir, { recursive: true, force: true })

describe('kb-d1-probe-http site watch', { concurrency: true }, () => {
  test('one 403 in the baseline is retried, recorded, and the run still passes', async () => {
    const r = await scenario({ watch: (n) => (n === 2 ? 403 : 200) })
    try {
      assert.equal(r.code, 0, r.out)
      assert.equal(r.receipt.pass, true, r.out)
      assert.equal(r.receipt.baseline.non200, 0)
      assert.equal(r.receipt.baseline.retried, 1)
      assert.deepEqual(r.receipt.baseline.noise, [403])
      assert.equal(r.receipt.rowsChanged, r.receipt.rows)
      assert.equal(r.receipt.countStar, r.receipt.rows)
      assert.equal(r.receipt.dropped, true)
    } finally { cleanup(r) }
  })

  test('a baseline that stays 403 after every retry fails closed: the load never starts', async () => {
    const r = await scenario({ watch: () => 403 })
    try {
      assert.equal(r.code, 1, r.out)
      assert.match(r.receipt.stop, /^watch blind: baseline statuses 403 \(5\/5 non-200 after 3 retries each; retried noise 403\)/)
      assert.equal(r.receipt.pass, false)
      assert.equal(r.seen.watch, 5 * 4, 'each of the 5 samples gets 1 attempt + 3 retries')
      assert.equal(r.seen.query, 0, 'no D1 request may be sent while the watch is blind')
    } finally { cleanup(r) }
  })

  test('a 5xx in the baseline is a real reading: never retried, and it blocks the load', async () => {
    const r = await scenario({ watch: (n) => (n === 3 ? 503 : 200) })
    try {
      assert.equal(r.code, 1, r.out)
      assert.equal(r.receipt.baseline.retried, 0)
      assert.ok(r.receipt.baseline.statuses.includes(503))
      assert.equal(r.seen.watch, 5, 'no retry on a 5xx')
      assert.equal(r.seen.query, 0)
    } finally { cleanup(r) }
  })

  test('the watch going blind mid-load stops the load, and the probe table is still dropped', async () => {
    const r = await scenario({
      watch: (n) => (n <= 5 ? 200 : 403), // 5 clean baseline samples, then Bot Fight closes the door
      statements: 40, queryDelayMs: 100, extra: ['--blind-trip', '3'],
    })
    try {
      assert.equal(r.code, 2, r.out)
      assert.equal(r.receipt.pass, false)
      assert.match(r.receipt.stop, /^watch went blind: 3 consecutive non-200 samples \(last 403\) mid-load/)
      assert.ok(r.receipt.watch.maxNon200Run >= 3)
      assert.ok(r.receipt.rowsChanged < r.receipt.rows, `load should have stopped early, wrote ${r.receipt.rowsChanged}/${r.receipt.rows}`)
      assert.equal(r.receipt.dropped, true)
      assert.ok(r.seen.drops >= 1)
    } finally { cleanup(r) }
  })

  test('--baseline-only: retries the noise, reports OK, touches no D1 and writes no receipt', async () => {
    const r = await scenario({ watch: (n) => (n === 2 ? 403 : 200), extra: ['--baseline-only'] })
    try {
      assert.equal(r.code, 0, r.out)
      assert.match(r.out, /baseline only, no D1 access/)
      assert.match(r.out, /retried 1 \(403\)/)
      assert.match(r.out, /OK, the p95 stop rule can be enforced/)
      assert.equal(r.seen.query, 0)
      assert.equal(r.receipt, null)
    } finally { cleanup(r) }
  })

  test('--baseline-only: a watch that stays blind exits 2 and says BLIND', async () => {
    const r = await scenario({ watch: () => 403, extra: ['--baseline-only'] })
    try {
      assert.equal(r.code, 2, r.out)
      assert.match(r.out, /BLIND \(watch blind: baseline statuses 403/)
      assert.equal(r.seen.query, 0)
      assert.equal(r.receipt, null)
    } finally { cleanup(r) }
  })
})
