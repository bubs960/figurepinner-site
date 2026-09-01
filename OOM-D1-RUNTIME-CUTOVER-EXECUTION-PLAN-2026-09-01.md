# FigurePinner Worker OOM and D1 Runtime Cutover — Execution Plan

**Prepared:** 2026-09-01 (ET)  
**Status:** implementation plan only; no production change is authorized by this document.  
**Audience:** the next coding model or engineer implementing the cutover.

## 1. Decision summary

The production Worker must stop loading the catalog at request time. The required fix is to remove the full `FIGURES_V2` catalog from the deployed OpenNext handler and replace its remaining runtime consumers with narrow D1 queries or small generated artifacts. This is not a cache-tuning, bot-blocking, or redeploy-only incident.

The current deployment script is unsafe for the first incident release because it deploys **and then** purges KV/zone cache and sends IndexNow notifications. Do not use `npm run deploy` for the canary. Use an uploaded Worker version and a gradual traffic split instead.

The worktree is already dirty from the partial D1 conversion. Preserve those changes. Do not reset, checkout, regenerate the catalog, re-seed production D1, purge cache, alter security settings, or deploy unless the owner explicitly authorizes that action at the time.

## 2. Evidence and diagnosis

### Confirmed facts

- The current local OpenNext handler was measured at roughly **41.6 MB** and contains a roughly **21.3 MB** catalog chunk. Earlier deployed-handler inspection measured 39.52 MiB and the embedded catalog at 21.03 MiB. Size varies by build; the import relationship is the important fact.
- `src/data/kb.ts` loads `figures-reference-v2.slim.js` at module scope. Any request-runtime path that reaches it imports the entire catalog before the route can do useful work.
- `/api/v1/_lib/kbSearch.ts` directly imports `getAllFigures()` and lazily constructs a module-global array containing every non-canary record plus lower-cased field bags. It is a second catalog-wide memory allocation even after a route is converted to D1.
- The outer cache Worker statically imports `.open-next/worker.js`. Therefore a cache rule or Next middleware cannot prevent memory used to load the handler on a cold isolate. A cache hit can conceal the problem, but it does not remove it.
- The production D1 catalog currently has 24,416 rows, matching the last checked local slim catalog row count. This must be re-verified immediately before cutover; it is not a permanent guarantee.
- The attached September 1 log export contained a scanner burst, but it also contained OOMs from ordinary crawlers. The scanner is an amplifier, not a sufficient root cause. Two `/api/v1/search` requests logged `Network connection lost`; this is consistent with the unguarded cache API call, but the logs do not prove the Cache API was the source.

### Runtime load path

```text
request
  -> edge-cache-entry.mjs
      -> static import of .open-next/worker.js
          -> route/module graph
              -> src/data/kb.ts
                  -> figures-reference-v2.slim.js (entire catalog)
              -> kbSearch INDEX (entire catalog plus normalized strings)
  -> memory pressure / Worker exceeded memory limit / HTTP 503
```

### Current high-risk code paths

The next model must confirm this list from the live tree and the built handler rather than assuming it is exhaustive.

| Area | Current issue | Required direction |
| --- | --- | --- |
| `src/app/api/v1/_lib/kbSearch.ts` | Direct `@/data/kb` import and global full-catalog `INDEX`. | Bounded candidate retrieval; preserve the existing scorer and all result ordering. |
| `src/app/[genre]/[line]/[slug]/_lib/findFigureMatches.ts` | Fetches an entire fandom, then filters by line and character in JavaScript. | One exact, indexed query matching the existing router semantics. |
| `src/lib/genreFigures.ts` | `figuresForGenre` does multiple full-fandom reads. | Use grouped counts or compact card projections, depending on the caller. |
| `src/data/kbDb.ts` | `getFiguresByFandom` and `getFiguresByLine` select full records; `LOWER()` predicates may defeat useful indexes. | Split detail and list projections; normalize/index route keys where query plans require it. |
| home, guides, sitemap, robots | Historical runtime catalog consumers or indirect consumers. | Small generated artifacts or explicitly bounded D1 reads. |
| `edge-cache-entry.mjs` | `await cache.match(key)` is unguarded. | Fail open for cache infrastructure errors; never turn a cache error into a site-wide error. |

