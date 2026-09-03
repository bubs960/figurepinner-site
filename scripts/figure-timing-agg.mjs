#!/usr/bin/env node
/**
 * figure-timing-agg.mjs — aggregate the `[figure-timing] {...}` lines that
 * FigureDetailContent logs per render (Release J, 2026-09-03) out of the raw
 * `wrangler tail` JSONL files FP-WorkerTailCapture writes to
 * Bridge/worker-tail/. Answers "where does the cold figure-render second go":
 * per-phase p50 / p95 across every render in the window.
 *
 * Usage: node scripts/figure-timing-agg.mjs <file-or-glob-prefix> [...more]
 *   e.g. node scripts/figure-timing-agg.mjs "C:\...\Bridge\worker-tail\2026-09-03-release-j"
 *   (a prefix matches every <prefix>*.jsonl segment)
 *
 * Read-only. Tail files are pretty-printed JSON objects back to back, so this
 * parses by brace depth like worker-tail-agg.mjs does.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import path from 'node:path'

const PHASES = ['price', 'history', 'sellers', 'wave', 'character', 'golden', 'reads', 'urls', 'total']

function* events(text) {
  let depth = 0, start = -1, inStr = false, esc = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue }
    if (c === '"') { inStr = true; continue }
    if (c === '{') { if (depth === 0) start = i; depth++ }
    else if (c === '}') { depth--; if (depth === 0 && start >= 0) { try { yield JSON.parse(text.slice(start, i + 1)) } catch { /* skip */ } start = -1 } }
  }
}

function expand(arg) {
  if (existsSync(arg) && statSync(arg).isFile()) return [arg]
  const dir = path.dirname(arg), base = path.basename(arg)
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter(f => f.startsWith(base) && f.endsWith('.jsonl')).map(f => path.join(dir, f))
}

function pct(sorted, p) { return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : null }

const files = process.argv.slice(2).flatMap(expand)
if (!files.length) { console.log('usage: node scripts/figure-timing-agg.mjs <tail.jsonl | prefix> ...'); process.exit(0) }

const samples = { }
for (const ph of PHASES) samples[ph] = []
let renders = 0
for (const f of files) {
  for (const ev of events(readFileSync(f, 'utf8'))) {
    for (const log of ev.logs ?? []) {
      const msg = Array.isArray(log.message) ? log.message : [log.message]
      const idx = msg.findIndex(m => m === '[figure-timing]')
      if (idx === -1) continue
      let payload = msg[idx + 1]
      if (typeof payload === 'string') { try { payload = JSON.parse(payload) } catch { continue } }
      if (!payload || typeof payload !== 'object') continue
      renders++
      for (const ph of PHASES) if (typeof payload[ph] === 'number') samples[ph].push(payload[ph])
    }
  }
}

console.log(`[figure-timing-agg] ${files.length} file(s), ${renders} render(s)`)
if (!renders) process.exit(0)
console.log('phase       n     p50     p95     max')
for (const ph of PHASES) {
  const s = samples[ph].slice().sort((a, b) => a - b)
  console.log(`${ph.padEnd(10)} ${String(s.length).padStart(4)} ${String(pct(s, 0.5)).padStart(7)} ${String(pct(s, 0.95)).padStart(7)} ${String(s[s.length - 1]).padStart(7)}`)
}
