import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { prettyFigureUrls, prettyUrlCountsForLineHub } from '../src/data/kbDb.ts'

// D1 rows-read scale budget (target ~60 rows/query, ceiling 100 —
// OOM-D1-RUNTIME-CUTOVER-EXECUTION-PLAN-2026-09-01.md §6): prettyFigureUrls
// and prettyUrlCountsForLineHub each looped over their figures' distinct
// fandoms with ONE `await db.batch(...)` per fandom INSIDE the loop — a
// correct but needlessly serialized round trip whenever a figure list spans
// more than one fandom (2026-09-26 batching analysis,
// docs/kbdb-batching-analysis-2026-09-26.md). Both were changed to fire one
// batch per fandom concurrently via Promise.all instead. This is provably
// read-equivalent: each fandom's rows are disjoint (a figure_id belongs to
// exactly one fandom, and prettyUrlRouterCountKeys prefixes every count key
// with fandom), so merging the per-fandom results in any order — sequential
// or concurrent — yields the identical map. Same statements, same params,
// same total rows read; only wall-clock changes. This test pins that: (a)
// the returned data is identical to the pre-fix sequential semantics for a
// multi-fandom input, and (b) the batches actually overlap in time, so a
// future refactor that reintroduces a sequential `for (...) { await ... }`
// loop here fails loudly instead of silently regressing back to N serial
// round trips.

const CLOUDFLARE_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__')

/** A minimal in-memory kb_figures table for the two query shapes these functions issue. */
function makeFakeKbDb(catalogRows, { batchDelayMs = 5 } = {}) {
  const stats = { batchCalls: 0, concurrentBatches: 0, maxConcurrentBatches: 0 }

  function queryRows(sql, params) {
    if (sql.includes('character_canonical IN')) {
      const wanted = new Set(params)
      return catalogRows
        .filter(r => wanted.has(r.character_canonical))
        .map(r => ({ figure_id: r.figure_id, fandom: r.fandom, manufacturer: r.manufacturer, product_line: r.product_line, character_canonical: r.character_canonical }))
    }
    if (sql.includes('AND manufacturer = ?')) {
      const [fandom, product_line, manufacturer] = params
      return catalogRows
        .filter(r => r.fandom === fandom && r.product_line === product_line && r.manufacturer === manufacturer)
        .map(r => ({ rid: r.rid, figure_id: r.figure_id, fandom: r.fandom, manufacturer: r.manufacturer, product_line: r.product_line, character_canonical: r.character_canonical }))
    }
    if (sql.includes('WHERE fandom = ? AND product_line = ?')) {
      const [fandom, product_line] = params
      return catalogRows
        .filter(r => r.fandom === fandom && r.product_line === product_line)
        .map(r => ({ rid: r.rid, figure_id: r.figure_id, fandom: r.fandom, manufacturer: r.manufacturer, product_line: r.product_line, character_canonical: r.character_canonical }))
    }
    throw new Error(`fake kb_figures: unrecognized statement shape: ${sql}`)
  }

  function makeStmt(sql) {
    let params = []
    return {
      bind(...p) { params = p; return this },
      async first() { return queryRows(sql, params)[0] ?? null },
      async all() { return { results: queryRows(sql, params) } },
      async run() { return { meta: { changes: 0, last_row_id: 0 } } },
      _sql: sql,
      _params: () => params,
    }
  }

  const session = {
    prepare: sql => makeStmt(sql),
    async batch(stmts) {
      stats.batchCalls++
      stats.concurrentBatches++
      stats.maxConcurrentBatches = Math.max(stats.maxConcurrentBatches, stats.concurrentBatches)
      // Simulate real network latency so overlapping batches are observable —
      // a synchronous fake would make every call "concurrent" trivially.
      await new Promise(resolve => setTimeout(resolve, batchDelayMs))
      const out = stmts.map(st => ({ results: queryRows(st._sql, st._params()) }))
      stats.concurrentBatches--
      return out
    },
  }

  return { fakeD1: { withSession: () => session }, stats }
}

async function withFakeKbDb(catalogRows, opts, fn) {
  const { fakeD1, stats } = makeFakeKbDb(catalogRows, opts)
  const previous = globalThis[CLOUDFLARE_CONTEXT_SYMBOL]
  globalThis[CLOUDFLARE_CONTEXT_SYMBOL] = { env: { KB_DB: fakeD1 } }
  try {
    return await fn(stats)
  } finally {
    globalThis[CLOUDFLARE_CONTEXT_SYMBOL] = previous
  }
}

function fig(overrides) {
  return {
    figure_id: overrides.figure_id,
    v1_figure_id: '',
    fandom: overrides.fandom,
    sub_fandom: null,
    character_canonical: overrides.character_canonical,
    character_variant: null,
    manufacturer: overrides.manufacturer ?? 'generic',
    product_line: overrides.product_line,
    release_wave: '',
    scale: null,
    pack_size: 1,
    exclusive_to: null,
  }
}

