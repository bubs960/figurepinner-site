import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { figureUrl, prettyFigureUrlKey, genreSlugForFandom, SLUG_TO_FANDOM } from '../src/data/kbTypes.ts'
import { getAllFigures, hasUniquePrettyFigureUrl, prettyFigureUrl } from '../src/data/kb.ts'
import { buildPrettyUrlMap, prettyFigureUrlFromMap } from '../src/data/kbDb.ts'

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

// kb.ts (build-time array) and kbDb.ts (Option E's request-time D1 reader)
// build the SAME pretty URL from two different data representations. kb.ts
// carries its own fix (b01e823); kbDb.ts's prettyFigureUrlFromMap (the
// sitemap bulk path) carried the identical raw-fandom bug independently
// (WEBAUDIT-FINAL-CYCLE-PLAN-2026-07-12.md §4 C1) — this is the guard that
// makes the eventual Option E cutover safe. kbDb's D1-bound single-figure
// prettyFigureUrl() can't run in this plain node:test harness (no live D1
// binding here); it shares the exact same URL-construction branch as
// prettyFigureUrlFromMap immediately below it in kbDb.ts, both grep-verified
// fixed — see the W1 packet for the byte evidence on that one.
describe('kb vs kbDb pretty-URL parity (Option E migration guard)', () => {
  const figures = getAllFigures()
  // buildPrettyUrlMap expects the same {figure_id, fandom, product_line,
  // character_canonical} shape kbDb's D1 rows have — the live KB array
  // already carries all four fields, so it doubles as a realistic SitemapRow
  // source without needing a real D1 binding in this test environment.
  const counts = buildPrettyUrlMap(figures)

  // Circular-validation guard (feedback_guardrail_circular_validation): the
  // expected URL is reconstructed from genreSlugForFandom directly, never
  // read back from either prettyFigureUrl/prettyFigureUrlFromMap under test
  // — so a shared-but-wrong implementation in both modules can't pass silently.
  function expectedUrl(f) {
    return counts.get(prettyFigureUrlKey(f)) === 1
      ? `/${genreSlugForFandom(f.fandom)}/${f.product_line}/${f.character_canonical}`
      : `/figure/${f.figure_id}`
  }

  test('kb.ts and kbDb.ts emit identical URLs for the same figures, sample includes all 4 remapped fandoms', () => {
    // Sample MUST include every remapped fandom (marvel-comics, gi-joe, tmnt,
    // dungeons-dragons) — a plain stride sample can miss a sparsely
    // represented fandom entirely, and this is exactly the bug class that
    // hides in an under-sampled fandom.
    const remapped = new Set(Object.values(SLUG_TO_FANDOM))
    const remappedSample = figures.filter(f => remapped.has(f.fandom))
    assert.ok(remappedSample.length > 0, 'expected at least one figure from a remapped fandom in the live KB')

    const stride = Math.max(1, Math.floor(figures.length / 500))
    const strideSample = figures.filter((_, i) => i % stride === 0)
    const sample = [...new Map([...strideSample, ...remappedSample].map(f => [f.figure_id, f])).values()]

    for (const f of sample) {
      const kbUrl = prettyFigureUrl(f)
      const dbUrl = prettyFigureUrlFromMap(f, counts)
      const expected = expectedUrl(f)
      assert.equal(kbUrl, expected, `${f.figure_id}: kb.ts diverged from the independently-computed expected URL`)
      assert.equal(dbUrl, expected, `${f.figure_id}: kbDb.ts diverged from the independently-computed expected URL`)
      assert.equal(kbUrl, dbUrl, `${f.figure_id}: kb.ts and kbDb.ts disagree (${kbUrl} vs ${dbUrl})`)
    }
  })

  test('kbDb.prettyFigureUrlFromMap never emits a raw-fandom twin-namespace URL (twin-namespace guard, extended to kbDb)', () => {
    // Extends the existing kb.ts full-sweep guard (53ff081) to kbDb's output
    // — full sweep, not sampled, same as the original guard's own rationale.
    const forbidden = new Set(Object.values(SLUG_TO_FANDOM))
    for (const f of figures) {
      const url = prettyFigureUrlFromMap(f, counts)
      const firstSegment = url.split('/')[1]
      assert.ok(!forbidden.has(firstSegment), `${f.figure_id}: kbDb pretty URL ${url} sits in the raw-fandom twin namespace /${firstSegment}/ — must use genreSlugForFandom`)
    }
  })
})
