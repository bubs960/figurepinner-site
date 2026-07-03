# CLAUDE.md — figurepinner-site (auto-loads for every session in this repo)

Created S52 (2026-07-03) to close the "knowledge lives in EOCs, not where it
fires" hole. Keep this SHORT — pointers, not prose. The canonical deploy doc is:

**`C:\Users\bubs9\Fig Pinner Dev - Claude\runbooks\deploy-guardrails.md`** —
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
3. **curl/PowerShell CANNOT probe figurepinner.com** — CF TLS-fingerprint/WAF
   403s them and LIES to you. Live-verify in a real browser (Chrome MCP).
4. **tsc clean is not "it works"** — Workers runtime cancels floating
   promises (`void cache.put` killed the rate limiter silently); `'use client'`
   at file top makes EVERY export client-only (broke a server fetcher).
   Live-verify behavior, not just types.
5. **D1 is LOCAL-FIRST + standalone-authorized** — no ad-hoc D1 queries, ever.
   Pricing reads come from R2 (`figurepinner-r2proxy...workers.dev/price-summaries/<fid>.json`).
6. **KB sync direction is ROOT → API → site** (`sync_kb.py`). Never sync from
   this repo's copy backwards; never hand-edit `src/data/figures-reference-v2*.js`
   (18MB — Edit tool banned; they arrive via sync + commit).

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
  (DAILY-DIGEST.md + TEAM-GROUND-RULES.md bind here too — R1 traffic deadline,
  R7 subagents never Fable/Opus with explicit `model:`).
- Update memory (`project_web_status_log.md`) after every work block, and
  commit your work before session close.
