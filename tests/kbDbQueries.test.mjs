import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getAllFigures } from '../src/data/kb.ts'
import {
  SQL, FULL_COLS, CARD_COLS, ROUTE_COLS, IN_CHUNK, D1_MAX_BOUND_PARAMS,
  norm, compoundSplits, rowMatchesLineToken, lineQueryPlan, chunk, sortLikeFandomScan,
} from '../src/data/kbDbQueries.ts'

// OOM stage 2 (2026-09-02): kbDb.ts resolves every public route through
// indexed `col = ?` equalities instead of LOWER() scans. That is only the same
// predicate if the stored values are already normalized — so the invariant is
// asserted here over the WHOLE slim catalog, every build, and the batched line
// plan is proven equal to the old OR-expression on the array. SQL-level parity
// against a populated local D1 lives in scripts/kb-d1-parity-local.mjs.

const figures = getAllFigures()
const ROUTE_FIELDS = ['fandom', 'manufacturer', 'product_line', 'character_canonical']

describe('kb_figures route-field invariant (index-served equality depends on it)', () => {
  test('the live KB is non-empty (sanity: the data module loaded correctly)', () => {
    assert.ok(figures.length > 1000, `expected a real KB, got ${figures.length} figures`)
  })

  test('every route field is a lowercase, trimmed string on every figure (non-empty except manufacturer)', () => {
    const bad = []
    for (const f of figures) {
      for (const k of ROUTE_FIELDS) {
        const v = f[k]
        if (typeof v !== 'string' || v !== norm(v) || (k !== 'manufacturer' && v === '')) {
          bad.push(`${f.figure_id}.${k}=${JSON.stringify(v)}`)
        }
      }
    }
    assert.deepEqual(bad.slice(0, 20), [],
      `${bad.length} violation(s) — kbDb's \`col = ?\` predicates assume stored values are already normalized; ` +
      'fix the pour (or restore LOWER() in kbDbQueries.ts) before shipping')
  })
})

describe('compoundSplits', () => {
  test('one split per hyphen, ends included', () => {
    assert.deepEqual(compoundSplits('elite'), [])
    assert.deepEqual(compoundSplits('wwe-elite'), [{ manufacturer: 'wwe', product_line: 'elite' }])
    assert.deepEqual(compoundSplits('jakks-pacific-deluxe-aggression'), [
      { manufacturer: 'jakks', product_line: 'pacific-deluxe-aggression' },
      { manufacturer: 'jakks-pacific', product_line: 'deluxe-aggression' },
      { manufacturer: 'jakks-pacific-deluxe', product_line: 'aggression' },
    ])
    assert.deepEqual(compoundSplits('-elite'), [{ manufacturer: '', product_line: 'elite' }])
  })

  test("every figure's own compound splits back to exactly its (manufacturer, product_line)", () => {
    for (const f of figures) {
      const compound = `${f.manufacturer}-${f.product_line}`
      const hit = compoundSplits(compound).some(s => s.manufacturer === f.manufacturer && s.product_line === f.product_line)
      assert.ok(hit, `${f.figure_id}: ${compound} did not split back to its own pair`)
    }
  })
})

