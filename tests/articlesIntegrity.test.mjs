// Guards against the two defect classes found by webaudit's 2026-07-17/18
// articles.ts integrity probes: (1) a duplicate `slug` silently shadows a
// richer entry behind ARTICLES.find()'s first-match semantics (this is what
// broke star-wars-black-series-hub and transformers-hub — the thin 6/21
// entries shipped ahead of the data-dense originals and made them
// unreachable dead weight, a real Bing ranking regression); (2) a
// "[[label|/guides/slug]]" further-reading link pointing at a slug that
// doesn't exist (404, link-equity leak). Both are exactly the class a
// hand-maintained multi-thousand-line data file will regress on again.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { ARTICLES } from '../src/app/guides/_data/articles.ts'

describe('articles.ts integrity', () => {
  test('no duplicate slugs (ARTICLES.find() is first-match-wins — a dup silently unpublishes the later entry)', () => {
    const seen = new Map()
    const dupes = []
    for (const [i, a] of ARTICLES.entries()) {
      if (seen.has(a.slug)) dupes.push(`'${a.slug}' at index ${seen.get(a.slug)} and ${i}`)
      else seen.set(a.slug, i)
    }
    assert.deepEqual(dupes, [], `duplicate article slugs found: ${dupes.join('; ')}`)
  })

  // Grandfather list for further-reading targets that are intentionally dead —
  // titles a hub author intends to write but hasn't yet. NOW EMPTY.
  //
  // It held 8 entries from webaudit's 2026-07-17 integrity probe
  // (WEBAUDIT-TO-WEB-ARTICLES-INTEGRITY-ADDENDUM-2026-07-17.md item 2), whose
  // recommendation was to fold them into round-3 guide research rather than
  // delete the links. 2026-07-27, Steve chose the other branch and had the 8
  // links deleted instead — so the intended-guide titles now survive only in
  // that relay and in the removal comments in articles.ts, NOT as live links.
  // Two hubs (star-wars-black-series-hub, dc-multiverse-hub) lost their whole
  // "Further reading" section as a result; wwe-elite-hub kept one entry.
  //
  // This test is what forced the trim: it hard-fails when a grandfathered link
  // stops being broken, so the list can't silently rot. Keep the mechanism —
  // if a future article again links a guide that's written-but-not-yet-shipped,
  // add it here rather than weakening the guard below.
  const KNOWN_MISSING_GUIDE_LINKS = new Set([])

  test('every internal [[label|/guides/slug]] further-reading link resolves to a real slug (except the known-missing grandfather list above)', () => {
    const knownSlugs = new Set(ARTICLES.map((a) => a.slug))
    const linkPattern = /\[\[[^\]|]+\|(\/guides\/[a-z0-9-]+)\]\]/g
    const broken = []
    for (const a of ARTICLES) {
      for (const block of a.body) {
        const texts = block.type === 'ul' ? block.items : [block.text]
        for (const text of texts) {
          if (!text) continue
          for (const match of text.matchAll(linkPattern)) {
            const target = match[1].replace(/^\/guides\//, '')
            if (!knownSlugs.has(target)) broken.push(`${a.slug} -> ${match[1]}`)
          }
        }
      }
    }
    const newlyBroken = broken.filter((b) => !KNOWN_MISSING_GUIDE_LINKS.has(b))
    assert.deepEqual(newlyBroken, [], `NEW dead /guides/ links found (not on the known-missing list): ${newlyBroken.join('; ')}`)

    // If a grandfathered link starts resolving (the guide finally gets written),
    // fail loudly so the list gets trimmed instead of silently going stale.
    const noLongerMissing = [...KNOWN_MISSING_GUIDE_LINKS].filter((b) => !broken.includes(b))
    assert.deepEqual(noLongerMissing, [], `these grandfathered links now resolve -- remove from KNOWN_MISSING_GUIDE_LINKS: ${noLongerMissing.join('; ')}`)
  })
})
