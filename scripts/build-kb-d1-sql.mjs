#!/usr/bin/env node
/**
 * Build and validate D1 load SQL for the Option E KB catalog.
 *
 * Safe by default: `--check` only validates the committed slim KB. SQL files are
 * emitted only when `--out` is passed, and the default package script writes to
 * .tmp/kb-d1 (ignored by git).
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_OUT = join(ROOT, '.tmp', 'kb-d1')
const DEFAULT_CHUNK_SIZE = 250
let normalizedPackSizeCount = 0

const COLUMNS = [
  'figure_id',
  'fandom',
  'character_canonical',
  'manufacturer',
  'product_line',
  'sub_fandom',
  'character_variant',
  'release_wave',
  'scale',
  'pack_size',
  'exclusive_to',
  'canonical_image_url',
  'name',
  'v1_name',
  'v1_line',
  'v1_series',
  'match_represented',
  'key_features',
]

const REQUIRED_COLUMNS = [
  'figure_id',
  'fandom',
  'character_canonical',
  'manufacturer',
  'product_line',
]

function parseArgs(argv) {
  const opts = {
    check: argv.includes('--check'),
    out: null,
    chunkSize: DEFAULT_CHUNK_SIZE,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--out') {
      opts.out = argv[i + 1] ? resolve(ROOT, argv[i + 1]) : DEFAULT_OUT
      i += 1
    } else if (arg === '--chunk-size') {
      const next = Number(argv[i + 1])
      if (Number.isFinite(next) && next > 0) opts.chunkSize = Math.floor(next)
      i += 1
    }
  }

  return opts
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

function asText(value) {
  if (value == null) return null
  const text = String(value)
  return text.length ? text : null
}

function sqlValue(value) {
  if (value == null) return 'NULL'
  return `'${String(value).replaceAll("'", "''")}'`
}

function packSizeValue(value) {
  const text = asText(value)
  if (text != null && Number.isFinite(Number(text))) return text
  normalizedPackSizeCount += 1
  return '1'
}

function rowFromFigure(f) {
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

function validateRows(rows) {
  const errors = []
  const seen = new Set()
  const duplicateIds = new Set()
  const missing = Object.fromEntries(REQUIRED_COLUMNS.map((col) => [col, 0]))
  let imageCount = 0
  let localImageCount = 0
  let enrichedCount = 0
  let badPackSize = 0

  for (const row of rows) {
    for (const col of REQUIRED_COLUMNS) {
      if (!row[col]) missing[col] += 1
    }

    if (row.figure_id) {
      if (seen.has(row.figure_id)) duplicateIds.add(row.figure_id)
      seen.add(row.figure_id)
    }

    if (row.canonical_image_url) {
      imageCount += 1
      if (row.canonical_image_url.includes('figurepinner-images')) localImageCount += 1
    }
    if (row.match_represented || row.key_features) enrichedCount += 1
    if (!Number.isFinite(Number(row.pack_size))) badPackSize += 1
  }

  for (const [col, count] of Object.entries(missing)) {
    if (count > 0) errors.push(`${count} rows are missing required column ${col}`)
  }
  if (duplicateIds.size > 0) {
    errors.push(`${duplicateIds.size} duplicate figure_id values, first: ${[...duplicateIds][0]}`)
  }
  if (badPackSize > 0) errors.push(`${badPackSize} rows have non-numeric pack_size after normalization`)

  return {
    errors,
    rowCount: rows.length,
    imageCount,
    localImageCount,
    enrichedCount,
    missing,
    duplicateCount: duplicateIds.size,
    badPackSize,
    normalizedPackSizeCount,
  }
}

function insertSql(rows) {
  return rows
    .map((row) => `INSERT INTO kb_figures (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map((col) => sqlValue(row[col])).join(', ')});`)
    .join('\n') + '\n'
}

function rel(path) {
  return relative(ROOT, path).replaceAll('\\', '/')
}

const opts = parseArgs(process.argv.slice(2))
const kbPath = join(ROOT, 'src', 'data', 'figures-reference-v2.slim.js')
const ddlPath = join(ROOT, 'scripts', 'option-e-kb_figures.sql')

if (!existsSync(kbPath)) fail(`Missing KB source: ${rel(kbPath)}`)
if (!existsSync(ddlPath)) fail(`Missing DDL source: ${rel(ddlPath)}`)

const { FIGURES_V2 } = require(kbPath)
if (!Array.isArray(FIGURES_V2)) fail(`${rel(kbPath)} did not export FIGURES_V2[]`)

const rows = FIGURES_V2.map(rowFromFigure)
const report = validateRows(rows)

console.log(`[kb:d1] source: ${rel(kbPath)}`)
console.log(`[kb:d1] rows: ${report.rowCount}`)
console.log(`[kb:d1] image rows: ${report.imageCount} (${report.localImageCount} local FigurePinner images)`)
console.log(`[kb:d1] enriched rows: ${report.enrichedCount}`)
if (report.normalizedPackSizeCount) {
  console.log(`[kb:d1] pack_size normalized to 1: ${report.normalizedPackSizeCount}`)
}

if (report.errors.length) {
  for (const err of report.errors) console.error(`[kb:d1] ERROR: ${err}`)
  process.exit(1)
}

if (!opts.out) {
  console.log('[kb:d1] check passed; no SQL emitted. Use --out .tmp/kb-d1 to build load chunks.')
  process.exit(0)
}

rmSync(opts.out, { recursive: true, force: true })
mkdirSync(opts.out, { recursive: true })

const schemaOut = join(opts.out, '000_schema.sql')
writeFileSync(schemaOut, readFileSync(ddlPath, 'utf8'))

const chunkFiles = []
for (let start = 0, index = 1; start < rows.length; start += opts.chunkSize, index += 1) {
  const chunk = rows.slice(start, start + opts.chunkSize)
  const name = `001_load_${String(index).padStart(4, '0')}.sql`
  const path = join(opts.out, name)
  writeFileSync(path, insertSql(chunk))
  chunkFiles.push(path)
}

const manifestLines = [
  '# Apply these after creating the remote D1 database and filling KB_DB in wrangler.toml.',
  '# Keep production routes on src/data/kb until remote row-count and sample parity pass.',
  '',
  `npx wrangler d1 execute figurepinner-kb --remote --file ${rel(schemaOut)}`,
  ...chunkFiles.map((file) => `npx wrangler d1 execute figurepinner-kb --remote --file ${rel(file)}`),
  '',
]
writeFileSync(join(opts.out, 'apply-remote-commands.txt'), manifestLines.join('\n'))
writeFileSync(join(opts.out, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`)

console.log(`[kb:d1] wrote schema + ${chunkFiles.length} load chunks to ${rel(opts.out)}`)
console.log(`[kb:d1] next: review ${rel(join(opts.out, 'apply-remote-commands.txt'))}`)


