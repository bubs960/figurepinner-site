#!/usr/bin/env node
/**
 * scripts/kb-d1-parity-local.mjs — OOM stage 2 evidence (plan §6 steps 5-6).
 *
 * Runs the NEW bounded statements from src/data/kbDbQueries.ts and the OLD
 * kbDb.ts@f0bfac2 statements against the SAME local miniflare D1 SQLite file,
 * over the whole catalog, and reports every mismatch (per check) plus EXPLAIN
 * QUERY PLAN for each statement. Read-only. Needs the local D1 populated with
 * kb_figures (`node scripts/kb-d1-swap.mjs load --local --dir <build>` then a
 * local rename, or `rehearse`) — it never touches remote D1 and never imports
 * the Worker.
 *
 * The OLD statements run exactly as production ran them (no ORDER BY): their
 * row order is whatever index the planner picks, which the EXPLAIN section
 * records. The NEW reads apply sortLikeFandomScan in JS, so the ordered
 * comparisons below are the proof that first-N behaviour is unchanged.
 *
 * Run:  node --import ./scripts/register-ts-loader.mjs scripts/kb-d1-parity-local.mjs [--db <file.sqlite>] [--plans-only]
 * Exit: 0 when every check matches, 1 on any mismatch (or no local DB).
 */
import { DatabaseSync } from 'node:sqlite'
import { readdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SQL, ROUTE_COLS, CARD_COLS, norm, lineQueryPlan, rowMatchesLineToken, sortLikeFandomScan, IN_CHUNK, chunk,
} from '../src/data/kbDbQueries.ts'
import { prettyUrlRouterCountKeys, prettyUrlRouterLookupKey } from '../src/data/kbTypes.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const argValue = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null }
const plansOnly = argv.includes('--plans-only')

