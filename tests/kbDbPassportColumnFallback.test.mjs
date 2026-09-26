import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getFigureById } from '../src/data/kbDb.ts'
import { SQL, FULL_COLS, FULL_COLS_NO_PASSPORT } from '../src/data/kbDbQueries.ts'

// 2026-09-27 (passport wave fix 3, swap-rollback safety net): FULL_COLS selects
// `passport`, which only exists on a kb_figures built by the 19-column loader.
// A kb-d1-swap rollback to a pre-passport kb_figures_old would make every
// FULL_COLS read throw `no such column: passport`. getFigureById — and ONLY
// getFigureById — retries once with FULL_COLS_NO_PASSPORT. These tests pin:
// the fallback fires on exactly that error, fires once, returns the figure
// without a passport, never swallows any other error, and a healthy table
// never takes it.

const CLOUDFLARE_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__')

const ROW = {
  figure_id: 'fp_wrestling_mattel_elite_51_aj-styles_c51dd2', fandom: 'wrestling', character_canonical: 'aj-styles',
  manufacturer: 'mattel', product_line: 'elite', sub_fandom: null, character_variant: null, release_wave: '51',
  scale: null, pack_size: '1', exclusive_to: null, canonical_image_url: null, name: 'AJ Styles', v1_name: null,
  v1_line: null, v1_series: null, match_represented: 'mr', key_features: 'kf',
}
const PASSPORT = { v: 'figure-claims-2', identity_hash: 'h', poured_at: '2026-09-20', sidecar: 'wrestling--elite--51', fields: {} }

const selects = (sql, col) => /^SELECT (.*?) FROM /.exec(sql)[1].split(',').map(c => c.trim()).includes(col)

/**
 * mode 'healthy'         — 19-column table: passport selectable.
 * mode 'no-passport'     — 18-column table: any SELECT naming passport throws D1's column error.
 * mode 'other-error'     — every statement throws a non-column error.
 */
function makeFakeKbDb(mode) {
  const seen = []
  const session = {
    prepare(sql) {
      let params = []
      return {
        bind(...p) { params = p; return this },
        async first() {
          seen.push({ sql, params })
          if (mode === 'other-error') throw new Error('D1_ERROR: no such table: kb_figures: SQLITE_ERROR')
          if (mode === 'no-passport' && selects(sql, 'passport')) {
            throw new Error('D1_ERROR: no such column: passport at offset 250: SQLITE_ERROR')
          }
          return mode === 'healthy' ? { ...ROW, passport: JSON.stringify(PASSPORT) } : { ...ROW }
        },
        async all() { throw new Error('unexpected .all()') },
        async run() { throw new Error('unexpected .run()') },
      }
    },
    async batch() { throw new Error('unexpected batch') },
  }
  return { fakeD1: { withSession: () => session }, seen }
}

async function withFakeKbDb(mode, t, fn) {
  const { fakeD1, seen } = makeFakeKbDb(mode)
  const warn = t.mock.method(console, 'warn', () => {})
  const previous = globalThis[CLOUDFLARE_CONTEXT_SYMBOL]
  globalThis[CLOUDFLARE_CONTEXT_SYMBOL] = { env: { KB_DB: fakeD1 } }
  try {
    return await fn(seen, warn)
  } finally {
    globalThis[CLOUDFLARE_CONTEXT_SYMBOL] = previous
    warn.mock.restore()
  }
}

describe('FULL_COLS_NO_PASSPORT', () => {
  test('is FULL_COLS minus exactly passport, same order, 18 columns', () => {
    const cols = s => s.split(',').map(x => x.trim())
    assert.deepEqual(cols(FULL_COLS_NO_PASSPORT), cols(FULL_COLS).filter(c => c !== 'passport'))
    assert.equal(cols(FULL_COLS_NO_PASSPORT).length, 18)
    assert.equal(SQL.figureByIdNoPassport, SQL.figureById.replace(FULL_COLS, FULL_COLS_NO_PASSPORT))
  })
})

describe('getFigureById passport-column fallback (swap rollback only)', () => {
  test('healthy table: one FULL_COLS read, passport set, fallback never taken', async t => {
    await withFakeKbDb('healthy', t, async (seen, warn) => {
      const f = await getFigureById(ROW.figure_id)
      assert.equal(seen.length, 1)
      assert.equal(seen[0].sql, SQL.figureById)
      assert.deepEqual(f.passport, PASSPORT)
      assert.equal(warn.mock.callCount(), 0)
    })
  })

  test('no passport column: first read throws the column error, one retry without passport returns the figure', async t => {
    await withFakeKbDb('no-passport', t, async (seen, warn) => {
      const f = await getFigureById(ROW.figure_id)
      assert.deepEqual(seen.map(s => s.sql), [SQL.figureById, SQL.figureByIdNoPassport], 'exactly one retry, no loop')
      assert.deepEqual(seen[1].params, [ROW.figure_id])
      assert.ok(!selects(seen[1].sql, 'passport'))
      assert.equal(f.figure_id, ROW.figure_id)
      assert.equal(f.match_represented, 'mr', 'the prose columns still come back')
      assert.ok(!('passport' in f), 'the row simply has no passport')
      assert.equal(warn.mock.callCount(), 1)
      assert.match(String(warn.mock.calls[0].arguments[0]), /FULL_COLS_NO_PASSPORT/)
    })
  })

  test('any other error is NOT swallowed and takes no fallback', async t => {
    await withFakeKbDb('other-error', t, async (seen, warn) => {
      await assert.rejects(getFigureById(ROW.figure_id), /no such table: kb_figures/)
      assert.equal(seen.length, 1, 'no second statement for a non-column error')
      assert.equal(warn.mock.callCount(), 0)
    })
  })
})
