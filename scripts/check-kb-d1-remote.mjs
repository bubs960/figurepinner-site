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
// --table (2026-08-26, atomic-swap build): verify a STAGING table by name
// (e.g. kb_figures_new) BEFORE the rename — this is what closes the 8/25
// audit's "pre-rename verification only covers 7/18 columns and the strongest
// gate structurally can't run pre-rename" finding. Default stays kb_figures.
const tableArg = args.includes('--table') ? args[args.indexOf('--table') + 1] : 'kb_figures'
if (!tableArg || !/^[a-z_][a-z0-9_]*$/i.test(tableArg)) {
  console.error('[kb:d1:remote] --table needs a valid SQL identifier')
  process.exit(1)
}
const TABLE = tableArg
// --expect-rows: override the row-count expectation (rehearsal loads built
// with build-kb-d1-sql.mjs --limit N).
const expectRowsArg = args.includes('--expect-rows') ? Number(args[args.indexOf('--expect-rows') + 1]) : null

const { FIGURES_V2 } = require(resolve(ROOT, 'src/data/figures-reference-v2.slim.js'))
if (!Array.isArray(FIGURES_V2)) {
  console.error('[kb:d1:remote] FIGURES_V2[] export missing')
  process.exit(1)
}

function packSizeValue(value) {
  const text = value == null ? null : String(value)
  return text != null && Number.isFinite(Number(text)) ? text : '1'
}

// asText mirrors build-kb-d1-sql.mjs exactly: '' and null both load as NULL
// (except release_wave, which the loader coalesces to '').
function asText(value) {
  if (value == null) return null
  const text = String(value)
  return text.length ? text : null
}

// ALL 18 columns, transforms byte-matched to build-kb-d1-sql.mjs rowFromFigure.
// The 8/25 audit found the previous 7-column version never checked the fields
// most likely to carry real bugs (release_wave, scale, exclusive_to).
const ALL_COLUMNS = [
  'figure_id', 'fandom', 'character_canonical', 'manufacturer', 'product_line',
  'sub_fandom', 'character_variant', 'release_wave', 'scale', 'pack_size',
  'exclusive_to', 'canonical_image_url', 'name', 'v1_name', 'v1_line',
  'v1_series', 'match_represented', 'key_features',
]

