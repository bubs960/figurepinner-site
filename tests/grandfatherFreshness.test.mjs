import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkGrandfatherExport, countUrlRows, MAX_AGE_HOURS, GSC_UI_CAP } from '../scripts/lib/grandfather-freshness.mjs'

// Corpus focus spec v3 §4.6 — tests/grandfatherFreshness.test.mjs:
// a stale, missing, shrunk, empty or UI-capped GSC export fails the build.

const dir = mkdtempSync(join(tmpdir(), 'gf-'))
const rows = (n) => 'URL,Last crawled\n' + Array.from({ length: n }, (_, i) => `https://figurepinner.com/p/${i},2026-09-01`).join('\n') + '\n'
const file = (name, n) => { const p = join(dir, name); writeFileSync(p, rows(n)); return p }
const ship = new Date('2026-09-15T05:00:00Z')

describe('grandfather export freshness gate', () => {
  test('missing export fails', () => {
    const r = checkGrandfatherExport({ path: join(dir, 'GSC-INDEXED-PAGES-2026-09-14.csv'), shipDate: ship, lastCommittedCount: 0 })
    assert.equal(r.ok, false); assert.equal(r.reason, 'missing')
  })
  test('fresh export (within 48 h of ship date) passes and reports rows + asof', () => {
    const r = checkGrandfatherExport({ path: file('GSC-INDEXED-PAGES-2026-09-14.csv', 1016), shipDate: ship, lastCommittedCount: 1016 })
    assert.equal(r.ok, true, r.reason); assert.equal(r.rows, 1016)
    assert.equal(r.asof.toISOString().slice(0, 10), '2026-09-14'); assert.ok(r.ageHours < MAX_AGE_HOURS)
  })
  test('stale export (older than 48 h relative to the ship date) fails', () => {
    const r = checkGrandfatherExport({ path: file('GSC-INDEXED-PAGES-2026-09-10.csv', 1016), shipDate: ship, lastCommittedCount: 0 })
    assert.equal(r.ok, false); assert.match(r.reason, /^stale/)
  })
  test('the same export is fresh for an earlier ship date (the 48-h rule moves with the date)', () => {
    const r = checkGrandfatherExport({ path: file('GSC-INDEXED-PAGES-2026-09-10.csv', 1016), shipDate: new Date('2026-09-11T05:00:00Z'), lastCommittedCount: 0 })
    assert.equal(r.ok, true, r.reason)
  })
  test('shrunk export (fewer rows than the last committed set) fails', () => {
    const r = checkGrandfatherExport({ path: file('GSC-INDEXED-PAGES-2026-09-14.csv', 900), shipDate: ship, lastCommittedCount: 1016 })
    assert.equal(r.ok, false); assert.match(r.reason, /^shrunk/)
  })
  test('exactly 1,000 rows = GSC UI cap, fails as truncated', () => {
    const r = checkGrandfatherExport({ path: file('GSC-INDEXED-PAGES-2026-09-14.csv', GSC_UI_CAP), shipDate: ship, lastCommittedCount: 0 })
    assert.equal(r.ok, false); assert.match(r.reason, /cap/)
  })
  test('empty export fails', () => {
    const p = join(dir, 'GSC-INDEXED-PAGES-2026-09-14.csv'); writeFileSync(p, 'URL,Last crawled\n')
    const r = checkGrandfatherExport({ path: p, shipDate: ship, lastCommittedCount: 0 })
    assert.equal(r.ok, false); assert.equal(r.reason, 'empty')
  })
  test('row counting tolerates BOM, CRLF and a header-less file', () => {
    assert.equal(countUrlRows('﻿URL\r\nhttps://a/1\r\nhttps://a/2\r\n'), 2)
    assert.equal(countUrlRows('https://a/1\nhttps://a/2\n'), 2)
    assert.equal(countUrlRows(''), 0)
  })
})
