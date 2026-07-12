import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { figureUrl, prettyFigureUrlKey, genreSlugForFandom, SLUG_TO_FANDOM } from '../src/data/kbTypes.ts'
import { getAllFigures, hasUniquePrettyFigureUrl, prettyFigureUrl } from '../src/data/kb.ts'

describe('kbTypes pure helpers', () => {
  test('figureUrl is the stable /figure/<id> path', () => {
    assert.equal(figureUrl({ figure_id: 'fp_wrestling_abc123' }), '/figure/fp_wrestling_abc123')
  })

  test('prettyFigureUrlKey joins fandom/product_line/character_canonical', () => {
    assert.equal(
      prettyFigureUrlKey({ fandom: 'wrestling', product_line: 'elite', character_canonical: 'hulk-hogan' }),
      'wrestling/elite/hulk-hogan',
    )
  })
})

// prettyFigureUrl/hasUniquePrettyFigureUrl are pure functions of a single
// figure, but their real behavior (unique vs ambiguous) depends on a count
// map built from the entire live KB at module-load time. Hardcoding a
// specific figure_id as "known unique" or "known ambiguous" would be brittle
// (breaks the moment that figure's line grows another wave). Instead this
// checks the INVARIANT the function promises, self-consistently, against
// whatever the real KB currently contains — real regression coverage without
// coupling to today's exact KB content.
describe('prettyFigureUrl (real KB, structural invariants)', () => {
  const figures = getAllFigures()

  test('the live KB is non-empty (sanity: the data module loaded correctly)', () => {
    assert.ok(figures.length > 1000, `expected a real KB, got ${figures.length} figures`)
  })

  test('every figure\'s pretty URL matches its uniqueness verdict', () => {
    // Sampling, not the full ~22k figures, keeps this test fast; the modulo
    // stride still spreads the sample across every fandom/line in the array
    // rather than clustering on whatever sorts first.
    const stride = Math.max(1, Math.floor(figures.length / 500))
    for (let i = 0; i < figures.length; i += stride) {
      const f = figures[i]
      const url = prettyFigureUrl(f)
      assert.ok(url.startsWith('/'), `${f.figure_id}: pretty URL must be absolute-path, got ${url}`)
      if (hasUniquePrettyFigureUrl(f)) {
        // GENRE slug, never raw f.fandom (2026-07-12 root-cause fix): the
        // raw-fandom form pointed 2,289 canonicals/sitemap URLs at namespaces
        // with 404ing hubs and zero internal links, and Google refused to
        // index them — the July index collapse. This assertion is the spec.
        assert.equal(url, `/${genreSlugForFandom(f.fandom)}/${f.product_line}/${f.character_canonical}`, `${f.figure_id}: unique figure should get the keyword-rich URL in the GENRE-slug namespace`)
      } else {
        assert.equal(url, `/figure/${f.figure_id}`, `${f.figure_id}: ambiguous figure should fall back to the stable ID URL`)
      }
    }
  })

  test('no pretty URL ever starts with a remapped RAW fandom slug (the July-collapse bug shape)', () => {
    // The forbidden first segments are exactly the KB fandoms that have a
    // different site slug (values of SLUG_TO_FANDOM): marvel-comics, gi-joe,
    // tmnt, dungeons-dragons. A URL like /marvel-comics/... or /gi-joe/...
    // is a twin namespace with no hub and no internal links — the exact
    // defect behind the 22K→6K index collapse. Full sweep, not sampled:
    // this is the cheap deterministic guard the incident was missing.
    const forbidden = new Set(Object.values(SLUG_TO_FANDOM))
    for (const f of figures) {
      const url = prettyFigureUrl(f)
      const firstSegment = url.split('/')[1]
      assert.ok(!forbidden.has(firstSegment), `${f.figure_id}: pretty URL ${url} sits in the raw-fandom twin namespace /${firstSegment}/ — must use genreSlugForFandom`)
    }
  })

  test('hasUniquePrettyFigureUrl agrees with a from-scratch count over the same key', () => {
    const counts = new Map()
    for (const f of figures) {
      const key = prettyFigureUrlKey(f)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const stride = Math.max(1, Math.floor(figures.length / 500))
    for (let i = 0; i < figures.length; i += stride) {
      const f = figures[i]
      const expected = counts.get(prettyFigureUrlKey(f)) === 1
      assert.equal(hasUniquePrettyFigureUrl(f), expected, `${f.figure_id}: uniqueness mismatch`)
    }
  })
})
