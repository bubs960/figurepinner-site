// Regression: kbLite must build its catalog indexes ONCE per isolate, not once per
// concurrent caller.
//
// Incident 2026-09-20: /guides/wrestling-hub returned Cloudflare 1102 (Worker
// exceededMemory, 128 MB). The themed hubs' fandomHubs.ts resolvedUrl() fires a burst of
// concurrent getFigureById + prettyFigureUrl calls on a cold isolate. byId() and
// prettyCounts() used `if (!X) { ...await all()...; X = built }` — they await BEFORE
// assigning, so every concurrent first caller passed the check and built its own full
// catalog-sized structure. Measured (cold, Node): 1 caller 65 MB heap, 20 callers
// 490 MB, 80+ callers OOM at 1 GB. Wrestling's first burst is 15, the largest of the
// seven themed hubs, and it has no later payload to warm the cache — so it died first.
//
// The burst runs in a child process with a hard heap cap so an unfixed build FAILS
// (V8 out-of-memory, non-zero exit) instead of merely being slow. With the fix, 40
// concurrent cold lookups peak around 70 MB.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const HEAP_CAP_MB = 160
const BURST = 40

test('kbLite: a cold concurrent burst builds ONE shared index (fits a 160 MB heap)', () => {
  assert.ok(
    existsSync('public/kb-lite.generated.json'),
    'public/kb-lite.generated.json missing — run `node scripts/build-kb-stats.mjs` first (npm run deploy does)',
  )
  const r = spawnSync(
    process.execPath,
    [`--max-old-space-size=${HEAP_CAP_MB}`, '--import', './scripts/register-ts-loader.mjs', 'tests/_kbLiteBurst.mjs', String(BURST)],
    {
      cwd: process.cwd(),
      // inNextBuild(): read the artifact from disk instead of spawning a local workerd
      env: { ...process.env, NEXT_PHASE: 'phase-production-build' },
      encoding: 'utf8',
      timeout: 90_000,
    },
  )
  const tail = `${r.stdout ?? ''}${r.stderr ?? ''}`.split('\n').filter(l => !/MODULE_TYPELESS|Reparsing|eliminate this warning|trace-warnings/.test(l)).slice(-6).join('\n')
  assert.equal(r.status, 0, `burst child failed (status ${r.status}, signal ${r.signal}) — kbLite is building per-caller copies again?\n${tail}`)
  assert.match(r.stdout, /^OK 40 urls/m, `unexpected child output:\n${tail}`)
})
