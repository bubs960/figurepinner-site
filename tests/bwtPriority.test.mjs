import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchBingPageStats, rankPriorityUrls, pickPriority, nextPriorityState, PRIORITY_SLOTS } from '../scripts/lib/bwt-priority.mjs'

const H = 'figurepinner.com'
const row = (path, impressions, pos, host = 'https://figurepinner.com') => ({ Query: host + path, Clicks: 0, Impressions: impressions, AvgImpressionPosition: pos, Date: '/Date(1789257600000)/' })
const aboveBar = new Set([
  'https://figurepinner.com/guides/gi-joe-hub',
  'https://figurepinner.com/wrestling/elite/kane',
  'https://figurepinner.com/wrestling/basic/cm-punk',
  'https://figurepinner.com/',
])
const prettyByFid = { fp_kane: '/wrestling/elite/kane' }

test('rankPriorityUrls: positions 4-15 only, impressions-weighted, most impressions first', () => {
  const ranked = rankPriorityUrls(
    [
      row('/guides/gi-joe-hub', 100, 5), row('/guides/gi-joe-hub', 300, 6), // pos 5.75 over two weeks
      row('/wrestling/basic/cm-punk', 50, 4),
      row('/', 900, 2), // already top 3 -> not striking distance
      row('/wrestling/elite/kane', 10, 22), // too deep
    ],
    { host: H, prettyByFid, aboveBar },
  )
  assert.deepEqual(ranked.map((r) => r.url), ['https://figurepinner.com/guides/gi-joe-hub', 'https://figurepinner.com/wrestling/basic/cm-punk'])
  assert.equal(ranked[0].impressions, 400)
  assert.equal(ranked[0].pos, 5.8)
})

test('rankPriorityUrls: raw-fid URLs map to the pretty URL; unmapped, off-sitemap and foreign hosts are dropped', () => {
  const ranked = rankPriorityUrls(
    [
      row('/figure/fp_kane', 40, 6), // -> /wrestling/elite/kane
      row('/wrestling/elite/kane', 25, 8), // same canonical: keep the larger impression count, no duplicate
      row('/figure/fp_unknown', 99, 6), // no pretty path -> never submitted raw
      row('/search', 80, 5), // not sitemap-emitted
      row('/guides/gi-joe-hub', 70, 5, 'https://evil.example'),
      row('/guides/gi-joe-hub/', 30, 5, 'https://www.figurepinner.com'), // www + trailing slash normalise
    ],
    { host: H, prettyByFid, aboveBar },
  )
  assert.deepEqual(ranked, [
    { url: 'https://figurepinner.com/wrestling/elite/kane', impressions: 40, pos: 6 },
    { url: 'https://figurepinner.com/guides/gi-joe-hub', impressions: 30, pos: 5 },
  ])
})

test('pickPriority: cooldown and slot cap', () => {
  const ranked = Array.from({ length: 60 }, (_, i) => ({ url: 'https://figurepinner.com/p' + i, impressions: 100 - i, pos: 5 }))
  const state = { 'https://figurepinner.com/p0': '2026-09-10', 'https://figurepinner.com/p1': '2026-09-01' }
  const picks = pickPriority(ranked, state, { today: '2026-09-18' })
  assert.equal(picks.length, PRIORITY_SLOTS)
  assert.ok(!picks.includes('https://figurepinner.com/p0')) // 8 days ago: cooling down
  assert.equal(picks[0], 'https://figurepinner.com/p1') // 17 days ago: eligible again
  assert.deepEqual(pickPriority(ranked, {}, { today: '2026-09-18', slots: 3 }), ranked.slice(0, 3).map((r) => r.url))
  assert.deepEqual(pickPriority(ranked, {}, { today: '2026-09-18', slots: 0 }), [])
})

test('nextPriorityState: stamps what was sent, forgets entries older than 90 days', () => {
  const next = nextPriorityState({ a: '2026-05-01', b: '2026-09-01' }, ['c'], '2026-09-18')
  assert.deepEqual(next, { b: '2026-09-01', c: '2026-09-18' })
})

test('fetchBingPageStats: never throws, never leaks the key', async () => {
  const cfg = { key: 'SECRETKEY', siteUrl: 'https://figurepinner.com' }
  const ok = await fetchBingPageStats(cfg, { fetchImpl: async () => ({ ok: true, status: 200, text: async () => '{"d":[{"Query":"x"}]}' }) })
  assert.deepEqual(ok, { rows: [{ Query: 'x' }] })
  const bad = await fetchBingPageStats(cfg, { fetchImpl: async () => ({ ok: false, status: 400, text: async () => 'bad apikey=SECRETKEY' }) })
  assert.ok(bad.error && !bad.error.includes('SECRETKEY'))
  const boom = await fetchBingPageStats(cfg, { fetchImpl: async () => { throw new Error('reset SECRETKEY') } })
  assert.ok(boom.error && !boom.error.includes('SECRETKEY'))
})
