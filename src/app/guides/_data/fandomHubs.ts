/**
 * fandomHubs.ts — config + data loader for culture-led FandomHub pages.
 *
 * A FandomHub is a themed, culture-first price-intel hub for one fandom. It is NOT
 * a generic guide article — it leads with the fandom WORLD (atmosphere, lore, voice),
 * with the price-comp "intel" table as a tool inside that world (Steve, 6/20:
 * "culture drives the hub, not the price").
 *
 * Each hub maps a `-hub` article slug → a fandom KB key + a THEME (palette/voice pack).
 * The route renders <FandomHub> for these slugs; the editorial body still comes from
 * the existing Article in articles.ts (single source of long-form copy).
 *
 * TEMPLATIZED (S40, GI Joe): MOTU proved the pattern; the skeleton is now generic.
 * Every fandom-specific string lives in the theme's VoicePack, every fandom-specific
 * dataset (lore / easter-egg facts / FAQ) hangs off the theme, and the hero centerpiece
 * is a per-theme discriminant. Adding a fandom = add a theme here + a CSS [data-fandom]
 * block + register its nightly data — no component edits.
 */

import { getFigureById, prettyFigureUrl } from '@/data/kb'

// Precomputed top-comps JSON (nightly build-fandom-top-comps.mjs). STATIC imports —
// register each fandom's file here once its data exists. See loadTopComps() below.
import motuTopComps from '@/data/fandom-top-comps/masters-of-the-universe.json'
import motuVaults from '@/data/fandom-vaults/masters-of-the-universe.json'
import motuHeroesVillains from '@/data/fandom-heroes-villains/masters-of-the-universe.json'
import gijoeTopComps from '@/data/fandom-top-comps/gi-joe.json'
import gijoeVaults from '@/data/fandom-vaults/gi-joe.json'
import gijoeHeroesVillains from '@/data/fandom-heroes-villains/gi-joe.json'
import wweTopComps from '@/data/fandom-top-comps/wwe-elite.json'
import wweVaults from '@/data/fandom-vaults/wwe-elite.json'
import wweHeroesVillains from '@/data/fandom-heroes-villains/wwe-elite.json'
import jakksTopComps from '@/data/fandom-top-comps/wrestling-jakks.json'
import wrestlingTopComps from '@/data/fandom-top-comps/wrestling.json'
import starWarsTopComps from '@/data/fandom-top-comps/star-wars.json'
import starWarsVaults from '@/data/fandom-vaults/star-wars.json'
import starWarsHeroesVillains from '@/data/fandom-heroes-villains/star-wars.json'
import transformersTopComps from '@/data/fandom-top-comps/transformers.json'
import transformersVaults from '@/data/fandom-vaults/transformers.json'
import transformersHeroesVillains from '@/data/fandom-heroes-villains/transformers.json'
import jakksVaults from '@/data/fandom-vaults/wrestling-jakks.json'
import jakksHeroesVillains from '@/data/fandom-heroes-villains/wrestling-jakks.json'

import type { EraCard } from '../_components/EraMapGrid'
import { MOTU_VAULT_LORE, type VaultLore } from './motuVaultLore'
import { GIJOE_LINE_LORE } from './gijoeLineLore'
import { WWE_LINE_LORE } from './wweLineLore'
import { JAKKS_LINE_LORE } from './jakksLineLore'
import { MOTU_FACTS, MOTU_FAQS } from './motuFacts'
import { GIJOE_FACTS, GIJOE_FAQS } from './gijoeFacts'
import { WWE_FACTS, WWE_FAQS } from './wweFacts'
import { JAKKS_FACTS, JAKKS_FAQS } from './jakksFacts'
import { WRESTLING_FACTS, WRESTLING_FAQS } from './wrestlingHubFacts'
import { STAR_WARS_LINE_LORE } from './starWarsLineLore'
import { STAR_WARS_FACTS, STAR_WARS_FAQS } from './starWarsFacts'
import { TRANSFORMERS_LINE_LORE } from './transformersLineLore'
import { TRANSFORMERS_FACTS, TRANSFORMERS_FAQS } from './transformersFacts'

export type HubFlagWording = { vintage?: string; motuc?: string; exclusive?: string; reissue?: string }

/** Per-fandom VOICE PACK — the unique LANGUAGE in every chrome string (Steve 6/20).
 *  Templatized S40: includes the strings formerly hardcoded in the sub-components
 *  (H-vs-V band, line accordion, price-checker, stat strip, story expander) so a new
 *  fandom is a pure config swap and NO MOTU/Eternia string can leak into it. */
