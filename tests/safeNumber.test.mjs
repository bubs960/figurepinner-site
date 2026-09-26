import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatGroupedNumber } from '../src/lib/safeNumber.ts'

describe('formatGroupedNumber — grouping and sign', () => {
  test('numbers under 1000 get no comma', () => {
    assert.equal(formatGroupedNumber(0), '0')
    assert.equal(formatGroupedNumber(5), '5')
    assert.equal(formatGroupedNumber(999), '999')
  })

  test('thousands get comma-grouped from the right in groups of 3', () => {
    assert.equal(formatGroupedNumber(1000), '1,000')
    assert.equal(formatGroupedNumber(1234), '1,234')
    assert.equal(formatGroupedNumber(1234567), '1,234,567')
    assert.equal(formatGroupedNumber(999999999), '999,999,999')
  })

  test('negative numbers keep the sign outside the grouped digits', () => {
    assert.equal(formatGroupedNumber(-1234), '-1,234')
    assert.equal(formatGroupedNumber(-999), '-999')
    assert.equal(formatGroupedNumber(-1234567), '-1,234,567')
  })

  test('documents current behavior: negative zero has no minus sign', () => {
    // (-0).toFixed(0) === '0' in JS (no leading '-'), so this function never
    // sees a '-' to strip/keep for -0, and correctly reports "0".
    assert.equal(formatGroupedNumber(-0), '0')
  })

  test('fractionDigits > 0 pads/rounds via toFixed, fraction part is never grouped', () => {
    assert.equal(formatGroupedNumber(1234.5, 2), '1,234.50')
    assert.equal(formatGroupedNumber(1234.567, 2), '1,234.57') // rounds
    assert.equal(formatGroupedNumber(0, 2), '0.00')
    assert.equal(formatGroupedNumber(1234567.891, 3), '1,234,567.891')
  })

  test('fractionDigits default is 0 (no decimal point emitted)', () => {
    assert.equal(formatGroupedNumber(1234.9), '1,235') // toFixed(0) rounds
    assert.ok(!formatGroupedNumber(1234.9).includes('.'))
  })

  test('negative numbers with fraction digits', () => {
    assert.equal(formatGroupedNumber(-1234.5, 1), '-1,234.5')
  })

  test('boundary: exactly 3, 4, 6, 7 digit integers group at every 3rd digit from the right', () => {
    assert.equal(formatGroupedNumber(100), '100')
    assert.equal(formatGroupedNumber(1000), '1,000')
    assert.equal(formatGroupedNumber(100000), '100,000')
    assert.equal(formatGroupedNumber(1000000), '1,000,000')
  })

  test('documents current behavior: NaN and Infinity pass through toFixed\'s own string form, ungrouped (no digit runs to group)', () => {
    assert.equal(formatGroupedNumber(NaN), 'NaN')
    assert.equal(formatGroupedNumber(Infinity), 'Infinity')
    assert.equal(formatGroupedNumber(-Infinity), '-Infinity')
  })

  test('documents current behavior: a negative fractionDigits throws, delegating to Number.prototype.toFixed\'s own range check', () => {
    // toFixed only accepts 0-100; this function does not validate its
    // fractionDigits argument before passing it straight through.
    assert.throws(() => formatGroupedNumber(1234, -1), RangeError)
    assert.throws(() => formatGroupedNumber(1234, 101), RangeError)
  })

  test('fractionDigits at the valid extremes (0 and 100) does not throw', () => {
    assert.equal(formatGroupedNumber(1234, 0), '1,234')
    assert.doesNotThrow(() => formatGroupedNumber(1234, 100))
  })
})
