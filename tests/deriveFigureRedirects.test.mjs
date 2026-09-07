// Release P (2026-09-06): the generated duplicate_of -> survivor redirect map.
// Fixture tests pin the derivation rules; the composition tests pin how the
// generated map and the hand map combine. tests/figureIdRedirects.test.mjs keeps
// drift-gating the MERGED map against the live slim KB.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { deriveFigureRedirects } from '../scripts/lib/derive-figure-redirects.mjs'
import { FIGURE_ID_REDIRECTS, HAND_FIGURE_ID_REDIRECTS } from '../src/data/figure-id-redirects.ts'

const require = createRequire(import.meta.url)
const generated = require('../src/data/figure-id-redirects.generated.json')
const rec = (figure_id, duplicate_of) => ({ figure_id, duplicate_of })

describe('deriveFigureRedirects', () => {
  test('emits dup -> survivor when the source is gone and the target is servable', () => {
    const { map, stats } = deriveFigureRedirects([rec('fp_a_1', 'fp_a_2'), rec('fp_a_2', '')], new Set(['fp_a_2']))
    assert.deepEqual(map, { fp_a_1: 'fp_a_2' })
    assert.equal(stats.emitted, 1)
  })
  test('skips a source that is still servable (a live source never consults the map)', () => {
    const { map, stats } = deriveFigureRedirects([rec('fp_a_1', 'fp_a_2')], new Set(['fp_a_1', 'fp_a_2']))
    assert.deepEqual(map, {})
    assert.equal(stats.sourceStillServable, 1)
  })
  test('skips a target that is not servable (falls through to 404 by design)', () => {
    const { map, stats } = deriveFigureRedirects([rec('fp_a_1', 'fp_gone')], new Set(['fp_other']))
    assert.deepEqual(map, {})
    assert.equal(stats.targetMissing, 1)
  })
  test('follows a dup -> dup -> survivor chain to the survivor (single hop in the output)', () => {
    const { map, stats } = deriveFigureRedirects([rec('fp_a_1', 'fp_a_2'), rec('fp_a_2', 'fp_a_3')], new Set(['fp_a_3']))
    assert.deepEqual(map, { fp_a_1: 'fp_a_3', fp_a_2: 'fp_a_3' })
    assert.equal(stats.chainsResolved, 1)
  })
  test('drops self-references and cycles', () => {
    const { map, stats } = deriveFigureRedirects([rec('fp_s', 'fp_s'), rec('fp_c1', 'fp_c2'), rec('fp_c2', 'fp_c1')], new Set())
    assert.deepEqual(map, {})
    assert.equal(stats.selfOrCycle, 3)
  })
  test('ignores records without duplicate_of, empty strings and malformed rows', () => {
    const { map, stats } = deriveFigureRedirects([rec('fp_x', ''), { figure_id: 'fp_y' }, null, rec(42, 'fp_z')], new Set(['fp_z']))
    assert.deepEqual(map, {})
    assert.equal(stats.candidates, 0)
  })
  test('output keys are sorted so the committed file diffs stably', () => {
    const { map } = deriveFigureRedirects([rec('fp_b', 'fp_t'), rec('fp_a', 'fp_t')], new Set(['fp_t']))
    assert.deepEqual(Object.keys(map), ['fp_a', 'fp_b'])
  })
})

describe('FIGURE_ID_REDIRECTS composition', () => {
  test('hand entries win over generated entries', () => {
    for (const [source, target] of Object.entries(HAND_FIGURE_ID_REDIRECTS)) {
      assert.equal(FIGURE_ID_REDIRECTS[source], target, `hand entry overridden: ${source}`)
    }
  })
  test('every generated entry is present unless a hand entry overrides it', () => {
    for (const [source, target] of Object.entries(generated)) {
      const expected = source in HAND_FIGURE_ID_REDIRECTS ? HAND_FIGURE_ID_REDIRECTS[source] : target
      assert.equal(FIGURE_ID_REDIRECTS[source], expected, `generated entry missing: ${source}`)
    }
  })
  test('generated map is non-empty (the KB currently carries duplicate_of records)', () => {
    assert.ok(Object.keys(generated).length > 0)
  })
})
