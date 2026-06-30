#!/usr/bin/env node
/**
 * Static guardrails for the first runtime D1 canary.
 *
 * This intentionally proves scope, not behavior:
 * - only /api/v1/figure/[figure_id] may import kbDb during the canary phase
 * - kbDb must not import kb.ts, which would drag the slim bundle back in
 * - KB_DB must be bound before the converted route can be safely deployed
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CANARY_ROUTE = 'src/app/api/v1/figure/[figure_id]/route.ts'
const ALLOWED_KBDB_IMPORTERS = new Set([CANARY_ROUTE])

const failures = []

function rel(path) {
  return relative(ROOT, path).replaceAll('\\', '/')
}

function read(relPath) {
  return readFileSync(resolve(ROOT, relPath), 'utf8')
}

function fail(message) {
  failures.push(message)
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue
      walk(path, out)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(path)
    }
  }
  return out
}

if (!existsSync(resolve(ROOT, CANARY_ROUTE))) {
  fail(`Missing canary route: ${CANARY_ROUTE}`)
} else {
  const route = read(CANARY_ROUTE)
  if (!route.includes("from '@/data/kbDb'")) {
    fail(`${CANARY_ROUTE} must import from '@/data/kbDb'`)
  }
  if (route.includes("from '@/data/kb'")) {
    fail(`${CANARY_ROUTE} still imports from '@/data/kb'`)
  }
  if (!route.includes('await getFigureById(')) {
    fail(`${CANARY_ROUTE} must await the async D1 getFigureById()`)
  }
  if (!route.includes("'x-fp-kb-source': 'd1'")) {
    fail(`${CANARY_ROUTE} must emit x-fp-kb-source: d1 for live canary proof`)
  }
}

const kbDb = read('src/data/kbDb.ts')
if (/^\s*import\s+.*from ['"]\.\/kb['"]/m.test(kbDb) || /^\s*import\s+.*from ['"]@\/data\/kb['"]/m.test(kbDb)) {
  fail('src/data/kbDb.ts must not import src/data/kb.ts')
}
if (!kbDb.includes("from './kbTypes'")) {
  fail('src/data/kbDb.ts must import pure helpers from ./kbTypes')
}

for (const path of walk(resolve(ROOT, 'src'))) {
  const text = readFileSync(path, 'utf8')
  if (!/from ['"]@\/data\/kbDb['"]|from ['"]\.\/kbDb['"]|from ['"]\.\.\/.*kbDb['"]/.test(text)) {
    continue
  }
  const normalized = rel(path)
  if (!ALLOWED_KBDB_IMPORTERS.has(normalized) && normalized !== 'src/data/kbDb.ts') {
    fail(`Unexpected kbDb importer during canary phase: ${normalized}`)
  }
}

const wrangler = read('wrangler.toml')
if (!/\[\[d1_databases\]\]\s+binding = "KB_DB"\s+database_name = "figurepinner-kb"\s+database_id = "ec1b97f5-9b65-48ca-aa15-5e612d37ebfe"/m.test(wrangler)) {
  fail('wrangler.toml must have an active KB_DB binding for the converted canary route')
}

for (const banned of [
  'src/app/api/v1/search/route.ts',
  'src/app/api/v1/price-check/route.ts',
  'src/app/sitemap.ts',
  'src/data/kbSearch.ts',
  'src/data/kb-stats.ts',
  'src/data/genre-lines.ts',
]) {
  const path = resolve(ROOT, banned)
  if (existsSync(path) && readFileSync(path, 'utf8').includes('@/data/kbDb')) {
    fail(`Banned canary-phase kbDb import: ${banned}`)
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`[kb:d1:canary] ERROR: ${failure}`)
  process.exit(1)
}

console.log('[kb:d1:canary] static audit passed')