### Explicit non-conclusions

- Do **not** claim that an `x-middleware-subrequest` header proves an authentication bypass. It is a scanner fingerprint that needs a separate Next/security review.
- Do **not** claim D1 FTS is available, performant, or semantically suitable until it is proven in a disposable local/staging table with FigurePinner queries.
- Do **not** call a single HTTP 200, especially one with `x-fp-edge: HIT`, proof that OOM is resolved.
- Do **not** treat `unclassified` traffic as proven human traffic.
- Do **not** assume a rollback fixes the incident: the currently deployed and earlier versions both showed OOM behavior.

## 3. Success criteria and release boundaries

### Incident release is complete only when all of these are true

1. The production handler contains no `FIGURES_V2`, `figures-reference-v2.slim.js`, or equivalent full-catalog module/chunk.
2. No request-runtime module imports `@/data/kb`; any exception must be proven build-only by inspecting the OpenNext output and documented in the pull request.
3. D1 parity and behavior fixtures pass, including canonical URL ambiguity, search ranking, typo handling, and `is_canary` exclusion.
4. Representative **cold/cache-miss** canary requests complete correctly, with no candidate-version `exceededMemory` events and no D1 errors.
5. Candidate CPU and error telemetry are acceptable relative to the recorded baseline; report the observation window and sample size instead of declaring success from sparse traffic.

### Keep separate from the incident release

- Next/PostCSS/Sharp/Nanoid dependency upgrades.
- TLS minimum version, WAF/security-level, and CSP enforcement changes.
- Compatibility-date change.
- Broad lint remediation.
- Cache/IndexNow purge.
- Production D1 schema rebuild or catalog reload.

Those are real health tasks, but combining them with the OOM canary makes diagnosis and rollback ambiguous.

## 4. Work package A — preserve behavior before moving data

### Objective

Create a small, reviewable behavioral contract so the data access layer can change without silently changing public URLs, results, SEO content, or search ranking.

### Implementation steps

1. Inspect the current dirty tree and record it before making changes:

   ```powershell
   git status --short
   git diff --check
   ```

   Do not clean the tree. Keep unrelated user modifications out of commits for this work.

2. Add a **checked-in, deliberately generated** parity fixture. It must not contain the entire catalog or third-party expressive copy. It should contain only the necessary IDs, normalized fields, expected URLs, rank order, and result counts.

3. Include at least these fixture classes:

   - direct figure ID resolution;
   - stable-suffix resolution, including an unresolved or ambiguous suffix;
   - a pretty URL that is unique and one that is ambiguous under the router's manufacturer-plus-line rule;
   - fandom, line, character, and genre hub counts/ordering;
   - detail-page fields used by the renderer;
   - sitemap and robots output invariants;
   - `/api/v1/search` and price-check searches with exact expected IDs and ordering;
   - short, punctuation-heavy, typo, strict, and relaxed queries, including `G.I.` and `Gi jo` because they occurred in the incident logs;
   - a canary figure assertion proving it never enters public search or price-check output.

4. Generate the fixture once from the pre-cutover behavior, review its diff, and then make the normal test path **read-only**. Never overwrite expected values while trying to make a failing conversion pass.

5. Add tests that execute both the old-reference adapter (only while it still exists) and the new D1 adapter against the fixture. The final state may remove the old adapter, but the fixture stays as a regression contract.

6. Run baseline checks before and after each focused change:

   ```powershell
   npm test
   npx tsc --noEmit
   ```

### Definition of done

