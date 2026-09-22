// deriveName's slug-fallback branch (figures with no `name` and no `v1_name`).
// 2026-09-20 live read of the 581 such fids: raw-slug variants in titles
// ("(balor-club)"), nested parens ("(The Fiend (SummerSlam))"), and acronym
// casing ("Baf", "Bj", "Ufc Series"). See WEB-TO-MATCHER-BLANK-V1-NAME-LIVE-READ.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { deriveName } from '../src/data/kbTypes.ts'
import { prettifySlug } from '../src/app/figure/[figure_id]/_lib/figureFormatters.ts'
import { getAllFigures } from '../src/data/kb.ts'

// Only the fields deriveName reads. No name / v1_name => the fallback branch.
const fb = (character_canonical, product_line, over = {}) => ({
  character_canonical,
  product_line,
  character_variant: 'None',
  release_wave: '',
  ...over,
})

describe('deriveName slug fallback (no name, no v1_name)', () => {
  test('a slug variant is title-cased, not printed raw', () => {
    assert.equal(
      deriveName(fb('finn-balor', 'elite-top-picks', { character_variant: 'balor-club', release_wave: 'tp-2018' })),
      'Finn Balor (Balor Club) (Elite Top Picks)',
    )
    assert.equal(
      deriveName(fb('adam-copeland', 'big-rubber-guys', { character_variant: 'chase', release_wave: 'aew-1' })),
      'Adam Copeland (Chase) (Big Rubber Guys)',
    )
  })

  test('an already-parenthesised variant is flattened so it cannot nest', () => {
    const n = deriveName(fb('bray-wyatt', 'elite', { character_variant: 'The Fiend (SummerSlam)', release_wave: '77' }))
    assert.equal(n, 'Bray Wyatt (The Fiend · SummerSlam) (Elite Series 77)')
    assert.ok(!/\([^()]*\(/.test(n), `no nested parens in "${n}"`)
  })

  test('acronym tokens are upper-cased (BAF, BJ, UFC)', () => {
    assert.equal(deriveName(fb('galactus-baf', 'marvel-legends')), 'Galactus BAF (Marvel Legends)')
    assert.equal(deriveName(fb('bj-penn', 'ufc-series', { release_wave: 'deluxe-3' })), 'BJ Penn (UFC Series)')
  })

  test('unchanged: "None" variant omitted, numeric wave still adds "Series N"', () => {
    assert.equal(
      deriveName(fb('big-daddy-v-matt-striker', 'adrenaline', { release_wave: '31' })),
      'Big Daddy V Matt Striker (Adrenaline Series 31)',
    )
  })

  test('unchanged: an explicit name still wins over the fallback', () => {
    assert.equal(deriveName({ ...fb('bj-penn', 'ufc-series'), name: 'B.J. Penn (Deluxe 3)' }), 'B.J. Penn (Deluxe 3)')
  })
})

describe('acronym overrides reach the v1 branch too (series text via titleCaseValue)', () => {
  test('a BAF series is upper-cased', () => {
    const n = deriveName({
      ...fb('jervis-tetch', 'multiverse'),
      v1_name: 'Jervis Tetch',
      v1_line: 'Multiverse',
      v1_series: 'clock-king-baf',
    })
    assert.equal(n, 'Jervis Tetch (Multiverse · Clock King BAF)')
  })

  test('prettifySlug', () => {
    assert.equal(prettifySlug('ufc-series'), 'UFC Series')
    assert.equal(prettifySlug('baf'), 'BAF')
    assert.equal(prettifySlug('bj'), 'BJ')
    assert.equal(prettifySlug('elite-top-picks'), 'Elite Top Picks', 'a non-acronym slug is unchanged')
  })
})

describe('population sweep over the real KB (slug-fallback fids only)', () => {
  const fallback = getAllFigures().filter(f => !f.phantom && !f.duplicate_of && !f.name && !f.v1_name)

  test('the fallback population is real (regression guard on the sweep itself)', () => {
    assert.ok(fallback.length > 400, `expected a real fallback population, got ${fallback.length}`)
  })

  test('no fallback name has nested parens or a raw lower-case hyphen slug in parens', () => {
    const nested = fallback.map(deriveName).filter(n => /\([^()]*\(/.test(n))
    assert.deepEqual(nested, [], `nested parens: ${nested.slice(0, 3).join(' | ')}`)
    const rawSlug = fallback.map(deriveName).filter(n => /\([a-z0-9]+(?:-[a-z0-9]+)+\)/.test(n))
    assert.deepEqual(rawSlug, [], `raw slug variant: ${rawSlug.slice(0, 3).join(' | ')}`)
  })

  test('no fallback name still carries a mis-cased acronym', () => {
    const bad = fallback.map(deriveName).filter(n => /\b(Baf|Bj|Ufc)\b/.test(n))
    assert.deepEqual(bad, [], `mis-cased: ${bad.slice(0, 3).join(' | ')}`)
  })
})
