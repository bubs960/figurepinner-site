import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatShortDate, formatShortDateWithYear } from '../src/lib/safeDate.ts'

describe('formatShortDate', () => {
  test('formats month/day in UTC, no zero-padding on the day', () => {
    assert.equal(formatShortDate(new Date(Date.UTC(2026, 0, 1))), 'Jan 1')
    assert.equal(formatShortDate(new Date(Date.UTC(2026, 6, 15))), 'Jul 15')
    assert.equal(formatShortDate(new Date(Date.UTC(2026, 11, 31))), 'Dec 31')
  })

  test('every month index maps to its 3-letter abbreviation', () => {
    const expected = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let m = 0; m < 12; m++) {
      assert.equal(formatShortDate(new Date(Date.UTC(2026, m, 5))), `${expected[m]} 5`)
    }
  })

  test('epoch (1970-01-01T00:00:00Z)', () => {
    assert.equal(formatShortDate(new Date(0)), 'Jan 1')
  })

  test('a UTC time component does not shift the calendar day', () => {
    assert.equal(formatShortDate(new Date('2026-03-10T23:59:59.999Z')), 'Mar 10')
    assert.equal(formatShortDate(new Date('2026-03-10T00:00:00.000Z')), 'Mar 10')
  })

  test('leap day', () => {
    assert.equal(formatShortDate(new Date(Date.UTC(2028, 1, 29))), 'Feb 29')
  })

  test('documents current behavior: an invalid Date renders as the literal string "undefined NaN" rather than throwing or returning null', () => {
    // getUTCMonth()/getUTCDate() both return NaN for an invalid Date;
    // SHORT_MONTHS[NaN] is undefined, and template-literal interpolation
    // stringifies both to their default text. No validation guards this.
    assert.equal(formatShortDate(new Date('not a real date')), 'undefined NaN')
  })
})

describe('formatShortDateWithYear', () => {
  test('formats month/day/year in UTC, no zero-padding on the day', () => {
    assert.equal(formatShortDateWithYear(new Date(Date.UTC(2026, 0, 1))), 'Jan 1, 2026')
    assert.equal(formatShortDateWithYear(new Date(Date.UTC(2026, 6, 15))), 'Jul 15, 2026')
  })

  test('epoch year', () => {
    assert.equal(formatShortDateWithYear(new Date(0)), 'Jan 1, 1970')
  })

  test('year boundary — Dec 31 vs Jan 1 across a year rollover', () => {
    assert.equal(formatShortDateWithYear(new Date(Date.UTC(2025, 11, 31))), 'Dec 31, 2025')
    assert.equal(formatShortDateWithYear(new Date(Date.UTC(2026, 0, 1))), 'Jan 1, 2026')
  })

  test('documents current behavior: an invalid Date renders as "undefined NaN, NaN"', () => {
    assert.equal(formatShortDateWithYear(new Date('not a real date')), 'undefined NaN, NaN')
  })
})
