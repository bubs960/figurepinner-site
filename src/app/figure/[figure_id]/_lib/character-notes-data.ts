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
    notes: 'The most produced figure in modern WWE collecting — Mattel released Cena in over 80 distinct configurations across 15 years, making variant hunting a discipline of its own; the 2012 Defining Moments and 2023 tribute run are the bookend grails.',
    peak_years: [2005, 2023],
    also_known_as: ['The Champ', 'Super Cena', 'Doctor of Thuganomics'],
  },

  'the-rock': {
    display_name: 'The Rock',
    notes: "The Rock's figure market is Hollywood-inflated — film-era returns consistently spiked secondary prices on every Mattel release, and the 2011 Legends figure with removable elbow pad is the most counterfeited wrestling figure on eBay.",
    peak_years: [1998, 2013],
    also_known_as: ['Dwayne Johnson', 'The Great One', 'The People\'s Champion', 'Rocky Maivia'],
  },

  'stone-cold-steve-austin': {
    display_name: 'Steve Austin',
    notes: "Stone Cold's Attitude Era variants are the most contested in wrestling collecting — the 1999 Jakks Austin 3:16 vest figure in sealed condition crosses $200 regularly, and Mattel's 2010 Legends version set the template for every premium single-figure release after.",
    peak_years: [1997, 2003],
    also_known_as: ['Stone Cold', 'The Rattlesnake', 'The Texas Rattlesnake'],
  },

  'undertaker': {
    display_name: 'Undertaker',
    notes: 'The deepest single-character well in wrestling collecting — Undertaker spans every major line from LJN through Mattel Ultimate Edition, with the 1991 Hasbro purple glove variant and the 2021 Mattel Ultimate Edition being the era-defining grails at opposite ends of a 30-year timeline.',
    peak_years: [1990, 2020],
    also_known_as: ['The Deadman', 'The Phenom', 'Mark Calaway', 'American Badass'],
  },

  'triple-h': {
    display_name: 'Triple H',
    notes: "Triple H's DX-era figures carry the biggest premium over retail in his run — the 2008 Jakks DX two-pack and the 2017 Mattel DX Heritage pack both sell for multiples of MSRP, driven by DX nostalgia that outpaces his singles-era demand.",
    peak_years: [1999, 2014],
    also_known_as: ['HHH', 'The Game', 'The King of Kings', 'The Cerebral Assassin'],
  },

  'shawn-michaels': {
    display_name: 'Shawn Michaels',
    notes: "HBK commands a premium at every price tier — the 2011 Mattel Legends Wrestlemania XII gear is a consistent $80+ seller, and completionists chasing his full run across Jakks Classic Superstars and Mattel Legends face 60+ distinct releases.",
    peak_years: [1992, 2010],
    also_known_as: ['HBK', 'The Heartbreak Kid', 'The Showstopper', 'Mr. WrestleMania'],
  },

  'hulk-hogan': {
    display_name: 'Hulk Hogan',
    notes: "The foundation of wrestling collecting — Hogan's LJN figures from 1985 are the most recognized wrestling toys ever made, and the 1990 red-and-yellow Hasbro remains one of the handful of wrestling figures that transcends the hobby into mainstream Americana.",
    peak_years: [1984, 2003],
    also_known_as: ['The Hulkster', 'Hollywood Hogan', 'Terry Bollea'],
  },

  'macho-man-randy-savage': {
    display_name: 'Macho Man Randy Savage',
    notes: "No wrestling character has a sharper price curve than Macho Man — his 2024 Mattel Ultimate Edition became the fastest sell-through in the line's history, and the 1985 LJN Macho Man in near-mint card condition is a $500+ grail driven by pop-culture crossover demand that long outgrew the hobby.",
    peak_years: [1986, 1994],
    also_known_as: ['The Macho King', 'Randy Poffo', 'The Cream of the Crop'],
  },

  'ultimate-warrior': {
    display_name: 'Ultimate Warrior',
    notes: "The Ultimate Warrior is the purest nostalgia investment in the hobby — his 1990 Hasbro is the single most counterfeited wrestling figure of any era, and every Mattel Legends release since 2011 has sold through at premium speed driven by collectors who grew up in the 80s golden age.",
    peak_years: [1988, 1996],
    also_known_as: ['The Warrior', 'Jim Hellwig'],
  },

  'ric-flair': {
    display_name: 'Ric Flair',
    notes: "The Nature Boy spans every era of the hobby — from 1984 LJN through 2023 Mattel, with the 2008 Jakks Farewell Tour two-pack and 2022 Mattel Ultimate Edition commanding the top secondaries; completionists tracking every Flair release across 40 years face one of the deepest checklists in wrestling collecting.",
    peak_years: [1984, 2022],
    also_known_as: ['The Nature Boy', 'Slick Ric', 'The Dirtiest Player in the Game'],
  },

  'mick-foley': {
    display_name: 'Mick Foley',
    notes: "Foley's three personas (Mankind, Cactus Jack, Dude Love) triple the checklist for any completionist — the 2008 Jakks Classic Superstars Mankind with Mr. Socko is the most sought-after single Foley release, while the three-persona Mattel pack is a rare instance of manufacturer and collector priorities perfectly aligning.",
    peak_years: [1996, 2004],
    also_known_as: ['Mankind', 'Cactus Jack', 'Dude Love', 'Mrs. Foley\'s Baby Boy'],
  },

  'kurt-angle': {
    display_name: 'Kurt Angle',
    notes: "Kurt Angle's TNA and WWE licensing gaps left holes in his figure timeline that completionists still wrestle with — his 2004 Jakks Classic Superstars Olympic gear is the definitive version of the character, and his Mattel debut was delayed enough that secondary prices on Jakks versions held strong into 2015.",
    peak_years: [1999, 2017],
    also_known_as: ['The Olympic Hero', 'The Wrestling Machine'],
  },

  'chris-jericho': {
    display_name: 'Chris Jericho',
    notes: "Jericho's AEW run created the rarest split in wrestling collecting — his WWE Mattel figures and AEW Jazwares figures coexist in a single character's run for the first time, with the 2022 Jericho Appreciation Society Jazwares set being one of the most pre-ordered wrestling figures since Mattel's first Legends wave.",
    peak_years: [1999, 2024],
    also_known_as: ['Y2J', 'The Ayatollah of Rock \'n\' Rolla', 'Le Champion', 'The Ocho'],
  },

  'edge': {
    display_name: 'Edge',
    notes: "The Rated-R Superstar's retirement and return created two distinct collecting eras — pre-2011 figures reflecting his active peak, and the 2020-era Mattel comebacks that re-energized interest in his entire back catalogue; the 2007 Jakks Deluxe Aggression Edge is the single best face-sculpt from the entire DA run.",
    peak_years: [2001, 2023],
    also_known_as: ['The Rated-R Superstar', 'The Ultmate Opportunist', 'Adam Copeland'],
  },

  'batista': {
    display_name: 'Batista',
    notes: "Batista's Hollywood career turbo-charged his secondary market — the 2004 Evolution Jakks DA figure tripled in value after Guardians of the Galaxy, and his 2014 return Mattel Elite became a Target exclusive sell-through in under 48 hours, a clear indicator of crossover collector demand.",
    peak_years: [2004, 2014],
    also_known_as: ['The Animal', 'Dave Bautista', 'Drax'],
  },

  'randy-orton': {
    display_name: 'Randy Orton',
    notes: "The Viper holds the record for most distinct Mattel Elite releases for an active performer — over 30 Elite configurations tracking his evolving look, with the 2009 Jakks Legacy Orton and the 2020 Mattel Elite 85 Punt Kick variant representing the collector bookmarks on either side of his career.",
    peak_years: [2004, 2024],
    also_known_as: ['The Viper', 'The Legend Killer', 'The Apex Predator', 'RKO'],
  },

  'rey-mysterio': {
    display_name: 'Rey Mysterio',
    notes: "Mysterio's mask variants make him one of the deepest variant-hunting targets in the hobby — dozens of unique mask decos across Jakks and Mattel, with the 2006 WrestleMania 22 Jakks figure in the silver beaded mask being the figure most collectors point to as the definitive Mysterio release.",
    peak_years: [2002, 2024],
    also_known_as: ['The Master of the 619', 'Oscar Gutierrez'],
  },

  'cm-punk': {
    display_name: 'CM Punk',
    notes: "The most volatile secondary market in modern wrestling collecting — Punk's 2014 WWE departure froze production mid-run, making his final Mattel Elite (Series 26) a hard-stop grail, and his 2023 AEW return and subsequent WWE return sent every vintage Punk figure to new price highs overnight.",
    peak_years: [2008, 2024],
    also_known_as: ['The Straight Edge Superstar', 'The Best in the World', 'Phil Brooks'],
  },

  'roman-reigns': {
    display_name: 'Roman Reigns',
    notes: "Roman's Tribal Chief era transformed his collectibility from consistent-but-unremarkable to must-have — the 2021 Mattel Elite Bloodline figures became some of the fastest-appreciating modern releases, with The Usos two-pack as a set piece that completionists need to complete the faction.",
    peak_years: [2014, 2024],
    also_known_as: ['The Tribal Chief', 'The Head of the Table', 'The Big Dog', 'Joe Anoa\'i'],
  },

  'seth-rollins': {
    display_name: 'Seth Rollins',
    notes: "Rollins's constantly evolving ring gear is the hobby's biggest blessing and curse — new attire variants every few months drive fresh releases, but the 2019 Monday Night Messiah Mattel Ultimate Edition with full regalia is the most-requested re-issue in Mattel's mailbag.",
    peak_years: [2014, 2024],
    also_known_as: ['The Visionary', 'The Monday Night Messiah', 'The Architect', 'Colby Lopez'],
  },

  'aj-styles': {
    display_name: 'AJ Styles',
    notes: "AJ Styles's TNA-to-WWE transition created one of the cleanest split-market stories in collecting — his Impact/TNA-era Figures Inc. releases are nearly impossible to find in-package today, making his Mattel WWE debut in Elite 45 feel like the first official chapter for collectors who discovered him through WWE.",
    peak_years: [2002, 2024],
    also_known_as: ['The Phenomenal One', 'The Face That Runs The Place'],
  },

  'kevin-owens': {
    display_name: 'Kevin Owens',
    notes: "KO's prize fighter persona produced some of Mattel's most applauded ring gear variants — the 2016 Universal Championship Mattel Elite and the 2022 Prizefighter jacket Elite both sold through faster than comparable releases, confirming a collector base that punches above his mainstream profile.",
    peak_years: [2015, 2024],
    also_known_as: ['KO', 'The Prize Fighter', 'Kevin Steen'],
  },

  'sami-zayn': {
    display_name: 'Sami Zayn',
    notes: "The Honorary Uce storyline turned Sami Zayn into the surprise collectibility story of 2023 — his Bloodline-era Mattel Elites showed some of the strongest sell-through velocity of any mid-card performer in the line's history, fueled by a fanbase that wanted plastic proof of the moment.",
    peak_years: [2021, 2024],
    also_known_as: ['The Honorary Uce', 'The Great Liberator', 'El Generico'],
  },

  'becky-lynch': {
    display_name: 'Becky Lynch',
    notes: "The Man launched the modern women's revolution in wrestling figures — Mattel's first Becky Lynch Elites sold out at retail within days of announcement, and she remains the top-selling women's figure in the Mattel WWE line by secondary market volume, with her WrestleMania 35 gear figures commanding the biggest premiums.",
    peak_years: [2018, 2024],
    also_known_as: ['The Man', 'Big Time Becks', 'Rebecca Knox'],
  },

  'charlotte-flair': {
    display_name: 'Charlotte Flair',
    notes: "Charlotte's robe variants are the women's division equivalent of Mysterio's mask decos — each distinct ring robe rendered in figure scale, with the 2020 Mattel Ultimate Edition Charlotte holding the highest secondary price floor of any women's figure in the line's history.",
    peak_years: [2015, 2024],
    also_known_as: ['The Queen', 'Ashley Fliehr'],
  },

  'sasha-banks': {
    display_name: 'Sasha Banks',
    notes: "The Boss's transition to WWE's most internationally prominent active performer — now wrestling as Mercedes Moné in AEW and NJPW — created a suspended-in-time quality to her Mattel run; her final WWE Elites are increasingly collected as the close of a chapter that may not reopen.",
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
