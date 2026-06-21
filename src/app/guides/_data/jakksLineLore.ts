/**
 * jakksLineLore.ts -- per-line lore for the Jakks-Pacific WWE FandomHub accordion.
 * Keyed by the exact line display name in fandom-vaults/wrestling-jakks.json
 * (wrestling fandom, manufacturer jakks-pacific, TNA excluded). Collector voice,
 * light kayfabe/nostalgia. Claims trace to the Jakks-Pacific section of
 * COLLECTOR-FACT-LEDGER (banked S40). ASCII punctuation. NOTE: the ledger's per-line
 * counts are web's inflated grep numbers; the accordion shows the REAL KB counts.
 */

import type { VaultLore } from './motuVaultLore'

export const JAKKS_LINE_LORE: Record<string, VaultLore> = {
  'Classic Superstars': {
    era: '2004-2009 - legend sculpts',
    teaser: 'The sacred line. High-end legend sculpts -- the one modern lines are still judged against.',
    lore: "Classic Superstars launched in 2004 and ran to 2009: high-end sculpts of WWF/WWE legends that became an instant fan favorite and the revered nostalgia line of the Jakks era. The reverence is real -- modern Mattel lines still get measured against it, and not knowing it is a poser tell. The grails live here too: the Classic Superstars ToyFare mail-away exclusives (roughly 100 units each) -- the Glow-in-the-Dark Undertaker, the Ultimate Warrior exclusive, the 'Bloody Funk U' Terry Funk -- are the most valuable Jakks figures going.",
  },
  'Ruthless Aggression': {
    era: '2002-2009 - action mainline',
    teaser: 'The gimmick-driven action mainline that defined the back half of the Jakks era.',
    lore: "Ruthless Aggression was Jakks' premier mainline from 2002-03 through 2009, replacing Titan Tron Live and R-3 Tech. The action-feature era -- spring-loaded gimmicks, deco churn, numbered-series checklist culture. Most are affordable shelf-army figures; value concentrates in the short-run series, the exclusives, and the early figures of stars who blew up later.",
  },
  'Deluxe Aggression': {
    era: 'Ruthless Aggression - deluxe',
    teaser: 'The deluxe, accessory-heavy cut of Ruthless Aggression.',
    lore: "Deluxe Aggression is the upscale tier of Ruthless Aggression -- bigger accessory loadouts and ring gear on the same action-era roster. The deluxe packs hold a bit more value where the character or the accessory set is sought-after.",
  },
  'Titan Tron Live': {
    era: '1999-2002 - Attitude-era mainline',
    teaser: 'The Attitude-era mainline that Ruthless Aggression replaced.',
    lore: "Titan Tron Live (TTL) was Jakks' mainline through the Attitude-era boom before Ruthless Aggression took over. Peak-WWF nostalgia for the collectors who grew up on that period; the figures of the era's biggest draws and the harder waves carry the value.",
  },
  'R-3 Tech': {
    era: 'action-feature era',
    teaser: 'An action-feature line that fed into Ruthless Aggression.',
    lore: "R-3 Tech was one of the action-feature lines (alongside Titan Tron Live) that Ruthless Aggression later absorbed. A transitional-era line; value is character- and condition-dependent.",
  },
  'Unmatched Fury': {
    era: 'static-pose display line',
    teaser: 'The static-pose, display-oriented Jakks tier.',
    lore: "Unmatched Fury was Jakks' static-pose, display-focused line -- less articulation, more sculpt-and-pose for the shelf. A display tier; value sits with the marquee names.",
  },
  'BCA': {
    era: 'Bone Crunching Action',
    teaser: 'Bone Crunching Action -- an early Jakks gimmick line.',
    lore: "BCA -- Bone Crunching Action -- is one of the early Jakks WWF gimmick lines built around an action feature. Early-era nostalgia; the period's top stars are the figures that move.",
  },
  'Build N Brawl': {
    era: 'mini scale',
    teaser: 'The mini-scale, build-the-ring tier.',
    lore: "Build N Brawl was the smaller-scale Jakks line whose figures came with ring and playset pieces to assemble. A budget tier then, a completionist niche now -- sealed sets carry what value there is.",
  },
  'Deluxe Classic': {
    era: 'Classic Superstars - deluxe',
    teaser: 'The deluxe cut of the Classic Superstars legends line.',
    lore: "Deluxe Classic is the upscale companion to Classic Superstars -- legend sculpts with extra accessories or larger figures, riding the same nostalgia reverence. The harder pieces run premiums.",
  },
  'Off the Ropes': {
    era: 'sub-line',
    teaser: 'A Jakks WWE sub-line for the era completist.',
    lore: '',
  },
  'Backlash': {
    era: 'PPV-themed line',
    teaser: 'A Backlash PPV-themed Jakks sub-line.',
    lore: '',
  },
  'Rebellion': {
    era: 'UK PPV-themed line',
    teaser: 'A Rebellion (UK PPV) themed Jakks sub-line.',
    lore: '',
  },
  'Rulers of the Ring': {
    era: 'themed sub-line',
    teaser: 'A themed Jakks WWE sub-line.',
    lore: '',
  },
  'Signature Jams': {
    era: 'entrance-music gimmick',
    teaser: 'The entrance-music gimmick sub-line.',
    lore: '',
  },
}
