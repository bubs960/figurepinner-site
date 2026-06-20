/**
 * build-fandom-vaults.mjs — per-LINE comp rollup for the Power Sword vault hub.
 *
 * For each line in a fandom, emits: figure count + that line's top figures (by sold
 * price, real comps only). The hub renders one "sealed vault" per line; drawing the
 * Power Sword reveals the line's lore + these figures (each links to /figure/).
 *
 * Reuses the same r2proxy price-summaries source + honest-data rule (sold_count>0).
 * Run where the slim KB is intact (real disk / git), not a truncated mount copy.
 *
 * Usage: node scripts/build-fandom-vaults.mjs masters-of-the-universe
 * Output: src/data/fandom-vaults/<fandom>.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const R2 = 'https://figurepinner-r2proxy.bubs960.workers.dev'
const PER_LINE = Number(process.env.PER_LINE || 6)
const CONCURRENCY = Number(process.env.CONCURRENCY || 16)
const OUT_DIR = join(ROOT, 'src', 'data', 'fandom-vaults')

function loadFigures() {
  const raw = readFileSync(join(ROOT, 'src', 'data', 'figures-reference-v2.slim.js'), 'utf8')
  const sb = { module: { exports: {} }, exports: {} }; sb.exports = sb.module.exports
  vm.createContext(sb); vm.runInContext(raw, sb, { timeout: 30000 })
  const f = sb.module.exports.FIGURES_V2 ?? sb.module.exports
  if (!Array.isArray(f)) throw new Error('KB load failed')
  return f
}
const prettify = s => String(s||'').split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ')
const name = f => f.v1_name || prettify(f.character_canonical)
function rarityFlag(f){const l=(f.product_line||'').toLowerCase(),e=(f.exclusive_to||'').toLowerCase();if(l==='original'||/vintage/.test(l))return 'VINTAGE';if(l==='classics')return 'MOTUC';if(e&&e!=='none'&&e!=='')return 'EXCLUSIVE';return ''}
// Normalize line label (collapse case-variant strays)
const lineKey = f => { const l = (f.v1_line || prettify(f.product_line)).trim(); return l.charAt(0).toUpperCase()+l.slice(1) }

async function snap(id){try{const r=await fetch(`${R2}/price-summaries/${encodeURIComponent(id)}.json`,{signal:AbortSignal.timeout(8000)});return r.ok?await r.json():null}catch{return null}}
async function mapLimit(items,limit,fn){const out=new Array(items.length);let i=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(i<items.length){const x=i++;out[x]=await fn(items[x])}}));return out}

async function main(){
  const fandom = process.argv[2]
  if(!fandom){console.error('usage: node scripts/build-fandom-vaults.mjs <fandom>');process.exit(1)}
  const all = loadFigures()
  const figs = all.filter(f=>f.fandom===fandom)
  console.log(`${fandom}: ${figs.length} figures`)
  // group by line
  const groups = {}
  for(const f of figs){ const k=lineKey(f); (groups[k] ||= []).push(f) }
  // fetch comps for all, attach price
  const priced = await mapLimit(figs, CONCURRENCY, async f=>{
    const s=await snap(f.figure_id); if(!s)return null
    const p=(s.median_sold??s.avg_sold); const c=s.sold_count??0
    if(p==null||c<=0)return null
    return { figure_id:f.figure_id, name:name(f), line:lineKey(f), price:Math.round(p), sold_count:c, flag:rarityFlag(f), image:f.canonical_image_url||null, url:`/figure/${f.figure_id}` }
  })
  const byId = new Map(priced.filter(Boolean).map(x=>[x.figure_id,x]))
  const vaults = Object.entries(groups)
    .map(([line,arr])=>{
      const withComps = arr.map(f=>byId.get(f.figure_id)).filter(Boolean).sort((a,b)=>b.price-a.price)
      return { line, count: arr.length, priced_count: withComps.length, top: withComps.slice(0,PER_LINE) }
    })
    .sort((a,b)=>b.count-a.count)
  if(!existsSync(OUT_DIR)) mkdirSync(OUT_DIR,{recursive:true})
  const payload = { fandom, generated_at:new Date().toISOString(), source:'r2proxy price-summaries, sold_count>0', vaults }
  writeFileSync(join(OUT_DIR,`${fandom}.json`), JSON.stringify(payload,null,2))
  console.log(`wrote ${vaults.length} line-vaults:`, vaults.map(v=>`${v.line}(${v.count}/${v.top.length} priced)`).join(', '))
}
main().catch(e=>{console.error(e);process.exit(1)})
