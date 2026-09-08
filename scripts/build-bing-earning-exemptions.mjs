#!/usr/bin/env node
/**
 * build-bing-earning-exemptions.mjs — corpus-focus exemption list (c)
 * (spec v3 §4.4 c), FROZEN-EXPORT variant.
 *
 * Spec (c) asks for "the URLs behind the 34 Bing-winning + 4 AI-cited test
 * queries" via a live SERP dry-run. On 2026-09-08 the in-app browser could
 * not perform that dry-run: Bing served a degraded/decoy SERP to the
 * automated session (site:figurepinner.com decoded to social.technet.microsoft.com
 * links), so per-query URL capture is not trustworthy from this surface.
 * Until a human-browser dry-run lands, this script derives the SAME intent
 * from the frozen BWT export: every figure page that earned >= 1 Bing web
 * impression in the 90-day baseline window (Bridge/bwt-2026-08-01
 * PageTrafficReport) is demonstrably Bing-winning and is exempted. The
 * 33 present + 3 AI-cited queries are carried in the artifact for the
 * human dry-run to confirm/extend.
 *
 * Output: src/data/google-index-bar.exemptions-bing.json
 * Fail-closed: missing export, unreadable rows, or 0 mapped fids => exit 1.
 * Inert data until wave 1.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const EXPORT = 'C:/Users/bubs9/Documents/Claude/Projects/Bridge/bwt-2026-08-01/figurepinner.com_PageTrafficReport_8_1_2026.csv'
const EXPORT_ASOF = '2026-08-01'
const EXPORT_WINDOW = { geq: '2026-05-01', leq: '2026-07-30', days: 90 }
const QUERIES = resolve(ROOT, 'src/data/google-index-bar.bing-test-queries.json')
const PRETTY = resolve(ROOT, 'src/data/figureIdToPrettyPath.generated.json')
const OUT = resolve(ROOT, 'src/data/google-index-bar.exemptions-bing.json')

function fail(msg) { console.error(`[bing-exemptions] FAIL-CLOSED: ${msg}`); process.exit(1) }
if (!existsSync(EXPORT)) fail(`missing BWT export ${EXPORT}`)
if (!existsSync(QUERIES)) fail(`missing ${QUERIES}`)

function parseCsv(text) {
  const rows = []
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (!line.trim()) continue
    const cells = []; let cur = ''; let q = false
    for (const ch of line) {
      if (ch === '"') q = !q
      else if (ch === ',' && !q) { cells.push(cur); cur = '' }
      else cur += ch
    }
    cells.push(cur); rows.push(cells)
  }
  return rows
}
const rows = parseCsv(readFileSync(EXPORT, 'utf8'))
const header = rows.shift()
if (!header || header[0] !== 'Page' || header[1] !== 'Impressions') fail(`unexpected header ${JSON.stringify(header)}`)

const prettyMap = JSON.parse(readFileSync(PRETTY, 'utf8'))
const pathToFid = new Map(Object.entries(prettyMap).map(([fid, p]) => [p, fid]))
const fids = new Map(); const unmapped = []; let figureRows = 0
for (const r of rows) {
  const imp = Number(r[1]); if (!(imp >= 1)) continue
  let p = r[0].replace(/^https?:\/\/figurepinner\.com/, '').split('?')[0]
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  const legacy = p.match(/^\/figure\/(fp_[A-Za-z0-9_.-]+)$/)
  const isDeep = p.split('/').length === 4 && !p.startsWith('/guides/') && !p.includes('/character/')
  if (!legacy && !isDeep) continue
  figureRows++
  const fid = legacy ? legacy[1] : pathToFid.get(p)
  if (fid) fids.set(fid, (fids.get(fid) ?? 0) + imp)
  else unmapped.push({ path: p, impressions: imp })
}
if (fids.size === 0) fail('0 figure fids mapped from the export')
const queries = JSON.parse(readFileSync(QUERIES, 'utf8'))
const artifact = {
  asof: EXPORT_ASOF,
  source: 'BWT PageTrafficReport (frozen 2026-08-01, 90 d) — figure pages with >= 1 Bing web impression; stand-in for the per-query SERP dry-run (see script header)',
  window: EXPORT_WINDOW,
  serp_dry_run: { status: 'NOT RUN — automated Bing SERP returned decoy results 2026-09-08; needs a human browser', queries },
  fids: [...fids.keys()].sort(),
  fid_impressions: Object.fromEntries([...fids.entries()].sort((a, b) => b[1] - a[1])),
  figure_rows: figureRows,
  paths_unmapped: unmapped.sort((a, b) => b.impressions - a.impressions),
}
writeFileSync(OUT, JSON.stringify(artifact, null, 2) + '\n')
console.log(`[bing-exemptions] wrote ${OUT}: ${fids.size} fid(s) from ${figureRows} figure rows; ${unmapped.length} unmapped paths (no unique pretty URL today); ${queries.present.length} present + ${queries.ai_cited.length} AI-cited queries carried`)
