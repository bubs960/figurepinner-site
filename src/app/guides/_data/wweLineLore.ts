/**
 * wweLineLore.ts -- per-line lore for the WWE Elite FandomHub accordion.
 * Keyed by the exact line display name emitted in fandom-vaults/wwe-elite.json
 * (grouped by KB product_line within the `wrestling` fandom, Elite tier only).
 * Voice = collector register, light kayfabe (one real term per line, never forced).
 * Every claim traces to the WWE Elite section of COLLECTOR-FACT-LEDGER (banked S40)
 * + the line names themselves. ASCII punctuation.
 */

import type { VaultLore } from './motuVaultLore'

export const WWE_LINE_LORE: Record<string, VaultLore> = {
  'Elite': {
    era: '2010-present - 6-inch core',
    teaser: 'The collector core. 849 figures and counting -- this is where the real money moves.',
    lore: "Mattel has run WWE Elite since taking the license from Jakks in 2010, and it is the line that turned WWE figures into an adult-collector standard. The 6-inch Elite spec is the draw: 30-plus points of articulation, an ab-crunch torso, swappable hands and heads, and TrueFX face-scan deco. The long-running numbered mainline series is checklist culture -- collectors chase complete runs. Standard retail figures mostly sell at or near retail; the value concentrates in the exclusives, the early/short-run series, and the occasional prototype (the Jeff Hardy Series 1 prototype is the famous volatile one).",
  },
  'Elite Legends': {
    era: 'Elite - classic-era sub-line',
    teaser: 'The Elite spec aimed at the legends -- retired names the mainline skips.',
    lore: "Elite Legends is the sub-line that puts the modern Elite treatment on classic-era and retired wrestlers the numbered mainline does not regularly cover. For collectors who came up on the territory and Attitude eras, this is the nostalgia tier, and the harder-to-find legends carry real premiums over the standard releases.",
  },
  'Ultimate Edition': {
    era: 'premium tier - entrance gear',
    teaser: 'The top of the ladder -- multiple heads, posable entrance gear, the works.',
    lore: "Ultimate Edition is the premium tier above Elite: multiple swappable heads, extra hands, and detailed, posable entrance gear built for display. It sits at the top of Mattel's ladder (Basic/Main Event -> Elite -> Ultimate Edition). Priced and built as deluxe collector pieces, with the marquee characters and the harder waves holding value best.",
  },
  'Elite Greatest Hits': {
    era: 'Elite - reissue / compilation',
    teaser: 'The compilation series -- fan-favorite past Elites brought back.',
    lore: "Elite Greatest Hits is a compilation/reissue series that re-releases sought-after past Elite figures for collectors who missed them the first time. As a reissue line it mostly tracks retail, with value depending on which specific figure was previously hard to find.",
  },
  'Elite Monday Night War': {
    era: 'Elite - Monday Night War theme',
    teaser: 'The themed sub-line built around the WWF-vs-WCW ratings war.',
    lore: "Elite Monday Night War is a themed Elite sub-line organized around the late-90s WWF-versus-WCW ratings war -- the era a lot of current collectors grew up on. Themed two-packs and attire-specific releases drive the interest here.",
  },
  'Elite Royal Rumble': {
    era: 'Elite - Royal Rumble theme',
    teaser: 'Event-themed Elites tied to the Rumble.',
    lore: "Elite Royal Rumble is the event-themed sub-line tied to the Royal Rumble. Like the other themed Elite runs, value is character- and wave-dependent, with the standouts being the figures collectors actually display in their Rumble setups.",
  },
  'Defining Moments': {
    era: 'Elite - iconic-moment deco',
    teaser: 'The iconic-moment deco line -- and home of the line\'s $20,000 ghost.',
    lore: "Defining Moments recreates a wrestler at a specific iconic career moment, with attire-accurate deco aimed squarely at collectors. It is also home to the line's crown grail: the Ultimate Warrior 'Granite' figure (2014) was never released and reportedly reaches around $20,000 -- a figure that essentially does not exist commanding a price most complete shelves never will.",
  },
  'Elite From the Vault': {
    era: 'Elite - vault reissues',
    teaser: 'Older sought-after Elites pulled back out of the vault.',
    lore: "Elite From the Vault is a reissue line that brings older, sought-after Elite figures back to retail. It exists to relieve the aftermarket pressure on the hardest-to-find past releases, so values here mostly track retail unless a specific figure stays scarce even after the reissue.",
  },
  'Elite NXT TakeOver': {
    era: 'Elite - NXT brand',
    teaser: 'The NXT-brand sub-line -- developmental call-ups in plastic.',
    lore: "Elite NXT TakeOver is the NXT-brand sub-line, covering the developmental roster and call-ups. Collectors who follow NXT chase the early figures of wrestlers before they broke onto the main roster, and a debut-era figure of a future main-event name can run a premium.",
  },
  'Ultimate Edition Coliseum Collection': {
    era: 'Ultimate - Coliseum Video theme',
    teaser: 'Ultimate-tier sets themed to the old Coliseum Video tapes.',
    lore: "The Ultimate Edition Coliseum Collection wraps the premium Ultimate spec in nostalgia for the old Coliseum Video home-tape era -- deluxe figures with retro-themed packaging and entrance gear. A premium-tier display piece aimed at collectors who remember the tapes.",
  },
}
