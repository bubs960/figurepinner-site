/**
 * Build-time genre/line taxonomy — single source of truth for the homepage
 * genre browser (rendered inline by src/app/page.tsx via GENRE_TAXONOMY).
 *
 * WHY THIS EXISTS (S20, 2026-06-11):
 * The original homepage genre browser shipped a hand-typed data array. It
 * drifted from the KB the same way the hardcoded figure counts did before
 * kb-stats.ts existed:
 * 36 of its line tiles were broken at once — 16 wrong slugs (dc-multiverse
 * vs the KB's "multiverse") and 20 tiles for lines the KB doesn't carry,
 * with invented counts. Slugs and counts are FACTS, so they are computed
 * here from the KB at build time and can never drift again.
 *
 * What stays human: names that deserve better casing than a slug can give,
 * era labels, badges, and the one-line descriptions. Those live in the
 * EDITORIAL overlay below, keyed by "genre/slug". The overlay is VALIDATED
 * at build: an entry whose line no longer exists in the KB is dropped with a
 * build-log warning instead of shipping a dead tile.
 *
 * Counts and resolvable slugs are precomputed from the KB before Next builds.
 * This module retains the editorial overlay and its validation, then passes
 * the computed array to GenreTaxonomy as serialized props.
 */

import generated from './kb-stats.generated.json'
import { UI_SLUG_TO_FANDOM, NECA_FANDOMS, plusLabel, type KbStatsGenerated } from './kb-stats'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'

const KB_STATS: KbStatsGenerated = generated

// ─── Public types (serializable — cross the client boundary as props) ────────

export interface LineTile {
  name: string
  slug: string          // product_line slug in KB — always resolvable
  count: string         // honest floored label, computed from the KB
  years: string
  badge?: 'hot' | 'vintage' | 'new' | 'premium'
  desc?: string
}

export interface GenreTab {
  slug: string          // UI genre slug (route param)
  name: string
  totalCount: string    // computed from the KB, display label ("6,000+")
  figureCount: number   // same fact, raw — for ranking genres by live size
  accent: string
  lines: LineTile[]
}

// ─── Editorial layer (human-curated; validated against the KB at build) ──────

/** Display order + branding for the genre tabs. */
const GENRE_UI: Array<{ slug: string; name: string; accent: string }> = [
  { slug: 'wrestling',                    name: 'Wrestling',      accent: '#0066FF' },
  { slug: 'marvel',                       name: 'Marvel',         accent: '#E62429' },
  { slug: 'star-wars',                    name: 'Star Wars',      accent: '#FFE300' },
  { slug: 'dc',                           name: 'DC',             accent: '#1565C0' },
  { slug: 'transformers',                 name: 'Transformers',   accent: '#E65100' },
  { slug: 'gijoe',                        name: 'G.I. Joe',       accent: '#4CAF50' },
  { slug: 'masters-of-the-universe',      name: 'MOTU',           accent: '#9C27B0' },
  { slug: 'teenage-mutant-ninja-turtles', name: 'TMNT',           accent: '#4CAF50' },
  { slug: 'power-rangers',                name: 'Power Rangers',  accent: '#F44336' },
  { slug: 'neca',                         name: 'Horror & Film',  accent: '#B71C1C' },
  { slug: 'indiana-jones',                name: 'Indiana Jones',  accent: '#795548' },
  { slug: 'ghostbusters',                 name: 'Ghostbusters',   accent: '#00BCD4' },
  { slug: 'mythic-legions',               name: 'Mythic Legions', accent: '#607D8B' },
  { slug: 'thundercats',                  name: 'Thundercats',    accent: '#FF6F00' },
  { slug: 'action-force',                 name: 'Action Force',   accent: '#546E7A' },
  // D&D excluded 2026-06-06 — KB has no clean `dungeons-dragons` fandom
  // (figures live in the mixed `generic-fantasy` bucket). Restore once the
  // KB tags D&D properly. See WEB-W3 relay.
  { slug: 'spawn',                        name: 'Spawn',          accent: '#37474F' },
  // Added 2026-08-02: matcher's 8/1 retag split 22 NECA figures into their own
  // 'gargoyles' fandom (Steve's 7/31 own-fandom ruling). Identity slug, no
  // UI_SLUG_TO_FANDOM remap needed — see genreFigures.ts GENRE_HUB_LABELS.
  { slug: 'gargoyles',                    name: 'Gargoyles',      accent: '#4E342E' },
  // Added 2026-08-24: matcher's 8/23 line-adds campaign minted UFC as its own
  // fandom (99 fids). Identity slug, no UI_SLUG_TO_FANDOM remap needed.
  { slug: 'ufc',                          name: 'UFC',            accent: '#141414' },
]