export type VoicePack = {
  kicker: string          // small eyebrow over the hero, e.g. "THE HALLS OF GRAYSKULL"
  heroLead: string        // one-line lore hook under the title
  searchPlaceholder: string
  intelHeader: string     // the comp-table heading, fandom-voiced
  intelSub: string        // small line under it
  emptyState: string      // shown when no precomputed comps yet (graceful degrade)
  loading: string         // client loading copy if ever needed
  ctaLabel: string        // figure-search CTA
  flag: HubFlagWording    // rarity/era flag labels mapped from KB heuristics
  // -- templatized chrome (pulled out of the sub-components, S40) --
  hvTitle: string         // Heroes-vs-Villains band heading
  hvSub: string
  heroesLabel: string     // left allegiance label
  villainsLabel: string   // right allegiance label
  linesTitle: string      // line-accordion heading
  linesSub: string
  checkerTitle: string    // on-hub price-checker heading (seam layout)
  checkerSub: string
  checkerLoading: string  // checker async states
  checkerMiss: string
  checkerError: string
  storyLabel: string      // collapsed story expander summary
  statsAria: string       // "by the numbers" strip aria-label
  statsLinesLabel: string // stat label for the line count
}

/** Easter-egg fact pool (Skeletor / Cobra Commander). Every item is ledger-sourced. */
export type HubFacts = { items: string[]; promptIdle: string; promptMore: string; glyph: 'skeletor' | 'cobra' | 'mic' | 'saber' | 'faction' }
export type HubFaq = { q: string; a: string }

export type HubTheme = {
  fandom: string          // theme id == data-fandom CSS scope (whole-fandom hubs: the KB key; line-scoped hubs: a scope id e.g. "wwe-elite")
  dataKey: string         // data-file key (== fandom)
  genre?: string          // KB fandom for the /<genre>/<line> route + builder filter base; defaults to fandom. Line-scoped hubs differ (wwe-elite -> "wrestling")
  manufacturer?: string   // optional manufacturer scope (e.g. jakks-pacific, mattel) for manufacturer-scoped sibling hubs within one KB fandom; applied at BUILD time via the builders' MFR env (metadata here)
  voice: VoicePack
  // Palette is applied as CSS vars via data-fandom attribute in globals.css.
  // Kept here only for reference/tests; the source of truth is the CSS block.
  paletteNote: string
  seam: boolean                                        // render the atmospheric seam hero + enriched modules
  centerpiece: 'pwsword' | 'gijoe-sigils' | 'wwe-ring' | 'saber-clash' | 'faction-seam' // which inline-SVG hero centerpiece the seam renders
  intelMode: 'checker' | 'table'             // seam layout: price-checker only, or checker + ranked table
  lore: Record<string, VaultLore>            // per-line accordion lore
  facts: HubFacts                            // easter-egg pool
  faqs: HubFaq[]                             // collector FAQ (+ FAQPage schema)
  era: { start: string; end?: string; label: string }  // stat strip: first year (+ optional end year, defaults to "now") + span label
  // PARENT-page mode (general wrestling-hub, S41): an umbrella landing page that links
  // DOWN to child hubs via an era-map card grid instead of re-listing figures. When
  // `eraMap` is set the hub renders <EraMapGrid> + a parent stat strip (since it has no
  // vaults) and SKIPS the vault accordion + H-v-V band. The grails table still renders
  // from a parent-scoped (all-makers) top-comps roll-up.
  eraMap?: EraCard[]
  eramapTitle?: string
  eramapSub?: string
  parentStats?: { num: string; label: string }[]
}

