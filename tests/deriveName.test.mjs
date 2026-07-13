import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { deriveName, isNumericWave, titleCaseValue } from '../src/data/kbTypes.ts'
import { getFigureById, getAllFigures } from '../src/data/kb.ts'

// MATCHER-TO-WEB-SEOSUMMARY-NONE-STRING-BUG-2026-07-12.md — three distinct
// bugs, all fixed in the same commit. This is the exact fid Steve caught
// live ("...is a None action figure...Series 3...2013 2014...").
const REPORTED_FID = 'fp_star-wars_hasbro_black-series_3-75-orange-2013_41st-elite-corps-clone-trooper_65c4e9'

describe('matcher NONE-string bug (2026-07-12) — regression', () => {
  test('the reported fid still exists in the live KB (sanity)', () => {
    assert.ok(getFigureById(REPORTED_FID), `expected ${REPORTED_FID} in the live KB`)
  })

  test('bug 2: release_wave "3-75-orange-2013" is correctly NOT a numeric wave', () => {
    // This is the root of the fabricated "Series 3" — parseInt() stopping at
    // the first non-digit character. isNumericWave must reject it outright.
    assert.equal(isNumericWave('3-75-orange-2013'), false)
    assert.equal(isNumericWave('26'), true, 'a real wave number must still pass')
    assert.equal(isNumericWave('1a'), true, 'a real lettered wave must still pass')
  })

  test('bug 3: titleCaseValue preserves a digit-digit year range, still splits normal slugs', () => {
    assert.equal(titleCaseValue('3.75 Orange 2013-2014'), '3.75 Orange 2013-2014',
      'a digit-hyphen-digit run is a real range, not a slug separator')
    assert.equal(titleCaseValue('black-series'), 'Black Series',
      'a normal letter-flanked slug hyphen must still split')
    assert.equal(titleCaseValue('elite-100'), 'Elite 100',
      'a letter-then-digit slug hyphen must still split')
  })

  test('deriveName on the reported fid produces the year range intact, no fabricated series', () => {
    const f = getFigureById(REPORTED_FID)
    const name = deriveName(f)
    assert.ok(name.includes('2013-2014'), `expected an intact year range in "${name}"`)
    assert.ok(!name.includes('2013 2014'), `year range must not be split apart in "${name}"`)
    assert.ok(!/Series 3\b/.test(name), `must not fabricate "Series 3" from the mangled release_wave in "${name}"`)
  })
})

// Bug 1 (the "is a None action figure" headline bug) lives in
// FigureDetailContent.tsx's scaleClean/exclusiveToClean constants, not in a
// separately-exported pure function — this sweep instead confirms the real
// population size the fix addresses, so the number in the commit message
// stays honest and re-checkable against the live KB rather than frozen text.
describe('matcher NONE-string bug — population sweep (documents blast radius, does not re-derive the fix)', () => {
  test('a large, real fraction of the KB has the literal "None" scale string', () => {
    const figures = getAllFigures()
    const noneScale = figures.filter(f => f.scale === 'None').length
    // Matcher's report: 10,986/22,790 (48%) at the time it was filed. Assert
    // a floor, not an exact count -- the KB grows independently of this fix
    // and this test's job is "still a real, large population", not "frozen
    // to one day's exact number".
    assert.ok(noneScale > 5000, `expected a large real population with scale==="None", got ${noneScale}`)
  })

  // webaudit's independent sentinel census (2026-07-13 review of daf5b74)
  // found two MORE junk exclusive_to literals the original fix didn't catch.
  // Same "document the real population, don't re-derive the guard" pattern
  // as the scale sweep above -- EXCLUSIVE_TO_JUNK lives inline in
  // FigureDetailContent.tsx (page-local, not worth extracting for one set).
  test('exclusive_to junk sentinels ("unspecified", "Exclusive") are a real, non-trivial population', () => {
    const figures = getAllFigures()
    const unspecified = figures.filter(f => f.exclusive_to === 'unspecified').length
    const exclusiveLiteral = figures.filter(f => f.exclusive_to === 'Exclusive').length
    // webaudit's census: 261 and 125 respectively. Floor, not exact count --
    // same reasoning as the scale sweep.
    assert.ok(unspecified > 100, `expected a real population with exclusive_to==="unspecified", got ${unspecified}`)
    assert.ok(exclusiveLiteral > 50, `expected a real population with exclusive_to==="Exclusive", got ${exclusiveLiteral}`)
  })
})
