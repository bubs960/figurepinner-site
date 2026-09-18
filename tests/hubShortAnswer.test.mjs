import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { hubShortAnswer } from '../src/app/guides/_lib/hubShortAnswer.ts'
import { planStep, HUBS } from '../scripts/refresh-fandom-hub-data.mjs'

const fig = (name, price, sold_count, line = 'Classified Series') => ({ figure_id: 'fp_' + name, name, line, price, sold_count, last_sold: null, flag: '', url: '/figure/fp_' + name })
const payload = (figures) => ({ fandom: 'gi-joe', generated_at: '2026-09-18T22:31:00.000Z', source: 'test', figures })

test('names the highest-priced TRUSTWORTHY comp, never a thin one above it', () => {
  const a = hubShortAnswer(payload([fig('Thin Grail', 1800, 6), fig('Cobra Rattler', 435, 19), fig('HISS Tank', 284, 50)]), { totalFigs: 1213, pricedFigs: 900 })
  assert.equal(a.name, 'Cobra Rattler')
  assert.equal(a.url, '/figure/fp_Cobra Rattler')
  assert.equal(a.afterName, ' (Classified Series) is the top of this market right now, a $435 median across 19 real eBay sales.')
  assert.equal(a.coverage, ' We track 1,213 figures here and 900 have live sold comps.')
  assert.equal(a.asOf, 'Sep 18, 2026')
})

test('no trustworthy comp, no payload, or a bad date -> no sentence', () => {
  assert.equal(hubShortAnswer(payload([fig('A', 500, 9), fig('B', 300, 3)]), { totalFigs: 10, pricedFigs: 5 }), null)
  assert.equal(hubShortAnswer(null, { totalFigs: 10, pricedFigs: 5 }), null)
  assert.equal(hubShortAnswer({ ...payload([fig('A', 500, 40)]), generated_at: 'not a date' }, { totalFigs: 1, pricedFigs: 1 }), null)
})

test('a hub without vault totals (the wrestling parent) omits the coverage sentence', () => {
  const a = hubShortAnswer(payload([fig('1-2-3 Kid', 871, 10, 'WWF Hasbro')]), { totalFigs: 0, pricedFigs: 0 })
  assert.equal(a.coverage, '')
  assert.ok(a.afterName.includes('$871 median across 10 real eBay sales'))
})

// The floor the generators now apply (MIN_COMPS = 3). Not a freshness gate on purpose: a
// date assertion here would fail the nightly train the moment the data aged.
test('committed hub payloads list no price built on fewer than 3 sold comps', () => {
  const under = []
  for (const family of ['fandom-top-comps', 'fandom-vaults', 'fandom-heroes-villains']) {
    const dir = new URL('../src/data/' + family + '/', import.meta.url)
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      const d = JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
      const rows = [...(d.figures ?? []), ...(d.heroes ?? []), ...(d.villains ?? []), ...(d.vaults ?? []).flatMap((v) => v.top ?? [])]
      for (const r of rows) if (!(r.sold_count >= 3)) under.push(family + '/' + f + ': ' + r.name + ' (' + r.sold_count + ' sold)')
    }
  }
  assert.deepEqual(under, [])
})

test('refresh plan: scoped hubs keep their scope, vaults are pinned to the lines the page already shows', () => {
  const elite = HUBS.find((h) => h.key === 'wwe-elite')
  const step = planStep(elite, 'vaults')
  assert.equal(step.argv[0], 'wrestling')
  assert.equal(step.env.MFR, 'mattel')
  assert.equal(step.env.OUT, 'wwe-elite')
  assert.ok(/^\^\(.*\belite\b.*\)\$$/.test(step.env.LINE_MATCH))
  const jakks = planStep(HUBS.find((h) => h.key === 'wrestling-jakks'), 'top-comps')
  assert.equal(jakks.env.LINE_EXCLUDE, '^tna')
  assert.equal(jakks.env.LINE_MATCH, undefined) // top comps stay maker-wide for Jakks
  const parent = HUBS.find((h) => h.key === 'wrestling')
  assert.deepEqual(parent.families, ['top-comps'])
  assert.equal(planStep(parent, 'top-comps').env.OUT, undefined)
})
