/**
 * build-fandom-top-comps.mjs — nightly precompute for the FandomHub "intel" table.
 * Ranks each fandom's figures by sold price (median_sold ?? avg_sold) from the
 * r2proxy price-summaries snapshots → small top-N JSON the hub reads at build time.
 * Avoids 1000+ live R2 fetches per page view. Graceful-degrades (hub hides the table
 * if the file is absent). Honest data: sold_count>0 only, never a derived price.
 *
 * Usage:  node scripts/build-fandom-top-comps.mjs [fandom]
 *         TOP_N=12 node scripts/build-fandom-top-comps.mjs masters-of-the-universe
 * Output: src/data/fandom-top-comps/<fandom>.json
 * Run where the slim KB is intact (real disk / git HEAD), not a truncated mount copy.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'
const TOP_N = Number(process.env.TOP_N || 8)
const CONCURRENCY = Number(process.env.CONCURRENCY || 16)
const OUT_DIR = join(ROOT, 'src', 'data', 'fandom-top-comps')

function loadFigures() {
  const slim = join(ROOT, 'src', 'data', 'figures-reference-v2.slim.js')
  const raw = readFileSync(slim, 'utf8')
  const sandbox = { module: { exports: {} }, exports: {} }
  sandbox.exports = sandbox.module.exports
  vm.createContext(sandbox)
  vm.runInContext(raw, sandbox, { timeout: 30000 })
  const figs = sandbox.module.exports.FIGURES_V2 ?? sandbox.module.exports
  if (!Array.isArray(figs)) throw new Error('Could not load FIGURES_V2 from slim KB')
  return figs
}

function prettify(s) {
  return String(s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
function deriveDisplayName(f) { return f.v1_name || prettify(f.character_canonical) }

function rarityFlag(f) {
  const line = (f.product_line || '').toLowerCase()
  const excl = (f.exclusive_to || '').toLowerCase()
  if (line === 'original' || /vintage/.test(line)) return 'VINTAGE'
  if (line === 'classics') return 'MOTUC'
  if (excl && excl !== 'none' && excl !== '') return 'EXCLUSIVE'
  return ''
}

async function fetchSnapshot(figure_id) {
  try {
    const res = await fetch(
      `${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(figure_id)}.json`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx) }
  })
  await Promise.all(workers)
  return out
}

async function buildFandom(fandom, allFigures) {
  const figs = allFigures.filter(f => f.fandom === fandom)
  if (!figs.length) { console.log(`  ${fandom}: 0 figures — skipped`); return }
  process.stdout.write(`  ${fandom}: ${figs.length} figures, fetching comps`)
  const snaps = await mapLimit(figs, CONCURRENCY, async (f) => {
    const s = await fetchSnapshot(f.figure_id)
    if (!s) return null
    const price = (s.median_sold ?? s.avg_sold)
    const soldCount = s.sold_count ?? 0
    if (price == null || soldCount <= 0) return null
    return {
      figure_id: f.figure_id,
      name: deriveDisplayName(f),
      line: f.v1_line || prettify(f.product_line),
      price: Math.round(price),
      sold_count: soldCount,
      last_sold: s.last_sold_date ?? s.last_sold ?? null,
      flag: rarityFlag(f),
      image: f.canonical_image_url || null,
      url: `/figure/${f.figure_id}`,
    }
  })
  const ranked = snaps.filter(Boolean).sort((a, b) => b.price - a.price).slice(0, TOP_N)
  process.stdout.write(` -> ${ranked.length} with comps\n`)
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  const payload = {
    fandom,
    generated_at: new Date().toISOString(),
    source: 'r2proxy price-summaries (median_sold ?? avg_sold), sold_count>0 only',
    figures: ranked,
  }
  writeFileSync(join(OUT_DIR, `${fandom}.json`), JSON.stringify(payload, null, 2))
}

async function main() {
  const target = process.argv[2]
  const all = loadFigures()
  const fandoms = target ? [target] : [...new Set(all.map(f => f.fandom))]
  console.log(`Building top-${TOP_N} comps for ${fandoms.length} fandom(s)...`)
  for (const fandom of fandoms) await buildFandom(fandom, all)
  console.log('Done.')
}

main().catch((e) => { console.error(e); process.exit(1) })
