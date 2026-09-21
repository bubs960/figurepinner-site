#!/usr/bin/env node
/**
 * harvest-dead-pretty-paths.mjs -- MANUAL tool (not in any build/deploy chain).
 *
 * Takes pretty URLs that crawlers are hitting as 404s and, for each one, looks for PROOF in
 * this repo's git history that it was genuinely served: a slim-KB version where a live record
 * had exactly that fandom / line / character_canonical (the router's own match rule). Proven
 * paths are written to src/data/pretty-path-harvest.json as a FACT (path -> the fid that
 * served it, the commit and date that prove it). The successor is NOT decided here --
 * scripts/build-figure-redirects.mjs re-derives it against the current KB on every build
 * (scripts/lib/derive-pretty-path-redirects.mjs explains why).
 *
 * Never guesses. A path with no historical record is reported "never-served" and stays a 404.
 * A path whose fid left the KB with no duplicate_of trail is reported "no-survivor" -- that is
 * a rekey matcher did not record; the report lists them so matcher can supply the mapping.
 *
 * Usage:
 *   node scripts/harvest-dead-pretty-paths.mjs --from-cloudflare [--days 7] [--report <file>]
 *   node scripts/harvest-dead-pretty-paths.mjs --paths-file <json|txt> [--report <file>]
 *   add --dry-run to print the outcome without touching the ledger.
 *   add --line-renames <json> to apply matcher's line-rename table (third evidence class, below).
 *
 * --from-cloudflare reads CF_API_TOKEN from the environment or ~/.figurepinner-secrets.env and
 * pulls status-404 paths for the verified crawlers, one UTC day per query (Free-plan limit).
 * Cost: one `git show` of the 32 MB slim KB per sampled day of history -- a few minutes.
 * Cadence: deliberately manual (run after a slug-scheme change or monthly); see the board.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { parsePrettyPath, recordServesPath, servedPathKeys } from './lib/derive-pretty-path-redirects.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SLIM = 'src/data/figures-reference-v2.slim.js'
const LEDGER = join(ROOT, 'src', 'data', 'pretty-path-harvest.json')
const args = process.argv.slice(2)
const arg = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : null }
const DRY = args.includes('--dry-run')
const git = (a) => execFileSync('git', ['-C', ROOT, ...a], { maxBuffer: 1 << 30 }).toString('utf8')

// The slim KB is `const FIGURES_V2 = [ …JSON… ]; module.exports = …` at every commit — same
// bracket-slice parse indexnow-ping.mjs uses for historical versions (no eval).
function loadSlim(source) {
  const out = JSON.parse(source.slice(source.indexOf('['), source.lastIndexOf(']') + 1))
  if (!Array.isArray(out)) throw new Error('slim KB did not parse to an array')
  return out
}

async function cloudflare404s(days) {
  let token = process.env.CF_API_TOKEN
  if (!token) {
    try {
      for (const l of readFileSync(join(homedir(), '.figurepinner-secrets.env'), 'utf8').split(/\r?\n/)) {
        const m = /^CF_API_TOKEN=(.*)$/.exec(l.trim()); if (m) token = m[1].replace(/^["']|["']$/g, '')
      }
    } catch {}
  }
  if (!token) throw new Error('no CF_API_TOKEN (environment or ~/.figurepinner-secrets.env)')
  const H = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
  const zone = (await (await fetch('https://api.cloudflare.com/client/v4/zones?name=figurepinner.com', { headers: H })).json()).result?.[0]?.id
  if (!zone) throw new Error('Cloudflare zone lookup failed')
  const BOTS = ['%bingbot%', '%Googlebot%', '%OAI-SearchBot%', '%Applebot%', '%ClaudeBot%', '%YandexBot%', '%DuckDuckBot%']
  const hits = new Map()
  for (let d = 1; d <= days; d++) {
    const s = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10)
    const e = new Date(Date.now() - (d - 1) * 864e5).toISOString().slice(0, 10)
    for (const ua of BOTS) {
      const r = await (await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({
        query: 'query($z:String!,$s:Time!,$e:Time!,$ua:String!){viewer{zones(filter:{zoneTag:$z}){httpRequestsAdaptiveGroups(limit:2000,orderBy:[count_DESC],filter:{datetime_geq:$s,datetime_lt:$e,userAgent_like:$ua,edgeResponseStatus:404}){count dimensions{clientRequestPath}}}}}',
        variables: { z: zone, s: s + 'T00:00:00Z', e: e + 'T00:00:00Z', ua },
      }) })).json()
      for (const g of r.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? []) hits.set(g.dimensions.clientRequestPath, (hits.get(g.dimensions.clientRequestPath) || 0) + g.count)
    }
  }
  return [...hits].map(([path, n]) => ({ path, hits: n }))
}

function pathsFromFile(file) {
  const text = readFileSync(file, 'utf8')
  try {
    const j = JSON.parse(text)
    return j.map((r) => (typeof r === 'string' ? { path: r, hits: 1 } : { path: r.path, hits: r.hits ?? 1 }))
  } catch {
    return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((path) => ({ path, hits: 1 }))
  }
}

const input = args.includes('--from-cloudflare') ? await cloudflare404s(Number(arg('--days') || 7)) : arg('--paths-file') ? pathsFromFile(arg('--paths-file')) : null
if (!input) { console.error('give --from-cloudflare or --paths-file <file>'); process.exit(1) }

const current = loadSlim(readFileSync(join(ROOT, SLIM), 'utf8'))
const servedNow = servedPathKeys(current)
const liveNow = new Set(current.filter((f) => !f.phantom && !f.duplicate_of).map((f) => f.figure_id))
const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : {}

const todo = new Map()
const report = { liveNow: [], alreadyInLedger: [], proven: [], neverServed: [], notAFigurePath: 0 }
for (const { path, hits } of input) {
  const clean = path.replace(/\/+$/, '')
  const parsed = parsePrettyPath(clean)
  if (!parsed) { report.notAFigurePath++; continue }
  if (servedNow.has(`${parsed.fandom}|${parsed.line}|${parsed.slug}`)) { report.liveNow.push({ path: clean, hits }); continue }
  if (ledger[clean]) { report.alreadyInLedger.push({ path: clean, hits }); continue }
  todo.set(clean, { parsed, hits })
}
console.log(`[harvest] ${input.length} input path(s): ${todo.size} dead figure path(s) to prove, ${report.liveNow.length} resolve in the current KB (404 was stale data, not a slug change), ${report.alreadyInLedger.length} already in the ledger, ${report.notAFigurePath} not figure paths`)

// One slim-KB version per calendar day, newest first; stop as soon as every path is proven.
const versions = []
const seenDay = new Set()
for (const line of git(['log', '--format=%H %ad', '--date=short', '--', SLIM]).trim().split('\n')) {
  const [sha, day] = line.split(' ')
  if (!seenDay.has(day)) { seenDay.add(day); versions.push({ sha, day }) }
}
console.log(`[harvest] walking ${versions.length} daily KB version(s), ${versions.at(-1)?.day} .. ${versions[0]?.day}`)
for (const { sha, day } of versions) {
  if (!todo.size) break
  let records
  try { records = loadSlim(git(['show', sha + ':' + SLIM])) } catch (err) { console.warn('[harvest] skip ' + sha.slice(0, 8) + ': ' + err.message.slice(0, 80)); continue }
  const bySlug = new Map()
  for (const r of records) {
    const k = String(r.character_canonical ?? '').toLowerCase().trim()
    if (!bySlug.has(k)) bySlug.set(k, [])
    bySlug.get(k).push(r)
  }
  for (const [path, { parsed, hits }] of [...todo]) {
    const matches = (bySlug.get(parsed.slug) || []).filter((r) => recordServesPath(r, parsed))
    if (!matches.length) continue
    // The router shows the highest release_wave first; mirror it so the fact names the figure the URL actually displayed.
    matches.sort((a, b) => (parseInt(b.release_wave) || 0) - (parseInt(a.release_wave) || 0))
    const shown = matches[0]
    report.proven.push({ path, hits, fid: shown.figure_id, lastServed: day, commit: sha.slice(0, 10), fidLiveNow: liveNow.has(shown.figure_id), otherFids: matches.slice(1).map((m) => m.figure_id) })
    todo.delete(path)
  }
}
// Second evidence class, for paths older than this repo's KB history: the fid is minted from
// the record's original (fandom, manufacturer, line, …, character slug), so a LIVE fid whose
// embedded line and slug segments equal the dead path's is the same figure under its original
// slug (e.g. fp_wrestling_mattel_basic_21_50-r-truth_db8c34 now serves /wrestling/basic/r-truth).
// Exact identifier equality only, and only when exactly ONE live fid matches -- two candidates
// means the old URL is ambiguous and it stays a 404. Truncated long slugs never match: fine.
const byEmbedded = new Map()
for (const f of current) {
  if (f.phantom || f.duplicate_of) continue
  const s = String(f.figure_id).split('_')
  if (s.length < 6 || s[0] !== 'fp') continue
  const slugSeg = s[s.length - 2]
  for (const k of [`${s[1]}|${s[3]}|${slugSeg}`, `${s[1]}|${s[2]}-${s[3]}|${slugSeg}`]) {
    if (!byEmbedded.has(k)) byEmbedded.set(k, new Set())
    byEmbedded.get(k).add(f.figure_id)
  }
}
report.provenByFid = []
for (const [path, { parsed, hits }] of [...todo]) {
  const c = new Set([...(byEmbedded.get(`${parsed.fandom}|${parsed.line}|${parsed.slug}`) || []), ...(byEmbedded.get(`${parsed.genre}|${parsed.line}|${parsed.slug}`) || [])])
  if (c.size !== 1) continue
  report.provenByFid.push({ path, hits, fid: [...c][0] })
  todo.delete(path)
}
// Third evidence class (2026-09-19): matcher's line-rename table
// (Bridge/LINE-RENAME-CANDIDATES-<date>.json). The KB keeps no line-rename history, so a
// renamed or fandom-retagged line leaves every one of its old URLs unprovable above. Only rows
// matcher graded "high" are used, and the character rule stays exact: the dead path's slug must
// equal the character_canonical of a record the router serves TODAY under the row's new
// genre/line. Medium rows, character-level moves and slugs with no live record stay a 404.
report.provenByLineRename = []
if (arg('--line-renames')) {
  const table = JSON.parse(readFileSync(arg('--line-renames'), 'utf8'))
  const rows = new Map((table.line_level || []).filter((r) => r.confidence === 'high').map((r) => [r.old.toLowerCase(), r.new.toLowerCase()]))
  for (const [path, { parsed, hits }] of [...todo]) {
    const to = rows.get(`${parsed.genre}/${parsed.line}`)
    if (!to) continue
    const target = parsePrettyPath(`/${to}/${parsed.slug}`)
    const matches = current.filter((r) => recordServesPath(r, target))
    if (!matches.length) continue
    matches.sort((a, b) => (parseInt(b.release_wave) || 0) - (parseInt(a.release_wave) || 0))
    report.provenByLineRename.push({ path, hits, fid: matches[0].figure_id, servedNowAt: `/${to}/${parsed.slug}` })
    todo.delete(path)
  }
  console.log(`[harvest] proven by matcher's line-rename table (${rows.size} high-grade row(s)): ${report.provenByLineRename.length}`)
}
for (const [path, { hits }] of todo) report.neverServed.push({ path, hits })

for (const p of report.proven) ledger[p.path] = { fid: p.fid, lastServed: p.lastServed, commit: p.commit, evidence: 'kb-history' }
for (const p of report.provenByFid) ledger[p.path] = { fid: p.fid, lastServed: null, commit: null, evidence: 'fid-embedded-slug' }
for (const p of report.provenByLineRename) ledger[p.path] = { fid: p.fid, lastServed: null, commit: null, evidence: 'line-rename' }
console.log(`[harvest] proven by live fid's embedded slug (pre-history paths): ${report.provenByFid.length}`)
const sorted = Object.fromEntries(Object.keys(ledger).sort().map((k) => [k, ledger[k]]))
console.log(`[harvest] proven served: ${report.proven.length} (fid still live under a new path: ${report.proven.filter((p) => p.fidLiveNow).length}) | no record in ${versions.length} daily versions: ${report.neverServed.length}`)
if (!DRY) {
  writeFileSync(LEDGER, JSON.stringify(sorted, null, 2) + '\n')
  console.log(`[harvest] ledger now ${Object.keys(sorted).length} fact(s) -> src/data/pretty-path-harvest.json. Run: node scripts/build-figure-redirects.mjs`)
}
if (arg('--report')) { writeFileSync(arg('--report'), JSON.stringify(report, null, 1)); console.log('[harvest] report -> ' + arg('--report')) }
