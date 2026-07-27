// Regression lock for the 2026-07-26 "fabricated Dec 31 sold dates" defect.
//
// formatDate() renders the date column of every comp row in MarketPanel — the
// surface whose entire pitch is "real eBay sold prices". Its old body was
// `try { new Date(iso).toLocaleDateString(...) } catch { return iso }`, which
// invented plausible dates instead of failing:
//   - new Date(null) is epoch 0, NOT an error, and formatted as a real-looking
//     "Dec 31" (1969 in any negative UTC offset). Observed on 19/19 comps of a
//     single figure, presented to users as genuine sale dates.
//   - new Date(undefined) / new Date('') are Invalid Date, whose
//     toLocaleDateString returns the literal string "Invalid Date".
// Date construction essentially never throws, so the catch was dead code.
//
// The contract these tests lock: a date we cannot trust renders as EMPTY, never
// as a guess. Silence is honest; a fabricated date is not.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatDate } from '../src/app/figure/[figure_id]/_lib/figureFormatters.ts'

describe('formatDate', () => {
  // NOTE: toLocaleDateString renders in the RUNNER's local timezone, so a
  // UTC-midnight input lands on the previous day anywhere west of Greenwich
  // (verified: '2026-04-18T00:00:00Z' → "Apr 17" at America/New_York). These
  // assertions use midday UTC so no real-world offset can shift the day, which
  // keeps the test honest on any machine and in CI. The one-day skew on
  // midnight-stamped comps is PRE-EXISTING display behaviour, untouched here —
  // flagged separately, not silently changed under a bug fix.
  test('formats a real ISO sold date', () => {
    assert.equal(formatDate('2026-04-18T12:00:00Z'), 'Apr 18')
  })

  test('formats a bare YYYY-MM-DD date to a "MMM D" shape', () => {
    // Deliberately not asserting the exact day: a bare date parses as UTC
    // midnight, so the rendered day is offset-dependent by design.
    assert.match(formatDate('2026-04-18'), /^[A-Z][a-z]{2} \d{1,2}$/)
  })

  test('null does not become epoch 0 ("Dec 31") — the shipped defect', () => {
    assert.equal(formatDate(null), '')
  })

  test('undefined and empty string render empty, not "Invalid Date"', () => {
    assert.equal(formatDate(undefined), '')
    assert.equal(formatDate(''), '')
  })

  test('an unparseable string renders empty rather than echoing itself back', () => {
    assert.equal(formatDate('not a date'), '')
    assert.equal(formatDate('Invalid Date'), '')
  })

  test('epoch 0 in any spelling is rejected', () => {
    assert.equal(formatDate('1970-01-01T00:00:00Z'), '')
    assert.equal(formatDate(new Date(0).toISOString()), '')
  })

  test('pre-eBay dates are rejected as upstream coercion, not sales', () => {
    // eBay launched in 1995; nothing before it can be a sold comp.
    assert.equal(formatDate('1969-12-31'), '')
    assert.equal(formatDate('1994-12-31'), '')
  })

  test('the 1995 floor does not eat legitimate modern dates', () => {
    assert.notEqual(formatDate('1995-06-15'), '')
    assert.notEqual(formatDate('2026-01-01'), '')
  })
})
