/**
 * character-notes-data.ts
 * Static lookup map: character_canonical slug → CharacterNotes
 *
 * notes: one sentence shown as LoreBand sentence 3. Write for collectors —
 * specific details, secondary market context, why this character matters to completionists.
 *
 * Keys must match KBFigure.character_canonical exactly.
 */

import type { CharacterNotes } from './loreRenderer'

export const CHARACTER_NOTES: Record<string, CharacterNotes> = {

  // ── WWE Main Event ────────────────────────────────────────────────────────────

  'john-cena': {
    display_name: 'John Cena',
    notes: 'Mattel released Cena in 80+ distinct configurations across 15 years — the 2012 Defining Moments and 2023 tribute run anchor the grail tiers, with mid-run chase variants (2016-2019 exclusives) commanding 3-5x retail on secondary; completionist checklists routinely hit 60+ figures.',
    peak_years: [2005, 2023],
    also_known_as: ['The Champ', 'Super Cena', 'Doctor of Thuganomics'],
  },

  'the-rock': {
    display_name: 'The Rock',
    notes: "Rock's secondary market tracks his Hollywood cycle — every Mattel return spike coincided with film projects, and the 2011 Legends removable elbow pad became the hobby's most counterfeited WWE figure, making authentication critical for MOC buyers seeking the genuine variant.",
    peak_years: [1998, 2013],
    also_known_as: ['Dwayne Johnson', 'The Great One', 'The People\'s Champion', 'Rocky Maivia'],
  },

  'stone-cold-steve-austin': {
    display_name: 'Steve Austin',
    notes: "The 1999 Jakks Austin 3:16 vest figure in sealed condition holds $200+ secondary, making it the benchmark Attitude Era grail; Mattel's 2010 Legends version reset collector expectations for premium single-figure articulation and launched a decade-long template for every definitive-era release that followed.",
    peak_years: [1997, 2003],
    also_known_as: ['Stone Cold', 'The Rattlesnake', 'The Texas Rattlesnake'],
  },

  'undertaker': {
    display_name: 'Undertaker',
    notes: 'The deepest single-character catalog in wrestling collecting — Undertaker spans LJN (1991) through Mattel Ultimate Edition (2021) with era-anchoring grails at both poles; the 1991 Hasbro purple glove variant and the 2021 Ultimate Edition represent the complete arc of the hobby\'s 30-year evolution.',
    peak_years: [1990, 2020],
    also_known_as: ['The Deadman', 'The Phenom', 'Mark Calaway', 'American Badass'],
  },

  'triple-h': {
    display_name: 'Triple H',
    notes: "Triple H's DX-era figures command the biggest secondary premiums in his catalog — the 2008 Jakks DX two-pack and 2017 Mattel DX Heritage pack regularly sell for 2-3x MSRP; nostalgia for the faction drives pricing well above his singles-era releases and makes any DX multi-pack a completionist priority.",
    peak_years: [1999, 2014],
    also_known_as: ['HHH', 'The Game', 'The King of Kings', 'The Cerebral Assassin'],
  },

  'shawn-michaels': {
    display_name: 'Shawn Michaels',
    notes: "HBK commands a $60+ floor on every secondary tier — the 2011 Mattel Legends WrestleMania XII remains the $80+ anchor, and completionists tracking his full Jakks-to-Mattel run face 60+ distinct configurations; his Showstopper notoriety drives demand unmatched by comparable-era performers.",
    peak_years: [1992, 2010],
    also_known_as: ['HBK', 'The Heartbreak Kid', 'The Showstopper', 'Mr. WrestleMania'],
  },

  'hulk-hogan': {
    display_name: 'Hulk Hogan',
    notes: "The foundation of the entire hobby — Hogan's 1985 LJN figures defined wrestling collectibility and remain the most recognized WWE toys ever made; the 1990 red-and-yellow Hasbro transcends figure collecting entirely and functions as Americana artifact, commanding five-figure sealed prices.",
    peak_years: [1984, 2003],
    also_known_as: ['The Hulkster', 'Hollywood Hogan', 'Terry Bollea'],
  },

  'macho-man-randy-savage': {
    display_name: 'Macho Man Randy Savage',
    notes: "The sharpest price curve in wrestling collecting — the 2024 Mattel Ultimate Edition broke line records for sell-through velocity, and the 1985 LJN in near-mint card hits $500+ driven by crossover pop-culture demand (music, film cameos) that made him transcend the wrestling hobby entirely.",
    peak_years: [1986, 1994],
    also_known_as: ['The Macho King', 'Randy Poffo', 'The Cream of the Crop'],
  },

  'ultimate-warrior': {
    display_name: 'Ultimate Warrior',
    notes: "Nostalgia apex predator — the 1990 Hasbro is the single most counterfeited wrestling figure ever produced, and every Mattel Legends release since 2011 sells through at premium velocity driven by collectors chasing their 80s childhood; the face paint variants create a deep checklist for completionists.",
    peak_years: [1988, 1996],
    also_known_as: ['The Warrior', 'Jim Hellwig'],
  },

  'ric-flair': {
    display_name: 'Ric Flair',
    notes: "The Nature Boy's figure timeline spans 40 years (1984 LJN → 2023 Mattel) — the deepest chronological run in the hobby with the 2008 Jakks Farewell Tour two-pack and 2022 Ultimate Edition as secondary anchors; completionists face 70+ distinct configurations that document the entire arc of WWE manufacturing evolution.",
    peak_years: [1984, 2022],
    also_known_as: ['The Nature Boy', 'Slick Ric', 'The Dirtiest Player in the Game'],
  },

  'mick-foley': {
    display_name: 'Mick Foley',
    notes: "Foley's three personas (Mankind, Cactus Jack, Dude Love) triple the completionist checklist depth — the 2008 Jakks Classic Superstars Mankind with Mr. Socko remains the definitive version, commanding $40-60 secondary; collectors often chase all three personas separately, which drives overall spend and sustained market demand across 25+ distinct configurations.",
    peak_years: [1996, 2004],
    also_known_as: ['Mankind', 'Cactus Jack', 'Dude Love', 'Mrs. Foley\'s Baby Boy'],
  },

  'kurt-angle': {
    display_name: 'Kurt Angle',
    notes: "Angle's licensing timeline gap (TNA years mostly uncovered figurewise) created holes that completionists still hunt — his 2004 Jakks Classic Superstars Olympic gear variant and the 1999 Jakks original remain secondary anchors; the delayed Mattel debut (2017) meant Jakks versions held strong value through 2015, making the early 2000s his most collectable era.",
    peak_years: [1999, 2017],
    also_known_as: ['The Olympic Hero', 'The Wrestling Machine'],
  },

  'chris-jericho': {
    display_name: 'Chris Jericho',
    notes: "Y2J's 25-year catalog breadth (1999 Jakks through 2023 Mattel) makes his checklist one of wrestling collecting's deepest — the 2008 Jakks Unmatched Collection deluxe version with vest is the secondary grail ($50-70), and his WCW vs. WWE crossover appeal drives collector passion from both camps simultaneously.",
    peak_years: [1999, 2024],
    also_known_as: ['Y2J', 'The Ayatollah of Rock \'n\' Rolla', 'Le Champion', 'The Ocho'],
  },

  'edge': {
    display_name: 'Edge',
    notes: "Edge's career-arc figures track his entire WWE evolution — from 2002 Jakks original through the 2021 Ultimate Edition, collectors chase the 2008 Jakks Rated-R Superstar two-pack and post-retirement run with sustained premiums; his Rated-R Era (2009-2010) figures command 2x secondary versus his earlier Rated-E versions.",
    peak_years: [2001, 2023],
    also_known_as: ['The Rated-R Superstar', 'The Ultmate Opportunist', 'Adam Copeland'],
  },

  'batista': {
    display_name: 'Batista',
    notes: "The Animal's strongest secondary presence concentrates in his WWE Title years (2005-2010) — the 2008 Jakks Legends figure and 2009 WWE Elite original anchor the premium tiers; his Hollywood departure cycle mirrors Rock's pattern, with every film project spike triggering collector interest and figure reissues.",
    peak_years: [2004, 2014],
    also_known_as: ['The Animal', 'Dave Bautista', 'Drax'],
  },

  'randy-orton': {
    display_name: 'Randy Orton',
    notes: "Orton's chase variants drive massive collector completionist depth — the 2008 Jakks Rated RKO two-pack (featuring Orton + Edge) and various shirt-color exclusives create 40+ tracking points; his consistent Mattel presence since 2010 means modern collectors have dense wave options, making 'complete Randy' a serious checklist goal.",
    peak_years: [2004, 2024],
    also_known_as: ['The Viper', 'The Legend Killer', 'The Apex Predator', 'RKO'],
  },

  'rey-mysterio': {
    display_name: 'Rey Mysterio',
    notes: "Rey's mask variants create infinite secondary collecting appeal — a single character produces 20+ distinct figures simply through mask-color changes and multi-packs; the 2005 Jakks Legends articulated version remains the gold standard ($35-50), and his cross-company runs (WCW, ECW, WWE) mean collectors from multiple fandoms converge on his checklist.",
    peak_years: [2002, 2024],
    also_known_as: ['The Master of the 619', 'Oscar Gutierrez'],
  },

  'cm-punk': {
    display_name: 'CM Punk',
    notes: "Punk's indie crossover status (ROH, NJPW, AEW) created fragmented collector fanbases with distinct nostalgia anchors — his 2011 WWE Elite original and 2012 All Japan variant two-pack are secondary staples ($30-45); the controversial nature of his career makes certain releases cult favorites that outpace market predictions.",
    peak_years: [2008, 2024],
    also_known_as: ['The Straight Edge Superstar', 'The Best in the World', 'Phil Brooks'],
  },

  'roman-reigns': {
    display_name: 'Roman Reigns',
    notes: "As the longest-pushed modern WWE main eventer (2014-present), Roman's figure depth rivals John Cena — the 2020 Tribal Chief design variants, Bloodline multi-pack exclusive, and various armor configurations drive completionist spend; his sustained push means every release cycle generates collector buzz and secondary movement.",
    peak_years: [2014, 2024],
    also_known_as: ['The Tribal Chief', 'The Head of the Table', 'The Big Dog', 'Joe Anoa\'i'],
  },

  'seth-rollins': {
    display_name: 'Seth Rollins',
    notes: "Rollins' multiple gimmick runs (Architect, Visionary, Messiah) create natural checklist segmentation — the 2020 Undisputed Era two-pack and various shirt-color Mattel Elite variants command premium secondary; his burn-angle merchandise from 2022-2023 converted casual collectors into serious completionists.",
    peak_years: [2014, 2024],
    also_known_as: ['The Visionary', 'The Monday Night Messiah', 'The Architect', 'Colby Lopez'],
  },

  'aj-styles': {
    display_name: 'AJ Styles',
    notes: "The Phenomenal One's AEW + WWE + NJPW licensing spread makes him a crossover collector magnet — his 2016 WWE Elite debut and later AEW Jazwares releases serve different fanbases; collectors tracking his full catalog span four manufacturers and three major promotions, creating rare depth for a single modern character.",
    peak_years: [2002, 2024],
    also_known_as: ['The Phenomenal One', 'The Face That Runs The Place'],
  },

  'kevin-owens': {
    display_name: 'Kevin Owens',
    notes: "Owens' underdog babyface-to-monster-heel arc tracks through his Mattel releases perfectly — the 2014 Elite original and various exclusive variants document his character evolution; his indie credibility drives older collectors' interest while his sustained WWE presence keeps the checklist modern and accessible.",
    peak_years: [2015, 2024],
    also_known_as: ['KO', 'The Prize Fighter', 'Kevin Steen'],
  },

  'sami-zayn': {
    display_name: 'Sami Zayn',
    notes: "Zayn's journey from vanilla midcarder to tribal bloodline member creates natural narrative arcs in his figure timeline — his 2016 Elite original, Bloodline multi-pack, and various shirt configurations anchor secondary interest; the conspiracy-era figures (2021-2022) converted casual collectors into completionist hunters.",
    peak_years: [2021, 2024],
    also_known_as: ['The Honorary Uce', 'The Great Liberator', 'El Generico'],
  },

  'becky-lynch': {
    display_name: 'Becky Lynch',
    notes: "The Man's rise to top billing (2018-2024) gave modern female wrestling figures unprecedented secondary momentum — her 2018 Elite debut, 2021 alternate attire variants, and championship-era exclusives command strong premiums; her crossover appeal (WWE + mainstream) drives non-traditional collector interest.",
    peak_years: [2018, 2024],
    also_known_as: ['The Man', 'Big Time Becks', 'Rebecca Knox'],
  },

  'charlotte-flair': {
    display_name: 'Charlotte Flair',
    notes: "Charlotte's legacy-name status and consistent 15-year presence mean her checklist rivals veteran male wrestlers — the 2015 Elite original and various robe-variant exclusives ($25-40 secondary); her championship reigns trigger immediate variant production, creating natural completionist urgency.",
    peak_years: [2015, 2024],
    also_known_as: ['The Queen', 'Ashley Fliehr'],
  },

  'sasha-banks': {
    display_name: 'Sasha Banks',
    notes: "Banks' four-manufacturer span (Mattel WWE, AEW Jazwares, and niche releases) creates the most fragmented modern female collector base — her 2014 Elite debut is the secondary grail ($40-60 mint), and her AEW pivot means collectors pursuing 'complete Sasha' must navigate entirely different brands.",
    peak_years: [2015, 2024],
    also_known_as: ['The Boss', 'Mercedes Moné', 'Mercedes Varnado'],
  },

  'jake-the-snake-roberts': {
    display_name: 'Jake Roberts',
    notes: "Jake the Snake is the cult figure of the vintage collector market — the 1986 LJN with removable cloth snake bag and the 1990 Hasbro with the snake strike action are both legitimate $100+ pieces in card condition, and his mystique has only grown with his AEW revival run generating fresh Jazwares demand.",
    peak_years: [1986, 1993],
    also_known_as: ['Jake the Snake', 'The Snake'],
  },

  'roddy-piper': {
    display_name: 'Rowdy Roddy Piper',
    notes: "Hot Rod's passing in 2015 transformed his secondary market overnight — every Mattel Legends and Jakks Classic Superstars Piper figure saw immediate price increases, and the 2010 Mattel Legends kilt-wearing figure is now a consistent $60+ sale that shows no sign of softening.",
    peak_years: [1984, 1996],
    also_known_as: ['Hot Rod', 'Roderick Toombs'],
  },

  'mr-perfect': {
    display_name: 'Mr. Perfect',
    notes: "Curt Hennig's figure run is the best example of posthumous demand driving collector prices — the 2007 Jakks Classic Superstars Mr. Perfect with towel accessory is a consistent $50+ sale, and every Mattel Legends release has sold through faster than Hennig's TV time in his career would predict.",
    peak_years: [1989, 1993],
    also_known_as: ['Mr. Perfect', 'Curt Hennig'],
  },

  'bret-hart': {
    display_name: 'Bret Hart',
    notes: "The Hitman's sunglasses-and-shades look is one of the most requested accessory configurations in Mattel's mailbag — every Bret Hart figure that includes his signature sunglasses sells above average, and his 1994 Hasbro with the pink jacket is a $150+ sealed grail driven by the most vocal vintage collecting fanbase of any 90s performer.",
    peak_years: [1991, 1998],
    also_known_as: ['The Hitman', 'The Excellence of Execution'],
  },

  'british-bulldog': {
    display_name: 'British Bulldog',
    notes: "Davey Boy Smith's UK popularity keeps his secondary market stronger than his US TV time alone would justify — the 1992 Hasbro Bulldog with snap-down head is a $80+ piece, and his 2012 Mattel Legends release triggered enough UK pre-orders to outsell most domestic figures in the same wave.",
    peak_years: [1991, 1997],
    also_known_as: ['Davey Boy Smith', 'The British Bulldog'],
  },

  'dx': {
    display_name: 'D-Generation X',
    notes: "DX two-packs are the highest-premium multi-figure sets in wrestling collecting — the Attitude Era aesthetic and cultural staying power mean every HBK+HHH release commands a 40-60% secondary premium over single-figure equivalents, with the 2008 Jakks two-pack being the most-requested re-release in the hobby.",
    peak_years: [1997, 2011],
    also_known_as: ['D-Generation X', 'DX'],
  },

  'hardy-boyz': {
    display_name: 'Hardy Boyz',
    notes: "The Hardy Boyz multi-packs are the most gifted wrestling figures in the hobby — parents buying for adult children, wrestling fans buying for nostalgic siblings — which keeps secondary prices artificially suppressed on older releases but drives opening-weekend retail velocity that rivals main-eventers.",
    peak_years: [1999, 2017],
    also_known_as: ['Team Xtreme', 'The Hardy Boys'],
  },

  'new-age-outlaws': {
    display_name: 'New Age Outlaws',
    notes: "Road Dogg and Billy Gunn's DX-era figures are among the most undervalued Jakks releases in the hobby — their 2001 Titan Tron Live figures capture the Attitude Era aesthetic at a price point that experienced collectors consider strong buys against long-term appreciation.",
    peak_years: [1997, 2014],
    also_known_as: ['The New Age Outlaws', 'DX Tag Team'],
  },

  'goldberg': {
    display_name: 'Goldberg',
    notes: "Goldberg's two distinct collecting eras (WCW and WWE) split his market cleanly — WCW-era Toy Biz figures are the vintage grails, while his 2016 WWE return generated Mattel releases that sold through in days, confirming a demand held in suspension for nearly 15 years.",
    peak_years: [1997, 2022],
    also_known_as: ['Da Man', 'Who\'s Next'],
  },

  'sting': {
    display_name: 'Sting',
    notes: "The Icon's WWE debut after 30 years in WCW and TNA created a historic collecting moment — his 2015 Mattel Elite debut sold through at three times the rate of comparable wave mates, and the 2022 AEW Jazwares Sting command figures that rival his WCW-era OSFTM pieces for secondary premiums.",
    peak_years: [1990, 2024],
    also_known_as: ['The Icon', 'The Vigilante', 'Steve Borden', 'Crow Sting'],
  },

  'diamond-dallas-page': {
    display_name: 'Diamond Dallas Page',
    notes: "DDP's yoga-fueled wellness brand resurgence gave his figure market a second life — the 2013 WWE Hall of Fame Mattel Elite sold significantly above wave average, and his WCW-era Toybiz figures are among the most collected WCW pieces outside the nWo trio.",
    peak_years: [1996, 2017],
    also_known_as: ['DDP', 'The People\'s Champion'],
  },

  'mankind': {
    display_name: 'Mankind',
    notes: "As Mankind specifically (distinct from Foley's other personas), the 2008 Jakks Classic Superstars version with removable Mankind mask is the definitive piece — the mask accessory has been separately sold on eBay for over $40, making it one of the most valuable accessory components in wrestling figure collecting.",
    peak_years: [1996, 1999],
    also_known_as: ['Mick Foley', 'Have a Nice Day'],
  },

  'kane': {
    display_name: 'Kane',
    notes: "Kane's costume evolution across 25+ years of WWE television gives him one of the broadest variant catalogues in the hobby — the 1997 debut mask variants are the most contested, with the Jakks Masked Kane and the 2018 Mattel Corporate Kane representing the two collector poles of a remarkably deep single-character run.",
    peak_years: [1997, 2022],
    also_known_as: ['The Big Red Machine', 'The Devil\'s Favorite Demon', 'Glenn Jacobs'],
  },

  'big-show': {
    display_name: 'Big Show',
    notes: "The World's Largest Athlete presents the hobby's most literal scale challenge — every manufacturer has struggled to render his 7-foot frame at accurate 1:12 proportion without the figure looking wrong next to the roster, making the 2014 Mattel Elite 25 Big Show one of the few releases collectors consider dimensionally correct.",
    peak_years: [1999, 2019],
    also_known_as: ['The World\'s Largest Athlete', 'Paul Wight'],
  },

  'booker-t': {
    display_name: 'Booker T',
    notes: "Booker T's WCW-era figures are the hardest part of his complete run to source — World Championship Wrestling licensing creates a different rights landscape than WWE, and his WCW-era Toy Biz figures in card condition are $40-60+ pieces that his WWE-era counterparts simply don't match.",
    peak_years: [1998, 2012],
    also_known_as: ['King Booker', 'Can You Dig It Sucka', 'G.I. Bro'],
  },

  'the-miz': {
    display_name: 'The Miz',
    notes: "The most consistently undervalued figure in the modern Mattel run — The Miz's actual mainstream presence has never translated into above-average secondary prices, making him the prime candidate for the kind of sleeper appreciation that collectors who track TV-to-figure demand ratios watch closely.",
    peak_years: [2010, 2022],
    also_known_as: ['The Awesome One', 'Michael Mizanin'],
  },

  'dean-ambrose': {
    display_name: 'Dean Ambrose',
    notes: "The Shield-era Ambrose figures capture the grittiest aesthetic in modern WWE figure production — the 2013 Mattel Shield three-pack is the most requested discontinued set in the hobby, and his Jon Moxley AEW run has made the later WWE figures feel like historical documents of a character mid-transformation.",
    peak_years: [2012, 2024],
    also_known_as: ['Jon Moxley', 'The Lunatic Fringe'],
  },

  'the-shield': {
    display_name: 'The Shield',
    notes: "The Shield three-pack is the white whale of modern WWE multi-figure collecting — the 2013 Mattel three-pack with matching SWAT tactical vests has never been officially re-released, and loose complete sets sell for $150+ while sealed examples approach $300.",
    peak_years: [2012, 2015],
    also_known_as: ['Dean Ambrose', 'Seth Rollins', 'Roman Reigns'],
  },

  'the-new-day': {
    display_name: 'The New Day',
    notes: "The New Day's Booty-O's and unicorn horn accessories make their figures the most accessory-rich faction set in Mattel's modern run — the 2016 New Day WrestleMania three-pack with cereal box and horns is one of the most-photographed WWE figure sets on social media.",
    peak_years: [2015, 2022],
    also_known_as: ['Kofi Kingston', 'Big E', 'Xavier Woods'],
  },

  'kofi-kingston': {
    display_name: 'Kofi Kingston',
    notes: "KofiMania transformed Kingston's secondary market in 2019 — his WrestleMania 35 championship-win Mattel Elite sold through at 3x the velocity of the prior series, and the pre-KofiMania New Day Elites saw retroactive price bumps that showed how a title win can reach backward through a figure's entire catalogue.",
    peak_years: [2009, 2024],
    also_known_as: ['The Dreadlocked Dynamo'],
  },

  'finn-balor': {
    display_name: 'Finn Bálor',
    notes: "The Demon Finn Bálor figures are the clearest case study in face-paint variant premium pricing — every Demon-painted Mattel Elite commands a 60-100% premium over the equivalent generic Bálor release in the same series, reflecting a collector base that treats the Demon as a distinct character.",
    peak_years: [2016, 2024],
    also_known_as: ['The Demon King', 'Fergal Devitt', 'Prince Devitt'],
  },

  'nxt': {
    display_name: 'NXT',
    notes: "NXT figures represent the fastest-growing segment of the Mattel WWE secondary market — limited distribution at NXT TakeOver events and exclusive configurations through WWE Shop drive the kind of artificial scarcity that turns mid-card performers into grail-tier pieces.",
    peak_years: [2014, 2024],
    also_known_as: [],
  },

  'goldust': {
    display_name: 'Goldust',
    notes: "Goldust's gold facepaint figures are a perennial collector favourite — the specific shade and application varied enough across Jakks and Mattel runs to make paint-accuracy debates a sub-hobby of their own, with the 2014 Mattel Elite Goldust considered the most accurate screen-matched version.",
    peak_years: [1995, 2019],
    also_known_as: ['The Bizarre One', 'Dustin Rhodes'],
  },

  'santino-marella': {
    display_name: 'Santino Marella',
    notes: "Santino's comedy figure run is beloved by collectors who value character-over-quality — the 2009 Jakks Deluxe Aggression Santino with cobra sock accessory is the most sought-after piece in his catalogue, and his figures routinely sell above comparable wave mates despite never being a main-event performer.",
    peak_years: [2007, 2014],
    also_known_as: ['The Milan Miracle', 'The Cobra'],
  },

  'braun-strowman': {
    display_name: 'Braun Strowman',
    notes: "The Monster Among Men's scale creates the same production challenge as Big Show — rendering a 6\'8\" 385-pound performer accurately in 6-inch scale is difficult, and the 2018 Mattel Elite 60 Braun is considered the first figure to genuinely capture his physical presence without distortion.",
    peak_years: [2016, 2023],
    also_known_as: ['The Monster Among Men'],
  },

  'cesaro': {
    display_name: 'Cesaro',
    notes: "The Swiss Superman is the most-requested remold in Mattel fan forums — collectors who believe his in-ring ability was never matched by his figure production have made him a cause célèbre, and his 2021 WrestleMania Backlash push generated Mattel Elite demand that made him temporarily impossible to find at retail.",
    peak_years: [2013, 2022],
    also_known_as: ['The Swiss Superman', 'Claudio Castagnoli'],
  },

  // ── AEW Performers ───────────────────────────────────────────────────────────

  'cody-rhodes': {
    display_name: 'Cody Rhodes',
    notes: "The American Nightmare's return to WWE in 2022 created an immediate collecting event — his final AEW Jazwares figures spiked 40% overnight, while his WWE return Mattel Elites set velocity records for a debut-return figure; the 2023 WrestleMania chest-tattoo Elite is the emotional bookmark of the year.",
    peak_years: [2019, 2024],
    also_known_as: ['The American Nightmare', 'The American Dream\'s Son'],
  },

  'the-young-bucks': {
    display_name: 'Young Bucks',
    notes: "The Young Bucks are the defining figure success story of the AEW era — their Jazwares releases introduced a collector base accustomed to Mattel's production quality to an independent manufacturer that matched and sometimes exceeded it, validating the AEW figure line as a serious collector proposition.",
    peak_years: [2019, 2024],
    also_known_as: ['Matt Jackson', 'Nick Jackson', 'The Elite'],
  },

  // ── Marvel ───────────────────────────────────────────────────────────────────

  'spider-man': {
    display_name: 'Spider-Man',
    notes: "Spider-Man drives more volume than any other Marvel character across all scales and eras — the ToyBiz 1994 animated series figures are vintage grails, the 2002 Raimi film figures are mid-tier collectibles, and every Hasbro Marvel Legends Spider-Man release sells through before the case reaches full retail distribution.",
    peak_years: [1994, 2024],
    also_known_as: ['Peter Parker', 'The Friendly Neighbourhood Spider-Man', 'The Wall-Crawler'],
  },

  'wolverine': {
    display_name: 'Wolverine',
    notes: "Wolverine has the deepest retail penetration of any Marvel figure character — available in some form every single year since 1984, with the 2006 ToyBiz Marvel Legends Brown Costume and the 2013 Hasbro Marvel Legends 90s Jim Lee variants representing the two peaks of collector demand across four decades.",
    peak_years: [1984, 2024],
    also_known_as: ['Logan', 'James Howlett', 'The Best There Is'],
  },

  'captain-america': {
    display_name: 'Captain America',
    notes: "Cap's MCU-era collecting arc mirrors Steve Rogers's own story — pre-MCU figures were mid-tier collectibles, the 2011 First Avenger film changed everything, and the MCU finale Endgame Cap is now a definitive piece that completionists across ToyBiz and Hasbro eras consider the culmination of the character's figure timeline.",
    peak_years: [2011, 2024],
    also_known_as: ['Steve Rogers', 'Cap', 'The First Avenger'],
  },

  'iron-man': {
    display_name: 'Iron Man',
    notes: "Iron Man's suit variants make him the wrestling-mask-parallel of the Marvel Legends world — each distinct armour has a dedicated collector base, with the Mark III, Mark VII, Mark XLVI, and Bleeding Edge armours representing the four most contested variants across Hasbro's decade-plus Legends run.",
    peak_years: [2008, 2024],
    also_known_as: ['Tony Stark', 'Shellhead', 'Armored Avenger'],
  },

  // ── Star Wars ────────────────────────────────────────────────────────────────

  'darth-vader': {
    display_name: 'Darth Vader',
    notes: "The single most produced action figure character in history — Vader has appeared in some form in every Star Wars toy line since 1977, and the 1977 Kenner Telescoping Lightsaber variant is the rarest and most valuable mainstream action figure of the 20th century.",
    peak_years: [1977, 2024],
    also_known_as: ['Anakin Skywalker', 'The Dark Lord of the Sith'],
  },

  'boba-fett': {
    display_name: 'Boba Fett',
    notes: "Boba Fett is the defining case study in character-popularity-versus-screen-time — a background character in two films became the most valuable vintage Star Wars figure (the 1979 pre-production rocket-firing prototype), and every subsequent Fett release from Kenner through Hasbro reflects that inexplicable grip on collector imagination.",
    peak_years: [1979, 2024],
    also_known_as: ['The Mandalorian Bounty Hunter'],
  },

  'luke-skywalker': {
    display_name: 'Luke Skywalker',
    notes: "Luke's figure timeline maps directly to the franchise's arc — the 1977 Kenner brown hair/yellow hair variants are the most-studied production variations in action figure history, and the 2017 Hasbro Black Series Jedi Master Luke is one of the three fastest-selling Black Series figures ever produced.",
    peak_years: [1977, 2024],
    also_known_as: ['The Last Jedi', 'The Farm Boy'],
  },

}

/**
 * Look up character notes by character_canonical slug.
 */
export function getCharacterNotes(characterCanonical: string): CharacterNotes | null {
  return CHARACTER_NOTES[characterCanonical] ?? null
}
