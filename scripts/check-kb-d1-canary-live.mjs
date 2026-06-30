#!/usr/bin/env node
/**
 * Post-deploy live smoke for the D1-backed /api/v1/figure canary.
 *
 * This intentionally requires x-fp-kb-source: d1 so an old bundled production
 * route cannot pass just because its JSON still matches the local KB.
 */

import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { FIGURES_V2 } = require(resolve(ROOT, 'src/data/figures-reference-v2.slim.js'))

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const BROWSER_ACCEPT = 'application/json,text/html,application/xhtml+xml'

const args = process.argv.slice(2)
const base = (args[args.indexOf('--base') + 1] && args.includes('--base')
  ? args[args.indexOf('--base') + 1]
  : 'https://figurepinner.com').replace(/\/$/, '')

const explicitIds = args.includes('--id')
  ? args.flatMap((arg, index) => (arg === '--id' ? [args[index + 1]] : [])).filter(Boolean)
  : []

const sampleIds = explicitIds.length
  ? explicitIds
  : [
      'fp_wrestling_mattel_ultimate-edition_30_seth-rollins_6dfa66',
      FIGURES_V2.find(f => String(f.canonical_image_url ?? '').includes('figurepinner-images'))?.figure_id,
      FIGURES_V2.find(f => f.match_represented || f.key_features)?.figure_id,
      FIGURES_V2[FIGURES_V2.length - 1]?.figure_id,
    ].filter(Boolean)

const expectedById = new Map(FIGURES_V2.map(f => [f.figure_id, f]))
let failed = false

function titleCase(s) {
  return String(s).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function checkEqual(id, field, actual, expected) {
  const a = actual == null ? null : String(actual)
  const e = expected == null ? null : String(expected)
  if (a !== e) {
    console.error(`[kb:d1:canary-live] ERROR ${id} ${field}: expected ${e}, got ${a}`)
    failed = true
  }
}

function parseCurlResponse(raw) {
  const normalized = raw.replace(/\r\n/g, '\n')
  const parts = normalized.split('\n\n')
  const body = parts.pop() ?? ''
  const headerBlock = [...parts].reverse().find(part => part.startsWith('HTTP/')) ?? ''
  const status = Number(/^HTTP\/\S+\s+(\d+)/m.exec(headerBlock)?.[1] ?? 0)
  const headers = new Map()

  for (const line of headerBlock.split('\n').slice(1)) {
    const index = line.indexOf(':')
    if (index === -1) continue
    headers.set(line.slice(0, index).toLowerCase(), line.slice(index + 1).trim())
  }

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: name => headers.get(String(name).toLowerCase()) ?? null },
    json: async () => JSON.parse(body),
  }
}

async function requestJson(url) {
  if (process.platform === 'win32') {
    const raw = execFileSync('curl.exe', [
      '-sS',
      '-D',
      '-',
      '-H',
      `User-Agent: ${BROWSER_UA}`,
      '-H',
      `Accept: ${BROWSER_ACCEPT}`,
      url,
    ], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 5,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    return parseCurlResponse(raw)
  }

  return fetch(url, {
    headers: {
      'user-agent': BROWSER_UA,
      accept: BROWSER_ACCEPT,
    },
  })
}

for (const id of [...new Set(sampleIds)]) {
  const expected = expectedById.get(id)
  if (!expected) {
    console.error(`[kb:d1:canary-live] ERROR unknown local sample id: ${id}`)
    failed = true
    continue
  }

  const url = `${base}/api/v1/figure/${encodeURIComponent(id)}`
  const res = await requestJson(url)

  if (res.headers.get('x-fp-kb-source') !== 'd1') {
    console.error(`[kb:d1:canary-live] ERROR ${id}: missing x-fp-kb-source: d1`)
    failed = true
  }
  if (!res.ok) {
    console.error(`[kb:d1:canary-live] ERROR ${id}: HTTP ${res.status}`)
    failed = true
    continue
  }

  const actual = await res.json()
  checkEqual(id, 'figure_id', actual.figure_id, expected.figure_id)
  checkEqual(id, 'brand', actual.brand, titleCase(expected.manufacturer))
  checkEqual(id, 'line', actual.line, titleCase(expected.product_line))
  checkEqual(id, 'series', actual.series, expected.release_wave)
  checkEqual(id, 'genre', actual.genre, expected.fandom)
  checkEqual(id, 'canonical_image_url', actual.canonical_image_url, expected.canonical_image_url ?? null)
  checkEqual(id, 'exclusive_to', actual.exclusive_to, expected.exclusive_to ?? null)
  checkEqual(id, 'pack_size', actual.pack_size, expected.pack_size)
  checkEqual(id, 'scale', actual.scale, expected.scale ?? null)
  if (typeof actual.name !== 'string' || actual.name.length === 0) {
    console.error(`[kb:d1:canary-live] ERROR ${id}: missing display name`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log(`[kb:d1:canary-live] passed ${new Set(sampleIds).size} live D1 canary samples at ${base}`)