/** MOTU — "Eternia / Obrero's misty Grayskull" (research-grounded, vintage-collector lead). */
const MOTU: HubTheme = {
  fandom: 'masters-of-the-universe',
  dataKey: 'masters-of-the-universe',
  paletteNote: 'pea-green + black stone, mist, Grayskull gold — painted/atmospheric, not clean-modern',
  seam: true,
  centerpiece: 'pwsword',
  intelMode: 'checker',
  lore: MOTU_VAULT_LORE,
  facts: { items: MOTU_FACTS, promptIdle: 'Skeletor knows things…', promptMore: 'Tell me more, fool.', glyph: 'skeletor' },
  faqs: MOTU_FAQS,
  era: { start: '1982', label: '40+ years' },
  voice: {
    kicker: 'THE HALLS OF GRAYSKULL',
    heroLead:
      'Fabulous secret powers were revealed to those who collected here. Forty years of Eternia — vintage cardbacks, Mattycollector sale-day scars, and the Four Horsemen — in one place.',
    searchPlaceholder: 'Summon any figure of Eternia…',
    intelHeader: 'Power level — most valuable now',
    intelSub: 'Real eBay sold comps, ranked. Every name opens its figure page.',
    emptyState: 'The comps have not yet returned from Eternia. Search any figure above for its current value.',
    loading: 'Opening the jaw-bridge…',
    ctaLabel: 'Look up any figure of Eternia →',
    flag: { vintage: "VINTAGE '82", motuc: 'MOTUC sale-day', exclusive: 'EXCLUSIVE' },
    hvTitle: 'Heroes & Villains of Eternia',
    hvSub: 'The most-wanted grails on each side of the seam — real eBay sold comps.',
    heroesLabel: 'Heroic Warriors',
    villainsLabel: 'Evil Warriors',
    linesTitle: 'The ten lines of Eternia',
    linesSub: 'Four decades of Eternia, line by line. Open a line for its history and grails.',
    checkerTitle: 'Is it worth it?',
    checkerSub: 'Check any figure of Eternia against real eBay sold comps — instantly.',
    checkerLoading: 'Consulting the sorceress…',
    checkerMiss: 'No sold comps on record for that one yet — try another name.',
    checkerError: 'The crystal went dark. Try again in a moment.',
    storyLabel: 'The MOTU story',
    statsAria: 'Masters of the Universe by the numbers',
    statsLinesLabel: 'lines of Eternia',
  },
}

/** GI JOE — "Cobra threat board" (military filecard register; Joe vs Cobra IS the premise).
 *  First templatized hub off the MOTU pattern (S40). KB key + data files + data-fandom all
 *  "gi-joe" (DASH); route slug "gi-joe-hub". Centerpiece = dual sigils confronting on the seam. */
const GIJOE: HubTheme = {
  fandom: 'gi-joe',
  dataKey: 'gi-joe',
  paletteNote: 'olive-drab + gunmetal black, Cobra-red alert, brass — military threat board, stencil display type',
  seam: true,
  centerpiece: 'gijoe-sigils',
  intelMode: 'table',
  lore: GIJOE_LINE_LORE,
  facts: { items: GIJOE_FACTS, promptIdle: 'Intercept Cobra transmission…', promptMore: 'Decrypt the next packet.', glyph: 'cobra' },
  faqs: GIJOE_FAQS,
  era: { start: '1982', label: '40+ years' },
  voice: {
    kicker: 'A REAL AMERICAN HERO',
    heroLead:
      'Forty years of the war between G.I. Joe and Cobra — o-ring vintage filecards, the 25th Anniversary revival, and the Classified era — assembled in one dossier.',
    searchPlaceholder: 'Search any figure on the roster…',
    intelHeader: 'Threat level — most valuable now',
    intelSub: 'Real eBay sold comps, ranked. Every callsign opens its figure page.',
    emptyState: 'Intel not yet decrypted. Search any figure above for its current value.',
    loading: 'Decrypting the filecard…',
    ctaLabel: 'Run a figure through intel →',
    // KB flag wording. NOTE: the KB "EXCLUSIVE" flag covers modern Pulse/store
    // exclusives (e.g. Classified, Retro), so it must NOT read "mail-away" — that
    // vintage-only rarity is kept accurate in the Cobra egg + FAQ instead.
    flag: { vintage: 'O-RING', motuc: '25TH ANNIVERSARY', exclusive: 'EXCLUSIVE', reissue: 'REISSUE' },
    hvTitle: 'G.I. Joe vs. Cobra',
    hvSub: 'The most-wanted grails on each side of the war — real eBay sold comps.',
    heroesLabel: 'G.I. Joe',
    villainsLabel: 'Cobra',
    linesTitle: 'The roster, line by line',
    linesSub: 'Four decades of Joes, era by era. Open a line for its history and grails.',
    checkerTitle: 'Is it worth it?',
    checkerSub: 'Check any figure on the roster against real eBay sold comps — instantly.',
    checkerLoading: 'Decrypting the filecard…',
    checkerMiss: 'No sold comps on record for that callsign yet — try another name.',
    checkerError: 'Transmission lost. Try again in a moment.',
    storyLabel: 'The G.I. Joe story',
    statsAria: 'G.I. Joe by the numbers',
    statsLinesLabel: 'lines on the roster',
  },
}

