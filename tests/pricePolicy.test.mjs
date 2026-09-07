// Release S (2026-09-07): one comp-count policy across every pricing surface.
// The three tier helpers must agree at the two boundaries (3 and 10), and the
// methodology page must state the same bands it renders.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { priceCompTier, dataQualityState, MIN_COMPS_TO_QUOTE, TRUSTWORTHY_COMPS } from '../src/app/figure/[figure_id]/_lib/figureFormatters.ts'
import { confidenceForCount } from '../src/app/figure/[figure_id]/_lib/confidence.ts'

describe('price policy boundaries', () => {
  test('constants are 3 and 10', () => { assert.equal(MIN_COMPS_TO_QUOTE, 3); assert.equal(TRUSTWORTHY_COMPS, 10) })
  for (const [n, tier, state, conf] of [[0,'suppress','none','low'],[2,'suppress','sparse','low'],[3,'thin','limited','medium'],[9,'thin','limited','medium'],[10,'trustworthy','reliable','high'],[40,'trustworthy','reliable','high']]) {
    test(`${n} comps -> ${tier} / ${state} / ${conf}`, () => {
      assert.equal(priceCompTier(n), tier)
      assert.equal(dataQualityState(n), state)
      assert.equal(confidenceForCount(n).tier, conf)
    })
  }
  test('no surface still says n<8 or 4–9', () => {
    assert.ok(!confidenceForCount(7).passportLabel.includes('n<8'))
    const m = readFileSync(new URL('../src/app/methodology/page.tsx', import.meta.url), 'utf8')
    assert.ok(m.includes('3–9 comps') && m.includes('10+ comps') && m.includes('1–2 comps'))
    assert.ok(!m.includes('4–9 comps') && !m.includes('1–3 comps'))
  })
})