function findLocalDb() {
  const explicit = argValue('--db')
  if (explicit) return resolve(ROOT, explicit)
  const dir = join(ROOT, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject')
  if (!existsSync(dir)) return null
  for (const name of readdirSync(dir).filter(n => n.endsWith('.sqlite'))) {
    const p = join(dir, name)
    try {
      const probe = new DatabaseSync(p, { readOnly: true })
      const hit = probe.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'kb_figures'`).get()
      probe.close()
      if (hit) return p
    } catch { /* not this file */ }
  }
  return null
}

const dbPath = findLocalDb()
if (!dbPath) {
  console.error('[parity] no local D1 SQLite with a kb_figures table found under .wrangler/state — load one first (see header)')
  process.exit(1)
}
const db = new DatabaseSync(dbPath, { readOnly: true })
console.log(`[parity] db: ${dbPath}`)

// ── OLD statements, verbatim WHERE clauses from kbDb.ts @ f0bfac2 (no ORDER BY, as production ran them) ──
const OLD = {
  fandomRows: `SELECT rowid AS rid, ${ROUTE_COLS}, release_wave FROM kb_figures WHERE fandom = ?`,
  line: `SELECT rowid AS rid, figure_id FROM kb_figures WHERE fandom = ? AND (LOWER(product_line) = ? OR LOWER(manufacturer || '-' || product_line) = ?)`,
  unique: `SELECT COUNT(*) AS c FROM kb_figures WHERE fandom = ? AND (LOWER(product_line) = ? OR LOWER(manufacturer || '-' || product_line) = ?) AND LOWER(character_canonical) = ?`,
}

const mismatches = new Map() // check -> [messages]
const note = (check, msg) => { const l = mismatches.get(check) ?? []; l.push(msg); mismatches.set(check, l) }
const stats = {}
const ids = rows => rows.map(r => r.figure_id)
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])
const waveDesc = (a, b) => ((parseInt(b.release_wave) || 0) - (parseInt(a.release_wave) || 0))

const total = db.prepare('SELECT COUNT(*) AS c FROM kb_figures').get().c
const fandoms = db.prepare(SQL.allFandoms).all().map(r => r.fandom)
console.log(`[parity] kb_figures: ${total} rows, ${fandoms.length} fandoms`)

// Prepared NEW statements (exactly the builders kbDb.ts executes)
const newByChar = db.prepare(SQL.figuresByCharacter(`${ROUTE_COLS}, release_wave`))
const newCardsByChar = db.prepare(SQL.figuresByCharacter(CARD_COLS))
const newUnique = db.prepare(SQL.prettyUrlUniqueCount)
const oldUnique = db.prepare(OLD.unique)
const oldLine = db.prepare(OLD.line)
const newWaveEmpty = db.prepare(SQL.waveCompanions('figure_id, product_line', true))
const newWave = db.prepare(SQL.waveCompanions('figure_id, product_line', false))
const newLineWaveCounts = db.prepare(SQL.lineWaveCounts)
const newCardsByFandom = db.prepare(SQL.cardsByFandom)
const oldFandomRows = db.prepare(OLD.fandomRows)
const planCache = new Map()
const prepPlan = (sql) => { let s = planCache.get(sql); if (!s) { s = db.prepare(sql); planCache.set(sql, s) } return s }

// Mirrors kbDb.getFiguresByLine: run the plan, dedupe by figure_id, restore fandom-scan order.
function runLinePlan(cols, fandom, token) {
  const seen = new Set()
  const rows = []
  for (const q of lineQueryPlan(cols, fandom, token)) {
    for (const r of prepPlan(q.sql).all(...q.params)) {
      if (seen.has(r.figure_id)) continue
      seen.add(r.figure_id)
      rows.push(r)
    }
  }
  return sortLikeFandomScan(rows)
}

// Full-DB router-key map — the third implementation (in-request map) of the uniqueness predicate.
const allRouteRows = db.prepare(`SELECT ${ROUTE_COLS} FROM kb_figures`).all()
const fullCounts = new Map()
for (const r of allRouteRows) for (const k of prettyUrlRouterCountKeys(r)) fullCounts.set(k, (fullCounts.get(k) ?? 0) + 1)

if (!plansOnly) {
  let routes = 0, uniques = 0, lines = 0, waves = 0, chars = 0, hubs = 0, hubFigs = 0, ownRowsHubs = 0
  const t0 = Date.now()
  for (const fandom of fandoms) {
    const fRows = oldFandomRows.all(fandom) // as production: planner order (idx_kb_figures_fandom_line → product_line, rowid)
    const byChar = new Map()
    for (const r of fRows) { const l = byChar.get(r.character_canonical) ?? []; l.push(r); byChar.set(r.character_canonical, l) }

    // 0. Genre hub cards: whole-fandom compact read, ordered like the old scan.
    const cards = sortLikeFandomScan(newCardsByFandom.all(fandom))
    if (!same(ids(fRows), ids(cards))) note('cardsByFandom', `${fandom}: ${fRows.length} vs ${cards.length} (or order)`)

    // 1. Route resolution + character cards: old fandom scan + JS filter vs new (character) seek + same filter.
    for (const [char, oldCharRows] of byChar) {
      const newCharRows = sortLikeFandomScan(newByChar.all(fandom, char))
      chars++
      if (!same(ids(oldCharRows), ids(newCharRows))) note('characterCards', `${fandom}/${char}: old ${oldCharRows.length} vs new ${newCharRows.length} (or order)`)
      const cardRows = newCardsByChar.all(fandom, char)
      if (cardRows.length !== oldCharRows.length) note('cardsByCharacter', `${fandom}/${char}: ${cardRows.length} vs ${oldCharRows.length}`)
      const tokens = new Set()
      for (const r of oldCharRows) { tokens.add(norm(r.product_line)); tokens.add(`${norm(r.manufacturer)}-${norm(r.product_line)}`) }
      for (const token of tokens) {
        const slugNorm = norm(char)
        const oldM = fRows.filter(r => rowMatchesLineToken(r, token) && norm(r.character_canonical) === slugNorm).sort(waveDesc)
        const newM = newCharRows.filter(r => rowMatchesLineToken(r, token) && norm(r.character_canonical) === slugNorm).sort(waveDesc)
        routes++
        if (!same(ids(oldM), ids(newM))) note('route', `${fandom}/${token}/${char}: old [${ids(oldM)}] vs new [${ids(newM)}]`)
      }
    }

    // 2. Uniqueness: old LOWER() COUNT vs new indexed COUNT vs full-DB router-key map — three-way, every row.
    for (const r of fRows) {
      const line = norm(r.product_line), char = norm(r.character_canonical)
      const o = oldUnique.get(fandom, line, line, char).c
      const n = newUnique.get(fandom, char, line, line).c
      const m = fullCounts.get(prettyUrlRouterLookupKey(r)) ?? 0
      uniques++
      if (o !== n || n !== m) note('unique', `${r.figure_id}: old=${o} new=${n} map=${m}`)
    }

    // 3. Line reads: old OR-expression scan vs new batched plan, ordered — every bare and compound token.
    const lineTokens = new Set()
    for (const r of fRows) { lineTokens.add(norm(r.product_line)); lineTokens.add(`${norm(r.manufacturer)}-${norm(r.product_line)}`) }
    for (const token of lineTokens) {
      const o = oldLine.all(fandom, token, token)
      const n = runLinePlan('figure_id', fandom, token)
      lines++
      if (!same(ids(o), ids(n))) note('line', `${fandom}/${token}: old ${o.length} vs new ${n.length} (or order)`)

      // 4. Line-hub count map from own rows (+ narrow reads for compound-alias members) vs the per-figure SQL verdict.
      const hubRows = runLinePlan(ROUTE_COLS, fandom, token)
      const otherLines = [...new Set(hubRows.map(r => norm(r.product_line)))].filter(pl => pl !== token)
      const mapRows = new Map(hubRows.map(r => [r.figure_id, r]))
      for (const pl of otherLines) for (const r of runLinePlan(ROUTE_COLS, fandom, pl)) if (!mapRows.has(r.figure_id)) mapRows.set(r.figure_id, r)
      const counts = new Map()
      for (const r of mapRows.values()) for (const k of prettyUrlRouterCountKeys(r)) counts.set(k, (counts.get(k) ?? 0) + 1)
      hubs++
      if (!otherLines.length) ownRowsHubs++
      for (const r of hubRows) {
        hubFigs++
        const viaMap = counts.get(prettyUrlRouterLookupKey(r)) === 1
        const viaSql = newUnique.get(fandom, norm(r.character_canonical), norm(r.product_line), norm(r.product_line)).c === 1
        if (viaMap !== viaSql) note('lineHubMap', `${fandom}/${token} ${r.figure_id}: map=${viaMap} sql=${viaSql}`)
      }
    }

    // 5. Wave companions: old JS filter over mapped rows vs new SQL, every (product_line, wave) group, ordered.
    const groups = new Map()
    for (const r of fRows) { const k = `${r.product_line} ${r.release_wave ?? ''}`; const l = groups.get(k) ?? []; l.push(r); groups.set(k, l) }
    for (const [k, oldG] of groups) {
      const sp = k.indexOf(' ')
      const pl = k.slice(0, sp), wave = k.slice(sp + 1)
      const newG = sortLikeFandomScan(wave === '' ? newWaveEmpty.all(fandom, pl) : newWave.all(fandom, pl, wave))
      waves++
      if (!same(ids(oldG), ids(newG))) note('waveCompanions', `${fandom}/${pl}/${JSON.stringify(wave)}: old ${oldG.length} vs new ${newG.length} (or order)`)
    }

    // 6. Vault line-wave denominators: old JS aggregation (skip falsy wave) vs SQL GROUP BY.
    const oldAgg = new Map()
    for (const r of fRows) { if (!r.release_wave) continue; const k = `${r.product_line}/${r.release_wave}`; oldAgg.set(k, (oldAgg.get(k) ?? 0) + 1) }
    const newAgg = new Map(newLineWaveCounts.all(fandom).map(r => [`${r.product_line}/${r.release_wave}`, Number(r.c)]))
    if (oldAgg.size !== newAgg.size) note('lineWaveCounts', `${fandom}: ${oldAgg.size} groups vs ${newAgg.size}`)
    for (const [k, v] of oldAgg) if (newAgg.get(k) !== v) note('lineWaveCounts', `${fandom}/${k}: old ${v} vs new ${newAgg.get(k)}`)
  }
  Object.assign(stats, {
    fandoms: fandoms.length, rows: total, characters: chars, routeTriples: routes, uniquenessRows: uniques,
    lineTokens: lines, lineHubs: hubs, lineHubFigures: hubFigs, lineHubsResolvedFromOwnRows: ownRowsHubs,
    waveGroups: waves, seconds: ((Date.now() - t0) / 1000).toFixed(1),
  })

  // 7. IN-chunked route rows == per-character rows (the prettyUrlCountsForCharacters path).
  const sampleFandom = fandoms.includes('wrestling') ? 'wrestling' : fandoms[0]
  const sampleChars = [...new Set(oldFandomRows.all(sampleFandom).map(r => r.character_canonical))].slice(0, IN_CHUNK * 2 + 7)
  let inRows = 0
  for (const part of chunk(sampleChars, IN_CHUNK)) inRows += db.prepare(SQL.routeRowsForCharacters(part.length)).all(...part).filter(r => r.fandom === sampleFandom).length
  const perChar = sampleChars.reduce((n, c) => n + newByChar.all(sampleFandom, c).length, 0)
  if (inRows !== perChar) note('routeRowsForCharacters', `${sampleFandom}: IN-chunked ${inRows} vs per-character ${perChar}`)
  stats.inChunkSample = { fandom: sampleFandom, characters: sampleChars.length, rows: inRows }
}

// ── EXPLAIN QUERY PLAN, recorded (plan §6 step 5) ────────────────────────────
const sample = db.prepare(`SELECT ${ROUTE_COLS}, release_wave FROM kb_figures WHERE fandom = ? ORDER BY rowid LIMIT 1`).get(fandoms.includes('wrestling') ? 'wrestling' : fandoms[0])
const compound = `${sample.manufacturer}-${sample.product_line}`
const explain = (label, sql, params) => {
  const rows = db.prepare('EXPLAIN QUERY PLAN ' + sql).all(...params)
  console.log(`\n[plan] ${label}\n       ${sql}\n${rows.map(r => `       → ${r.detail}`).join('\n')}`)
}
console.log('\n=== EXPLAIN QUERY PLAN (new statements) ===')
explain('figuresByCharacter (route candidates / character cards)', SQL.figuresByCharacter(ROUTE_COLS), [sample.fandom, sample.character_canonical])
for (const q of lineQueryPlan(ROUTE_COLS, sample.fandom, compound)) explain('lineQueryPlan statement', q.sql, q.params)
explain('waveCompanions (wave set)', SQL.waveCompanions('figure_id', false), [sample.fandom, sample.product_line, sample.release_wave ?? ''])
explain('waveCompanions (empty wave)', SQL.waveCompanions('figure_id', true), [sample.fandom, sample.product_line])
explain('prettyUrlUniqueCount (single-record canonical)', SQL.prettyUrlUniqueCount, [sample.fandom, sample.character_canonical, sample.product_line, sample.product_line])
explain('routeRowsForCharacters (list resolution, 3 chars; fandom filtered in JS)', SQL.routeRowsForCharacters(3), [sample.character_canonical, 'x', 'y'])
explain('cardsByFandom (genre hub)', SQL.cardsByFandom, [sample.fandom])
explain('lineWaveCounts (vault)', SQL.lineWaveCounts, [sample.fandom])
explain('linesByFandom', SQL.linesByFandom, [sample.fandom])
explain('stableSuffix (404 path, documented exception)', SQL.stableSuffix, ['abcdef'])
console.log('\n=== EXPLAIN QUERY PLAN (old statements, for contrast) ===')
explain('OLD getFiguresByLine', OLD.line, [sample.fandom, compound, compound])
explain('OLD isPrettyUrlUnique', OLD.unique, [sample.fandom, sample.product_line, sample.product_line, sample.character_canonical])
explain('OLD getFiguresByFandom (route/hub/figure-page scan)', OLD.fandomRows, [sample.fandom])

console.log('\n=== SUMMARY ===')
console.log(JSON.stringify(stats, null, 2))
let totalMismatches = 0
for (const [check, list] of mismatches) {
  totalMismatches += list.length
  console.log(`\n[parity] ${check}: ${list.length} mismatch(es)`)
  for (const m of list.slice(0, 8)) console.log('  ' + m)
}
db.close()
if (totalMismatches) {
  console.log(`\n[parity] FAIL — ${totalMismatches} mismatch(es) across ${mismatches.size} check(s)`)
  process.exit(1)
}
console.log(plansOnly ? '[parity] plans only — no parity checks run' : '[parity] PASS — every check identical, old vs new, whole catalog')