/** WWE ELITE — "the squared circle" (kayfabe-light collector voice; FACE vs HEEL is the
 *  native duality). Hub #2 of the templatize rollout (S40). LINE-SCOPED: the KB has no
 *  `wwe` fandom — it's `wrestling`; this hub scopes to the Mattel ELITE product-line family
 *  (Elite + Ultimate Edition + Defining Moments) within `wrestling` (Steve: Elite family).
 *  fandom/dataKey/data-fandom = "wwe-elite"; genre (route + builder base) = "wrestling";
 *  centerpiece = a 3/4 wrestling ring straddling the seam. */
const WWE: HubTheme = {
  fandom: 'wwe-elite',
  dataKey: 'wwe-elite',
  genre: 'wrestling',
  paletteNote: 'face blue+gold vs heel crimson+black; arena-dark surfaces, ring-corner lighting, bold condensed display',
  seam: true,
  centerpiece: 'wwe-ring',
  intelMode: 'table',
  lore: WWE_LINE_LORE,
  facts: { items: WWE_FACTS, promptIdle: 'Cut a promo…', promptMore: 'Run it back.', glyph: 'mic' },
  faqs: WWE_FAQS,
  era: { start: '2010', label: '15+ years' },
  voice: {
    kicker: 'STEP INTO THE SQUARED CIRCLE',
    heroLead:
      'Sixteen years of the squared circle in plastic — the 6-inch Elite collector core, the Ultimate Edition premium tier, and the Defining Moments grails every shelf chases. The line collectors actually book their shelves around.',
    searchPlaceholder: 'Search any Superstar on the card…',
    intelHeader: 'The card — what collectors chase now',
    intelSub: 'The figures moving on the secondary market, ranked. Every Superstar opens their figure page.',
    emptyState: 'Nothing on the board for that one yet. Search any Superstar above.',
    loading: 'Cueing the entrance…',
    ctaLabel: 'Look up any Superstar →',
    flag: { vintage: 'VINTAGE', motuc: 'ULTIMATE EDITION', exclusive: 'EXCLUSIVE', reissue: 'REISSUE' },
    hvTitle: 'Babyfaces vs. Heels',
    hvSub: 'The biggest grails on each side of the aisle — face and heel. (Alignment shifts with the storyline; we went with the most iconic run.)',
    heroesLabel: 'Babyfaces',
    villainsLabel: 'Heels',
    linesTitle: 'The Elite library, line by line',
    linesSub: 'Sixteen years of Mattel Elite, sub-line by sub-line. Open a line for its history and grails.',
    checkerTitle: 'Is it worth it?',
    checkerSub: 'Check any Superstar against real eBay sold comps — instantly.',
    checkerLoading: 'Cueing the entrance…',
    checkerMiss: 'No comps on the board for that one yet — try another Superstar.',
    checkerError: 'Lost the signal. Try again in a moment.',
    storyLabel: 'The WWE Elite story',
    statsAria: 'WWE Elite by the numbers',
    statsLinesLabel: 'Elite sub-lines',
  },
}

/** JAKKS-PACIFIC WWE — "the Jakks years" (vintage/modern duality; sibling of the Elite hub).
 *  Manufacturer-scoped within `wrestling`: manufacturer `jakks-pacific`, WWE lines only (TNA
 *  excluded at build time). Disjoint from wwe-elite-hub (different manufacturer/lines) → no
 *  cannibalization. Reuses the `wwe-ring` centerpiece in gold/steel via CSS vars. */
