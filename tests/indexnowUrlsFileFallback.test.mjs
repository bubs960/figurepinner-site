import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 9/25 follow-up to the guides hand-submit: IndexNow has 403'd every night since 9/12 (Bot Fight
// Mode blocks its key-file verification), and only --delta fell back to the BWT URL Submission
// API, so a hand-picked --urls-file list sent nothing. --urls-file now falls back the same way;
// every other mode must NOT (they are not "changed/new only" sets and would spend the BWT daily
// quota the nightly --delta run owns).
//
// scripts/indexnow-ping.mjs runs as a subprocess with fetch replaced by tests/fixtures/
// indexnowFetchStub.mjs: no network, no real BWT key, instant retry delay. cwd is a temp dir, so
// .indexnow-failures.jsonl lands there and the repo stays clean.

const SCRIPT = fileURLToPath(new URL('../scripts/indexnow-ping.mjs', import.meta.url))
const STUB = pathToFileURL(fileURLToPath(new URL('./fixtures/indexnowFetchStub.mjs', import.meta.url))).href
const URLS = ['https://figurepinner.com/guides/a', 'https://figurepinner.com/guides/b', 'https://figurepinner.com/guides/c']
const BWT_ENV = { BWT_API_KEY: 'TESTKEY-not-real', BWT_SITE_URL: 'https://figurepinner.com' }

function run(args, env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'indexnow-fallback-'))
  const stubLog = join(dir, 'calls.jsonl')
  const urlsFile = join(dir, 'urls.txt')
  writeFileSync(stubLog, '')
  writeFileSync(urlsFile, URLS.join('\n') + '\n')

  const childEnv = { ...process.env, STUB_LOG: stubLog, USERPROFILE: dir, HOME: dir, ...env }
  // The real machine key and the full-submit switch must never leak into a stubbed run.
  for (const k of ['BWT_API_KEY', 'BWT_SITE_URL', 'INDEXNOW_FULL']) if (!(k in env)) delete childEnv[k]

  const r = spawnSync(process.execPath, ['--import', STUB, SCRIPT, ...args.map((a) => (a === '<file>' ? urlsFile : a))], {
    cwd: dir,
    env: childEnv,
    encoding: 'utf8',
    timeout: 30000,
  })
  const readLines = (p) => (existsSync(p) ? readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [])
  return {
    status: r.status,
    out: (r.stdout || '') + (r.stderr || ''),
    calls: readLines(stubLog),
    failures: readLines(join(dir, '.indexnow-failures.jsonl')),
  }
}

const bwtBatches = (calls) => calls.filter((c) => c.svc === 'bwt-batch')
// The trailing sitemap ping to IndexNow fails too, and is logged as batch 'sitemap-ping' (no urls).
const urlFailures = (failures) => failures.filter((f) => f.batch !== 'sitemap-ping')

describe('indexnow-ping --urls-file BWT fallback', () => {
  test('IndexNow rejects, BWT accepts: BWT gets the whole list and no re-submit record is left', () => {
    const r = run(['--urls-file', '<file>'], { STUB_INDEXNOW: '403', ...BWT_ENV })
    assert.equal(r.status, 0)
    assert.deepEqual(bwtBatches(r.calls).map((c) => c.urls), [URLS])
    assert.match(r.out, /urls-file: BWT fallback bwt-200 — submitted 3\/3/)
    assert.deepEqual(urlFailures(r.failures), [])
    assert.ok(!r.out.includes('TESTKEY'), 'the BWT key must never be printed')
  })

  test('no BWT key: fallback is skipped and the batch is failure-logged for a later re-run', () => {
    const r = run(['--urls-file', '<file>'], { STUB_INDEXNOW: '403' })
    assert.equal(r.status, 0)
    assert.deepEqual(bwtBatches(r.calls), [])
    assert.match(r.out, /urls-file: no BWT_API_KEY configured/)
    const logged = urlFailures(r.failures)
    assert.equal(logged.length, 1)
    assert.deepEqual(logged[0].urls, URLS)
    assert.equal(logged[0].status, 403)
  })

  test('BWT rejects the batch: the URLs are failure-logged with both statuses', () => {
    const r = run(['--urls-file', '<file>'], { STUB_INDEXNOW: '403', STUB_BWT_BATCH: '500', ...BWT_ENV })
    assert.equal(r.status, 0)
    assert.match(r.out, /urls-file: BWT fallback bwt-500 — submitted 0\/3/)
    const logged = urlFailures(r.failures)
    assert.equal(logged.length, 1)
    assert.deepEqual(logged[0].urls, URLS)
    assert.equal(logged[0].status, 'indexnow-403+bwt-500')
  })

  test('BWT quota smaller than the list: only the unsent tail is failure-logged', () => {
    const r = run(['--urls-file', '<file>'], { STUB_INDEXNOW: '403', STUB_BWT_DAILY: '1', ...BWT_ENV })
    assert.equal(r.status, 0)
    assert.deepEqual(bwtBatches(r.calls).map((c) => c.urls), [URLS.slice(0, 1)])
    assert.match(r.out, /urls-file: BWT fallback bwt-200 — submitted 1\/3/)
    const logged = urlFailures(r.failures)
    assert.equal(logged.length, 1)
    assert.deepEqual(logged[0].urls, URLS.slice(1))
  })

  test('IndexNow accepts: BWT is never called and nothing is failure-logged', () => {
    const r = run(['--urls-file', '<file>'], { STUB_INDEXNOW: '200', ...BWT_ENV })
    assert.equal(r.status, 0)
    assert.deepEqual(r.calls.filter((c) => c.svc.startsWith('bwt')), [])
    assert.match(r.out, /batch 1\/1 accepted \(200\)/)
    assert.deepEqual(r.failures, [])
  })

  test('scope guard: explicit-URL mode does NOT fall back to BWT (only --urls-file does)', () => {
    const r = run([URLS[0]], { STUB_INDEXNOW: '403', ...BWT_ENV })
    assert.equal(r.status, 0)
    assert.deepEqual(r.calls.filter((c) => c.svc.startsWith('bwt')), [])
    assert.ok(urlFailures(r.failures).length >= 1, 'the rejected batch is still failure-logged, as before')
  })
})
