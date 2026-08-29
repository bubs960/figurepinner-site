import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Phase 7 Tier A drift gate (2026-08-29): kbHelpers.ts exists so modules can
// use derivation helpers WITHOUT pulling the 18.9MB KB array that kb.ts
// require()s at module top. That guarantee only holds while kbHelpers and its
// transitive sources never reference kb.ts or the data files. A static source
// scan is deliberate — importing the modules here can't prove what the
// bundler will inline.

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')

const FORBIDDEN = [/figures-reference/, /from ['"]\.\/kb['"]/, /from ['"]@\/data\/kb['"]/]

describe('kbHelpers surface stays data-free', () => {
  // kbHelpers re-exports from kbTypes; kbTypes imports figureFormatters,
  // which imports safeDate. That is the full transitive source set.
  for (const file of [
    'src/data/kbHelpers.ts',
    'src/data/kbTypes.ts',
    'src/app/figure/[figure_id]/_lib/figureFormatters.ts',
    'src/lib/safeDate.ts',
  ]) {
    test(`${file} never references kb.ts or the KB data files`, () => {
      const src = read(file)
      for (const re of FORBIDDEN) {
        assert.ok(!re.test(src), `${file} matches forbidden pattern ${re}`)
      }
    })
  }

  test('kbHelpers exports the Tier A helper set', async () => {
    const helpers = await import('../src/data/kbHelpers.ts')
    for (const name of ['deriveName', 'deriveEmbeddedLine', 'figurePageTitle', 'figureUrl', 'isNumericWave', 'titleCaseValue']) {
      assert.equal(typeof helpers[name], 'function', `missing helper export: ${name}`)
    }
  })
})