- A reviewer can see exactly what behavior is protected without reading the full catalog.
- A D1 result mismatch identifies the route/query/fixture case, rather than merely failing a broad snapshot.
- No expected data was regenerated during a failing implementation run.

### Stop and investigate if

- D1 count, unique figure ID count, or a required field differs from the source catalog.
- A canonical URL or result rank differs and the reason is not explicitly approved.
- The test only succeeds by changing the fixture without an intentional product decision.

## 5. Work package B — inventory and sever every runtime catalog import

### Objective

Make the handler's dependency graph unable to reach the full catalog.

### Implementation steps

1. Produce a source inventory of direct and indirect catalog consumers. Start with:

   ```powershell
   rg -n "@/data/kb|figures-reference-v2|FIGURES_V2|getAllFigures" src scripts
   ```

   Classify each occurrence as one of:

   - build-only and proven absent from the Worker handler;
   - request/ISR runtime consumer requiring conversion;
   - test-only;
   - comment/type-only false positive.

2. Treat these as priority runtime consumers until disproven by the built graph:

   - `src/app/api/v1/_lib/kbSearch.ts`
   - `src/app/page.tsx` and its home receipt/data helpers
   - `src/app/guides/page.tsx`, `src/app/guides/[slug]/page.tsx`, `src/app/guides/red-white-blue/page.tsx`, and `src/app/guides/_data/fandomHubs.ts`
   - `src/app/robots.ts`, `src/app/sitemap.ts`, and `src/app/sitemap-index.xml/route.ts`
   - figure, pretty-figure, character, line, genre, and OG-image consumers that still reach `kb.ts` indirectly.

3. For every static/SEO route, choose the smallest correct replacement:

   - **Generated compact artifact** for stable metadata such as counts, featured IDs, sitemap shards, or guide facts. The artifact must contain only the fields used at runtime.
   - **Narrow D1 query** when data is dynamic or too large to generate safely.
   - Do not replace a catalog import with another module that imports the catalog indirectly.

4. Preserve the existing generated-sidecar approach for enriched copy only if it remains compact and is not rebuilt into the handler from `kb.ts`. Review `scripts/build-kb-stats.mjs`, `src/data/enriched-copy.generated.json`, and `src/data/kb-stats.generated.json` as a single unit.

5. Add an automated build assertion, for example `scripts/assert-no-runtime-kb-in-handler.mjs`, that runs after `npm run build:cf` and fails on:

   - `FIGURES_V2`;
   - `figures-reference-v2`;
   - known catalog module paths;
   - a catalog-sized emitted chunk connected to the default handler.

   The assertion should print the matching artifact path and byte size. It must inspect the final `.open-next/server-functions/default/handler.mjs` plus linked chunks, not just TypeScript source.

6. Record handler and linked-chunk sizes before and after. Require the catalog chunk's removal, not an arbitrary total-size target: framework output can fluctuate independently.

### Definition of done

- Source inventory is committed or included in the PR description.
- The build assertion passes and its negative test proves it fails when a known catalog import is restored.
- The final production handler is catalog-free.

### Failure mode to avoid

Converting only detail pages is insufficient. Homepage, sitemap, guide, API, and dynamic image imports can all retain the large module in the shared handler even if their individual URLs are rarely visited.

## 6. Work package C — replace broad D1 reads with bounded query contracts

### Objective

Avoid trading Worker memory OOM for expensive D1 scans, large result payloads, or N+1 requests.

### Current gaps

`src/data/kbDb.ts` currently has a correct D1 direction but still exposes broad methods:

- `getFiguresByFandom()` selects `FULL_COLS` for every record in a fandom.
- `getFiguresByLine()` uses `LOWER()` and a compound `manufacturer || '-' || product_line` expression, then selects full records.
- `findFigureMatches()` calls the broad fandom method and filters in JavaScript.
- `figuresForGenre()` performs several broad fandom reads in parallel.
- pretty URL checks can create repeated count queries.
- stable-suffix lookup may require a broad substring scan; measure its actual query plan before deciding on a schema change.