function expectedRow(f) {
  return {
    figure_id: asText(f.figure_id),
    fandom: asText(f.fandom),
    character_canonical: asText(f.character_canonical),
    manufacturer: asText(f.manufacturer),
    product_line: asText(f.product_line),
    sub_fandom: asText(f.sub_fandom),
    character_variant: asText(f.character_variant),
    release_wave: asText(f.release_wave) ?? '',
    scale: asText(f.scale),
    pack_size: packSizeValue(f.pack_size),
    exclusive_to: asText(f.exclusive_to),
    canonical_image_url: asText(f.canonical_image_url ?? f.img),
    name: asText(f.name),
    v1_name: asText(f.v1_name),
    v1_line: asText(f.v1_line),
    v1_series: asText(f.v1_series),
    match_represented: asText(f.match_represented),
    key_features: asText(f.key_features),
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

// Rehearsal loads (--expect-rows N) were built from the first N figures;
// compute every expectation over the same subset so parity is exact.
const sourceFigures = expectRowsArg && Number.isFinite(expectRowsArg)
  ? FIGURES_V2.slice(0, expectRowsArg)
  : FIGURES_V2

const expectedRows = sourceFigures.map(expectedRow)

const expectedStats = {
  row_count: sourceFigures.length,
  image_count: sourceFigures.filter(f => f.canonical_image_url ?? f.img).length,
  enriched_count: sourceFigures.filter(f => f.match_represented || f.key_features).length,
}

const statsRows = runSql(`
  SELECT
    COUNT(*) AS row_count,
    SUM(CASE WHEN canonical_image_url IS NOT NULL AND canonical_image_url != '' THEN 1 ELSE 0 END) AS image_count,
    SUM(CASE WHEN match_represented IS NOT NULL OR key_features IS NOT NULL THEN 1 ELSE 0 END) AS enriched_count
  FROM ${TABLE}
`)
const actualStats = statsRows[0] ?? {}

console.log(`[kb:d1:remote] db: ${dbName} (${local ? 'local' : 'remote'}), table: ${TABLE}`)
console.log(`[kb:d1:remote] rows: expected ${expectedStats.row_count}, actual ${actualStats.row_count}`)
console.log(`[kb:d1:remote] image rows: expected ${expectedStats.image_count}, actual ${actualStats.image_count}`)
console.log(`[kb:d1:remote] enriched rows: expected ${expectedStats.enriched_count}, actual ${actualStats.enriched_count}`)

for (const key of Object.keys(expectedStats)) {
  if (Number(actualStats[key]) !== expectedStats[key]) {
    fail(`${key} mismatch: expected ${expectedStats[key]}, got ${actualStats[key]}`)
  }
}

// ── Per-column filled counts, ALL 18 columns (2026-08-26) ────────────────────
// Whole-table coverage for every column: counts rows where the column is
// non-null AND non-empty, compared against the same predicate over the slim KB.
// A wholesale column-shift/drop bug (the class a 7-column check misses) cannot
// pass this.
const filledExprs = ALL_COLUMNS
  .map(col => `SUM(CASE WHEN ${col} IS NOT NULL AND ${col} != '' THEN 1 ELSE 0 END) AS ${col}`)
  .join(', ')
const filledRows = runSql(`SELECT ${filledExprs} FROM ${TABLE}`)
const actualFilled = filledRows[0] ?? {}

for (const col of ALL_COLUMNS) {
  const expected = expectedRows.filter(r => r[col] != null && r[col] !== '').length
  const actual = Number(actualFilled[col])
  if (actual !== expected) {
    fail(`filled-count mismatch on ${col}: expected ${expected}, got ${actualFilled[col]}`)
  }
}
console.log(`[kb:d1:remote] per-column filled counts passed (${ALL_COLUMNS.length} columns)`)

// ── Sample parity, ALL 18 columns ────────────────────────────────────────────
// Anchors (first/last/known/image/enriched) + one sample per audit-named risk
// field (release_wave, scale, exclusive_to, character_variant) + an even
// 12-point spread across the catalog.
const spreadIds = []
for (let k = 0; k < 12; k += 1) {
  const idx = Math.floor((k * (sourceFigures.length - 1)) / 11)
  spreadIds.push(sourceFigures[idx]?.figure_id)
}

const sampleIds = [
  sourceFigures[0]?.figure_id,
  'fp_wrestling_mattel_ultimate-edition_30_seth-rollins_6dfa66',
  sourceFigures.find(f => String(f.canonical_image_url ?? '').includes('figurepinner-images'))?.figure_id,
  sourceFigures.find(f => f.match_represented || f.key_features)?.figure_id,
  sourceFigures.find(f => asText(f.release_wave))?.figure_id,
  sourceFigures.find(f => asText(f.scale))?.figure_id,
  sourceFigures.find(f => asText(f.exclusive_to))?.figure_id,
  sourceFigures.find(f => asText(f.character_variant))?.figure_id,
  sourceFigures[sourceFigures.length - 1]?.figure_id,
  ...spreadIds,
].filter(Boolean)

const expectedById = new Map(sourceFigures.map(f => [f.figure_id, expectedRow(f)]))
// The fixed Seth Rollins anchor may not exist in a rehearsal subset — only
// check ids the source subset actually contains.
const uniqueSampleIds = [...new Set(sampleIds)].filter(id => expectedById.has(id))
const sampleRows = runSql(`
  SELECT ${ALL_COLUMNS.join(', ')}
  FROM ${TABLE}
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
  for (const key of ALL_COLUMNS) {
    const e = expected[key] == null ? null : String(expected[key])
    const a = actual[key] == null ? null : String(actual[key])
    if (e !== a) fail(`sample ${id} column ${key} mismatch: expected ${e}, got ${a}`)
  }
}

if (process.exitCode) process.exit(process.exitCode)
console.log(`[kb:d1:remote] sample parity passed (${uniqueSampleIds.length} rows x ${ALL_COLUMNS.length} columns)`)



