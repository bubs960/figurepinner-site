import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  getFandom,
  genreSlugForFandom,
  fandomsForGenre,
  NECA_FANDOMS,
  cardName,
  groupAndSortLines,
} from '../src/lib/genreFigures.ts'

/** Minimal KBFigure fixture — only the fields the functions under test read. */
function fig(overrides = {}) {
  return {
    figure_id: 'fp_test_0',
    v1_figure_id: '',
    fandom: 'wrestling',
    sub_fandom: null,
    character_canonical: 'test-character',
    character_variant: null,
    manufacturer: 'mattel',
    product_line: 'elite',
    release_wave: '1',
    scale: null,
    pack_size: 1,
    exclusive_to: null,
    ...overrides,
  }
}

describe('getFandom (URL genre slug -> KB fandom slug)', () => {
  test('remaps the 4 known slugs', () => {
    assert.equal(getFandom('gijoe'), 'gi-joe')
    assert.equal(getFandom('marvel'), 'marvel-comics')
    assert.equal(getFandom('teenage-mutant-ninja-turtles'), 'tmnt')
    assert.equal(getFandom('dungeons-and-dragons'), 'dungeons-dragons')
  })

  test('falls back to identity for slugs that already match (wrestling, dc, ...)', () => {
    assert.equal(getFandom('wrestling'), 'wrestling')
    assert.equal(getFandom('star-wars'), 'star-wars')
    assert.equal(getFandom('unknown-genre'), 'unknown-genre')
  })
})

describe('genreSlugForFandom (inverse: KB fandom -> URL genre slug)', () => {
  test('is the exact inverse of getFandom for the 4 remapped fandoms', () => {
    assert.equal(genreSlugForFandom('gi-joe'), 'gijoe')
    assert.equal(genreSlugForFandom('marvel-comics'), 'marvel')
    assert.equal(genreSlugForFandom('tmnt'), 'teenage-mutant-ninja-turtles')
    assert.equal(genreSlugForFandom('dungeons-dragons'), 'dungeons-and-dragons')
  })

  test('falls back to identity for fandoms with no remap entry', () => {
    assert.equal(genreSlugForFandom('wrestling'), 'wrestling')
    assert.equal(genreSlugForFandom('horror'), 'horror')
  })

  test('round-trips through getFandom for every remapped slug', () => {
    for (const slug of ['gijoe', 'marvel', 'teenage-mutant-ninja-turtles', 'dungeons-and-dragons']) {
      assert.equal(genreSlugForFandom(getFandom(slug)), slug)
    }
  })
})

describe('fandomsForGenre (NECA rollup)', () => {
  test('rolls "neca" up to every sibling fandom', () => {
    assert.deepEqual(fandomsForGenre('neca'), NECA_FANDOMS)
    assert.ok(NECA_FANDOMS.length > 1, 'rollup should cover more than one fandom')
  })

  test('every other genre resolves to exactly one fandom', () => {
    assert.deepEqual(fandomsForGenre('gijoe'), ['gi-joe'])
    assert.deepEqual(fandomsForGenre('wrestling'), ['wrestling'])
  })
})

describe('cardName', () => {
  test('title-cases the hyphenated character slug', () => {
    assert.equal(cardName(fig({ character_canonical: 'hulk-hogan' })), 'Hulk Hogan')
  })

  test('appends the variant in parens when present and not "None"', () => {
    assert.equal(
      cardName(fig({ character_canonical: 'hulk-hogan', character_variant: 'nWo' })),
      'Hulk Hogan (nWo)',
    )
  })

  test('omits the variant when it is the literal string "None"', () => {
    assert.equal(cardName(fig({ character_variant: 'None' })), 'Test Character')
  })
})

describe('groupAndSortLines', () => {
  test('groups by product_line and sorts lines by figure count descending', () => {
    const figures = [
      fig({ figure_id: '1', product_line: 'basic', character_canonical: 'a' }),
      fig({ figure_id: '2', product_line: 'elite', character_canonical: 'b' }),
      fig({ figure_id: '3', product_line: 'elite', character_canonical: 'c' }),
      fig({ figure_id: '4', product_line: 'elite', character_canonical: 'd' }),
    ]
    const groups = groupAndSortLines(figures)
    assert.deepEqual(groups.map(([line]) => line), ['elite', 'basic'])
    assert.equal(groups[0][1].length, 3)
  })

  test('within a line, sorts by release_wave descending then alpha', () => {
    const figures = [
      fig({ figure_id: '1', release_wave: '2', character_canonical: 'zeta' }),
      fig({ figure_id: '2', release_wave: '10', character_canonical: 'alpha' }),
      fig({ figure_id: '3', release_wave: '10', character_canonical: 'beta' }),
    ]
    const [[, sorted]] = groupAndSortLines(figures)
    assert.deepEqual(
      sorted.map(f => f.character_canonical),
      ['alpha', 'beta', 'zeta'], // wave 10 (alpha, beta) before wave 2 (zeta)
    )
  })
})