### Design rules

1. **One purpose, one projection.** Define separate types and SELECT column lists for:

   - full detail records;
   - compact list/card records;
   - route matching records;
   - count/grouping rows;
   - search candidates.

   A hub must never fetch `key_features` or other prose merely to render a card count.

2. **Move route normalization into indexed data, not `LOWER()` scans.** Preserve current router semantics exactly, including both bare `product_line` and `manufacturer-product_line` route forms. If query-plan testing shows existing indexes do not serve that rule, add explicit normalized columns or a generated route-key table and index those values. Do not guess that SQLite will use an expression in the desired way.

3. **Make canonical/pretty URL resolution batchable.** For a page resolving many links, fetch the narrow route-key set once and build an in-request map. Retain a single-record method for detail routes only.

4. **Use the database for filtering and grouping.** `findFigureMatches()` must call a dedicated exact helper rather than `getFiguresByFandom(...).filter(...)`. Genre and hub pages should request compact cards, grouped counts, or only the explicit figures they render.

5. **Bound every non-primary-key lookup.** A stable suffix needs a measured plan. If it cannot be resolved by a selective current index, add a deterministic stored suffix/uniqueness representation through a reviewed migration; do not leave an unbounded `LIKE '%suffix'` query on a public path.

### Required implementation sequence

1. Read all callers of `getFiguresByFandom`, `getFiguresByLine`, `isPrettyUrlUnique`, `getFigureByStableSuffix`, `findFigureMatches`, and `figuresForGenre` before changing their signatures.
2. Add narrow helper(s) for exact route matching and compact hubs first. Keep old helpers temporarily so the caller migration can be reviewed in small commits.
3. Move each caller and add a fixture assertion for that caller's routing and output semantics.
4. Delete or restrict broad helpers only after no request path uses them. If a legitimate admin/build path needs a bulk helper, locate it outside the production request handler and prove it is excluded from the built Worker.
5. In local or disposable staging D1, run `EXPLAIN QUERY PLAN` for exact route, line, character, pretty-URL, stable-suffix, and search candidate queries. Record the plan in the PR or test notes.
6. Measure rows returned and query count for representative large fandoms. The acceptance rule is bounded, intentional data movement—not merely a fast run on a small fixture.

### Definition of done

- No public route requires a full-fandom `FULL_COLS` query to find one record.
- Query plans use the intended selective indexes or a documented, measured alternative.
- Route/pretty URL behavior matches the fixture exactly.
- No D1 schema mutation has been made in production without an explicit migration/rehearsal/backup decision.

## 7. Work package D — rebuild search without a full-catalog Worker index

### Objective

Preserve FigurePinner's strict/corrected/relaxed search behavior while eliminating `getAllFigures()` and global `INDEX` from request runtime.

### Why this is a separate subproject

Search and price-check share the same matcher. Replacing it with a generic SQL `LIKE` query would appear to fix memory but would silently degrade typos, punctuation, relevancy, canary exclusion, and ordering. The current ranking code is product behavior and must be preserved until a tested replacement is approved.

### Implementation steps

1. Identify every public caller of `kbSearch` and verify whether its output is consumed by `/api/v1/search`, price check, autocomplete, or SEO surfaces.
2. Extract the existing ranking/scoring function from data acquisition where practical. The scorer should accept a bounded array of candidate records, not call `getAllFigures()` itself.
3. Establish a search-candidate contract containing only the fields the scorer needs: stable ID, canonical character/name/line/manufacturer/fandom fields, image/URL fields required by response mapping, and `is_canary`. Do not include detail prose.
4. Run a disposable local/staging D1 feasibility test for FTS. It must prove all of the following before FTS is selected:

   - supported creation/update behavior in the actual D1 environment;
   - punctuation and short-token behavior for FigurePinner terms;
   - a safe way to exclude `is_canary` figures;
   - candidate limits, ordering, and query cost that work with the existing scorer;
   - a rebuild/update path that cannot desynchronize from the catalog.

