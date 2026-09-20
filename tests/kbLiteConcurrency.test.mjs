// Regression: request-time catalog indexes must be built ONCE per isolate, not once per
// concurrent caller.
//
// Incident 2026-09-20: /guides/wrestling-hub (and /sitemap.xml, per the Cloudflare Workers
// Logs export) returned Cloudflare 1102 — Worker exceededMemory, 128 MB. Cause: kbLite's
// builders (all, byId, byFandom, bySuffix, prettyCounts) and kbSearch's (getIndex, getVocab)
// used `if (!X) { ...await...; X = built }`. They await BEFORE assigning, so every
// concurrent first caller on a cold isolate passed the check and built its own full
// catalog-sized structure. Measured (cold, Node): 1 caller 65 MB heap, 20 callers 490 MB;
// the sitemap index's 30 concurrent getFiguresByFandom needed ~500 MB; 80+ url lookups OOM
// at 1 GB. kbLite went async on 2026-09-15 (before that the sync kb.ts could not interleave).
//
// Each pattern runs in its OWN child process (cold — a warm catalog would prove nothing) with
// a hard heap cap, so an unfixed build FAILS with a V8 out-of-memory instead of merely being
// slow. With the fix each pattern peaks around 60-80 MB.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const HEAP_CAP_MB = 160

const PATTERNS = [
  { mode: 'urls', n: 40, why: 'themed hub payload url resolution (fandomHubs.ts resolvedUrl) — the wrestling-hub 503' },
  { mode: 'fandoms', n: 0, why: 'sitemap index: getAllFandoms().map(getFiguresByFandom) — the /sitemap.xml 503' },
  { mode: 'suffix', n: 200, why: 'stable-suffix lookups (byStableSuffix index)' },
  { mode: 'search', n: 40, why: '/api/v1/search cold index + vocab (kbSearch.ts)' },
]

for (const { mode, n, why } of PATTERNS) {
  test(`cold concurrent burst builds ONE shared index and fits a ${HEAP_CAP_MB} MB heap: ${mode} — ${why}`, () => {
    assert.ok(
      existsSync('public/kb-lite.generated.json'),
      'public/kb-lite.generated.json missing — run `node scripts/build-kb-stats.mjs` first (npm run deploy does)',
    )
    const r = spawnSync(
      process.execPath,
      [`--max-old-space-size=${HEAP_CAP_MB}`, '--import', './scripts/register-ts-loader.mjs', 'tests/_kbLiteBurst.mjs', mode, String(n)],
      {
        cwd: process.cwd(),
        // inNextBuild(): read the artifact from disk instead of spawning a local workerd
        env: { ...process.env, NEXT_PHASE: 'phase-production-build' },
        encoding: 'utf8',
        timeout: 90_000,
      },
    )
    const tail = `${r.stdout ?? ''}${r.stderr ?? ''}`
      .split('\n')
      .filter(l => !/MODULE_TYPELESS|Reparsing|eliminate this warning|trace-warnings/.test(l))
      .slice(-6)
      .join('\n')
    assert.equal(r.status, 0, `${mode} burst child failed (status ${r.status}, signal ${r.signal}) — a builder is making per-caller copies again?\n${tail}`)
    assert.match(r.stdout, /^OK /m, `unexpected child output:\n${tail}`)
  })
}
