import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getAllFigures } from '../src/data/kb.ts'
import {
  LINE_HUB_PAGE_SIZE, RESERVED_PAGE_SEGMENT, isReservedPageSegment,
  groupByWave, totalPagesFor, parsePageSegment, lineHubPath, planPage, pageNavItems,
} from '../src/app/[genre]/[line]/_lib/lineHubPaging.ts'

/**
 * Hub pagination guards (2026-09-02).
 *
 * Two things can silently break pagination and nothing else would catch them:
 *   1. a KB character slug literally named "page" — the pretty-figure route
 *      reserves that 3rd segment and 308s it to the hub, so such a figure would
 *      lose its pretty URL (webaudit ruling: assert at build time, 0 today);
 *   2. the paging arithmetic drifting from the display order (a card on two
 *      pages, or on none) — pure functions, so tested with plain objects.
 */
describe('line hub pagination', () => {
  test('no KB figure has the reserved character slug "page" (would be shadowed by /page/N)', () => {
    const offenders = getAllFigures().filter(f => isReservedPageSegment(f.character_canonical))
    assert.deepEqual(offenders.map(f => f.figure_id), [],
      `character_canonical === "${RESERVED_PAGE_SEGMENT}" collides with the paged-hub route; rename the slug or the reserved segment`)
  })

  test('no KB product_line is literally "page" either (would make /[genre]/page/N ambiguous)', () => {
    const offenders = getAllFigures().filter(f => isReservedPageSegment(f.product_line))
    assert.deepEqual([...new Set(offenders.map(f => f.fandom))], [])
  })

  test('the pretty-figure route actually reserves the segment (source guard, both metadata and body)', () => {
    const src = readFileSync(new URL('../src/app/[genre]/[line]/[slug]/page.tsx', import.meta.url), 'utf8')
    const hits = src.match(/isReservedPageSegment\(slug\)\) permanentRedirect/g) ?? []
    assert.equal(hits.length, 2, 'expected the reservation in generateMetadata AND the page body')
  })

  test('page size is the ruled 96', () => {
    assert.equal(LINE_HUB_PAGE_SIZE, 96)
  })

  test('parsePageSegment accepts only canonical positive integers', () => {
    assert.equal(parsePageSegment('1'), 1)
    assert.equal(parsePageSegment('2'), 2)
    assert.equal(parsePageSegment('17'), 17)
    for (const bad of ['0', '02', '+2', '2.0', '1e1', '-1', 'abc', '', ' 2', '2 ', '999999999'])
      assert.equal(parsePageSegment(bad), null, `"${bad}" must not parse as a page`)
  })

  test('lineHubPath: page 1 is the bare hub, pages 2+ get /page/N', () => {
    assert.equal(lineHubPath('marvel', 'marvel-legends', 1), '/marvel/marvel-legends')
    assert.equal(lineHubPath('marvel', 'marvel-legends', 2), '/marvel/marvel-legends/page/2')
  })

  test('totalPagesFor', () => {
    assert.equal(totalPagesFor(0), 1)
    assert.equal(totalPagesFor(1), 1)
    assert.equal(totalPagesFor(96), 1)
    assert.equal(totalPagesFor(97), 2)
    assert.equal(totalPagesFor(1567), 17)
  })

  // Synthetic line: waves 1..4 of uneven size, one non-numeric wave, one unknown.
  const fig = (wave, ch) => ({ release_wave: wave, character_canonical: ch })
  const mk = (wave, n) => Array.from({ length: n }, (_, i) => fig(wave, `${wave}-${String(i).padStart(3, '0')}`))
  const line = [
    ...mk('3', 10), ...mk('1', 60), ...mk('10', 5), ...mk('Exclusives', 7), ...mk('2', 50), ...mk(null, 3),
  ]

  test('groupByWave sorts numeric waves numerically, then alpha, Unknown last-alpha; characters alpha inside', () => {
    const waves = groupByWave(line).map(g => g.wave)
    assert.deepEqual(waves, ['1', '2', '3', '10', 'Exclusives', 'Unknown'])
    const g1 = groupByWave(line)[0].figures.map(f => f.character_canonical)
    assert.deepEqual(g1, [...g1].sort())
  })

  test('every card appears on exactly one page, in display order, and a straddling wave is marked continued', () => {
    const total = line.length // 135 -> 2 pages
    const pages = totalPagesFor(total)
    assert.equal(pages, 2)
    const seen = []
    for (let p = 1; p <= pages; p++) {
      const plan = planPage(line, p)
      assert.equal(plan.total, total)
      assert.equal(plan.totalPages, pages)
      assert.equal(plan.waveCount, 6)
      const items = plan.sections.flatMap(s => s.figures)
      assert.equal(items.length, plan.end - plan.start)
      assert.ok(items.length <= LINE_HUB_PAGE_SIZE)
      seen.push(...items.map(f => f.character_canonical))
      for (const s of plan.sections) assert.ok(s.figures.length <= s.total)
    }
    const expected = groupByWave(line).flatMap(g => g.figures.map(f => f.character_canonical))
    assert.deepEqual(seen, expected, 'pages concatenated must equal the display order, no dupes, no gaps')

    // wave '2' (50 cards) starts at index 60 and runs to 110: it straddles 96.
    const p1 = planPage(line, 1), p2 = planPage(line, 2)
    const w2p1 = p1.sections.find(s => s.wave === '2'), w2p2 = p2.sections.find(s => s.wave === '2')
    assert.equal(w2p1.continued, false); assert.equal(w2p1.figures.length, 36); assert.equal(w2p1.total, 50)
    assert.equal(w2p2.continued, true);  assert.equal(w2p2.figures.length, 14); assert.equal(w2p2.total, 50)
    assert.equal(p2.start, 96); assert.equal(p2.end, 135)
  })

  test('a single-page line has one page and no straddle', () => {
    const small = mk('1', 12)
    const plan = planPage(small, 1)
    assert.equal(plan.totalPages, 1)
    assert.equal(plan.sections.length, 1)
    assert.equal(plan.sections[0].continued, false)
    assert.equal(plan.end, 12)
  })

  test('a past-the-end page plans to zero cards (route 404s it before render)', () => {
    const plan = planPage(line, 3)
    assert.equal(plan.sections.length, 0)
    assert.equal(plan.end - plan.start, 0)
  })

  test('pageNavItems stays bounded and always includes first, last and current', () => {
    assert.deepEqual(pageNavItems(1, 5), [1, 2, 3, 4, 5])
    assert.deepEqual(pageNavItems(9, 17), [1, null, 7, 8, 9, 10, 11, null, 17])
    assert.deepEqual(pageNavItems(1, 17), [1, 2, 3, null, 17])
    assert.deepEqual(pageNavItems(17, 17), [1, null, 15, 16, 17])
    for (let p = 1; p <= 40; p++) {
      const items = pageNavItems(p, 40)
      assert.ok(items.length <= 9)
      assert.ok(items.includes(1) && items.includes(40) && items.includes(p))
    }
  })
})

