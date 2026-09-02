#!/usr/bin/env node
/**
 * speed-probe.mjs — zero-cost server-side speed probe for figurepinner.com.
 *
 * Steve, 2026-09-02: "keep measuring speed too, site has been very slow as part
 * of this issue and fix." R13: a cadence is a registered scheduled task with a
 * log file, never a chat habit — this is the instrument; registration (schtasks
 * + the-bridge.ps1 table entry) is standalone's/Steve's.
 *
 * What it measures, per URL in the fixed set below:
 *   cold  — cache-busted (?sp=<ts>) so the edge cache is bypassed and the request
 *           reaches the Worker: TTFB = origin render time (KV ISR hit or full
 *           render). This is what a first visitor at a colo pays.
 *   warm  — the bare URL fetched twice; the second read's TTFB + x-fp-edge
 *           (HIT/MISS) + cf-ray colo = what a repeat visitor pays.
 * It uses curl.exe with a real Chrome UA (CLAUDE.md truth #3 — PowerShell/Node
 * fetch 403 under Bot Fight Mode). Paced (1 req/s) — far under the 100 req/min
 * figure-page limit (truth #7).
 *
 * Output: one JSON line per run appended to outputs/speed-probe/speed-probe.jsonl
 * (created if missing) plus a one-line summary on stdout:
 *   speed-probe <ts> cold p50=<ms> p95=<ms> warm p50=<ms> hit=<n>/<m> worst=<url>:<ms>
 * A task must assert WHAT it measured (R13): the summary carries the numbers,
 * the JSONL carries every URL. Exit 0 always — a slow site is a finding, not a
 * task failure; exit 2 only if curl itself is missing.
 *
 * Usage: node scripts/speed-probe.mjs [--out <dir>] [--quiet]
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, appendFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE = 'https://figurepinner.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(ROOT, 'outputs', 'speed-probe')
const quiet = args.includes('--quiet')

// Fixed, representative set — one of each page class. Keep it small (paced
// 1/s, ~30 s per run) and stable so day-over-day numbers compare.
const URLS = [
  { cls: 'home',       u: '/' },
  { cls: 'genre-hub',  u: '/wrestling' },
  { cls: 'line-hub',   u: '/marvel/marvel-legends' },
  { cls: 'line-hub-p2',u: '/marvel/marvel-legends/page/2' },
  { cls: 'char-hub',   u: '/dc/character/batman' },
  { cls: 'figure-raw', u: '/figure/fp_wrestling_mattel_elite_124_cm-punk_c31fc2c73828' },
  { cls: 'figure-raw', u: '/figure/fp_wrestling_jakks-pacific_deluxe-aggression_1_batista_007d1b' },
  { cls: 'guide',      u: '/guides/marvel-legends-baf-guide' },
  { cls: 'search',     u: '/search' },
  { cls: 'healthz',    u: '/api/healthz' },
]

function curl(url) {
  // time_appconnect = DNS+TCP+TLS done; starttransfer - appconnect = the server's
  // share (Worker + KV/D1/render), which is the number that compares run to run.
  const fmt = '\n__M %{http_code} %{time_starttransfer} %{time_total} %{size_download} %{time_appconnect}'
  let out
  try {
    out = execFileSync('curl.exe', ['-s', '-m', '90', '-A', UA, '-D', '-', '-o', 'NUL', '-w', fmt, url], { encoding: 'utf8' })
  } catch (e) {
    if (e.code === 'ENOENT') { console.error('curl.exe not found'); process.exit(2) }
    out = String(e.stdout || '')
  }
  const m = /__M (\d+) ([\d.]+) ([\d.]+) (\d+) ([\d.]+)/.exec(out)
  const hdr = (name) => (new RegExp('^' + name + ':\s*(.*)$', 'im').exec(out) || [])[1]?.trim() ?? null
  return {
    status: m ? Number(m[1]) : 0,
    ttfbMs: m ? Math.round((Number(m[2]) - Number(m[5])) * 1000) : null, // server share, connection setup excluded
    connectMs: m ? Math.round(Number(m[5]) * 1000) : null,
    totalMs: m ? Math.round(Number(m[3]) * 1000) : null,
    bytes: m ? Number(m[4]) : null,
    edge: hdr('x-fp-edge'),
    colo: (hdr('cf-ray') || '').split('-').pop() || null,
    cc: hdr('cache-control'),
  }
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const pct = (arr, p) => { const s = [...arr].filter(x => x != null).sort((a, b) => a - b); if (!s.length) return null; return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))] }

const ts = new Date().toISOString()
const bust = Date.now()
const rows = []
for (const { cls, u } of URLS) {
  const cold = curl(`${SITE}${u}${u.includes('?') ? '&' : '?'}sp=${bust}`)
  await sleep(1000)
  curl(`${SITE}${u}`)                       // prime
  await sleep(1000)
  const warm = curl(`${SITE}${u}`)           // measure
  await sleep(1000)
  rows.push({ cls, url: u, cold, warm })
}
const coldT = rows.filter(r => r.cls !== 'healthz').map(r => r.cold.ttfbMs)
const warmT = rows.filter(r => r.cls !== 'healthz').map(r => r.warm.ttfbMs)
const hits = rows.filter(r => r.warm.edge === 'HIT').length
const worst = rows.filter(r => r.cls !== 'healthz').sort((a, b) => (b.cold.ttfbMs || 0) - (a.cold.ttfbMs || 0))[0]
const errors = rows.filter(r => r.cold.status >= 500 || r.warm.status >= 500).map(r => r.url)
const record = { ts, coldP50: pct(coldT, 50), coldP95: pct(coldT, 95), warmP50: pct(warmT, 50), warmP95: pct(warmT, 95), edgeHits: hits, of: rows.length, errors, rows }
mkdirSync(outDir, { recursive: true })
appendFileSync(path.join(outDir, 'speed-probe.jsonl'), JSON.stringify(record) + '\n')
const summary = `speed-probe ${ts} cold p50=${record.coldP50}ms p95=${record.coldP95}ms warm p50=${record.warmP50}ms p95=${record.warmP95}ms edge-hit=${hits}/${rows.length} worst=${worst?.url}:${worst?.cold.ttfbMs}ms errors=${errors.length}`
if (!quiet) {
  for (const r of rows) console.log(`${r.cls.padEnd(12)} ${r.url.padEnd(70)} cold ${String(r.cold.status).padEnd(3)} ${String(r.cold.ttfbMs).padStart(5)}ms ${r.cold.colo}  warm ${String(r.warm.ttfbMs).padStart(5)}ms ${r.warm.edge} ${r.warm.colo}`)
}
console.log(summary)
