# API surface inventory — 2026-09-26

Report-only inventory of every route under `src/app/api/**`, focused on the
apparent duplication between `/api/*` and `/api/v1/*`. No code was changed
for this document. All findings below were verified by reading the route
source directly (spot-checked a sample of claims produced by a research
pass — see Methodology).

## Admin / ops routes (no `/v1` twin)

| Path | Methods | Auth gate | Twin? | Internal callers |
|---|---|---|---|---|
| `/api/admin/health` | GET | `requireAdmin({kind:'allowlist'})` — Clerk userId vs `FP_ADMIN_USER_IDS` | no | none found in repo — ops/external only |
| `/api/admin/kv-audit` | GET | `requireAdmin({kind:'allowlist', emptyAllowlist:'forbidden'})` | no | none found — ops only |
| `/api/admin/news` | POST | `requireAdmin({kind:'allowlist'})` | no | `src/app/admin/news/_components/NewsForm.tsx` |
| `/api/cache-stats` | GET | `requireAdmin({kind:'secret', header:'x-cache-stats-key', envVar:'CACHE_STATS_KEY'})`, fails closed | no | none found — external ops/digest reader |
| `/api/daily-uniques` | GET | same shared-secret gate as cache-stats, plus a separate `DAILY_UNIQUES_DEBUG_KEY` gate + rate limit for `?debug`/`?introspect` | no | none found — external ops/digest reader |
| `/api/funnel-stats` | GET | `requireAdmin({kind:'secret', header:'x-funnel-stats-key', envVar:'FUNNEL_STATS_KEY'})` | no | none found — external reader |
| `/api/healthz` | GET | none (public, deliberately reports less than `/api/admin/health`) | no | public uptime-check target; no internal fetch found |

Note: `src/middleware.ts` requires a signed-in Clerk session for `/api/admin(.*)`
at the middleware layer; the other ops routes (health-key style) rely solely
on the per-route `requireAdmin` secret check, not middleware.

## Public / unauthenticated content & utility routes (no `/v1` twin)

| Path | Methods | Auth gate | Twin? | Internal callers |
|---|---|---|---|---|
| `/api/news` | GET | none (public) | no | none found in `src/`; public JSON, allowlisted for CDN caching in middleware |
| `/api/sparklines` | GET | none, `checkRateLimit` | no | `SearchInterface.tsx`, `HeroSearch.tsx`, `railMedianBatch.ts`, `QuickLookAnchor.tsx` |
| `/api/upc` | GET | none, `checkRateLimit(20/min)` | no | `scan/page.tsx` |
| `/api/waitlist/count` | GET | none (public, cached) | no | none found in current `src/` (may serve a page not matched by grep, or an external caller) |
| `/api/waitlist/subscribe` | POST | none, `checkRateLimit(5/min)` | no | none found in current `src/` (the coming-soon page that used it appears disabled) |
| `/api/shelf/share` | POST | Clerk `auth()` | no | `ShareShelfButton.tsx` |
| `/api/funnel` | POST | none, `checkRateLimit` (soft) | no | `src/app/_lib/funnelClient.ts` (sendBeacon/fetch) |

## Stripe routes (no `/v1` twin)

| Path | Methods | Auth gate | Twin? | Internal callers |
|---|---|---|---|---|
| `/api/stripe/checkout` | POST | Clerk `auth()` + `clerkClient` lookup, `checkRateLimit` | no | `ProUpgradeButton.tsx` |
| `/api/stripe/portal` | POST | Clerk `auth()` + `clerkClient`, `checkRateLimit` | no | `app/settings/page.tsx` |
| `/api/stripe/webhook` | POST | `verifyStripeSignature` (HMAC on `stripe-signature` header); no user auth, signature-only | no | Stripe (external); not called internally |

## The duplicated pairs (`/api/*` vs `/api/v1/*`)

### alerts

| Path | Methods | Auth | Shared or diverged | Internal callers |
|---|---|---|---|---|
| `/api/alerts` | GET, POST | Clerk `auth()`; POST gated by `isUserPro`/`FREE_LIMITS.ALERTS` (`@/lib/proStatus`, imported by both twins) | **Diverged / copy-paste duplicate.** SQL and gate logic are line-for-line equivalent to the v1 twin but live as independent code, not a shared helper. GET does `SELECT *`; v1's GET selects an explicit column list — same data, narrower shape. | `app/app/alerts/page.tsx`, `FigureActions.tsx` |
| `/api/alerts/[id]` | PATCH, DELETE | Clerk `auth()` | **Diverged / duplicate.** Same SQL/logic. Non-v1 DELETE checks `meta.changes===0` after running the DELETE; v1 DELETE does a pre-check SELECT then DELETE (extra round trip, same outcome). | `app/app/alerts/page.tsx` |
| `/api/v1/alerts` | GET, POST | Clerk session cookie OR Bearer JWT (per route doc comment — mobile app) | see above | none found in repo — external (mobile) caller likely, per route's own doc comment |
| `/api/v1/alerts/[id]` | PATCH, DELETE | same as above | see above | none found in repo — external (mobile) likely |

