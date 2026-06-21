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
 */

// Precomputed top-comps JSON (nightly build-fandom-top-comps.mjs). STATIC imports —
// register each fandom's file here once its data exists. See loadTopComps() below.
import motuTopComps from '@/data/fandom-top-comps/masters-of-the-universe.json'
import motuVaults from '@/data/fandom-vaults/masters-of-the-universe.json'
import motuHeroesVillains from '@/data/fandom-heroes-villains/masters-of-the-universe.json'

export type HubFlagWording = { vintage?: string; motuc?: string; exclusive?: string; reissue?: string }

/** Per-fandom VOICE PACK — the unique LANGUAGE in every chrome string (Steve 6/20). */
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
}

export type HubTheme = {
  fandom: string          // KB fandom key, e.g. "masters-of-the-universe"
  dataKey: string         // top-comps json filename (== fandom)
  voice: VoicePack
  // Palette is applied as CSS vars via data-fandom attribute in globals.css.
  // Kept here only for reference/tests; the source of truth is the CSS block.
  paletteNote: string
}

/** MOTU — "Eternia / Obrero's misty Grayskull" (research-grounded, vintage-collector lead). */
const MOTU: HubTheme = {
  fandom: 'masters-of-the-universe',
  dataKey: 'masters-of-the-universe',
  paletteNote: 'pea-green + black stone, mist, Grayskull gold — painted/atmospheric, not clean-modern',
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
  },
}

export const HUB_THEMES: Record<string, HubTheme> = {
  'masters-of-the-universe-hub': MOTU,
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
}

/**
 * Load precomputed top comps for a fandom. Returns null if the nightly job has not
 * produced data yet (graceful degrade -- the hub hides the intel table).
 *
 * Build-safe: STATIC explicit imports keyed in TOP_COMPS, never a dynamic import
 * with an interpolated path (Next cannot reliably bundle those, and a missing file
 * would fail the build instead of degrading). Register each fandom's JSON here once
 * its nightly data exists; until then that hub renders without the table.
 */
export type VaultFigure = { figure_id: string; name: string; price: number; sold_count: number; flag: string; image?: string | null; url: string }
export type Vault = { line: string; line_slug: string; count: number; priced_count: number; top: VaultFigure[] }
export type VaultPayload = { fandom: string; generated_at: string; source: string; vaults: Vault[] }

const VAULTS: Record<string, VaultPayload> = {
  'masters-of-the-universe': motuVaults as unknown as VaultPayload,
}

export async function loadVaults(dataKey: string): Promise<VaultPayload | null> {
  return VAULTS[dataKey] ?? null
}

/** Heroes-vs-Villains curated band — top hero-side grails facing villain-side across the seam. */
export type HvFigure = { figure_id: string; name: string; char: string; line: string; price: number; sold_count: number; flag: string; image?: string | null; url: string }
export type HeroesVillainsPayload = { fandom: string; generated_at: string; source: string; heroes: HvFigure[]; villains: HvFigure[] }

const HEROES_VILLAINS: Record<string, HeroesVillainsPayload> = {
  'masters-of-the-universe': motuHeroesVillains as unknown as HeroesVillainsPayload,
}

export async function loadHeroesVillains(dataKey: string): Promise<HeroesVillainsPayload | null> {
  return HEROES_VILLAINS[dataKey] ?? null
}

export async function loadTopComps(dataKey: string): Promise<TopCompPayload | null> {
  return TOP_COMPS[dataKey] ?? null
}