5. If FTS passes, use it only to retrieve a bounded candidate set, then run the established FigurePinner scorer to choose final order. Do not expose raw FTS order as the new product ranking.
6. If FTS does not pass, implement a compact generated or sharded KV/R2 candidate index. It must be token/prefix-addressable; loading a complete JSON search index into a Worker merely recreates the OOM under a different filename.
7. Add explicit input bounds and candidate caps justified by benchmark and fixture behavior. Do not choose an arbitrary cap that truncates valid results; record the tested upper bound and the reason for it.
8. Update stale API comments that say the endpoint searches the local in-memory KB.

### Required tests

- Exact expected IDs and ordering for the golden query set.
- `G.I.`, `Gi jo`, names with punctuation, aliases, common substrings, unknown terms, and typo/relaxed cases.
- `MAX_RESULTS` behavior.
- `is_canary` exclusion in both search and price-check.
- A simulated D1/FTS/KV failure: return a controlled error or documented degraded behavior; never fall back to importing the catalog.
- A memory guard: test that search candidate acquisition does not call broad D1 list methods.

### Definition of done

- `src/app/api/v1/_lib/kbSearch.ts` no longer imports `@/data/kb` or maintains a global full-catalog index.
- Search and price-check parity fixtures pass.
- The selected candidate mechanism is documented with its refresh/rebuild operation and failure behavior.

## 8. Work package E — make the cache wrapper fail open

### Objective

Prevent cache infrastructure errors from becoming user-visible request failures, while retaining cache telemetry.

### Implementation steps

1. Read `edge-cache-entry.mjs` in full, including `edge-cache-policy.mjs` and its unit tests. Preserve its auth, RSC, rate-limit, response, cache-control, and cache-key guarantees.
2. Wrap `caches.default.match(key)` in a narrow `try/catch`.
3. On a cache-match failure:

   - record a structured, low-cardinality cache-error event;
   - omit raw query strings, cookies, tokens, and user identifiers from telemetry;
   - continue to `handler.fetch(request, env, ctx)` as a cache miss;
   - do not rethrow and do not synthesize a false cache hit.

4. Review `cache.put`/background write behavior separately. Failed cache writes should not invalidate an already-successful origin response, and promises must be awaited, explicitly voided, or attached with `ctx.waitUntil()` according to current Worker behavior.
5. Add tests for match failure, hit, miss, bypass, rate-limited figure routes, and authenticated/RSC exclusions.

### Important limitation

This is availability hygiene, not the OOM fix. Because the handler is statically imported, the wrapper cannot protect a cold isolate from catalog-loading memory pressure. Do not present this patch as sufficient mitigation for the main incident.

### Definition of done

- A simulated cache-match exception returns the normal handler response with a cache-bypass/error diagnostic.
- No sensitive request data is logged.
- Existing edge-cache ordering tests still pass.

## 9. Work package F — build, test, and inspect the actual Worker artifact

### Objective

Catch the deployment-specific failure mode before any version reaches traffic.

### Required checks

1. Use the existing Cloudflare build command:

   ```powershell
   npm run build:cf
   ```

2. Inspect the default handler and linked chunks for catalog sentinels. Run the automated assertion from Work Package B and retain its output as release evidence.
3. Record:

   - handler size;
   - largest linked chunks;
   - whether `FIGURES_V2` and catalog paths are absent;
   - build warnings;
   - generated sidecar sizes.

4. Run:

   ```powershell
   npm test
   npx tsc --noEmit
   npx wrangler check --config wrangler.toml
   ```

