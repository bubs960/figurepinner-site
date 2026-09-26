import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getWaveCompanions } from '../src/data/kbDb.ts'
import { SQL, CARD_COLS, FULL_COLS, WAVE_COMPANION_COLS } from '../src/data/kbDbQueries.ts'
import { passportValue } from '../src/data/kbTypes.ts'
import { waveHasBafEvidence } from '../src/app/figure/[figure_id]/_lib/scalePassport.ts'

// 2026-09-27 (passport wave fix 1): getWaveCompanions read CARD_COLS, which has
// no `passport`, yet the figure page calls passportValue(f,
// 'wave_context.baf_piece') on every companion (the BAF sublabel) and
// waveHasBafEvidence(fullWave) over the whole wave. Neither could ever see a
// passport, so both were dead. The read now selects WAVE_COMPANION_COLS
// (CARD_COLS + passport, never the two prose columns). Same statements, same
// WHERE, same params, same row count — only the projection changed. The fake
// D1 below records every statement so this file pins all of that.

const CLOUDFLARE_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__')

function makeFakeKbDb(rows) {
  const seen = []
  const session = {
    prepare(sql) {
      let params = []
      return {
        bind(...p) { params = p; return this },
        async first() { seen.push({ sql, params }); return rows[0] ?? null },
        async all() { seen.push({ sql, params }); return { results: rows.map(r => ({ ...r })) } },
        async run() { return { meta: { changes: 0, last_row_id: 0 } } },
      }
    },
    async batch() { throw new Error('getWaveCompanions must not batch') },
  }
  return { fakeD1: { withSession: () => session }, seen }
}

async function withFakeKbDb(rows, fn) {
  const { fakeD1, seen } = makeFakeKbDb(rows)
  const previous = globalThis[CLOUDFLARE_CONTEXT_SYMBOL]
  globalThis[CLOUDFLARE_CONTEXT_SYMBOL] = { env: { KB_DB: fakeD1 } }
  try {
    return await fn(seen)
  } finally {
    globalThis[CLOUDFLARE_CONTEXT_SYMBOL] = previous
  }
}

const cols = s => s.split(',').map(x => x.trim())
const selectedCols = sql => cols(/^SELECT (.*?) FROM /.exec(sql)[1])

const BAF_PASSPORT = {
  v: 'figure-claims-2',
  identity_hash: 'h',
  poured_at: '2026-09-20',
  sidecar: 'wrestling--elite--51',
  fields: { 'wave_context.baf_piece': { value: 'A portion of the full Boiler Room display stand', ec: 'single_secondary' } },
}

function row(overrides) {
  return {
    rid: 1, figure_id: 'x', fandom: 'wrestling', character_canonical: 'x', manufacturer: 'mattel',
    product_line: 'elite', sub_fandom: null, character_variant: null, release_wave: '51', scale: null,
    pack_size: '1', exclusive_to: null, canonical_image_url: null, name: null, v1_name: null,
    v1_line: null, v1_series: null, passport: null,
    ...overrides,
  }
}

const WAVE_ROWS = [
  row({ rid: 3, figure_id: 'fp_mankind', character_canonical: 'mankind', passport: JSON.stringify(BAF_PASSPORT) }),
  row({ rid: 1, figure_id: 'fp_aj', character_canonical: 'aj-styles' }),
  row({ rid: 2, figure_id: 'fp_roman', character_canonical: 'roman-reigns' }),
]

describe('WAVE_COMPANION_COLS projection', () => {
  test('is exactly CARD_COLS plus passport — never the two prose columns', () => {
    assert.deepEqual(cols(WAVE_COMPANION_COLS), [...cols(CARD_COLS), 'passport'])
    assert.ok(!cols(WAVE_COMPANION_COLS).includes('match_represented'))
    assert.ok(!cols(WAVE_COMPANION_COLS).includes('key_features'))
    for (const c of cols(WAVE_COMPANION_COLS)) assert.ok(cols(FULL_COLS).includes(c), `${c} is not a kb_figures column`)
  })
})

describe('getWaveCompanions reads passport (BAF sublabel + wave-has-BAF can render)', () => {
  for (const [label, wave, expectedParams, expectedWhere] of [
    ['numbered wave', '51', ['wrestling', 'elite', '51'], 'WHERE fandom = ? AND product_line = ? AND release_wave = ?'],
    ['empty wave', '', ['wrestling', 'elite'], "WHERE fandom = ? AND product_line = ? AND (release_wave IS NULL OR release_wave = '')"],
  ]) {
    test(`${label}: one statement, selects passport, no prose, WHERE and params unchanged`, async () => {
      await withFakeKbDb(WAVE_ROWS, async seen => {
        const out = await getWaveCompanions('wrestling', 'elite', wave)
        assert.equal(seen.length, 1, 'exactly one D1 statement')
        const { sql, params } = seen[0]
        const selected = selectedCols(sql)
        assert.ok(selected.includes('passport'), `companion SQL must select passport: ${sql}`)
        assert.ok(!selected.includes('match_represented'), `companion SQL must not select match_represented: ${sql}`)
        assert.ok(!selected.includes('key_features'), `companion SQL must not select key_features: ${sql}`)
        assert.deepEqual(params, expectedParams)
        // Only the projection changed: swapping the column list back to
        // CARD_COLS reproduces the pre-fix statement byte for byte.
        assert.equal(sql.replace(WAVE_COMPANION_COLS, CARD_COLS), SQL.waveCompanions(CARD_COLS, wave === ''))
        assert.ok(sql.endsWith(expectedWhere), sql)
        assert.equal(out.length, WAVE_ROWS.length, 'row count unchanged')
      })
    })
  }

  test('a companion row carrying passport JSON comes back with passport set; passportValue returns the BAF piece', async () => {
    await withFakeKbDb(WAVE_ROWS, async () => {
      const out = await getWaveCompanions('wrestling', 'elite', '51')
      // rid order (sortLikeFandomScan) unchanged by the projection.
      assert.deepEqual(out.map(f => f.figure_id), ['fp_aj', 'fp_roman', 'fp_mankind'])
      const mankind = out.find(f => f.figure_id === 'fp_mankind')
      assert.deepEqual(mankind.passport, BAF_PASSPORT)
      assert.equal(passportValue(mankind, 'wave_context.baf_piece'), 'A portion of the full Boiler Room display stand')
      // Rows without a passport keep the exact pre-column shape (no key at all).
      const aj = out.find(f => f.figure_id === 'fp_aj')
      assert.ok(!('passport' in aj))
      assert.equal(passportValue(aj, 'wave_context.baf_piece'), null)
      // Delta 1 (wave-scoped BAF core rows) can now fire.
      assert.equal(waveHasBafEvidence(out), true)
    })
  })

  test('a wave with no passports still reports no BAF evidence', async () => {
    await withFakeKbDb(WAVE_ROWS.map(r => ({ ...r, passport: null })), async () => {
      const out = await getWaveCompanions('wrestling', 'elite', '51')
      assert.equal(waveHasBafEvidence(out), false)
      for (const f of out) assert.ok(!('passport' in f))
    })
  })
})
