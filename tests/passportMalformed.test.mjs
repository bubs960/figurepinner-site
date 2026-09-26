// 2026-09-27 (passport wave fix 2): parsePassportText accepted any non-array
// JSON object, but passportValue read `passport.fields[key]` and
// buildScalePassportGroups / waveHasBafEvidence call Object.entries/keys on
// `fields` — so a D1 cell of `{}` or `{"v":"figure-claims-2"}` threw inside a
// figure-page render. A passport without an object `fields` is now "no
// passport"; a valid block comes back exactly as parsed.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { parsePassportText, passportValue } from '../src/data/kbTypes.ts'
import { buildScalePassportGroups, waveHasBafEvidence } from '../src/app/figure/[figure_id]/_lib/scalePassport.ts'

const BASE_FIG = {
  figure_id: 'fp_wrestling_mattel_elite_51_aj-styles_c51dd2', v1_figure_id: '', fandom: 'wrestling',
  sub_fandom: null, character_canonical: 'aj-styles', character_variant: null, manufacturer: 'mattel',
  product_line: 'elite', release_wave: '51', scale: null, pack_size: 1, exclusive_to: null,
}

/** The same shape kbDb.mapRow builds: passport key only when parse succeeded. */
function figFromCell(text) {
  const passport = parsePassportText(text)
  return { ...BASE_FIG, ...(passport ? { passport } : {}) }
}

const MALFORMED_OBJECTS = [
  '{}',
  '{"v":"figure-claims-2"}',
  '{"fields":null}',
  '{"fields":[]}',
  '{"fields":[{"value":"x","ec":"y"}]}',
  '{"fields":"x"}',
  '{"fields":42}',
  '{"fields":true}',
  '{"v":"figure-claims-2","identity_hash":"h","poured_at":"2026-09-20","sidecar":"wrestling--elite--51"}',
]
const NOT_OBJECTS = [null, undefined, '', '   ', 'null', '[]', '"text"', '42', '{', 'not json']

const VALID = {
  v: 'figure-claims-2',
  identity_hash: 'abc',
  poured_at: '2026-09-20',
  sidecar: 'wrestling--elite--51',
  fields: {
    'wave_context.baf_piece': { value: 'Portion of the Boiler Room display stand', ec: 'corroborated_exact' },
    'fingerprint.head_sculpt': { value: 'Long hair, beard', ec: 'single_secondary' },
  },
  derived: { 'included_items[0]': 'AJ Styles figure' },
}

describe('parsePassportText rejects a passport whose `fields` is not an object', () => {
  for (const text of [...MALFORMED_OBJECTS, ...NOT_OBJECTS]) {
    test(`${JSON.stringify(text)} -> undefined`, () => {
      assert.equal(parsePassportText(text), undefined)
    })
  }

  test('a valid block comes back exactly as parsed (nothing stripped or rewritten)', () => {
    assert.deepEqual(parsePassportText(JSON.stringify(VALID)), VALID)
    // Unknown extra properties survive too — this is a gate, not a normalizer.
    const extra = { ...VALID, future_prop: { a: 1 } }
    assert.deepEqual(parsePassportText(JSON.stringify(extra)), extra)
    // An empty fields object is still a valid (if empty) passport.
    const empty = { ...VALID, fields: {} }
    assert.deepEqual(parsePassportText(JSON.stringify(empty)), empty)
  })
})

describe('the figure-page builders never throw on a malformed passport cell', () => {
  for (const text of [...MALFORMED_OBJECTS, ...NOT_OBJECTS]) {
    test(`${JSON.stringify(text)}: buildScalePassportGroups / waveHasBafEvidence / passportValue`, () => {
      const fig = figFromCell(text)
      assert.ok(!('passport' in fig))
      assert.doesNotThrow(() => buildScalePassportGroups(fig, [fig]))
      assert.equal(buildScalePassportGroups(fig, [fig]), null)
      assert.doesNotThrow(() => waveHasBafEvidence([fig, figFromCell(JSON.stringify(VALID))]))
      assert.equal(waveHasBafEvidence([fig]), false)
      assert.equal(passportValue(fig, 'wave_context.baf_piece'), null)
    })
  }

  test('a valid passport still drives the builders', () => {
    const fig = figFromCell(JSON.stringify(VALID))
    assert.equal(passportValue(fig, 'wave_context.baf_piece'), 'Portion of the Boiler Room display stand')
    assert.equal(waveHasBafEvidence([fig]), true)
    const groups = buildScalePassportGroups(fig, [fig])
    assert.ok(Array.isArray(groups) && groups.length > 0)
  })
})

describe('passportValue tolerates a fields-less passport object that bypassed the parser', () => {
  for (const passport of [{}, { fields: null }, { fields: undefined }, { v: 'figure-claims-2' }]) {
    test(JSON.stringify(passport), () => {
      assert.equal(passportValue({ ...BASE_FIG, passport }, 'wave_context.baf_piece'), null)
    })
  }
})
