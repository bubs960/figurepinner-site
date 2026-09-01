import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// OOM gate (2026-09-01): kb.ts loads the full 22MB slim catalog at module
// scope and OpenNext emits ONE server bundle, so a single import of it from
// anywhere under src/ inlines the catalog into every cold Worker isolate.
// kb.ts is build-script-only now (scripts/*.mjs may import it). Runtime code
// reads kbLite.ts (prose-free projection) or kbDb.ts (D1). Static source
// scan on purpose — importing modules cannot prove what the bundler inlines;
// scripts/assert-no-runtime-kb-in-handler.mjs checks the compiled artifact.

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'src')
const FORBIDDEN = [
  /from\s+['"]@\/data\/kb['"]/,
  /from\s+['"]\.\.?\/(?:data\/)?kb['"]/,
  /require\(\s*['"][^'"]*figures-reference-v2[^'"]*['"]\s*\)/,
  /from\s+['"][^'"]*figures-reference-v2[^'"]*['"]/,
]
// The only modules allowed to touch the catalog file or kb.ts itself.
const ALLOW = new Set(['src/data/kb.ts'])

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.(ts|tsx|js|mjs)$/.test(name) && !/\.generated\./.test(name) && !/figures-reference-v2/.test(name)) yield p
  }
}

describe('no runtime module imports the full KB catalog', () => {
  const offenders = []
  for (const p of walk(SRC)) {
    const rel = p.slice(root.length + 1).replace(/\\/g, '/')
    if (ALLOW.has(rel)) continue
    const src = readFileSync(p, 'utf8')
    for (const re of FORBIDDEN) {
      if (re.test(src)) offenders.push(`${rel} matches ${re}`)
    }
  }
  test('src/ has zero kb.ts / figures-reference-v2 importers outside the allowlist', () => {
    assert.deepEqual(offenders, [])
  })
})
