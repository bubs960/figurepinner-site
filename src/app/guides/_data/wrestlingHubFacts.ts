/**
 * wrestlingHubFacts.ts — the "ring announcer" easter-egg pool + collector FAQ for the
 * GENERAL wrestling hub (the umbrella parent page, S41). EVERY fact traces to the
 * wrestling sections of COLLECTOR-FACT-LEDGER (LJN, Hasbro, Jakks, Mattel Elite, AEW
 * entries, banked S40–S41). No fabrication: the DEBUNKED "Andre-as-Hogan box error"
 * claim is NOT used. Voiced as a house ring-announcer calling four decades of history.
 * ASCII punctuation (Windows/console safe).
 */

export const WRESTLING_FACTS: string[] = [
  "Ladies and gentlemen -- four decades in one ring. It started in 1984 with the LJN 'Big Rubber Guys': eight inches of solid, unposeable rubber. Collectors still chase them harder than anything modern.",
  "When LJN folded, Hasbro picked up the WWF license and ran it 1990 to 1994 -- eleven waves of 4-inch figures, each with a spring-loaded signature move. The late-run cards like the 1-2-3 Kid are the Hasbro grails now.",
  "From 1996 to 2009 the belt belonged to Jakks Pacific. Their Classic Superstars legends are still treated as sacred -- modern lines get judged against them to this day.",
  "In 2010 Mattel took the title and turned wrestling figures into an adult-collector phenomenon: the Elite line, TrueFX faces, thirty-plus points of articulation.",
  "The challenger brand arrived in 2020 -- Jazwares' AEW Unrivaled Collection, 25 points of articulation and real 3D scans, opening with Cody, Kenny Omega, the Young Bucks and Jericho.",
  "The biggest grails cross every era: a graded mail-away can clear five figures, a Jakks ToyFare exclusive of 100 units hits the high hundreds, and the unreleased Ultimate Warrior 'Granite' Defining Moments figure has been valued around twenty thousand dollars.",
  "One ring, every promotion. Whatever era you started in -- rubber, spring-action, Classic Superstars, Elite or AEW -- there is a shelf here with your name on it.",
]

export const WRESTLING_FAQS: { q: string; a: string }[] = [
  {
    q: 'What are the main eras of wrestling action figures?',
    a: "Five, roughly: LJN's 8-inch rubber 'Big Rubber Guys' (1984-89), Hasbro's 4-inch spring-action WWF line (1990-94), the Jakks Pacific era (1996-2009, split between Classic Superstars legends and the Ruthless Aggression action mainline), Mattel's WWE Elite collector era (2010-now), and the AEW/Jazwares challenger era (2020-now). A boutique/indie revival (Zombie Sailor, Chella, Boss Fight, Super7) runs alongside the modern lines.",
  },
  {
    q: 'Which wrestling figures are the most valuable?',
    a: "The crown grails span makers: the unreleased Ultimate Warrior 'Granite' Defining Moments figure (Mattel, ~$20,000), Jakks Classic Superstars ToyFare exclusives limited to ~100 units (Glow-in-the-Dark Undertaker, Ultimate Warrior, ~$500-$800), and the scarce late-run LJN and Hasbro cards. Our grails table above pulls the real top sold comps across every maker.",
  },
  {
    q: 'LJN vs Hasbro vs Jakks vs Mattel vs AEW — which should I collect?',
    a: "It depends on what you want. LJN is the vintage rubber prestige tier (display, not articulation). Hasbro is nostalgic, cheap to start, with a rare late-series tail. Jakks Classic Superstars is the revered legend-sculpt line. Mattel Elite is the modern collector standard with the deepest roster. AEW/Jazwares is the modern challenger with strong articulation. Most collectors specialize by era — which is exactly why we split the hubs.",
  },
  {
    q: 'What is the difference between the Elite hub and the Jakks hub?',
    a: "They are manufacturer-scoped. The Elite hub covers Mattel's WWE Elite collector line (2010-now); the Jakks hub covers the Jakks Pacific era (1996-2009). They list completely different figures, so neither overlaps the other. This page is the umbrella over both, plus the vintage and boutique makers that do not have their own hub yet.",
  },
]
