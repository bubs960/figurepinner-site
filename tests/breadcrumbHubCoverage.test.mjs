import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getAllFigures } from '../src/data/kb.ts'
import {
  GENRE_HUB_SLUGS, GENRE_HUB_LABELS, genreCrumbForFandom, genreSlugForFandom,
} from '../src/lib/genreFigures.ts'

/**
 * Drift guard: a breadcrumb must never point at a URL that 404s.
 *
 * Origin (2026-07-27) — the FIFTH appearance of "one truth, several consumers,
 * fixed in one", and the largest by surface. src/app/sitemap.ts had already
 * stopped emitting the 7 hub-less fandom genre URLs precisely because they
 * 404; the breadcrumb never got the same treatment and stayed on
 * genreSlugForFandom()'s identity fallback. Measured live that day:
 *
 *   /horror /aliens-predator /terminator /robocop /scifi /pop-culture
 *   /generic-fantasy  -> all 404   (/neca -> 200, the rollup working)
 *
 * while ~1,922 live pages (1,116 figure pages + 40 line hubs + 766 character
 * hubs) carried BOTH a visible crumb anchor and a BreadcrumbJsonLd url into
 * them — dead URLs inside the structured data Google parses, on the exact
 * surface the whole indexing program is about. Same class as the 8 dead guide
 * links that took two days of attention, at ~240x the page count.
 *
 * Why this test and not a fixture: like searchGenreCoverage, it enumerates the
 * KB rather than asserting about names someone already thought of — an
 * unmapped namespace is exactly what nobody remembers to add to a fixture.
 *
 * GENRE_META lives in a page file and cannot be imported (Next.js restricts
 * page exports), so its labels are parsed as text — same tradeoff and same
 * justification as genre-hub-slugs.test.mjs.
 */
