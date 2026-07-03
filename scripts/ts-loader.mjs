/**
 * ts-loader.mjs — minimal module-resolution hook for `node --test`.
 *
 * WHY: this repo has no test framework and the punch list calls for none
 * ("node --test, no framework needed"). But Node's native TS type-stripping
 * does NOT understand this project's tsconfig `@/*` -> `./src/*` path alias,
 * and this codebase's .ts files use TS-authoring-convention extensionless
 * relative imports (e.g. `from './kbTypes'`) that plain Node ESM resolution
 * also rejects. Every one of the pure functions worth unit-testing sits
 * behind at least one `@/...` import somewhere in its module graph, so
 * without this hook `node --test` cannot load them at all.
 *
 * This is a resolution hook only — it does not transform code. Node's own
 * built-in type-stripping still does the actual .ts loading once resolve()
 * hands back a real file:// URL.
 *
 * Registered via scripts/register-ts-loader.mjs (node --import).
 */

import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve as resolvePath } from 'node:path'

const REPO_ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_ROOT = resolvePath(REPO_ROOT, 'src')

// Order matters: exact match first, then TS source extensions.
const CANDIDATE_SUFFIXES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']

function resolveOnDisk(absPathNoExt) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = absPathNoExt + suffix
    if (existsSync(candidate)) return candidate
  }
  return null
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const found = resolveOnDisk(resolvePath(SRC_ROOT, specifier.slice(2)))
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true }
    // Not found under src/ - fall through so Node raises its normal error.
  } else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const hasKnownExt = /\.(m?ts|tsx|m?js|jsx|json)$/.test(specifier)
    if (!hasKnownExt) {
      const parentDir = dirname(fileURLToPath(context.parentURL))
      const found = resolveOnDisk(resolvePath(parentDir, specifier))
      if (found) return { url: pathToFileURL(found).href, shortCircuit: true }
    }
  }
  return nextResolve(specifier, context)
}

// A couple of build-time-only data modules (e.g. src/data/kb.ts) intentionally
// use CJS `require()` to pull in a large generated .js data file — the Next.js
// bundler handles that mix fine, but plain Node ESM does not define `require`
// at module scope. Rather than touch that production loading mechanism (it is
// deliberately shaped to avoid an OOM in `next build` - see kbDb.ts), shim a
// per-module `require` bound to each file's own URL, test-time only, here.
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context)
  if (!url.endsWith('.ts') || typeof result.source === 'undefined') return result
  const source = typeof result.source === 'string' ? result.source : Buffer.from(result.source).toString('utf8')
  if (!/\brequire\(/.test(source)) return result
  const shim = "import { createRequire as __createRequire } from 'node:module';\nconst require = __createRequire(import.meta.url);\n"
  return { ...result, source: shim + source }
}