5. The repository's current `npm run lint` is not a release signal yet: it traverses generated artifacts and reports thousands of problems. First narrow the lint scope/ignore configuration so generated OpenNext/Next artifacts are excluded, then require zero lint errors on changed source files. Full source cleanup is a separate health workstream.

6. If bindings or Wrangler configuration changed, generate and review Worker binding types using the project-approved output path. Do not hand-write a replacement `Env` type.

### Definition of done

- A clean build result has evidence that the catalog is out of the handler.
- Tests cover the new behavior, not merely TypeScript compilation.
- No build command has deployed, purged caches, or contacted production D1 for mutation.

## 10. Work package G — controlled version canary

### Authority gate

Do not perform this work package until the owner explicitly authorizes an immutable production-version upload and gradual deployment. Version upload and traffic changes are external production writes even when the first traffic percentage is zero or small.

### Why this route

The local `deploy` script includes production cache/KV purge and IndexNow work after deployment. A version upload followed by `wrangler versions deploy` allows one code/config version to receive limited traffic while the current version remains live. Current Wrangler 4.107 supports `versions upload` and `versions deploy <version>@<percentage>`; confirm the installed CLI help again immediately before execution.

### Preconditions

- Work Packages A–F are complete.
- The current production version ID and traffic allocation are recorded.
- Dashboard-managed variables are inventoried. If dashboard non-secret variables exist, determine whether `--keep-vars` is required before upload; do not silently delete remote configuration.
- A named owner is available during the canary.
- An observation query/dashboard is ready to filter by Worker version ID and to separate cache hit/miss/bypass requests.
- No D1 migration, cache purge, dependency upgrade, CSP/TLS/WAF change, or unrelated feature is included.

### Proposed execution sequence

1. Build locally and rerun all Work Package F gates.
2. Upload the already-built candidate as a tagged immutable version. Record the returned version ID, tag, message, Wrangler version, git commit, and artifact sizes. Upload itself does not make it the active traffic version; verify this from CLI output rather than relying on memory.
3. Inspect the uploaded version and verify that bindings, routes, compatibility settings, and variables match the intended configuration.
4. Deploy the candidate at a small traffic allocation, retaining the current version for the remaining traffic. Use explicit version IDs and percentages; never rely on an implicit “latest” selection.
5. Exercise all representative paths against the candidate. Because this site has low traffic, passive traffic alone is inadequate. Before probing, inspect the real cache-key and bypass rules so the test genuinely reaches a cold/cache-miss path without corrupting canonical content or creating uncontrolled cache variants.
6. Observe for a meaningful time window and enough targeted requests. Record sample size, version-specific errors, OOMs, D1 errors, response status, CPU time, and output parity. Do not call a quiet five-minute window proof at this traffic level.
7. Promote through explicit stages (for example, small canary, 25%, 50%, then 100%) only after the stated gate passes at each stage. Actual percentages and dwell times are an owner decision; record them.
8. After 100%, continue version-specific monitoring. Cache entries can be version-scoped, so first-request/cold behavior needs observation after every promotion.
9. Only after the new version is stable should the owner decide whether a controlled stale-cache purge is necessary. IndexNow is a separate deliberate action, not an automatic part of this incident release.

### Canary route matrix

Test at least one valid representative of each route shape, using the parity fixture as the authority for expected result:

| Route family | Validate |
| --- | --- |
| `/` and guides | title/content/count inputs; cache and response headers. |
| `/figure/[figure_id]` | detail data, canonical URL, image, no D1 error. |
| pretty figure route | unique and ambiguous/canonical redirect behavior. |
| genre, line, character, and detail route | correct filters, count/order, no broad-query regression. |
| dynamic OG image | valid image response and no catalog import path. |
| `/api/v1/search` | golden exact/typo/punctuation results and response shape. |
| price check | shared search behavior, canary exclusion, response shape. |
| robots/sitemap/index | expected URLs/counts, response headers, no runtime catalog access. |

### Abort and recovery rules

