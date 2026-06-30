#!/usr/bin/env node
/**
 * Verify a loaded Option E D1 KB against the committed slim KB.
 *
 * This is intentionally a pre-switch gate. Run it after creating/loading the
 * remote D1 database and before any route imports move from data/kb to data/kbDb.
 */

import { execFileSync, execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_DB = 'figurepinner-kb'
const WRANGLER_BIN = process.platform === 'win32'
  ? resolve(ROOT, 'node_modules', '.bin', 'wrangler.cmd')
  : 'npx'

const args = process.argv.slice(2)
const dbName = args[args.indexOf('--db') + 1] && args.includes('--db')
  ? args[args.indexOf('--db') + 1]
  : DEFAULT_DB
const local = args.includes('--local')
const remoteFlag = local ? '--local' : '--remote'

const { FIGURES_V2 } = require(resolve(ROOT, 'src/data/figures-reference-v2.slim.js'))
if (!Array.isArray(FIGURES_V2)) {
  console.error('[kb:d1:remote] FIGURES_V2[] export missing')
  process.exit(1)
}

function packSizeValue(value) {
  const text = value == null ? null : String(value)
  return text != null && Number.isFinite(Number(text)) ? text : '1'
}

function expectedRow(f) {
  return {
    figure_id: f.figure_id,
    fandom: f.fandom,
    character_canonical: f.character_canonical,
    manufacturer: f.manufacturer,
    product_line: f.product_line,
    canonical_image_url: f.canonical_image_url ?? f.img ?? null,
    pack_size: packSizeValue(f.pack_size),
  }
}

function quoteWindowsArg(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`
}

function runWrangler(args) {
  if (process.platform === 'win32') {
    const command = [WRANGLER_BIN, ...args].map(quoteWindowsArg).join(' ')
    return execSync(command, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 20,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: 'cmd.exe',
      windowsHide: true,
    })
  }

  return execFileSync(WRANGLER_BIN, ['wrangler', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
}

function runSql(command) {
  const output = runWrangler([
    'd1',
    'execute',
    dbName,
    remoteFlag,
    '--json',
    '--command',
    command.replace(/\s+/g, ' ').trim(),
  ])

  const parsed = JSON.parse(output)
  const first = Array.isArray(parsed) ? parsed[0] : parsed
  return first?.results ?? first?.result?.[0]?.results ?? []
}
function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function fail(message) {
  console.error(`[kb:d1:remote] ERROR: ${message}`)
  process.exitCode = 1
}

const expectedStats = {
  row_count: FIGURES_V2.length,
  image_count: FIGURES_V2.filter(f => f.canonical_image_url ?? f.img).length,
  enriched_count: FIGURES_V2.filter(f => f.match_represented || f.key_features).length,
}

const statsRows = runSql(`
  SELECT
    COUNT(*) AS row_count,
    SUM(CASE WHEN canonical_image_url IS NOT NULL AND canonical_image_url != '' THEN 1 ELSE 0 END) AS image_count,
    SUM(CASE WHEN match_represented IS NOT NULL OR key_features IS NOT NULL THEN 1 ELSE 0 END) AS enriched_count
  FROM kb_figures
`)
const actualStats = statsRows[0] ?? {}

console.log(`[kb:d1:remote] db: ${dbName} (${local ? 'local' : 'remote'})`)
console.log(`[kb:d1:remote] rows: expected ${expectedStats.row_count}, actual ${actualStats.row_count}`)
console.log(`[kb:d1:remote] image rows: expected ${expectedStats.image_count}, actual ${actualStats.image_count}`)
console.log(`[kb:d1:remote] enriched rows: expected ${expectedStats.enriched_count}, actual ${actualStats.enriched_count}`)

for (const key of Object.keys(expectedStats)) {
  if (Number(actualStats[key]) !== expectedStats[key]) {
    fail(`${key} mismatch: expected ${expectedStats[key]}, got ${actualStats[key]}`)
  }
}

const sampleIds = [
  FIGURES_V2[0]?.figure_id,
  'fp_wrestling_mattel_ultimate-edition_30_seth-rollins_6dfa66',
  FIGURES_V2.find(f => String(f.canonical_image_url ?? '').includes('figurepinner-images'))?.figure_id,
  FIGURES_V2.find(f => f.match_represented || f.key_features)?.figure_id,
  FIGURES_V2[FIGURES_V2.length - 1]?.figure_id,
].filter(Boolean)

const uniqueSampleIds = [...new Set(sampleIds)]
const expectedById = new Map(FIGURES_V2.map(f => [f.figure_id, expectedRow(f)]))
const sampleRows = runSql(`
  SELECT figure_id, fandom, character_canonical, manufacturer, product_line, canonical_image_url, pack_size
  FROM kb_figures
  WHERE figure_id IN (${uniqueSampleIds.map(sqlString).join(', ')})
`)
const actualById = new Map(sampleRows.map(row => [row.figure_id, row]))

for (const id of uniqueSampleIds) {
  const expected = expectedById.get(id)
  const actual = actualById.get(id)
  if (!actual) {
    fail(`sample row missing: ${id}`)
    continue
  }
  for (const key of Object.keys(expected)) {
    const e = expected[key] == null ? null : String(expected[key])
    const a = actual[key] == null ? null : String(actual[key])
    if (e !== a) fail(`sample ${id} column ${key} mismatch: expected ${e}, got ${a}`)
  }
}

if (process.exitCode) process.exit(process.exitCode)
console.log(`[kb:d1:remote] sample parity passed (${uniqueSampleIds.length} rows)`)



