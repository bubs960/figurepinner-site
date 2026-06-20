/**
 * motuVaultLore.ts — per-line lore for the MOTU Power Sword vaults.
 * Keyed by the line label emitted in fandom-vaults/masters-of-the-universe.json.
 * Each entry: a teaser (shown sealed) + the lore revealed when the sword is drawn.
 * Voice = the AFE collector voice from the original editorial, restructured per-line.
 */

export type VaultLore = { teaser: string; lore: string; era?: string }

export const MOTU_VAULT_LORE: Record<string, VaultLore> = {
  'Origins': {
    era: '2020–present · 5.5" retro',
    teaser: 'The line that was meant to put He-Man back on a Walmart peg — then got exiled online.',
    lore: 'Origins launched in 2020 as the 5.5-inch vintage-style line at a $15 price point. It is the largest MOTU line in the database, and that is exactly the problem: the supply is enormous and the distribution got worse, not better. Mattel moved more and more of it to Mattel Creations and online-exclusive drops — the fandom calls what follows the "can\'t find it in stores" death spiral. Most standard Origins figures sell loose for less than retail. The exceptions are the Creations/convention exclusives and deco variants. Before paying a premium on a loose Origins figure, check whether it was general-retail or an online-exclusive — that single fact sets the ceiling.',
  },
  'Mattel Classics': {
    era: '2008–2018 · MOTUC',
    teaser: '"I missed the sale day and have been paying for it ever since."',
    lore: 'Masters of the Universe Classics sold almost entirely through Mattycollector\'s subscription-and-sale-day model — a system that routinely crashed its own servers and trained an entire fandom to panic-buy. This is the line current collectors mean when they say "the good stuff." The Four Horsemen sculpted it, and it shows. Supply on individual figures was genuinely constrained in a way Origins never has been, and the hard late-run figures and Club Grayskull subset run real premiums. Honest caveat: Mattel never published print runs, so any specific scarcity claim is an estimate, not a confirmed number.',
  },
  'Original': {
    era: '1982–1987 · vintage',
    teaser: 'The vintage market underneath everything else — and the home of the "vintage taint" joke.',
    lore: 'The original 1982–1987 Mattel line is the vintage bedrock. Carded-versus-loose splits the value in two: a loose vintage He-Man with armor and weapon is a $20–$40 figure, while the same figure carded in decent shape is a different order of magnitude. The fandom\'s favorite running joke lives here — the "vintage taint," the flesh-tone crotch-wash paint Mattel used, which the community has never stopped finding funny. Value drivers: completeness (right weapon, right armor, the mini-comic), card condition for sealed examples, and the harder later-wave figures that shipped in lower quantities as the line wound down.',
  },
  'Masterverse': {
    era: '2021–present · 7" articulated',
    teaser: 'The modern premium tier — watched nervously for slowdown signs.',
    lore: 'Masterverse is the 7-inch fully-articulated modern line, the current "premium" tier alongside Origins, including the Filmation-deco figures. Secondary value is still mostly retail-adjacent except for the exclusives. The fandom watches it for slowdown signs, and the 2026 movie tie-ins drew equal parts excitement and "movie lines have killed us before" dread — a well-earned reflex from a fandom that has been cancelled on before.',
  },
  'Mattel 200x': {
    era: '2002–2004 · the cancelled one',
    teaser: 'The line that died with its story half-told — which is exactly why some of it is gold.',
    lore: 'The 2002–2004 200X line was cancelled mid-run, and that cancellation is the value engine. The late-wave 200X figures that barely shipped are genuine grails for that sub-fandom, and the deeper-cut characters command real money — the same economics as a cancelled DCUC wave. If you came up on the 200X cartoon, this is your nostalgia tier, and the hard-to-finds are genuinely hard to find.',
  },
  'Eternia Minis': {
    era: 'blind-box',
    teaser: 'The blind-box tier — collectible, low-dollar, completionist bait.',
    lore: 'Eternia Minis are the blind-box small-format tier. Collectible and fun to chase, but low-dollar per unit — this is completionist and display territory more than secondary-market territory. The value, where it exists, is in sealed full sets and the occasional short-packed chase.',
  },
  'Super7': {
    era: 'Club Grayskull · ReAction',
    teaser: 'The $600 Snake Mountain crowdfund era — and the fandom splits hard on it.',
    lore: 'Super7\'s era covers Club Grayskull and the ReAction-adjacent figures, including the infamous $600 Snake Mountain crowdfund. The fandom splits hard: gratitude for keeping the brand alive versus resentment over pricing and quality — and serious MOTU people will police you for flattening that era into hero-or-villain. Value is uneven and product-dependent; some pieces hold, some don\'t.',
  },
  'Mondo': {
    era: 'premium 1/6-ish',
    teaser: 'The high-end display-piece tier — a different buyer entirely.',
    lore: 'Mondo is the high-end, roughly 1/6-scale premium-collectible tier — priced and built as display pieces rather than mass-market figures. A completely different buyer than the Origins peg-hunter. This is where the top of the MOTU comp charts lives: timed-edition and deluxe Mondo pieces are the line\'s genuine four-figure grails.',
  },
  'New Adventures of He-Man': {
    era: '1989 · space-future reboot',
    teaser: 'The space-future reboot. Defending it is, in fandom terms, a hipster position.',
    lore: 'New Adventures of He-Man is the 1989 space-future reboot — a niche-within-a-niche with a small but committed buyer base. Defending the NA line is, in fandom terms, a hipster position, worn with pride by the people who love it. Priced accordingly: mostly modest, with specific figures that the NA faithful chase.',
  },
  'Mattel Chronicles': {
    era: 'small-format',
    teaser: 'The small-format tier — collectible but low-dollar.',
    lore: 'Mattel Chronicles is a small-format tier — collectible but low-dollar per unit, a minor corner of the catalog. Worth knowing exists; rarely worth chasing for value alone.',
  },
}
