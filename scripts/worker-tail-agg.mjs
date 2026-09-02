#!/usr/bin/env node
/**
 * worker-tail-agg.mjs — per-version, per-route aggregation of `wrangler tail`
 * JSON output. Answers "how many exceededMemory / D1 errors / 5xx did each
 * Worker VERSION produce in this window, and what did each route class cost".
 *
 * This is the instrument behind the OOM stage 1/2 canaries (2026-09-01/02) and
 * standalone's scale-budget ask 3 ("per-version memory metric"): a tail event
 * carries `outcome` (ok | exception | exceededMemory | exceededCpu | canceled),
 * `scriptVersion.id`, `wallTime`, `cpuTime`, `exceptions[]`, the request URL
 * and `cf-connecting-ip` — everything the dashboard shows and more, and it is
 * attributable per version during a split deploy.
 *
 * Capture (window-bounded; the tail websocket drops every few minutes, so run
 * it in bounded windows and restart):
 *   npx wrangler tail figurepinner-site --format json > tail-1.jsonl
 * `--format json` pretty-prints each event across lines; this parser walks
 * brace depth, so concatenated pretty JSON is fine.
 *
 * Aggregate one or more capture files (overlapping windows are deduped by
 * timestamp + cf-ray + url):
 *   node scripts/worker-tail-agg.mjs tail-1.jsonl [tail-2.jsonl ...] [--since 2026-09-02T16:33:00Z] [--ip 108.31.74.47]
 *
 * Output: JSON — totals, per-version {invocations, outcomes, 5xx, d1Errors,
 * wall/cpu p50/p95, top routes with their own timing/error counts, sample
 * exceededMemory URLs and exception messages}, and (with --ip) how many events
 * came from that IP — the check that attributed two of the three 2026-09-02
 * incidents to this very machine (read cf-ray's colo suffix and the IP before
 * calling anything a site defect).
 */
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const argValue = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null }
const files = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')))
const since = argValue('--since') ? Date.parse(argValue('--since')) : null
const ourIp = argValue('--ip')
if (!files.length) {
  console.error('usage: node scripts/worker-tail-agg.mjs <tail.jsonl...> [--since ISO] [--ip a.b.c.d]')
  process.exit(2)
}

const BS = String.fromCharCode(92)
function* objects(text) {
  let depth = 0, inStr = false, esc = false, start = -1
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inStr) { if (esc) esc = false; else if (c === BS) esc = true; else if (c === '"') inStr = false; continue }
    if (c === '"') { inStr = true; continue }
    if (c === '{') { if (depth === 0) start = i; depth++ }
    else if (c === '}') { depth--; if (depth === 0 && start >= 0) { yield text.slice(start, i + 1); start = -1 } }
  }
}
const pct = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))] }
function routeOf(url) {
  try {
    const p = new URL(url).pathname
    const segs = p.split('/').filter(Boolean)
    if (p.startsWith('/api/')) return '/' + segs.slice(0, 3).join('/')
    if (p.startsWith('/figure/')) return '/figure/[id]'
    if (p.startsWith('/sitemap')) return '/sitemap*'
    if (p.startsWith('/guides')) return '/guides*'
    if (p.startsWith('/today')) return '/today*'
    if (p.startsWith('/open/')) return '/open/[id]'
    if (segs.length === 3 && segs[1] === 'character') return '/[g]/character/[c]'
    if (segs.length >= 3) return '/[g]/[l]/[s]'
    if (segs.length === 2) return '/[g]/[l]'
    if (segs.length === 1) return '/[g]'
    return p
  } catch { return '?' }
}

const seen = new Set()
const events = []
let unparsed = 0
for (const f of files) {
  for (const chunk of objects(readFileSync(f, 'utf8'))) {
    let ev
    try { ev = JSON.parse(chunk) } catch { unparsed++; continue }
    if (!ev || typeof ev !== 'object' || !('outcome' in ev)) { unparsed++; continue }
    const key = `${ev.eventTimestamp}|${ev.event?.request?.headers?.['cf-ray'] || ''}|${ev.event?.request?.url || ''}`
    if (seen.has(key)) continue
    seen.add(key)
    if (since !== null && (ev.eventTimestamp || 0) < since) continue
    events.push(ev)
  }
}
events.sort((a, b) => (a.eventTimestamp || 0) - (b.eventTimestamp || 0))

