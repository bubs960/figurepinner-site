# CLAUDE.md — figurepinner-site (auto-loads for every session in this repo)

Created S52 (2026-07-03) to close the "knowledge lives in EOCs, not where it
fires" hole. Keep this SHORT — pointers, not prose. The canonical deploy doc is:

**`C:\Users\bubs9\FigurePinner-Ecosystem\Fig Pinner Dev - Claude\runbooks\deploy-guardrails.md`** —
READ IT before proposing any deploy. Caps: figurepinner-site 2/day soft,
3/day HARD, 30-min cool-down. Steve executes ALL deploys (author/execute
split); give him two separate blocks: `cd` first, then `npm run deploy`.

## Deploy truths (each of these has already burned a session)

1. **`npm run deploy` ships the WORKING TREE, not git HEAD.**
   `scripts/predeploy-clean-check.mjs` now REFUSES a dirty tree; deliberate
   override: `$env:FP_ALLOW_DIRTY='1'; npm run deploy` (then commit).
2. **ISR cache persists ACROSS deploys** — a live page is not proof the new
   build is live. Mechanism: every page carries `<meta name="fp-build">`
   (build git sha); `/api/healthz` reports the deployed sha. Meta ≠ healthz
   sha ⇒ you are looking at pre-deploy cached HTML (figure pages: up to 24h).
   Verify UI changes on LOCAL PREVIEW, not by hitting prod.
3. **Probing figurepinner.com: `curl.exe` + a real Chrome UA WORKS. PowerShell
   and Node `fetch` do not.** (Corrected 2026-07-27 — this line previously read
   "curl/PowerShell CANNOT probe figurepinner.com," which was over-broad and
   cost real work; the sitemap-wide 404 census sat undelivered partly because it
   looked like it needed thousands of manual browser checks. Ruling +
   independent PowerShell/curl side-by-side:
   `Bridge/STANDALONE-TO-WEB-SHELL-PROBE-LAW-NARROWED-2026-07-27.md`.)
   - ✅ `curl.exe` with `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36`
     → **200**. This is the supported path for bulk status sweeps; verified over
     1,889 URLs with `--parallel`. Same recipe `kv-purge-stale-isr.mjs:212` has
     used in the deploy chain all along.
   - ❌ PowerShell `Invoke-WebRequest`/`Invoke-RestMethod` → **403 regardless of
     headers.** This is what the original 7/17 finding actually measured; the
     blanket "no shell probe works" wording was introduced later by summarising.
   - ❌ Node `fetch`/undici → **403 even with the Chrome UA** (its TLS
     fingerprint, not the UA, is what Bot Fight rejects).
   - ⚠️ A **default-UA** probe from any tool 403s on a perfectly healthy page —
     so a shell 403 is a NON-SIGNAL, never evidence about the site. That half of
     the original rule stands unchanged.
   - Still use a real browser for anything needing rendered DOM, JS execution or
     layout: a string probe is not rendered output. Sweeping figure pages? Pace
     under 100 req/min/IP (`--rate 85/m`) or the middleware throttles you — see
     truth #7.
4. **tsc clean is not "it works"** — Workers runtime cancels floating
   promises (`void cache.put` killed the rate limiter silently); `'use client'`
   at file top makes EVERY export client-only (broke a server fetcher).
   Live-verify behavior, not just types.
5. **D1 is LOCAL-FIRST + standalone-authorized** — no ad-hoc D1 queries, ever.
   Pricing reads come from R2 (`figurepinner-r2proxy...workers.dev/price-summaries/<fid>.json`).
6. **KB sync direction is ROOT → API → site** (`sync_kb.py`). Never sync from
   this repo's copy backwards; never hand-edit `src/data/figures-reference-v2*.js`
   (18MB — Edit tool banned; they arrive via sync + commit).
7. **Figure pages are rate-limited at 100 req/min/IP and it FIRES.**
   `src/middleware.ts:87` (`FIGURE_PAGE_RATE_LIMIT_PER_MINUTE`, Data Defense
   Layer 2) throttles `/figure/<id>` and `/[genre]/[line]/[slug]` — measured
   2026-07-27: a 1,889-URL sweep at only 6 concurrent produced **786 real 429s**,
   tripping ~100 figure pages in. Hubs, guides and the homepage are NOT limited.
   A 429 here is the defense working, **not** a site error: the same URL returns
   200 when fetched alone. Pace any bulk figure-page sweep under the limit
   (`curl --rate 85/m` is clean). Verified bots (Googlebot etc.) are exempt
   unconditionally via `checkRateLimit`'s `.cf.verifiedBotCategory` check.
