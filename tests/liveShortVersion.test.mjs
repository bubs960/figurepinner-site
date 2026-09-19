import { test } from 'node:test'
import assert from 'node:assert/strict'
import { liveShortVersion } from '../src/app/guides/_lib/liveShortVersion.ts'
import { deriveLiveMedianView } from '../src/app/guides/_lib/liveMedianView.ts'

// Legacy-shape snapshots (no `decision` block) — what every live price summary looks like
// today; resolvePriceContract falls back to median_sold / sold_count for them.
const snap = (median_sold, sold_count) => ({ median_sold, avg_sold: median_sold, min_sold: 1, max_sold: 9999, sold_count })
const NOW = Date.parse('2026-09-18T12:00:00Z')

test('quotes only trustworthy comps (>= 10 sold), highest median first, at most three', () => {
  const blocks = [
    { fid: 'a', label: 'Sandtrooper and Dewback' },
    { fid: 'b', label: "Jabba's Rancor Pit" },
    { fid: 'c', label: 'Reva Force FX Lightsaber' }, // 8 sold: thin, never quoted
    { fid: 'd', label: 'Yoda & Clone Commander Gree' },
    { fid: 'e', label: 'Grand Admiral Thrawn' },
  ]
  const comps = new Map([['a', snap(120, 25)], ['b', snap(375, 50)], ['c', snap(246.49, 8)], ['d', snap(140, 34)], ['e', snap(114.56, 30)]])
  assert.equal(
    liveShortVersion(blocks, comps, NOW),
    "From live eBay sold data: Jabba's Rancor Pit medians $375 across 50 sold; Yoda & Clone Commander Gree at $140 across 34 sold; Sandtrooper and Dewback at $120 across 25 sold. Check your exact release:",
  )
})

test('cents survive, thousands group, duplicate fids count once', () => {
  const out = liveShortVersion(
    [{ fid: 'x', label: 'Tarkin and Vader' }, { fid: 'x', label: 'Tarkin and Vader (again)' }, { fid: 'y', label: 'Thrawn' }],
    new Map([['x', snap(1850, 31)], ['y', snap(114.56, 30)]]),
    NOW,
  )
  assert.equal(out, 'From live eBay sold data: Tarkin and Vader medians $1,850 across 31 sold; Thrawn at $114.56 across 30 sold. Check your exact release:')
})

test('fewer than two quotable comps -> no box (the AEW / Hulk Hogan guides today)', () => {
  const blocks = [{ fid: 'a', label: 'Death Triangle 3-Pack' }, { fid: 'b', label: 'Rey Fenix Supreme' }, { fid: 'c', label: 'Okada' }]
  assert.equal(liveShortVersion(blocks, new Map([['a', snap(147.5, 3)], ['b', snap(122.83, 7)]]), NOW), null)
  assert.equal(liveShortVersion(blocks, new Map([['a', snap(147.5, 40)]]), NOW), null)
  assert.equal(liveShortVersion([], new Map(), NOW), null)
})

test('never quotes a number the comp card itself would not show', () => {
  const blocks = [{ fid: 'a', label: 'A' }, { fid: 'b', label: 'B' }, { fid: 'c', label: 'C' }]
  const comps = new Map([['a', snap(300, 40)], ['b', snap(200, 12)], ['c', snap(null, 0)]])
  const out = liveShortVersion(blocks, comps, NOW)
  for (const b of blocks) {
    const v = deriveLiveMedianView(comps.get(b.fid), NOW)
    if (!v.hasData) assert.ok(!out.includes(b.label + ' '), b.label + ' has no card number but was quoted')
  }
  assert.ok(out.startsWith('From live eBay sold data: A medians $300 across 40 sold; B at $200 across 12 sold.'))
})