### vault

| Path | Methods | Auth | Shared or diverged | Internal callers |
|---|---|---|---|---|
| `/api/vault` | GET, POST | Clerk `auth()`; POST gated by `isUserPro`/`FREE_LIMITS.VAULT` | **Diverged.** Both `/api/vault` and `/api/v1/vault` independently define an identical local `insertVaultItem` helper — not imported from a shared module (the v1 file's own comment says "same pattern as /api/vault"). GET: non-v1 does `SELECT *`; v1 selects explicit columns. POST 402 body differs: non-v1's `upgrade_url` is `/pro` (relative); v1's is the absolute `https://figurepinner.com/pro` (needed since a mobile client has no site origin). | `vaultAdd.ts`, `VaultClient.tsx`, `WaveProgress.tsx` |
| `/api/v1/vault` | GET, POST | Clerk session cookie OR Bearer JWT | see above | **`PersonalizedShelf.tsx` calls `/api/v1/vault` (GET) directly from a web component** — confirmed by grep (`src/app/components/PersonalizedShelf.tsx:65`). This is not mobile-only; the web app itself depends on the v1 GET. |
| `/api/vault/[id]` | PATCH, DELETE | Clerk `auth()` | **Genuinely different behavior, not just duplicated code.** Confirmed by reading both files: DELETE here runs `DELETE FROM vault_items WHERE id = ? AND user_id = ?` — a **hard delete**. Also supports PATCH (paid/condition update); v1's item route has no PATCH. | `VaultClient.tsx` (PATCH + DELETE) |
| `/api/v1/vault/items/[id]` | DELETE | Clerk session cookie OR Bearer JWT | DELETE here runs `UPDATE vault_items SET status = 'removed' WHERE id = ? AND user_id = ?` — a **soft delete**. The route's own doc comment states "hard deletes are via /api/vault/:id", i.e. this split is intentional and documented, not accidental drift. Note the path shape also differs: `vault/[id]` vs `vault/items/[id]`. | none found in repo — external (mobile) likely |
| `/api/vault/export` | GET | Clerk `auth()` + `isUserPro` | no v1 twin | `app/app/vault/page.tsx` (plain `<a href>` download link) |
| `/api/vault/status` | GET | Clerk `auth()` (single-figure ownership check) | no v1 twin (v1 has no equivalent single-item lookup) | `src/app/_lib/useOwnershipStatus.ts` |

### wantlist

| Path | Methods | Auth | Shared or diverged | Internal callers |
|---|---|---|---|---|
| `/api/wantlist` | GET, POST | Clerk `auth()`, no pro gate (unlimited on both tiers) | **Diverged.** `/api/v1/wantlist` factors its INSERT into a local `insertWantlistItem` helper (comment: "Matches the pattern in /api/vault and /api/v1/vault") — again not a shared/imported helper, just parallel code. `/api/wantlist` inlines the same INSERT directly. GET: non-v1 `SELECT *`; v1 selects explicit columns. Dup-check and error shapes otherwise identical. | `SearchInterface.tsx`, `FigureActions.tsx`, `app/wantlist/page.tsx`, `app/page.tsx` |
| `/api/v1/wantlist` | GET, POST | Clerk session cookie OR Bearer JWT | see above | none found in repo — external (mobile) likely |
| `/api/wantlist/[id]` | PATCH, DELETE | Clerk `auth()` | **Genuinely different behavior.** DELETE hard-deletes, same pattern as vault's item route. PATCH missing `target_price` returns `{error:'No fields to update'}`. | `app/wantlist/page.tsx` |
| `/api/v1/wantlist/item/[id]` | PATCH, DELETE | Clerk session cookie OR Bearer JWT | DELETE soft-deletes (`status='removed'`), pre-checks `status='active'` before the update. PATCH missing `target_price` returns `{error:'target_price is required'}` — same 400 status, different error string than the non-v1 twin. Note the path uses singular `item` (route comment: "to match spec verbatim"). | none found in repo — external (mobile) likely |

### user-settings

| Path | Methods | Auth | Shared or diverged | Internal callers |
|---|---|---|---|---|
| `/api/user-settings` | GET, PUT | Clerk `auth()` | **Fully diverged copy-paste duplicate** — verified the SELECT/UPSERT SQL, defaults object, and response shape are identical between the two files. No shared helper; a schema or bug fix has to be applied in both places today. | `app/settings/page.tsx` |
| `/api/v1/user-settings` | GET, PUT | Clerk session cookie OR Bearer JWT | The route's own doc comment admits it: "Same logic as `/api/user-settings` but under the `/v1` namespace for mobile." | none found in repo — external (mobile) likely |

## v1-only routes (no `/api/*` twin)

| Path | Methods | Auth | Internal callers |
|---|---|---|---|
| `/api/v1/deals` | GET | none | none — returns static `410 deals_disabled`; publicly cacheable per middleware allowlist |
| `/api/v1/devices` | POST, DELETE | Clerk `auth()` | none found — doc comment: "Called by the mobile app on launch" (push token registration) |
| `/api/v1/figure/[figure_id]` | GET | none, `checkRateLimit(30/min)` | `PersonalizedShelf.tsx` |
| `/api/v1/me` | GET | Clerk `auth()` | `AdSlot.tsx` (client-side Pro check post-hydration) |
| `/api/v1/price-check` | GET | none, `checkRateLimit(30/min)` — built for a Siri Shortcuts voice flow per doc comment | `FandomHubInteractive.tsx` |
| `/api/v1/search` | GET | none, `checkRateLimit(60/min)` | `SearchInterface.tsx`, `scan/page.tsx`, `app/page.tsx`, `HeroSearch.tsx` — despite the "v1" name, this is the site's live search backend |

`/api/v1/search` and `/api/v1/price-check` share scoring via
`src/app/api/v1/_lib/kbSearch.ts` (`searchKb`, `aggregateGenreFacets`,
`MAX_RESULTS`) — this one is a genuine, intentionally shared library
(comment: "do not fork the scoring").

## Cross-cutting findings

1. **No shared CRUD helper library exists** for alerts/vault/wantlist/user-settings.
   Every route independently redefines the same 4-line `getDB()` helper, and
   vault/wantlist each redefine an equivalent local insert helper rather than
   importing one. The only code actually shared between `/api/*` and
   `/api/v1/*` twins is `@/lib/proStatus` (`isUserPro`, `FREE_LIMITS`) and
   `@/lib/rateLimit` (`checkRateLimit`) — both are utility imports, not a
   request-handling abstraction.
2. **Vault and wantlist single-item routes are not accidental duplicates —
   they differ in hard vs. soft delete, on purpose and by comment.**
   `/api/vault/[id]` and `/api/wantlist/[id]` hard-delete; their v1
   counterparts (`/api/v1/vault/items/[id]`, `/api/v1/wantlist/item/[id]`)
   soft-delete via `status='removed'`, with the non-v1 route's comment
   explicitly naming itself as the hard-delete path. Any consolidation here
   must preserve both behaviors, not just pick one.
3. **`/api/v1/user-settings`** is the cleanest case of pure accidental
   duplication: byte-for-byte equivalent SQL and shape, existing only so a
   mobile client can call it under the `/v1` prefix.
4. **`/api/v1/vault` (GET) is a live internal dependency of the web app**,
   not mobile-only — `PersonalizedShelf.tsx` calls it directly. This rules
   out treating v1 vault-GET as purely an external/mobile surface.
5. **No browser extension code was found in this repository** — no
   `manifest.json`, `chrome.runtime` usage, or extension directory anywhere
   in the tree. Every v1 route's own doc comment instead describes its
   caller as "the mobile app" (Clerk session cookie OR Bearer JWT), with
   `/api/v1/price-check` built for a Siri Shortcut. If a companion browser
   extension exists, it is not in this repo, and this report cannot see
   whatever it calls.
6. **`package.json` and `CLAUDE.md` say nothing about "extension," "mobile
   app," or `/v1` API design intent** — the only documentation of why `/v1`
   exists is the inline JSDoc on each v1 route file itself.
7. **Caching/auth treatment differs between v1 and non-v1 at the middleware
   layer.** `src/middleware.ts` allowlists exactly `/api/v1/search`,
   `/api/v1/price-check`, `/api/v1/deals`, plus `/api/news`, `/api/sparklines`,
   `/api/upc`, `/api/healthz`, `/api/waitlist/count` as publicly
   CDN-cacheable; everything else (vault, alerts, wantlist, user-settings,
   stripe, me, devices, admin) is no-store by default. `/api/admin(.*)` is
   the only prefix that requires a signed-in Clerk session at the middleware
   layer — the other admin/ops routes (health, kv-audit, news, cache-stats,
   funnel-stats, daily-uniques) enforce their own gate inside the handler.

## Consolidation candidates

These are ranked by how safe they look from the code alone; every "no
internal caller found" note is a repo-visibility limit, not proof of no
caller — mark those UNKNOWN, not unused.

1. **`/api/user-settings` ↔ `/api/v1/user-settings` — safest candidate.**
   Evidence: identical SQL, identical response shape, doc comment admits
   it's a straight duplicate for the mobile namespace. Risk: the v1 route
   likely has a real external mobile caller (**UNKNOWN** — not visible from
   this repo); consolidating the *implementation* into one shared function
   called by both thin route handlers would remove the duplication risk
   without touching either URL or the mobile contract. Do not delete either
   route — only de-duplicate the code behind them.
2. **`/api/alerts` ↔ `/api/v1/alerts` (and `/[id]` twin) — same shape,
   same risk profile as above.** Evidence: line-for-line equivalent SQL and
   gating; only cosmetic differences (column list, pre-check ordering).
   Risk: v1 has no internal caller found, so an external (mobile) caller is
   **UNKNOWN** and must be assumed to exist. Same recommendation: extract one
   shared handler/query module, keep both routes as thin wrappers.
3. **`/api/wantlist` ↔ `/api/v1/wantlist` (list/create endpoints only,
   not the item routes) — moderate.** Evidence: same duplication pattern as
   alerts. Risk: same as above (external caller **UNKNOWN**). The paired
   item-level routes (`/api/wantlist/[id]` vs `/api/v1/wantlist/item/[id]`)
   are **not** safe to fold together as-is — see below.
4. **`/api/vault` (GET/POST) ↔ `/api/v1/vault` — moderate, one exception
   to flag.** The insert/list logic can be de-duplicated the same way as
   above, but `/api/v1/vault` GET has a confirmed *internal* caller
   (`PersonalizedShelf.tsx`), so this is not an external-only surface;
   changing its response shape would be a same-repo regression risk, not
   just an external-contract risk.
5. **Do NOT collapse `/api/vault/[id]` into `/api/v1/vault/items/[id]`,
   or `/api/wantlist/[id]` into `/api/v1/wantlist/item/[id]`.** These are
   not duplicates — one hard-deletes, the other soft-deletes, by design
   (per the routes' own comments). Any consolidation here is a behavior
   change, out of scope for a "safe to consolidate" list, and would need a
   product decision (which behavior does the unified endpoint need?), not a
   refactor.
6. **`/api/v1/search`, `/api/v1/price-check`, `/api/v1/figure/[figure_id]`,
   `/api/v1/me`, `/api/v1/devices`, `/api/v1/deals` — not duplication at
   all**, no consolidation candidate: none have an `/api/*` twin, and
   `/api/v1/search` in particular is confirmed as the live production search
   backend for the web app itself (`SearchInterface.tsx`, `app/page.tsx`,
   etc.), not a legacy or redundant path.

In every case above, the concrete, low-risk first step is **extracting a
shared implementation module that both the `/api/*` and `/api/v1/*` route
files call**, not touching either public URL, status code, or response
shape. Deleting or redirecting a route was out of scope for this report and
was not done.

## Methodology

- Enumerated every `route.ts` under `src/app/api/**` (37 files) and read
  each one directly for methods, auth gate, and logic.
- Compared each `/api/*` route against its `/api/v1/*` counterpart
  line-by-line where a twin exists.
- Searched `src/` for `fetch(...)`/hardcoded route-string references to
  find internal callers of each route.
- Searched the repo for browser-extension artifacts (`manifest.json`,
  `chrome.runtime`) — found none; found no `package.json` script or
  README/CLAUDE.md text documenting the `/v1` design rationale beyond the
  inline route comments.
- Spot-verified a sample of the above (vault hard/soft delete SQL, the
  `PersonalizedShelf.tsx` → `/api/v1/vault` internal call) by reading the
  named files directly rather than relying solely on the initial research
  pass.
- Any caller outside this repository (a mobile app, browser extension, or
  third-party integration) is invisible to this analysis and is marked
  **UNKNOWN** rather than assumed absent.
