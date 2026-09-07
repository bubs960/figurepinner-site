// guideFandom.ts — which fandom a guide belongs to, derived from its slug, and
// the related-guides picks per KB fandom.
//
// Release T (2026-09-07, external audit F8, webaudit-verified): the figure
// page's "New to pricing?" strip hardcoded three WRESTLING guides for every
// figure (Vader linked "the most valuable vintage wrestling figures"), and the
// guide page's "More guides" block picked the three most recently updated
// articles regardless of subject (the Marvel guide offered DC + MOTU). Articles
// carry no fandom field, so the slug is the key; keep this map in step with
// src/data/kbTypes.ts SLUG_TO_FANDOM (marvel -> marvel-comics, gijoe -> gi-joe,
// teenage-mutant-ninja-turtles -> tmnt; everything else is identity).

export type GuideFandom =
  | 'wrestling' | 'marvel-comics' | 'star-wars' | 'dc' | 'transformers' | 'gi-joe'
  | 'masters-of-the-universe' | 'tmnt' | 'neca' | 'mythic-legions' | 'power-rangers'
  | 'spawn' | 'general'

const SLUG_RULES: Array<[RegExp, GuideFandom]> = [
  [/wwe|wwf|wrestl|aew|jakks|ljn|ultimate-warrior|tully-blanchard|hasbro-wwf|whatnot-action-figure-show|whatnot-show-prep|red-white-blue/, 'wrestling'],
  [/marvel|hope-summers/, 'marvel-comics'],
  [/star-wars|black-series|kenner|swvc/, 'star-wars'],
  [/\bdc\b|dc-|batman|multiverse|dc-universe-classics/, 'dc'],
  [/transformers|g1-/, 'transformers'],
  [/gi-joe|classified|action-force/, 'gi-joe'],
  [/motu|masters-of-the-universe|masterverse/, 'masters-of-the-universe'],
  [/tmnt/, 'tmnt'],
  [/neca/, 'neca'],
  [/mythic-legions/, 'mythic-legions'],
  [/power-rangers/, 'power-rangers'],
  [/spawn|mcfarlane-sports/, 'spawn'],
]

export function guideFandom(slug: string): GuideFandom {
  for (const [re, f] of SLUG_RULES) if (re.test(slug)) return f
  return 'general'
}

/** The hub guide per KB fandom (all slugs verified real in articles.ts). */
export const FANDOM_HUB_SLUG: Partial<Record<GuideFandom, string>> = {
  'wrestling': 'wrestling-hub',
  'marvel-comics': 'marvel-legends-hub',
  'star-wars': 'star-wars-black-series-hub',
  'dc': 'dc-multiverse-hub',
  'transformers': 'transformers-hub',
  'gi-joe': 'gi-joe-hub',
  'masters-of-the-universe': 'masters-of-the-universe-hub',
  'tmnt': 'tmnt-hub',
  'neca': 'neca-hub',
  'mythic-legions': 'mythic-legions-hub',
}

const HUB_ANCHOR: Partial<Record<GuideFandom, string>> = {
  'wrestling': 'how to price a figure before you buy',
  'marvel-comics': 'the Marvel Legends price guide',
  'star-wars': 'the Star Wars Black Series price guide',
  'dc': 'the DC Multiverse price guide',
  'transformers': 'the Transformers collecting guide',
  'gi-joe': 'the G.I. Joe price guide',
  'masters-of-the-universe': 'the Masters of the Universe price guide',
  'tmnt': 'the TMNT collecting guide',
  'neca': 'the NECA price guide',
  'mythic-legions': 'the Mythic Legions price guide',
}

/** Map a KB fandom value (figure.fandom) onto a guide fandom; NECA rollup fandoms collapse to 'neca'. */
export function guideFandomForKb(kbFandom: string | null | undefined): GuideFandom {
  const f = (kbFandom ?? '').toLowerCase()
  if (['horror', 'aliens-predator', 'terminator', 'robocop', 'scifi', 'pop-culture', 'generic-fantasy'].includes(f)) return 'neca'
  if (f === 'marvel') return 'marvel-comics'
  if (f === 'gijoe') return 'gi-joe'
  if (f === 'teenage-mutant-ninja-turtles') return 'tmnt'
  const known: GuideFandom[] = ['wrestling', 'marvel-comics', 'star-wars', 'dc', 'transformers', 'gi-joe', 'masters-of-the-universe', 'tmnt', 'neca', 'mythic-legions', 'power-rangers', 'spawn']
  return (known as string[]).includes(f) ? (f as GuideFandom) : 'general'
}

/** The figure-page "New to pricing?" strip: the fandom's hub + two evergreen method guides. Wrestling keeps its original trio. */
export function relatedGuidesForFandom(kbFandom: string | null | undefined): Array<{ href: string; anchor: string }> {
  const f = guideFandomForKb(kbFandom)
  if (f === 'wrestling') {
    return [
      { href: '/guides/read-ebay-sold-listings', anchor: 'how to read eBay sold listings' },
      { href: '/guides/how-to-price-wrestling-figures', anchor: 'how to price a figure before you buy' },
      { href: '/guides/most-valuable-vintage-wrestling-figures', anchor: 'the most valuable vintage wrestling figures' },
    ]
  }
  const hub = FANDOM_HUB_SLUG[f]
  const out: Array<{ href: string; anchor: string }> = [
    { href: '/guides/read-ebay-sold-listings', anchor: 'how to read eBay sold listings' },
    { href: '/guides/sealed-vs-loose-action-figures', anchor: 'what sealed vs. loose does to a price' },
  ]
  if (hub) out.push({ href: `/guides/${hub}`, anchor: HUB_ANCHOR[f] ?? 'the price guide for this line' })
  else out.push({ href: '/guides/how-to-find-action-figure-values', anchor: 'how to find any action figure value' })
  return out
}