Immediately return candidate traffic to 0% and leave the current version at 100% if any of the following occurs:

- any candidate-version `outcome=exceededMemory`;
- a wrong canonical redirect, wrong figure identity, missing key response field, or broken auth/RSC behavior;
- a D1 failure that affects public response correctness;
- meaningful CPU/error regression with a comparable request sample;
- unexpected remote binding/config change.

Record the request ID, version ID, timestamp, route, cache mode, and observed response before investigating. Restoring the current version only contains a bad candidate; it does **not** resolve the existing OOM risk, so retain the incident monitor.

## 11. Health workstream H — security and platform hygiene (post-canary)

These tasks should be planned now but shipped in separate, reversible changes after the OOM release is stable.

### H1. Dependency security update

**Observed:** production dependency audit reported high-severity findings involving Next 15.5.20, PostCSS 8.4.31, Sharp 0.34.5, and Nanoid 3.3.11.

**Plan:**

1. Read each advisory and determine reachability in this application; do not treat `npm audit fix` as a plan.
2. Upgrade in a dedicated branch/commit, preserving lockfile integrity.
3. Run unit tests, TypeScript checks, Cloudflare build, auth flows, checkout/Stripe-related flows, image/Sharp behavior, and the OOM artifact assertion.
4. Canary separately. Framework changes can alter OpenNext output and request middleware behavior.

**Done when:** advisory disposition and exact versions are recorded, test coverage passes, and the artifact remains catalog-free.

### H2. Scanner and abuse posture

**Observed:** a burst from an unverified Google-hosted IP sent Next/GraphQL/auth-looking junk URLs, with repeated middleware-looking header values. This caused noisy 404 revalidation and 503s during the OOM incident. No successful bypass was demonstrated.

**Plan:**

1. Preserve a redacted request fingerprint and frequency evidence.
2. Upgrade/review Next before relying on behavior related to middleware-internal headers.
3. If traffic continues after the OOM fix, propose a narrowly scoped, time-bounded edge/zone containment rule based on stable junk path patterns and verified abuse evidence.
4. Test rule candidates against valid site, API, auth, crawler, image, and webhook traffic before activation.
5. Obtain explicit owner approval before creating or changing a Cloudflare security rule.

**Do not:** block all Google-hosted addresses, all bots, or a header merely because it appeared in scanner traffic.

### H3. TLS, zone security level, and CSP

**Observed:** TLS minimum was 1.0, generic security level was effectively off, and CSP was report-only with inline allowances. Existing app headers otherwise include HSTS, X-Frame-Options, nosniff, referrer policy, and permissions policy.

**Plan:**

1. Determine audience/client compatibility before raising the minimum TLS version; propose 1.2+ only with approval and a rollback window.
2. Decide the desired abuse policy before changing the generic security level or WAF. Do not treat a dashboard default as a product decision.
3. Collect CSP report-only observations, identify required sources and inline behavior, and fix first-party violations.
4. Enforce CSP only in a separate canary after a documented allowlist and report review.

### H4. Worker configuration and types

**Observed:** `wrangler.toml` has an older compatibility date, manually maintained type boundaries, and comments with stale catalog-count context.

**Plan:**

1. Update compatibility date only as a separate compatibility-tested release. It can change runtime behavior.
2. Use `wrangler types` after binding/config work, commit generated binding types if this repository convention requires it, and remove hand-written `Env`/unsafe `any` patterns gradually.
3. Update stale comments only from newly verified data. Comments must not become a substitute for telemetry.

### H5. Lint and generated-artifact hygiene

**Observed:** full lint reports 654 errors and 3,764 warnings because generated directories are included; source-only lint still reported 204 errors and 37 warnings.

**Plan:**