const JAKKS: HubTheme = {
  fandom: 'wrestling-jakks',
  dataKey: 'wrestling-jakks',
  genre: 'wrestling',
  manufacturer: 'jakks-pacific',
  paletteNote: 'vintage sepia-gold (Classic Superstars) vs steel-grey (Ruthless Aggression); aged-paper warmth vs hard steel',
  seam: true,
  centerpiece: 'wwe-ring',
  intelMode: 'table',
  lore: JAKKS_LINE_LORE,
  facts: { items: JAKKS_FACTS, promptIdle: 'Cut a promo: the Jakks years…', promptMore: 'Run it back.', glyph: 'mic' },
  faqs: JAKKS_FAQS,
  era: { start: '1996', end: '2009', label: '14 years' },
  voice: {
    kicker: 'THE JAKKS YEARS',
    heroLead:
      'Before Mattel, there was Jakks — 1996 to 2009. The Classic Superstars legends every collector still chases, and the Ruthless Aggression action era that ran the Attitude-era pegs. Two eras, one shelf.',
    searchPlaceholder: 'Search any Superstar from the Jakks era…',
    intelHeader: 'The hottest Jakks figures right now',
    intelSub: 'The figures moving on the secondary market, ranked. Every Superstar opens their figure page.',
    emptyState: 'Nothing on the board for that one yet. Search any Superstar above.',
    loading: 'Hitting the music…',
    ctaLabel: 'Look up any Superstar →',
    flag: { vintage: 'CLASSIC SUPERSTARS', motuc: 'TOYFARE EXCLUSIVE', exclusive: 'EXCLUSIVE', reissue: 'RUTHLESS AGGRESSION' },
    hvTitle: 'Vintage vs. Modern',
    hvSub: 'The biggest grails on each side of the Jakks era — Classic Superstars legends vs the Ruthless Aggression years.',
    heroesLabel: 'Classic Superstars',
    villainsLabel: 'Ruthless Aggression',
    linesTitle: 'The Jakks library, line by line',
    linesSub: 'Fourteen years of Jakks WWE, line by line. Open a line for its history and grails.',
    checkerTitle: 'Is it worth it?',
    checkerSub: 'Check any Jakks-era Superstar against real eBay sold comps — instantly.',
    checkerLoading: 'Hitting the music…',
    checkerMiss: 'No comps on the board for that one yet — try another Superstar.',
    checkerError: 'Lost the signal. Try again in a moment.',
    storyLabel: 'The Jakks era story',
    statsAria: 'Jakks-era WWE figures by the numbers',
    statsLinesLabel: 'Jakks lines',
  },
}

/** GENERAL WRESTLING — the umbrella PARENT landing page over the whole `wrestling`
 *  fandom (S41). Structurally different from the children: it does NOT re-list figures
 *  (cannibalization law) — it renders an ERA-MAP card grid that links DOWN to the Elite
 *  + Jakks child hubs and scoped searches for the unowned vintage/boutique makers, plus
 *  a curated all-makers grails table. Neutral "house" palette (gold/spotlight), neutral
 *  ring (no face/heel or vintage/modern split). Real full-KB counts in copy (wrestling
 *  5,911). dataKey 'wrestling' = the parent-scoped (all-makers) top-comps roll-up. */
