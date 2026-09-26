# kbDb.ts / kbDbQueries.ts batching analysis — 2026-09-26

Scope: `src/data/kbDb.ts` (D1 read layer) and `src/data/kbDbQueries.ts` (the
SQL behind it), looking for sequential D1 round trips that could become one
`db.batch()` or a bounded `Promise.all`, without reading any additional rows.
The scale-budget context (target ~60 rows/query, ceiling 100 — see the header
comments in both files, OOM-D1-RUNTIME-CUTOVER-EXECUTION-PLAN-2026-09-01.md
§6) already drove a prior optimization pass: every whole-fandom scan except
`getCardsByFandom` (the genre hub's one deliberate exception) was replaced
with indexed equalities, and most multi-statement reads already run as a
single `db.batch()`. This pass looked for what that earlier work left behind.

## What "sequential" turned out to mean here

I read every exported function in both files and every internal caller in
`src/` that imports from `@/data/kbDb` (figure pages, line/character/genre
hubs, vault, route resolution, today/spotlight, bubs-inventory). Most of the
obvious candidates are already fixed:

- `getFiguresByIds` — one `db.batch()` over chunked IN-lists (already batched).
- `getFiguresByLine` — one `db.batch()` over the bare + compound-split line
  plan (already batched, via `lineQueryPlan`).
- `prettyUrlCountsForCharacters` — one `db.batch()` over chunked IN-lists
  (already batched).
- `FigureDetailContent.tsx` (the figure page's data fetch) — price, price
  history, seller listings, wave companions, character cards, and the golden
  corpus doc all run under one `Promise.all` already (comment there dates
  this to the 2026-09-02 speed sweep).
- `vaultData.ts` — per-fandom `getLineWaveCounts` calls run under
  `Promise.all`; the owned/wanted figure lookup already went from N
  `getFigureById` calls to one `getFiguresByIds` batch (2026-09-02 gap sweep,
  per its own comment).
- `characterHub.tsx` — the per-fandom `getCardsByCharacter` and
  `isKnownFandom` calls already run under `Promise.all`.

## Candidates found

Two functions in `kbDb.ts` still had a genuine sequential shape: a `for`
loop over a Map of per-fandom figure lists, with an `await` (a D1 read)
**inside** the loop body, so fandom 2's round trip couldn't start until
fandom 1's finished.

### 1. `prettyFigureUrls` (src/data/kbDb.ts, was lines 492–507)

- **Call site:** `src/app/figure/[figure_id]/_components/FigureDetailContent.tsx:714`
  — `prettyFigureUrls([local, ...companionFigs, ...variantFigs])`, resolving
  canonical/related-link URLs for the current figure plus its wave companions
  and character variants.
- **Current round-trip count:** one `db.batch()` (via
  `prettyUrlCountsForCharacters`) per **distinct fandom** among the figures
  passed in, executed one after another (`for (const [fandom, list] of
  byFandom) { const part = await prettyUrlCountsForCharacters(...) }`).
- **Real-world impact today:** effectively **zero**. `local`, `companionFigs`
  (`getWaveCompanions(local.fandom, ...)`) and `variantFigs`
  (`getCardsByCharacter(local.fandom, ...)`) are all queried by the same
  `local.fandom`, so `byFandom` has exactly one entry at this call site today.
  I confirmed this is the only caller in the repo.
- **Proposed change:** replace the `for` loop's sequential `await` with
  `Promise.all` over the per-fandom reads, merging results after all resolve.
- **Effect on rows read:** none. Same SQL text, same bound parameters, same
  number of statements — only the wall-clock ordering changes. Merge order is
  provably irrelevant: `prettyUrlRouterCountKeys` (kbTypes.ts) prefixes every
  map key with `fandom`, so two different fandoms can never write the same
  key, and the resulting `Map` is identical regardless of which fandom's
  batch resolves first.
- **Status: implemented.** See below.

### 2. `prettyUrlCountsForLineHub` (src/data/kbDb.ts, was lines 519–541)

- **Call site:** `src/app/[genre]/[line]/_lib/lineHub.tsx:417` —
  `prettyUrlCountsForLineHub(figures, line)`, resolving per-figure pretty-URL
  uniqueness counts for a line hub's rendered rows.
- **Current round-trip count:** one `db.batch()` per distinct fandom that has
  at least one figure whose `product_line` differs from the hub's own line
  token (the "compound-matched, needs its true contributor count" case),
  again run one fandom at a time in a `for` loop.
- **Real-world impact today:** also **zero** in practice. `figures` at this
  call site is the full result of `getFiguresByLine(fandom, line)`, which is
  itself scoped to one fandom by its own first argument — so `byFandom` has
  exactly one entry here too. I confirmed this is the only caller in the repo.
- **Proposed change:** same pattern — `Promise.all` over the per-fandom
  "other lines" batches, merge afterward.
- **Effect on rows read:** none, for the same reason as above. A figure_id
  belongs to exactly one fandom, so two fandoms' result sets are disjoint by
  construction; merging via `if (!rows.has(r.figure_id)) rows.set(...)` in any
  order (sequential or concurrent) yields the same final map.
- **Status: implemented.** See below.

## Why these were still worth fixing despite zero current benefit

Both functions are general-purpose library code — their type signatures
(`figures: KBFigure[]`) don't guarantee a single fandom, only today's two
callers happen to pass single-fandom sets. The sequential shape was a latent
inefficiency, not an active one: it costs nothing today but would silently
reintroduce N serial round trips the moment a caller passes a mixed-fandom
list (a plausible future case — e.g. a cross-fandom "related figures" feature
would be more sequential than it needed to be, and nobody would notice
until they profiled it). Since the fix is small, provably read-equivalent
(same statements, same rows, order-independent merge — see above), and I
could pin it with a real test, I made the change rather than leaving it as a
report-only note per the task's stated bar ("provably read-equivalent... and
you can pin with a test").

I did **not** touch `getCardsByFandom` (the one remaining whole-fandom read)
or any other query shape — those aren't sequential-round-trip issues, and
`getCardsByFandom` is explicitly called out in `kbDbQueries.ts` as a
deliberate, documented exception ("The ONE remaining whole-fandom read"), out
of scope for a batching pass and not something to second-guess here.

## The code change

Both fixes are in `src/data/kbDb.ts`, converting:

```ts
for (const [fandom, list] of byFandom) {
  const part = await prettyUrlCountsForCharacters(fandom, ...)
  // merge part into an outer map
}
```

into:

```ts
const parts = await Promise.all(
  [...byFandom].map(([fandom, list]) => prettyUrlCountsForCharacters(fandom, ...)),
)
// merge all parts into the outer map, order-independent
```

(and the analogous change in `prettyUrlCountsForLineHub`, which additionally
inlines the per-fandom `otherLines` computation and `db.batch()` call inside
the mapped async function). No SQL in `kbDbQueries.ts` changed. No new
dependency was added.

## Test added

`tests/kbDbBatching.test.mjs` (new file) pins both fixes against regression:

- Installs a fake `KB_DB` D1 binding via the same `globalThis[Symbol.for('__cloudflare-context__')]`
  mechanism `tests/kvIncrementalCacheTtl.test.mjs` already uses for a
  different Cloudflare binding, with a small in-memory `kb_figures` fixture
  and a fake `session.batch()` that (a) counts calls, (b) tracks how many
  batches are in flight at once, and (c) awaits a `setTimeout` so overlapping
  calls are actually observable (a synchronous fake would make everything
  look "concurrent" trivially).
- For `prettyFigureUrls` and `prettyUrlCountsForLineHub`, each with a
  **multi-fandom** input: asserts the returned map/counts are correct (proof
  of read-equivalence — same predicate, same results) AND that
  `maxConcurrentBatches >= 2` (proof the two fandoms' reads actually
  overlapped, not just that the total call count stayed the same).
- Also covers the **single-fandom shape both real call sites use today**,
  asserting the expected batch count (1, or 0 when every figure already
  matches the hub's own line — the documented "common case: zero extra
  queries").
- I verified this test suite is a real regression guard, not just
  happy-path coverage: with the fix reverted (`git stash` back to the
  sequential `for` loops), 2 of the 4 new tests fail — specifically the
  concurrency assertions — while the correctness assertions still pass
  (because the sequential version was correct too, just slower). That
  confirms the test pins the *fix*, not merely the pre-existing behavior.

## Gate outputs

- `npx tsc --noEmit` — 0 errors.
- `npm test` — 505 tests (501 baseline + 4 new), 497 pass, 1 fail, 7 todo.
  The 1 failure (`googleIndexTier — canary artifact` › `floor (spec §3)...`)
  is the same pre-existing, data-dependent failure already present on
  unmodified `main` (see this branch's other PR commit/description) —
  unrelated to this change, not touched by it.
- `tests/kbRuntimeImports.test.mjs` — passes; this change adds no new import
  anywhere in `src/`, so the static "no runtime KB catalog import" scan is
  unaffected by construction.
- `scripts/assert-no-runtime-kb-in-handler.mjs` — this only runs against a
  compiled `.open-next` artifact from `npm run build:cf`, which this task's
  rules forbid running (no Cloudflare build/deploy). Not run. Given the diff
  adds zero new imports and zero new query shapes (only reorders existing
  `await`s into `Promise.all`), there is no plausible way this change could
  trip that gate; it should still be run by CI/a maintainer before deploy per
  normal process.

## Explicitly not done (no full-catalog reads added)

No query added or changed loads or iterates the full catalog. The only two
functions touched already ran bounded, per-fandom D1 reads before this
change; the fix only changes *when* those reads fire relative to each other,
never *what* they read. `getCardsByFandom` (whole-fandom, documented
exception) was left untouched.

## Other things noticed but not changed

- `getFigureByStableSuffix` awaits an in-memory `kbLite` lookup and then,
  conditionally, a D1 PK read — this looks sequential but isn't a batching
  candidate: the second read's argument (`lite.figure_id`) depends on the
  first call's result, and the first call isn't a D1 round trip at all (it's
  an in-process map lookup per its own comment), so there's nothing to
  parallelize.
- `prettyFigureUrl` (singular) does exactly one D1 read
  (`isPrettyUrlUnique`) — not a batching candidate.
- I did not find any other `for`/`for...of` loop containing an `await` of a
  D1 read anywhere in `kbDb.ts`; every other multi-statement read already
  goes through a single `db.batch()` call.
