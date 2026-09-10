// purge-fids.mjs's ISR sweep -- pre-mortem item 2 (2026-09-08,
// CODEX-PREMORTEM-QUOTE-TIER-RELEASE-2026-09-09.md): "purge-fids.mjs
// deletes PRICE_KV keys and calls zone purge-by-URL. It never deletes
// NEXT_INC_CACHE_KV entries or invokes Next path/tag revalidation."
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { isrPrefixForBuild, assertAllPrefixed, parseKvKeyNames, chunk } from '../scripts/lib/purge-fids-core.mjs'

describe('purge-fids-core pure helpers', () => {
  test('isrPrefixForBuild composes the exact prefix computeCacheKey/kv-purge-stale-isr.mjs use', () => {
    assert.equal(isrPrefixForBuild('eHDfo_FDg2RKCbGddpmWD'), 'isr-cache/eHDfo_FDg2RKCbGddpmWD/')
  })

  test('isrPrefixForBuild rejects a build id that does not match the expected shape (never let untrusted content into a shell command)', () => {
    assert.throws(() => isrPrefixForBuild('../../etc/passwd'), /doesn't match/)
    assert.throws(() => isrPrefixForBuild(''), /doesn't match/)
    assert.throws(() => isrPrefixForBuild(undefined), /doesn't match/)
  })

  test('assertAllPrefixed passes when every key matches, throws (defense-in-depth) when one does not', () => {
    assert.doesNotThrow(() => assertAllPrefixed(['isr-cache/b1/a', 'isr-cache/b1/b'], 'isr-cache/b1/', 'ctx'))
    assert.throws(
      () => assertAllPrefixed(['isr-cache/b1/a', 'pro:some-user-key'], 'isr-cache/b1/', 'ctx'),
      /got 1 key\(s\) NOT starting with "isr-cache\/b1\/"/,
    )
  })

  test('parseKvKeyNames extracts .name from wrangler\'s JSON array, throws on a non-array shape instead of silently treating it as "zero keys"', () => {
    assert.deepEqual(parseKvKeyNames('[{"name":"isr-cache/b1/x"},{"name":"isr-cache/b1/y"}]', 'ctx'), ['isr-cache/b1/x', 'isr-cache/b1/y'])
    assert.throws(() => parseKvKeyNames('{"result":[]}', 'ctx'), /non-array JSON/)
  })

  test('chunk splits into <= chunkSize pieces, preserving order', () => {
    assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
    assert.deepEqual(chunk([], 3), [])
  })
})

describe('purge-fids.mjs dry run', () => {
  test('dry run never shells out to wrangler and mentions the ISR sweep it will do on --execute', () => {
    const scriptPath = fileURLToPath(new URL('../scripts/purge-fids.mjs', import.meta.url))
    const r = spawnSync(process.execPath, [scriptPath, '--fids', 'fp_a,fp_b'], { encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stdout, /would also sweep the current build's whole isr-cache/)
    assert.match(r.stdout, /dry run only/)
  })

  test('the ISR sweep call in main() is try/caught -- a failure there must never abort a run that already purged PRICE_KV + edge (item 2\'s own non-fatal design)', () => {
    // Can't safely exercise a real --execute run here (it shells out to
    // wrangler with live credentials) -- this verifies the FAILURE-PATH
    // contract by reading the source rather than by making a live wrangler
    // call from a test.
    const src = readFileSync(fileURLToPath(new URL('../scripts/purge-fids.mjs', import.meta.url)), 'utf8')
    const i = src.indexOf('await purgeUrls(urls, loadEnvFile())')
    assert.ok(i >= 0, 'purgeUrls call site not found -- file structure changed, update this test')
    const tail = src.slice(i, i + 600)
    assert.match(tail, /try\s*{[\s\S]*purgeIsrForCurrentBuild\(\)[\s\S]*}\s*catch/, 'ISR sweep must be try/caught, never allowed to abort a run that already purged PRICE_KV + edge')
  })
})