describe('breadcrumb hub coverage', () => {
  const pageSrc = readFileSync(
    new URL('../src/app/[genre]/page.tsx', import.meta.url), 'utf8',
  )

  /** slug -> label from the GENRE_META object literal (the source of truth). */
  function genreMetaLabels() {
    const start = pageSrc.indexOf('const GENRE_META')
    assert.notEqual(start, -1, 'GENRE_META declaration not found — did [genre]/page.tsx move or rename it?')
    const end = pageSrc.indexOf('\n}', start)
    assert.notEqual(end, -1, 'could not find the end of the GENRE_META literal')
    const block = pageSrc.slice(start, end)
    const out = new Map()
    // Each entry is  'slug': {\n  label: 'Label',  — capture the pair.
    for (const m of block.matchAll(/'([a-z0-9-]+)':\s*\{\s*\n\s*label:\s*'([^']+)'/g)) {
      out.set(m[1], m[2])
    }
    return out
  }

  test('the GENRE_META parser actually parsed something', () => {
    // Without this, a broken regex makes every assertion below pass vacuously.
    assert.ok(genreMetaLabels().size > 10,
      `parsed only ${genreMetaLabels().size} GENRE_META entries — the parser is broken, not the data`)
  })

  test('GENRE_HUB_LABELS matches GENRE_META exactly, slugs AND labels', () => {
    const meta = genreMetaLabels()

    const missing = [...meta.keys()].filter(s => !(s in GENRE_HUB_LABELS))
    assert.deepEqual(missing, [],
      `hub(s) in GENRE_META with no GENRE_HUB_LABELS entry — crumbs to them would be dropped: ${missing.join(', ')}`)

    const extra = Object.keys(GENRE_HUB_LABELS).filter(s => !meta.has(s))
    assert.deepEqual(extra, [],
      `GENRE_HUB_LABELS lists hub(s) with no GENRE_META entry — crumbs would point at a 404: ${extra.join(', ')}`)

    const wrongLabel = [...meta.entries()]
      .filter(([slug, label]) => GENRE_HUB_LABELS[slug] !== label)
      .map(([slug, label]) => `${slug}: crumb says '${GENRE_HUB_LABELS[slug]}', hub says '${label}'`)
    assert.deepEqual(wrongLabel, [],
      `crumb label(s) disagree with the hub they link to — a breadcrumb must name its ` +
      `destination, and Google reads both: ${wrongLabel.join(' | ')}`)
  })

  /**
   * Fandoms that deliberately render NO genre crumb. Every entry needs a
   * REASON, so an omitted crumb is a recorded decision rather than an
   * oversight. Shrink it; do not grow it to make a failure go away.
   */
  const KNOWN_NO_CRUMB = new Map([
    // generic-fantasy REMOVED 2026-07-30 -- folded into the 'dungeons-dragons'
    // hub (genreFigures.ts DUNGEONS_DRAGONS_FANDOMS), same as its pair in
    // searchGenreCoverage.test.mjs KNOWN_UNMAPPED. Now covered by the
    // dungeons-dragons-rollup assertion below instead of an omission.
    // ufc REMOVED 2026-08-24 -- genre hub built (GENRE_META/GENRE_HUB_LABELS/
    // GENRE_ACCENT/GENRE_TAXONOMY + a GENRES search pill), same pass as the
    // twin removal in searchGenreCoverage.test.mjs KNOWN_UNMAPPED.
    ['metal-gear-solid', 'new fandom minted 2026-08-24 (matcher, 8 fids) -- ' +
      'no genre hub built yet. Remove once a hub ships, same as ufc above.'],
    ['defenders-of-the-earth', 'new fandom minted 2026-08-24 (matcher, 6 fids, ' +
      'rekey off an old value) -- no genre hub built yet. Remove once a hub ' +
      'ships, same as ufc above.'],
    ['soulcalibur', 'new fandom minted 2026-08-24 (matcher, 7 fids) -- no ' +
      'genre hub built yet. Remove once a hub ships, same as ufc above.'],
    ['onimusha', 'new fandom minted 2026-08-24 (matcher, 6 fids) -- no ' +
      'genre hub built yet. Remove once a hub ships, same as ufc above.'],
    ['crouching-tiger-hidden-dragon', 'new fandom minted 2026-08-24 (matcher, ' +
      '4 fids) -- no genre hub built yet. Remove once a hub ships, same as ufc above.'],
  ])

  test('every KB fandom gets a working genre crumb, or is a recorded exception', () => {
    const fandoms = new Set(getAllFigures().map(f => f.fandom))
    assert.ok(fandoms.size > 5, `only ${fandoms.size} KB fandoms found — KB load looks wrong`)

    // NOTE ON WHAT THIS TEST IS FOR, established by falsifying it 2026-07-27:
    // reintroducing the original bug (crumb via genreSlugForFandom) does NOT
    // produce a dead link here — an unmapped slug has no GENRE_HUB_LABELS entry,
    // so genreCrumbForFandom returns null and the crumb is simply omitted. The
    // "never link to a 404" invariant is enforced structurally by that lookup,
    // not by an assertion. The residual risk is therefore the QUIET one: a new
    // KB fandom lands, matches no hub, and every page in it silently loses its
    // genre crumb with nothing 404ing to reveal it. That is what this guards.
    const silentlyOmitted = [...fandoms]
      .filter(f => genreCrumbForFandom(f) === null)
      .filter(f => !KNOWN_NO_CRUMB.has(f))

    assert.deepEqual(silentlyOmitted, [],
      `KB fandom(s) render NO genre crumb at all: ${silentlyOmitted.join(', ')}. ` +
      `Every figure, line hub and character hub in these fandoms loses a level of its ` +
      `breadcrumb — visible trail AND BreadcrumbJsonLd — with no 404 to make it visible. ` +
      `Either give the fandom a hub, roll it up (NECA_FANDOMS), or add it to ` +
      `KNOWN_NO_CRUMB with a reason.`)
  })

  test('no crumb can point at a slug without a hub', () => {
    // The structural invariant, asserted directly rather than inferred from the
    // KB sweep above. Cheap, and it is the claim the whole fix rests on.
    const fandoms = new Set(getAllFigures().map(f => f.fandom))
    const dead = [...fandoms]
      .map(f => [f, genreCrumbForFandom(f)])
      .filter(([, crumb]) => crumb !== null && !GENRE_HUB_SLUGS.has(crumb.slug))
      .map(([f, crumb]) => `${f} -> /${crumb.slug}`)

    assert.deepEqual(dead, [],
      `breadcrumb(s) would link to a genre hub that does not exist: ${dead.join(', ')}. ` +
      `Both the visible anchor and BreadcrumbJsonLd emit this URL — never link to a 404.`)
  })

  test('KNOWN_NO_CRUMB has not gone stale', () => {
    // A permanently-stale exception list is how the grandfathered dead guide
    // links survived 10 days.
    const fandoms = new Set(getAllFigures().map(f => f.fandom))

    const nowResolving = [...KNOWN_NO_CRUMB.keys()].filter(f => genreCrumbForFandom(f) !== null)
    assert.deepEqual(nowResolving, [],
      `these fandoms now have a working crumb — remove them from KNOWN_NO_CRUMB: ${nowResolving.join(', ')}`)

    const gone = [...KNOWN_NO_CRUMB.keys()].filter(f => !fandoms.has(f))
    assert.deepEqual(gone, [],
      `these fandoms no longer exist in the KB — remove them from KNOWN_NO_CRUMB: ${gone.join(', ')}`)
  })

  test('the 7 originally hub-less fandoms all resolve now, and never fall back to their raw slug', () => {
    // The exact seven measured 404 on 2026-07-27. Six roll up to /neca;
    // generic-fantasy (the 7th) was the last holdout, folded into
    // /dungeons-dragons 2026-07-30 -- all seven now resolve.
    const rollup = ['horror', 'aliens-predator', 'terminator', 'robocop', 'scifi', 'pop-culture']
    for (const fandom of rollup) {
      const crumb = genreCrumbForFandom(fandom)
      assert.notEqual(crumb, null, `${fandom} should crumb to the /neca hub, not omit`)
      assert.equal(crumb.slug, 'neca',
        `${fandom} crumbs to /${crumb.slug}, which 404s — it must roll up to /neca`)
      assert.equal(crumb.label, 'Horror & Film',
        `${fandom} crumb reads '${crumb.label}' but lands on the Horror & Film hub`)
      // The precise regression: identity fallback silently producing the fandom.
      assert.equal(genreSlugForFandom(fandom), fandom,
        `precondition changed — ${fandom} no longer identity-falls-back, re-read this test`)
    }

    const gfCrumb = genreCrumbForFandom('generic-fantasy')
    assert.notEqual(gfCrumb, null, 'generic-fantasy should now crumb to the /dungeons-dragons hub, not omit')
    assert.equal(gfCrumb.slug, 'dungeons-dragons',
      `generic-fantasy crumbs to /${gfCrumb.slug}, which is wrong — it must roll up to /dungeons-dragons`)
    assert.equal(gfCrumb.label, 'Dungeons & Dragons',
      `generic-fantasy crumb reads '${gfCrumb.label}' but lands on the Dungeons & Dragons hub`)
    assert.equal(genreSlugForFandom('generic-fantasy'), 'generic-fantasy',
      'precondition changed — generic-fantasy no longer identity-falls-back on its OWN figure/line/character URLs, re-read this test')
  })

  test('a hub that keeps its slug still gets a working crumb', () => {
    // Guard the other direction: the fix must not omit crumbs that were fine.
    for (const [fandom, expected] of [
      ['wrestling', 'wrestling'], ['marvel-comics', 'marvel'],
      ['gi-joe', 'gijoe'], ['tmnt', 'teenage-mutant-ninja-turtles'],
    ]) {
      const crumb = genreCrumbForFandom(fandom)
      assert.notEqual(crumb, null, `${fandom} lost its genre crumb — regression`)
      assert.equal(crumb.slug, expected, `${fandom} should crumb to /${expected}`)
    }
  })
})
