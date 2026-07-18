#!/usr/bin/env node
/**
 * Emits the INDEXING PROGRAM Part B curated URL set as a `figure_id<TAB>path`
 * list -- exact reuse of src/app/sitemap.ts's fandomSitemap() figure-page
 * loop (same isAtOrAboveIndexBar + prettyFigureUrl calls), so downstream
 * tools (prewarm-curl-runner.sh) warm precisely the URLs Part B will submit
 * once deployed.
 *
 * Reimplements indexValueCensus.ts's isAtOrAboveIndexBar() rather than
 * importing it -- the project's plain-Node ts-loader doesn't add the
 * `with { type: 'json' }` import attribute Node 24 requires for that
 * module's own JSON import. Keep this in lockstep with that file if the bar
 * or the Bing-protected set ever changes.
 *
 * Usage: node --import ./scripts/register-ts-loader.mjs scripts/gen-curated-url-list.mjs <out-file>
 */
import { getAllFandoms, getFiguresByFandom, prettyFigureUrl } from '../src/data/kb.ts'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CENSUS = JSON.parse(readFileSync(path.join(__dirname, '../src/data/index-value-census.json'), 'utf8'))
const BING_PROTECTED_FIDS = new Set([
  'fp_wrestling_mattel_basic_ex_mountain-dew-maj_cfec51',
])
function isAtOrAboveIndexBar(figureId) {
  return Object.prototype.hasOwnProperty.call(CENSUS, figureId) || BING_PROTECTED_FIDS.has(figureId)
}

const outPath = process.argv[2]
if (!outPath) {
  console.error('Usage: gen-curated-url-list.mjs <out-file>')
  process.exit(1)
}

const seen = new Set()
const lines = []
for (const fandom of getAllFandoms()) {
  for (const f of getFiguresByFandom(fandom)) {
    if (!isAtOrAboveIndexBar(f.figure_id)) continue
    const p = prettyFigureUrl(f)
    if (!seen.has(p)) {
      seen.add(p)
      lines.push(`${f.figure_id}\t${p}`)
    }
  }
}
writeFileSync(outPath, lines.join('\n') + '\n')
console.log(`wrote ${lines.length} curated URLs -> ${outPath}`)
