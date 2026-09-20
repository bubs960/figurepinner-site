// passport-gate-fields-2 (matcher relay 2026-09-19, Steve ruling): for wrestling,
// original_retail_price is STRETCH — omitted when unresolved, rendered when
// resolved. Every other fandom keeps it CORE, and the jakks era profiles
// (classic-superstars, deluxe-aggression) were deliberately NOT demoted.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScalePassportGroups } from '../src/app/figure/[figure_id]/_lib/scalePassport.ts'

const RETAIL = 'identity_bonus.original_retail_price'

function fig(fandom, manufacturer, product_line, fields = {}) {
  return {
    fandom,
    manufacturer,
    product_line,
    passport: {
      fields: Object.fromEntries(Object.entries(fields).map(([k, value]) => [k, { value, ec: 'A' }])),
    },
  }
}

const rowsOf = groups => (groups ?? []).flatMap(g => g.rows)
const missingKeys = groups => rowsOf(groups).filter(r => r.status === 'missing').map(r => r.key)

test('wrestling (mattel/elite): unresolved retail price is omitted, not a gap', () => {
  const groups = buildScalePassportGroups(fig('wrestling', 'mattel', 'elite', { 'included_items[1]': 'Belt' }), [])
  assert.ok(!missingKeys(groups).includes(RETAIL))
  assert.ok(!rowsOf(groups).some(r => r.key === RETAIL))
})

test('wrestling (mattel/elite): the other four CORE fields still render as gaps', () => {
  const groups = buildScalePassportGroups(fig('wrestling', 'mattel', 'elite', { 'included_items[1]': 'Belt' }), [])
  assert.deepEqual(missingKeys(groups).sort(), [
    'fingerprint.attire_reference',
    'fingerprint.face_technology',
    'fingerprint.gear_colors',
    'fingerprint.head_sculpt',
  ])
})

test('wrestling: a RESOLVED retail price still renders', () => {
  const groups = buildScalePassportGroups(fig('wrestling', 'mattel', 'elite', { [RETAIL]: '$19.99' }), [])
  const row = rowsOf(groups).find(r => r.key === RETAIL)
  assert.equal(row?.status, 'resolved')
  assert.equal(row?.value, '$19.99')
})

test('non-wrestling (star-wars): retail price stays CORE and shows as a gap', () => {
  const groups = buildScalePassportGroups(fig('star-wars', 'hasbro', 'black-series', { 'included_items[1]': 'Blaster' }), [])
  assert.ok(missingKeys(groups).includes(RETAIL))
})

test('jakks classic-superstars + deluxe-aggression keep retail price CORE (era profiles not demoted)', () => {
  for (const line of ['classic-superstars', 'deluxe-aggression']) {
    const groups = buildScalePassportGroups(fig('wrestling', 'jakks-pacific', line, { 'included_items[1]': 'Belt' }), [])
    assert.ok(missingKeys(groups).includes(RETAIL), `${line} should still gap on retail price`)
  }
})
