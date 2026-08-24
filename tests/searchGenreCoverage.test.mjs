import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getAllFigures } from '../src/data/kb.ts'
import { searchGenreForFandom } from '../src/lib/genreFigures.ts'

/**
 * Drift guard: every KB fandom must reach a genre pill the search client knows.
 *
 * Origin (2026-07-27). This is the FOURTH appearance of one defect shape —
 * "one truth, several consumers, fixed in one" — and the first three were each
 * fixed as instances while the class survived:
 *   1. the sitemap emitted a genre URL per KB fandom with no hub-existence
 *      filter (7 dead URLs shipped to Google);
 *   2. the IndexNow queue built URLs from raw `fandom`;
 *   3. /api/v1/search assigned `genre: f.fandom` with no rollup, so the four
 *      NECA fandoms could never match a pill (fixed in Wave 1, 8692529).
 * Within a day of (3) shipping, an audit measured the same symptom still live
 * on a different query: `q=godzilla` returned 49 results tagged 'scifi', a slug
 * the client GENRES list has never had. Wave 1 fixed the instance; the class
 * was already reproducing.
 *
 * kbSearchFacets.test.mjs locks the NECA rollup, but it can only assert about
 * names it already knows — it structurally cannot catch a fandom nobody
 * remembered to map. This test can, because it enumerates the KB itself.
 *
 * GENRES lives inside a 'use client' component and is not exported, so it is
 * parsed as text — same tradeoff, and same justification, as
 * genre-hub-slugs.test.mjs: it is the only form that actually fails the build.
 */
describe('search genre coverage', () => {
  const searchSrc = readFileSync(
    new URL('../src/app/search/_components/SearchInterface.tsx', import.meta.url), 'utf8',
  )

  /** Slugs of the client-side GENRES array — the pills a user can actually click. */
  function clientGenreSlugs() {
    const start = searchSrc.indexOf('const GENRES = [')
    assert.notEqual(start, -1, 'GENRES declaration not found — did SearchInterface move or rename it?')
    const end = searchSrc.indexOf('] as const', start)
    assert.notEqual(end, -1, 'could not find the end of the GENRES literal')
    return new Set(
      [...searchSrc.slice(start, end).matchAll(/slug:\s*'([a-z0-9-]+)'/g)].map(m => m[1]),
    )
  }

  /**
   * Fandoms deliberately NOT mapped to a pill. Every entry needs a REASON —
   * this list exists so an unmapped fandom is a recorded decision, never an
   * oversight. Shrink it; do not grow it to make a failure go away.
   */
  const KNOWN_UNMAPPED = new Map([
    // generic-fantasy REMOVED 2026-07-30 -- folded into the 'dungeons-dragons'
    // hub (genreFigures.ts DUNGEONS_DRAGONS_FANDOMS) and given a search pill
    // (SearchInterface.tsx GENRES, slug 'generic-fantasy') per Steve's
    // decision, routed via WEBAUDIT-TO-WEB-GENERIC-FANTASY-DECISION-2026-07-30.md.
    // ufc REMOVED 2026-08-24 -- genre hub built (GENRE_META/GENRE_HUB_LABELS/
    // GENRE_ACCENT/GENRE_TAXONOMY) and given a search pill (SearchInterface.tsx
    // GENRES, slug 'ufc') in the same pass. See twin exception removal in
    // breadcrumbHubCoverage.test.mjs.
    ['metal-gear-solid', 'new fandom minted 2026-08-24 (matcher, 8 fids) -- ' +
      'no search pill built yet. Remove once a pill ships, same as ufc above.'],
    ['defenders-of-the-earth', 'new fandom minted 2026-08-24 (matcher, 6 fids, ' +
      'rekey off an old value) -- no search pill built yet. Remove once a pill ' +
      'ships, same as ufc above.'],
  ])

  test('the GENRES parser actually parsed something', () => {
    // Guard against the parser silently returning {} and this whole file passing vacuously.
    assert.ok(clientGenreSlugs().size > 10,
      `parsed only ${clientGenreSlugs().size} GENRES slugs — the parser is broken, not the data`)
  })

  test('every KB fandom maps to a pill the client knows, or is a recorded exception', () => {
    const known = clientGenreSlugs()
    const fandoms = new Set(getAllFigures().map(f => f.fandom))
    assert.ok(fandoms.size > 5, `only ${fandoms.size} KB fandoms found — KB load looks wrong`)

    const leaked = [...fandoms]
      .filter(f => !known.has(searchGenreForFandom(f)))
      .filter(f => !KNOWN_UNMAPPED.has(f))

    assert.deepEqual(leaked, [],
      `KB fandom(s) map to a genre the search client cannot render as a pill: ` +
      `${leaked.map(f => `${f} -> ${searchGenreForFandom(f)}`).join(', ')}. ` +
      `Figures in these fandoms show a raw-slug badge, get no pill row, and have their ` +
      `?genre= prefilter silently dropped by SearchInterface. Either map the fandom ` +
      `(NECA_FANDOMS or a new GENRES entry) or add it to KNOWN_UNMAPPED with a reason.`)
  })

  test('the KNOWN_UNMAPPED list has not gone stale', () => {
    // If a listed fandom starts resolving, or leaves the KB entirely, say so
    // loudly — a permanently-stale exception list is how the grandfathered dead
    // guide links survived for 10 days.
    const known = clientGenreSlugs()
    const fandoms = new Set(getAllFigures().map(f => f.fandom))

    const nowResolving = [...KNOWN_UNMAPPED.keys()].filter(f => known.has(searchGenreForFandom(f)))
    assert.deepEqual(nowResolving, [],
      `these fandoms now map correctly — remove them from KNOWN_UNMAPPED: ${nowResolving.join(', ')}`)

    const gone = [...KNOWN_UNMAPPED.keys()].filter(f => !fandoms.has(f))
    assert.deepEqual(gone, [],
      `these fandoms no longer exist in the KB — remove them from KNOWN_UNMAPPED: ${gone.join(', ')}`)
  })

  test('the NECA rollup covers the sub-fandoms it claims, and they all reach the neca pill', () => {
    for (const fandom of ['horror', 'aliens-predator', 'terminator', 'robocop', 'scifi', 'pop-culture']) {
      assert.equal(searchGenreForFandom(fandom), 'neca',
        `${fandom} must roll up to the 'neca' pill — raw '${fandom}' is not a GENRES slug`)
    }
    assert.ok(clientGenreSlugs().has('neca'), "'neca' must exist in GENRES for the rollup to render")
  })
})