describe('character hub pagination (Release F) — pageWindow + characterHubPath', async () => {
  const { pageWindow, characterHubPath } = await import('../src/app/[genre]/[line]/_lib/lineHubPaging.ts')

  test('pageWindow slices the display order without gaps or overlap', () => {
    const ordered = Array.from({ length: 250 }, (_, i) => i)
    const pages = Math.ceil(250 / 96)
    const seen = []
    for (let p = 1; p <= pages; p++) {
      const w = pageWindow(ordered, p)
      assert.equal(w.total, 250); assert.equal(w.totalPages, 3)
      assert.equal(w.items.length, w.end - w.start)
      assert.ok(w.items.length <= 96)
      seen.push(...w.items)
    }
    assert.deepEqual(seen, ordered)
    assert.deepEqual(pageWindow(ordered, 3).items.length, 58)
    assert.deepEqual(pageWindow(ordered, 4).items, [])
  })

  test('characterHubPath: page 1 is the bare hub, pages 2+ get /page/N', () => {
    assert.equal(characterHubPath('dc', 'batman', 1), '/dc/character/batman')
    assert.equal(characterHubPath('dc', 'batman', 3), '/dc/character/batman/page/3')
  })

  test('the character hub routes both register ISR (revalidate + generateStaticParams) — source guard', () => {
    for (const rel of ['../src/app/[genre]/character/[character_slug]/page.tsx', '../src/app/[genre]/character/[character_slug]/page/[n]/page.tsx']) {
      const src = readFileSync(new URL(rel, import.meta.url), 'utf8')
      assert.match(src, /export const revalidate = 86400/)
      assert.match(src, /export function generateStaticParams\(\)/)
    }
  })
})