const WRESTLING: HubTheme = {
  fandom: 'wrestling',
  dataKey: 'wrestling',
  genre: 'wrestling',
  paletteNote: 'promotion-neutral house: arena-black + championship gold; authoritative, not face/heel (Elite) or vintage/modern (Jakks)',
  seam: true,
  centerpiece: 'wwe-ring',
  intelMode: 'table',
  lore: {},
  facts: { items: WRESTLING_FACTS, promptIdle: 'Ring the bell…', promptMore: 'Hit the next entrance.', glyph: 'mic' },
  faqs: WRESTLING_FAQS,
  era: { start: '1984', label: '40+ years' },
  eramapTitle: 'Pick your era',
  eramapSub: 'Four decades, five makers, one ring. Jump into the era you collect — each opens its own hub or search.',
  parentStats: [
    { num: '5,911', label: 'wrestling figures' },
    { num: '5', label: 'maker eras' },
    { num: '1984–now', label: '40+ years' },
  ],
  eraMap: [
    { title: 'Mattel Elite', era: '2010–now', count: '~1,400 figures', blurb: 'The modern collector standard — TrueFX faces, 30+ points of articulation, the deepest roster.', href: '/guides/wwe-elite-hub', cta: 'Enter the Elite hub →' },
    { title: 'The Jakks years', era: '1996–2009', count: '~1,760 figures', blurb: 'Classic Superstars legends and the Ruthless Aggression action era. Two eras, one shelf.', href: '/guides/jakks-hub', cta: 'Enter the Jakks hub →' },
    { title: 'AEW / Jazwares', era: '2020–now', blurb: 'The challenger brand — Unrivaled Collection, 25 points of articulation, real 3D scans.', href: '/search?q=AEW+Jazwares', cta: 'Browse AEW figures →' },
    { title: 'Hasbro WWF', era: '1990–1994', blurb: 'Eleven waves of 4-inch spring-action figures. The 1-2-3 Kid and late cards are the grails.', href: '/search?q=WWF+Hasbro', cta: 'Browse Hasbro figures →' },
    { title: 'LJN Big Rubber Guys', era: '1984–1989', blurb: 'Where the hobby started — 8 inches of solid rubber. The vintage prestige tier.', href: '/search?q=LJN+WWF', cta: 'Browse LJN figures →' },
    { title: 'Boutique & indie', era: 'modern', blurb: 'Small-run revivals and grails — Zombie Sailor, Chella, Boss Fight, Super7, Storm.', href: '/search?q=wrestling+boutique', cta: 'Browse boutique figures →' },
  ],
  voice: {
    kicker: 'EVERY ERA, ONE RING',
    heroLead:
      'From the LJN Big Rubber Guys to Mattel Elite and AEW — four decades of wrestling figures, every maker, with real sold comps. Start here, then dive into your era.',
    searchPlaceholder: 'Search any wrestler, any era…',
    intelHeader: 'Wrestling’s biggest grails',
    intelSub: 'The most valuable wrestling figures sold — any maker, any era. Every name opens its figure page.',
    emptyState: 'Search any wrestler above for current value.',
    loading: 'Ringing the bell…',
    ctaLabel: 'Look up any wrestler →',
    flag: { vintage: 'VINTAGE', motuc: 'GRAIL', exclusive: 'EXCLUSIVE', reissue: 'BOUTIQUE' },
    hvTitle: '',
    hvSub: '',
    heroesLabel: '',
    villainsLabel: '',
    linesTitle: '',
    linesSub: '',
    checkerTitle: 'Is it worth it?',
    checkerSub: 'Check any wrestling figure against real eBay sold comps — instantly.',
    checkerLoading: 'Ringing the bell…',
    checkerMiss: 'No comps on record for that one yet — try another name.',
    checkerError: 'Lost the signal. Try again in a moment.',
    storyLabel: 'A short history of the wrestling figure',
    statsAria: 'Wrestling figures by the numbers',
    statsLinesLabel: 'maker eras',
  },
}

/** STAR WARS — "the war of light and dark" (S41, hub #2 of the consolidated rollout).
 *  Whole-fandom hub over `star-wars` (4,222). The native good/evil duality = LIGHT
 *  (Jedi/Rebellion) vs DARK (Sith/Empire) — character-mode H-v-V. Black Series (838) is
 *  the flagship modern line, the Vintage Collection + Kenner are the prestige/heritage
 *  lines. Centerpiece = `saber-clash`: crossed blue/red sabers meeting on the seam
 *  (original hilt geometry, no TM marks). */
const STAR_WARS: HubTheme = {
  fandom: 'star-wars-black-series',
  dataKey: 'star-wars',
  genre: 'star-wars',
  paletteNote: 'deep starfield charcoal; LIGHT side cool blue + white core LEFT, DARK side red + crimson RIGHT; blade glow, no faction-logo marks',
  seam: true,
  centerpiece: 'saber-clash',
  intelMode: 'table',
  lore: STAR_WARS_LINE_LORE,
  facts: { items: STAR_WARS_FACTS, promptIdle: 'Access the holocron…', promptMore: 'Next transmission.', glyph: 'saber' },
  faqs: STAR_WARS_FAQS,
  era: { start: '1977', label: '45+ years' },
  voice: {
    kicker: 'A GALAXY OF PLASTIC',
    heroLead:
      'Forty-five years of Star Wars figures — from the original 1977 Kenner relics to the 6-inch Black Series and the Vintage Collection — light side and dark, with real sold comps. Find your figure.',
    searchPlaceholder: 'Search any figure in the galaxy…',
    intelHeader: 'The grails — most valuable now',
    intelSub: 'Real eBay sold comps, ranked. Every name opens its figure page.',
    emptyState: 'No comps on record for that one yet. Search any figure above for its current value.',
    loading: 'Engaging hyperdrive…',
    ctaLabel: 'Look up any figure →',
    flag: { vintage: 'KENNER', motuc: 'VINTAGE COLLECTION', exclusive: 'EXCLUSIVE', reissue: 'RETRO' },
    hvTitle: 'Light Side vs. Dark Side',
    hvSub: 'The biggest grails on each side of the Force — Jedi and Rebellion facing the Sith and the Empire. Real eBay sold comps.',
    heroesLabel: 'Light Side',
    villainsLabel: 'Dark Side',
    linesTitle: 'The lines of the galaxy',
    linesSub: 'Four-plus decades of Star Wars, line by line. Open a line for its history and grails.',
    checkerTitle: 'Is it worth it?',
    checkerSub: 'Check any Star Wars figure against real eBay sold comps — instantly.',
    checkerLoading: 'Engaging hyperdrive…',
    checkerMiss: 'No comps on record for that one yet — try another name.',
    checkerError: 'The signal was lost. Try again in a moment.',
    storyLabel: 'The Star Wars figure story',
    statsAria: 'Star Wars figures by the numbers',
    statsLinesLabel: 'lines in the galaxy',
  },
}

