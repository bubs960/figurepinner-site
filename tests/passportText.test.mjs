// D1 kb_figures.passport (matcher PR #38) holds the slim KB's passport object as JSON text;
// kbDb.mapRow turns it back into the object the figure page renders (web step 3, 2026-09-24).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePassportText } from '../src/data/kbTypes.ts'
import { FULL_COLS, CARD_COLS, ROUTE_COLS } from '../src/data/kbDbQueries.ts'
import { getAllFigures } from '../src/data/kb.ts'

const cols = (s) => s.split(',').map((x) => x.trim())

test('passport rides FULL_COLS (the figure page) and never the card or route projections', () => {
  assert.ok(cols(FULL_COLS).includes('passport'), 'FULL_COLS must select passport')
  assert.ok(!cols(CARD_COLS).includes('passport'), 'card rows stay light')
  assert.ok(!cols(ROUTE_COLS).includes('passport'), 'route-key rows stay light')
  assert.equal(cols(FULL_COLS).length, 19)
})

test('parsePassportText: absent, empty, non-object or broken JSON degrade to undefined and never throw', () => {
  for (const bad of [null, undefined, '', '   ', 'null', '[]', '[1,2]', '"text"', '42', 'true', '{', '{"v":', 'not json']) {
    assert.equal(parsePassportText(bad), undefined, `input ${JSON.stringify(bad)}`)
  }
})

test('parsePassportText: a valid object comes back as that object', () => {
  const p = { v: 'figure-claims-2', identity_hash: 'abc', poured_at: '2026-08-13', sidecar: 'wrestling--elite--6', fields: { scale: { value: '6in', ec: 'corroborated_exact' } } }
  assert.deepEqual(parsePassportText(JSON.stringify(p)), p)
})

test('parsePassportText round-trips every real passport in the slim KB (what the loader stores is what the page reads)', () => {
  const withPassport = getAllFigures().filter((f) => f.passport)
  assert.ok(withPassport.length >= 1000, `expected 1,000+ figures with a passport, saw ${withPassport.length}`)
  for (const f of withPassport) {
    assert.deepEqual(parsePassportText(JSON.stringify(f.passport)), f.passport, f.figure_id)
  }
})
