// Child process for tests/kbLiteConcurrency.test.mjs (not a test itself — no .test.mjs suffix).
// Reproduces the hub render's access pattern on a COLD kbLite: N concurrent
//   getFigureById(fid) -> prettyFigureUrl(kb)
// exactly like fandomHubs.ts resolvedUrl() inside Promise.all.
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'

const N = Number(process.argv[2] ?? 40)
const root = process.cwd()
const lite = await import(pathToFileURL(resolve(root, 'src/data/kbLite.ts')).href)

// Real fids straight from the on-disk artifact, WITHOUT touching kbLite (it must stay cold).
const art = JSON.parse(readFileSync(resolve(root, 'public/kb-lite.generated.json'), 'utf8'))
const rows = JSON.parse(art.rows)
const fids = rows.filter(r => r[1] === 'wrestling').slice(0, N).map(r => r[0])
if (fids.length < N) throw new Error(`need ${N} wrestling fids, found ${fids.length}`)

const urls = await Promise.all(fids.map(async fid => {
  const kb = await lite.getFigureById(fid)
  return kb ? lite.prettyFigureUrl(kb) : null
}))
if (urls.some(u => !u)) throw new Error('a fid failed to resolve to a URL')

// One shared catalog: two calls must return the SAME array, not per-caller copies.
const a = await lite.getAllFigures()
const b = await lite.getAllFigures()
if (a !== b) throw new Error('getAllFigures() returned different arrays')

console.log(`OK ${urls.length} urls, heapUsed ${Math.round(process.memoryUsage().heapUsed / 1048576)} MB`)
