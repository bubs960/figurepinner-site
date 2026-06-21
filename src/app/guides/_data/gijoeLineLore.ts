/**
 * gijoeLineLore.ts -- per-line lore for the G.I. Joe FandomHub accordion.
 * Keyed by the exact line label emitted in fandom-vaults/gi-joe.json.
 * Each entry: a teaser (shown in the open body) + the lore + an era stat.
 * Voice = collector/filecard register; every claim traces to the GI Joe
 * section of COLLECTOR-FACT-LEDGER (banked S40) and the gi-joe-hub article.
 * ASCII punctuation only (Windows console safety + matches the article style).
 */

import type { VaultLore } from './motuVaultLore'

export const GIJOE_LINE_LORE: Record<string, VaultLore> = {
  'A Real American Hero': {
    era: '1982-1994 - o-ring 3.75-inch',
    teaser: 'The o-ring spine. 483 figures, and the line that decides who is a collector and who is a tourist.',
    lore: "The 1982-1994 ARAH line is the foundation of everything Joe. The internal rubber o-ring gave these figures their articulation, and four decades on it still defines the fandom -- calling it a defect is a poser tell. Completeness is brutal here: the o-ring perishes, the accessories are tiny and easily lost, and a figure with cracked gear or no weapons is a project, not a comp. Army-building drives a whole corner of the value -- one-per-case Cobra troopers and Vipers created real scarcity -- and the repaint sub-teams (Python Patrol, Tiger Force, Night Force) are their own chase. The crown grail is the 1982 straight-arm Snake Eyes; the mail-aways (Starduster, Steel Brigade) are the rarest tier.",
  },
  '6" Classified Series': {
    era: '2020-present - 6-inch 1:12',
    teaser: 'The modern revival -- finally the Marvel Legends treatment, with the modern Pulse-exclusive tax.',
    lore: "Classified (2020-present) is the 6-inch super-articulated line that gave Joes the premium-collector treatment superheroes got years earlier. It is the current center of gravity for new collectors. Standard retail figures mostly sell at or near retail; the value lives in the Hasbro Pulse exclusives and the HasLab vehicles. The fandom's running anxiety is the 'Classified slowdown' -- when a fan-demanded character goes Pulse-exclusive, it gets harder to find and pricier.",
  },
  '25th Anniversary': {
    era: '2007-2009 - swivel-chest 3.75-inch',
    teaser: 'The collector golden age before Classified -- thinking serious collecting started later is a poser tell.',
    lore: "The 25th Anniversary line (2007-2009) re-sculpted the 3.75-inch Joes with modern articulation and a swivel chest, dropping the o-ring. It was wildly popular and hard to keep in stock -- the pre-Classified collector golden age, with its own established secondary market. Treating Classified as the start of serious Joe collecting skips this era entirely.",
  },
  'Super7 ReAction': {
    era: 'Kenner-retro 3.75-inch',
    teaser: 'Vintage-style throwbacks in the Kenner-retro mold -- priced as nostalgia, not the premium tier.',
    lore: "Super7's ReAction line are 3.75-inch retro throwbacks built in the old Kenner five-points-of-articulation mold. Collectible and fun to chase, but priced as nostalgia novelties rather than premium pieces; value is product- and character-dependent, with the cartoon-deco and short-run figures carrying what premium there is.",
  },
  "Collector's Club": {
    era: 'club exclusives',
    teaser: 'The club-exclusive checklist -- army-builder sets and convention figures with limited runs.',
    lore: "The Collectors Club releases were members-only and convention exclusives, frequently army-builder sets and characters the mass line never got to. Limited production is the value engine: when a specific set was genuinely scarce it runs a real premium, and the club exclusives are a known completion target for vintage-style collectors.",
  },
  'Super7': {
    era: 'Ultimates 7-inch',
    teaser: 'The 7-inch Ultimates tier -- cartoon-accurate, premium, a different buyer entirely.',
    lore: "Super7's Ultimates are the 7-inch, highly-detailed, cartoon-accurate premium figures -- a separate buyer from the 3.75-inch crowd. Priced as deluxe collector pieces; value holds best on the marquee Cobra characters and the cartoon-accurate deco.",
  },
  '3.75" Retro Collection': {
    era: '2020-present - o-ring revival',
    teaser: 'The modern o-ring revival at mass retail -- and the budget fight with Classified.',
    lore: "The 3.75-inch Retro Collection is Hasbro's modern o-ring revival, sold mostly at mass retail and tracking the standard modern distribution pattern -- mostly retail-priced. Its existence alongside Classified is a live collector tension: the open complaint is that Hasbro can't fund both scales well. The HasLab o-ring figures and the harder retail drops are where the secondary value sits.",
  },
}
