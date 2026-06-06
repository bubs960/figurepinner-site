/**
 * line-attributes-data.ts
 * Static lookup map: product_line slug → LineAttributes
 *
 * Used by the figure detail page to enrich the LoreInput when the KB figure
 * itself doesn't carry line_attributes (i.e., always, at launch).
 *
 * Keys must match KBFigure.product_line exactly.
 *
 * flavor: one evocative sentence shown in Zone 3 (LoreBand). Write for collectors,
 * not marketers — specifics beat superlatives.
 */

import type { LineAttributes } from './loreRenderer'

export const LINE_ATTRIBUTES: Record<string, LineAttributes> = {

  // ── Mattel WWE ───────────────────────────────────────────────────────────────

  'elite': {
    display_name: 'WWE Elite Collection',
    years: [2010, 2025],
    era_label: 'Modern Era',
    flavor: 'The Elite Collection brought collector-grade articulation to the mainstream WWE line — 30+ points of movement, interchangeable hands, and entrance accessories that quickly made each series a hunt.',
    predecessor_line_key: 'deluxe-aggression',
    successor_line_key: null,
    peak_demand: 'very_high',
    articulation_level: '30+ points',
    packaging_style: 'Clamshell blister with figure stand',
  },

  'basic': {
    display_name: 'WWE Basic',
    years: [2010, 2025],
    era_label: 'Modern Era',
    flavor: "Mattel's entry-level WWE line — fewer accessories but the same face-sculpt quality, making it the gateway drug for new collectors who later chase Elites.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'medium',
    articulation_level: '14 points',
    packaging_style: 'Open card back',
  },

  'ultimate-edition': {
    display_name: 'WWE Ultimate Edition',
    years: [2019, 2025],
    era_label: 'Modern Era',
    flavor: 'Mattel\'s premium top tier — fabric ring gear, extra head sculpts, and the most articulated WWE figure bodies ever produced. Secondary market premiums run 2–4× retail on first waves.',
    predecessor_line_key: 'elite',
    successor_line_key: null,
    peak_demand: 'very_high',
    articulation_level: '35+ points with ab crunch',
    packaging_style: 'Window box collector packaging',
  },

  'defining-moments': {
    display_name: 'Defining Moments',
    years: [2012, 2016],
    era_label: 'Modern Era',
    flavor: 'Single-figure releases each commemorating one iconic career match — the in-ring attire, the specific event, the moment frozen in plastic. Short run counts make these reliably collectible.',
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'high',
    articulation_level: '30+ points',
    packaging_style: 'Window box with event backdrop',
  },

  'entrance-greats': {
    display_name: 'Entrance Greats',
    years: [2010, 2014],
    era_label: 'Modern Era',
    flavor: "Early Mattel experiment pairing figure with entrance-replica props — the pyro, the title belt, the ramp accessory. Often overlooked at retail, now sought for the accessory completes.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'medium',
    articulation_level: '14 points',
    packaging_style: 'Large blister card',
  },

  'legends': {
    display_name: 'WWE Legends',
    years: [2010, 2025],
    era_label: 'Modern Era',
    flavor: "Mattel's ongoing tribute line to the past — territory-era gear, attitude-era face sculpts, and the first plastic immortality for many legends who missed the Jakks window entirely.",
    predecessor_line_key: 'classic-superstars',
    successor_line_key: null,
    peak_demand: 'high',
    articulation_level: '30+ points',
    packaging_style: 'Clamshell blister',
  },

  'retro': {
    display_name: 'Retro App Series',
    years: [2017, 2020],
    era_label: 'Modern Era',
    flavor: "Mattel paid homage to the Hasbro era with vintage-style sculpts and the original 5-point articulation — nostalgia bait that worked, selling out faster than any Mattel line since launch.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'high',
    articulation_level: '5 points',
    packaging_style: 'Vintage Hasbro-style card back',
  },

  'wwe-hall-of-fame': {
    display_name: 'Hall of Fame',
    years: [2012, 2025],
    era_label: 'Modern Era',
    flavor: "Exclusives timed to induction weekend — limited to event attendees or Target/Walmart runs, with the induction ceremony year stamped on the box. First-year HOF figures consistently appreciate.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'high',
    articulation_level: '30+ points',
    packaging_style: 'Collector window box',
  },

  'wwe-championship-showdown': {
    display_name: 'Championship Showdown',
    years: [2021, 2024],
    era_label: 'Modern Era',
    flavor: 'Two-pack reimaginings of dream matches and classic rivalries — each set a self-contained storytelling piece, with both figures sharing matched accessories and an event-specific display stand.',
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'high',
    articulation_level: '30+ points',
    packaging_style: 'Two-figure window box',
  },

  // ── Jakks Pacific ────────────────────────────────────────────────────────────

  'deluxe-aggression': {
    display_name: 'Deluxe Aggression',
    years: [2005, 2010],
    era_label: 'Attitude Era Closeout',
    flavor: 'The most detailed Jakks line before the licence ended — soft goods, multiple accessories, and head sculpts that improved dramatically from series 1 to the final waves. Series 15+ are the sweet spot.',
    predecessor_line_key: 'ruthless-aggression',
    successor_line_key: 'elite',
    peak_demand: 'high',
    articulation_level: '20+ points',
    packaging_style: 'Blister card with accessory tray',
  },

  'ruthless-aggression': {
    display_name: 'Ruthless Aggression',
    years: [2002, 2010],
    era_label: 'Ruthless Aggression Era',
    flavor: 'Jakks\'s workhorse line through the Ruthless Aggression years — the figures most WWE fans grew up with, each capture specific TV looks better than any prior line.',
    predecessor_line_key: null,
    successor_line_key: 'deluxe-aggression',
    peak_demand: 'medium',
    articulation_level: '16 points',
    packaging_style: 'Open card back',
  },

  'classic-superstars': {
    display_name: 'Classic Superstars',
    years: [2003, 2008],
    era_label: 'Golden & Attitude Era',
    flavor: 'The first line dedicated entirely to legends and retired stars — Jakks spent the sculpt budget on face accuracy, making these the definitive plastic versions of territory-era and golden-era talent.',
    predecessor_line_key: null,
    successor_line_key: 'legends',
    peak_demand: 'high',
    articulation_level: '16 points',
    packaging_style: 'Card back with vintage-style photo',
  },

  'best-of-the-best': {
    display_name: 'Best of the Best',
    years: [2006, 2009],
    era_label: 'Attitude Era Closeout',
    flavor: 'Jakks selecting their finest sculpts for a prestige repack — sometimes the only way to get a sold-out series figure at retail, the Best of the Best sets are underrated secondary picks.',
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'medium',
    articulation_level: '16 points',
    packaging_style: 'Premium blister card',
  },

  'pay-per-view': {
    display_name: 'Pay Per View Series',
    years: [2002, 2008],
    era_label: 'Ruthless Aggression Era',
    flavor: 'Event-specific packaging tied to WrestleMania, SummerSlam, and Survivor Series — the same Jakks tooling but with premium foil cards and event-accurate ring gear that the regular line skipped.',
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'medium',
    articulation_level: '16 points',
    packaging_style: 'Foil card back with event branding',
  },

  'survivor-series': {
    display_name: 'Survivor Series',
    years: [2002, 2008],
    era_label: 'Ruthless Aggression Era',
    flavor: 'Jakks\'s annual Survivor Series tie-in — team-themed packaging and occasionally exclusive team-colour attire variants not found in the main Ruthless Aggression run.',
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'medium',
    articulation_level: '16 points',
    packaging_style: 'Event foil card',
  },

  'summer-slam': {
    display_name: 'SummerSlam',
    years: [2002, 2008],
    era_label: 'Ruthless Aggression Era',
    flavor: 'SummerSlam event packaging with summer-specific attire on select figures — the event-exclusive deco variants are the reason completionists go deep on the Jakks run.',
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'medium',
    articulation_level: '16 points',
    packaging_style: 'Event foil card',
  },

  'wrestlemania': {
    display_name: 'WrestleMania',
    years: [2002, 2010],
    era_label: 'Ruthless Aggression Era',
    flavor: "WrestleMania-specific attire and championship accessories — Jakks made these the collector's event figures of each year, with Roman Numeral event branding on the card back.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'high',
    articulation_level: '16–20 points',
    packaging_style: 'Premium event foil card',
  },

  'two-tuff': {
    display_name: 'Two Tuff',
    years: [2003, 2007],
    era_label: 'Ruthless Aggression Era',
    flavor: 'Jakks budget two-pack series — same tooling, lower price point, often a vehicle for repack figures with swapped attire. Overlooked at retail, sometimes the only packaged version of a second-tier talent.',
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'low',
    articulation_level: '14 points',
    packaging_style: 'Two-figure blister card',
  },

  'off-the-ropes': {
    display_name: 'Off the Ropes',
    years: [2001, 2004],
    era_label: 'Attitude Era',
    flavor: "The bridge between the Attitude Era and Ruthless Aggression — Jakks's most dynamic action figures, posed mid-move with spring-loaded action mechanisms. Articulation traded for drama.",
    predecessor_line_key: null,
    successor_line_key: 'ruthless-aggression',
    peak_demand: 'medium',
    articulation_level: '8 points with action feature',
    packaging_style: 'Blister card with action callout',
  },

  // ── Hasbro ───────────────────────────────────────────────────────────────────

  'hasbro-wwf': {
    display_name: 'WWF Hasbro',
    years: [1990, 1994],
    era_label: 'Golden Era',
    flavor: "The golden-era collectible that defined an entire generation's childhood — Hasbro's chunky, cartoonishly powerful figures with spring-loaded action buttons are the most recognized wrestling toys ever made.",
    predecessor_line_key: 'ljn-wwf',
    successor_line_key: null,
    peak_demand: 'very_high',
    articulation_level: '5 points with action feature',
    packaging_style: 'Vintage card back with roster photo',
  },

  'wwf-hasbro': {
    display_name: 'WWF Hasbro',
    years: [1990, 1994],
    era_label: 'Golden Era',
    flavor: "The golden-era collectible that defined an entire generation's childhood — Hasbro's chunky, cartoonishly powerful figures with spring-loaded action buttons are the most recognized wrestling toys ever made.",
    predecessor_line_key: 'ljn-wwf',
    successor_line_key: null,
    peak_demand: 'very_high',
    articulation_level: '5 points with action feature',
    packaging_style: 'Vintage card back with roster photo',
  },

  // ── LJN ─────────────────────────────────────────────────────────────────────

  'ljn-wwf': {
    display_name: 'WWF Wrestling Superstars (LJN)',
    years: [1984, 1989],
    era_label: 'Rock \'n\' Wrestling Era',
    flavor: "LJN's solid-rubber giants — no articulation, pure presence. The first mass-market WWF figures, sized to dominate any toy shelf. Loose figures in good condition command serious prices from nostalgic collectors.",
    predecessor_line_key: null,
    successor_line_key: 'hasbro-wwf',
    peak_demand: 'high',
    articulation_level: 'None (solid rubber)',
    packaging_style: 'Oversized blister card',
  },

  'wwf-wrestling-superstars': {
    display_name: 'WWF Wrestling Superstars (LJN)',
    years: [1984, 1989],
    era_label: 'Rock \'n\' Wrestling Era',
    flavor: "LJN's solid-rubber giants — no articulation, pure presence. The first mass-market WWF figures, sized to dominate any toy shelf.",
    predecessor_line_key: null,
    successor_line_key: 'hasbro-wwf',
    peak_demand: 'high',
    articulation_level: 'None (solid rubber)',
    packaging_style: 'Oversized blister card',
  },

  // ── Marvel Legends ───────────────────────────────────────────────────────────

  'marvel-legends': {
    display_name: 'Marvel Legends',
    years: [2002, 2025],
    era_label: 'Modern Era',
    flavor: "Hasbro's crown jewel collector line — BAF pieces, comic-accurate decos, and a release cadence tied to MCU film cycles that makes wave timing as important as the figure itself.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'very_high',
    articulation_level: '32+ points',
    packaging_style: 'Window box with BAF part',
  },

  'toybiz-marvel-legends': {
    display_name: 'Marvel Legends (ToyBiz)',
    years: [2002, 2006],
    era_label: 'ToyBiz Era',
    flavor: "The original Legends run under ToyBiz — the figures that set the 6-inch collector standard and are now vintage benchmarks. Series 1–8 are the grail tier of the entire Legends timeline.",
    predecessor_line_key: null,
    successor_line_key: 'marvel-legends',
    peak_demand: 'very_high',
    articulation_level: '38+ points',
    packaging_style: 'Clamshell with figure stand and comic',
  },

  // ── Star Wars ────────────────────────────────────────────────────────────────

  'black-series': {
    display_name: 'Star Wars Black Series',
    years: [2013, 2025],
    era_label: 'Modern Era',
    flavor: "Hasbro's 6-inch premium tier — film-accurate face printing, cloth goods on select figures, and a SKU count deep enough that completionists have given up. The standard for modern Star Wars collecting.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'very_high',
    articulation_level: '28+ points',
    packaging_style: 'Window box, red and black branding',
  },

  'vintage-collection': {
    display_name: 'Vintage Collection',
    years: [2010, 2025],
    era_label: 'Modern Era',
    flavor: "Hasbro's deliberate throwback to the Kenner card back — 3.75-inch scale with super-articulation and vintage-style packaging that doubles as display art. Flips between fan-favourite demand spikes.",
    predecessor_line_key: 'power-of-the-force',
    successor_line_key: null,
    peak_demand: 'very_high',
    articulation_level: '14+ points',
    packaging_style: 'Vintage Kenner-style card back',
  },

  'power-of-the-force': {
    display_name: 'Power of the Force',
    years: [1995, 2000],
    era_label: 'Prequel Hype Era',
    flavor: "The over-muscled, neon-carded return of Star Wars to shelves — instantly recognizable for the buff proportions that made Kenner historians cringe and nostalgic collectors love in equal measure.",
    predecessor_line_key: null,
    successor_line_key: 'vintage-collection',
    peak_demand: 'medium',
    articulation_level: '6 points',
    packaging_style: 'Green foil card back',
  },

  // ── Transformers ────────────────────────────────────────────────────────────

  'masterpiece': {
    display_name: 'Transformers Masterpiece',
    years: [2003, 2025],
    era_label: 'Modern Era',
    flavor: "Takara Tomy's prestige tier — screen-accurate cartoon proportions, die-cast metal components, and transformation complexity that rewards patience. The standard every other Transformers line is measured against.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'very_high',
    articulation_level: 'Full transformation with 30+ articulated joints',
    packaging_style: 'Premium collector box with accessories',
  },

  'studio-series': {
    display_name: 'Studio Series',
    years: [2018, 2025],
    era_label: 'Modern Era',
    flavor: "Film-accurate Transformers at mass retail — each figure derived directly from the CGI model used in the Michael Bay films, with backdrop dioramas that collectors stack to build full scenes.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'high',
    articulation_level: '20+ points with full transformation',
    packaging_style: 'Window box with removable backdrop',
  },

  'generations': {
    display_name: 'Generations',
    years: [2010, 2025],
    era_label: 'Modern Era',
    flavor: 'The evergreen collector bridge — updated sculpts for G1 favourites at a mass-retail price point, with enough complexity to satisfy adult collectors and enough availability to stay affordable.',
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'high',
    articulation_level: '18+ points with transformation',
    packaging_style: 'Card back',
  },

  // ── G.I. Joe ─────────────────────────────────────────────────────────────────

  'classified-series': {
    display_name: 'G.I. Joe Classified Series',
    years: [2020, 2025],
    era_label: 'Modern Era',
    flavor: "Hasbro's 6-inch reboot of the G.I. Joe roster — premium deco, accessories-heavy, and a wave structure designed to build complete conflict-ready teams. The fastest-appreciating modern military figure line.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'very_high',
    articulation_level: '30+ points',
    packaging_style: 'Window box, branded black and green',
  },

  'a-real-american-hero': {
    display_name: 'A Real American Hero',
    years: [1982, 1994],
    era_label: 'Vintage Era',
    flavor: "The original 3.75-inch military figure run that defined a generation — file-card packaging that built each character's lore, O-ring construction, and vehicle compatibility that made the line a universe.",
    predecessor_line_key: null,
    successor_line_key: 'classified-series',
    peak_demand: 'very_high',
    articulation_level: '14 points (O-ring body)',
    packaging_style: 'Card back with file card cut-out',
  },

  // ── MOTU ────────────────────────────────────────────────────────────────────

  'masterverse': {
    display_name: 'Masterverse',
    years: [2021, 2025],
    era_label: 'Modern Era',
    flavor: "Mattel's adult-collector MOTU line — 7-inch scale, 30+ articulation points, and a scope wide enough to pull from every era of the franchise. Netflix Revelation and Origins waves coexist on the same peg.",
    predecessor_line_key: 'masters-of-the-universe-classics',
    successor_line_key: null,
    peak_demand: 'high',
    articulation_level: '30+ points',
    packaging_style: 'Window box',
  },

  'origins': {
    display_name: 'Masters of the Universe Origins',
    years: [2020, 2025],
    era_label: 'Modern Era',
    flavor: "The nostalgia-coded MOTU return — 5.5-inch vintage proportions with modern articulation added under the hood. Origins deliberately echoes the 1982 line while delivering enough movement for posing.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'high',
    articulation_level: '16 points',
    packaging_style: 'Vintage-inspired card back',
  },

  'masters-of-the-universe-classics': {
    display_name: 'Masters of the Universe Classics',
    years: [2008, 2016],
    era_label: 'Collector Era',
    flavor: "Mattel's subscription-only collector run through MattyCollector — 6-inch adult-collector figures with strict monthly drops and limited print runs. The Club Eternia subscription defined online collector culture for a decade.",
    predecessor_line_key: null,
    successor_line_key: 'masterverse',
    peak_demand: 'very_high',
    articulation_level: '23 points',
    packaging_style: 'Collector mailer box with bio card',
  },

  // ── TMNT ─────────────────────────────────────────────────────────────────────

  'neca-tmnt': {
    display_name: 'NECA TMNT Ultimates',
    years: [2020, 2025],
    era_label: 'Modern Era',
    flavor: "NECA's celebration of every TMNT era — Mirage comic, arcade game, and cartoon variants, each crammed with era-accurate accessories and multiple head sculpts. Wave sell-throughs in days.",
    predecessor_line_key: null,
    successor_line_key: null,
    peak_demand: 'very_high',
    articulation_level: '30+ points',
    packaging_style: 'Window box',
  },

  'playmates-tmnt': {
    display_name: 'Playmates TMNT',
    years: [1988, 2010],
    era_label: 'Vintage Era',
    flavor: "The original cartoon-era figures — Playmates turned a licensing afterthought into the best-selling toy line of the late 1980s. Vintage turtles in card condition are now serious collector currency.",
    predecessor_line_key: null,
    successor_line_key: 'neca-tmnt',
    peak_demand: 'very_high',
    articulation_level: '5 points',
    packaging_style: 'Classic card back with accessories',
  },
}

/**
 * Look up line attributes by product_line slug.
 * Normalizes the key before lookup to handle minor slug variations.
 */
export function getLineAttributes(productLine: string): LineAttributes | null {
  // Direct match
  if (LINE_ATTRIBUTES[productLine]) return LINE_ATTRIBUTES[productLine]

  // Normalized match: strip leading "wwe-" prefix
  const stripped = productLine.replace(/^wwe-/, '')
  if (LINE_ATTRIBUTES[stripped]) return LINE_ATTRIBUTES[stripped]

  return null
}