// Two fandoms, two lines each, disjoint character/product_line space per
// fandom — the shape prettyFigureUrls/prettyUrlCountsForLineHub see for a
// figure page's related rows or a genre hub that (today) always happens to
// be single-fandom, but the function signature does not guarantee that.
const CATALOG = [
  { rid: 1, figure_id: 'marvel-1', fandom: 'marvel', manufacturer: 'hasbro', product_line: 'legends', character_canonical: 'spider-man' },
  { rid: 2, figure_id: 'marvel-2', fandom: 'marvel', manufacturer: 'hasbro', product_line: 'legends', character_canonical: 'spider-man' },
  { rid: 3, figure_id: 'marvel-3', fandom: 'marvel', manufacturer: 'hasbro', product_line: 'legends', character_canonical: 'iron-man' },
  { rid: 4, figure_id: 'wwe-1', fandom: 'wwe', manufacturer: 'mattel', product_line: 'elite', character_canonical: 'john-cena' },
  { rid: 5, figure_id: 'wwe-2', fandom: 'wwe', manufacturer: 'mattel', product_line: 'elite', character_canonical: 'john-cena' },
]

describe('kbDb multi-fandom pretty-URL batching (read-equivalence + concurrency)', () => {
  test('prettyFigureUrls: two fandoms resolve to the pre-fix sequential result, in one concurrent round trip each', async () => {
    const figures = [
      fig({ figure_id: 'marvel-1', fandom: 'marvel', manufacturer: 'hasbro', product_line: 'legends', character_canonical: 'spider-man' }),
      fig({ figure_id: 'wwe-1', fandom: 'wwe', manufacturer: 'mattel', product_line: 'elite', character_canonical: 'john-cena' }),
    ]
    await withFakeKbDb(CATALOG, {}, async stats => {
      const urls = await prettyFigureUrls(figures)
      // spider-man has 2 marvel/legends rows -> ambiguous -> stable /figure/<id>.
      assert.equal(urls.get('marvel-1'), '/figure/marvel-1')
      // john-cena has 2 wwe/elite rows -> also ambiguous -> stable /figure/<id>.
      assert.equal(urls.get('wwe-1'), '/figure/wwe-1')
      // One batch per fandom (2 fandoms), and they overlapped in time —
      // proof this is no longer N sequential `await`s in a for-loop.
      assert.equal(stats.batchCalls, 2, 'expected exactly one db.batch() per distinct fandom')
      assert.ok(stats.maxConcurrentBatches >= 2, `expected the two fandoms' batches to overlap, saw max concurrency ${stats.maxConcurrentBatches}`)
    })
  })

  test('prettyFigureUrls: a unique character across two fandoms still resolves to a pretty URL for each', async () => {
    const figures = [
      fig({ figure_id: 'marvel-3', fandom: 'marvel', manufacturer: 'hasbro', product_line: 'legends', character_canonical: 'iron-man' }),
    ]
    await withFakeKbDb(CATALOG, {}, async stats => {
      const urls = await prettyFigureUrls(figures)
      assert.equal(urls.get('marvel-3'), '/marvel/legends/iron-man')
      assert.equal(stats.batchCalls, 1)
    })
  })

  test('prettyUrlCountsForLineHub: distinct fandoms in the same call still route each row through its own fandom batch, running concurrently', async () => {
    // A line-hub token that matches NEITHER fandom's own product_line, so
    // both marvel and wwe need their "other line" batch to resolve their
    // rows' true contributor counts — a shape the type signature allows even
    // though today's single caller (lineHub.tsx) only ever passes one
    // fandom's own getFiguresByLine result (whose product_line IS the token).
    const figures = [
      fig({ figure_id: 'marvel-1', fandom: 'marvel', manufacturer: 'hasbro', product_line: 'legends', character_canonical: 'spider-man' }),
      fig({ figure_id: 'wwe-1', fandom: 'wwe', manufacturer: 'mattel', product_line: 'elite', character_canonical: 'john-cena' }),
    ]
    await withFakeKbDb(CATALOG, {}, async stats => {
      const counts = await prettyUrlCountsForLineHub(figures, 'some-unrelated-line')
      // marvel|spider-man|legends has 2 contributing rows in the catalog -> not unique.
      assert.equal(counts.get('marvel|spider-man|legends'), 2)
      // wwe|john-cena|elite has 2 contributing rows in the catalog -> not unique.
      assert.equal(counts.get('wwe|john-cena|elite'), 2)
      // One batch per fandom (both need their "other line" resolved here).
      assert.equal(stats.batchCalls, 2, 'expected exactly one db.batch() per distinct fandom')
      assert.ok(stats.maxConcurrentBatches >= 2, `expected the two fandoms' batches to overlap, saw max concurrency ${stats.maxConcurrentBatches}`)
    })
  })

  test('prettyUrlCountsForLineHub: single-fandom input (today\'s real call shape) needs no extra batch when all figures already share the hub\'s own line', async () => {
    const figures = [
      fig({ figure_id: 'marvel-1', fandom: 'marvel', manufacturer: 'hasbro', product_line: 'legends', character_canonical: 'spider-man' }),
      fig({ figure_id: 'marvel-2', fandom: 'marvel', manufacturer: 'hasbro', product_line: 'legends', character_canonical: 'spider-man' }),
    ]
    await withFakeKbDb(CATALOG, {}, async stats => {
      const counts = await prettyUrlCountsForLineHub(figures, 'legends')
      assert.equal(counts.get('marvel|spider-man|legends'), 2)
      assert.equal(stats.batchCalls, 0, 'every figure already matches the hub token — zero extra queries, exactly as documented')
    })
  })
})