8. **`toLocaleDateString`/`Intl.DateTimeFormat`/`toLocaleString` in a 'use
   client' render body CAN cause a React #418 hydration error, invisibly,
   only in production.** Cloudflare Workers' V8/ICU build and the browser's
   disagree on the exact byte output for some locale/option pairs (the
   2026-08-06 incident: a month/day date separator differed by one
   whitespace character, invisible on screen). A client component
   re-executes its render function on hydration, so server (Workers) and
   client (browser) call the same Intl function and can get back two
   different strings for the same input — the page still works (React
   discards and re-renders), but throws a console error on every load.
   **Always use `src/lib/safeDate.ts` / `src/lib/safeNumber.ts` for date/number
   formatting in a client component instead of calling Intl/toLocale*
   directly** — both are ICU-free by construction, so this class of bug is
   structurally impossible through them. `scripts/predeploy-clean-check.mjs`
   scans for direct Intl/toLocale* calls in `'use client'` files on every
   deploy and prints a reminder (non-blocking — it can't tell render-body
   risk from safe post-hydration usage by itself, a human still has to look).
   **If a hydration bug won't reproduce locally** (`next dev`, `next build
   && next start`, or the default `wrangler dev`) **but IS live in
   production, don't conclude "can't reproduce, not a real bug."** The
   default `wrangler dev` runs in `--local` mode with empty simulated D1/KV
   — any data-dependent render path (real comps, real prices) never
   executes, so a data-dependent bug is invisible there too. Reach for
   `wrangler dev --remote` (real D1/KV bindings, still locally
   rebuildable/debuggable) FIRST when a bug is real in prod but silent
   everywhere else — that's what actually found this one, after several
   hours of reading code that all looked correct in isolation. Full
   incident: `project_web_status_log.md`, 2026-08-05/06 entries.

## Repo facts

- Deploys as a CF Worker via OpenNext (`npm run deploy`); `git push` alone
  ships NOTHING.
- `grailpinner-site` (GrailPulse hub) is a DIFFERENT repo — static export,
  never `npm run deploy` there; CF Pages project name is `grailpulse-hub`.
- Sitemap is split: `/sitemap/static.xml` + one per fandom (see robots.ts);
  there is no combined /sitemap.xml.
- Guide articles live in `src/app/guides/_data/articles.ts`; the RWB seasonal
  hub is a static route at `src/app/guides/red-white-blue/`.

## Styling (S52 design-system extraction — audit-backed, keep it this small)

- **Use the shared primitives** in `src/app/components/ui.tsx` — `SectionLabel`,
  `Card`, `CtaButton` — instead of hand-rolling those patterns (the audit found
  32/22/12 drifted copies respectively). Migrate old pages only when touched
  for another reason; never a mass find-replace.
- **Canonical tokens:** `--s1 --border --text --muted --blue --font-display`
  (+ `--r` for radius). The `--fp-*` names are legacy aliases — they keep
  working, but write NO new code with them.
- Meta/JSON-LD on figure pages: enriched prose flows through the quality gate
  in `src/app/figure/[figure_id]/_lib/enrichedCopy.ts` — never bypass it to
  inline `match_represented` raw (it can contain internal QA language).

## Session discipline

- Cross-chat state: `C:\Users\bubs9\Documents\Claude\Projects\Bridge\`
  (OPEN-ITEMS.md + TEAM-GROUND-RULES.md bind here too — R1 traffic target,
  R7 subagents never Fable/Opus with explicit `model:`). The plain-named
  daily-digest file may not exist at a given moment — check OPEN-ITEMS.md
  first, don't block on a specific digest filename.
- Update memory (`project_web_status_log.md`) after every work block, and
  commit your work before session close.

## LIVE OPERATIONAL STATE -- never delete in cleanup (added 2026-08-08, standalone, per Steve directive + R18)

See Bridge\TEAM-GROUND-RULES.md R18: before deleting/pruning anything you did not create this session, name what READS it (watcher, nightly task, boot step, another lane). Gitignored / stale-looking / uncommitted is NOT evidence of disposability. Cannot name a consumer -> move to _to_delete/ instead of deleting.
Known protected in THIS repo (extend as learned): `.env.local` (gitignored AND load-bearing -- NEXT_PUBLIC_* build-time inlining; its absence caused the 5-week hydration bug found 8/5), `.kv-purge-state.json` (deploy-state marker other sessions read to date deploys), `scripts/` predeploy checks (scar tissue per R16).
