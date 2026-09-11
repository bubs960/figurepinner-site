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
 *
 * SCOPE CAP (2026-09-08, webaudit verdict on WEB-TO-WEBAUDIT-STANDALONE-
 * RELEASE-Q-CANARY-BUILT-EXEMPTIONS-FILED-BING-SERP-INSTRUMENT-2026-09-08.md):
 * the full BWT-derived candidate set (every fid with >=1 impression in 90 d)
 * ran to 511 fids -- 10x+ the spec's ~38-URL scope (34 winners + 4 AI-cited)
 * and wide enough to distort the program's tracked tier-2-protected
 * population without anyone sizing that change. Per webaudit's option 3,
 * the ACTUAL exemption list is capped to the top CAP_N fids by impression
 * volume (order-of-magnitude match to the spec, not a proxy for query
 * relevance) and the deviation is logged explicitly in the artifact rather
 * than folded in silently. The full 511-fid set is kept as
 * `full_candidate_set_fids` for the record and for whoever runs the real
 * per-query SERP dry-run to check candidates against. Widening past CAP_N
 * is Steve's call (webaudit point 4), not web's to greenlight.
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
const CAP_N = 38 // order-of-magnitude match to spec 4.4(c): 34 winners + 4 AI-cited

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
const ranked = [...fids.entries()].sort((a, b) => b[1] - a[1])
const capped = ranked.slice(0, CAP_N)
const artifact = {
  asof: EXPORT_ASOF,
  source: 'BWT PageTrafficReport (frozen 2026-08-01, 90 d) — figure pages with >= 1 Bing web impression; stand-in for the per-query SERP dry-run (see script header)',
  window: EXPORT_WINDOW,
  serp_dry_run: { status: 'NOT RUN — automated Bing SERP returned decoy results 2026-09-08; needs a human browser', queries },
  deviation: {
    tracked: true,
    reason: 'spec 4.4(c) scopes exemption (c) to ~38 URLs (34 Bing winners + 4 AI-cited); the SERP dry-run that would produce that exact set could not run (see serp_dry_run above), so this is a BWT-derived proxy capped to the same order of magnitude by impression volume, not a query-relevance match',
    verdict: "webaudit CONDITIONAL 2026-09-08 (WEBAUDIT-TO-WEB-STANDALONE-RELEASE-Q-BING-EXEMPTION-DEVIATION-VERDICT-2026-09-08.md): full 511-fid candidate set REJECTED as a drop-in (10x+ spec scope, distorts the tracked tier-2-protected population); capped proxy + explicit logging is option 3; widening past cap_n is Steve's call, not web's",
    cap_n: CAP_N,
    full_candidate_count: ranked.length,
  },
  // The actual exemption list (spec-sized proxy) — this is what
  // build-google-index-bar.mjs reads once (c) is wired in at wave 1.
  fids: capped.map(([fid]) => fid).sort(),
  fid_impressions: Object.fromEntries(capped),
  // Reference only, NOT the exemption list — the full BWT candidate
  // population, for sizing checks and for whoever runs the real dry-run.
  full_candidate_set_fids: ranked.map(([fid]) => fid).sort(),
  figure_rows: figureRows,
  paths_unmapped: unmapped.sort((a, b) => b.impressions - a.impressions),
}
writeFileSync(OUT, JSON.stringify(artifact, null, 2) + '\n')
console.log(`[bing-exemptions] wrote ${OUT}: exemption fids capped to ${capped.length} of ${ranked.length} candidates (cap_n=${CAP_N}, spec 4.4c order-of-magnitude match, webaudit-directed 9/8); ${figureRows} figure rows scanned, ${unmapped.length} unmapped paths; ${queries.present.length} present + ${queries.ai_cited.length} AI-cited queries carried for the real dry-run`)
