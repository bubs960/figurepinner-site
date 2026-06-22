/**
 * transformersLineLore.ts — per-line lore for the Transformers hub accordion (S41).
 * Keyed by the vault DISPLAY name (== `v.line` from build-fandom-vaults). Lines without
 * an entry fall back to a neutral teaser. Every claim traces to the Transformers section
 * of COLLECTOR-FACT-LEDGER (banked web S41). No fabrication.
 */

import type { VaultLore } from './motuVaultLore'

export const TRANSFORMERS_LINE_LORE: Record<string, VaultLore> = {
  'G1': {
    era: '1984–1990',
    teaser: 'The line that started it all — repurposed Diaclone and Micro Change molds.',
    lore: 'Generation 1 ran 1984–1990. Every 1984 figure was a rebranded Takara Diaclone or Micro Change mold that Hasbro licensed after the 1983 Tokyo Toy Show. The grails live here: a sealed 1984 Optimus Prime with trailer is the holy grail, a mint Jetfire and the "Pepsi" Optimus have each cleared nearly $25,000 at auction, and a Soundwave mint-in-sealed-box complete with all five cassettes is the connoisseur\'s prize. Completeness — every accessory, every cassette — is everything in G1.',
  },
  'Vintage G1 Reissue': {
    era: '2002–now',
    teaser: 'Official reissues of the G1 molds — the affordable way into the classics.',
    lore: 'The Vintage G1 Reissue program brings back the original G1 tooling in officially licensed runs (often Walmart and Hasbro-exclusive). They scratch the G1 itch at a fraction of a sealed vintage price — but collectors track which reissue, which year, and which deco, because some reissues are themselves now scarce.',
  },
  'Masterpiece': {
    era: '2003–now',
    teaser: 'The collector-grade, anime-accurate adult line.',
    lore: 'Masterpiece (Takara Tomy) is the premium, anime-accurate, adult-collector line — MP-10 Optimus Prime, MP-36 Megatron — engineered to be what G1 represented in 1984 with modern fidelity. It holds value: discontinued editions like MP-04 Convoy with trailer and MP-13 Soundwave already trade at 3–5x retail. The line where transformation complexity and shelf presence justify the price.',
  },
  'Studio Series': {
    era: '2018–now',
    teaser: 'Movie-accurate figures with scene-specific detail.',
    lore: 'Studio Series renders the live-action movie (and animated) designs at collector scale, each figure tied to a specific film scene with a numbered, themed package. It is the deepest modern mainline; value concentrates in the leader-class figures, the deluxe short-packs, and the exclusives.',
  },
}
