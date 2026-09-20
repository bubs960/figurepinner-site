// Child process for tests/kbLiteConcurrency.test.mjs (not a test itself — no .test.mjs suffix).
// Each mode reproduces one real request-time access pattern on a COLD kbLite, in its own
// process so nothing is warm:
//   urls     N concurrent getFigureById -> prettyFigureUrl   (fandomHubs.ts resolvedUrl, themed hubs)
//   fandoms  getAllFandoms().map(getFiguresByFandom)          (src/app/sitemap-index.xml/route.ts, /sitemap.xml)
//   suffix   N concurrent getFigureByStableSuffix
//   search   N concurrent searchKb(q)                         (/api/v1/search, kbSearch.ts index + vocab)
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'

const mode = process.argv[2] ?? 'urls'
const N = Number(process.argv[3] ?? 40)
const root = process.cwd()
const href = p => pathToFileURL(resolve(root, p)).href
const lite = await import(href('src/data/kbLite.ts'))

// Real fids straight from the on-disk artifact, WITHOUT touching kbLite (it must stay cold).
const rows = JSON.parse(JSON.parse(readFileSync(resolve(root, 'public/kb-lite.generated.json'), 'utf8')).rows)
const fidsOf = (fandom, n) => {
  const out = rows.filter(r => !fandom || r[1] === fandom).slice(0, n).map(r => r[0])
  if (out.length < n) throw new Error(`need ${n} fids, found ${out.length}`)
  return out
}

let summary
if (mode === 'urls') {
  const urls = await Promise.all(fidsOf('wrestling', N).map(async fid => {
    const kb = await lite.getFigureById(fid)
    return kb ? lite.prettyFigureUrl(kb) : null
  }))
  if (urls.some(u => !u)) throw new Error('a fid failed to resolve to a URL')
  // One shared catalog: two calls must return the SAME array, not per-caller copies.
  if ((await lite.getAllFigures()) !== (await lite.getAllFigures())) throw new Error('getAllFigures() returned different arrays')
  summary = `${urls.length} urls`
} else if (mode === 'fandoms') {
  const fandoms = lite.getAllFandoms()
  const sizes = await Promise.all(fandoms.map(async f => (await lite.getFiguresByFandom(f)).length))
  if (sizes.reduce((a, b) => a + b, 0) < 20000) throw new Error('fandom buckets look empty')
  summary = `${fandoms.length} fandoms`
} else if (mode === 'suffix') {
  const hits = await Promise.all(fidsOf(null, N).map(fid => lite.getFigureByStableSuffix(fid)))
  if (hits.filter(Boolean).length < N * 0.9) throw new Error('stable-suffix lookups mostly missed')
  summary = `${N} suffix lookups`
} else if (mode === 'search') {
  const { searchKb } = await import(href('src/app/api/v1/_lib/kbSearch.ts'))
  const results = await Promise.all(Array.from({ length: N }, () => searchKb('hulk hogan')))
  if (!results.every(r => r && r.scored.length > 0)) throw new Error('search returned no results')
  summary = `${N} searches`
} else {
  throw new Error(`unknown mode ${mode}`)
}
console.log(`OK ${summary}, heapUsed ${Math.round(process.memoryUsage().heapUsed / 1048576)} MB`)
