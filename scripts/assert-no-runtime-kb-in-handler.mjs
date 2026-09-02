#!/usr/bin/env node
/**
 * assert-no-runtime-kb-in-handler.mjs — post-`build:cf` gate.
 *
 * Fails the build if the compiled OpenNext Worker handler still carries the
 * full figure catalog. Checks the ARTIFACT, not TypeScript source: on 8/31 a
 * source-level grep of `.next/server` reported "zero figures-reference-v2
 * references" while the real handler.mjs still held a 23.9MB inlined catalog
 * line — bundling strips the filename string, so only the identifier and the
 * line size are trustworthy sentinels.
 *
 * Sentinels (any one fails):
 *   - identifier `FIGURES_V2` anywhere in handler.mjs or a linked chunk
 *   - a module path containing `figures-reference-v2`
 *   - any single line longer than MAX_LINE_BYTES (the inlined catalog is one
 *     line; the sanctioned kb-lite tuple string is ~8MB, so the bar sits above
 *     it and well below the 22MB+ catalog)
 *
 * Prints handler size, largest lines, and every sentinel hit with byte offset.
 * Usage: node scripts/assert-no-runtime-kb-in-handler.mjs [--max-line-mb=N]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, '.open-next', 'server-functions', 'default')
const argMax = process.argv.find(a => a.startsWith('--max-line-mb='))
const MAX_LINE_BYTES = Math.round((argMax ? Number(argMax.split('=')[1]) : 12) * 1e6)
const SENTINELS = ['FIGURES_V2', 'figures-reference-v2']

if (!existsSync(DIR)) {
  console.error(`[kb-gate] missing ${DIR} — run \`npm run build:cf\` first`)
  process.exit(2)
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) { if (name !== 'node_modules') yield* walk(p) }
    else if (/\.(m?js|cjs)$/.test(name)) yield [p, st.size]
  }
}

let failed = false
const files = [...walk(DIR)].sort((a, b) => b[1] - a[1])
console.log(`[kb-gate] scanning ${files.length} JS files under .open-next/server-functions/default`)
for (const [p, size] of files) {
  if (size < 1e6) continue // tiny chunks cannot hold the catalog
  const src = readFileSync(p, 'utf8')
  const rel = p.slice(ROOT.length + 1)
  let longest = 0
  let start = 0
  for (let i = 0; i <= src.length; i++) {
    if (i === src.length || src.charCodeAt(i) === 10) {
      if (i - start > longest) longest = i - start
      start = i + 1
    }
  }
  console.log(`[kb-gate] ${rel}: ${(size / 1e6).toFixed(2)} MB, longest line ${(longest / 1e6).toFixed(2)} MB`)
  for (const s of SENTINELS) {
    const at = src.indexOf(s)
    if (at !== -1) {
      failed = true
      console.error(`[kb-gate] FAIL ${rel}: sentinel "${s}" at byte ${at}`)
    }
  }
  if (longest > MAX_LINE_BYTES) {
    failed = true
    console.error(`[kb-gate] FAIL ${rel}: line of ${(longest / 1e6).toFixed(2)} MB exceeds ${(MAX_LINE_BYTES / 1e6).toFixed(0)} MB — catalog-sized inline data`)
  }
}

// Size ceilings (2026-09-02, standalone scale-program ask 2): the catalog is out of
// the handler, so the growth risk moved to the whole bundle and to the kb-lite
// artifact (loaded whole at first use, O(fids)). Fail early at build time, and
// print the numbers every R10 file should carry so the trend stays visible.
const HANDLER_WARN_MB = 45   // the OOM handler was 41.6 MB
const HANDLER_FAIL_MB = 60
const KB_LITE_FAIL_MB = 20   // 7.95 MB at 24.4K figures; ~77K figures would hit KV's 25 MB value cap
const handler = files.find(([p]) => p.endsWith('handler.mjs'))
const handlerMb = handler ? handler[1] / 1e6 : 0
const kbLitePath = join(ROOT, 'src', 'data', 'kb-lite.generated.json')
const kbLiteMb = existsSync(kbLitePath) ? statSync(kbLitePath).size / 1e6 : 0
console.log(`[kb-gate] sizes: handler ${handlerMb.toFixed(2)} MB (warn ${HANDLER_WARN_MB}, fail ${HANDLER_FAIL_MB}) · kb-lite artifact ${kbLiteMb.toFixed(2)} MB (fail ${KB_LITE_FAIL_MB})`)
if (handlerMb > HANDLER_FAIL_MB) { failed = true; console.error(`[kb-gate] FAIL handler ${handlerMb.toFixed(2)} MB exceeds ${HANDLER_FAIL_MB} MB`) }
else if (handlerMb > HANDLER_WARN_MB) console.warn(`[kb-gate] WARN handler ${handlerMb.toFixed(2)} MB is past the ${HANDLER_WARN_MB} MB warning line`)
if (kbLiteMb > KB_LITE_FAIL_MB) { failed = true; console.error(`[kb-gate] FAIL kb-lite artifact ${kbLiteMb.toFixed(2)} MB exceeds ${KB_LITE_FAIL_MB} MB`) }

if (failed) {
  console.error('[kb-gate] handler still carries the full KB catalog (or a size ceiling tripped) — refusing to treat this build as deployable')
  process.exit(1)
}
console.log('[kb-gate] PASS — no catalog sentinel in the compiled handler, size ceilings clear')