const byVer = new Map()
let fromOurIp = 0
for (const ev of events) {
  const v = ev.scriptVersion?.id ?? 'unknown'
  const o = ev.outcome ?? 'unknown'
  const url = ev.event?.request?.url ?? ev.event?.cron ?? '?'
  const status = ev.event?.response?.status ?? null
  const isD1 = (ev.exceptions || []).some(x => /D1_ERROR/.test(String(x.message))) ||
    (ev.logs || []).some(l => /D1_ERROR/.test(String(l.message)))
  if (ourIp && String(ev.event?.request?.headers?.['cf-connecting-ip']) === ourIp) fromOurIp++
  const rec = byVer.get(v) ?? { invocations: 0, outcomes: {}, s5xx: 0, d1Errors: 0, firstTs: null, lastTs: null, wall: [], cpu: [], routes: {}, exceededMemoryUrls: [], exceptionSamples: [] }
  rec.invocations++
  rec.outcomes[o] = (rec.outcomes[o] ?? 0) + 1
  if (status !== null && status >= 500) rec.s5xx++
  if (isD1) rec.d1Errors++
  const ts = ev.eventTimestamp
  if (ts) { rec.firstTs = rec.firstTs === null ? ts : Math.min(rec.firstTs, ts); rec.lastTs = rec.lastTs === null ? ts : Math.max(rec.lastTs, ts) }
  if (typeof ev.wallTime === 'number') rec.wall.push(ev.wallTime)
  if (typeof ev.cpuTime === 'number') rec.cpu.push(ev.cpuTime)
  const route = routeOf(url)
  const r = rec.routes[route] ?? { n: 0, errors: 0, s5xx: 0, wall: [], cpu: [] }
  r.n++
  if (o !== 'ok' && o !== 'canceled') r.errors++
  if (status !== null && status >= 500) r.s5xx++
  if (typeof ev.wallTime === 'number') r.wall.push(ev.wallTime)
  if (typeof ev.cpuTime === 'number') r.cpu.push(ev.cpuTime)
  rec.routes[route] = r
  if (o === 'exceededMemory' && rec.exceededMemoryUrls.length < 20) rec.exceededMemoryUrls.push(url)
  if ((o === 'exception' || isD1) && rec.exceptionSamples.length < 8) {
    rec.exceptionSamples.push({ at: ts ? new Date(ts).toISOString() : null, url, msg: String((ev.exceptions?.[0] ?? ev.logs?.find(l => /D1_ERROR/.test(String(l.message))))?.message ?? '').slice(0, 160) })
  }
  byVer.set(v, rec)
}

const iso = (t) => (t === null ? null : new Date(t).toISOString())
const out = { files, events: events.length, unparsed, since: since === null ? null : new Date(since).toISOString(), fromOurIp: ourIp ? fromOurIp : undefined, byVersion: {} }
for (const [v, r] of byVer) {
  const routes = {}
  for (const [route, x] of Object.entries(r.routes).sort((a, b) => b[1].n - a[1].n).slice(0, 12)) {
    routes[route] = { n: x.n, errors: x.errors, s5xx: x.s5xx, wallP50: pct(x.wall, .5), wallP95: pct(x.wall, .95), cpuP50: pct(x.cpu, .5), cpuP95: pct(x.cpu, .95) }
  }
  out.byVersion[v] = {
    invocations: r.invocations, outcomes: r.outcomes, s5xx: r.s5xx, d1Errors: r.d1Errors,
    firstTs: iso(r.firstTs), lastTs: iso(r.lastTs),
    wallP50: pct(r.wall, .5), wallP95: pct(r.wall, .95), cpuP50: pct(r.cpu, .5), cpuP95: pct(r.cpu, .95),
    routes, exceededMemoryUrls: r.exceededMemoryUrls, exceptionSamples: r.exceptionSamples,
  }
}
console.log(JSON.stringify(out, null, 2))