/** TRANSFORMERS — "the Cybertronian war" (S41, hub #3 of the consolidated rollout).
 *  Whole-fandom hub over `transformers` (1,592, all Hasbro — single-MFR). Faction duality
 *  AUTOBOT vs DECEPTICON (curated character map; faction is not a KB field). Centerpiece =
 *  `faction-seam`: two ORIGINAL faction-mask glyphs confronting on the seam (azure guardian
 *  visor LEFT, violet predatory mask RIGHT — NOT the TM Autobot/Decepticon insignia). */
const TRANSFORMERS: HubTheme = {
  fandom: 'transformers',
  dataKey: 'transformers',
  genre: 'transformers',
  paletteNote: 'gunmetal Cybertron; Autobot azure+brass LEFT vs Decepticon violet+crimson RIGHT; faction-mask seam, no TM insignia',
  seam: true,
  centerpiece: 'faction-seam',
  intelMode: 'table',
  lore: TRANSFORMERS_LINE_LORE,
  facts: { items: TRANSFORMERS_FACTS, promptIdle: 'Intercept a transmission…', promptMore: 'Decode the next packet.', glyph: 'faction' },
  faqs: TRANSFORMERS_FAQS,
  era: { start: '1984', label: '40+ years' },
  voice: {
    kicker: 'MORE THAN MEETS THE EYE',
    heroLead:
      'Forty years of the war between Autobots and Decepticons in plastic — from the 1984 G1 molds to Masterpiece and Studio Series — with real sold comps. Find your figure.',
    searchPlaceholder: 'Search any bot on either side…',
    intelHeader: 'The grails — most valuable now',
    intelSub: 'Real eBay sold comps, ranked. Every name opens its figure page.',
    emptyState: 'No comps on record for that one yet. Search any figure above for its current value.',
    loading: 'Rolling out…',
    ctaLabel: 'Look up any figure →',
    flag: { vintage: 'G1', motuc: 'MASTERPIECE', exclusive: 'EXCLUSIVE', reissue: 'REISSUE' },
    hvTitle: 'Autobots vs. Decepticons',
    hvSub: 'The biggest grails on each side of the war — Optimus’s Autobots facing Megatron’s Decepticons. Real eBay sold comps.',
    heroesLabel: 'Autobots',
    villainsLabel: 'Decepticons',
    linesTitle: 'The lines of Cybertron',
    linesSub: 'Four decades of Transformers, line by line. Open a line for its history and grails.',
    checkerTitle: 'Is it worth it?',
    checkerSub: 'Check any Transformers figure against real eBay sold comps — instantly.',
    checkerLoading: 'Rolling out…',
    checkerMiss: 'No comps on record for that one yet — try another name.',
    checkerError: 'Transmission lost. Try again in a moment.',
    storyLabel: 'The Transformers story',
    statsAria: 'Transformers figures by the numbers',
    statsLinesLabel: 'lines of Cybertron',
  },
}

export const HUB_THEMES: Record<string, HubTheme> = {
  'masters-of-the-universe-hub': MOTU,
  'gi-joe-hub': GIJOE,
  'wwe-elite-hub': WWE,
  'jakks-hub': JAKKS,
  'wrestling-hub': WRESTLING,
  'star-wars-black-series-hub': STAR_WARS,
  'transformers-hub': TRANSFORMERS,
}

export function getHubTheme(slug: string): HubTheme | null {
  return HUB_THEMES[slug] ?? null
}

export type TopComp = {
  figure_id: string
  name: string
  line: string
  price: number
  sold_count: number
  last_sold: string | null
  flag: string
  image?: string | null
  url: string
}
export type TopCompPayload = {
  fandom: string
  generated_at: string
  source: string
  figures: TopComp[]
}

