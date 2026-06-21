/**
 * build-fandom-heroes-villains.mjs — the curated Heroes-vs-Villains band data
 * for the MOTU hub (Gate 3). MOTU's good/evil seam pays off as real content: top
 * He-Man-side grails facing top Skeletor-side grails across the seam.
 *
 * The KB does not tag allegiance, so allegiance is a CURATED list here (Steve's
 * call). For each side we match KB figures by character_canonical, fetch real
 * comps (r2proxy price-summaries, sold_count>0), keep only those with a real R2
 * photo, dedupe to the top-priced figure per character, and take the top N.
 *
 * Usage: node scripts/build-fandom-heroes-villains.mjs
 * Output: src/data/fandom-heroes-villains/masters-of-the-universe.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const R2 = 'https://figurepinner-r2proxy.bubs960.workers.dev'
const FANDOM = process.argv[2] || 'masters-of-the-universe'
const PER_SIDE = Number(process.env.PER_SIDE || 6)
const CONCURRENCY = Number(process.env.CONCURRENCY || 16)
const OUT_DIR = join(ROOT, 'src', 'data', 'fandom-heroes-villains')
const LINE_MATCH = process.env.LINE_MATCH ? new RegExp(process.env.LINE_MATCH) : null
const OUT_OVERRIDE = process.env.OUT || null
const MFR = process.env.MFR || null                                   // manufacturer scope (e.g. jakks-pacific, mattel)
const LINE_EXCLUDE = process.env.LINE_EXCLUDE ? new RegExp(process.env.LINE_EXCLUDE) : null  // drop product_lines (e.g. ^tna)

// Curated good/evil allegiance per fandom (character_canonical slugs). The H-v-V
// band leads with these across the seam. Templatized: add a fandom entry to grow.
const ALLEGIANCE = {
  'masters-of-the-universe': {
    // Heroic Warriors vs Skeletor's Evil Warriors + the Evil Horde (Faker = evil clone).
    heroes: new Set([
      'he-man', 'teela', 'man-at-arms', 'stratos', 'man-e-faces', 'ram-man', 'mekaneck',
      'buzz-off', 'sy-klone', 'fisto', 'orko', 'battle-cat', 'she-ra', 'bow', 'sorceress',
      'roboto', 'snout-spout', 'moss-man', 'clamp-champ', 'extendar', 'rio-blast',
      'king-randor', 'rotar', 'sweet-bee', 'king-grayskull', 'zodac', 'mechanek',
    ]),
    villains: new Set([
      'skeletor', 'beast-man', 'evil-lyn', 'trap-jaw', 'mer-man', 'tri-klops', 'clawful',
      'webstor', 'two-bad', 'whiplash', 'spikor', 'stinkor', 'jitsu', 'kobra-khan',
      'ssqueeze', 'mosquitor', 'scare-glow', 'hordak', 'grizzlor', 'mantenna', 'leech',
      'modulok', 'multi-bot', 'dragstor', 'faker', 'evilseed', 'evil-seed', 'blast-attak',
      'ninjor', 'saurod', 'blade', 'karg', 'anti-eternia-he-man',
    ]),
  },
  'gi-joe': {
    // G.I. Joe team vs Cobra (the premise IS the good/evil split).
    heroes: new Set([
      'duke', 'snake-eyes', 'scarlett', 'roadblock', 'flint', 'lady-jaye', 'gung-ho', 'stalker',
      'hawk', 'beach-head', 'shipwreck', 'sgt-slaughter', 'low-light', 'dusty', 'bazooka', 'alpine',
      'footloose', 'leatherneck', 'wet-suit', 'rock-n-roll', 'breaker', 'grunt', 'clutch', 'steeler',
      'zap', 'ripcord', 'airborne', 'quick-kick', 'mutt', 'spirit', 'recondo', 'blowtorch', 'cutter',
      'doc', 'lifeline', 'sci-fi', 'tunnel-rat', 'falcon', 'jinx', 'chuckles', 'muskrat', 'repeater',
      'hit-and-run', 'sneak-peek', 'cross-country', 'frostbite', 'snow-job', 'torpedo', 'ace', 'wild-bill',
    ]),
    villains: new Set([
      'cobra-commander', 'destro', 'baroness', 'storm-shadow', 'zartan', 'major-bludd', 'firefly',
      'serpentor', 'dr-mindbender', 'tomax', 'xamot', 'copperhead', 'scrap-iron', 'wild-weasel',
      'cobra-trooper', 'cobra-officer', 'viper', 'b-a-t', 'crimson-guard', 'buzzer', 'ripper', 'torch',
      'monkeywrench', 'raptor', 'zarana', 'zandar', 'dr-venom', 'overkill', 'metal-head', 'night-creeper',
      'annihilator', 'alley-viper', 'toxo-viper', 'range-viper', 'techno-viper', 'hydro-viper',
      'gnawgahyde', 'road-pig', 'voltar', 'big-boa', 'croc-master', 'cesspool', 'headman', 'cobra',
    ]),
  },
  'wwe-elite': {
    // FACE vs HEEL = wrestling's native good/evil. Alignment is FLUID (most stars were
    // both) so this is the most-iconic/default run for a fun band, NOT a hard fact;
    // ambiguous tweeners are deliberately OMITTED rather than guessed. character_canonical slugs.
    heroes: new Set([
      'john-cena','rey-mysterio','hulk-hogan','the-rock','cody-rhodes','kofi-kingston','daniel-bryan',
      'big-e','xavier-woods','becky-lynch','jeff-hardy','eddie-guerrero','dusty-rhodes','ultimate-warrior',
      'british-bulldog','diamond-dallas-page','sami-zayn','jey-uso','jimmy-uso','macho-man-randy-savage',
      'stone-cold-steve-austin','shawn-michaels','undertaker','ricky-steamboat','bret-hart','sting',
    ]),
    villains: new Set([
      'roman-reigns','seth-rollins','triple-h','randy-orton','brock-lesnar','kevin-owens','gunther',
      'miz','bray-wyatt','jake-roberts','yokozuna','dominik-mysterio','logan-paul','jacob-fatu',
      'andre-the-giant','ric-flair','iron-sheik','ted-dibiase','charlotte-flair','the-fiend',
    ]),
  },
  'wrestling-jakks': {
    // VINTAGE vs MODERN (not face/heel). Classify by PRODUCT_LINE, not character (line-based = clean,
    // no guessing). Vintage = the Classic Superstars legend sculpts; Modern = the Ruthless Aggression
    // action-era mainlines. The band relabels the headers via the voice pack.
    mode: 'line',
    heroes: new Set(['classic-superstars', 'deluxe-classic']),
    villains: new Set(['ruthless-aggression', 'deluxe-aggression', 'r3-tech', 'titan-tron-live']),
  },
}
const ALLEGIANCE_KEY = OUT_OVERRIDE && ALLEGIANCE[OUT_OVERRIDE] ? OUT_OVERRIDE : FANDOM
const { heroes: HEROES, villains: VILLAINS } = ALLEGIANCE[ALLEGIANCE_KEY] || { heroes: new Set(), villains: new Set() }

function loadFigures() {
  const raw = readFileSync(join(ROOT, 'src', 'data', 'figures-reference-v2.slim.js'), 'utf8')
  const sb = { module: { exports: {} }, exports: {} }; sb.exports = sb.module.exports
  vm.createContext(sb); vm.runInContext(raw, sb, { timeout: 30000 })
  const f = sb.module.exports.FIGURES_V2 ?? sb.module.exports
  if (!Array.isArray(f)) throw new Error('KB load failed')
  return f
}
const prettify = s => String(s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
const name = f => f.v1_name || prettify(f.character_canonical)
const charSlug = f => String(f.character_canonical || '').toLowerCase().trim()
function rarityFlag(f) { const l = (f.product_line || '').toLowerCase(), e = (f.exclusive_to || '').toLowerCase(); if (l === 'original' || /vintage/.test(l)) return 'VINTAGE'; if (l === 'classics') return 'MOTUC'; if (e && e !== 'none' && e !== '') return 'EXCLUSIVE'; return '' }

async function snap(id) { try { const r = await fetch(`${R2}/price-summaries/${encodeURIComponent(id)}.json`, { signal: AbortSignal.timeout(8000) }); return r.ok ? await r.json() : null } catch { return null } }
async function mapLimit(items, limit, fn) { const out = new Array(items.length); let i = 0; await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (i < items.length) { const x = i++; out[x] = await fn(items[x]) } })); return out }

function pickSide(priced, matchFn) {
  // dedupe to the highest-priced figure per character, then top N by price
  const byChar = new Map()
  for (const p of priced) {
    if (!p || !p.image || !matchFn(p)) continue
    const cur = byChar.get(p.char)
    if (!cur || p.price > cur.price) byChar.set(p.char, p)
  }
  return [...byChar.values()].sort((a, b) => b.price - a.price).slice(0, PER_SIDE)
}

async function main() {
  const all = loadFigures()
  const MODE = (ALLEGIANCE[ALLEGIANCE_KEY] && ALLEGIANCE[ALLEGIANCE_KEY].mode) || 'char'
  const keyOf = MODE === 'line' ? (p => p.pl) : (p => p.char)
  const matchFig = MODE === 'line'
    ? (f => HEROES.has(f.product_line || '') || VILLAINS.has(f.product_line || ''))
    : (f => HEROES.has(charSlug(f)) || VILLAINS.has(charSlug(f)))
  const figs = all.filter(f => f.fandom === FANDOM && (!MFR || f.manufacturer === MFR) && (!LINE_EXCLUDE || !LINE_EXCLUDE.test(f.product_line || '')))
  // only figures on either side AND with a photo (band is photo-led)
  const candidates = figs.filter(f => f.canonical_image_url && (!LINE_MATCH || LINE_MATCH.test(f.product_line || '')) && matchFig(f))
  console.log(`${FANDOM}: ${figs.length} figs, ${candidates.length} hero/villain candidates with photos`)
  const priced = await mapLimit(candidates, CONCURRENCY, async f => {
    const s = await snap(f.figure_id); if (!s) return null
    const p = (s.median_sold ?? s.avg_sold); const c = s.sold_count ?? 0
    if (p == null || c <= 0) return null
    return { figure_id: f.figure_id, name: name(f), char: charSlug(f), pl: f.product_line || '', line: f.v1_line || prettify(f.product_line), price: Math.round(p), sold_count: c, flag: rarityFlag(f), image: f.canonical_image_url || null, url: `/figure/${f.figure_id}` }
  })
  const clean = priced.filter(Boolean)
  const heroes = pickSide(clean, p => HEROES.has(keyOf(p)))
  const villains = pickSide(clean, p => VILLAINS.has(keyOf(p)))
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  const payload = { fandom: OUT_OVERRIDE || FANDOM, generated_at: new Date().toISOString(), source: 'curated allegiance + r2proxy price-summaries, sold_count>0, photo required', heroes, villains }
  writeFileSync(join(OUT_DIR, `${OUT_OVERRIDE || FANDOM}.json`), JSON.stringify(payload, null, 2))
  console.log(`heroes(${heroes.length}):`, heroes.map(h => `${h.name} $${h.price}`).join(', '))
  console.log(`villains(${villains.length}):`, villains.map(v => `${v.name} $${v.price}`).join(', '))
}
main().catch(e => { console.error(e); process.exit(1) })
