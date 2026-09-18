#!/usr/bin/env node
/**
 * refresh-fandom-hub-data.mjs -- the ONE command that regenerates every payload the fandom
 * `-hub` guides render from (top comps, vaults, heroes/villains, most checked).
 *
 * WHY THIS EXISTS (2026-09-18): each of the four generators calls itself a "nightly
 * precompute", but none was in any script chain or scheduled task, and the scoped hubs
 * (wwe-elite, wrestling-jakks) were produced with environment variables that lived only in a
 * shell history. Result: the hub guides -- 84% of all guide impressions on Bing -- showed
 * prices generated 2026-06-20..22 for three months. The scope of every payload is written
 * down below so a refresh is one reproducible command, which the weekly task runs.
 *
 * SCOPE RULE: "same page, fresh data". A refresh must not silently change what a hub covers.
 *  - vault payloads are pinned to the product lines the committed payload already lists
 *    (exact allow-list from its own `line_slug`s) -- a line added to the KB later does not
 *    appear on a hub until someone decides it should;
 *  - the two wrestling sub-hubs keep their manufacturer scope (documented in
 *    build-fandom-most-checked.mjs: wwe-elite = wrestling + mattel, wrestling-jakks =
 *    wrestling + jakks-pacific; the Jakks hub excludes the TNA lines, as its vault list shows);
 *  - list sizes (TOP_N / PER_LINE / PER_SIDE) are read back from the committed payloads.
 *
 * Usage:
 *   node scripts/refresh-fandom-hub-data.mjs                 # everything: ~15,700 unique fids
 *       TIME: the r2proxy Worker allows 120 cache-MISS requests / 60 s per IP (workers/r2proxy/
 *       wrangler.toml, RATE_LIMITER, since 2026-07-04) and answers 429 + Retry-After: 60 beyond that.
 *       Cold edge cache (the weekly case) = ~2.5-3 h. Warm cache (s-maxage 3600) = ~35 min, which is
 *       what the 2026-09-18 run measured. Never run two consumers from one IP at once.
 *   node scripts/refresh-fandom-hub-data.mjs gi-joe          # one hub
 *   node scripts/refresh-fandom-hub-data.mjs --skip-most-checked
 *   node scripts/refresh-fandom-hub-data.mjs --plan          # print the commands, run nothing
 * Exit code: 0 when every generator exited 0, else 1 (payloads of failed steps are untouched:
 * each generator writes its file only at the end of a successful run).
 * Read-only against the r2proxy Worker and Cloudflare Analytics; writes only src/data/fandom-*.
 */
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const PLAN = args.includes('--plan')
const SKIP_MC = args.includes('--skip-most-checked')
const ONLY = args.find((a) => !a.startsWith('--')) || null

// dataKey -> how its figures are selected from the slim KB. `families` = which payloads exist for it.
export const HUBS = [
  // Parent first: its ~6,500 wrestling fids fill the run cache, so the two sub-hubs below re-fetch nothing.
  { key: 'wrestling', fandom: 'wrestling', families: ['top-comps'] }, // parent roll-up: all makers, top comps only
  { key: 'masters-of-the-universe', fandom: 'masters-of-the-universe', families: ['top-comps', 'vaults', 'heroes-villains'] },
  { key: 'gi-joe', fandom: 'gi-joe', families: ['top-comps', 'vaults', 'heroes-villains'] },
  { key: 'star-wars', fandom: 'star-wars', families: ['top-comps', 'vaults', 'heroes-villains'] },
  { key: 'transformers', fandom: 'transformers', families: ['top-comps', 'vaults', 'heroes-villains'] },
  // Scopes of the two wrestling sub-hubs were reconstructed against the June slim KB (git show
  // a644e9b:src/data/figures-reference-v2.slim.js) by the parallel 2026-09-18 session: every June vault
  // line list reproduces with  wwe-elite = LINE_MATCH ^(elite|ultimate-edition|defining-moments)  and
  // wrestling-jakks = MFR jakks-pacific + LINE_EXCLUDE ^(tna|other)  (`other` held 42 Jakks figures in
  // June and is not on the page). MFR=mattel on wwe-elite follows build-fandom-most-checked.mjs; it
  // differs from the June run by one jakks-made elite-royal-rumble figure.
  { key: 'wwe-elite', fandom: 'wrestling', scope: { MFR: 'mattel', LINE_MATCH: '^(elite|ultimate-edition|defining-moments)' }, families: ['top-comps', 'vaults', 'heroes-villains'] },
  { key: 'wrestling-jakks', fandom: 'wrestling', scope: { MFR: 'jakks-pacific', LINE_EXCLUDE: '^(tna|other)' }, families: ['top-comps', 'vaults', 'heroes-villains'] },
]