describe('line predicate: the batched index plan equals the old OR-expression scan', () => {
  // Old kbDb.getFiguresByLine (kbDb.ts @ f0bfac2):
  //   fandom = ? AND (LOWER(product_line) = ? OR LOWER(manufacturer || '-' || product_line) = ?)
  const oldMatch = (f, token) =>
    norm(f.product_line) === token || `${norm(f.manufacturer)}-${norm(f.product_line)}` === token
  // New plan: a (fandom, product_line) seek for the bare form plus one
  // (fandom, product_line, manufacturer) seek per hyphen split — modeled on the array.
  const newMatch = (f, token) =>
    f.product_line === token ||
    compoundSplits(token).some(s => f.manufacturer === s.manufacturer && f.product_line === s.product_line)

  test('identical row sets, in order, for every line token the catalog can produce, in every fandom', () => {
    const byFandom = new Map()
    for (const f of figures) {
      const list = byFandom.get(f.fandom) ?? []
      list.push(f)
      byFandom.set(f.fandom, list)
    }
    let tokensChecked = 0
    for (const [fandom, list] of byFandom) {
      const tokens = new Set()
      for (const f of list) {
        tokens.add(f.product_line)
        tokens.add(`${f.manufacturer}-${f.product_line}`)
      }
      for (const token of tokens) {
        const a = list.filter(f => oldMatch(f, token)).map(f => f.figure_id)
        const b = list.filter(f => newMatch(f, token)).map(f => f.figure_id)
        assert.deepEqual(b, a, `${fandom}/${token}: batched plan differs from the OR scan`)
        tokensChecked++
      }
    }
    assert.ok(tokensChecked > 100, `only ${tokensChecked} tokens checked`)
  })

  test('rowMatchesLineToken is that same predicate', () => {
    for (const f of figures) {
      assert.ok(rowMatchesLineToken(f, f.product_line), `${f.figure_id}: bare token`)
      assert.ok(rowMatchesLineToken(f, `${f.manufacturer}-${f.product_line}`), `${f.figure_id}: compound token`)
    }
  })

  test('lineQueryPlan: bare + one statement per hyphen, normalized params, indexed WHERE, no LOWER()', () => {
    const plan = lineQueryPlan('figure_id', 'wrestling', ' Jakks-Pacific-Deluxe-Aggression ')
    assert.equal(plan.length, 4)
    assert.deepEqual(plan[0].params, ['wrestling', 'jakks-pacific-deluxe-aggression'])
    assert.deepEqual(plan[2].params, ['wrestling', 'deluxe-aggression', 'jakks-pacific'])
    for (const q of plan) {
      assert.ok(q.sql.includes('WHERE fandom = ? AND product_line = ?'), q.sql)
      assert.ok(!/LOWER\(/.test(q.sql), q.sql)
    }
  })
})

describe('SQL contracts', () => {
  const statements = {
    figureById: SQL.figureById,
    figuresByIds: SQL.figuresByIds(3),
    figuresByCharacter: SQL.figuresByCharacter(ROUTE_COLS),
    waveCompanionsEmpty: SQL.waveCompanions(CARD_COLS, true),
    waveCompanions: SQL.waveCompanions(CARD_COLS, false),
    prettyUrlUniqueCount: SQL.prettyUrlUniqueCount,
    routeRowsForCharacters: SQL.routeRowsForCharacters(IN_CHUNK),
    cardsByFandom: SQL.cardsByFandom,
    lineWaveCounts: SQL.lineWaveCounts,
    allFandoms: SQL.allFandoms,
    linesByFandom: SQL.linesByFandom,
  }

  test('no LOWER() / LIKE on any public-route statement (stableSuffix is the documented exception)', () => {
    for (const [name, sql] of Object.entries(statements)) {
      assert.ok(!/LOWER\(/i.test(sql), `${name} uses LOWER(): ${sql}`)
      assert.ok(!/\bLIKE\b/i.test(sql), `${name} uses LIKE: ${sql}`)
    }
    assert.ok(/LOWER\(SUBSTR/.test(SQL.stableSuffix), 'stableSuffix is expected to keep its (documented) suffix scan')
  })

  test('every per-fandom statement pins fandom first so the (fandom, …) indexes apply', () => {
    for (const name of [
      'figuresByCharacter', 'waveCompanionsEmpty', 'waveCompanions', 'prettyUrlUniqueCount',
      'cardsByFandom', 'lineWaveCounts', 'linesByFandom',
    ]) {
      assert.ok(statements[name].includes('WHERE fandom = ?'), `${name} does not start its WHERE with fandom = ?`)
    }
    // The IN-list read is the documented exception: a fandom term makes the
    // planner range-scan the fandom instead of seeking the character index
    // (measured 20× slower locally); kbDb filters fandom in JS instead.
    assert.ok(!statements.routeRowsForCharacters.includes('fandom = ?'), 'routeRowsForCharacters must not carry a fandom term')
    assert.ok(statements.routeRowsForCharacters.includes('WHERE character_canonical IN ('))
  })

  test('set reads carry rowid so kbDb can restore the old fandom-scan order in JS', () => {
    for (const name of ['figuresByCharacter', 'waveCompanionsEmpty', 'waveCompanions', 'cardsByFandom']) {
      assert.ok(statements[name].startsWith('SELECT rowid AS rid, '), `${name} must select rowid AS rid first`)
    }
    for (const q of lineQueryPlan('figure_id', 'dc', 'multiverse')) assert.ok(q.sql.startsWith('SELECT rowid AS rid, '))
    const rows = [
      { rid: 9, product_line: 'elite', figure_id: 'c' },
      { rid: 2, product_line: 'legends', figure_id: 'd' },
      { rid: 5, product_line: 'elite', figure_id: 'b' },
      { rid: 1, product_line: 'elite', figure_id: 'a' },
    ]
    assert.deepEqual(sortLikeFandomScan(rows).map(r => r.figure_id), ['a', 'b', 'c', 'd'])
  })

  test('IN lists stay under the D1 bound-parameter limit', () => {
    assert.ok(IN_CHUNK + 1 <= D1_MAX_BOUND_PARAMS)
    assert.equal((SQL.routeRowsForCharacters(IN_CHUNK).match(/\?/g) ?? []).length, IN_CHUNK)
    assert.equal((SQL.figuresByIds(IN_CHUNK).match(/\?/g) ?? []).length, IN_CHUNK)
    assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  })

  test('projections nest: ROUTE ⊂ CARD = FULL minus exactly the two prose columns', () => {
    const cols = s => s.split(',').map(x => x.trim())
    const full = cols(FULL_COLS)
    const card = cols(CARD_COLS)
    const route = cols(ROUTE_COLS)
    assert.deepEqual(full.filter(c => !card.includes(c)), ['match_represented', 'key_features'])
    for (const c of route) assert.ok(card.includes(c), `${c} missing from CARD_COLS`)
    assert.ok(route.includes('manufacturer'), 'router-key counting needs manufacturer (2026-07-27 predicate)')
  })
})
