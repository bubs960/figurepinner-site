// Bid Check — pull live price data (KB -> r2proxy direct) for the 3 lists + 5 figure-value candidates.
// Read-only against r2proxy. Run: node scripts/bidcheck-pull.cjs
// Output: console tables + scripts/bidcheck-data.json
const fs = require('fs')
const path = require('path')
const { FIGURES_V2 } = require('../src/data/figures-reference-v2.slim.js')

const R2 = 'https://figurepinner-r2proxy.bubs960.workers.dev/price-summaries'

function nameOf(f) {
  if (f.v1_name && f.v1_name !== 'other') {
    const v = f.character_variant && f.character_variant !== 'None' ? ` (${f.character_variant})` : ''
    return f.v1_name + v
  }
  const c = (f.character_canonical || '').replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  return c
}
function lineOf(f) { return (f.v1_line && f.v1_line !== 'other') ? f.v1_line : (f.product_line || '').replace(/-/g, ' ') }

// ── target line filters ──────────────────────────────────────────────────────
const LISTS = {
  'star-wars-black-series': (f) => f.fandom === 'star-wars' && f.manufacturer === 'hasbro' && f.product_line === 'black-series',
  'aew-figures':            (f) => f.fandom === 'wrestling' && f.manufacturer === 'jazwares' && f.product_line.startsWith('aew-'),
  'gi-joe-classified':      (f) => f.fandom === 'gi-joe' && f.manufacturer === 'hasbro' && f.product_line === 'classified-series',
}

// ── candidate characters (canonical-ish substrings) ──────────────────────────
const CANDIDATES = {
  'hulk-hogan': (f) => f.fandom === 'wrestling' && f.character_canonical.includes('hogan'),
  'steve-austin': (f) => f.fandom === 'wrestling' && (f.character_canonical.includes('austin')),
  'the-rock': (f) => f.fandom === 'wrestling' && (f.character_canonical === 'the-rock' || f.character_canonical === 'rock' || f.character_canonical.includes('dwayne')),
  'macho-man': (f) => f.fandom === 'wrestling' && (f.character_canonical.includes('savage') || f.character_canonical.includes('macho')),
  'andre-the-giant': (f) => f.fandom === 'wrestling' && f.character_canonical.includes('andre'),
  'undertaker': (f) => f.fandom === 'wrestling' && f.character_canonical.includes('undertaker'),
  'bret-hart': (f) => f.fandom === 'wrestling' && f.character_canonical.includes('bret') && f.character_canonical.includes('hart'),
  'sting': (f) => f.fandom === 'wrestling' && f.character_canonical === 'sting',
  'mandalorian-din-djarin': (f) => f.fandom === 'star-wars' && (f.character_canonical.includes('mandalorian') || f.character_canonical.includes('din-djarin')),
  'grogu': (f) => f.fandom === 'star-wars' && f.character_canonical.includes('grogu'),
  'darth-vader': (f) => f.fandom === 'star-wars' && f.character_canonical.includes('vader'),
  'boba-fett': (f) => f.fandom === 'star-wars' && f.character_canonical.includes('boba'),
  'ahsoka': (f) => f.fandom === 'star-wars' && f.character_canonical.includes('ahsoka'),
  'luke-skywalker': (f) => f.fandom === 'star-wars' && f.character_canonical.includes('luke'),
}

// collect the fid set we need
const need = new Map() // fid -> figure
for (const f of FIGURES_V2) {
  for (const filt of [...Object.values(LISTS), ...Object.values(CANDIDATES)]) {
    if (filt(f)) { need.set(f.figure_id, f); break }
  }
}
console.error(`fids to fetch: ${need.size}`)

async function fetchSnap(fid) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const r = await fetch(`${R2}/${encodeURIComponent(fid)}.json`, { signal: ctrl.signal })
    clearTimeout(t)
    if (!r.ok) return null
    const j = await r.json()
    if (!j || Object.keys(j).length === 0) return null
    return j
  } catch { return null }
}

async function pool(items, n, fn) {
  const out = new Array(items.length)
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx) }
  }))
  return out
}

;(async () => {
  const fids = [...need.keys()]
  let done = 0
  const snaps = await pool(fids, 24, async (fid) => {
    const s = await fetchSnap(fid)
    if (++done % 200 === 0) console.error(`  ${done}/${fids.length}`)
    return s
  })

  const rec = new Map() // fid -> {fid,name,line,fandom,median,sample,raw}
  fids.forEach((fid, k) => {
    const s = snaps[k]
    if (!s) return
    const median = s.median_sold ?? s.avg_sold ?? null
    const sample = s.sold_count ?? 0
    if (median == null || sample <= 0) return
    const f = need.get(fid)
    rec.set(fid, { fid, name: nameOf(f), line: lineOf(f), fandom: f.fandom, year: f.year, median: Math.round(median * 100) / 100, sample, raw: s })
  })
  console.error(`priced fids: ${rec.size}`)

  const result = { lists: {}, candidates: {}, generated_fids: need.size, priced: rec.size }

  function rows(filter) {
    return [...rec.values()].filter((r) => filter(need.get(r.fid))).sort((a, b) => b.median - a.median)
  }

  console.log('\n################ LISTS (ranked by median, sample>=3) ################')
  for (const [slug, filt] of Object.entries(LISTS)) {
    const all = rows(filt)
    const strong = all.filter((r) => r.sample >= 3)
    result.lists[slug] = { total_priced: all.length, top: strong.slice(0, 15) }
    console.log(`\n=== ${slug} === (${all.length} priced, ${strong.length} with sample>=3)`)
    strong.slice(0, 15).forEach((r, i) => console.log(`${String(i + 1).padStart(2)}. $${String(r.median).padEnd(8)} n=${String(r.sample).padEnd(3)} ${r.name} — ${r.line}${r.year ? ' (' + r.year + ')' : ''}`))
  }

  console.log('\n################ FIGURE-VALUE CANDIDATES (price spread) ################')
  for (const [slug, filt] of Object.entries(CANDIDATES)) {
    const all = rows(filt)
    const meds = all.map((r) => r.median)
    const lo = meds.length ? Math.min(...meds) : null
    const hi = meds.length ? Math.max(...meds) : null
    result.candidates[slug] = { priced: all.length, lo, hi, total_sample: all.reduce((s, r) => s + r.sample, 0), figures: all }
    console.log(`\n=== ${slug} === priced=${all.length}  range $${lo}–$${hi}  totalSolds=${all.reduce((s, r) => s + r.sample, 0)}`)
    all.slice(0, 8).forEach((r) => console.log(`   $${String(r.median).padEnd(8)} n=${String(r.sample).padEnd(3)} ${r.name} — ${r.line}${r.year ? ' (' + r.year + ')' : ''}`))
    if (all.length > 8) console.log(`   …and ${all.length - 8} more`)
  }

  const outPath = path.join(__dirname, 'bidcheck-data.json')
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2))
  console.error(`\nwrote ${outPath}`)
})()
