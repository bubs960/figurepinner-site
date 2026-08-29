import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { enrichedDescription } from '../src/app/figure/[figure_id]/_lib/enrichedCopy.ts'

// NOTE ON SCOPE: enrichedDescription also gates on DUPLICATE_TEXTS, a set
// built once at module-load time from the REAL KB (getAllFigures()). That
// gate is intentionally NOT covered here — a synthetic fixture's text can't
// land in the real KB's duplicate set without either mocking the KB module
// (which the project has no tooling for) or hardcoding today's actual
// duplicate KB text into a test (which would silently stop testing anything
// the moment the KB changes). The other four gates below are pure per-figure
// logic and fully covered.

function fig(match_represented) {
  return { figure_id: 'fp_test_0', character_canonical: 'test', match_represented }
}

describe('enrichedDescription', () => {
  test('null when match_represented is missing or blank', () => {
    assert.equal(enrichedDescription(fig(undefined)), null)
    assert.equal(enrichedDescription(fig('')), null)
    assert.equal(enrichedDescription(fig('   ')), null)
  })

  test('null when shorter than the 30-char minimum', () => {
    assert.equal(enrichedDescription(fig('Too short to ship.')), null)
  })

  test('null when it contains internal QA / hedge language', () => {
    assert.equal(
      enrichedDescription(fig('This figure is pending photo verification before listing.')),
      null,
    )
    assert.equal(
      enrichedDescription(fig('Details are not confirmed in our records at this time.')),
      null,
    )
  })

  test('null when it contains a placeholder/artifact marker', () => {
    assert.equal(
      enrichedDescription(fig('This release has a TBD date pending further research notes.')),
      null,
    )
    assert.equal(
      enrichedDescription(fig('Value details are undefined for this particular release today.')),
      null,
    )
  })

  test('passes clean text under the meta budget through unchanged', () => {
    const text = 'A vintage-era release valued for its screen-accurate sculpt and rare card variant.'
    assert.equal(enrichedDescription(fig(text)), text)
  })

  test('truncates at the last sentence boundary within the 200-char budget', () => {
    const first = 'A'.repeat(50) + '. '
    const longText = first + 'B'.repeat(300)
    assert.equal(enrichedDescription(fig(longText)), 'A'.repeat(50) + '.')
  })

  // Word-boundary fallback — webaudit-approved truncation policy + amendment
  // (WEBAUDIT-TO-WEB-KEYFEATURES-PASS-TRUNCATION-APPROVED-AMENDED-2026-08-29)
  test('falls back to last-space cut + ellipsis when no sentence boundary fits', () => {
    const words = ('word '.repeat(60)).trim() // 299 chars, no sentence boundary
    const out = enrichedDescription(fig(words))
    assert.ok(out !== null, 'long boundary-less prose must recover, not null')
    assert.ok(out.endsWith('…'), `must end with ellipsis: ${out.slice(-10)}`)
    assert.ok(out.length <= 200, `must fit meta budget: ${out.length}`)
    assert.ok(!/[ ,;:&"'()\-]…$/.test(out), 'no space/punct before the ellipsis')
  })

  test('amendment: trailing punctuation stripped before the ellipsis', () => {
    const text = 'He won the title at KeyArena in Seattle, ' + 'w'.repeat(180) + ' end'
    // Force the cut to land right after "Seattle," — build a string where the
    // last space under budget follows a comma.
    const comma = 'x'.repeat(190) + ' comma, ' + 'y'.repeat(100)
    const out = enrichedDescription(fig(comma))
    assert.ok(out !== null && out.endsWith('…'))
    assert.ok(!out.includes(',…'), `comma must be stripped before ellipsis: ${out.slice(-12)}`)
    void text
  })

  test('null when over budget with no space to cut at (single unbroken token)', () => {
    assert.equal(enrichedDescription(fig('A'.repeat(300))), null)
  })
})