const readPayload = (family, key) => {
  const p = join(ROOT, 'src', 'data', 'fandom-' + family, key + '.json')
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The exact env + argv for one (hub, family), derived from the committed payload's own shape. */
export function planStep(hub, family) {
  const current = readPayload(family, hub.key)
  if (!current) return null // never invent a payload the page does not import
  const env = { ...(hub.scope || {}) }
  if (hub.key !== hub.fandom) env.OUT = hub.key
  const vaults = readPayload('vaults', hub.key)
  const lineAllow = vaults?.vaults?.length ? '^(' + vaults.vaults.map((v) => escapeRe(v.line_slug)).join('|') + ')$' : null
  if (family === 'vaults') {
    if (lineAllow) env.LINE_MATCH = lineAllow
    env.PER_LINE = String(Math.max(1, ...current.vaults.map((v) => v.top.length), 6))
  } else if (family === 'top-comps') {
    if (hub.pinAllToVaultLines && lineAllow) env.LINE_MATCH = lineAllow
    env.TOP_N = String(Math.max(current.figures.length, 8))
  } else if (family === 'heroes-villains') {
    if (hub.pinAllToVaultLines && lineAllow) env.LINE_MATCH = lineAllow
    env.PER_SIDE = String(Math.max(current.heroes.length, current.villains.length, 6))
  }
  return { script: 'scripts/build-fandom-' + family + '.mjs', argv: [hub.fandom], env }
}

function run(step, label) {
  const shown = Object.entries(step.env).map(([k, v]) => k + '=' + (v.length > 60 ? v.slice(0, 57) + '...' : v)).join(' ')
  console.log('\n[hub-refresh] ' + label + ': ' + (shown ? shown + ' ' : '') + 'node ' + step.script + ' ' + step.argv.join(' '))
  if (PLAN) return 0
  const r = spawnSync(process.execPath, [join(ROOT, step.script), ...step.argv], { cwd: ROOT, env: { ...process.env, ...step.env }, stdio: 'inherit' })
  return r.status ?? 1
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const started = Date.now()
  const failures = []
  // One price-summary cache for the whole run (scripts/lib/price-snapshot-fetch.mjs): the three
  // price generators would otherwise each re-fetch the same ~16k fids. Removed at the end.
  const cacheDir = PLAN ? null : mkdtempSync(join(tmpdir(), 'fp-hub-snapshots-'))
  if (cacheDir) process.env.SNAPSHOT_CACHE_DIR = cacheDir
  for (const hub of HUBS) {
    if (ONLY && hub.key !== ONLY) continue
    for (const family of hub.families) {
      const step = planStep(hub, family)
      if (!step) { console.log('[hub-refresh] ' + hub.key + '/' + family + ': no committed payload -- skipped'); continue }
      const code = run(step, hub.key + '/' + family)
      if (code !== 0) failures.push(hub.key + '/' + family + ' (exit ' + code + ')')
    }
  }
  if (!SKIP_MC) {
    // most-checked buckets every dataKey itself (Cloudflare Analytics Engine, needs CF_API_TOKEN).
    const code = run({ script: 'scripts/build-fandom-most-checked.mjs', argv: ONLY ? [ONLY] : [], env: {} }, 'most-checked')
    if (code !== 0) failures.push('most-checked (exit ' + code + ')')
  }
  if (cacheDir) { try { rmSync(cacheDir, { recursive: true, force: true }) } catch {} }
  // Floor gate in plain JS (the weekly wrapper runs this in a bare worktree with no node_modules,
  // so it cannot lean on the TS test runner): no payload row may rest on fewer than 3 sold comps.
  if (!PLAN) {
    const under = []
    for (const family of ['top-comps', 'vaults', 'heroes-villains']) {
      for (const hub of HUBS) {
        const d = readPayload(family, hub.key)
        if (!d) continue
        const rows = [...(d.figures ?? []), ...(d.heroes ?? []), ...(d.villains ?? []), ...(d.vaults ?? []).flatMap((v) => v.top ?? [])]
        for (const r of rows) if (!(r.sold_count >= 3)) under.push(family + '/' + hub.key + ': ' + r.name + ' (' + r.sold_count + ' sold)')
      }
    }
    if (under.length) { failures.push('floor gate: ' + under.length + ' row(s) under 3 sold, e.g. ' + under[0]) }
  }
  console.log('\n[hub-refresh] ' + (PLAN ? 'plan only' : 'done in ' + Math.round((Date.now() - started) / 1000) + ' s') + (failures.length ? ' -- FAILED: ' + failures.join(', ') : ' -- all steps ok'))
  process.exit(failures.length ? 1 : 0)
}
