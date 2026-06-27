// Bid Check — explore KB to find exact fandom + product_line slugs for the 3 lists.
// Read-only. Run: node scripts/bidcheck-explore.cjs
const { FIGURES_V2 } = require('../src/data/figures-reference-v2.slim.js')

const fc = {}
for (const f of FIGURES_V2) fc[f.fandom] = (fc[f.fandom] || 0) + 1
console.log('=== FANDOMS (slug: count) ===')
for (const [k, v] of Object.entries(fc).sort((a, b) => b[1] - a[1])) console.log(`${k}: ${v}`)

function lineCounts(filter) {
  const m = {}
  for (const f of FIGURES_V2) {
    if (!filter(f)) continue
    const k = `${f.manufacturer} | ${f.product_line}`
    m[k] = (m[k] || 0) + 1
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

const swSlug = fc['star-wars'] ? 'star-wars' : (fc['starwars'] ? 'starwars' : null)
console.log(`\n=== STAR WARS lines (fandom=${swSlug}) — looking for Black Series ===`)
if (swSlug) for (const [k, v] of lineCounts(f => f.fandom === swSlug)) console.log(`${k}: ${v}`)

console.log('\n=== WRESTLING lines matching AEW ===')
for (const [k, v] of lineCounts(f => f.fandom === 'wrestling' && (`${f.manufacturer} ${f.product_line} ${f.sub_fandom}`.toLowerCase().includes('aew') || (f.sub_fandom || '').toLowerCase() === 'aew'))) console.log(`${k}: ${v}`)

const joeSlug = fc['gi-joe'] ? 'gi-joe' : (fc['gijoe'] ? 'gijoe' : null)
console.log(`\n=== GI JOE lines (fandom=${joeSlug}) — looking for Classified ===`)
if (joeSlug) for (const [k, v] of lineCounts(f => f.fandom === joeSlug)) console.log(`${k}: ${v}`)