type Editorial = Partial<Pick<LineTile, 'name' | 'years' | 'badge' | 'desc'>> & {
  /** Pin to the top of the genre's grid in this order (editorial lines first). */
  order?: number
}

/**
 * Keyed by "ui-genre-slug/product_line". slug MUST be the KB's product_line —
 * if a slug here stops resolving (line renamed/merged in the KB), the entry is
 * dropped at build with a warning, never shipped broken.
 */
const EDITORIAL: Record<string, Editorial> = {
  // ── Wrestling ──
  'wrestling/elite':               { order: 1, name: 'WWE Elite Collection', years: '2010–present', badge: 'hot', desc: 'The standard bearer of modern WWE collecting' },
  'wrestling/ultimate-edition':    { order: 2, name: 'Ultimate Edition', years: '2019–present', badge: 'premium', desc: 'Premium articulation, best sculpts in the line' },
  'wrestling/basic':               { order: 3, name: 'Mattel Basic Series', years: '2010–present', desc: 'Entry-level with full roster depth' },
  'wrestling/deluxe-aggression':   { order: 4, name: 'Deluxe Aggression', years: '2006–2010', badge: 'vintage', desc: 'Ruthless Aggression-era Jakks pinnacle' },
  'wrestling/ruthless-aggression': { order: 5, name: 'Ruthless Aggression', years: '2002–2007', desc: 'Attitude Era crossover collection' },
  'wrestling/elite-legends':       { order: 6, name: 'Legends Series', years: '2010–2022', desc: 'Hall of Famers and iconic moments' },
  'wrestling/wwe-retro':           { order: 7, name: 'Mattel Retro Series', years: '2018–present', desc: 'Hasbro-style sculpts on modern bodies' },
  'wrestling/classic-superstars':  { order: 8, name: 'Classic Superstars', years: '2004–2010', badge: 'vintage', desc: 'Jakks tribute to WWF golden era talent' },
  'wrestling/wwf-hasbro':          { order: 9, name: 'Hasbro WWF', years: '1990–1994', badge: 'vintage', desc: 'The original wrestling toy line, endlessly nostalgic' },
  'wrestling/ljn-wwf':             { order: 10, name: 'LJN WWF', years: '1984–1989', badge: 'vintage', desc: 'Rubber giants — the founding generation' },
  'wrestling/defining-moments':    { order: 11, name: 'Defining Moments', years: '2010–2015', badge: 'premium', desc: 'Iconic match gear, premium price, strong secondary' },
  // ── Marvel ──
  'marvel/marvel-legends':         { order: 1, name: 'Marvel Legends (Hasbro)', years: '2007–present', badge: 'hot', desc: 'The dominant 6-inch scale since 2007' },
  'marvel/hot-toys':               { name: 'Hot Toys' },
  'marvel/one-12-collective':      { name: 'One:12 Collective', badge: 'premium' },
  'marvel/mafex':                  { name: 'MAFEX' },
  // ── Star Wars ──
  'star-wars/black-series':        { order: 1, name: 'The Black Series', years: '2013–present', badge: 'hot', desc: '6-inch scale, film-accurate, the collector standard' },
  'star-wars/vintage-collection':  { order: 2, name: 'The Vintage Collection', years: '2010–present', badge: 'premium', desc: 'Kenner-style cardback with modern articulation' },
  'star-wars/power-of-the-force':  { order: 3, name: 'Power of the Force', years: '1995–2000', badge: 'vintage', desc: "The 90s comeback wave, everyone's first Star Wars figs" },
  'star-wars/hot-toys':            { name: 'Hot Toys' },
  // ── DC ──
  'dc/multiverse':                 { order: 1, name: 'DC Multiverse (McFarlane)', years: '2020–present', badge: 'hot', desc: 'The new standard — 7-inch scale across all DC media' },
  'dc/dc-universe-classics':       { order: 2, name: 'DC Universe Classics', years: '2007–2015', badge: 'vintage', desc: "Mattel's C&C era, deep roster, strong secondary" },
  'dc/super-powers':               { order: 3, name: 'Kenner Super Powers', years: '1984–1987', badge: 'vintage', desc: 'The DC equivalent of vintage Star Wars' },
  'dc/retro-66':                   { name: "Retro '66" },
  'dc/mafex':                      { name: 'MAFEX' },
  // ── Transformers ──
  'transformers/masterpiece':      { order: 1, name: 'Masterpiece', years: '2003–present', badge: 'premium', desc: 'Screen-accurate alt modes, the holy grail tier' },
  'transformers/studio-series':    { order: 2, name: 'Studio Series', years: '2018–present', badge: 'hot', desc: 'Film-accurate, shared scale across the timeline' },
  'transformers/generations':      { order: 3, name: 'Generations / Legacy', years: '2010–present', desc: 'Core collector line — Selects, Deluxe, Voyager' },
  'transformers/g1':               { order: 4, name: 'G1 Original (1984)', years: '1984–1990', badge: 'vintage', desc: 'The Diaclone-origin classics — Optimus, Megatron, Starscream' },
  // ── G.I. Joe ──
  'gijoe/classified-series':       { order: 1, name: 'Classified Series', years: '2020–present', badge: 'hot', desc: '6-inch scale comeback, updated character takes' },
  'gijoe/a-real-american-hero':    { order: 2, name: 'A Real American Hero', years: '1982–1994', badge: 'vintage', desc: 'The 3.75" originals — the deepest roster in the hobby' },
  'gijoe/super7-reaction':         { name: 'Super7 ReAction' },
  // ── MOTU ──
  'masters-of-the-universe/masterverse': { order: 1, name: 'Masterverse', years: '2021–present', badge: 'hot', desc: 'Modern proportions, deep Netflix/classic roster' },
  'masters-of-the-universe/origins':     { order: 2, name: 'Origins', years: '2020–present', desc: 'Vintage-compatible scale, 5.5" retro feel' },
  'masters-of-the-universe/classics':    { order: 3, name: 'Classics (Club Grayskull)', years: '2009–2017', badge: 'premium', desc: 'Subscription-era grails, complete runs are rare' },
  'masters-of-the-universe/original':    { order: 4, name: 'Original Mattel (1982)', years: '1982–1988', badge: 'vintage', desc: 'The big-back cards — He-Man and Skeletor as cultural artifacts' },
  'masters-of-the-universe/mattel-200x': { name: 'Mattel 200x' },
  // ── TMNT ──
  'teenage-mutant-ninja-turtles/neca':      { order: 1, name: 'NECA TMNT', years: '2012–present', badge: 'premium', desc: 'Cartoon and Archie comic accurate, limited runs' },
  'teenage-mutant-ninja-turtles/playmates': { order: 2, name: 'Playmates Classic', years: '1988–present', desc: 'The ubiquitous line — from vintage giants to modern basics' },
  'teenage-mutant-ninja-turtles/super7':    { order: 3, name: 'Super7 ReAction TMNT', years: '2018–present', desc: '3.75" retro-kenner style, tight Mondo aesthetic' },
  // ── Power Rangers ──
  'power-rangers/lightning':       { order: 1, name: 'Lightning Collection', years: '2019–present', badge: 'hot', desc: 'Hasbro 6-inch collector standard, deep ranger roster' },
  // ── Horror & Film (neca rollup) ──
  'neca/neca-ultimate':            { order: 1, name: 'NECA Ultimate', years: '2012–present', badge: 'hot', desc: 'Maximum accessories, maximum articulation, cult licenses' },
  'neca/neca-aliens':              { name: 'NECA Aliens' },
  'neca/neca-predator':            { name: 'NECA Predator' },
  'neca/neca-movies':              { name: 'NECA Movies' },
  // ── Indiana Jones ──
  'indiana-jones/hasbro-adventure-series': { order: 1, name: 'Adventure Series (Hasbro)', years: '2023–present', badge: 'new', desc: 'Modern Black-Series-quality, full film span' },
  // ── Ghostbusters ──
  'ghostbusters/kenner-ghostbusters': { order: 1, name: 'Kenner Real Ghostbusters', years: '1986–1991', badge: 'vintage' },
  'ghostbusters/hasbro-ghostbusters': { name: 'Hasbro Ghostbusters' },
  'ghostbusters/hasbro-ghostbusters-kenner-classics': { name: 'Kenner Classics (Hasbro)' },
  // ── Mythic Legions ──
  'mythic-legions/mythic-legions': { order: 1, name: 'Mythic Legions (4H)', years: '2016–present', badge: 'premium', desc: 'Four Horsemen universe — fully interchangeable armor system' },
  // ── Thundercats ──
  'thundercats/super7':            { order: 1, name: 'Super7 Ultimates', years: '2019–present', badge: 'premium', desc: 'Most detailed Thundercats figures ever made' },
  'thundercats/ljn':               { order: 2, name: 'LJN Thundercats (1985)', years: '1985–1988', badge: 'vintage', desc: 'The originals — Mumm-Ra and Lion-O in rubber magnificence' },
  // ── Action Force ──
  'action-force/action-force':     { order: 1, name: 'Action Force (Palitoy)', years: '1982–1988', badge: 'vintage', desc: 'UK-market G.I. Joe cousin — rare outside British collections' },
  'action-force/valaverse-action-force': { order: 2, name: 'Valaverse Action Force', years: '2021–present', badge: 'new', desc: 'Modern 6-inch revival with elite UK collector following' },
  // ── Spawn ──
  'spawn/mcfarlane-spawn':         { order: 1, name: 'McFarlane Toys Spawn', years: '1994–2006', badge: 'vintage', desc: 'The figures that changed the industry — detail-first philosophy' },
}