1. Exclude `.next`, `.next-liquid-canary`, `.open-next`, and other generated artifacts through the project’s ESLint configuration, not by hiding real `src` failures.
2. Add a CI-friendly source lint command with a stable target.
3. Fix source errors in small themed batches: routing links, unescaped entities, then unsafe types and remaining correctness errors.
4. Make zero errors in changed files a gate now; set an explicit backlog and milestones for global zero errors.

### H6. Existing non-OOM error noise

**Observed:** isolated timeouts and repeated revalidation 404s for junk/passkey/manifest-style paths appeared in logs.

**Plan:**

1. Correlate each class with request IDs, route behavior, and frequency after the OOM release.
2. Fix a revalidation source only when its intended behavior is identified; do not add broad rewrites to silence logs.
3. Keep timeouts as a separate trace investigation unless correlation shows a shared D1/cache/root cause.

## 12. Monitoring and evidence package

### Continue monitoring during the wait

The existing monitor should continue to compare the latest two-hour `exceededMemory` count with the earlier 11-failure baseline and track six-hour CPU against the approximately 13.1 million CPU-ms historical baseline. These are incident snapshots, not billing totals.

Notify the owner early if:

- OOM rate materially increases or remains elevated across windows;
- plausible human/unclassified traffic is materially affected (clearly label the confidence level);
- candidate-version OOM occurs during the canary;
- projected additional CPU cost exceeds the owner’s “few dollars” threshold;
- new errors show a different root cause.

### What to capture for every investigation or rollout stage

- UTC and ET time window;
- Worker version ID and traffic allocation;
- OOM count correlated to unique request IDs, not raw log-row count alone;
- route shape, response status, verified bot classification, and cache state when available;
- D1 errors and query behavior;
- CPU time, invocation count, and the method used to estimate cost;
- precise build artifact sizes and catalog-sentinel assertion output;
- git commit and dirty-tree status.

### Required handoff report format

At each milestone, the implementing model should report:

1. **What changed** — exact files and data/query contracts.
2. **What was verified** — command output summarized with result and timestamps.
3. **What is still unproven** — especially FTS behavior, low-traffic canary confidence, and cache error attribution.
4. **Whether production changed** — version ID, traffic split, cache purge status, and D1 migration status.
5. **Next explicit approval needed** — never assume permission for deploys, cache purges, D1 writes, or zone security changes.

## 13. Ordered execution checklist

- [ ] Record working-tree status; preserve unrelated dirty changes.
- [ ] Build and review the behavior/parity fixture.
- [ ] Reconfirm D1 count, IDs, and required field parity without mutating production.
- [ ] Inventory every runtime catalog import and indirect path.
- [ ] Convert non-search runtime consumers to compact artifacts/narrow D1 helpers.
- [ ] Replace broad D1 route/hub reads with indexed, bounded contracts.
- [ ] Prove and implement the search candidate strategy; retain ranking parity.
- [ ] Add cache-match fail-open behavior and its tests.
- [ ] Add handler catalog-sentinel assertion and run Cloudflare build/test/type/config checks.
- [ ] Obtain explicit approval for a version upload and canary.
- [ ] Upload immutable candidate; inspect configuration; deploy small split.
- [ ] Run cold/cache-miss route matrix and observe version-specific telemetry.
- [ ] Promote only through passed gates; stop on the defined abort conditions.
- [ ] After stable 100%, schedule separate dependency, security, configuration, and lint releases.

## 14. References

- Local incident log: `C:\\Users\\bubs9\\Downloads\\logs-2026-09-01T11_58_16.488Z.json`
- Current Worker wrapper: `edge-cache-entry.mjs`
- Catalog load boundary: `src/data/kb.ts`
- D1 data access: `src/data/kbDb.ts`
- Search load path: `src/app/api/v1/_lib/kbSearch.ts`
- Current deploy script: `package.json` (`deploy`)
- Current Worker configuration: `wrangler.toml`
- [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [Cloudflare gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/)
- [Cloudflare Cache configuration](https://developers.cloudflare.com/workers/cache/configuration/)

