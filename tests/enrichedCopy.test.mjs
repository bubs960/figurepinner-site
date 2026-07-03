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

  test('null when over budget with no sentence boundary to truncate at', () => {
    assert.equal(enrichedDescription(fig('A'.repeat(300))), null)
  })
})