// ─── Computation ──────────────────────────────────────────────────────────────

/** Minimum figures for a line to be auto-included without editorial backing. */
const AUTO_MIN_FIGURES = 15
/** Auto-fill each genre's grid up to this many tiles. */
const TARGET_TILES = 5
/** KB catch-all buckets that aren't real browsable lines. */
const EXCLUDED_LINES = new Set(['general', 'misc', 'unknown'])

function fandomsForGenre(genre: string): string[] {
  if (genre === 'neca') return NECA_FANDOMS
  return [UI_SLUG_TO_FANDOM[genre] ?? genre]
}

function buildGenre(ui: { slug: string; name: string; accent: string }): GenreTab | null {
  const summaries = fandomsForGenre(ui.slug)
    .map(fandom => KB_STATS.fandoms[fandom])
    .filter((summary): summary is NonNullable<typeof summary> => summary !== undefined)
  const figureCount = summaries.reduce((sum, summary) => sum + summary.count, 0)
  if (!figureCount) {
    console.warn(`[genre-lines] genre "${ui.slug}" has no KB figures — tab dropped`)
    return null
  }

  const byLine = new Map<string, number>()
  // Manufacturer-prefixed URL form ("valaverse-action-force",
  // "mcfarlane-spawn") — the line page accepts both shapes; editorial entries
  // may use the prefixed form to split one product_line by manufacturer.
  const byMfrLine = new Map<string, { count: number; productLine: string }>()
  for (const summary of summaries) {
    for (const [slug, count] of Object.entries(summary.lines)) {
      byLine.set(slug, (byLine.get(slug) ?? 0) + count)
    }
    for (const [slug, entry] of Object.entries(summary.manufacturerLines)) {
      const cur = byMfrLine.get(slug)
      byMfrLine.set(slug, {
        count: (cur?.count ?? 0) + entry.count,
        productLine: entry.productLine,
      })
    }
  }

  const tiles: Array<LineTile & { order: number; n: number }> = []

  // 1. Editorial lines for this genre — validated against the KB.
  for (const [key, ed] of Object.entries(EDITORIAL)) {
    const [genre, slug] = [key.slice(0, key.lastIndexOf('/')), key.slice(key.lastIndexOf('/') + 1)]
    if (genre !== ui.slug) continue
    const n = byLine.get(slug) ?? byMfrLine.get(slug)?.count ?? 0
    if (n === 0) {
      console.warn(`[genre-lines] editorial entry "${key}" no longer resolves in the KB — tile dropped`)
      continue
    }
    tiles.push({
      slug,
      name: ed.name ?? prettifySlug(slug),
      count: plusLabel(n),
      years: ed.years ?? '',
      badge: ed.badge,
      desc: ed.desc,
      order: ed.order ?? 1000,
      n,
    })
  }

  // 2. Auto-fill with the genre's real top lines until TARGET_TILES.
  // A product_line already represented by a manufacturer-prefixed editorial
  // tile counts as covered — don't add a duplicate plain-slug tile for it.
  const have = new Set(tiles.map(t => t.slug))
  for (const t of tiles) {
    const viaMfr = byMfrLine.get(t.slug)
    if (viaMfr) have.add(viaMfr.productLine)
  }
  const top = [...byLine.entries()].sort((a, b) => b[1] - a[1])
  for (const [slug, n] of top) {
    if (tiles.length >= Math.max(TARGET_TILES, tiles.length)) break
    if (tiles.length >= TARGET_TILES) break
    if (have.has(slug) || EXCLUDED_LINES.has(slug) || n < AUTO_MIN_FIGURES) continue
    tiles.push({
      slug,
      name: prettifySlug(slug),
      count: plusLabel(n),
      years: '',
      order: 2000,
      n,
    })
    have.add(slug)
  }

  // Editorial order first, then by figure count.
  tiles.sort((a, b) => a.order - b.order || b.n - a.n)

  return {
    slug: ui.slug,
    name: ui.name,
    accent: ui.accent,
    totalCount: plusLabel(figureCount),
    figureCount,
    lines: tiles.map(({ order: _o, n: _n, ...tile }) => tile),
  }
}

/** Computed once at build (module scope) — same pattern as kb-stats. */
export const GENRE_TAXONOMY: GenreTab[] = GENRE_UI
  .map(buildGenre)
  .filter((g): g is GenreTab => g !== null)
