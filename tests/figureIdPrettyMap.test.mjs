// Drift gate for figureIdToPrettyPath.generated.json — added 2026-08-28 after
// the map went stale live: a KB sync removed rekeyed fids (Batch 22/24/25
// surgeries) but the map still carried them, so middleware's KV-consolidation
// rewrite sent /figure/<old-fid> to a 404 pretty path BEFORE the figure
// route's FIGURE_ID_REDIRECTS lookup could ever run — a stale entry is a
// correctness bug that silently shadows the redirect map, not just a missed
// cache optimization. Same pattern as tests/enrichmentDates.test.mjs: fail
// the deploy chain if a KB sync ships without regenerating the artifact
// (`node --import ./scripts/register-ts-loader.mjs
//   scripts/gen-figure-id-pretty-map.mjs src/data/figureIdToPrettyPath.generated.json`).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getAllFigures, hasUniquePrettyFigureUrl, prettyFigureUrl } from '../src/data/kb.ts'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const generated = require('../src/data/figureIdToPrettyPath.generated.json')

describe('figureIdToPrettyPath.generated.json parity with current KB', () => {
  const figures = getAllFigures()
  const byId = new Map(figures.map((f) => [f.figure_id, f]))

  test('every map key is a live KB fid (stale keys shadow FIGURE_ID_REDIRECTS)', () => {
    const dead = Object.keys(generated).filter((id) => !byId.has(id))
    assert.deepEqual(dead, [], `stale fids in generated map — regenerate: ${dead.slice(0, 5).join(', ')}`)
  })

  test('every map value matches the fid’s CURRENT pretty path', () => {
    const drifted = Object.entries(generated)
      .filter(([id, path]) => byId.has(id) && prettyFigureUrl(byId.get(id)) !== path)
      .map(([id]) => id)
    assert.deepEqual(drifted, [], `pretty paths drifted — regenerate: ${drifted.slice(0, 5).join(', ')}`)
  })

  test('every unique-pretty-URL figure is present (missing entries lose KV consolidation)', () => {
    const missing = figures
      .filter((f) => hasUniquePrettyFigureUrl(f) && !(f.figure_id in generated))
      .map((f) => f.figure_id)
    assert.deepEqual(missing, [], `fids missing from generated map — regenerate: ${missing.slice(0, 5).join(', ')}`)
  })
})
