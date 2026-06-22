/**
 * starWarsLineLore.ts — per-line lore for the Star Wars hub line accordion (S41).
 * Keyed by the vault DISPLAY name (== `v.line` from build-fandom-vaults). Lines without
 * an entry fall back to a neutral teaser in FandomLineSections — so this need not be
 * exhaustive. Every claim traces to the Star Wars section of COLLECTOR-FACT-LEDGER
 * (banked web S41). No fabrication.
 */

import type { VaultLore } from './motuVaultLore'

export const STAR_WARS_LINE_LORE: Record<string, VaultLore> = {
  '6" Black Series': {
    era: '2013–now',
    teaser: 'The 6-inch line that gave Star Wars the Marvel Legends treatment.',
    lore: 'The Black Series launched in 2013 as Hasbro\'s premium 6-inch line — the first retail wave (Aug 1, 2013) was Luke Skywalker X-Wing Pilot, Darth Maul, R2-D2, and a Sandtrooper, in the now-nostalgic orange-accent packaging. It is the modern collector standard: numbered, phased, and chased. Early orange-line figures and short-packed waves carry the premium; the first figure collectors actually got was a Boba Fett + Han-in-Carbonite SDCC exclusive that sold out fast.',
  },
  'The Vintage Collection': {
    era: '2010–2012, 2018–now',
    teaser: 'The 3.75-inch premium line with the Kenner-homage cardbacks.',
    lore: 'The Vintage Collection (TVC) is the 3.75-inch collector line on classic Kenner-style cardbacks. It first ran 2010–2012 ("VC 1.0"), then relaunched in 2018 ("VC 2.0") and has run since. Collectors favor it for two reasons: it stays cheaper than the 6-inch Black Series, and the 3.75-inch sculpts often rival or beat the 6-inch figures on paint detail — plus the scale works with the vintage vehicles and playsets for world-building.',
  },
  'Kenner Vintage Collection': {
    era: '1977–1985',
    teaser: 'Where it all started — the original 3.75-inch standard.',
    lore: 'The original Kenner line (1977–1985) created the 3.75-inch small-scale format that became the industry standard — the same format Hasbro later revived for G.I. Joe. This is the vintage prestige tier, and it holds the grails: the rocket-firing Boba Fett prototype (a graded example sold for $1.34 million; Kenner glued the rocket over safety fears, so only a handful exist) and the vinyl-cape Jawa on a 12-back card (AFA 80+ examples reach $30,000–$45,000). Card back count, condition, and AFA grade drive everything here.',
  },
  'Power of the Force': {
    era: '1985, 1995–2000',
    teaser: 'The line with the coins — and the "Power of the Force 2" 90s revival.',
    lore: 'Power of the Force originally closed out the vintage Kenner run in 1985 with collector coins, then the name returned in 1995 ("POTF2") as the line that relaunched Star Wars figures for the modern era — the famously over-muscled "Han Solo" sculpts collectors still joke about. A foundational nostalgia line for anyone who collected in the 90s.',
  },
  'Retro Collection': {
    era: '2019–now',
    teaser: 'Modern figures sculpted to look like 1977 Kenner.',
    lore: 'The Retro Collection is Hasbro\'s deliberate homage to the original Kenner line — 3.75-inch figures with vintage-style limited articulation and Kenner-look cardbacks, sold at a budget price. It scratches the vintage itch without the vintage price, and the early waves (the original-trilogy core) are the most sought.',
  },
}
