import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { GENRE_HUB_SLUGS, NECA_FANDOMS, hubGenreForFandom } from '../src/lib/genreFigures.ts'

/**
 * Drift guard for the genre-hub slug list.
 *
 * Origin (2026-07-26): src/app/sitemap.ts emitted a genre URL for every KB
 * fandom, while src/app/[genre]/page.tsx notFound()s on any slug missing from
 * its GENRE_META. Nothing tied the two together, so the live sitemap shipped 7
 * dead URLs (32% of its genre entries) to Google. An external audit found it;
 * the project board had even recorded 4 of them as "correctly rolling up to
 * /neca" because a fix had landed in a DIFFERENT consumer (the IndexNow queue)
 * and was never wired into the sitemap.
 *
 * GENRE_META cannot be imported here — Next.js restricts which exports a page
 * file may declare — so this parses the page as text instead. Ugly, but it is
 * the only thing that actually fails the build when the two lists diverge, and
 * a silent divergence is precisely what caused the bug.
 */
describe('genre hub slugs', () => {
  const pageSrc = readFileSync(
    new URL('../src/app/[genre]/page.tsx', import.meta.url), 'utf8',
  )

  // Keys of the GENRE_META object literal: the block from its declaration to
  // the first line that closes it at column 0.
  function genreMetaKeys() {
    const start = pageSrc.indexOf('const GENRE_META')
    assert.notEqual(start, -1, 'GENRE_META declaration not found — did the page move or rename it?')
    const end = pageSrc.indexOf('\n}', start)
    assert.notEqual(end, -1, 'could not find the end of the GENRE_META literal')
    const body = pageSrc.slice(start, end)
    return new Set([...body.matchAll(/^\s{2}'([a-z0-9-]+)':/gm)].map(m => m[1]))
  }

  test('GENRE_HUB_SLUGS exactly matches GENRE_META keys', () => {
    const meta = genreMetaKeys()
    assert.ok(meta.size > 10, `parsed only ${meta.size} GENRE_META keys — the parser is probably broken, not the data`)

    const missing = [...meta].filter(s => !GENRE_HUB_SLUGS.has(s))
    const extra = [...GENRE_HUB_SLUGS].filter(s => !meta.has(s))

    assert.deepEqual(missing, [],
      `GENRE_META has hub(s) the sitemap will never link to: ${missing.join(', ')}`)
    assert.deepEqual(extra, [],
      `GENRE_HUB_SLUGS lists hub(s) with no GENRE_META entry — the sitemap would emit 404s: ${extra.join(', ')}`)
  })

  test('every NECA-family fandom maps to the /neca hub, not its own dead URL', () => {
    for (const fandom of NECA_FANDOMS) {
      assert.equal(hubGenreForFandom(fandom), 'neca',
        `${fandom} must roll up to /neca — its own genre URL 404s`)
    }
  })

  // 2026-07-27: 'pop-culture' and 'scifi' were REMOVED from this list. They used
  // to belong here — both 404 at their own genre URL — but they are now in
  // NECA_FANDOMS (both are 100% NECA-manufactured), so hubGenreForFandom()
  // resolves them to 'neca', which is a real 200 hub. The test above already
  // covers them via the NECA_FANDOMS loop. The invariant this file protects is
  // unchanged: never emit a slug whose hub 404s. 'generic-fantasy' still has no
  // hub anywhere and is not a NECA rollup candidate (only 37 of its 141 figures
  // are NECA), so it stays.
  test('a fandom with no hub anywhere returns null rather than a dead slug', () => {
    for (const fandom of ['generic-fantasy']) {
      assert.equal(hubGenreForFandom(fandom), null,
        `${fandom} has no hub page; emitting /${fandom} would be a 404 in the sitemap`)
    }
  })

  test('a fandom with a real hub still resolves to it', () => {
    assert.equal(hubGenreForFandom('wrestling'), 'wrestling')
  })
})
