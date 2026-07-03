/**
 * Red, White & Blue hub roster — July-4th seasonal character tiles.
 *
 * Campaign source: Bridge/STANDALONE-CAP-CAMPAIGN-PLAN-2026-07-03.md.
 * Tile rule (Steve): only characters where we HAVE images — the page
 * image-gates every entry at render, so listing a character here does not
 * guarantee a tile. seedFid entries are Steve-confirmed live figures whose
 * image anchors the tile.
 *
 * Permanent seasonal inventory — re-run every July 4th; extend the roster,
 * don't fork the page.
 */

export type RwbRosterEntry = {
  fandom: string
  character: string // KB character_canonical
  label: string
  tagline?: string
  seedFid?: string
}

export const RWB_ROSTER: RwbRosterEntry[] = [
  // Marvel
  {
    fandom: 'marvel-comics', character: 'captain-america', label: 'Captain America',
    tagline: 'The anchor — bin finds to Hot Toys grails. Know which end you’re holding.',
    seedFid: 'fp_marvel-comics_hasbro_marvel-legends_exclusive-deluxe_captain-america_306e5f',
  },
  {
    fandom: 'marvel-comics', character: 'captain-america-now', label: 'Captain America Now',
    tagline: 'Sam Wilson takes the shield',
    seedFid: 'fp_marvel-comics_hasbro_marvel-legends_captain-america-winter-s_captain-america-now_b42329',
  },
  { fandom: 'marvel-comics', character: 'iron-patriot', label: 'Iron Patriot', tagline: 'Stars-and-stripes armor' },
  { fandom: 'marvel-comics', character: 'us-agent', label: 'US Agent', tagline: 'The government-issue Cap' },

  // Wrestling
  {
    fandom: 'wrestling', character: 'mr-america', label: 'Mr. America',
    tagline: 'You know exactly who is under that mask',
    seedFid: 'fp_wrestling_mattel_elite_101_mr-america_1eb9fadba86e',
  },
  { fandom: 'wrestling', character: 'hulk-hogan', label: 'Hulk Hogan', tagline: 'The Real American himself' },
  { fandom: 'wrestling', character: 'sgt-slaughter', label: 'Sgt. Slaughter', tagline: 'And that’s an order' },
  { fandom: 'wrestling', character: 'kurt-angle', label: 'Kurt Angle', tagline: 'It’s true. It’s damn true.' },
  { fandom: 'wrestling', character: 'hacksaw-jim-duggan', label: 'Hacksaw Jim Duggan', tagline: 'HOOO! Tough guy with a 2x4 and a flag' },
  { fandom: 'wrestling', character: 'lex-luger', label: 'Lex Luger', tagline: 'The Lex Express, summer of ’93' },
  { fandom: 'wrestling', character: 'the-patriot', label: 'The Patriot', tagline: 'Del Wilkes behind the mask' },
  {
    fandom: 'wrestling', character: 'el-grande-americano', label: 'El Grande Americano',
    tagline: 'The most American luchador there is',
    seedFid: 'fp_wrestling_mattel_elite_126_el-grande-americano_4afeb0733a0e',
  },
  {
    fandom: 'wrestling', character: 'zack-ryder', label: 'Zack Ryder',
    tagline: 'Woo woo woo — US-gear Long Island Iced-Z',
    seedFid: 'fp_wrestling_mattel_elite_59_zack-ryder_025055',
  },
  {
    fandom: 'wrestling', character: 'miss-tessmacher', label: 'Miss Tessmacher',
    tagline: 'TNA Deluxe Impact',
    seedFid: 'fp_wrestling_jakks-pacific_tna-deluxe-impact_10_miss-tessmacher_2dae8c',
  },
  { fandom: 'wrestling', character: 'cody-rhodes', label: 'Cody Rhodes', tagline: 'The Americanightmare' },

  // G.I. Joe
  {
    fandom: 'gi-joe', character: 'general-hawk', label: 'General Hawk',
    tagline: 'G.I. Joe command',
    seedFid: 'fp_gi-joe_hasbro_collectors-club_action-figures_general-hawk_d5c42a',
  },
  { fandom: 'gi-joe', character: 'duke', label: 'Duke', tagline: 'A Real American Hero, first name on the roster' },
  { fandom: 'gi-joe', character: 'sgt-slaughter', label: 'Sgt. Slaughter (G.I. Joe)', tagline: 'The crossover drill instructor' },

  // DC
  { fandom: 'dc', character: 'wonder-woman', label: 'Wonder Woman', tagline: 'Red, white, blue and gold since 1941' },
  { fandom: 'dc', character: 'stargirl', label: 'Stargirl', tagline: 'Cosmic staff, stars and stripes' },

  // Spawn
  { fandom: 'spawn', character: 'super-patriot', label: 'Super-Patriot', tagline: 'McFarlane’s cybernetic patriot' },
]

/** Max fids sampled per character for the tile's live median range —
 *  keeps the ISR render's fan-out to the price-summary worker bounded. */
export const RWB_PRICE_SAMPLE_CAP = 12