// Precomputed comps registry — one static entry per fandom whose nightly data exists.
const TOP_COMPS: Record<string, TopCompPayload> = {
  'masters-of-the-universe': motuTopComps as unknown as TopCompPayload,
  'gi-joe': gijoeTopComps as unknown as TopCompPayload,
  'wwe-elite': wweTopComps as unknown as TopCompPayload,
  'wrestling-jakks': jakksTopComps as unknown as TopCompPayload,
  'wrestling': wrestlingTopComps as unknown as TopCompPayload,
  'star-wars': starWarsTopComps as unknown as TopCompPayload,
  'transformers': transformersTopComps as unknown as TopCompPayload,
}

export type VaultFigure = { figure_id: string; name: string; price: number; sold_count: number; flag: string; image?: string | null; url: string }
export type Vault = { line: string; line_slug: string; count: number; priced_count: number; top: VaultFigure[] }
export type VaultPayload = { fandom: string; generated_at: string; source: string; vaults: Vault[] }

const VAULTS: Record<string, VaultPayload> = {
  'masters-of-the-universe': motuVaults as unknown as VaultPayload,
  'gi-joe': gijoeVaults as unknown as VaultPayload,
  'wwe-elite': wweVaults as unknown as VaultPayload,
  'wrestling-jakks': jakksVaults as unknown as VaultPayload,
  'star-wars': starWarsVaults as unknown as VaultPayload,
  'transformers': transformersVaults as unknown as VaultPayload,
}

// §0 canonical-link fix (2026-07-25): every `url` field baked into these
// nightly-generated JSON payloads (build-fandom-{vaults,top-comps,heroes-villains}.mjs)
// is the non-canonical /figure/<fid> form. Resolve from figure_id through kb.ts
// at load time instead of regenerating the data -- keeps a single source of
// truth rather than adding a second generated-URL artifact that can drift the
// way figureIdToPrettyPath.generated.json already has. Falls back to the
// baked url if the fid no longer resolves in the KB (dropped/renamed figure).
function resolvedUrl(figureId: string, bakedUrl: string): string {
  const kb = getFigureById(figureId)
  return kb ? prettyFigureUrl(kb) : bakedUrl
}

export async function loadVaults(dataKey: string): Promise<VaultPayload | null> {
  const payload = VAULTS[dataKey]
  if (!payload) return null
  return {
    ...payload,
    vaults: payload.vaults.map((v) => ({
      ...v,
      top: v.top.map((f) => ({ ...f, url: resolvedUrl(f.figure_id, f.url) })),
    })),
  }
}

/** Heroes-vs-Villains curated band — top hero-side grails facing villain-side across the seam. */
export type HvFigure = { figure_id: string; name: string; char: string; line: string; price: number; sold_count: number; flag: string; image?: string | null; url: string }
export type HeroesVillainsPayload = { fandom: string; generated_at: string; source: string; heroes: HvFigure[]; villains: HvFigure[] }

const HEROES_VILLAINS: Record<string, HeroesVillainsPayload> = {
  'masters-of-the-universe': motuHeroesVillains as unknown as HeroesVillainsPayload,
  'gi-joe': gijoeHeroesVillains as unknown as HeroesVillainsPayload,
  'wwe-elite': wweHeroesVillains as unknown as HeroesVillainsPayload,
  'wrestling-jakks': jakksHeroesVillains as unknown as HeroesVillainsPayload,
  'star-wars': starWarsHeroesVillains as unknown as HeroesVillainsPayload,
  'transformers': transformersHeroesVillains as unknown as HeroesVillainsPayload,
}

export async function loadHeroesVillains(dataKey: string): Promise<HeroesVillainsPayload | null> {
  const payload = HEROES_VILLAINS[dataKey]
  if (!payload) return null
  return {
    ...payload,
    heroes: payload.heroes.map((f) => ({ ...f, url: resolvedUrl(f.figure_id, f.url) })),
    villains: payload.villains.map((f) => ({ ...f, url: resolvedUrl(f.figure_id, f.url) })),
  }
}

export async function loadTopComps(dataKey: string): Promise<TopCompPayload | null> {
  const payload = TOP_COMPS[dataKey]
  if (!payload) return null
  return {
    ...payload,
    figures: payload.figures.map((f) => ({ ...f, url: resolvedUrl(f.figure_id, f.url) })),
  }
}
