// Editorial guide articles — long-form, original, collector-voice content.
// Rendered by /guides/[slug]. This is original written content (not data-table
// pages) — the substance Google's reviewers read as a real content site, and
// the SEO surface that ranks for "how to price wrestling figures" etc.
//
// Voice: collector with better data (Meltzer credibility + Russo hooks), per
// FIGUREPINNER-CULTURE-VOICE-GUIDE. Body is an array of blocks rendered as
// semantic HTML by the route. Keep claims specific and accurate.

import { BIDCHECK_ARTICLES } from './bidcheck-articles'

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'callout'; text: string }
  // Live sold-median card — renders the current r2proxy median for `fid` (Bid Check).
  | { type: 'comp'; fid: string; label: string; sublabel?: string; href?: string }
  // Live client-side countdown to a fixed UTC instant (e.g. a convention panel start).
  | { type: 'countdown'; label: string; targetIso: string }

export interface Article {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  dek: string            // one-line standfirst under the title
  readingMinutes: number
  updated: string        // ISO date
  body: ArticleBlock[]
}

export const ARTICLES: Article[] = [
  ...BIDCHECK_ARTICLES,
  {
    slug: 'most-valuable-star-wars-action-figures',
    title: 'Most Valuable Star Wars Action Figures: What the Con Exclusives Actually Sell For',
    metaTitle: 'Most Valuable Star Wars Action Figures \u2014 Real Sold Prices | FigurePinner',
    metaDescription:
      'What Star Wars Black Series SDCC and Celebration exclusives actually sell for, from a $32 median set to sealed sales past $500 \u2014 real eBay sold data, not auction-house folklore.',
    dek: 'One-time convention exclusives, never reissued. The sold data explains exactly why that matters to the price.',
    readingMinutes: 6,
    updated: '2026-08-07',
    body: [
      { type: 'p', text: 'Modern Star Wars collecting has one category that behaves almost nothing like the rest of the line: convention exclusives. Hasbro ships them once, in a limited run, tied to a specific SDCC or Celebration, and then never touches that exact figure again. That scarcity shows up directly in the sold data, and it shows up fast.' },
      { type: 'h2', text: 'What the exclusives actually sell for' },
      { type: 'ul', items: [
        'Jabba the Hutt, SDCC exclusive: median $137.99 across 15 sold, range $39.99-$169.95. A deluxe-scale exclusive with real production cost behind it, and the sold range stays tight \u2014 there is no cheap tier for this one.',
        'Boba Fett & Han Solo in Carbonite, SDCC 2013 exclusive 2-pack: median $31.95 across 50 sold, but the top of that range is $527.81, and every one of the high sales is a genuine sealed listing for this exact set. That is not a data error \u2014 it is one of the widest sealed/loose splits in modern Star Wars collecting.',
        'Cantina Showdown, Celebration exclusive multi-figure set: median $49.98 across 14 sold, up to $129.33.',
        'Kylo Ren Unmasked, SDCC exclusive: median $40 across 50 sold, up to $169.99 \u2014 the widest sample size on this list, and still a real spread between loose and sealed.',
        'Jyn Erso, SDCC exclusive: median $31.99 across 33 sold, up to $120.',
      ]},
      { type: 'callout', text: 'The Boba Fett & Han Carbonite set is the one to look at closely if you only remember one number from this list. A $31.95 median next to a $527.81 real sealed sale is not noise \u2014 it is the entire sealed-versus-loose story for con exclusives in a single figure, and it means the loose median is not the price to anchor on if you are chasing a mint one.' },
      { type: 'h2', text: 'Why a one-time run holds value better than a mainline figure' },
      { type: 'p', text: 'A mainline Black Series figure gets reissued, repainted, and re-released across years of assortments \u2014 supply keeps pace with demand the way it does for any of the common wrestling or Marvel figures we track elsewhere on this site. A convention exclusive breaks that pattern on purpose. Hasbro prints a fixed run tied to a single show, sells it there and through a brief online drop, and the mold does not come back. Every sale after that first window is drawing from a pool that stopped growing years ago.' },
      { type: 'h2', text: 'The vintage market question we are not answering yet' },
      { type: 'p', text: 'Ask a longtime collector for the single most valuable Star Wars figure and you will hear the same answer inside five seconds: the early rocket-firing Boba Fett, a piece that has sold at major auction houses for well into six figures depending on grade. That reputation is real and well documented.' },
      { type: 'p', text: 'We are not printing a sold-comp number for the wider vintage Kenner market on this page. Our own comp data for that era currently has a known query-matching issue that pulls in listings for the wrong product \u2014 caught it mid-research for this article, and this site does not publish a price it cannot stand behind. The fix is scoped and in progress. When it ships, the vintage side of this guide gets its own real numbers instead of a placeholder.' },
      { type: 'p', text: 'Until then: if you are chasing a convention exclusive, buy sealed if you want to hold value, and treat any loose sale under the sealed range as a real discount, not a sign the figure is common \u2014 the sold data above says otherwise.' },
    ],
  },
  {
    slug: 'how-to-spot-fake-action-figures',
    title: 'How to Spot a Fake Action Figure Before You Pay For It',
    metaTitle: 'How to Spot Fake Action Figures — Bootleg Warning Signs | FigurePinner',
    metaDescription:
      'The real tells that separate a genuine action figure from a bootleg: weight, paint, joints, packaging print quality, and the price signal most buyers ignore until it is too late.',
    dek: 'Bootlegs do not fool a trained eye. They fool a rushed one.',
    readingMinutes: 5,
    updated: '2026-08-07',
    body: [
      { type: 'p', text: 'Counterfeit figures have gotten better, but they have not gotten as good as the sellers pushing them want you to believe. Almost every bootleg fails on the same handful of checks, and none of them require special equipment \u2014 just slowing down before you hit buy.' },
      { type: 'h2', text: 'Weight is the fastest tell' },
      { type: 'p', text: 'Bootleg plastic is almost always lighter than the real thing. Manufacturers use consistent resin blends and wall thickness; counterfeit operations cut costs on material first, because it is the cheapest corner to cut and the least visible in a photo. If you own a genuine figure from the same line already, pick both up \u2014 a legitimate figure has a denser, more substantial feel that a listing photo cannot fake.' },
      { type: 'h2', text: 'Paint and sculpt detail break down under bootlegging' },
      { type: 'ul', items: [
        'Paint bleed across sculpt lines \u2014 eyes, teeth, small accessories \u2014 where the original has a clean edge.',
        'Muddy or flat colors where the real figure has layered shading or a metallic or pearlescent finish.',
        'Softer sculpt detail overall: bootlegs are frequently cast from a mold taken off an existing figure, and each generation of that process loses sharpness. Fine details like fabric texture or knuckle definition go first.',
        'Joints that feel loose, gritty, or inconsistent from one arm to the other \u2014 real manufacturers hold tighter tolerances across a production run than a bootleg operation reproducing a stolen mold.',
      ]},
      { type: 'callout', text: 'One soft detail alone is not proof \u2014 real figures have QC variance too. What separates a bootleg is multiple tells stacking on the same figure: light weight, bled paint, AND loose joints together is a bootleg. One slightly soft paint app on an otherwise solid figure is just ordinary factory variance.' },
      { type: 'h2', text: 'The packaging tells you as much as the figure' },
      { type: 'p', text: 'Print quality on a bootleg box or card is the single easiest thing to compare against a reference photo, because it does not require handling the figure at all. Look for blurry or slightly-off-register logos, color that reads a shade warmer or cooler than the real packaging, and cardboard or plastic that feels thinner than a genuine card. Barcodes and any authenticity holograms are worth zooming into \u2014 legitimate packaging print runs are consistent; bootleg print jobs vary listing to listing because they are not coming from the same source file.' },
      { type: 'h2', text: 'The price is a warning sign before the figure ever arrives' },
      { type: 'p', text: 'Check the real sold range for the figure before you buy \u2014 [[pull the actual sold comps|/]] rather than trusting a single "buy it now" price. A figure listed well under its real sold median, especially a chase or short-printed piece that should be commanding a premium, is the most reliable bootleg signal there is, and it shows up before you ever have to inspect a photo. Sellers moving real product at real scarcity do not price forty percent under the market for no reason.' },
      { type: 'h2', text: 'Seller history matters more than any single photo' },
      { type: 'p', text: 'A seller with account history, real feedback specific to action figures, and photos that clearly show the actual item (not stock images) is a different risk profile than a brand-new account listing multiples of a hard-to-find figure at a suspiciously soft price. Ask for an extra photo of the joints or the box interior before you bid \u2014 a legitimate seller will send one without hesitation, and a bootleg seller working off a stock photo usually cannot.' },
      { type: 'p', text: 'None of these checks take long once you know to run them. The buyers who get burned are the ones skipping all five because the price looked too good to slow down for.' },
    ],
  },
  {
    slug: 'whatnot-show-prep-checklist',
    title: 'How to Prep for a Whatnot Action Figure Show: The Pre-Stream Checklist',
    metaTitle: 'Whatnot Show Prep Checklist for Action Figure Sellers | FigurePinner',
    metaDescription:
      'What to do before you go live on Whatnot, not during \u2014 pricing your lots ahead of time, staging, tech checks, and the shipping/hold answers you need memorized before someone asks in chat.',
    dek: 'The countdown clock does not wait for you to find your price sheet. Do the work before you hit Go Live.',
    readingMinutes: 5,
    updated: '2026-08-07',
    body: [
      { type: 'p', text: 'The difference between a show that flows and one where you are visibly scrambling is almost never something that happened on stream. It is what you did, or did not do, in the hour before you hit Go Live. Chat moves fast, bids stack up, and there is no pause button once someone is watching you dig through a bin for the next lot.' },
      { type: 'h2', text: 'Price your lots before the stream, not during' },
      { type: 'p', text: 'Do not price a figure for the first time while it is live on camera. Pull real sold comps ahead of time and write your floor next to each lot \u2014 not a vibe, a number. [[Check the real sold median before you set a floor|/]] on anything you are not sure of, the same way you would before bidding on someone else\'s stream. A written floor is the one thing standing between you and accepting a bid you will regret the second the adrenaline wears off.' },
      { type: 'callout', text: 'If a figure has thin comp data \u2014 a handful of sales, not dozens \u2014 treat your floor as soft and say so if someone asks. Guessing confidently on a thin market is how you either give away a real grail or scare off a fair bidder with a number you cannot defend.' },
      { type: 'h2', text: 'Stage and photograph before you go live' },
      { type: 'p', text: 'Lay out lots in the order you will actually show them, not the order you found them in a bin. Good, even light matters more than an expensive camera \u2014 a figure photographed in flat, shadow-free light reads better on a phone screen than one shot under a single overhead bulb. Keep the next few lots staged just off camera so there is no dead air while you go find the next box.' },
      { type: 'h2', text: 'Run the tech check every time, not just the first show' },
      { type: 'ul', items: [
        'Run a real speed test on your stream connection, not a guess based on how the internet felt yesterday.',
        'Charge everything, and have a backup power source within reach \u2014 a show that dies mid-auction over a dead battery is the one bad experience bidders remember.',
        'Set up a second device to actually watch chat. Reading chat off the same screen you are streaming from means you miss questions and bids.',
        'Close anything else pulling bandwidth \u2014 backups, downloads, another household device mid-stream \u2014 before you go live, not after buffering starts.',
      ]},
      { type: 'h2', text: 'Know your shipping and hold answers before someone asks' },
      { type: 'p', text: 'Someone will ask about combined shipping, box damage policy, or how long you hold a win before relisting it \u2014 usually in the first ten minutes. Write your shipping bands by weight tier ahead of time so you are quoting a number, not doing math live while three other bids are stacking up. Decide your hold window and your damage/return policy before the show, not in the moment, because whatever you say live is the policy now, whether you meant it to be or not.' },
      { type: 'h2', text: 'The one thing worth automating: your price sheet' },
      { type: 'p', text: 'Everything else on this list is prep you redo every show. Your price sheet is the one part worth building once and refining \u2014 a running list of what you actually have, with a real comp-backed floor next to each piece, updated as new sales come in rather than re-derived from memory an hour before you go live.' },
      { type: 'p', text: 'None of this is complicated. It is just work that has to happen before the countdown starts, because there is no version of a live show where you get to pause it to go figure out what something is worth.' },
    ],
  },
  {
    slug: 'marvel-legends-baf-guide',
    title: 'Marvel Legends BAF Guide: What the Build-A-Figures Actually Sell For',
    metaTitle: 'Marvel Legends BAF Value Guide \u2014 Real Sold Prices by Wave | FigurePinner',
    metaDescription:
      'What Marvel Legends Build-A-Figures actually sell for, from a $28 Thanos to a $585 Galactus \u2014 real eBay sold data explains why the same assembly mechanic produces wildly different money.',
    dek: 'Same wave structure, same one-part-per-box mechanic. The sold data says the payoff is nowhere close to equal.',
    readingMinutes: 6,
    updated: '2026-08-07',
    body: [
      { type: 'p', text: 'Every BAF wave asks the same thing: buy the wave, pull one part per box, assemble the giant at the end. Hasbro hasn\'t changed the mechanic in years. What changes, wave to wave, is how much that giant is worth once it\'s built, and our sold-comp data says the gap is not small.' },
      { type: 'h2', text: 'What Marvel Legends BAFs actually sell for' },
      { type: 'ul', items: [
        'Thanos, Avengers: Infinity War wave: median $27.99 across 50 sold. The most common BAF in this set \u2014 the movie hit theaters right as the wave shipped, Hasbro printed to match, and the market has never treated it as scarce.',
        'Thanos, the earlier "Infinite Series" Avengers wave: median $29.99 across 46 sold. Different release, same character, almost the same number.',
        'Armored Thanos, Avengers: Endgame wave: median $40 across 34 sold, a real step up for the variant \u2014 though the sealed figure here has sold exactly once, so treat that $42.99 as a data point, not a price.',
        'Sentinel: median $174.99 across 26 sold. Split it by condition and sealed alone runs $200 (13 sold) against $44.50 loose (13 sold) \u2014 better than a 4x sealed premium on the same figure.',
        'Galactus: median $585 across 38 sold. Sealed sits at $600 (19 sold), loose at $55 (11 sold) \u2014 the widest sealed/loose spread of anything on this list, and the only BAF here that clears five hundred dollars.',
      ]},
      { type: 'callout', text: 'What actually moves the number isn\'t fame. Thanos headlined two Avengers movies and still sells for under $30. What moves it is how expensive and how hard the build was to finish.' },
      { type: 'h2', text: 'Why the same gimmick prints a $28 figure and a $585 one' },
      { type: 'p', text: 'The Thanos waves shipped at peak MCU hype in a standard six-figure spread, priced low enough that Hasbro could print without restraint. Demand was real, but supply kept pace with it \u2014 two separate Thanos releases landing within two dollars of each other is the market telling you both settled at "common" and stayed there.' },
      { type: 'p', text: 'Galactus is a different build. He stands well over a foot, splits across a wave that costs real money to complete, and asks a casual buyer to commit shelf space and cash to a background piece most people will never open. Fewer collectors finished the build, which means fewer complete loose Galactuses exist, and a sealed one \u2014 never opened, parts unverified but guaranteed present \u2014 commands better than ten times a common Thanos.' },
      { type: 'h2', text: 'Sealed vs. loose is where the real money sits' },
      { type: 'p', text: 'Every BAF here carries a sealed premium, but it scales with difficulty, not flat percentage. Sentinel sealed runs about 4.5x its loose price. Galactus sealed runs closer to 11x. The bigger and harder the build, the more a buyer will pay for a sealed, guaranteed-complete figure over a loose one somebody assembled from a bargain bin of stray parts, because with something the size of Galactus, "loose" too often means missing a piece, and paying for sealed is paying to not find that out the hard way.' },
      { type: 'h2', text: 'The buying rule this data supports' },
      { type: 'p', text: 'Building for the shelf, not resale? Buy loose. Thanos at $28-30 loose and Sentinel at $44.50 loose are both honest prices for a finished giant, and neither has moved much in a while. Buying Galactus is a different decision: buy sealed, or buy from someone who can show you every part is actually in the box, because the loose market for that one figure (11 sold) is thin enough that a single bad-parts sale can skew what "normal" even looks like.' },
    ],
  },
  {
    slug: 'ultimate-warrior-figure-value',
    title: 'Ultimate Warrior Figures: A Megastar With a Bargain-Bin Price',
    metaTitle: 'Ultimate Warrior Figure Value — What His Figures Actually Sell For | FigurePinner',
    metaDescription:
      'What Ultimate Warrior action figures are really worth, from the $11 Hasbro to the modern $20 Elite — real eBay sold comps, why a megastar stays cheap, and the variants that actually carry money.',
    dek: 'One of the biggest stars of his era. Some of the most affordable figures in the hobby. The sold data explains why.',
    readingMinutes: 6,
    updated: '2026-06-25',
    body: [
      { type: 'p', text: 'The Ultimate Warrior sold out arenas, beat Hulk Hogan clean at WrestleMania VI, and burned as bright as anyone in the business. His action figures cost about as much as lunch. That gap between enormous fame and small price is one of the clearest lessons in wrestling figure collecting, and the sold data makes it plain.' },
      { type: 'p', text: 'Run his name through real eBay sold comps and the pattern is immediate. The Warrior was made early, made often, and made by everyone, and a character that printed in those numbers does not stay scarce. Here is what his figures actually move for, and the short list of exceptions that buck it.' },
      { type: 'h2', text: 'What the sold comps say' },
      { type: 'ul', items: [
        'WWF Hasbro Series 1 (1990): median $11 across 42 sold. The vintage one most collectors picture, and one of the cheapest vintage wrestling figures you can buy loose, because Hasbro shipped a mountain of them.',
        'Mattel Elite Series 26: median $20 across 50 sold. The modern standard Warrior. Deep supply, easy to find, priced like it.',
        'Mattel Origins, the Masters of the WWE Universe crossover: median $18.89 across 30 sold. The MOTU-style novelty has not pushed it past the common tier.',
        'Mattel Ultimate Edition Series 1: median $17.93, but only 7 sold. A thinner market, so treat that number as soft.',
      ]},
      { type: 'callout', text: 'Notice the sample sizes. Forty-two and fifty sold in the comp window is a liquid market; you can trust those numbers within a couple of dollars. The figures with seven or fewer sales are where the price gets noisy, and a single motivated buyer can swing the next sale either way.' },
      { type: 'h2', text: 'Why the biggest stars are often the cheapest figures' },
      { type: 'p', text: 'This is the trap that catches new collectors. Fame and figure value are not the same thing, and they are frequently inverse. A wrestler who headlined for years got figure after figure across every line, every retailer, every gimmick. Supply piles up faster than nostalgia can absorb it. The Warrior, Hogan, Austin, and Cena are all easy to find cheap for exactly this reason: the companies made a lot of money printing them, which means a lot of them exist.' },
      { type: 'p', text: 'Scarcity moves price. Fame moves print runs. When a character is famous enough to be printed endlessly, the second force cancels the first, and you get a legend whose loose figure costs eleven dollars.' },
      { type: 'h2', text: 'Where Warrior value actually hides' },
      { type: 'p', text: 'If a Warrior figure is going to carry real money, it will not be the mainline release. It will be a condition story or a scarcity story. A sealed, sharp-cornered vintage Hasbro card grades into a different market than the $11 loose figure; preservation-grade vintage is a separate buyer. Short-printed or retailer-exclusive variants, and the genuinely low-sample releases, are the only places the common-floor rule bends. Confirm the scarcity is real before you pay for it: a low sold count can mean rare, or it can simply mean nobody is buying.' },
      { type: 'p', text: 'For the everyday Warrior on a shelf, the honest answer is that it is a common figure, and that is fine. You collect the Warrior because the Warrior meant something, not because the plastic is an investment.' },
      { type: 'p', text: 'Before you buy or sell one, pull the real sold history. [[Look up any Ultimate Warrior figure|/wrestling/character/ultimate-warrior]] and you will see the median, the range, and how many sales backed it, the same data this guide is built on. The asking price is a wish; [[the sold price|/guides/how-to-find-action-figure-values]] is the truth.' },
    ],
  },
  {
    slug: 'tully-blanchard-figure-value',
    title: 'Tully Blanchard Figures: When a Horseman Out-Prices the Headliners',
    metaTitle: 'Tully Blanchard Figure Value & Price — Real Sold Comps | FigurePinner',
    metaDescription:
      'What Tully Blanchard action figures sell for — the Jakks Classic Superstars that beats modern main-event figures, the Elite Legends two-pack, and why a non-headliner holds value. Real eBay sold comps.',
    dek: 'He never main-evented WrestleMania. His figures still out-price plenty of wrestlers who did. Scarcity is why.',
    readingMinutes: 5,
    updated: '2026-06-25',
    body: [
      { type: 'p', text: 'Tully Blanchard was a tag-team specialist and a Horseman, not a headliner who got a figure in every wave for thirty years. That is exactly why his figures are worth more than you would guess, and in at least one case, worth more than a modern Ultimate Warrior.' },
      { type: 'p', text: 'The sold comps tell a story that runs opposite to fame. Tully was not printed endlessly, so the figures that exist clear at real numbers instead of bargain-bin prices.' },
      { type: 'h2', text: 'What the sold comps say' },
      { type: 'ul', items: [
        'Jakks Classic Superstars Series 15: median $38 across 16 sold. This is the Tully to know. It out-medians the modern Mattel Elite Ultimate Warrior at $20, and the Warrior was a world champion. Sixteen sales is a real market, not a fluke.',
        'Mattel Elite Legends, the Four Horsemen two-pack: median $24.29 across 21 sold. A solid, liquid number, helped by the fact that you are buying a piece of the Four Horsemen, one of the most collected factions in wrestling.',
        'Remco All-Star Wrestlers (NWA, vintage): no sold comps in the window. The vintage Remco rarely trades, which is its own signal. You cannot quote a price on a figure nobody is selling, and an empty sold history means the next sale could land anywhere.',
      ]},
      { type: 'callout', text: 'An empty sold history is not the same as worthless or priceless. It means the market is illiquid. Price it off the nearest real comps you can find, in the closest condition, and treat any single sale as an anecdote until a few more confirm it.' },
      { type: 'h2', text: 'Scarcity beats fame' },
      { type: 'p', text: 'Here is the rule the Tully comps prove. A non-main-eventer who got a handful of figures can hold value better than a megastar who got hundreds, because the thing that moves price is how many exist, not how famous the wrestler was. Collectors chasing a complete Four Horsemen shelf have few Tully options to compete over, and limited supply against steady demand is the whole pricing equation.' },
      { type: 'p', text: 'It is the same reason a deep-cut character can quietly out-price a legend in the same line. Fame sets the demand. The print run sets the supply. Supply is usually the variable that decides what you actually pay.' },
      { type: 'h2', text: 'What to check before you buy' },
      { type: 'p', text: 'Match the line and the condition to the comp. A loose Classic Superstars Tully and a sealed one are different markets, and the Horsemen two-pack is priced as a set, so a split or incomplete example is worth less than the $24.29 figure. With a vintage Remco that barely trades, lean on condition and patience rather than a confident number.' },
      { type: 'p', text: 'Pull the real history before you pay. [[Look up any Tully Blanchard figure|/wrestling/character/tully-blanchard]] for the median, the range, and the sale count behind it. If you are pricing a deep-cut wrestler in general, [[start with sold comps, not listings|/guides/how-to-find-action-figure-values]].' },
    ],
  },
  {
    slug: 'how-to-price-wrestling-figures',
    title: 'How to Price a Wrestling Figure (Without Getting Worked)',
    metaTitle: 'How Much Is My WWE Figure Worth? Price It With Real Sold Comps | FigurePinner',
    metaDescription:
      'How much is my WWE figure worth? Stop pricing off asking prices. Value any wrestling figure with real eBay sold comps — condition, completeness, line, and the MOC-vs-loose premium that moves price.',
    dek: 'The asking price is a wish. The sold price is the truth. Here is how to tell them apart.',
    readingMinutes: 7,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'Here is the mistake almost everyone makes. They look up a figure, see three listings at $90, $110, and $135, and decide it is "worth about a hundred bucks." Then they either overpay buying one or sit forever trying to sell theirs at a number nobody pays. Those listings are not prices. They are asking prices — what a seller hopes to get. The real number is what the last several actually sold for, and it is almost always lower than the wall of active listings suggests.' },
      { type: 'p', text: 'Pricing a wrestling figure well is a skill, and it is mostly about ignoring the noise. Here is the method collectors who flip for a living actually use.' },

      { type: 'h2', text: 'Rule one: only sold comps count' },
      { type: 'p', text: 'A "comp" is a comparable sale — a recent, completed transaction for the same figure in the same condition. On eBay, the toggle that matters is "Sold Items." Active listings tell you what sellers want. Sold listings tell you what buyers paid. The gap between those two numbers is where beginners lose money.' },
      { type: 'p', text: 'Pull the last five to ten sold comps. Throw out the obvious outliers — the $5 one that was missing an arm, the $200 one that was a bundle of four figures. What is left is your range. The median of that range is your honest market value. Not the high. Not the low. The middle of what real people actually paid.' },
      { type: 'callout', text: 'A single sale is an anecdote. Five sales is a market. If a figure only has one comp in 90 days, you are not looking at a price — you are looking at a guess, and you should treat the value as uncertain.' },

      { type: 'h2', text: 'Rule two: condition is not one number, it is a fork in the road' },
      { type: 'p', text: 'A wrestling figure does not have "a price." It has at least two, and they can differ by 40% or more. The community splits on a cultural fault line — openers versus MOC (mint-on-card) collectors — and that split is also a pricing fact.' },
      { type: 'ul', items: [
        'MOC / sealed — never opened, on the original card or in the original box. Commands a premium because it is preservation-grade and there are fewer of them every year as people open them.',
        'Loose, complete — out of the package but with every accessory, belt, and entrance piece. This is the baseline most comps represent.',
        'Loose, incomplete — missing the title belt, the chair, the removable vest. Routinely sells for 30–50% of a complete example. Accessories carry real money.',
      ]},
      { type: 'p', text: 'When you pull comps, filter to the condition you actually have. Comparing your loose, beat-up Stone Cold to MOC sold listings is how people convince themselves their shelf is worth triple what it is. Price like Meltzer rates matches: against the correct comparison, not the flattering one.' },

      { type: 'h2', text: 'Rule three: the line and the era set the ceiling' },
      { type: 'p', text: 'Two figures of the same wrestler can be worth wildly different amounts depending on who made it and when. The same Hulk Hogan exists as a 1991 Hasbro, a Jakks Classic Superstars, and a modern Mattel Elite — and those are three different markets with three different buyers.' },
      { type: 'ul', items: [
        '[[Vintage (LJN 1984–89, Hasbro WWF 1990–94)|/wrestling/wwf-hasbro]] — driven by nostalgia and scarcity. The 80s/90s kids who owned these are now in their peak earning years, and that demand is not going away. LJN rubber figures in clean shape carry serious premiums.',
        '[[Jakks era (1996–2010)|/wrestling/ruthless-aggression]] — the bridge generation. Ruthless Aggression and Deluxe Aggression have devoted collectors and surprisingly strong comps on the right names.',
        '[[Mattel Elite (2010–present)|/wrestling/elite]] — the modern standard. Deep, ongoing, and where most active trading happens. Chase variants, exclusives, and early series numbers carry the value here.',
      ]},
      { type: 'p', text: 'Knowing the era tells you who is buying and why. A vintage Hasbro buyer is buying 1991 back. An Elite buyer is completing a current run. Different emotion, different price behavior.' },

      { type: 'h2', text: 'Rule four: scarcity is a number, not a vibe' },
      { type: 'p', text: '"Rare" is the most abused word in the hobby. Everything is "rare" in a listing title. Scarcity that actually moves price is specific and measurable: a chase variant that packed out at roughly 1-in-6, a retailer exclusive, a convention figure, a short-printed series. If you cannot point to why a figure is scarce, assume it is not, and price it like the common version it probably is.' },
      { type: 'callout', text: 'The honest scarcity signal is sales frequency. A figure with four sales in 90 days is liquid — you know the price. A figure with one sale in a year is genuinely scarce, but it also means the next sale could land anywhere. Thin markets are volatile in both directions.' },

      { type: 'h2', text: 'Putting it together' },
      { type: 'p', text: 'Pricing a figure is four questions, in order. What did the last several actually sell for? What condition were those, and does it match mine? What line and era is this, and who buys it? And is there a real, specific scarcity reason it should sell above the common version? Answer those honestly and you will price like someone who has been doing this for years.' },
      { type: 'p', text: 'That is exactly what [[FigurePinner|/]] does for you on every figure page — real eBay sold comps, median, range, and how many sales backed the number, so you are working from the truth instead of the wishlist. [[Look up any figure|/]] and you will see the sold data first. The whole point is that you never have to take an asking price at face value again.' },
    ],
  },

  {
    slug: 'spotting-fake-wrestling-figures',
    title: 'Spotting Fakes, Bootlegs, and Repro Cards Before You Buy',
    metaTitle: 'How to Spot Fake & Bootleg Wrestling Figures | FigurePinner',
    metaDescription:
      'Counterfeit accessories, reproduction cards, swapped variants. A collector-grade checklist for authenticating wrestling figures before you pay grail money for a fake.',
    dek: 'The closer a figure gets to grail money, the more reason someone has to fake it. Here is what to check.',
    readingMinutes: 8,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'Nobody bootlegs a $12 figure. The fakes cluster exactly where the money is — the high-dollar variants, the sealed vintage, the accessory that is worth more than the figure it came with. As wrestling figure prices have climbed, the counterfeits have gotten good. Not perfect. But good enough that "it looked right in the photos" has cost a lot of collectors a lot of money.' },
      { type: 'p', text: 'You do not need to be an expert to avoid the common traps. You need a checklist and the discipline to run it before you pay, not after.' },

      { type: 'h2', text: 'The four things people actually fake' },
      { type: 'p', text: 'Counterfeiting in this hobby is not usually a whole fake figure. It is targeted, because the faker only bothers where the premium lives.' },
      { type: 'ul', items: [
        'Accessories. A removable elbow pad, a specific title belt, an entrance jacket — when the complete figure is worth far more than the loose body, reproducing the missing piece is pure profit. This is the single most common fake in the hobby.',
        'Reproduction cards and bubbles. Vintage MOC value lives in the packaging. Repro cardbacks and resealed bubbles let someone turn a loose figure into a "sealed" one.',
        'Variant deco. Repainting a common figure into the rare colorway, or relabeling a standard release as a chase.',
        'Whole-figure bootlegs. Mostly an issue on vintage and overseas-market figures — softer plastic, off colors, fuzzy paint apps.',
      ]},

      { type: 'h2', text: 'The accessory test' },
      { type: 'p', text: 'Because accessories are the number-one fake, treat any "complete" listing with the rare piece as guilty until proven innocent — especially when the price hinges on that piece. Reproduction accessories give themselves away in the details: plastic that is slightly too glossy or too matte, paint that sits on the surface instead of in the sculpt, seam lines in the wrong place, a color that is close but not the factory shade. Ask the seller for a close-up of the accessory next to the figure. A real one matches the era and material of the figure it shipped with. A repro often looks newer than the toy it belongs to.' },
      { type: 'callout', text: 'A figure that is "loose complete" for the price of "loose incomplete plus a suspiciously cheap rare accessory" is the classic setup. If the math is too good, the accessory is the part being faked.' },

      { type: 'h2', text: 'The card-and-bubble test (vintage MOC)' },
      { type: 'p', text: 'Sealed vintage is where repro cards do the most damage, because the entire premium is the packaging. Check the cardstock — originals from the 80s and early 90s have aged paper with a specific weight and color; reproductions often print too bright, too white, or on stock that is too clean for a 35-year-old card. Look at the bubble: an original blister has factory-sealed edges, while a resealed bubble shows glue residue, slightly melted edges, or a bubble that does not sit flush. Registration on the printing — whether the colors line up crisply — is another tell; bootleg cards frequently have slightly blurry or misaligned printing.' },
      { type: 'p', text: 'When a sealed vintage figure is priced like a grail, that is precisely when to demand raking-light photos of the card edges and the back of the bubble. A legitimate seller of a genuine piece will have them.' },

      { type: 'h2', text: 'The data test — the one most people skip' },
      { type: 'p', text: 'Here is the authentication step that has nothing to do with plastic: check the comps. Counterfeits and "too good to be true" listings almost always price against the dream, not the market. If a figure is listed well below the established sold range, that is not always a deal — sometimes it is a signal. A real rare variant does not usually sell for a third of its comps from a brand-new account with no feedback. The price being wrong in your favor is a reason to look harder, not to click faster.' },
      { type: 'callout', text: 'Run the sold comps before you celebrate the bargain. If the listing is 60% under the median and the seller has no track record, the most likely explanations are a fake, a swapped variant, or a scam — not your lucky day.' },

      { type: 'h2', text: 'The seller test' },
      { type: 'p', text: 'On the highest-dollar pieces, the seller is part of the authentication. Feedback history, how long the account has existed, whether they sell other collectibles, and whether their photos are their own (reverse-image-search a suspicious listing photo). None of this is foolproof, but a brand-new account listing a single high-value grail with stock-looking photos is the profile that should slow you down.' },

      { type: 'h2', text: 'The honest bottom line' },
      { type: 'p', text: 'You cannot authenticate every figure to a certainty from a listing photo, and anyone who tells you otherwise is selling something. What you can do is stack the odds: demand detail shots of the faked-prone parts, check the card and bubble on sealed vintage, verify the seller, and — every single time — run the sold comps so you know whether the price even makes sense. Fakes survive on speed and excitement. Slow down and check, and most of them fall apart.' },
      { type: 'p', text: 'The data half of that checklist is built into FigurePinner. Before you commit, look the figure up — you will see what it actually sells for, how many real sales back that number, and whether the listing in front of you is priced like the truth or like bait.' },
    ],
  },

  {
    slug: 'wwe-elite-vs-ultimate-edition',
    title: 'WWE Elite vs. Ultimate Edition: Which One Should You Collect?',
    metaTitle: 'WWE Elite vs Ultimate Edition — Which to Collect | FigurePinner',
    metaDescription:
      'Mattel WWE Elite and Ultimate Edition compared — articulation, sculpt, accessories, price, and resale. A collector-grade breakdown of which line fits how you collect.',
    dek: 'Same brand, two very different figures, two very different prices. Here is how to choose.',
    readingMinutes: 7,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'Mattel makes both. They both say WWE on the box. And new collectors constantly assume they are basically the same figure at two price points. They are not. Elite and Ultimate Edition are built for different collectors, and buying the wrong one for how you actually collect is how shelves fill up with figures that do not get touched.' },
      { type: 'p', text: 'Here is the honest comparison — what each line is, who it is for, and what the resale market says about both.' },

      { type: 'h2', text: 'What WWE Elite actually is' },
      { type: 'p', text: 'Elite is the workhorse line and has been since 2010. It is the deep, ongoing series that covers the entire roster — current stars, legends, NXT, the lot — at a steady cadence of new waves. A standard Elite figure gives you solid articulation, a swappable accessory or two, entrance gear on many releases, and a sculpt that is good without being showpiece-grade.' },
      { type: 'p', text: 'The defining trait of Elite is breadth. If you want a specific midcard wrestler from a specific era, Elite is almost certainly the line that made him. That depth is also why most active trading in modern WWE figures happens here — there is simply more to collect, complete, and chase.' },

      { type: 'h2', text: 'What Ultimate Edition actually is' },
      { type: 'p', text: 'Ultimate Edition is the premium tier. Fewer releases, bigger box, and a figure built to be the definitive version of that wrestler: extra heads with different expressions, multiple sets of swappable hands, entrance attire AND match attire, and accessories that recreate a specific moment or look. The sculpting and deco are a clear step above standard Elite.' },
      { type: 'p', text: 'The trade-off is price and selection. Ultimate Edition costs roughly double a standard Elite at retail, and the line only covers the top-tier names and biggest moments. You will not find a deep-cut jobber in Ultimate Edition. You will find the definitive Undertaker, the definitive Bray Wyatt, the version built to be the centerpiece of a shelf.' },

      { type: 'h2', text: 'The real decision: how do you collect?' },
      { type: 'p', text: 'This is not a quality ranking. It is a fit question, and it maps almost perfectly onto two of the core drives that pull people into the hobby.' },
      { type: 'ul', items: [
        'If you are a completionist or roster collector — you want the whole division, every era, the obscure names — Elite is your line. The breadth is the point, the per-figure cost is manageable, and the depth feeds the "one more to finish the set" pull.',
        'If you are a curator or display collector — you want a smaller shelf of definitive, photograph-ready showpieces — Ultimate Edition is built for you. Each one is a centerpiece, and the extra heads and attire let you pose the exact moment you remember.',
        'If you open and play-pose, both work, but Ultimate Edition gives you more to work with out of the box (more hands, more expressions, more gear).',
        'If you keep things MOC, weigh it carefully — the larger Ultimate Edition box is more display-dominant sealed, and its lower print runs can matter more to long-term scarcity.',
      ]},

      { type: 'h2', text: 'What the resale market says' },
      { type: 'p', text: 'Premium retail price does not automatically mean premium resale, and this is where collectors should let comps decide rather than instinct. Ultimate Edition figures of marquee names and retired-from-the-line moments can hold or climb well, because the line does not constantly re-release the same character — scarcity is real. But not every Ultimate Edition is a grail; the ones tied to a hot wrestler or a specific iconic look carry the value, while others sit closer to retail.' },
      { type: 'p', text: 'Elite resale is a volume game. Most standard Elites are affordable on the secondary market precisely because they are plentiful, but the early series numbers, chase variants, retailer exclusives, and certain legends buck that and command real premiums. The line is deep enough that the value is in knowing which specific figures are scarce — not in assuming the whole line is.' },
      { type: 'callout', text: 'Do not buy either line as an "investment" on vibes. A marquee Ultimate Edition and a common Elite can both be the right buy or the wrong buy depending on the specific figure and its comps. Check the sold data on the exact release before you decide what it is worth.' },

      { type: 'h2', text: 'The bottom line' },
      { type: 'p', text: 'Elite is for collectors who want the whole story — every wrestler, every era, an endless run to complete. Ultimate Edition is for collectors who want a curated shelf of definitive showpieces and are willing to pay for the upgrade. Most serious collectors end up with both: Elite for breadth, Ultimate Edition for the names that deserve the deluxe treatment.' },
      { type: 'p', text: 'Whichever way you lean, price the specific figure before you buy. Pull up any Elite or Ultimate Edition release on FigurePinner and you will see its real sold comps — so you know whether you are paying showpiece money for a showpiece, or for a figure the market treats as common.' },
    ],
  },

  {
    slug: 'vintage-wrestling-figure-value',
    title: 'Why Vintage Wrestling Figures Keep Climbing: LJN, Hasbro, and Jakks',
    metaTitle: 'Vintage Wrestling Figure Value — LJN, Hasbro WWF, Jakks | FigurePinner',
    metaDescription:
      'What actually drives vintage wrestling figure prices — the LJN rubber giants, Hasbro WWF, and the Jakks era. Scarcity, nostalgia, and which figures hold value, backed by sold comps.',
    dek: 'The kids who owned these in 1990 are in their peak earning years now. That is not a coincidence — it is the whole story.',
    readingMinutes: 8,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'There is a reason a chunk of rubber from 1985 can cost more than a brand-new premium figure with forty points of articulation. It has almost nothing to do with the plastic and almost everything to do with who is buying. The vintage wrestling market runs on a simple, powerful engine: the people who had these as kids now have money, and they are buying their childhood back one figure at a time.' },
      { type: 'p', text: 'If you understand the three vintage eras and what makes each one move, you can tell the difference between a figure that is genuinely climbing and one that is just old. Old is not the same as valuable. Here is what actually drives the number.' },

      { type: 'h2', text: 'LJN (1984–1989): the rubber giants that started it all' },
      { type: 'p', text: 'LJN made the first major WWF line — big, solid rubber figures, roughly 8 inches, no articulation to speak of. They were the figures of the Hulkamania boom, the ones a kid carried to school in a backpack. That is exactly why they carry serious money today: they map directly onto the single biggest nostalgia wave in wrestling history.' },
      { type: 'p', text: 'The value drivers in LJN are condition and completeness, and the condition bar is brutal because these were played with hard. Solid color, no chew marks, no sun-fade, paint still crisp — clean LJN is genuinely scarce because most of it got destroyed. Add the original card and you are in a different price tier entirely; MOC LJN is preservation-grade and there is less of it every year.' },
      { type: 'callout', text: 'With LJN, "loose and beat up" and "loose and clean" are two different markets, not one market with a discount. A faded figure with a gnawed boot is a $20 figure. The same character with sharp paint and no wear can be a multiple of that. Condition is not a modifier here — it is the whole comp.' },

      { type: 'h2', text: 'Hasbro WWF (1990–1994): the line everyone remembers' },
      { type: 'p', text: 'Hasbro took over and shrank the scale — smaller figures with a spring-loaded action feature, a punch or a slam you triggered by squeezing the legs. For a huge swath of collectors, the Hasbro line IS wrestling figures. It is the one your parents drove to three stores to find, the one you opened on a birthday in 1992.' },
      { type: 'p', text: 'Hasbro value is driven by two things on top of nostalgia: the later series numbers and the unreleased-in-the-US figures. The early waves were produced in big numbers and stay affordable. The final series were shorter-printed as the line wound down, and those figures — plus the European-exclusive releases that never hit US shelves — are where the real premiums live. Same line, wildly different prices, and the difference is almost entirely print run.' },
      { type: 'ul', items: [
        'Early Hasbro series — plentiful, affordable, the entry point for vintage collecting.',
        'Late Hasbro series — shorter runs, fewer survivors, the names that quietly command real money.',
        'MOC Hasbro — the card art is iconic, and sealed examples carry a strong premium over loose.',
      ]},

      { type: 'h2', text: 'The Jakks era (1996–2010): the bridge generation' },
      { type: 'p', text: 'Jakks Pacific carried wrestling figures through the Attitude Era and into the 2000s, and for a long time these were treated as "too new to matter." That window is closing. Ruthless Aggression and Deluxe Aggression collectors are now exactly where the Hasbro collectors were fifteen years ago — old enough to feel the nostalgia, established enough to spend on it. Classic Superstars, the Jakks tribute line to the golden-era talent, sits in an interesting spot: vintage subjects, less-vintage production.' },
      { type: 'p', text: 'Jakks value is the most name-dependent of the three eras. The line was deep and produced a lot of figures, so the floor is low — but the right wrestler in the right release punches well above it. This is the era where checking the specific comp matters most, because "Jakks" alone tells you almost nothing about price.' },

      { type: 'h2', text: 'The pattern across all three eras' },
      { type: 'p', text: 'Strip away the specifics and the same forces set vintage value every time. Nostalgia sets the demand — and demand peaks for the figures someone owned between roughly ages six and twelve, which is why the buying wave moves forward in time as collectors age. Scarcity sets the ceiling — short prints, region exclusives, and the brutal attrition of clean vintage condition. And completeness sets the spread — a missing belt or a chewed-up paint job is not a small deduction, it is a different figure.' },
      { type: 'callout', text: 'The honest test for any "rare vintage" claim is the same as for modern figures: how many actually sold, and at what? A vintage figure with four clean comps in 90 days has a price you can trust. One with a single sale in a year is genuinely scarce — and genuinely volatile, because the next sale could land anywhere.' },

      { type: 'h2', text: 'The bottom line' },
      { type: 'p', text: 'Vintage wrestling figures climb because the demand behind them is demographic, not speculative — a generation buying back a specific feeling, with a supply that only shrinks as clean examples get rarer. But "vintage" is not a price. LJN condition, Hasbro print run, and Jakks name selection each tell you something the word "old" never will.' },
      { type: 'p', text: 'Before you pay vintage money, pull the figure up on FigurePinner and look at the real sold comps for the exact condition you are buying. The whole vintage market runs on the gap between what a piece feels like it is worth and what it actually sells for — and the sold data is the only thing that closes it.' },
    ],
  },

  {
    slug: 'completing-a-wave-completionist-guide',
    title: 'Completing a Wave: The Completionist\'s Guide (and the BAF Trap)',
    metaTitle: 'How to Complete an Action Figure Wave — Completionist Guide | FigurePinner',
    metaDescription:
      'The smart way to finish a figure wave without overpaying for the last piece. How Build-a-Figure waves work, why the final figure costs the most, and how to plan completion with sold data.',
    dek: 'The last figure in the wave is the one that costs you. Here is how to finish the set without getting taken.',
    readingMinutes: 7,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'Every collector knows the feeling. You have eleven of the twelve. The shelf looks almost right — and that "almost" is louder than the eleven you already own. Your brain will not let it go. That itch is real, it has a name, and the entire toy industry is built to exploit it. Understanding how completion actually works is how you finish sets you love without paying grail money for a figure that should cost twenty bucks.' },
      { type: 'p', text: 'This is the completionist\'s guide: how waves are built, where the cost hides, and how to plan a finish instead of panic-buying the last piece.' },

      { type: 'h2', text: 'Why the last figure always costs the most' },
      { type: 'p', text: 'It is not your imagination and it is not bad luck. The final figure in a set is systematically the expensive one, for two reasons that compound each other. First, case-pack ratios: figures are not produced in equal numbers. A wave ships with two of the popular character and one of the deep-cut, so the deep-cut is scarcer the day it hits shelves. Second, the completion premium: once a collector has most of a set, they will pay far above market for the final piece, because the value to them is finishing — not the figure itself. Sellers know this. The last figure you need is priced against your itch, not against the market.' },
      { type: 'callout', text: 'The figure you need to finish and the figure someone else needs to finish are the same figure — and you are both willing to overpay for it. That shared desperation is the whole reason the last piece carries a premium. Recognizing it is the first step to not paying it.' },

      { type: 'h2', text: 'How Build-a-Figure waves weaponize completion' },
      { type: 'p', text: 'The Build-a-Figure — BAF, sometimes called Collect-and-Connect — is the cleverest completion mechanic in the hobby. Marvel Legends popularized it: each figure in the wave includes one piece of a larger figure, and you only get the complete bonus character by buying every figure in the assortment. Buy six or seven figures, assemble a Galactus. Skip one, and you have a Galactus missing a leg.' },
      { type: 'p', text: 'It is genius marketing because it makes the pegwarmer sell. The least popular figure in the wave is the one packed with the most-wanted BAF piece, so completionists who could not care less about that character buy it anyway — for the limb. The BAF turns "I want six figures" into "I need all seven."' },
      { type: 'ul', items: [
        'The full set of figures gets you the complete BAF — the intended, cheapest path if you buy at retail as the wave drops.',
        'The loose BAF, sold assembled on the secondary market, is the shortcut — but you pay a premium for someone else having done the collecting.',
        'A single BAF piece (just the leg, just the torso) trades on its own, and the rarest piece — usually the one packed with the popular figure — is the one that holds people up.',
      ]},

      { type: 'h2', text: 'The completionist\'s actual playbook' },
      { type: 'p', text: 'Finishing a wave well is about sequencing and patience, not speed. The collectors who complete sets without bleeding money follow roughly the same approach.' },
      { type: 'h3', text: 'Buy the hard one first, not last' },
      { type: 'p', text: 'This is the counterintuitive move that saves the most money. The shortpacked figure only gets more expensive as more collectors get deep into the set and start hunting the same final piece. If you know going in which figure is the chase, buy it early when it is just another figure on the peg — before it becomes everyone\'s last piece.' },
      { type: 'h3', text: 'Know the case ratio before you start' },
      { type: 'p', text: 'A wave where every figure packs evenly is a wave you can complete at a steady pace. A wave with a known shortpack is one where you move on that figure the moment you see it. Walking in knowing which is which changes the whole hunt.' },
      { type: 'h3', text: 'Decide loose-vs-sealed before you buy, not during' },
      { type: 'p', text: 'Completing a wave MOC is a different budget and a different difficulty than completing it loose, and mixing the two leaves you with a shelf that looks inconsistent. Pick the lane up front. The opener finishing a loose set and the MOC collector finishing a sealed run are playing two different games — and the sealed game is almost always the more expensive one.' },

      { type: 'h2', text: 'Use the data to plan the finish' },
      { type: 'p', text: 'The single biggest completionist mistake is paying the panic price for the last figure when a little patience would have gotten it cheaper. Sold comps tell you whether the price you are seeing is the real market or just the finish-the-set tax. A figure with steady sales at a stable number is one you can wait on. A figure with almost no comps and wild swings is one to grab when a fair one appears, because the next fair one might not come soon.' },
      { type: 'callout', text: 'Completion percentage is satisfying to watch climb — but the last 10% is where collectors overspend. Let the comps, not the itch, set your ceiling on the final piece.' },

      { type: 'h2', text: 'The bottom line' },
      { type: 'p', text: 'The drive to complete a set is one of the best parts of collecting and one of the easiest to get exploited. Waves are engineered so the last figure costs the most, and BAFs are engineered so you buy figures you never wanted. None of that is a reason to stop — it is a reason to plan. Buy the hard piece early, know your case ratios, pick your lane, and let sold data set your limit on the finish.' },
      { type: 'p', text: 'FigurePinner is built for exactly this. Track your wave, watch your completion percentage climb, and check the real sold comps on the figures you still need — so when you finally close out the set, you finished it on your terms instead of the seller\'s.' },
    ],
  },

  {
    slug: 'star-wars-black-series-starter-guide',
    title: 'Star Wars Black Series: A Collector\'s Starting Point',
    metaTitle: 'Star Wars Black Series Collecting Guide for Beginners | FigurePinner',
    metaDescription:
      'New to the 6-inch Star Wars Black Series? A collector\'s guide to the packaging eras, what drives value, exclusives and reissues, and how to start collecting without overpaying.',
    dek: 'The deepest 6-inch line in the galaxy, and the easiest place for a new collector to overpay. Start here instead.',
    readingMinutes: 7,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'The Star Wars Black Series is one of the great modern collecting lines — 6-inch, 1/12 scale, premium articulation, and deep enough that almost any character you remember exists somewhere in it. It is also a line where a new collector can walk in, see wild secondary prices on a handful of figures, and conclude the whole thing is expensive. It is not. Most of it is approachable. The trick is knowing which figures actually carry value and why.' },
      { type: 'p', text: 'Here is the orientation a friend who has been collecting the line for years would give you before you spend a dollar.' },

      { type: 'h2', text: 'Read the packaging eras — they date the figure instantly' },
      { type: 'p', text: 'Hasbro launched the 6-inch Black Series in 2013, and the packaging has changed enough times that the box itself tells you roughly when a figure came out. That matters because era correlates with availability and price.' },
      { type: 'ul', items: [
        'Orange line (2013–2014) — the original launch packaging. The earliest figures, lower production, and the ones with the most collector heat today.',
        'Blue line (2014–2015) — the short-lived second look, sandwiched between orange and red.',
        'Red line (2015–2020) — the long-running era most collectors picture; the bulk of the line\'s depth was built here.',
        'The current numbered Galaxy collection — figures sorted into individual collections, the packaging you will find at retail now.',
      ]},
      { type: 'p', text: 'A new collector does not need to memorize this, but recognizing orange packaging on a secondary listing — and understanding why it commands more — is the difference between paying a fair early-era premium and overpaying out of ignorance.' },

      { type: 'h2', text: 'What actually drives Black Series value' },
      { type: 'p', text: 'The line is enormous, so most figures are affordable and easy to find. Value concentrates in a few predictable places, and learning them protects you from the two beginner mistakes: overpaying for a common figure and underpaying attention to a genuinely scarce one.' },
      { type: 'ul', items: [
        'Early-era figures — the orange and blue waves were produced in smaller numbers before the line\'s popularity exploded. Clean early figures, especially the marquee characters, carry real premiums.',
        'Exclusives — retailer and convention-exclusive figures (and the deluxe sets) print in lower numbers and consistently sit above wide-release figures.',
        'Army builders — troopers and droids that collectors buy in multiples to build a display. Demand is structurally higher because each collector wants several, not one.',
        'No-reissue characters — figures Hasbro has not re-run. The line constantly reissues popular characters in new packaging, which caps prices; the ones it has not revisited stay scarce.',
      ]},
      { type: 'callout', text: 'The reissue factor is the single most important thing for a new Black Series collector to understand. A figure that feels rare can become common overnight when Hasbro re-runs it. Before you pay a premium for "hard to find," check whether a reissue is on the way — it can erase the premium entirely.' },

      { type: 'h2', text: 'The opener-vs-MOC question in this line' },
      { type: 'p', text: 'The Black Series splits on the same fault line as every collecting community: openers who want the figure posed on a shelf, and MOC collectors who keep it sealed in the window box. Neither is wrong, and the line serves both. What is worth knowing as a beginner is that sealed examples of the scarcer early-era and exclusive figures carry a meaningful premium over loose, while for common reissued figures the gap is small. Decide which camp you are in early — it changes both your budget and what you hunt.' },

      { type: 'h2', text: 'How to start without overpaying' },
      { type: 'p', text: 'The best entry into the Black Series is to collect what you actually love — a character, a film, a faction — rather than chasing "valuable" figures. The line is deep enough that a focused display is more satisfying and far cheaper than trying to own everything. Buy current-wave figures at retail when you can; they are the floor. Save the secondary-market spending for the specific early-era or exclusive figures your display genuinely needs.' },
      { type: 'p', text: 'And before any secondary purchase, check what the figure actually sells for. The Black Series has a wide gap between asking prices and sold prices, especially on figures sellers label "rare." Pull the figure up on FigurePinner, look at the real sold comps, and you will know in seconds whether you are looking at a fair early-era premium or a hopeful asking price on a figure that is about to be reissued.' },
    ],
  },

  {
    slug: 'marvel-legends-where-to-begin',
    title: 'Marvel Legends: Where to Begin',
    metaTitle: 'Marvel Legends Collecting Guide for Beginners | FigurePinner',
    metaDescription:
      'A beginner\'s guide to collecting Marvel Legends — the ToyBiz and Hasbro eras, how Build-a-Figure waves work, what drives value, and how to start a focused collection with real sold data.',
    dek: 'Twenty-plus years deep, hundreds of figures, and one mechanic designed to make you buy more than you meant to. Start smart.',
    readingMinutes: 7,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'Marvel Legends is the deepest superhero figure line ever made and, for a new collector, the most overwhelming. It has been running for more than two decades, across two different manufacturers, with a Build-a-Figure system specifically engineered to get you to buy figures you did not plan on. That depth is the appeal — almost every character you care about exists, often in several versions — but it is also the trap. A little orientation goes a long way.' },
      { type: 'p', text: 'Here is the starting point: the two eras, how the BAF works, what carries value, and how to collect a line this big without it collecting your wallet.' },

      { type: 'h2', text: 'The two eras: ToyBiz and Hasbro' },
      { type: 'p', text: 'Marvel Legends began in 2002 under ToyBiz, as a spin-off of the Spider-Man Classics line, and the early ToyBiz figures established the line\'s identity: comic-accurate, six-inch, heavily detailed, with elaborate bases and packaging. ToyBiz ran the line for sixteen series before the license changed hands. On January 1, 2007, Hasbro took over Marvel Legends, and Hasbro has produced the line ever since — a far longer run than ToyBiz, and the source of the overwhelming majority of figures in the wild today.' },
      { type: 'p', text: 'For a new collector, the era matters for two reasons. ToyBiz-era figures have a distinct sculpting style and a vintage-collector following, and the better ToyBiz pieces carry real premiums. Hasbro-era figures are where almost all current and recent collecting happens, with deeper articulation and an ongoing release cadence you can actually keep up with.' },

      { type: 'h2', text: 'The Build-a-Figure, explained' },
      { type: 'p', text: 'The defining mechanic of Marvel Legends is the Build-a-Figure, and you cannot understand the line\'s pricing without it. ToyBiz introduced the BAF in 2005 with series 9 — fittingly, the first one was Galactus, the devourer of worlds. Each figure in a wave includes one piece of a larger bonus figure; buy the whole assortment and you can assemble a character that is not sold on its own. Hasbro kept the mechanic, and it remains central to the line.' },
      { type: 'callout', text: 'The BAF is why a Marvel Legends wave is priced as a set, not as individual figures. The least popular figure in a wave is often packed with the most-wanted BAF piece — which means that "boring" figure sells out anyway, because completionists need the limb. Understanding this saves you from overpaying for a single BAF piece later.' },
      { type: 'ul', items: [
        'A complete loose BAF on the secondary market carries a premium — you are paying for someone else having bought the whole wave.',
        'Individual BAF pieces trade on their own, and the piece packed with the popular figure is usually the one that holds collectors up.',
        'Buying the full wave at retail as it drops is almost always the cheapest path to the complete BAF.',
      ]},

      { type: 'h2', text: 'What drives Marvel Legends value' },
      { type: 'p', text: 'With hundreds of figures in circulation, most Marvel Legends are affordable — the line\'s depth keeps the floor low. Value concentrates in familiar places, and a few of them are specific to this line.' },
      { type: 'ul', items: [
        'ToyBiz-era figures — the early sculpts with a dedicated collector base; the strong ones carry vintage-style premiums.',
        'Build-a-Figure completeness — a loose figure with its correct BAF piece is worth more than one without; complete assembled BAFs command their own price.',
        'Exclusives and two-packs — retailer exclusives, convention figures, and boxed sets print in lower numbers.',
        'X-Men and fan-favorite teams — team-based collecting drives demand; collectors completing a roster pay up for the figures that finish it.',
        'No-reissue characters — like most modern lines, Hasbro reissues popular characters, which caps prices; the figures it has not revisited stay scarcer.',
      ]},

      { type: 'h2', text: 'How to start a line this big' },
      { type: 'p', text: 'Nobody collects all of Marvel Legends, and trying is how new collectors burn out and overspend. The collectors who enjoy the line pick a lane: a single team (the X-Men are the classic choice), a single character\'s variants, a specific era, or the figures from films and shows they love. A focused display is more satisfying and dramatically cheaper than chasing everything, and it gives you a clear answer to "do I need this one?"' },
      { type: 'p', text: 'Buy current waves at retail when you can — that is the price floor — and reserve secondary-market spending for the specific older or exclusive figures your collection actually needs. Before any of those purchases, check the real sold comps. Marvel Legends has a notably wide gap between asking and sold prices, especially on figures labeled "rare" that may simply be pre-reissue. Look the figure up on FigurePinner first, and you will know whether the price in front of you is the market or the wishlist.' },
    ],
  },

  {
    slug: 'keep-or-sell-a-figure',
    title: 'Keep It or Sell It? A Collector\'s Decision Framework',
    metaTitle: 'Should You Keep or Sell a Figure? A Decision Guide | FigurePinner',
    metaDescription:
      'The figure has been on your shelf for years and you are not sure if it should stay. A clear framework — sentiment, sold comps, and price trajectory — for deciding what to keep and what to flip.',
    dek: 'Every figure on your shelf is a tiny decision you keep re-making. Here is how to actually make it.',
    readingMinutes: 8,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'You pick it up, turn it over, think about listing it, and put it back down. You have done this with the same figure four times. That is not collecting — that is a decision you keep refusing to make. The good news is it is a solvable problem, because "keep or sell" is really three smaller questions wearing a trenchcoat, and once you separate them the answer usually walks right up to you.' },
      { type: 'p', text: 'The three questions are: how much does this mean to me, what is it actually worth right now, and where is its price heading. Sentiment, comps, trajectory. Most people only ask the first one and then feel guilty, or only ask the second one and then feel like a sellout. Run all three and the figure tells you what to do.' },

      { type: 'h2', text: 'Question one: the sentiment check (be honest, not nostalgic)' },
      { type: 'p', text: 'Start here, because if a figure is genuinely a keeper for you, the money questions do not matter. The figure your dad bought you the weekend before he shipped out. The first grail you saved three paychecks for. The one that is the whole reason you collect this line. Those are not inventory. Keep them, stop touching them, and move on with your day.' },
      { type: 'p', text: 'The trap is fake sentiment — the figure you "kind of like" and have decided you would feel bad selling. That is not attachment, that is inertia. A real test: if it sold tomorrow for a fair price, would you actually miss looking at it, or would you mostly feel relief at the shelf space and the cash? If the honest answer is relief, it is not a keeper. It is a flip you have not committed to yet.' },
      { type: 'callout', text: 'A keeper is a figure you would buy again today at its current market price. If you would not pay to own it now, you are only keeping it out of habit — and habit is not a reason to tie up money and shelf space.' },

      { type: 'h2', text: 'Question two: what is it actually worth (sold comps, not wishes)' },
      { type: 'p', text: 'If a figure survived the sentiment check as a possible sell, now you need its real number. Not the active listings — those are asking prices, what sellers hope to get. The number that matters is what the last several actually sold for. On eBay, that means filtering to Sold Items, pulling the most recent five to ten comps in your figure\'s condition, throwing out the obvious outliers, and taking the median of what is left.' },
      { type: 'p', text: 'Match the condition honestly. A loose, played-with figure does not get to borrow the price of a mint-on-card one. Pull comps for the condition you actually have:' },
      { type: 'ul', items: [
        'MOC / sealed — never opened, on the original card. Carries the preservation premium, and the comp set is the smallest, so prices can swing.',
        'Loose, complete — every accessory, belt, and entrance piece present. This is the baseline most sold comps represent.',
        'Loose, incomplete — missing the chair, the title, the removable jacket. Routinely a fraction of a complete example, because accessories carry real money.',
      ]},
      { type: 'p', text: 'The dollar figure changes the decision. A figure worth $12 is almost never worth the time it takes to photograph, list, pack, and ship — keep it or give it to a kid. A figure worth $150 is a real decision. Knowing which bucket you are in tells you whether the "sell" option is even on the table.' },

      { type: 'h2', text: 'Question three: where is the price heading (trajectory)' },
      { type: 'p', text: 'A price is a snapshot. Trajectory is the movie. Two figures worth $80 today are not the same hold if one has been climbing for two years and the other is sliding toward a reissue. You cannot predict the future, but you can read the obvious signals.' },
      { type: 'ul', items: [
        'Reissue risk — the single biggest value killer in modern figures. If the line is actively re-running characters and yours is an obvious candidate, the downside is real. Selling before a reannouncement beats selling after one.',
        'Real-world catalysts — a Hall of Fame induction, a return, or sadly a death can spike a wrestler\'s figures fast. If a figure already ran up on news, you may be looking at a temporary peak, not a new floor.',
        'Nostalgia aging in — vintage lines tend to firm up as the kids who owned them hit peak earning years. That is a slow tailwind, not a reason to panic-sell.',
      ]},
      { type: 'callout', text: 'Sales frequency is your trajectory honesty check. A figure with four sales in 90 days is liquid and you can trust the trend. A figure with one sale in a year is genuinely scarce, but the next sale could land anywhere — thin markets move in both directions.' },

      { type: 'h2', text: 'Putting the three together' },
      { type: 'p', text: 'Run the questions in order and the matrix is simple. High sentiment? Keep it, full stop — the price is irrelevant. Low sentiment plus a meaningful value plus a flat-or-falling trajectory? That is a clean sell, and the longer you wait the more you risk a reissue or a faded peak. Low sentiment plus a rising trajectory? That is the one real "hold" — not because you love it, but because the data says next quarter pays better than today.' },
      { type: 'p', text: 'The figures that paralyze you are almost always the low-sentiment ones where you never bothered to pull the comps. The fog is just missing information. Get the real number, glance at the trend, and the decision stops being emotional and starts being obvious.' },
      { type: 'p', text: 'That is the work FigurePinner does on every figure page — real eBay sold comps, the median, the range, and how many sales backed it, so the value question takes ten seconds instead of an afternoon. Look up the figure you keep putting back on the shelf, and let the data make the call you have been avoiding.' },
    ],
  },

  {
    slug: 'read-ebay-sold-listings',
    title: 'How to Read an eBay Sold Listing Like a Pro',
    metaTitle: 'How to Read eBay Sold Listings — Clean Your Comps | FigurePinner',
    metaDescription:
      'A sold price is not always a real price. Learn to spot shill bids, bundle sales, condition mismatches, and outliers so you can clean a comp set down to the number you can actually trust.',
    dek: 'Anyone can see what a figure sold for. Knowing which sales to believe is the actual skill.',
    readingMinutes: 7,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'A new collector finds the Sold Items filter, sees a figure went for $240, and thinks they just struck gold. A seasoned one sees the same $240 and immediately asks: was that a bundle, a shill, a different variant, or one excited buyer at 11pm? The raw sold number is the easy part. Reading it correctly is the part that separates people who price well from people who get worked.' },
      { type: 'p', text: 'The Sold Items toggle on eBay is the most honest data the hobby has — completed transactions, real money, no wishful thinking. But a comp set straight off the screen is dirty. Here is how to clean it.' },

      { type: 'h2', text: 'First, confirm it is even the same figure' },
      { type: 'p', text: 'Half of bad comps are not misreads — they are the wrong figure entirely. The same character exists across eras and makers, and they are not interchangeable. A 1991 Hasbro Hulk Hogan, a Jakks Classic Superstars Hogan, and a modern Mattel Elite Hogan are three different markets with three different prices. Worse, deco variants and re-tools inside a single line can carry separate values that look identical in a thumbnail.' },
      { type: 'p', text: 'Open the listing. Read the title and look at the photos, not the search-result preview. Confirm the line, the year, the wave, and the specific variant before you let a sale into your comp set. One wrong-figure comp can drag your median off by 50%.' },

      { type: 'h2', text: 'Match the condition, because it forks the price' },
      { type: 'p', text: 'A sold price is meaningless until you know what condition sold. The community\'s opener-versus-MOC split is also a pricing fault line, and a figure can carry wildly different numbers depending on which side of it the sale was on.' },
      { type: 'ul', items: [
        'MOC / sealed sales sit at the top and are the thinnest, most volatile slice of comps.',
        'Loose-complete sales are the workhorse baseline — the cleanest read on a figure\'s everyday value.',
        'Loose-incomplete sales sit well below complete ones, because a missing belt or accessory routinely knocks off a third or more.',
      ]},
      { type: 'p', text: 'If you have a loose figure, comparing it to MOC sold listings is not optimism, it is a mistake — and it is exactly how people convince themselves their shelf is worth triple what it is. Filter to your condition and price against the right comparison, not the flattering one.' },

      { type: 'h2', text: 'The four sales that lie to you' },
      { type: 'p', text: 'Even after you have the right figure in the right condition, individual sales can still mislead. Four patterns to flag and usually throw out:' },
      { type: 'ul', items: [
        'Bundle sales — that $240 was four figures in one lot. The listing photo is a crowd shot and the title says "lot." It tells you nothing about a single figure\'s value. Discard it.',
        'Shill or runaway auctions — two bidders get into a war at midnight and the price rockets past every other comp. One emotional auction is an anecdote, not a market. If a sale is double the next-highest with no reason, set it aside.',
        'Condition mismatches — a "rare" sale that turns out to be missing accessories (priced low) or a graded/sealed example (priced high) when you are valuing a plain loose one. Read the listing; do not trust the price alone.',
        'Best Offer phantoms — the listing shows the original asking price with a strikethrough, but it actually sold via an accepted offer for less. eBay does not always show the accepted number cleanly. Treat struck-through prices with suspicion.',
      ]},
      { type: 'callout', text: 'The Best Offer trap catches even experienced sellers. A figure can show a "$95 SOLD" that was really a $70 accepted offer. When a sold price looks high for the figure, check whether the listing accepted offers — the real number is often lower than the headline.' },

      { type: 'h2', text: 'How many comps you actually need' },
      { type: 'p', text: 'One sale is an anecdote. Five clean sales is a market. After you have tossed the bundles, shills, and mismatches, you want at least a handful of legitimate comps in your condition to trust a price. If a figure only has one or two sales in 90 days, you do not have a price — you have a guess, and you should treat the value as genuinely uncertain rather than pretend that lone sale is gospel.' },
      { type: 'p', text: 'When you do have a clean set, take the median, not the average. The median ignores the one weird high and the one weird low and lands on what a typical buyer actually paid. Average lets a single outlier you forgot to remove yank the whole number around. Median is outlier-resistant by design, which is exactly what you want in a small, messy comp set.' },

      { type: 'h2', text: 'The payoff' },
      { type: 'p', text: 'Reading sold listings well is mostly subtraction. Start with everything that sold, then remove the wrong figures, the wrong conditions, the bundles, the shills, and the offer phantoms. What survives is the truth — and the median of that truth is a price you can buy or sell against without flinching.' },
      { type: 'p', text: 'That cleaning is exactly what FigurePinner automates on every figure page: it pulls the sold comps, surfaces the median and range, and shows how many sales stand behind the number, so you can see at a glance whether you are looking at a real market or a single lucky auction. Look up any figure and you will get the cleaned read first.' },
    ],
  },

  {
    slug: 'beginner-collector-mistakes',
    title: 'The Beginner Mistakes That Cost New Collectors the Most',
    metaTitle: 'Beginner Action Figure Collecting Mistakes to Avoid | FigurePinner',
    metaDescription:
      'Overpaying for "rare," buying incomplete, ignoring reissues, and treating figures as investments. The five expensive mistakes nearly every new collector makes — and how to skip them.',
    dek: 'Nobody warns you about the expensive beginner mistakes until after you have already made them. Consider this the warning.',
    readingMinutes: 8,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'Every collector has a graveyard. The figure they overpaid for because the listing screamed "RARE." The loose one that turned up missing its signature accessory after the box arrived. The grail they bought at full price two weeks before it got reissued for thirty bucks. None of these mistakes feel dumb in the moment — they feel like enthusiasm. The cost only shows up later, when you go to sell and the comps laugh at you.' },
      { type: 'p', text: 'You are going to make some of these regardless; it is part of learning the hobby. But the five below are the ones that cost real money, and every one of them is avoidable with a few seconds of the right kind of skepticism.' },

      { type: 'h2', text: 'Mistake 1: Trusting the word "rare"' },
      { type: 'p', text: '"Rare" is the most abused word in collecting. It is in half the listing titles and it means almost nothing, because the seller typing it has every incentive to. Real scarcity is specific and measurable — a chase variant that packed out at roughly 1-in-6, a retailer or convention exclusive, a genuinely short-printed series. Vague "rare" with no reason attached is just a common figure wearing a costume.' },
      { type: 'p', text: 'The fix is one question: rare why? If the seller cannot point to a specific reason — and if the sold comps show the figure selling regularly at ordinary prices — then it is not rare, and you should pay the common-version price. Let the data overrule the adjective every time.' },

      { type: 'h2', text: 'Mistake 2: Buying loose-incomplete without knowing it' },
      { type: 'p', text: 'A loose figure that looks complete in photos can be quietly missing the one thing that holds its value. The title belt. The entrance vest. The removable mask or weapon. Accessories are not extras — for many figures they are 30 to 50% of the complete price, and a "great deal" on a loose figure is often a great deal precisely because something is gone.' },
      { type: 'ul', items: [
        'Before buying loose, learn what a complete example includes — what accessories shipped with that specific figure.',
        'Ask the seller to photograph the accessories, not just the figure. "Comes as pictured" with no accessories in frame is a red flag, not a description.',
        'Price a loose-incomplete figure against loose-incomplete comps, not complete ones. They are different markets.',
      ]},
      { type: 'callout', text: 'When a loose price looks too good, the missing piece is usually the reason. The chair, the belt, or the soft-goods cape walked off, and you are being quoted the value of a complete figure for an incomplete one.' },

      { type: 'h2', text: 'Mistake 3: Ignoring reissue risk' },
      { type: 'p', text: 'This is the modern-figure value killer that vintage collectors never had to worry about. You pay a premium for a figure that is hard to find, and then the maker reannounces it — a new wave, a retro re-run, a shared exclusive — and the price you paid evaporates. The figure is no longer scarce; it is just early.' },
      { type: 'p', text: 'The protection is to check whether a line is actively re-running characters before you pay grail money for an in-line figure. A figure that is genuinely retired and out of production is a very different bet from one the company can reprint whenever demand spikes. When in doubt on a current line, the safer move is to wait — reissues crash prices down, they rarely send them up.' },

      { type: 'h2', text: 'Mistake 4: Treating figures as an investment' },
      { type: 'p', text: 'It is tempting to frame collecting as a portfolio — buy the right figures, watch them appreciate, cash out later. The reality is harsher. Most figures do not appreciate; the ones that do are unpredictable; and the moment you go to sell, the fees and friction eat a real slice of any gain. Selling on eBay in the collectibles category runs about 15% in final value fees (plus a small per-order fee), and live platforms like Whatnot take roughly 8% commission plus a payment-processing cut of around 2.9% on top. Add shipping and the time to list and pack, and the "profit" on a flip is a lot smaller than the price difference suggests.' },
      { type: 'p', text: 'Collect because you like the figures. If something appreciates, that is a bonus, not a thesis. The collectors who stay happy in this hobby for decades are the ones buying what they love at fair prices — not the ones treating a shelf of plastic like a 401(k).' },

      { type: 'h2', text: 'Mistake 5: Chasing FOMO instead of picking a lane' },
      { type: 'p', text: 'The fastest way to burn out and overspend is to try to collect everything. A new release drops every week, every line has a chase, and the fear of missing out will happily empty your wallet on figures you do not even display. The collectors who build collections they are proud of pick a lane — one line, one era, one character, one team — and buy the floor patiently inside it.' },
      { type: 'p', text: 'A lane turns an infinite, anxious hobby into a finite, satisfying one. It also makes you a better buyer: when you know one corner deeply, you recognize a real deal instantly and you stop overpaying out of uncertainty. Depth beats breadth, for your shelf and your bank account.' },

      { type: 'h2', text: 'The thread running through all five' },
      { type: 'p', text: 'Every one of these mistakes is the same mistake in a different outfit: acting on a story instead of the data. "Rare," "complete," "scarce," "it will go up," "I have to have it now" — each is a narrative the market can confirm or demolish in a few sold comps. The beginner buys the story. The experienced collector checks the number first and lets the story earn its place.' },
      { type: 'p', text: 'That habit is the entire reason FigurePinner exists: pull up any figure and see the real eBay sold comps, the median, the range, and how many sales back it up — before you buy, not after. Make checking the number the reflex, and the expensive beginner graveyard mostly never gets built.' },
    ],
  },

  {
    slug: 'store-and-display-figures',
    title: 'How to Store and Display Figures Without Killing Their Value',
    metaTitle: 'How to Store & Display Action Figures Without Losing Value | FigurePinner',
    metaDescription:
      'Sun-fade, plastic rot, sticker shock, and the wrong display case quietly drain figure value. A collector-grade guide to keeping loose and MOC figures worth what they should be.',
    dek: 'The damage that costs you the most is the kind you never see happening.',
    readingMinutes: 8,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'A figure does not lose value all at once. It loses it the way a tan happens — a little every day, in light you stopped noticing months ago. By the time you spot the yellow cast on a white singlet or the soft warp in a knee joint, the comp has already moved against you. The collectors who keep their shelves worth real money are not lucky. They just understand that storage is a slow-motion condition grade, and they manage it on purpose.' },
      { type: 'p', text: 'Here is what actually degrades a figure, in rough order of how much money it costs you, and what to do about each one.' },

      { type: 'h2', text: 'Light is the silent value killer' },
      { type: 'p', text: 'The single biggest threat to a displayed figure is ultraviolet light. UV breaks down the polymer chains in plastic, and on top of that, plastics made in the 80s and 90s often contained brominated flame retardants that oxidize under UV and release free radicals — which is the chemistry behind that amber-yellow tint on vintage figures. Direct sun through a window will fade a paint app and yellow white plastic in a matter of months. The vintage He-Man or LJN piece sitting in a sunny bay window is aging years for every season.' },
      { type: 'ul', items: [
        'Keep figures out of direct sunlight entirely — position shelves away from windows, not just out of the obvious beam.',
        'Indirect room light is generally fine; it is the direct UV that does the damage.',
        'For lit displays, use LED strips labeled UV-free and keep them at a distance rather than baking the figure up close.',
        'If a piece is genuinely valuable and you want it on display, a UV-filtering acrylic or glass case is cheap insurance against an expensive, irreversible problem.',
      ]},
      { type: 'callout', text: 'Yellowing is not always reversible, and "restored" plastic is a disclosure you have to make when you sell. A buyer paying complete-and-clean money does not want a figure that was retrobrighted back from amber. Prevention is worth far more than any fix.' },

      { type: 'h2', text: 'Heat and humidity finish what light starts' },
      { type: 'p', text: 'Thermal oxidation — plastic reacting with oxygen, sped up by heat — is ultimately unavoidable, but you control the speed. A figure stored in a hot attic or a humid basement ages faster than one kept in living-space conditions. The collector consensus lands around room temperature and humidity under roughly 60%. That is not a precision lab spec; it is "store them where you would be comfortable living," which rules out the two places most people put their overflow: the attic and the garage.' },
      { type: 'p', text: 'Humidity is the quiet one. Damp air warps cardbacks, lifts stickers, and over time encourages the bubble on a MOC piece to cloud or separate. If your storage space swings wet, a basic dehumidifier protects more value than most people realize.' },

      { type: 'h2', text: 'MOC and sealed: the package is the asset' },
      { type: 'p', text: 'For mint-on-card and sealed figures, you are not really preserving the figure — you are preserving the package, because the package is most of the premium. A crushed corner, a creased cardback, or a yellowed bubble can knock a serious chunk off a MOC comp, and unlike a loose figure, there is no "well, it displays fine" consolation.' },
      { type: 'ul', items: [
        'Use a properly sized clamshell card protector — the rigid acrylic cases made for carded figures. A loose card rattling in an oversized case still takes corner damage.',
        'Store carded pieces upright and supported, not stacked under weight that can crease the cardback.',
        'Keep them out of the same sun and heat — a faded cardback is just as costly as a faded figure.',
      ]},
      { type: 'callout', text: 'The MOC premium is biggest on lines where most examples got opened — vintage especially. That premium only survives in a clean, uncrushed package. Protecting the card is the whole job.' },

      { type: 'h2', text: 'Loose and complete: the accessory problem' },
      { type: 'p', text: 'For loose figures, the value is in completeness as much as condition. A loose-incomplete figure routinely sells for a fraction of a complete one — missing a title belt, a removable vest, a chair, or a signature accessory can mean the difference between a clean comp and a parts-bin price. Storage is where accessories go to disappear.' },
      { type: 'ul', items: [
        'Bag and tag the small accessories with the figure they belong to. The single most common way collectors destroy completeness is by tossing loose figures in a bin and losing the little pieces in the bottom.',
        'Soft removable goods — cloth gear, soft-plastic belts — can deform if a figure is jammed against others for years. Give the valuable ones room.',
        'If you flip, keep accessories organized by figure now, not when you list. Reuniting a figure with the right belt three years later is a fool errand.',
      ]},

      { type: 'h2', text: 'The display case is a value decision, not just décor' },
      { type: 'p', text: 'A good case does three jobs: blocks UV, keeps dust off (dust is mildly abrasive and a pain to clean off textured sculpts and soft goods), and prevents the slow physical wear of figures rubbing and toppling against each other. You do not need museum glass for a shelf of $15 Elites. You probably do want a closed, UV-aware case for the grails, the vintage pieces, and anything MOC you actually care about.' },
      { type: 'p', text: 'Think of it the way comps think of it. Two identical figures, one kept dust-free and out of the light, one faded and scuffed from open-shelf life, are not the same listing — and the sold prices will tell you exactly how much that difference is worth on your specific line.' },

      { type: 'h2', text: 'The honest bottom line' },
      { type: 'p', text: 'You do not have to turn your collection into a vault to protect it. You have to keep it out of direct sun, out of the attic and garage, dust-managed, and — for the carded and the valuable — in a UV-aware case with the accessories kept together. That is most of the battle, and it is the difference between a collection that holds its comps and one that quietly bleeds value while you are not looking.' },
      { type: 'p', text: 'When you do decide to sell, FigurePinner shows you the real eBay sold comps for your exact figure and condition — so you can see, in actual dollars, what clean-and-complete is worth versus faded-and-incomplete. The preservation pays off at the moment you check the number.' },
    ],
  },

  {
    slug: 'what-rare-actually-means',
    title: 'What "Rare" Actually Means in Action Figure Collecting',
    metaTitle: 'What "Rare" Really Means for Action Figures (Chase, Short Print, Exclusive) | FigurePinner',
    metaDescription:
      'Short print vs chase vs exclusive vs reissue — the four things people mean when they say "rare," and which ones actually move price. Stop overpaying for the most abused word in the hobby.',
    dek: 'Everything is "rare" in a listing title. Almost nothing is. Here is how to tell the difference.',
    readingMinutes: 7,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'Open any marketplace and search a figure you know. Count how many listings say "RARE" in the title. Now count how many of those figures you have personally seen sitting on a peg or in a comp set within the last month. The gap between those two numbers is the entire problem with the word. "Rare" is the most abused term in collecting because it costs the seller nothing to type and it works on buyers who have not learned to ask the only question that matters: rare compared to what?' },
      { type: 'p', text: 'Real scarcity is specific and measurable. There are really only four things people mean when they say a figure is rare, and only some of them move price. Learn to tell them apart and you stop overpaying.' },

      { type: 'h2', text: '1. Short print — fewer were made, on purpose or by accident' },
      { type: 'p', text: 'A short print is a figure produced in lower quantity than the rest of its wave. Sometimes it is deliberate — the manufacturer packs fewer of a figure per case. Sometimes it is an accident of a wave getting cut short or a late-announced figure shipping in smaller numbers. Either way, the supply is genuinely thinner, and if demand is normal or high, the price reflects it.' },
      { type: 'p', text: 'The tell is case-pack ratios. In a standard wave, every figure ships at roughly the same rate. A short-printed figure shows up less often, sells through faster, and shows fewer sold comps over time. That last part is the honest signal — a figure that genuinely sells less often is the one that is genuinely scarcer.' },

      { type: 'h2', text: '2. Chase — the deliberate hidden variant' },
      { type: 'p', text: 'A chase is a variant intentionally packed at a low ratio inside an otherwise normal wave — a different deco, a rare repaint, a "find one in roughly every several cases" surprise. Chases are scarcity by design, and the good ones carry real premiums because the demand is built in: every set-builder wants the chase, and most cases do not contain one.' },
      { type: 'ul', items: [
        'Chases are real scarcity when the pack ratio is genuinely low and the variant is desirable. Those move price.',
        'Deco-only chases — same sculpt, just a recolor — get faked more than any other category, because all a counterfeiter has to do is repaint a common figure. Authenticate before you pay chase money.',
        'Not every "variant" is a chase. A figure that shipped at normal ratios in a slightly different paint is just a variant, not a hidden rarity.',
      ]},
      { type: 'callout', text: 'The faking risk scales with the premium. The bigger the gap between the common version and the "rare" version, the more incentive a bad actor has to manufacture the difference. Deco chases and swapped accessories are where the money gets lost.' },

      { type: 'h2', text: '3. Exclusive — limited by where it was sold' },
      { type: 'p', text: 'An exclusive is a figure tied to a single channel: a retailer (Target, Walmart, Amazon), a convention (SDCC, NYCC), or a brand store. Exclusives often print lower than mainline figures and can be a pain to get on release day, which is why the fig-hunt culture around restock days and convention lines exists at all. A genuine exclusive that sold through fast is real scarcity.' },
      { type: 'p', text: 'But there is a trap. Manufacturers have learned that "exclusive" sells, so some "exclusives" get reissued as shared exclusives, or restocked repeatedly, or made widely available later. The word on the package does not guarantee the supply stayed limited. A convention exclusive that quietly returned to an online store six months later is not commanding convention-exclusive money anymore — and the comps will show you that.' },

      { type: 'h2', text: '4. Reissue — the rarity that is not rare at all' },
      { type: 'p', text: 'This is the category that pretends to be the first three. A reissue is a figure the manufacturer made again — same character, often same sculpt, sometimes years after the "rare" original. Reissues are the single biggest value killer in modern collecting, because a figure that felt scarce on Tuesday can be worth a fraction on Wednesday when the company announces it is coming back. A listing can still scream "RARE" while a brand-new run is literally on a boat.' },
      { type: 'ul', items: [
        'Before paying a premium for any modern figure, check whether a reissue has been announced or is likely. A reannouncement caps the price hard.',
        'Vintage and finite lines do not have this risk — nobody is reprinting a 1985 figure. That permanence is part of why vintage scarcity holds.',
        'The same character existing as multiple figures across eras is not a reissue. A 1991 Hasbro and a modern Mattel of the same wrestler are different figures with different markets.',
      ]},

      { type: 'h2', text: 'The one question that cuts through all of it' },
      { type: 'p', text: 'When a listing says "rare," ask: how often does this actually sell, and at what price? Sales frequency is the honest scarcity meter. A figure with several sold comps in the last 90 days is liquid and common no matter what the title claims — you know the price. A figure with one sale in a year is genuinely scarce, but it is also volatile: the next sale could land well above or below that lonely data point. Real scarcity and price uncertainty travel together.' },
      { type: 'callout', text: 'If a seller cannot point to a specific reason a figure is scarce — a known short print, a documented chase ratio, a sold-out exclusive — assume it is the common version and price it that way. "Rare" with no mechanism behind it is just a word.' },

      { type: 'h2', text: 'Putting it to work' },
      { type: 'p', text: 'Next time you see "rare," sort it into one of the four boxes. Short print and chase are real if the supply is genuinely thin and the figure is desirable. Exclusive is real until it gets reissued. And the reissue is not rare at all — it is the thing dressed up as rare. The figures worth paying a premium for are the ones where you can name the mechanism, not just read the adjective.' },
      { type: 'p', text: 'FigurePinner backs every figure with real eBay sold comps and how many sales stand behind the number — so you can see at a glance whether "rare" is a fact or a hope before you ever click buy.' },
    ],
  },

  {
    slug: 'aew-figures-guide',
    title: 'AEW Figures: Jazwares and the Wrestling Alternative to WWE',
    metaTitle: 'AEW Figures Guide: Jazwares Unrivaled, Unmatched & Supreme | FigurePinner',
    metaDescription:
      'AEW figures by Jazwares — Unrivaled, Unmatched, and the premium Supreme line, plus exclusives, the Owen Hart deal, and what the uncertain license future means for collectors.',
    dek: 'For the first time in years, WWE has a real rival on the peg. Here is what the AEW line is actually worth collecting.',
    readingMinutes: 8,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'For most of two decades, collecting wrestling figures meant collecting WWE. There were other rosters, but nothing with the scale and the TV behind it to feel like a real second pillar. AEW changed that. When Jazwares launched the Unrivaled Collection in 2020, it was the first time in a long time that a non-WWE line shipped with the production quality, the recognizable roster, and the ongoing wave cadence to support actual collecting — not just nostalgia buys. If you have only ever chased Mattel Elites, the AEW line is the most interesting alternative market in the hobby right now, and it comes with a plot twist worth understanding before you go deep.' },

      { type: 'h2', text: 'The three lines, and who each one is for' },
      { type: 'p', text: 'Jazwares built the AEW catalog as a tiered system, and the tiers map cleanly onto three different buyers. Knowing which tier a figure belongs to tells you most of what you need to know about its price and its audience.' },
      { type: 'ul', items: [
        'Unrivaled Collection — the flagship line that started it all in 2020. Realistic 3D-scanned likenesses, authentic ring gear, and articulation built for collectors rather than play. This is the AEW equivalent of WWE Elite: the deep, ongoing core of the line.',
        'Unmatched Collection — launched in 2021, alternating waves with Unrivaled at the same scale. It also introduced the "Luminaries" sub-segment, typically legends, set apart with distinctive foil packaging.',
        'Supreme Collection — the premium tier, introduced in 2022, positioned as AEW\'s answer to high-end collector formats with typically two figures per series. This is where the deluxe accessories and the higher price point live.',
      ]},
      { type: 'callout', text: 'When you pull comps on an AEW figure, identify the line first. A Supreme figure and a standard Unrivaled figure of the same wrestler are different products at different price points — comparing one against the other is how people misprice the whole line.' },

      { type: 'h2', text: 'The exclusives that actually matter' },
      { type: 'p', text: 'Like every modern line, AEW has retailer and online exclusives, and the usual scarcity rules apply — a genuinely sold-out exclusive commands a premium, a quietly restocked one does not. But the AEW line has one exclusive story that stands out for a reason that has nothing to do with pack ratios.' },
      { type: 'p', text: 'AEW secured a merchandise deal that allowed Jazwares to produce Owen Hart figures — something WWE was unable to do for years following the legal disputes after his death. For a generation of collectors, an Owen Hart figure was simply not a thing you could buy new. That makes those releases significant beyond the usual exclusive math: they fill a gap the dominant brand could not.' },
      { type: 'p', text: 'Sting is the other name to know. His arrival in AEW produced multiple figures across all three lines, capturing different eras of his look — which means there is real depth (and real collecting) just within the Sting subset.' },

      { type: 'h2', text: 'How the AEW market behaves' },
      { type: 'p', text: 'AEW figures trade differently from WWE in a few predictable ways, and understanding them keeps you from misreading the comps.' },
      { type: 'ul', items: [
        'The roster is younger and more volatile. Wrestler value tracks the push — a star getting featured TV time moves their figure, and a departure or a cooled-off run softens it. AEW\'s roster turns over faster than WWE\'s legends-heavy catalog.',
        'Chase and rare editions exist within series, so check whether the figure you are pricing is the standard release or the variant before you trust a comp.',
        'Print runs run smaller than WWE\'s mainline at the same tier, which can make desirable figures dry up faster — but also makes the market thinner and the comps choppier. Fewer sales means more price uncertainty.',
      ]},

      { type: 'h2', text: 'The plot twist: the license future is genuinely unsettled' },
      { type: 'p', text: 'Here is the thing every AEW collector should know in 2026. Jazwares has confirmed it is producing AEW and ROH figures through 2026 — Chief Brand Officer Jeremy Padawer stated plainly that they are making AEW product this year. But the partnership beyond that is openly in question. Padawer posted, then deleted, a message thanking AEW and referencing "next chapters," and AEW owner Tony Khan has publicly acknowledged that a change to the figure license is possible — framing it as potentially a positive one for the company and fans.' },
      { type: 'p', text: 'Nothing is confirmed past 2026, and a manufacturer change is not a guarantee. But for a collector, an uncertain license is a real variable. A line that switches makers can mean the current Jazwares run becomes a finite, closed era — which historically is exactly the kind of thing that firms up value on the better figures — while also injecting uncertainty into a roster-driven market that was already choppy.' },
      { type: 'callout', text: 'Do not buy on speculation that "the line is ending so prices will moon." That is hope, not data. If the maker changes, the figures that hold are the same ones that always hold: desirable wrestlers, genuine exclusives, and clean condition. Let the sold comps confirm any move before you act on it.' },

      { type: 'h2', text: 'Where to start if you are new to AEW' },
      { type: 'p', text: 'Pick a lane the way you would with any deep line. If you want the core collecting experience, Unrivaled is the spine. If you want the premium pieces, Supreme is the showcase tier. If you collect by wrestler, the Sting and Owen Hart subsets are the most storied entry points. Whatever you chase, price it against the right line and the right condition, and let the actual sales — not the listing adjectives — tell you what it is worth.' },
      { type: 'p', text: 'FigurePinner pulls real eBay sold comps on AEW figures across all three lines, so you can see the median, the range, and how many sales back the number before you bid — especially valuable in a thinner, faster-moving market where one optimistic listing can warp your sense of the price.' },
    ],
  },

  // ─── Batch 1–4 drafts merged 2026-06-11 (S19) — IDs 8,9,10,12,13,14,15,16,31,17,18,32 ───
  {
      slug: 'pricing-thin-comp-figures',
      title: 'How to Price a Figure With Almost No Sold Comps',
      metaTitle: 'How to Price a Figure With Few or No Sold Comps | FigurePinner',
      metaDescription:
        'The hardest pricing case in collecting: a figure with one sale, or none. How to build a defensible number from adjacent comps, condition laddering, and honest uncertainty.',
      dek: 'One sale is an anecdote. Zero sales is a coin flip. Here is how to price the figures the market barely tracks.',
      readingMinutes: 8,
      updated: '2026-06-07',
      body: [
        { type: 'p', text: 'You found it. The figure that never shows up — the regional exclusive, the short-printed chase, the loose oddball nobody seems to sell. You go to check what it is worth and the well is dry. Two sold listings in a year. Or none at all. This is the pricing case that separates collectors who actually know the hobby from the ones who just read the high asking price and call it a day.' },
        { type: 'p', text: 'Thin-comp pricing is not guessing. It is a different method than pricing a figure with twenty recent sales, and it leans harder on judgment than on arithmetic. Here is how to build a number you can actually defend.' },
  
        { type: 'h2', text: 'First, accept that the number is a range, not a price' },
        { type: 'p', text: 'When a figure trades constantly, the median of the last ten sales is a tight, trustworthy value. When it trades once a year, there is no median worth the name — there is a plausible band, and a real chance the next sale lands outside it. The first discipline of thin-comp pricing is honesty about that. You are not producing “the price.” You are producing “somewhere in here, probably,” and the width of that band is itself information.' },
        { type: 'callout', text: 'A single sale tells you one buyer met one seller on one day. It does not tell you the market. Treat a lone comp as the center of a wide range, not the answer — especially if it is more than a few months old.' },
  
        { type: 'h2', text: 'Build a comp set out of adjacent figures' },
        { type: 'p', text: 'No direct comps does not mean no comps. It means you go sideways. The figure you are pricing lives inside a structure — a line, a wave, a tier — and the figures around it are sold constantly. Use them as scaffolding.' },
        { type: 'ul', items: [
          'Same line, same era, similar demand — a different character from the same wave usually shares a price floor. If the common figures in that wave sell for $25 loose, your obscure one is anchored near there unless there is a specific scarcity reason to lift it.',
          'Same character, different release — a modern Mattel Elite of a wrestler tells you something about the floor for a Jakks version of the same guy, once you adjust for era and who is buying.',
          'The chase-to-common spread in comparable lines — if chase variants in this line typically sell for 2-3x the common figure, and you can price the common, you can estimate the chase even with no direct sale.',
        ]},
        { type: 'p', text: 'Adjacent comps will not give you a clean answer. They give you guardrails — a floor you are pretty sure it clears and a ceiling it probably does not exceed without a bidding war. That bracket is more useful than a single stale sale pretending to be precise.' },
  
        { type: 'h2', text: 'Ladder the condition explicitly' },
        { type: 'p', text: 'When comps are scarce, condition swings matter even more, because you cannot average them away. A figure has at least three prices — MOC or sealed, loose and complete, and loose but incomplete — and in a thin market the gap between them is wide and unforgiving. A complete loose example might sell at one number; the same figure missing its signature accessory routinely lands at 30-50% of that.' },
        { type: 'p', text: 'So when you find your one or two adjacent comps, pin down exactly what condition they were, and ladder from there. Do not compare your incomplete loose figure to a MOC sold listing and convince yourself the shelf is worth triple. In thin markets that mistake is not a rounding error — it is the whole valuation.' },
        { type: 'callout', text: 'Accessories carry the money. In a low-comp figure, a missing belt, blade, or alternate head can be the difference between a fast sale and a listing that sits for months. Price the figure you actually have, accessory-for-accessory.' },
  
        { type: 'h2', text: 'Read the asking prices — as sentiment, not as value' },
        { type: 'p', text: 'When sold data is thin, the wall of active listings becomes a louder voice, and it is the wrong voice to obey. Active asks are wishes. But they are not useless: a stack of unsold listings sitting at $200 for eight months is telling you the market does not clear at $200. The ceiling is real even when the floor is fuzzy. Use unsold, aging listings as a cap, not a target.' },
  
        { type: 'h2', text: 'Decide how much the uncertainty is worth to you' },
        { type: 'p', text: 'Here is where thin-comp pricing becomes a personal decision instead of a math problem. If you are buying, a wide, uncertain band means you should bid toward the bottom of it — you are taking on the risk that you cannot resell at the top. If you are selling, you have a choice: list near the optimistic ceiling and wait, or price toward the floor and move it now. There is no objectively correct answer, only the trade-off between speed and squeeze.' },
        { type: 'p', text: 'And if you are buying as a collector — not a flipper — remember the band is a sanity check, not a verdict. A grail you have hunted for years is allowed to be worth more to you than the comps. The data keeps you from overpaying blindly; it does not get to tell you the chase was not worth it.' },
  
        { type: 'h2', text: 'Putting it together' },
        { type: 'p', text: 'Pricing a thin-comp figure is four moves: accept a range instead of a number, build guardrails out of adjacent figures, ladder the condition honestly, and use aging asks as a ceiling. Then decide how you want to play the uncertainty. Done right, you end up with a defensible band and a clear head — which is far better than a confident number built on a single year-old sale.' },
        { type: 'p', text: 'FigurePinner shows you exactly how thin the data is on every figure — the real sold comps, the count behind the number, and a clear signal when the market is too sparse to trust. So you always know the difference between a price and a guess. Look up the figure, see how many sales actually back the value, and price from the truth instead of the wishlist.' },
      ],
    },
  
    {
      slug: 'chase-variants-explained',
      title: 'Chase Variants Explained: Odds, Value, and How to Spot Them',
      metaTitle: 'Chase Variants Explained — Odds, Value & How to Spot Fakes | FigurePinner',
      metaDescription:
        'What a chase variant actually is, the pack ratios behind the rarity, how to authenticate one before you pay the premium, and why deco-only chases get faked.',
      dek: 'The rare one in the case. Real scarcity, real premiums — and a real target for fakes. Here is how to know what you are holding.',
      readingMinutes: 8,
      updated: '2026-06-07',
      body: [
        { type: 'p', text: 'You open the case and most of them are the figure you expected. One of them is not. Different paint, a glow finish, a metallic deco, a swapped head — and the price on that one is double, sometimes more. That is a chase, and it is one of the few times the word “rare” in this hobby is actually backed by a number.' },
        { type: 'p', text: 'But the premium is exactly why chases get faked, mislabeled, and oversold. Knowing what a chase really is — and how to verify one — is the difference between paying for scarcity and paying for a story.' },
  
        { type: 'h2', text: 'What a chase actually is' },
        { type: 'p', text: 'A chase is a variant of a standard figure, intentionally produced in smaller numbers and packed into cases at a lower ratio than the common version. It is not a different character and usually not a different mold — it is the same figure with a deliberate difference: an alternate paint app, a special finish, a glow or metallic deco, occasionally a swapped accessory or head. The point is built-in scarcity. The manufacturer makes fewer on purpose, the case ratio enforces it, and the secondary market does the rest.' },
        { type: 'p', text: 'That intentionality is what separates a chase from other kinds of “variant.” A factory error is an accident. A running deco change is just production drift. A chase is scarcity by design — and that design is what makes the premium hold instead of evaporating.' },
  
        { type: 'h2', text: 'The odds behind the rarity' },
        { type: 'p', text: 'Chase ratios are real and they vary by line, but the modern convention has settled lower than collectors who remember the old days expect. Historically, a chase could be packed as thin as one per full case — on the order of one in thirty-six — which made them genuinely hard to pull. Over time the common ratio shifted toward roughly one chase per six figures, which is far more attainable. And not every line even has a chase; only a fraction of new releases include one at all.' },
        { type: 'callout', text: 'The ratio is the scarcity. A one-in-six chase is desirable but reachable — there are a lot of them out there over a full print run. A one-in-thirty-six chase is genuinely scarce. When you see a chase premium, ask which ratio you are actually paying for, because the two are not the same market.' },
        { type: 'p', text: 'This matters for value because the premium should track the real odds, not the word “chase.” A common-ratio chase in a deep, ongoing line is not a grail just because it says chase on the box. A thin-ratio chase from a discontinued line is a different animal. The label is the same; the scarcity is not.' },
  
        { type: 'h2', text: 'How to spot a chase — and authenticate it' },
        { type: 'p', text: 'Before you pay the premium, confirm you are looking at the real thing. Most legitimate chases are documented — the deco difference is known, photographed, and discussed across the collector community. Use that.' },
        { type: 'ul', items: [
          'Know the specific tell — every real chase has a defined difference: this exact paint, this finish, this glow. If the seller cannot name the precise variation, be skeptical.',
          'Check the packaging markings — many lines flag chases with a sticker, a special foil, or a print code on the card or box. A sealed chase with no such marking deserves a hard look.',
          'Compare against community photos — pull up confirmed examples and match the deco app side by side. Fakes are usually close but not exact.',
          'Be most careful with deco-only chases — when the only difference is paint, it is the easiest to counterfeit. A custom painter can replicate a deco chase convincingly, which is exactly why loose deco chases without packaging carry the most authentication risk.',
        ]},
        { type: 'p', text: 'Loose chases are where the money gets lost. Out of the package, with no card markings and only the paint to go on, a deco-only chase is the single most spoofable item in modern collecting. If you are paying grail money for a loose chase, you are paying for authentication as much as for the figure — buy from sellers who can prove it, with clear photos and a track record.' },
  
        { type: 'h2', text: 'What a chase is actually worth' },
        { type: 'p', text: 'A chase premium is only real if the sold comps say so. Plenty of chases carry a modest, steady premium over the common figure — and plenty of listings ask far more than the chase ever actually sells for. The discipline is the same as any figure: ignore the asks, pull the completed sales for the chase specifically, and compare them against the common version. The ratio of those two numbers is the true chase premium, and it is frequently smaller than the hype around the word suggests.' },
        { type: 'callout', text: 'Price the chase against its own sold comps, not against the common figure plus a vibe. A chase that sells for 1.5x the common is a 1.5x premium — not whatever the most optimistic active listing claims.' },
  
        { type: 'h2', text: 'Putting it together' },
        { type: 'p', text: 'A chase is scarcity you can actually point to — a deliberate short-pack variant with a known difference and a real case ratio. That makes it one of the few honest uses of “rare” in the hobby. But the premium invites fakes, the modern ratios are more generous than the legend, and the only number that matters is what the chase has actually sold for. Verify the deco, respect the ratio, and price off comps.' },
        { type: 'p', text: 'FigurePinner pulls the real sold comps for the figures you are chasing, so you can see what a chase actually trades for versus the common version — and never pay a grail premium for a one-in-six pull. Look it up before you buy.' },
      ],
    },
  
    {
      slug: 'when-to-buy-or-wait',
      title: 'When to Buy a Figure and When to Wait',
      metaTitle: 'When to Buy a Figure and When to Wait — Timing Guide | FigurePinner',
      metaDescription:
        'Release-day premiums, reissue risk, the post-holiday glut, seasonal dips. How to read the collector calendar so you buy the figure at the right price, not the hyped one.',
      dek: 'The figure will still be there next month. Usually cheaper. Here is how to know when patience pays and when it costs you.',
      readingMinutes: 8,
      updated: '2026-06-07',
      body: [
        { type: 'p', text: 'A figure drops, the hype is loud, and the asking prices spike. You feel the pull to grab it now before it is gone forever. Most of the time, that fear is the most expensive thing in the hobby. The figure is rarely gone forever — and the collector who waited eight weeks usually paid less than the one who panicked on release day.' },
        { type: 'p', text: 'But not always. Knowing the difference between a price that is going to fall and one that is going to climb is the whole game. Here is how the timing actually works.' },
  
        { type: 'h2', text: 'The release-day premium is real — and it usually fades' },
        { type: 'p', text: 'When a figure first hits, demand is concentrated and supply is thin. Pre-orders sold out, the first cases are landing slowly, and the people who must have it day one are bidding against each other. That is a real premium, but it is a temporary one. As more cases ship and the must-have-it-now crowd is satisfied, supply catches up to demand and prices settle toward the floor.' },
        { type: 'p', text: 'For most modern figures from a deep, ongoing line, the pattern is the same: a release-day high, a slide over the following weeks, and a stable floor once the figure is widely available. If the line restocks reliably, the early premium is almost always money you did not need to spend.' },
        { type: 'callout', text: 'Ask one question before paying a release-day premium: is this line going to restock? If the manufacturer ships this figure again — or reissues it — the early price is the peak, not the floor. Patience is the cheaper buy.' },
  
        { type: 'h2', text: 'Reissue risk is the silent price killer' },
        { type: 'p', text: 'The single biggest reason a modern figure price collapses is a reissue. A figure that was scarce and climbing gets reannounced — a re-release, a new wave, a shared retailer exclusive — and the secondary price drops the day the news breaks, because the scarcity that justified the premium just evaporated. Buyers who paid up on the original are suddenly underwater.' },
        { type: 'p', text: 'This is why blindly chasing a “hot” modern figure is dangerous. If a manufacturer can simply print more, the scarcity is conditional, and the company holds the switch. Before paying a premium on a recent figure, ask whether it is genuinely retired or merely temporarily sold out. Those are completely different risk profiles.' },
  
        { type: 'h2', text: 'The collector calendar moves prices' },
        { type: 'p', text: 'Figure prices are seasonal, and the calendar is readable if you watch for it. The market has predictable rhythms driven by when people have money and when they are flooding the market with inventory.' },
        { type: 'ul', items: [
          'Post-holiday glut — after the gift-giving season, a wave of unwanted and duplicate figures hits the secondary market while buyer demand cools. More supply, less demand: one of the better windows to buy.',
          'Tax-refund season — a stretch of the year when discretionary cash shows up and buyer demand firms up. Better for selling than buying.',
          'Convention season — major shows generate hype spikes around exclusives and reveals. Prices on related figures can run hot, then cool once the noise dies down.',
          'End-of-line clearance — when a line is being discontinued or a retailer is dumping stock, floor prices dip before scarcity eventually pulls them back up.',
        ]},
        { type: 'p', text: 'None of these are guarantees, but they are tendencies. If you are patient and the figure is not genuinely scarce, buying into the glut and selling into the demand season is the unglamorous edge that actually works.' },
  
        { type: 'h2', text: 'When waiting is the wrong move' },
        { type: 'p', text: 'Patience is the default, but it is not free, and there are real cases where waiting costs you. The honest list:' },
        { type: 'ul', items: [
          'Genuinely retired and finite — a vintage figure, a discontinued line, a one-and-done exclusive. Supply only shrinks from here, so the cheapest one is usually the one in front of you now.',
          'A confirmed grail at a fair comp — if you have hunted a figure for years and a clean example shows up at the real market number, “waiting for cheaper” can mean waiting another two years.',
          'Condition scarcity — for vintage especially, a clean, complete example is far rarer than the figure itself. Passing on a minty one to save a few dollars often means settling for a beat-up one later.',
        ]},
        { type: 'callout', text: 'The rule of thumb: if the manufacturer can make more, wait. If the market cannot, and the price is fair against sold comps, buy. Scarcity that is real and finite rewards moving now; scarcity that is just early hype rewards patience.' },
  
        { type: 'h2', text: 'Putting it together' },
        { type: 'p', text: 'Timing a purchase comes down to one distinction: is the scarcity conditional or permanent? Conditional scarcity — sold-out-but-restockable, hyped-on-release, riding a convention spike — fades, and waiting pays. Permanent scarcity — retired, vintage, finite, clean-condition — only tightens, and patience costs you. Read which one you are looking at, check the price against real sold comps either way, and you stop buying the hype and start buying the figure.' },
        { type: 'p', text: 'FigurePinner shows you the real sold-price history on every figure, so you can see whether a price is a release-day spike or a stable floor before you commit. Look it up, read the trend, and time the buy with data instead of fear of missing out.' },
      ],
    },
  
    // ─── id 12 ───────────────────────────────────────────────────────────────────
    {
      slug: 'spot-a-reissue',
      title: 'How to Spot a Reissue Before You Overpay',
      metaTitle: 'How to Spot a Reissue Before You Overpay | FigurePinner',
      metaDescription:
        'Reissues are the single biggest value killer in modern figure collecting. How to read manufacturer signals, date codes, and secondary-market patterns before you pay the original-run premium.',
      dek: 'The figure you thought was scarce just got reprinted. Here is how to know before the market figures it out.',
      readingMinutes: 8,
      updated: '2026-06-08',
      body: [
        { type: 'p', text: 'The pattern plays out the same way every time. A figure sells out, prices climb on the secondary market, people pay a premium because supply is thin. Then the manufacturer announces a reissue — another run, a retailer exclusive, a fan channel re-release — and the price collapses the day the news breaks. The collectors who paid up on the original run are suddenly holding a figure worth a fraction of what they spent.' },
        { type: 'p', text: 'Reissues are not random. They follow patterns, and those patterns are readable if you know what to look for. The goal is to read the signal before the secondary market prices it in.' },
  
        { type: 'h2', text: 'Understand who reissues and how often' },
        { type: 'p', text: 'Not all manufacturers treat their catalogs the same way. Hasbro — which makes Marvel Legends, Star Wars Black Series, and G.I. Joe Classified — has a well-established history of returning to popular figures, particularly around anniversaries and character moments like a film release, a TV debut, or an anniversary milestone. The reissue does not come on a fixed schedule, but the triggers are recognizable: a new Wolverine film means the Wolverine figure you paid up on last year is likely in an anniversary wave. A 60th anniversary of the Avengers produces a set of fan-channel returns. The pattern is event-driven, not arbitrary.' },
        { type: 'p', text: 'Mattel handles WWE figures differently — the Elite line runs deep and wide, and popular wrestlers tend to get new figures at a steady cadence rather than direct reprints. A retired superstar with no new Elite in a few years is far less likely to get a reissue than a current star. The risk profile is different by manufacturer.' },
        { type: 'callout', text: 'The single most important question before paying a premium on a modern figure: is this manufacturer known for returning to this character? If the answer is yes, and there is a plausible event trigger on the horizon, the secondary price is conditional — it can collapse at any moment.' },
  
        { type: 'h2', text: 'Watch for the announcement signals' },
        { type: 'p', text: 'Manufacturers rarely reissue in silence. The lead time between announcement and shipping means the reissue news is public well before the product arrives, which is exactly when secondary prices move. Prices drop on the announcement, not on the restock.' },
        { type: 'ul', items: [
          'License renewals and new media — when a property gets a new film, streaming series, or major game, the toy license activates. Figures from that property are now commercially attractive to reprint. Watch the entertainment calendar.',
          'Fan channel and collector program exclusives — Hasbro Pulse, Entertainment Earth, BigBadToyStore exclusives are often second-run figures dressed as new releases. The exclusivity is about the channel, not the figure, and the secondary price on the first run often drops the moment the re-release is announced.',
          'Anniversary milestones — the 20th, 30th, 40th anniversary of a franchise is a predictable reissue window. Publishers plan around these dates years in advance.',
          'Collector community chatter — the community usually hears reissue rumors before confirmation. When a previously scarce figure suddenly sees a spike in speculative selling on eBay, someone may know something.',
        ]},
  
        { type: 'h2', text: 'How to date-check a figure you are already holding' },
        { type: 'p', text: 'If you are buying loose or want to know whether the figure in front of you is an original run or a reissue, the physical figure usually tells you — if you know where to look. Most modern figures carry date codes molded into the plastic, typically on the inside of a leg, the underside of a foot, or inside the torso. These codes are year-of-tooling marks. A figure where the date code matches the original release year is an original run. A figure with the same sculpt but a newer date code has been retooled, which usually signals a reissue or running change.' },
        { type: 'p', text: 'Card backs and box prints carry dates too. A "first edition" card run typically has specific printing that later versions change. It is not always obvious, but in lines where collectors have documented both versions — Star Wars Vintage Collection is a particularly well-documented example — the community has already catalogued the differences.' },
        { type: 'callout', text: 'Date codes are the mechanical proof. If the mold date on a figure is newer than the original release year for that sculpt, you are holding a reissue. This matters a lot when a seller calls something an "original run" and the date code disagrees.' },
  
        { type: 'h2', text: 'Read the secondary-market pattern before buying' },
        { type: 'p', text: 'A figure with a genuine, permanent reissue risk trades differently than a truly retired one. In an active line with a known reissue-friendly manufacturer, prices tend to stabilize near where the original retail would have been — the market factors in the ongoing reissue probability. When a figure from that same line spikes well above retail, it is often speculative, and the speculation can unwind fast.' },
        { type: 'p', text: 'The comp history tells you the story. A figure that was briefly scarce and expensive, then dropped sharply, likely got reissued or had supply catch up. That pattern is a red flag if you see it on a current figure selling at a premium — it means the market has seen this before with similar figures from the same line.' },
  
        { type: 'h2', text: 'When the reissue risk is genuinely low' },
        { type: 'p', text: 'Not everything gets reprinted. The reissue risk is low — and paying a premium is safer — when the conditions that produce reissues are absent: the manufacturer does not hold the license anymore, the mold is confirmed destroyed or lost, the line is officially over and has not been touched in years, or the figure came from a format that structurally prevents reissue (a convention exclusive in a genuinely capped run, a charity auction piece, a licensed line whose IP has gone dormant).' },
        { type: 'p', text: 'Vintage figures are the cleanest case: nobody is reprinting an original 1985 Kenner. The premium there is permanent because the supply is fixed. Modern figures from active manufacturers are the risky category, and the risk is proportional to how commercially attractive the character is and how enthusiastically the manufacturer has reissued similar figures in the past.' },
  
        { type: 'h2', text: 'Putting it together' },
        { type: 'p', text: 'Before you pay a premium on any modern figure, run two checks. First, is this manufacturer known for returning to this character type, and is there a near-term trigger — a film, anniversary, or fan-demand program — that would make a reissue commercially sensible? Second, what does the comp history look like: has this figure had the price-drop-then-stabilize pattern that signals a past reissue? If both answers flag risk, the premium you are being asked to pay is conditional. You might be right, and it might never get reprinted. But you are not buying scarcity — you are buying a bet.' },
        { type: 'p', text: 'FigurePinner shows you the real sold-comp history on every figure, so you can see whether a price premium has a track record of holding or a history of collapsing. Check the trend before you trust the hype.' },
      ],
    },
  
    // ─── id 13 ───────────────────────────────────────────────────────────────────
    {
      slug: 'accessories-and-figure-value',
      title: 'Accessories and Why They Make or Break a Figure\'s Price',
      metaTitle: 'How Accessories Affect Action Figure Value | FigurePinner',
      metaDescription:
        'Missing one accessory can cut a figure\'s value by a third. Which accessories carry the money, why certain pieces are worth more than the figure they came with, and how to price around completeness.',
      dek: 'The figure is not the whole sale. The belt, the blade, and the alternate head are half the value — sometimes more.',
      readingMinutes: 7,
      updated: '2026-06-08',
      body: [
        { type: 'p', text: 'You find a loose figure that checks out — clean paint, tight joints, no yellowing — but the listing says "missing belt." You think: how much could a belt matter? Then you pull the sold comps and see the complete version selling for twice as much. The belt was half the value. That is not unusual in this hobby. For some figures, the accessory is the point, and the figure is what holds it.' },
        { type: 'p', text: 'Understanding which accessories carry money, and why, is the difference between pricing a collection honestly and leaving significant value on the table — or overpaying for an incomplete piece that the listing made sound trivial.' },
  
        { type: 'h2', text: 'Why accessories hold so much value' },
        { type: 'p', text: 'The simple version: accessories are small, specific, and easy to lose. A wrestling figure ships with a title belt that is roughly the size of a thumbnail. A G.I. Joe comes with a rifle smaller than a toothpick and a backpack designed to pop off with a touch. A Marvel Legends figure ships with alternate hands, a swap head, and a Build-a-Figure piece — any one of which can disappear in a move, a childhood playroom, or a reseller\'s sloppiness. The figure itself almost always survives. The accessories often do not.' },
        { type: 'p', text: 'The scarcity gradient is steep: complete loose examples are more common than mint-on-card, but far rarer than bare figures once you account for all the accessories that went missing over the years. The market prices that gradient accordingly. In FigurePinner\'s own sold-comp data — 388 figures with enough sales of both complete and incomplete examples to compare — complete averages more than double incomplete for the same figure. Even the conservative middle of the distribution runs 40–80% higher, and for figure-defining accessories the gap is wider still.' },
        { type: 'callout', text: 'The completion premium is not sentiment — it is a real supply gap. For vintage figures especially, a complete example is a smaller slice of the surviving population than you might expect, because every year more accessories end up lost, separated, or misidentified.' },
  
        { type: 'h2', text: 'The accessories that carry the most money' },
        { type: 'p', text: 'Not all accessories are equal. The ones that carry disproportionate value share a common trait: they are identity-defining pieces that collectors specifically seek out, or they are small and structurally prone to loss.' },
        { type: 'ul', items: [
          'Title belts on wrestling figures — a championship belt is often the single most value-dense accessory in the package, especially on vintage Hasbro WWF and Jakks figures. The original tooled belt on a specific figure is not interchangeable; a reproduction does not command the same premium as an original.',
          'Signature weapons on vintage lines — the specific rifle a G.I. Joe shipped with, the shield on a vintage Captain America, the lightsaber on a vintage Kenner Obi-Wan. When the weapon is iconic and small, it has been getting lost since 1983, and the surviving complete examples reflect that.',
          'Build-a-Figure pieces — in Marvel Legends and similar BAF-based lines, each figure in a wave ships with one piece of a larger figure. The BAF piece is inherently limited by the release quantity, and collectors completing the assembled figure need every piece from the wave. A figure loose-without-BAF-piece trades meaningfully lower than complete for buyers chasing the BAF.',
          'Alternate heads and hands on modern premium figures — Ultimate Edition WWE figures, Marvel Legends, MOTU Masterverse. These extra pieces can double the display options, and missing them is a significant reduction in what the figure actually does.',
          'Vehicle and playset contents — the figure is sometimes almost secondary to the object. Vintage Kenner Star Wars vehicles with all their stickers applied, missiles present, and panels intact trade far above the stripped version.',
        ]},
  
        { type: 'h2', text: 'Pricing the incomplete figure honestly' },
        { type: 'p', text: 'The common trap: searching "loose" comps and not filtering for complete. If you pull sold comps for a figure and you do not separate "complete" from "incomplete," you are averaging across two different goods, and your price will be wrong. The right method is to pull comps specifically for the condition you have — and if your figure is missing something, look for sold examples of the same figure missing the same thing.' },
        { type: 'p', text: 'For sellers, the honest move is to disclose specifically what is missing. Listings that say "complete" when the figure is missing a secondary accessory corrode trust and invite returns. Listings that say exactly what is absent let buyers price their own willingness to hunt the missing piece separately. That transparency usually produces faster sales and fewer disputes.' },
        { type: 'callout', text: 'Accessory-hunting is a real subset of the hobby. For popular figures with high completion premiums, collectors regularly pay for just the missing piece on platforms like eBay or through community trading. The accessory market is liquid enough that "buy incomplete, source the piece separately" is a real strategy — but only if the piece prices are known upfront.' },
  
        { type: 'h2', text: 'The case of accessories worth more than the figure' },
        { type: 'p', text: 'On some figures this flips entirely: the accessory is the grail and the figure is the holder. Certain vintage Star Wars accessories — specific weapons, particularly early production variants — have sold for more than complete examples of the figure they shipped with. The Rocket-Firing Boba Fett prototype is the extreme version of this. More commonly, a specific belt from a vintage wrestling figure or a variant weapon from an early G.I. Joe wave can trade for a significant fraction of the complete figure value on its own.' },
        { type: 'p', text: 'When you encounter this pattern, it changes the buying math. Paying a premium for an "incomplete" figure that is actually missing only the low-value parts while retaining the high-value piece can be the right move — but only if you have priced both sides separately.' },
  
        { type: 'h2', text: 'Putting it together' },
        { type: 'p', text: 'Accessories are not extras. They are structural components of the figure\'s market value, and the gap between complete and incomplete is real, verifiable, and frequently larger than new collectors expect. Before buying, pull comps for the specific condition you are buying — complete or not. Before selling, disclose precisely what is present. And before dismissing a missing piece as trivial, check the comp spread between complete and incomplete examples: you might be looking at a third of the value sitting in one tiny accessory.' },
        { type: 'p', text: 'FigurePinner pulls the real sold comps on every figure, so you can see exactly what the market is pricing completeness at before you commit. Look up the figure, compare the complete versus incomplete sale history, and price from what actually moved — not from hope.' },
      ],
    },
  
    // ─── id 13 ─── (end marker retained above) ──────────────────────────────────
    // ─── id 14 ───────────────────────────────────────────────────────────────────
    {
      slug: 'collecting-on-a-budget',
      title: 'How to Build a Collection on a Budget',
      metaTitle: 'How to Build an Action Figure Collection on a Budget | FigurePinner',
      metaDescription:
        'Strategic collecting on limited funds: how to pick a lane, buy the price floor, avoid FOMO, and build a shelf you are proud of without setting your wallet on fire.',
      dek: 'You do not need unlimited money. You need a lane, a floor, and the patience to ignore the noise.',
      readingMinutes: 8,
      updated: '2026-06-08',
      body: [
        { type: 'p', text: 'The fastest way to burn out of this hobby is to collect everything. Every new wave, every exclusive, every line that catches your eye. It sounds like freedom. It is actually a churn machine that leaves you broke, over-shelved, and less connected to what you actually care about than when you started.' },
        { type: 'p', text: 'Budget collecting is not about buying cheap figures. It is about buying the right figures at the right prices — which requires a strategy most collectors stumble into years too late. Here is the short version.' },
  
        { type: 'h2', text: 'Step one: pick a lane' },
        { type: 'p', text: 'The most effective thing a budget collector can do is constrain the scope. Not because breadth is wrong, but because breadth without a budget is how you end up with incomplete sets across six lines instead of a complete, meaningful collection in one.' },
        { type: 'p', text: 'Picking a lane means choosing a primary focus: one era, one line, one character across makers, one decade of production. The best lanes are ones where your emotional connection is real — not the line everyone on Reddit is talking about, but the figures that mean something to you specifically. A lane built on nostalgia sustains attention. A lane built on hype evaporates the moment the community moves on.' },
        { type: 'ul', items: [
          'Era-based lanes — vintage Hasbro WWF, early Jakks Ruthless Aggression, classic Kenner Star Wars. Finite lines with a clear completion point are uniquely suited to budget collecting because you can see the end and work toward it.',
          'Character-based lanes — one wrestler, one hero, one fictional universe across all makers and eras. These can be infinite, but the focus keeps spending intentional rather than reactive.',
          'Line-and-tier lanes — the whole Elite run, every Marvel Legends wave for a specific team, every Classified G.I. Joe in a five-year window. Structured and completable in chunks.',
        ]},
        { type: 'callout', text: 'The lane is not a cage — you can still buy outside it occasionally. It is a filter for the vast majority of release-day hype. Before you buy, the question is simple: does this fit my lane? If not, it is not a buy today.' },
  
        { type: 'h2', text: 'Buy the floor, not the hype' },
        { type: 'p', text: 'Every figure has a market floor — the price it reliably trades at when the excitement has settled, the release-day premium has evaporated, and the figure is just selling to people who want it. Budget collectors build their target lists around the floor, not the peak. The discipline is knowing the floor before you buy.' },
        { type: 'p', text: 'The floor is visible in the sold comps. A figure that peaks at $60 on release week and stabilizes at $35 in three months is a $35 figure, not a $60 one. You are not missing it by waiting — you are buying it at its real price. Most modern figures in ongoing lines follow this pattern. The exception is the genuinely scarce item: a genuine short-run exclusive, a chase variant at a real ratio, a vintage piece where supply only shrinks.' },
        { type: 'p', text: 'The floor-buying mindset also protects you on resale. If you bought at the floor and need to sell later, you are not underwater. If you bought at the release-day peak and the figure stabilized lower, you are.' },
  
        { type: 'h2', text: 'The post-holiday glut is real' },
        { type: 'p', text: 'One of the most reliable structural discounts in figure collecting is the post-holiday secondary market. After the gift-giving season, a wave of unwanted, duplicate, and gift-recipient-did-not-want figures floods eBay and other platforms. Supply spikes, buyer demand cools, and prices on common figures settle meaningfully below their year-round floor.' },
        { type: 'p', text: 'For a budget collector with a target list, this is a buying window. You are not picking up random deals — you are sourcing the specific figures on your list at the lowest price point of the year. The same discipline applies to end-of-line retail clearance: when a retailer blows out the last cases of a discontinued line, you are buying figures that will not see new supply again at prices that assume the line is dead. Sometimes the line stays dead. Those purchases look prescient a few years later.' },
  
        { type: 'h2', text: 'What to skip on a budget' },
        { type: 'p', text: 'As important as what to buy is what to deliberately pass on. Budget collecting requires a few standing rules about where not to spend.' },
        { type: 'ul', items: [
          'Convention exclusives at the secondary market premium — the convention markup is frequently two to three times what the figure will stabilize at once the hype fades. If the figure is in your lane, wait for the convention hype to cool; if it is outside your lane, it is a hard pass.',
          'Release-day prices on restockable lines — if the manufacturer routinely restocks and the figure is from an ongoing line, the release-day price is the ceiling, not the floor. There is almost never a reason for a budget collector to pay it.',
          'Sets where you only want half the figures — bundle economics can be compelling, but buying a two-pack to get one figure means the other figure is a cost, not a value. Price both figures separately before deciding the bundle is cheaper.',
          'Hot-right-now FOMO buys outside your lane — the worst budget-breaking purchases are the ones driven by the community buzz around a figure you would not have cared about six months ago. The buzz fades. The money spent on that figure does not come back.',
        ]},
  
        { type: 'h2', text: 'The patience trade-off' },
        { type: 'p', text: 'Budget collecting is fundamentally a patience practice. You will watch figures get bought by others at prices you would have paid. Some of those figures will never come back to your price point. That is the cost of the strategy — not a failure of it. The vast majority of the time, patience wins, because most figures in active lines come back around. The cases where waiting costs you are real, and they hurt, but they are the minority.' },
        { type: 'p', text: 'The protection is specificity. Know exactly which figures on your list have genuine, permanent scarcity — vintage one-offs, confirmed-retired exclusives, short-run pieces with no reissue path — and treat those differently. Be willing to move at the comp price when they appear. For everything else, wait.' },
        { type: 'callout', text: 'Know your grails from your wants. A grail is the figure you have hunted, that has genuine scarcity, and that you would regret passing at a fair price. A want is a figure on your list that is not going anywhere. Grails get urgency. Wants get patience.' },
  
        { type: 'h2', text: 'Putting it together' },
        { type: 'p', text: 'Budget collecting is not a compromise. It is a structure. A lane gives you focus and a filter. Buying the floor gives you a real entry price instead of a hyped one. Seasonal and clearance timing gives you the cheapest windows. Passing on the right things keeps the money available for the figures that matter. And knowing your grails from your wants keeps patience from costing you the pieces you will never stop regretting.' },
        { type: 'p', text: 'The whole system depends on knowing what figures actually sell for — not what they are listed at, but what real buyers actually paid. FigurePinner shows you the real sold comps and the price trend for every figure in your lane, so you can price your list against the market instead of the wishlist, and buy at the floor with confidence.' },
      ],
    },
  
    // ─── id 15 ───────────────────────────────────────────────────────────────────
    // Renamed 2026-08-02 from 'condition-grading-for-collectors' (webaudit A1: Bing
    // was earning clicks at 'how-action-figure-conditions-are-graded', a 404 today --
    // same intent, so this is a rename not a new article). 301 old -> new in
    // next.config.ts. See WEBAUDIT-TO-WEB-GUIDES-404-MAP-BING-EARNING-2026-08-02.md.
    {
      slug: 'how-action-figure-conditions-are-graded',
      title: 'Grading and Condition: What Collectors Actually Care About',
      metaTitle: 'Action Figure Condition Grading Guide for Collectors | FigurePinner',
      metaDescription:
        'Why figures use a loose/complete/MOC/sealed ladder instead of numeric grades, what each tier actually means to buyers, and how condition gaps translate to real price differences.',
      dek: 'A 9.0 is a baseball card standard. Figures have their own condition language — and it maps directly to money.',
      readingMinutes: 7,
      updated: '2026-06-09',
      body: [
        { type: 'p', text: 'Mention "grading" to a sports card collector and they reach for a numeric scale. Mention it to a figure collector and you will get a blank stare — or a laugh. Figures do not work like cards. The condition system that actually governs figure pricing is a ladder of tiers: loose, loose-complete, mint-on-card, mint-in-box, sealed. Each step means something specific, and each step moves the price.' },
        { type: 'p', text: 'Understanding this ladder is not a formality. It is how you price what you own, evaluate what you are buying, and avoid the most common mistake in figure collecting — comparing your figure to a comp that is not actually in the same condition.' },
  
        { type: 'h2', text: 'Why figures don\'t use numeric grades' },
        { type: 'p', text: 'Professional grading services — AFA, CGA — do apply numeric systems to carded figures, and those grades matter at the high end of the market: sealed vintage, premium exclusives, investment-grade pieces where a difference of a few grade points justifies hundreds of dollars. But for the vast majority of figure collecting, that infrastructure is overkill, and the community never adopted it as a daily language.' },
        { type: 'p', text: 'The reason is practical. A trading card is a flat object; its condition reduces to surface, corners, and centering. A figure is a three-dimensional articulated object that may have a dozen moving parts, removable accessories, a card or box that is graded separately from the figure inside it, and multiple condition axes — paint, joints, accessories, packaging — that do not collapse into one number without losing information. The tier system evolved to carry that complexity without burying buyers and sellers in a rubric every time a figure changes hands.' },
        { type: 'callout', text: 'Numeric grading services like AFA do add value for high-stakes purchases — sealed vintage or top-tier exclusives where the premium is large and authentication matters. For everyday figure trading, the tier ladder is the language. Know both, use the right one.' },
  
        { type: 'h2', text: 'The condition ladder, defined' },
        { type: 'p', text: 'These are the tiers the collector community actually uses, from lowest to highest preservation grade:' },
        { type: 'ul', items: [
          'Loose, incomplete — out of the package and missing accessories: the belt, the alternate head, the signature weapon, the Build-a-Figure piece. This is the lowest tier and the most common starting point for vintage figures that have been through a childhood. Prices are meaningfully lower, often 30-50% below a complete example for the same figure.',
          'Loose, complete — out of the package but with every accessory present. This is the baseline for most figure pricing. When you pull sold comps without filtering, this is what most of them are. The paint should be clean, joints should function, nothing should be broken.',
          'Loose, near-mint — complete and essentially perfect out of package. Very light play wear at most. This is what a collector pulling from a case and deciding not to display it would look like.',
          'MOC (Mint on Card) — still in the original blister on the original card, never opened. For carded figures. The card itself has condition: corner dents, creases, bubble yellowing, and punched vs unpunched hang holes all factor into MOC pricing.',
          'MIB (Mint in Box) — in the original box with all inner packaging. For boxed figures. "Near Mint in Box" acknowledges minor box wear that does not affect the figure.',
          'MISB (Mint in Sealed Box) — factory sealed, never opened, tape intact. The highest preservation tier for boxed releases.',
        ]},
        { type: 'p', text: 'The gap between tiers varies by figure and era but tends to be substantial. A mint-on-card figure typically commands a meaningful premium over a loose-complete example — sometimes 50%, sometimes double, occasionally more on vintage lines where the surviving sealed population is genuinely small. A loose-incomplete figure lands well below both.' },
  
        { type: 'h2', text: 'What actually moves price within a tier' },
        { type: 'p', text: 'Within a given tier, condition still varies and price varies with it. The things collectors look at most closely:' },
        { type: 'ul', items: [
          'Paint wear — on loose figures, the face sculpt and paint application are the most inspected surface. Worn paint on a face is a significant visual downgrade; wear on a boot is barely noticed. Not all paint wear is equal.',
          'Joint tightness — a figure with loose hips or floppy ankles is harder to pose and display. Modern figures with many articulation points have more ways to fail. Tight joints are worth more.',
          'Card condition for MOC — corner dents and creases on the card backing reduce a MOC premium considerably. A figure with a perfect blister bubble on a crushed card is a complicated comp. Collectors separate "card grade" from "figure grade."',
          'Yellowing — on vintage figures especially, white or light-colored plastic yellows over time through oxidation. A clean, non-yellowed Hasbro WWF figure is rarer than a yellowed one and commands a real premium.',
          'Original accessories — the presence of an original-run belt versus a reproduction is not just a completeness question; it affects the grade. Reproductions do not fulfill the complete standard for serious buyers.',
        ]},
        { type: 'callout', text: 'The completeness standard is strict among experienced collectors: every accessory the figure shipped with, original run, not a reproduction. A reproduction belt keeps a figure technically "complete" for casual sales, but serious buyers and serious comps assume original accessories. Know which standard your comp was sold under.' },
  
        { type: 'h2', text: 'How to read a listing\'s condition honestly' },
        { type: 'p', text: 'Condition language in listings is inconsistent by nature. "Excellent condition" means different things to different sellers. The way to cut through it: read the specific claims, then look at the photos. A listing that says "complete" but does not show the accessories is a risk. A listing that photographs each accessory separately is a much stronger signal. For any figure where condition matters to the price — vintage, grail-tier, MOC-premium — buy from sellers who show you, not just tell you.' },
        { type: 'p', text: 'The other read is the comp spread. If you pull comps and see a wide range for the same figure — say, a spread of $30 to $90 — that is almost never random noise. It is condition distribution. The $30 sales are incomplete or damaged. The $90 sales are near-mint or sealed. Your job is to identify where on that spectrum your specific figure sits, then price or bid accordingly.' },
  
        { type: 'h2', text: 'Putting it together' },
        { type: 'p', text: 'The condition ladder is not jargon — it is the actual pricing mechanism. Loose, complete, MOC, sealed each represent a distinct product that trades at a distinct price, and conflating them is how you either overpay buying or underprice selling. The collector community has a shared understanding of what each tier means, and the comps are priced against it. Learn the language, apply it consistently, and you will price any figure you own or want with the same accuracy a professional dealer would.' },
        { type: 'p', text: 'FigurePinner pulls the real sold comps on every figure so you can see exactly what the market is paying for each condition tier — and make sure you are comparing your figure against the right tier, not the wishful one.' },
      ],
    },
  
    // ─── id 16 ───────────────────────────────────────────────────────────────────
    {
      slug: 'transformers-collecting-guide',
      title: 'Transformers Collecting: Masterpiece vs Studio Series vs Generations',
      metaTitle: 'Transformers Collecting Guide: Masterpiece vs Studio Series vs Generations | FigurePinner',
      metaDescription:
        'Three Transformers lines, three very different buyers, three price tiers. Where a new collector starts, what each line actually offers, and which holds value on the secondary market.',
      dek: 'One franchise, three completely different hobbies. Which line you collect is the first decision — and it drives everything else.',
      readingMinutes: 8,
      updated: '2026-06-09',
      body: [
        { type: 'p', text: 'Walk into any serious Transformers collection and you will see figures that look nothing like each other. On one shelf: a hyper-detailed, diecast-heavy figure that cost over a hundred dollars, articulated to the millimeter and accurate to a single frame of a 1985 cartoon. On another shelf: a movie-accurate Bumblebee from a 2023 film, clean design, film-accurate proportions, bought for forty dollars at a retailer. On a third: a G1-inspired cartoon-colored robot that looks exactly like the original toy but with modern articulation, somewhere in between.' },
        { type: 'p', text: 'These are not different versions of the same hobby. They are three distinct collecting markets that share a franchise but almost nothing else about who buys, what they pay, or how the secondary market works. Here is how to read them.' },
  
        { type: 'h2', text: 'Generations: the collector\'s entry point and the broadest line' },
        { type: 'p', text: 'Generations is Hasbro\'s ongoing collector-oriented mainline — the catch-all label that covers G1-inspired releases, the War for Cybertron and Kingdom sublines, and any non-film, non-Masterpiece figure aimed at an adult collector. It is the widest line, the most accessible price point, and the one with the deepest active secondary market.' },
        { type: 'p', text: 'The figures here are sold at mainstream retail — mass market stores and online — at price points that vary by size class. A Deluxe figure is a weekly grocery-run price. A Leader class figure is a deliberate buy. The accessibility is the point: Generations is where most people enter the hobby and where most of the community\'s ongoing attention lives.' },
        { type: 'ul', items: [
          'G1 accuracy matters here — the visual callbacks to the 1984 cartoon and toy line are a primary selling point for much of the line. A Generations Optimus Prime is recognizable to someone who watched the cartoon at five years old.',
          'The sublines have their own following — War for Cybertron, Siege, Earthrise, Kingdom were a consecutive series in a shared continuity that many collectors completed as a set. Those runs are now finished and trade as a unit on the secondary market.',
          'Combiners and team sets drive collecting — Generations has produced multiple combining figures across eras. Completing a combiner team across a wave is a real collecting project, and the secondary market prices the components accordingly.',
        ]},
        { type: 'callout', text: 'If you are new to Transformers collecting, Generations is where to start. Active retail presence, reasonable price points, broad character selection, and an enormous community to buy and sell with. Figure out which era of G1 you care about and work from there.' },
  
        { type: 'h2', text: 'Studio Series: film accuracy for the movie-era collector' },
        { type: 'p', text: 'Studio Series launched with the goal of doing what no previous movie-tie-in line had done: produce genuinely film-accurate figures for the live-action Transformers films. Not simplified kid-aimed interpretations, but figures that reflect how the characters actually look in the films — complex transformation engineering, movie-specific proportions, the design vocabulary of the Bay-era and Bumblebee-era films.' },
        { type: 'p', text: 'The price tier sits above standard retail for comparable Generations figure sizes, reflecting the more complex engineering. A Studio Series Deluxe figure typically retails meaningfully above a Generations Deluxe; a Voyager class figure commands more still. The Titan class figures — large-format, premium engineering — sit at the top of the line\'s price range.' },
        { type: 'ul', items: [
          'Film-era nostalgia is the engine — the 2007 and 2009 films defined Transformers for a generation that is now in their late twenties and thirties. Studio Series exists specifically for that audience.',
          'The line is ongoing and active — which matters for resale: popular characters get revisited and retooled, which can compress secondary prices on earlier versions the way a reissue does in any other line.',
          'The film-accuracy standard is its own appeal and its own limitation — collectors who care about G1 cartoon looks find Studio Series jarring. The two lines sell to largely different buyers.',
        ]},
  
        { type: 'h2', text: 'Masterpiece: the premium tier and its own world' },
        { type: 'p', text: 'Masterpiece — the original Takara label — was built around a single premise: the definitive version of a G1 character, as accurate to the cartoon and as engineering-rich as possible, with diecast metal components, multiple paint applications, display accessories, and the kind of complexity that takes minutes to transform instead of seconds. The price tier reflects all of that. Masterpiece figures have historically sold at a significant premium over any other Transformers line, and the secondary market for out-of-print Masterpiece figures can run well above original retail.' },
        { type: 'p', text: 'The line has evolved in recent years — Takara transitioned to the MPG (Masterpiece-grade) label as a successor, and a Masterpiece Movie Series NEXT was announced for the film-era characters. The core audience and core proposition remain the same: the most expensive, most detailed, most collectible version of the character.' },
        { type: 'ul', items: [
          'Diecast and paint are the distinguishing marks — Masterpiece figures feel different from plastic-only mass-market releases. That tactile quality is part of what collectors pay for.',
          'Print runs are smaller and the line is not mass retail — which means out-of-print Masterpiece figures hold value differently than a Generations figure that restocks. Secondary prices on desirable, discontinued Masterpiece releases can stay elevated.',
          'Condition premium is steep — a sealed Masterpiece figure versus an opened one represents a significant price gap, more so than in mass-market lines, because the preservation audience is larger relative to the total collector base.',
        ]},
        { type: 'callout', text: 'Masterpiece is the end game for many G1 collectors — the line you move toward once you have a sense of which characters you actually want in definitive form. It is not a good starting point because the price stakes mean early mistakes are expensive ones.' },
  
        { type: 'h2', text: 'Secondary market behavior: how the three lines trade differently' },
        { type: 'p', text: 'The three lines have genuinely different secondary market profiles, and this matters if you are buying for value or planning to sell.' },
        { type: 'p', text: 'Generations figures typically hold value near retail until they are heavily restocked, then drift toward retail floor. Popular subline completions — a finished Kingdom or Siege set, a complete combiner team — hold better than individual figures because they trade to completionist buyers. The ongoing nature of the line means there is always new competition from current releases.' },
        { type: 'p', text: 'Studio Series figures follow a similar pattern to Generations with one added wrinkle: the film-specific nostalgia spike around anniversaries and new media. A 20th-anniversary Transformers film moment is a commercial trigger, and the line will respond to it. Secondary prices for earlier Studio Series figures can compress when new, superior sculpts of the same character are announced.' },
        { type: 'p', text: 'Masterpiece figures hold value most reliably because supply is structurally limited — smaller print runs, no mass retail restock cadence, and a collector base that tends to hold rather than flip. Out-of-print Masterpiece figures can trade significantly above original retail, and that premium tends to be durable in a way that Generations or Studio Series premiums typically are not.' },
  
        { type: 'h2', text: 'Putting it together' },
        { type: 'p', text: 'Three lines, three decisions. If you want broad access, active retail, and the ability to buy and sell easily, Generations is the lane. If you grew up with the Bay films and want screen-accurate figures from that era, Studio Series is built for you. If you want the definitive, maximum-quality version of specific G1 characters and are willing to pay the premium, Masterpiece — in its current MPG form or its back catalog — is the destination. The mistake is treating them as interchangeable, because the buyers, the prices, and the resale behavior are fundamentally different.' },
        { type: 'p', text: 'FigurePinner tracks sold comps across Transformers lines so you can see what each tier is actually trading for before you buy — not what the listings claim, but what buyers actually paid. Look up the figure, see the real sold price, and know exactly which market you are entering.' },
      ],
    },
  
    // ─── id 31 ───────────────────────────────────────────────────────────────────
    {
      slug: 'valuable-wwe-elite-series',
      title: 'WWE Elite Series Numbers That Are Worth the Most',
      metaTitle: 'Most Valuable WWE Elite Series Numbers | FigurePinner',
      metaDescription:
        'Not every WWE Elite trades the same. Early series, chase variants, and exclusives from the Mattel era command real premiums. Here is what actually drives value in the Elite line.',
      dek: 'Series 1 came out in 2010. Some of those figures still sell for more than the day they shipped. Here is why.',
      readingMinutes: 8,
      updated: '2026-06-09',
      body: [
        { type: 'p', text: 'Most WWE Elite figures are affordable. Walk down the secondary market and the floor is low — current figures near retail, common names from the last few years trading around retail or below. It is one of the things that makes Elites appealing as a collecting line: you can fill a shelf without a grail budget.' },
        { type: 'p', text: 'But the floor is not the whole story. In a line that has run for more than a decade and produced over a hundred mainline series plus a sprawling catalog of sublines, there are figures that trade significantly above everything else — and the reasons are specific and learnable. This is what actually drives value in the Elite catalog.' },
  
        { type: 'h2', text: 'Why the early series matter' },
        { type: 'p', text: 'The Elite line launched in 2010, and the earliest series have the characteristics that drive collectible value across every line: smaller initial production relative to later series, an established collector base that has been accumulating since the beginning, and a nostalgia pull for collectors who bought them on day one. Series 1 through roughly Series 10 occupy a different pricing tier than series from the 2020s, because the supply of clean, complete examples from those early runs only shrinks as figures get opened, lost, or damaged.' },
        { type: 'p', text: 'This is not unique to Elites — it is the structural reality of any ongoing line. The first waves of any long-running series typically hold value better than later waves, all else equal, because demand from collectors who want to complete a full set extends back to the start while the supply of early-series examples dwindles. The Elite line has been running long enough that this dynamic is well-established.' },
        { type: 'callout', text: 'Early series value is not just nostalgia. It is a supply reality: a Series 2 figure that was produced in a 2010-era print run has a smaller surviving clean population than a 2023 release that shipped last year. Every year, more of the early supply gets opened, damaged, or dispersed into collections where it does not trade again for years.' },
  
        { type: 'h2', text: 'Chase variants: the built-in scarcity tier' },
        { type: 'p', text: 'The Mattel Elite line includes chase variants — short-packed alternate versions of a figure in a wave, produced at a lower ratio than the standard figure. The chase is typically a deco variant: a different paint application, an alternate costume color, occasionally a swap on a smaller element. The exact difference is documented by the community and verified; the premium exists because the supply is structurally lower.' },
        { type: 'p', text: 'Chase premiums in the Elite line are real and consistent. A chase variant regularly sells above the common version of the same figure, sometimes significantly. The size of the premium depends on the popularity of the wrestler, the appeal of the specific variant, and how thin the supply is — which correlates with how old the wave is. An early-series chase from 2010 to 2015 has had over a decade of supply contraction; a recent chase is easier to find.' },
        { type: 'ul', items: [
          'Authenticate the deco — every legitimate Elite chase has a specific, documented difference. Know what it is before paying the premium. A slight paint variation from production drift is not a chase; the community distinguishes between intentional short-packs and accidental variation.',
          'Condition premium is steeper on chases — a chase pulled and opened loses its sealed premium in a line where the community does track MOC versus loose. For figures that command chase-level prices, condition matters more than on common figures.',
          'Cross-reference the wave documentation — the Wrestling Figure Database and the collector community have catalogued which waves contain chases and what the specific variant is. This is not a research gap; the information is documented.',
        ]},
  
        { type: 'h2', text: 'Exclusives: the retailer and event tier' },
        { type: 'p', text: 'Beyond the mainline, the Elite catalog includes a range of exclusives that consistently trade above the common equivalent — Ringside Collectibles exclusives, WWE Shop figures, fan channel releases, and event-specific figures. The value drivers here are the same as any exclusive: lower production relative to demand, a specific audience of completionist collectors, and a secondary market that cannot be satisfied by new retail restock.' },
        { type: 'p', text: 'Ringside Collectibles in particular has built a significant library of exclusive Elites over the years — wrestlers in specific costumes, entry gear sets, figures that do not appear in the mainline. These trade at premiums that have historically been durable, because Ringside exclusives are a known quantity in the community and the audience for them is consistent.' },
        { type: 'callout', text: 'Exclusives are not all created equal. A figure exclusive to Ringside in a specific costume a wrestler is known for carries a different demand profile than a general shared-exclusive that went wide to multiple channels. The rarer the distribution channel, the more durable the premium tends to be.' },
  
        { type: 'h2', text: 'The retired superstar factor' },
        { type: 'p', text: 'One of the most reliable value drivers in the Elite line is the intersection of a retired or deceased superstar with limited figure coverage in the catalog. An active star gets new Elites regularly — which continuously refreshes the supply and caps secondary prices on any specific version. A retired wrestler, or one who passed away, does not get new figures, which means the existing supply is all there is.' },
        { type: 'p', text: 'This is why figures of specific superstars from the early series trade differently than their series number alone would suggest. A superstar who is still active gets revisited in the catalog; a figure of someone retired or passed means buyers who want that wrestler have a finite set of options, and the best of them command real premiums. The demand is emotional and persistent.' },
  
        { type: 'h2', text: 'What doesn\'t hold value in the Elite line' },
        { type: 'p', text: 'Understanding what is not valuable is as important as knowing what is. Common Elites from recent series of currently active wrestlers — the figures that fill current retail endcaps — tend to trade near or below their retail price on the secondary market. The line produces them at scale, retailers stock them broadly, and the demand does not exceed supply in any lasting way. Buying at full retail on a figure without a specific scarcity reason almost always means buying at the ceiling of its resale value, not the floor.' },
        { type: 'p', text: 'The exception is a common-appearing figure that turns out to be rarer than expected because a wave was under-distributed or a retailer exclusive hit a tighter print run than the collector community anticipated. Those are real but hard to identify in advance. The safe assumption is that a figure from an active, ongoing line has the resale ceiling of its retail price unless there is a specific, named scarcity reason.' },
  
        { type: 'h2', text: 'Putting it together' },
        { type: 'p', text: 'The Elite line has a genuine upper tier — early series figures, chase variants, exclusives, and retired-superstar coverage that do not get refreshed. These trade at premiums that the floor of the line does not suggest, and finding them requires knowing what to look for rather than assuming every Elite trades the same. Pull the sold comps on the specific figure, check whether it carries one of the known value drivers, and price from what the secondary market actually confirmed — not from the listing wall of optimistic sellers.' },
        { type: 'p', text: 'FigurePinner tracks the real sold comps across the Elite catalog so you can see exactly where the standard figures end and the premium ones begin. Look up the series, find the figure, and know what the market is actually paying before you buy or before you price yours.' },
      ],
    },
    {
      slug: 'gi-joe-classified-vs-arah',
      title: 'G.I. Joe Classified vs A Real American Hero: Which to Collect',
      metaTitle: 'G.I. Joe Classified vs ARAH: Which Line to Collect | FigurePinner',
      metaDescription:
        'Modern 6-inch Classified or vintage 3.75-inch A Real American Hero? Two completely different markets, two kinds of collectors, two value engines. How to pick your lane.',
      dek: 'Same Snake Eyes, thirty-eight years apart, and two markets that barely speak to each other. Here is how each one actually works.',
      readingMinutes: 8,
      updated: '2026-06-10',
      body: [
        { type: 'p', text: 'Snake Eyes has been sold to you twice. Once in 1982 as a 3.75-inch figure with an o-ring in his waist and a file card on the back of the package, and again in 2020 as a 6-inch Classified Series figure with butterfly shoulders and double-jointed knees. Same character, same commando, and two markets so different they might as well be collecting different hobbies. Pick the wrong one for who you are and you will burn money, shelf space, and enthusiasm. Pick the right one and you are home.' },
        { type: 'p', text: 'This is not a better-or-worse argument. Both lines have real collector bases and real secondary markets. But the value drivers, the completion standards, and the buying skills they demand are almost entirely different — and most new Joe collectors do not find that out until they have already committed.' },
  
        { type: 'h2', text: 'Two lines, two formats' },
        { type: 'p', text: 'A Real American Hero launched in 1982 at the 3.75-inch scale — small figures, swivel-arm articulation arriving early in the run, the famous rubber o-ring holding the waist together, and a vehicle-and-playset ecosystem that no modern line has matched. It ran through the early 90s, it is finite, and every figure in it is now a vintage item between three and four decades old.' },
        { type: 'p', text: 'The Classified Series is the opposite animal: launched in 2020 at the 6-inch collector scale Hasbro had already proven with Marvel Legends and Star Wars Black Series. The first wave — Duke, Snake Eyes, Scarlett, Roadblock, and Destro — hit at roughly $19.99 a figure, with modern articulation counts north of twenty points. It is a living, in-production line, which means the catalog grows every year and the supply tap is still open.' },
  
        { type: 'h2', text: 'What ARAH collecting actually demands' },
        { type: 'p', text: 'Vintage ARAH is a condition-and-completeness game, and it is one of the strictest in the hobby. A loose figure is not “complete” because it looks complete — collectors check every accessory, and the file card culture means even paperwork carries value. The same character can be a cheap shelf filler or a real sale depending on whether the original gear is all there.' },
        { type: 'p', text: 'Then there is the plastic itself. Forty-year-old o-rings dry out and snap. Thumbs on vintage Joes are notoriously brittle — a cracked thumb is one of the first things a serious buyer checks, because it is the difference between a collector-grade figure and a parts donor. Gold-painted details wear. None of this is a reason to avoid the line; it is the skill the line teaches. ARAH collectors become condition inspectors because the market punishes anyone who is not.' },
        { type: 'callout', text: 'Vintage ARAH is a finite set. Nothing new is ever entering it, which is exactly why clean, complete examples hold their value — the supply only degrades from here. The flip side: you are competing with collectors who have been hunting these figures since before you started.' },
  
        { type: 'h2', text: 'What Classified collecting actually demands' },
        { type: 'p', text: 'Classified is a modern-line game, which means the dangers are different. Condition barely matters on a figure you bought new last year — what matters is reading the production cycle. Early figures that went out in smaller first runs have climbed; figures Hasbro keeps in circulation sit at or below retail. Retailer exclusives and convention pieces carry premiums precisely because the supply tap on those specific releases closed quickly.' },
        { type: 'p', text: 'The skill Classified teaches is reissue awareness. A modern line reprints its hits. The figure you paid triple for on the aftermarket can come back as a re-release and lose most of that premium overnight. ARAH collectors never face this; Classified collectors face it constantly. Before you pay over retail for any in-production figure, the question is not “is it rare now” — it is “can the manufacturer make it not-rare next year.”' },
  
        { type: 'h2', text: 'How the two markets value things' },
        { type: 'ul', items: [
          'ARAH value drivers: condition (unbroken thumbs, tight o-rings, clean paint), completeness (every accessory plus file card), and era scarcity — later-run and foreign-release figures saw smaller distributions and trade accordingly.',
          'Classified value drivers: exclusivity (convention and retailer exclusives), early-wave scarcity before the line found its footing, and character demand — the names collectors army-build or grew up with move first.',
          'The shared driver: nostalgia. ARAH trades on the kids of the 80s; Classified trades on those same collectors buying the modern version of their childhood — which is why the classic-look figures in Classified consistently outperform the redesigns.',
        ]},
  
        { type: 'h2', text: 'So which lane is yours?' },
        { type: 'p', text: 'If the 1982-94 run is your childhood — if you remember the file cards and the carpet battles — vintage ARAH will scratch an itch Classified cannot touch. Budget for the condition premium, learn the completeness standard before you buy, and accept that building anything close to a full run is a years-long hunt. That hunt is the hobby.' },
        { type: 'p', text: 'If you want display presence, modern articulation, and an entry price that does not require comp research before every purchase, Classified is the friendlier lane. Buy what is at retail while it is at retail, be skeptical of aftermarket premiums on anything still in production, and treat exclusives as the only tier where scarcity is real.' },
        { type: 'p', text: 'And plenty of collectors run both — vintage for the soul, Classified for the shelf. There is no wrong answer, only a wrong price.' },
        { type: 'p', text: 'Whichever era you collect, the discipline is the same: know what the figure actually sells for before money moves. FigurePinner pulls the real sold comps — vintage ARAH and modern Classified alike — so you can see what the market paid, not what a seller hopes. Look the figure up before you buy, and price from evidence.' },
      ],
    },
    {
      slug: 'motu-collecting-guide',
      title: 'Masters of the Universe: Origins, Masterverse, and Vintage MOTU',
      metaTitle: 'MOTU Collecting Guide: Origins vs Masterverse vs Vintage | FigurePinner',
      metaDescription:
        'Three ways into Masters of the Universe collecting: vintage 1982 figures, retro-style Origins, and collector-grade Masterverse. What each line is, who it is for, and what holds value.',
      dek: 'He-Man has three doors back into your collection. They lead to very different rooms.',
      readingMinutes: 8,
      updated: '2026-06-10',
      body: [
        { type: 'p', text: 'You held the Power Sword once. Maybe it was 1984 and the figure was He-Man himself, or Skeletor, or a Beast Man your cousin left behind — but if you are reading a Masters of the Universe collecting guide, some part of you remembers the heft of those chunky 5.5-inch figures and the spring-loaded waist that made them punch. Mattel knows you remember. That is why there are now three distinct MOTU lines competing for your money, and why picking the right one matters more than collectors expect.' },
  
        { type: 'h2', text: 'The vintage line: 1982 and the nostalgia engine' },
        { type: 'p', text: 'The original Masters of the Universe line hit stores in 1982 as 5.5-inch figures — deliberately bigger and beefier than the 3.75-inch standard Star Wars and G.I. Joe had set. It ran through the late 80s, sold in enormous numbers, and built one of the most durable nostalgia engines in the hobby. The kids who stormed Castle Grayskull on shag carpet are now collectors in their forties with disposable income, and the vintage market reflects it.' },
        { type: 'p', text: 'Vintage MOTU value is a condition-and-completeness story with a few line-specific twists. The soft plastic on those figures wears in known ways: paint rub on chests and faces, loose limbs from stretched bands, and the rubber band waists that lose their snap. Completeness means weapons and armor — a loose He-Man without his sword and harness is a fraction of a complete example, and the small accessories are exactly what got lost in sandboxes for a decade. Carded vintage figures are a different universe entirely, trading at multiples that loose examples never approach.' },
        { type: 'callout', text: 'The vintage line is finite and the demographic holding it is at peak spending age. That is the formula behind every strong vintage market in the hobby — and it is why clean, complete vintage MOTU has held value while plenty of newer lines wobbled.' },
  
        { type: 'h2', text: 'Origins: the retro homage with modern joints' },
        { type: 'p', text: 'Masters of the Universe Origins arrived at retail in 2020 — previewed with a limited San Diego Comic-Con release the year before — and the pitch is simple: the vintage look, the vintage proportions, but modern articulation underneath. These are figures built to stand next to your childhood memories without the brittleness of forty-year-old plastic.' },
        { type: 'p', text: 'Origins is the budget-friendly door into MOTU. Figures launched at mainline retail prices, the roster runs deep into characters the vintage line never made, and opening them costs you nothing in collector guilt because the supply is modern and ongoing. The value profile matches that: most Origins figures trade at or near retail, with premiums concentrated in early waves, retired figures, and exclusives. It is a line you collect for love and display, not appreciation — and the market is healthier for it.' },
  
        { type: 'h2', text: 'Masterverse: the collector shelf tier' },
        { type: 'p', text: 'Masterverse launched in 2021 as the 7-inch collector line, initially built around the Netflix Revelation series, with roughly thirty points of articulation and the detailed sculpting aimed squarely at adult shelves. Where Origins leans into retro play, Masterverse competes with Marvel Legends and the other modern collector lines for display dominance.' },
        { type: 'p', text: 'The Masterverse market behaves like every modern collector line: the floor sits at retail, pegwarmers exist, and the premiums live in the figures that hit a nerve — classic-look versions of A-list characters, deluxe releases, and anything that shipped short. The lesson from comparable lines applies here too: in-production figures carry reissue risk, so aftermarket premiums on recent releases are the most fragile prices in the whole MOTU ecosystem.' },
  
        { type: 'h2', text: 'Which door is yours?' },
        { type: 'ul', items: [
          'Collect vintage if the 1982-88 line is the memory itself — and budget for condition, completeness, and a real hunt. This is the only MOTU tier where the figure is also an appreciating vintage item.',
          'Collect Origins if you want the vintage aesthetic without vintage prices — the best pure-fun entry point, and the deepest character roster of the three.',
          'Collect Masterverse if your shelf is modern collector lines and you want MOTU represented at that detail level — just buy at retail and respect the reissue risk.',
        ]},
        { type: 'p', text: 'And the honest answer for a lot of collectors is a mix: a small, high-grade vintage core — the characters that actually were your childhood — surrounded by Origins or Masterverse for everything else. That structure puts the serious money where the value holds and the fun money where the figures are cheap.' },
  
        { type: 'h2', text: 'The price discipline that covers all three' },
        { type: 'p', text: 'Three lines, one rule: the asking price is not the price. Vintage MOTU listings are full of optimistic “rare” claims on figures that sold in the millions. Modern listings are full of aftermarket premiums one reissue announcement away from collapse. The sold comps cut through both.' },
        { type: 'p', text: 'FigurePinner tracks what MOTU figures actually sold for — vintage, Origins, and Masterverse — so you can see the real market before you spend. Look up the figure, check the sold history, and let the evidence tell you whether that grail price is a market or a wish.' },
      ],
    },
    {
      slug: 'jakks-aggression-value-guide',
      title: 'Jakks Ruthless Aggression vs Deluxe Aggression: A Value Guide',
      metaTitle: 'Jakks Ruthless Aggression & Deluxe Aggression Value Guide | FigurePinner',
      metaDescription:
        'The Jakks bridge-generation WWE figures are climbing. What Ruthless Aggression and Deluxe Aggression are, how they differ, and which figures actually carry value.',
      dek: 'The kids who bought these at Walmart in 2005 have salaries now. The market noticed.',
      readingMinutes: 8,
      updated: '2026-06-10',
      body: [
        { type: 'p', text: 'For years the Jakks WWE figures of the 2000s were the dead zone of wrestling collecting. Too new to be vintage, too old to be current, produced in numbers that made “rare” a punchline. You could build the whole era for pocket change. That window is closing — because the collectors who were ten years old when John Cena debuted are now in their thirties, and nostalgia markets always follow the money of the generation that lived it.' },
        { type: 'p', text: 'But this is a market where the line name tells you almost nothing and the wrestler on the card tells you almost everything. Here is how the two big Jakks lines of the era work, and where the actual value hides.' },
  
        { type: 'h2', text: 'Ruthless Aggression: the era\'s workhorse line' },
        { type: 'p', text: 'The Ruthless Aggression mainline launched in 2003, named for the on-screen era it covered, and ran as the backbone of WWE figure retail for the rest of the decade. The figures stood around seven inches with the era\'s standard articulation — shoulders, elbows, hips, knees — and Jakks produced them in enormous quantities across dozens of numbered series plus a sprawl of sublines, multipacks, and exclusives.' },
        { type: 'p', text: 'That production scale is the single most important fact about pricing this line. The roster coverage was exhaustive and the print runs were huge, so the floor — midcard names from heavily shipped series — remains genuinely cheap, loose or carded. The value is not in the line. It is in specific figures the market decided to want.' },
  
        { type: 'h2', text: 'Deluxe Aggression: the articulation tier' },
        { type: 'p', text: 'Deluxe Aggression debuted in 2005 as the premium-articulation counterpart — bulkier figures with significantly more poseability, opening with a Series 1 lineup of Batista, John Cena, Kurt Angle, Randy Orton, Rey Mysterio, and Triple H. It was the era\'s answer to the collector who wanted figures that could actually hit a Pedigree, and it ran for years alongside the mainline.' },
        { type: 'p', text: 'On the secondary market, Deluxe Aggression behaves like a parallel track rather than a strictly more valuable one. The same rule applies — the wrestler drives the price — but the deluxe format adds a wrinkle: these figures came loaded with larger builds and distinctive sculpts that some collectors specifically chase, and carded examples in clean condition are thinner on the ground than the mainline equivalents.' },
  
        { type: 'h2', text: 'The rule: value follows the name, not the line' },
        { type: 'p', text: 'Forget series numbers for a moment. The Jakks-era market is a roster market, and the premiums concentrate in predictable places:' },
        { type: 'ul', items: [
          'Wrestlers who died or left the spotlight — figures of names with no modern Mattel refresh carry scarcity the catalog never planned, because demand has nowhere else to go.',
          'First-figure releases — the earliest Jakks figure of a star who later became an icon is the one that climbs, the same dynamic as a rookie card.',
          'Late-series and short-shipped waves — as retail interest cooled toward the end of the Jakks license, cases shipped lighter, and those later series are quietly the scarcest in the run.',
          'Exclusives and chase variants — ring-gear variants, retailer exclusives, and limited releases that bypassed the giant mainline print runs.',
          'MOC condition on A-list names — loose commons stay cheap, but clean carded examples of the era\'s top stars are where the real spread between loose and carded shows up.',
        ]},
        { type: 'callout', text: 'The print runs on mainline Ruthless Aggression were massive. A figure being twenty years old does not make it scarce — most commons from heavily shipped series are still abundant. Scarcity in this era is specific: the name, the wave, the variant. Never pay a premium for age alone.' },
  
        { type: 'h2', text: 'Why this market is moving now' },
        { type: 'p', text: 'The pattern is the same one that lifted Hasbro WWF figures a decade ago: the audience that watched the product as kids reaches its peak nostalgia-spending years roughly twenty to twenty-five years later. The Ruthless Aggression era audience is arriving at that window right now. The early signs are already visible in sold listings — first Cena and Batista figures, clean carded examples of era-defining stars, and the harder-to-find late waves all trending up while the commons sit still.' },
        { type: 'p', text: 'That divergence is the opportunity and the trap. It means there are real finds in five-dollar bins, and it means there are sellers asking grail prices for figures that exist by the hundred thousand. The only way to tell which is which is the sold data.' },
  
        { type: 'h2', text: 'Buying and selling the era' },
        { type: 'p', text: 'Buying: target the names, not the lines. A complete loose figure of a top-tier name from a scarce wave beats a carded common every time. Check accessories — Jakks figures shipped with belts, shirts, and gear that the loose market routinely lost, and completeness moves the price the same way it does in every vintage market.' },
        { type: 'p', text: 'Selling: if you have a childhood tub of these, do not bulk-lot it blind. The tub is mostly commons — but one first-release name or late-series figure can be worth more than the rest combined, and bulk lots hand that figure to a reseller for free. Sort, look up, then lot the leftovers.' },
        { type: 'p', text: 'FigurePinner has the sold comps across the Jakks era — Ruthless Aggression, Deluxe Aggression, and the sublines — so you can separate the climbing figures from the abundant ones in seconds. Look up the name before you buy, and before you let a single figure leave the tub.' },
      ],
    },

  {
    slug: 'most-valuable-vintage-wrestling-figures',
    title: 'The Most Valuable Vintage Wrestling Figures Right Now',
    metaTitle: 'Most Valuable Vintage Wrestling Figures — LJN, Hasbro, Jakks | FigurePinner',
    metaDescription:
      'Which vintage wrestling figures are actually worth money — specific LJN, Hasbro WWF, and Jakks figures with real sold comp context. What to hunt, what to avoid, and what to look for.',
    dek: 'Not everything old is valuable. Here are the specific figures that actually command real money — and why.',
    readingMinutes: 9,
    updated: '2026-06-16',
    body: [
      { type: 'p', text: '"Vintage" is not a price. A 1993 Hasbro Undertaker and a 1993 Hasbro common can sit in the same tub — one is a $40–80 figure in clean condition, the other goes for five bucks all day. The word old does not decide which is which. The name, the condition, the line, and whether the market has decided it cares — those decide it. If you want to know what vintage wrestling figures are worth serious money right now, here is the specific answer.' },
      { type: 'p', text: 'This is not a tour of why vintage values climb — for that, [[read the era breakdown|/guides/vintage-wrestling-figure-value]]. This is the target list: the figures that are actually moving, what they actually fetch, and the condition and completeness details that separate the real money from the wishful listing.' },

      { type: 'h2', text: 'LJN (1984–1989): where condition is everything' },
      { type: 'p', text: 'LJN made the Hulkamania-era WWF figures — big rubber characters, minimal articulation, maximum nostalgia. The catch is they were played with hard. Clean survivors are genuinely scarce, which is what makes clean LJN worth real money.' },
      { type: 'ul', items: [
        'Hulk Hogan — the most liquid LJN piece, which means both the most available and the most counterfeited. Clean paint, no bite marks, no fade. Loose clean: $30–60 depending on the variant. The immortal yellow is the baseline; the red-and-yellow variants add a premium. MOC examples in clean packaging regularly clear $150–300+.',
        'Andre the Giant — massive figure, beloved character, high demand. Clean loose examples trade $40–80. The size means condition problems are more visible, not less — a faded Andre is a hard sell.',
        'Macho Man Randy Savage — strong demand from the generation that considered him the best of the era. Clean loose: $40–70. Missing accessories (sunglasses on certain releases) reduces this noticeably.',
        'Ultimate Warrior — multiple releases across the LJN run. The later "Talking" version is a separate market. Clean loose base figure: $25–50. Paint stability varies across the run — look for color uniformity on the tassels.',
        'Million Dollar Man Ted DiBiase — consistently one of the stronger LJN comps for a non-top-tier name. The figure is just good, the character is beloved, and clean examples fetch $30–55 reliably.',
      ]},
      { type: 'callout', text: 'The condition split in LJN is severe. "Clean" and "played with" are not the same market — they are not even the same conversation. A Hulk Hogan with a gnawed boot and sun-faded red sells for $10. The same character with sharp paint and no wear is a $50+ piece. Pull photos of the front AND the back of the figure before you value anything in this line.' },

      { type: 'h2', text: 'Hasbro WWF (1990–1994): the series number matters more than the name' },
      { type: 'p', text: 'The Hasbro line is where the most active vintage trading happens, because the range of values is widest and knowing the line well pays off. Early series shipped in large numbers and stay affordable. The later series are the money.' },
      { type: 'ul', items: [
        'Undertaker (Series 3, 1991) — one of the most recognized values in the Hasbro line. Loose complete: $40–75. The chokeslam action feature works or it does not, and "works" adds a premium. MOC clean: $150–250.',
        'Ultimate Warrior variants — the Series 1 Warrior is common and affordable. The harder-to-find Series 4 variant in the alternate color is a different story — loose examples regularly trade $60–120 depending on completeness.',
        'Bret Hart (Series 6+) — the Hitman figures from the later waves benefit from both Bret\'s enduring popularity and the print-run drop-off on the back half of the line. Clean loose: $35–65. Carded is where the premium really kicks in.',
        'Series 10 and later — this is the blanket rule for Hasbro scarcity. As the line wound toward its 1994 end, production thinned. A Series 10–12 figure that might be a midcard character becomes valuable purely by production numbers. Check the series number before you assume a name is common.',
        'European exclusives — figures released only in the UK and Europe that never hit US shelves. These are genuinely scarce in the North American market and command premiums that reflect it. Yokozuna and the variant decos of certain stars are the most discussed in this category.',
      ]},
      { type: 'callout', text: 'Hasbro MOC is a real premium tier. The original card art is iconic — the purple and gold design is instantly recognizable — and sealed examples in clean packaging carry 3–5x the loose price on the right figures. A crushed bubble or bent corner is not a small discount; it is a tier drop.' },

      { type: 'h2', text: 'Jakks era (1996–2010): the name beats the line every time' },
      { type: 'p', text: 'The Jakks window is earlier in its nostalgia cycle — the Ruthless Aggression audience is just arriving at peak-spending years — but specific figures are already moving. The rule here is simple: the line is enormous and the floor is low, but the right name in the right release punches well above it.' },
      { type: 'ul', items: [
        'Eddie Guerrero figures — any Eddie. His death in 2005 ended new production at the peak of his popularity, and demand for his Jakks-era releases has never cooled. Ruthless Aggression Eddie figures loose complete: $40–80. Carded: $80–160. Classic Superstars Eddie figures in clean condition: $60–120+.',
        'Classic Superstars line — Jakks\'s tribute line to legends, often the only modern-plastic release of certain characters. Clean carded examples of the right names (Macho Man, Mr. Perfect, Ricky Steamboat) trade $30–80 each and continue to climb as the line ages out of production.',
        'First Cena and first Batista — the initial Jakks releases of stars who went on to define the era. First-figure dynamics work the same as rookie cards: the earliest version of a name that mattered carries a collector premium, loose complete $25–50 and climbing.',
        'Late-run Ruthless Aggression (Series 30+) — the same print-run scarcity logic that applies to late Hasbro applies here. Series shipped lighter as the license wound down, and those figures exist in smaller numbers regardless of who is on the card.',
      ]},

      { type: 'h2', text: 'The condition checklist that applies to all three eras' },
      { type: 'p', text: 'Regardless of which era you are buying, the same four factors set the comp range for any specific figure. Running these in order keeps you from overpaying on a figure whose photos flattered it.' },
      { type: 'ul', items: [
        'Completeness first. What accessories came with it, and are they present? A Hasbro figure missing its entry-perk accessory and an LJN missing a belt are not loose-complete figures — they are incomplete, and the comp difference is not minor.',
        'Condition of the figure itself. Play wear, bite marks, sun fade, paint chips. Vintage figures were used, and the attrition shows. Clean and played-with are different tiers.',
        'Condition of the card or box (for carded examples). Bubbles, corners, color. The package is the premium on MOC pieces — protect it or price it accordingly.',
        'Action feature functionality (Hasbro and some Jakks). Working spring mechanism vs. stuck or broken is a disclosed condition that affects value. Test it or ask.',
      ]},
      { type: 'callout', text: 'The single most dangerous phrase in a vintage listing is "good for its age." That phrase is doing heavy lifting. A figure in genuinely good condition does not need the qualifier. When you see it, ask for sharper photos of the paint, the back, and the accessories — because "good for its age" usually means wear that the photos are flattering away.' },

      { type: 'h2', text: 'What to actually do with this information' },
      { type: 'p', text: 'A list of valuable figures is only useful if you pair it with current sold data, because "X is a strong figure" and "X sold for Y last week" are two different facts and both matter. A figure I can name as valuable can also be sitting in a trough right now — temporarily oversupplied, a restock of old stock hitting the market, or just a cold period. And a figure I have not named here might be on a run right now because something cultural happened around it.' },
      { type: 'p', text: 'The sold comps are the real-time layer. Before you buy a piece that a list told you was valuable, pull it up, check the last ten sales, and confirm the market agrees this week. Before you sell a piece from your collection, do the same — the best vintage figures move in waves, and catching the right moment is how you get the strong comp instead of the low one.' },
      { type: 'p', text: 'FigurePinner has the sold data for the figures in this guide — Hasbro, LJN, and Jakks era. Look up any of the names above before you buy or sell, and you will see exactly what the market is actually paying this month, not what a list from six months ago told you it was worth.' },
    ],
  },

  {
    slug: 'neca-ultimate-starter-guide',
    title: 'NECA Ultimates: A Horror and Film Collector\'s Starting Point',
    metaTitle: 'NECA Ultimate Figures — Collector\'s Guide | FigurePinner',
    metaDescription: 'NECA Ultimates are the gold standard for horror and movie figures. Here\'s what makes them worth the price, which lines hold resale value, and how to start without overpaying.',
    dek: 'NECA doesn\'t do mass retail the way everyone else does. That\'s exactly why the secondhand market looks the way it does.',
    readingMinutes: 7,
    updated: '2026-06-16',
    body: [
      { type: 'p', text: 'Walk into a specialty shop and you\'ll see two kinds of action figure shelves. One is the sea of brightly branded mass-market releases — the same Batman in six different colorways, Marvel Legends repacks, the endless Star Wars waves. The other is a tighter, quieter row of NECA boxes, each one built around a character most mass-market toymakers wouldn\'t touch. Freddy Krueger. The Predator. Michael Myers. The Terminator. If you\'ve ever stood in front of that row and felt like you were looking at the serious end of the hobby, you were.' },
      { type: 'p', text: 'NECA\'s Ultimate line is the company\'s premium tier. The name matters: these aren\'t just figures. They\'re the most complete version NECA has made of a given character — maximum accessories, multiple head sculpts, swappable hands, and often parts or effects that no previous version included. Understanding what separates an Ultimate from a standard NECA release is the first thing any serious collector needs to know.' },

      { type: 'h2', text: 'What "Ultimate" actually means' },
      { type: 'p', text: 'NECA releases figures across several tiers. At the base level are standard 7-inch figures — one head, one set of accessories, done. Ultimates are a step above in every direction. Expect five to fifteen or more accessories in the box, multiple interchangeable heads (masked and unmasked versions are common), multiple hand sets, and often character-specific effect parts. The Predator gets his trophy skulls, wrist computer, and plasma caster all in one box. Ghost Face gets multiple masks, multiple knife variants, and an interchangeable bloody version. You\'re getting the director\'s cut figure, not the theatrical cut.' },
      { type: 'p', text: 'Retail on most Ultimates runs around $30 to $40 depending on the character and where you buy. That\'s a meaningful premium over budget superhero lines, but for the accessory count and sculpt quality you\'re getting, it\'s a fair trade — which is why the secondhand market for discontinued Ultimates consistently lands above original retail when the character has a strong fanbase.' },
      { type: 'callout', text: 'The thing that separates NECA from the mass-market competition is sculpt quality, not articulation. These aren\'t MAFEX-style engineering marvels — they won\'t hit every dynamic pose. But for character fidelity and screen-accurate paint work, especially on horror and movie properties, the sculpts are often unmatched at any price.' },

      { type: 'h2', text: 'Why horror drives the resale market' },
      { type: 'p', text: 'NECA built its reputation on licenses no one else wanted. Nightmare on Elm Street, Friday the 13th, Halloween, IT — properties with massive nostalgia footprints and obsessive fan bases but almost no dedicated collector product before NECA showed up. When NECA can\'t renew a license, or when production runs end on a particularly beloved character, the secondhand prices react quickly.' },
      { type: 'p', text: 'Horror figures also benefit from a demand cycle most toy lines don\'t have. Every October brings a new wave of buyers who want the Michael Myers or Jason Voorhees on their shelf for Halloween season, then either keep them or resell in November. That annual demand spike is real and creates reliable price floors on the horror staples — Michael Myers, Freddy Krueger, Jason Voorhees. A clean example of any of them doesn\'t sit cheap for long.' },
      { type: 'ul', items: [
        'Predator and Alien — NECA\'s two flagship franchises; deep release history means condition and variant-specificity drive comps more than scarcity alone.',
        'Halloween / Friday the 13th / Nightmare on Elm Street — annual demand spikes each October. Classic characters in clean condition hold well.',
        'Terminator — the T-800 in multiple versions; the cult appeal here is long and steady, not seasonal.',
        'Gremlins — a strong nostalgia base and limited competition from other manufacturers; Stripe and Gizmo editions move consistently.',
        'Convention exclusives and retailer exclusives — these print lower regardless of character; condition matters even more when comps are few.',
      ]},

      { type: 'h2', text: 'The license risk that shapes the market' },
      { type: 'p', text: 'Here\'s the structural fact that every NECA collector learns eventually: licenses expire. When a studio decides not to renew or changes distribution terms, NECA stops making that figure. The molds don\'t transfer to another manufacturer. What\'s already on the market is what there is — and once the channel inventory clears, the secondary market is the only market.' },
      { type: 'p', text: 'This creates a specific kind of scarcity. It\'s not the chase-variant short-pack scarcity of a Marvel Legends wave. It\'s the license-loss scarcity of a discontinued character with no reissue on the horizon. When NECA loses a horror license, anyone who wants that figure has to find one on the secondhand market, and the comp data shows it.' },
      { type: 'callout', text: 'NECA figures don\'t get reissued the way Hasbro repacks do. When a run ends, it ends. That\'s the reason a discontinued Ultimate from a beloved franchise can sit comfortably at double original retail five years after it stopped shipping.' },

      { type: 'h2', text: 'What to know before you buy' },
      { type: 'p', text: 'NECA\'s quality control has improved substantially over the years but is still inconsistent enough to matter at higher price points. If you\'re buying a recent release at retail, inspect the box for corner damage that suggests a rough shipping history — the paint and accessories inside are usually fine, but box collectors will care. If you\'re buying loose on the secondhand market, the most common issue is accessories: the smaller ones (tiny knives, effect parts, display bases) go missing. Always ask the seller to photograph every piece against the back-of-box checklist before committing.' },
      { type: 'p', text: 'Also understand the scale ecosystem. NECA\'s core is 7 inches, with a quarter-scale 18-inch line for major characters and an 8-inch retro cloth-goods line. Mixing scales on a shelf is fine as a display choice, but they\'re not interchangeable collector markets. The 18-inch quarter-scale figures carry much higher price ceilings and attract a separate buyer willing to pay for them.' },
      { type: 'ul', items: [
        'Buy with all accessories present — incomplete Ultimates sell for significantly less and are harder to complete with loose-part hunting.',
        'Box condition matters to a subset of collectors; a crushed card on a clean figure loses you buyers, not just value.',
        'Check the release date — a three-year-old Ultimate is more likely to be discontinued than one from last month. That distinction can double the floor price.',
        'NECA does sell direct at store.necaonline.com — for in-production releases, that\'s often the most reliable source.',
      ]},

      { type: 'h2', text: 'Where to start if you\'re new to the line' },
      { type: 'p', text: 'Pick a franchise you actually love, not the one that looks most impressive on paper. NECA\'s deepest releases cluster around Predator, Alien, Halloween, Nightmare on Elm Street, Friday the 13th, Gremlins, and Terminator. If you grew up watching one of those, start there — the figures will mean more to you, you\'ll know which versions are the ones collectors care about, and you\'ll have the personal conviction to hold when the market dips.' },
      { type: 'p', text: 'Once you have a few in hand and understand the quality tier you\'re working with, the secondary market opens up differently. You can read a NECA comp on FigurePinner and understand what you\'re looking at — not just the number, but whether that comp reflects a license-discontinued rarity or an in-production figure still available at retail. That context is what separates a smart buy from a panic buy.' },
    ],
  },

  {
    slug: 'mcfarlane-dc-multiverse-guide',
    title: 'McFarlane DC Multiverse: The Budget Superhero Line Explained',
    metaTitle: 'McFarlane DC Multiverse Collector\'s Guide — What Holds Value | FigurePinner',
    metaDescription: 'McFarlane\'s DC Multiverse delivers superhero figures at mass-market prices. Here\'s what holds resale value, what pegwarms, and how the Gold Label tier changes the math.',
    dek: 'Seven inches, 22 points of articulation, and a price point that made superhero collecting accessible. The catch is knowing which ones actually matter.',
    readingMinutes: 6,
    updated: '2026-06-16',
    body: [
      { type: 'p', text: 'In January 2020, McFarlane Toys took over the DC Multiverse license and did something the superhero action figure market hadn\'t seen in years: they made it cheap. The line launched at $19.99 to $24.99, with 22 points of articulation and character variety that put Mattel\'s previous DC offerings to shame. For collectors who\'d been watching Marvel Legends dominate the 6-inch premium space, DC Multiverse felt like a real answer — volume, variety, and an accessible entry point.' },
      { type: 'p', text: 'Five-plus years and hundreds of releases later, the reality of the line is more complicated. Some figures hold value. A lot don\'t. The Gold Label tier changed the math on exclusives. And the QC inconsistency that critics noted at launch hasn\'t fully disappeared. Here\'s how to think about the line before you spend.' },

      { type: 'h2', text: 'How the line is structured' },
      { type: 'p', text: 'DC Multiverse isn\'t a single line — it\'s a family. The core mass-market releases hit Target, Walmart, and mass retailers at the base price point. Gold Label figures are a step up: premium decos, comic-specific looks, or variant appearances that wouldn\'t work at mass-market margins. These typically carry higher retail prices and shorter production runs. Platinum Label is the exclusive tier — convention pieces, website-direct figures, retailer-exclusive variants. Print runs on Platinum are genuinely low and the market reflects it.' },
      { type: 'p', text: 'McFarlane also uses a build-a-figure mechanic similar to Marvel Legends, where purchasing each figure in a wave includes a piece that assembles into a larger figure. Which BAF matters varies wave to wave — a desirable BAF drives individual figure sales even on characters with thinner demand, which is one reason comps on BAF-wave releases can look higher than you\'d expect for less-iconic characters.' },
      { type: 'callout', text: 'The standard DC Multiverse figure has no real scarcity behind it — these are mass-market runs at mass-market volumes. Value in this line is driven almost entirely by character iconicity, variant specificity, and tier (Gold Label and above). A standard Batman or Superman release will floor at or below retail for years.' },

      { type: 'h2', text: 'What actually holds value' },
      { type: 'p', text: 'Character demand is the single biggest driver here. DC has one of the deepest rosters in superhero fiction, but collector interest concentrates heavily on a short list. Batman — across every version McFarlane has made — has the most consistent secondary market. Superman, The Joker, Wonder Woman, and Harley Quinn follow. Beyond that, demand is franchise-event-driven: a specific look from a popular run, a character who headlined a recent film or animated series, or a figure tied to a moment in comic history that fans already identify with.' },
      { type: 'ul', items: [
        'Gold Label exclusives with limited print runs — these are the floor of value in the line. Comic-specific looks and one-retailer exclusives consistently land above retail when they sell through.',
        'Characters from critically acclaimed storylines — Dark Knight Returns Batman, Knightfall figures, Year One looks. The story connection sustains demand beyond movie cycles.',
        'First releases of deep-cut characters — the first time McFarlane makes an Azrael or a Mister Miracle, that first release often carries a premium even if subsequent waves bring the price down.',
        'Convention exclusives and Platinum Label — small print runs, direct-from-show distribution, the collector psychology of having the one-of-few.',
      ]},

      { type: 'h2', text: 'The QC conversation' },
      { type: 'p', text: 'McFarlane DC Multiverse has a documented quality control reputation that\'s worth understanding before you buy. The sculpts — many of them based on original McFarlane design sensibilities or specific comic art — are genuinely good. The paint applications at the standard tier can be inconsistent: mold flashing, paint slop, poorly applied wash details. It\'s not consistent enough to be a disqualifier, but it\'s consistent enough that buying from photos matters if condition is important to you.' },
      { type: 'p', text: 'The articulation engineering at the base price point has a specific limitation: the figures hit some poses well and struggle with others. Collectors who want extreme dynamic posing options often find the engineering doesn\'t deliver what the joint count implies. For a shelf-display collector who wants a solid character representation, this is rarely a problem. For a collector expecting Marvel Legends-level posability at a lower price point, manage the expectation before you spend.' },

      { type: 'h2', text: 'The pegwarmer reality' },
      { type: 'p', text: 'McFarlane produces a lot of figures at high volume. The combination of volume, accessible price, and a cast of characters that ranges from iconic to deep-deep-cut means the retail shelves produce genuine pegwarmers. A second version of a character who just had a version last year. A supporting character from a canceled show. A figure tied to a movie that underperformed. These sit, clearance, and establish a price floor that can stay below retail for years.' },
      { type: 'p', text: 'This is actually useful information for collectors. If you want a specific DC Multiverse figure for your shelf and you\'re patient, a lot of them come down to clearance pricing eventually. The ones that don\'t — the Gold Label exclusives, the convention pieces, the first runs of beloved characters — those you buy when you see them, because the secondary market on the misses is not kind.' },
      { type: 'callout', text: 'The DC Multiverse line is wide. That width means there are genuine bargains for patient buyers who\'ll wait for clearance on the second or third version of a character. It also means understanding that \'held value\' in this line almost always means Gold Label or above, not base-wave standard releases.' },

      { type: 'h2', text: 'Who this line is for' },
      { type: 'p', text: 'DC Multiverse is the best entry into superhero collecting for someone who wants character variety at a sustainable price. The depth of the DC roster means characters that other lines wouldn\'t produce in a decade show up here regularly. If you\'re a DC fan first and a figure-grade collector second, this line delivers. If you\'re looking for an investment line where figures appreciate consistently, you\'re in the wrong section of the store.' },
      { type: 'p', text: 'Before you buy at above-retail secondhand prices, pull the FigurePinner comps and check which tier the figure is. A Gold Label at 1.5x retail might be a fair buy given the print run. A standard mass-market Batman at 1.5x retail is a miss — patience will get you there for less, or a reprint will arrive before long.' },
    ],
  },

  {
    slug: 'tmnt-collecting-guide',
    title: 'TMNT Figures: Playmates Vintage, NECA, and Super7 Explained',
    metaTitle: 'TMNT Action Figures Price Guide — Playmates Vintage, NECA & Super7 Values | FigurePinner',
    metaDescription: 'TMNT figure price guide: Playmates vintage 1988 first-wave values, NECA animated-series price floors, Super7 ReAction secondhand prices. Three markets, three different sets of comps.',
    dek: 'The Turtles have been in plastic since 1988. What that means for your collection depends entirely on which generation you\'re shopping.',
    readingMinutes: 7,
    updated: '2026-06-16',
    body: [
      { type: 'p', text: 'The first wave of Playmates Teenage Mutant Ninja Turtles figures hit shelves in 1988. Ten figures — the four Turtles plus Splinter, April O\'Neil, Rocksteady, Bebop, and the Foot Soldier — and a licensing deal that would become one of the bestselling toy runs of the decade. If you were a kid in the late 1980s or early 1990s, you owned at least one of these. That nostalgia footprint is why the TMNT figure market is still one of the most active in all of toy collecting, and why understanding the three main product generations is essential before you spend anything.' },
      { type: 'p', text: 'There is not one TMNT collector market. There are three, each with different buyers, different value drivers, and different things to watch out for. Vintage Playmates, NECA\'s premium collector releases, and Super7\'s ReAction retro line operate almost entirely independently from each other.' },

      { type: 'h2', text: 'Vintage Playmates: the nostalgia engine' },
      { type: 'p', text: 'Playmates launched the TMNT line in 1988 at the New York Toy Fair, pairing the rollout with the animated series that launched later that year. The commercial result was extraordinary — those first four years of sales numbers are cited as among the bestselling action figure runs of the era. The line ran until 1997, with character variety expanding well beyond the four Turtles into an enormous roster of villains, variants, and cross-promotional figures.' },
      { type: 'p', text: 'For collectors, the 1988 vintage market concentrates on condition and completeness in a way most modern lines don\'t. These figures are 35-plus years old. Clean paint, tight joints, and all original accessories are genuinely difficult to find. A first-edition Leonardo or Donatello with all accessories in collector-grade condition is a different object than the same figure with a missing weapon and worn paint — and the comp data shows the gap.' },
      { type: 'ul', items: [
        'First-edition 1988 wave figures command the strongest premiums — the original four Turtles, Shredder, Splinter, and Krang. A complete Leonardo with all original accessories runs $80–$150+. MOC first-wave examples are a specialist market: clean cards regularly clear $300–$500.',
        'Accessories are the biggest condition variable. The original soft-PVC weapons are easy to swap from other figures or replace with reproductions. If a seller can\'t confirm weapon originality, price accordingly — a \"complete\" Leonardo with reproduction swords is not a complete Leonardo.',
        'Authentication matters on high-value examples: card back printing, bubble adhesive, and copyright dates are documented and faked. Buy from photos, not descriptions.',
        'Mid-run and late-run figures (1993–1997) are abundant and cheap. The market is almost entirely concentrated in 1988–1991 releases.',
        'The Technodrome and large vehicles carry their own premium when complete — but completeness verification is even harder than on figures. Every piece must be accounted for.',
      ]},
      { type: 'callout', text: 'The single most important number for vintage Playmates isn\'t the figure — it\'s the accessories. A complete Leonardo with all weapons and gear can be worth two to three times an otherwise-identical example with the weapons missing. Buy photos first, not assumptions.' },

      { type: 'h2', text: 'NECA\'s TMNT: screen-accurate premium' },
      { type: 'p', text: 'NECA entered the TMNT market with a very specific product: figures built around their 7-inch Ultimate format, designed to be screen-accurate to the 1987 animated series and the original Mirage comics. These are not nostalgia-repros of the old Playmates design. They\'re detailed adult-collector figures using NECA\'s standard toolkit — multiple head sculpts, swappable hands, character-specific accessories — applied to characters with massive pre-existing recognition.' },
      { type: 'p', text: 'NECA\'s TMNT releases function like the rest of their horror and film catalog: license-dependent, run-limited, and capable of significant secondary-market appreciation when production ends. The animated-series versions of the Turtles, Shredder, and supporting villains built real collector interest quickly. When specific releases go out of production, the comps on those versions hold above retail consistently, especially for the core four Turtles in the 1987 cartoon deco.' },

      { type: 'h2', text: 'Super7 ReAction: retro format, modern price' },
      { type: 'p', text: 'Super7\'s ReAction line approaches TMNT from a completely different angle. The format is a deliberate Kenner-homage: roughly 3.75-inch figures, limited articulation (five points), vintage-inspired blister card packaging. The aesthetic is nostalgia-for-nostalgia — collectors who want the feeling of a 1980s figure without paying vintage-market prices for condition on a 35-year-old piece of plastic.' },
      { type: 'p', text: 'Super7 prices ReAction figures higher than the format suggests — $17 to $22 at retail, often more for exclusives. The premium reflects licensing costs, collector-direct distribution, and limited print runs. Secondhand, the most-wanted characters (Shredder, Krang, Bebop, Rocksteady) run $25–$40 without much trouble. The four Turtles are more liquid and cheaper because Super7 reprints them more often. Honest take: the secondary market is thinner than NECA\'s and less predictable. Run sizes aren\'t published, which makes it hard to know whether a $30 secondhand price reflects genuine scarcity or just low seller competition.' },
      { type: 'ul', items: [
        'Shredder, Krang, Bebop, and Rocksteady consistently show the strongest secondary demand across the Super7 TMNT releases.',
        'Convention exclusives and Ultimates versions (when Super7 produces them) print lower and carry correspondingly stronger floors.',
        'The ReAction format has a specific buyer — not the vintage purist, not the modern-collector-grade buyer, but the person who wants the aesthetic with the assurance of new plastic and clean condition.',
      ]},

      { type: 'h2', text: 'How to think about all three markets together' },
      { type: 'p', text: 'The practical advice is to decide which generation you are before you buy, because crossing markets without intention is how collectors end up with a shelf that satisfies no coherent vision and a collection that\'s hard to sell. Vintage Playmates buyers are buying the specific childhood object — the worn card, the original figure, the accessories they remember. NECA buyers are buying screen-accurate premium craft. Super7 buyers are buying aesthetic nostalgia in a new package.' },
      { type: 'p', text: 'Those three buyers don\'t cross-shop much, which means the comp data separates cleanly. A vintage Playmates first-wave Leonardo is not competing with a NECA animated-series Leonardo for the same buyer — they\'re different objects solving different collecting needs. Understanding which problem you\'re solving tells you which section of the market to look at, and which set of comps actually reflects your situation.' },
      { type: 'callout', text: 'If you\'re going to spend significant money on TMNT vintage, do the photo verification work before you commit. Accessories being present and original — not replacements sourced from another figure — makes the difference between a real comp and a misleading one.' },

      { type: 'h2', text: 'Where the real value hides' },
      { type: 'p', text: 'The highest resale floors in the TMNT market cluster around a few specific conditions: vintage first-edition figures in collector-grade condition with all accessories; NECA releases that have been discontinued due to license expiration or production decisions; Super7 convention exclusives and non-repacked limited editions. Everything else is more price-flexible.' },
      { type: 'p', text: 'The practical call: if you\'re buying TMNT for nostalgia, vintage Playmates first-wave is the only version that actually is the thing you remember. NECA gives you screen-accurate craft Playmates never attempted. Super7 gives you the aesthetic with new plastic. None of them are the same object. Collectors who cross-shop the three without deciding which problem they\'re solving end up overpaying for the wrong thing. Figure out which generation you\'re buying before spending above retail — and pull the comps, because asking prices in vintage TMNT diverge from sold prices more than almost any other market on this site.' },
    ],
  },
  {
    slug: 'hope-summers-marvel-legends-figure-guide',
    title: 'Hope Summers Marvel Legends: The Mutant Messiah Figure You Probably Overpaid For',
    metaTitle: 'Hope Summers Marvel Legends Figure — Price Guide & Collector Value | FigurePinner',
    metaDescription:
      'Hope Summers Marvel Legends Terrax wave guide: what the figure actually sells for, why the 2012 Hasbro release still moves, and which version to buy for your Marvel collection.',
    dek: "First mutant born after Decimation. Came with Terrax's head. Still running ~$27 on the secondary market thirteen years later.",
    readingMinutes: 5,
    updated: '2026-06-18',
    body: [
      { type: 'p', text: 'Hope Summers showed up in X-Men #205 in January 2008 as the first mutant born after the Scarlet Witch depowered nearly every mutant on Earth during House of M. Cable grabbed her out of a burning building in Alaska, declared her the mutant messiah, and spent the next several years dragging her through the future to keep Bishop from putting a bullet in her. That is a lot of backstory for a figure Hasbro packed into a $19.99 wave slot in 2012.' },
      { type: 'p', text: "The Hope Summers Marvel Legends from the Terrax BAF wave came with Terrax's head and Morg's axe — not her own accessories. She is a 6-inch figure in her red bodysuit with cable-influenced design elements, and she got exactly one Marvel Legends release before Hasbro moved on. No repacks. No reissues. No 2.0." },

      { type: 'h2', text: 'What it actually sells for' },
      { type: 'p', text: 'Loose Hope Summers figures from the Terrax wave have been averaging around $27 on the secondary market, with a range of $12 at the low (beat up, missing the BAF piece) to $40 at the high (clean, with the Terrax head). AF411 shows four tracked eBay sales averaging $26.92 against a $19.99 retail — so she runs about 35% above what she cost at Toys R Us in 2012. That is not a grail premium, but for a figure with no reissue and only one release window, it is a real floor.' },
      { type: 'p', text: 'The price ceiling is higher if you are buying the whole wave to build Terrax. Hope has the head and weapon, which means a Terrax builder who finds everything else first will pay more than $27 to close the set. Completionist demand is the real driver keeping her above retail.' },
      { type: 'callout', text: 'FigurePinner tracks current sold comps on the Hope Summers figure page. If you are buying or selling, check what actually moved in the last 30 days before pricing off a number you found anywhere else.' },

      { type: 'h2', text: 'The Terrax wave, ranked for actually finding these' },
      { type: 'p', text: 'The 2012 Terrax BAF wave is eleven figures and two Ghost Rider variants. Finding them all loose has gotten harder as collections get broken up at estate sales and not at retail. Here is the rough liquidity picture: Iron Man and Thor are the easiest finds (most-wanted for the characters, most produced), Hope and Constrictor are middle-tier, and the Steve Rogers variants are the thin end — not because they are expensive, but because nobody holds onto Captain America variants for thirteen years.' },
      { type: 'ul', items: [
        'Ghost Rider (Yellow Flame) — highest average in the wave at ~$42. Hasbro never reissued this exact deco and the yellow flame variant is legitimately harder to find sealed.',
        'Hope Summers — ~$27, driven by Terrax BAF completionism. Price holds as long as collectors are still building Terrax.',
        'Thor — ~$25. Common pull but consistently demanded. The market knows what it is.',
        'Constrictor, Iron Man — at or below retail loose. Serviceable figures, not destination buys.',
      ]},

      { type: 'h2', text: 'Why a 2008 comic character from a cancelled run still has a market' },
      { type: 'p', text: "Hope's market position is not about nostalgia in the usual sense. She is not a childhood character — she debuted when adult collectors were already collecting. What keeps her moving is the Krakoa era. Jonathan Hickman's House of X/Powers of X put the Mutant Messiah plot threads front and center again, and the Dawn of X finally gave Hope the role the original Messiah Complex promised: running the Five, the resurrection team that kept Xavier's nation alive. Collectors who read that run wanted the figure, and there is still only the one." },
      { type: 'p', text: 'There is also no MCU version. The Krakoa books did not become a film, and Hope has never appeared in a Marvel movie or Disney+ series. That cuts both ways. No MCU bump means no massive new casual audience, but it also means no flood of new mass-market figures — what exists from 2012 is still what exists.' },

      { type: 'h2', text: 'Should you buy this figure?' },
      { type: 'p', text: 'If you read Messiah Complex or the Krakoa-era X-Men, yes — she is the right figure for that shelf. One release, no reissue, a character with genuine history. At $25-30 loose, it is not a risk buy.' },
      { type: 'p', text: 'If you are building Terrax, factor her in early. The head is what BAF completers need and it is what sellers know to hold. Budget $30-35 for a clean Hope with the BAF piece, and less if you find one without it (the Terrax head is what carries the premium, not the figure itself).' },
      { type: 'p', text: 'If you are speculating: I would not. There is no MCU trigger coming, no announced new Marvel Legends Hope Summers that would create an anniversary demand spike on the original. The floor is stable. The ceiling is already priced in. Hold what you have if you have it, but do not buy at $40 expecting $80.' },
      { type: 'p', text: 'The full sold-comp picture for this figure is on [[FigurePinner|/marvel/marvel-legends/hope-summers]]. Current median, comp count, and price range — the same data without the opinion if you just want the number.' },
    ],
  },
  {
    slug: 'swvc-vs-black-series',
    title: 'Star Wars Vintage Collection vs Black Series: Which One Is Yours',
    metaTitle: 'Star Wars Vintage Collection vs Black Series — Collector Guide | FigurePinner',
    metaDescription: 'Two scales, two completely different collector communities. The Vintage Collection is 3.75-inch carded nostalgia; the Black Series is 6-inch premium display. Here\'s how to pick the right lane.',
    dek: 'Hasbro makes two lines. You don\'t have to collect both — and most serious collectors don\'t.',
    readingMinutes: 7,
    updated: '2026-06-17',
    body: [
      { type: 'p', text: 'Walk into any Target with a Star Wars aisle and you\'ll see both of them: a row of small, carded figures on vintage-styled blister cards, and a row of larger premium boxes with more detail, more paint, and a higher price tag. Same franchise, same Hasbro, two completely different collector communities. People who understand one sometimes assume they should collect both. Most of the time, that assumption costs them money and shelf space they didn\'t plan for.' },
      { type: 'p', text: 'The Vintage Collection and the Black Series answer different questions. The right one for you depends on what you actually want from a Star Wars shelf.' },

      { type: 'h2', text: 'The Vintage Collection: 3.75 inches and the Kenner legacy' },
      { type: 'p', text: 'The original Kenner Star Wars figures from 1977 were 3.75 inches. That scale defined an entire generation of collecting, enabled vehicles and playsets at a reasonable size, and imprinted deeply on everyone who grew up with them. Hasbro\'s Vintage Collection is a direct heir to that tradition — not just the scale, but the packaging. Each figure ships on a retro-style blister card that deliberately echoes the Kenner cards from the original trilogy era.' },
      { type: 'p', text: 'At current retail the individual TVC figures price around $17.99 to $19.99, which makes them significantly more accessible per-figure than their 6-inch counterparts. That lower per-unit cost enables something the Black Series doesn\'t: army building, vehicle crews, and the kind of deep-roster collecting where you want 30 different characters for a diorama, not 10 premium ones on a shelf.' },
      { type: 'ul', items: [
        'Scale compatibility — TVC figures fit in Hasbro\'s 3.75-inch vehicles and playsets. The Millennium Falcon, the AT-AT, the X-Wing — these are built for this scale.',
        'Card art matters — the retro-style packaging is part of the product for MOC collectors. Vintage Collection packaging is designed to display as an object in its own right.',
        'Deep roster — TVC releases obscure characters the Black Series may never touch. Diorama and vehicle collectors need quantity; TVC delivers it at a manageable per-piece cost.',
        'Nostalgia premium — first-appearance characters and early-run TVC figures carry real secondary market value, especially carded in clean condition.',
      ]},
      { type: 'callout', text: 'The TVC card matters to a significant share of its buyers. Collectors who open everything sometimes underestimate how much of the Vintage Collection\'s value proposition is the packaging itself — the vintage aesthetic, the Kenner-era card art, the physical object on the wall. Strip that away and you\'re buying a small, well-articulated 3.75-inch figure. Keep it carded and you\'re buying Star Wars history in a blister.' },

      { type: 'h2', text: 'The Black Series: 6-inch premium and display presence' },
      { type: 'p', text: 'Hasbro launched The Black Series in 2013 as a direct answer to collector demand for larger, more detailed Star Wars figures. At 6 inches, with more articulation points, better paint applications, and often screen-accurate actor likenesses, Black Series figures are built for display first. They\'re the line you buy when you want Darth Vader to look right on a shelf at arm\'s length — not when you\'re populating a Millennium Falcon cockpit.' },
      { type: 'p', text: 'Current retail on individual Black Series figures runs around $24.99 to $27.99, with two-packs and deluxe releases priced higher. That\'s a meaningful step up from TVC, and it shapes who collects this line: people who want fewer, better figures rather than comprehensive rosters. The Black Series collector tends to be selective. The TVC collector tends to complete.' },
      { type: 'ul', items: [
        'Display quality — at 6 inches, paint detail, head sculpts, and outfit textures read at a comfortable viewing distance. These are shelf objects designed to be looked at.',
        'Actor likenesses — modern Black Series releases have pushed actor accuracy further than any previous Star Wars line. The premium price reflects engineering investment.',
        'Archive Series and Deluxe — special releases within the Black Series tier add helmet-off heads, additional accessories, or collector-grade packaging at a further step up in price.',
        'Secondary market on exclusives — Hasbro Pulse exclusives, SDCC figures, and two-packs with limited retail distribution consistently trade above retail when they sell through.',
      ]},

      { type: 'h2', text: 'What actually holds value in each line' },
      { type: 'p', text: 'Both lines produce figures that hold value and figures that don\'t. The pattern is similar on each side: character iconicity, exclusivity, and whether Hasbro is likely to reissue it. The difference is what makes a figure exclusive in each context.' },
      { type: 'p', text: 'In the Vintage Collection, the highest secondary market prices cluster around early-run figures that haven\'t been repacked, figures tied to specific card styles (original Kenner-inspired runs vs later packaging), and Hasbro Pulse or convention exclusives. Completeness matters here in a way it doesn\'t always in the Black Series — a TVC figure without its accessories is a harder sell, because the scale means accessories are small and easy to lose.' },
      { type: 'p', text: 'In the Black Series, exclusivity is the dominant driver. A Hasbro Pulse exclusive or a limited 2-pack that sells through quickly trades above retail because there\'s no restock and no reprint on the immediate horizon. Iconic characters — Darth Vader, Luke Skywalker, Boba Fett — have had enough releases that any single version needs something specific to command a premium. The Archive Series repacks of classic characters specifically keep those characters available and cap secondary prices on the standard versions.' },
      { type: 'callout', text: 'The Black Series repack is the thing TVC collectors don\'t have to think about as much. Hasbro repacks iconic characters into Archive Series releases specifically to keep them accessible — which is great for new collectors and a ceiling on secondary prices for existing sellers. Know which version you have and whether a repack is available before you price yours.' },

      { type: 'h2', text: 'The scale divide is real and it matters' },
      { type: 'p', text: 'These two lines are not interchangeable. They don\'t display together well. Their vehicles and accessories don\'t cross over. Their collector communities overlap but don\'t fully coincide. Buying one because you like the other is the clearest path to a shelf that satisfies neither.' },
      { type: 'p', text: 'The collectors who are happiest in the Star Wars market tend to be ones who picked a lane. TVC because they want the full roster, the dioramas, the vehicles, and the carded display. Black Series because they want premium display pieces on a desk or shelf. Both because they\'re separate with a budget that accounts for both. What doesn\'t work is treating them as interchangeable options for the same shelf.' },
      { type: 'p', text: 'Before you spend anything above retail on the secondary market, pull comps on FigurePinner for the specific figure and version you\'re looking at. The sold data tells you what that exact release — not the character in general — has actually traded for. Both lines have a wide spread between figures that hold and figures that don\'t, and the difference is almost never obvious from the listing title alone.' },
    ],
  },

  {
    slug: 'power-rangers-lightning-collection-guide',
    title: 'Power Rangers Lightning Collection: Finally Treating Rangers Like Collector Figures',
    metaTitle: 'Power Rangers Lightning Collection Guide — Value and Exclusives | FigurePinner',
    metaDescription: 'Hasbro\'s Lightning Collection is the first Power Rangers line built for adult collectors. Here\'s how the exclusives work, what drives secondary market value, and how to navigate a deep catalog without overpaying.',
    dek: 'For 25 years, Power Rangers had no collector line. Then Hasbro showed up.',
    readingMinutes: 7,
    updated: '2026-06-17',
    body: [
      { type: 'p', text: 'For most of its run, Power Rangers action figures were built for kids in the toy aisle. Bandai America held the license and produced figures that got the job done: recognizable Rangers, reasonable articulation, affordable price. What they didn\'t produce was anything that felt like it was designed with an adult collector in mind. That changed when Hasbro acquired the global Power Rangers license and announced the Lightning Collection at Power Morphicon in 2018.' },
      { type: 'p', text: 'The Lightning Collection is the first Power Rangers line that plays by the rules collectors already knew from Marvel Legends and the Black Series. Six inches, 20-plus points of articulation, premium paint applications, character-accurate accessories, and a collector-focused distribution that includes dedicated exclusives. For the generation that watched Mighty Morphin Power Rangers on Saturday morning in 1993, this was the line they\'d been waiting for.' },

      { type: 'h2', text: 'What the line is and how it\'s structured' },
      { type: 'p', text: 'Each Lightning Collection figure stands at approximately 6 inches with a realistic body proportion rather than the exaggerated heroic sculpt of mass-market lines. Articulation is extensive — over 20 points — which lets these figures hold the action poses the franchise is known for. Accessories typically include interchangeable hands, character weapons, and often alternate effect parts or unmasked head sculpts on premium releases.' },
      { type: 'p', text: 'The line covers Rangers from across the entire franchise history — Mighty Morphin, Zeo, Turbo, In Space, Lost Galaxy, Lightspeed Rescue, Time Force, Wild Force, Ninja Storm, Dino Thunder, and beyond. That franchise breadth is part of the appeal and part of the challenge for new collectors. There are over a hundred figures and counting; picking a lane matters.' },
      { type: 'ul', items: [
        'Standard releases — core wave figures available at Target, Walmart, and general retail. These are the most accessible entry point.',
        'Two-packs — paired figures often tied to specific storylines or rival-hero matchups. Typically sold at specialty retail or direct from Hasbro Pulse.',
        'Hasbro Pulse exclusives — direct-purchase figures with smaller print runs and often premium accessories or variants not available in the mass-market release.',
        'GameStop exclusives — a retailer-exclusive tier that has included notable releases like color-swap 2-packs and the Lord Drakkon Helmet roleplay piece.',
        'SDCC and convention exclusives — the tightest print runs in the line; convention-floor distribution keeps quantities genuinely low.',
      ]},
      { type: 'callout', text: 'The exclusivity tier in the Lightning Collection is real, not marketing language. Hasbro Pulse exclusives and convention pieces print in meaningfully smaller quantities than standard wave figures. When they sell through, the secondary market price reflects genuine scarcity — not manufactured rarity, but actual limited production.' },

      { type: 'h2', text: 'What drives secondary market value' },
      { type: 'p', text: 'The Lightning Collection secondary market concentrates value in two places: specific Rangers who anchor the franchise\'s nostalgia core, and exclusive figures that didn\'t get wide retail distribution. Those two factors often overlap — a Hasbro Pulse exclusive of the original Mighty Morphin Pink Ranger hits both buttons at once, and figures like that have traded at 2x to 3x original retail on the secondary market once they\'re sold through.' },
      { type: 'p', text: 'Character demand in this line is deeply tied to the original Mighty Morphin season and the cast that defined the franchise for an entire generation. The five original Mighty Morphin Rangers, their villains (Rita Repulsa, Lord Zedd), and the Green/White Ranger transition arc carry the strongest secondary demand. Characters from later seasons — even popular ones — tend to hold closer to retail unless they\'re exclusive or part of a limited-quantity two-pack.' },
      { type: 'ul', items: [
        'Original Mighty Morphin Rangers — the core five (and six with Green Ranger) drive the strongest demand regardless of release format.',
        'Lord Drakkon — the fan-created villain from the comics; a collector-community grail that generated real secondary market heat on its releases. Pulse-exclusive Drakkon figures have regularly cleared $60–$100 secondhand when they\'ve been available.',
        'Ranger variants and evil Rangers — alternate deco versions of iconic Rangers (specifically the Black Dragon and evil variants from comics and crossover events).',
        'Exclusive two-packs with story-specific figures — the In Space Red vs. Astronema pairing and the S.P.D. B-Squad vs. A-Squad releases attracted collectors who wanted the narrative framing as part of the purchase.',
      ]},

      { type: 'h2', text: 'The completionist challenge' },
      { type: 'p', text: 'The Lightning Collection is a completionist\'s nightmare in the best possible way. The franchise history is enormous — 30-plus seasons of Rangers, hundreds of characters, and Hasbro has been committed to representing them across the line. A collector who decides to complete every Mighty Morphin figure faces a different task than one completing every Dino Thunder figure, and the secondary market pricing reflects that: Mighty Morphin completionists are competing with the largest pool of buyers.' },
      { type: 'p', text: 'The practical advice is to pick a team and define done. Collecting all five original Mighty Morphin Rangers plus their major villains is a coherent, achievable goal with strong display impact. Trying to build every season simultaneously is a budget event. The line keeps expanding; if you don\'t set a perimeter, you\'re always one wave behind.' },
      { type: 'callout', text: 'The Lightning Collection has a team-completion pull that\'s specific to the Rangers format — you need all five (or six) to feel done in a way Marvel Legends wave collecting doesn\'t require. That structural need drives demand for the weaker-market members of a team when collectors are completing a full roster. A figure that pegwarmed in isolation might be a floor-buy for someone who needs it to complete their team display.' },

      { type: 'h2', text: 'What to know before you buy on the secondary market' },
      { type: 'p', text: 'The Lightning Collection has been in production long enough that some early releases have meaningfully different secondary market prices than their original retail. If you missed a Hasbro Pulse exclusive from 2020, you\'re buying on the secondary market at whatever the current comp is — and for the right characters, that number can be well above original retail.' },
      { type: 'p', text: 'The category to be cautious about is standard wave figures that haven\'t been exclusive. These print in mass-market quantities and eventually come down to or below retail when retailers clear inventory. Paying a premium for a standard wave figure that simply hasn\'t been discounted yet is the mistake; at $24.99 retail, a standard wave Lightning Collection figure has no business going for $45 unless it has a specific reason to. The comp history will tell you whether a figure has ever traded above retail or has a pattern of sitting.' },
      { type: 'p', text: 'Pull the FigurePinner comps before committing to any above-retail price in this line. The Lightning Collection has enough releases and enough secondary market history that the comp data is meaningful — you can see whether you\'re buying a genuine scarcity at a fair price or paying early-adopter premium for a figure that will eventually be widely available.' },
    ],
  },

  {
    slug: 'hasbro-wwf-value-breakdown',
    title: 'Hasbro WWF Figures: The Complete Era Value Breakdown',
    metaTitle: 'Hasbro WWF Figure Value Guide — Series 1 Through 11 | FigurePinner',
    metaDescription: 'Eleven series, 99 figures, and a value spread from a few dollars to several hundred. The complete guide to which Hasbro WWF figures actually cost money, and why.',
    dek: 'Four inches of bright plastic and a spring-loaded gimmick. Some of them are worth grocery money. A few are worth a car payment.',
    readingMinutes: 8,
    updated: '2026-06-17',
    body: [
      { type: 'p', text: 'There is something specific about a Hasbro WWF figure. The colors are too bright. The proportions are slightly wrong. The action feature — the spring-loaded arm that makes Hulk Hogan throw a punch when you squeeze his legs — is the kind of feature no collector line would include today. And yet these figures, produced between 1990 and 1994, have a hold on a specific generation of wrestling fan that nothing made since has replicated. The people who owned them are in their 30s and 40s now, which is why the serious ones cost serious money.' },
      { type: 'p', text: 'Understanding the Hasbro WWF line means understanding that value is concentrated at the ends: the early series carry the iconic names, and the late series carry the scarcity. The middle is the affordable floor. Most collectors get burned by not knowing which end they\'re in.' },

      { type: 'h2', text: 'The line at a glance: 11 series, 99 figures' },
      { type: 'p', text: 'Hasbro produced 11 waves of WWF Real Wrestling Action figures from 1990 through 1994. The line totaled approximately 99 released figures across 86 single-carded releases, 5 tag team two-packs, and 3 mail-away bagged figures. Each figure stood about 4 inches and shipped with a unique action feature built into the body — squeeze the legs, press a button, flex the arms. No two figures had the same gimmick, which was the line\'s signature engineering choice and one of the reasons loose figures without their cards are immediately identifiable to collectors.' },
      { type: 'p', text: 'The cards changed color by series: Series 1 through 6 used neon blue, Series 7 switched to yellow, Series 8 to red, Series 9 to purple, Series 10 to a darker blue, and Series 11 used the rare green card that is now the most recognizable collector target in the line. Card color tells you era at a glance, which matters when you\'re evaluating a loose figure with no packaging context.' },
      { type: 'callout', text: 'The card is the fastest provenance signal in the Hasbro WWF line. A green card is a Series 11 figure — the scarcest series in the run. A neon blue card is Series 1 through 6 — the most common era, which is also where the biggest names lived. Blue card Hulk Hogan is accessible. Green card Billy Gunn is not.' },

      { type: 'h2', text: 'Series 1 through 6: big names, common floor' },
      { type: 'p', text: 'The first wave launched in 1990 with 12 figures covering the biggest names of the era: Hulk Hogan, Ultimate Warrior, Macho Man Randy Savage, Jake "The Snake" Roberts, Andre the Giant, and more. These were the superstars on WWF television every week, the ones kids recognized, and the ones parents would buy. The result was high production volume — these figures were ordered in large quantities because demand was enormous and Hasbro and WWF needed the first series to establish the line.' },
      { type: 'p', text: 'That volume is the reason most Series 1 through 6 loose figures remain affordable. Hulk Hogan is recognizable and nostalgic, but there are a lot of them. A loose Hogan in decent shape without his accessories is an inexpensive pickup at most collector sales. A complete, clean example with accessories is more interesting, and a mint-on-card example is a real purchase — but the figure\'s iconic status doesn\'t translate to scarcity because they printed millions.' },
      { type: 'ul', items: [
        'Hulk Hogan (Series 1) — the flagship, the nostalgia centerpiece, and widely available loose. MOC commands a premium; loose is the budget floor of the whole line.',
        'Ultimate Warrior (Series 1) — similar dynamics to Hogan: iconic, high production, affordable loose, meaningful MOC premium.',
        'Andre the Giant (Series 1) — slightly more interesting than other Series 1 figures because of figure size and the emotional weight of the character; still not scarce.',
        'Series 3 Sgt. Slaughter variant — a no-name-on-card variant believed to have seen very limited regional release; the kind of variant that exists at the far end of the collector obsession curve.',
      ]},

      { type: 'h2', text: 'Series 7 through 10: the middle ground' },
      { type: 'p', text: 'As the line moved into the mid-series years, two things changed: roster depth expanded into less iconic names, and production volumes started to reflect declining mass-market demand as wrestling TV struggled in the early 1990s before the Monday Night Wars reignited interest. Series 7 introduced first-time figures of Shawn Michaels, Owen Hart, and Razor Ramon — names that matter to a generation of fans but that weren\'t yet the household names they became.' },
      { type: 'p', text: 'These mid-run figures occupy an interesting space. They\'re not as scarce as Series 11, not as iconic-driver as Series 1 through 3, and they represent wrestlers who went on to define an era after this line ended. A first-time Shawn Michaels Hasbro figure carries the weight of what he became, even though it was made at a time when he was still on the rise. Collectors who track career trajectories pay attention to these.' },

      { type: 'h2', text: 'Series 11: the green card scarcity' },
      { type: 'p', text: 'Series 11 is where the real money lives, and the reason is simple: it was the last series produced before the line ended, and it shipped in meaningfully smaller quantities than the earlier waves. When a line is winding down, retailers order conservatively and distribution is uneven. The figures that were in Series 11 — Ludvig Borga, Crush, The 1-2-3 Kid (later X-Pac), and Billy and Bart Gunn — were never going to have the retail staying power of a Hulk Hogan.' },
      { type: 'p', text: 'The result is that mint-on-card Series 11 figures are among the most difficult finds in the entire Hasbro WWF run. The 1-2-3 Kid and Ludvig Borga in particular are treated as grail-level pieces by serious collectors of the line. Loose examples are more available but still command premiums relative to the rest of the series because the production totals were simply lower.' },
      { type: 'ul', items: [
        'Ludvig Borga — the Finnish villain who had a brief but memorable WWF run; one of the hardest Series 11 cards to find in clean condition.',
        '1-2-3 Kid — the figure that documented a legendary upset moment in WWF history; strong demand from fans of that era.',
        'Crush — the Kona Crush version from the 1993 heel turn; another short-run figure with collector demand.',
        'Billy and Bart Gunn (two-pack) — the tag team format means two figures, one card, and a lower production run than standard singles.',
      ]},

      { type: 'h2', text: 'The mail-away tier and the variants that matter' },
      { type: 'p', text: 'Three figures in the Hasbro WWF line were distributed exclusively as mail-away bagged figures: a red tank top Hulk Hogan, Bret "Hit Man" Hart, and The Undertaker. These were not available in stores — collectors sent in proof of purchase tokens from other Hasbro WWF products and received these figures directly from Hasbro. Because the barrier to entry required buying multiple other figures and completing the redemption process, the number of people who actually received them was smaller than the retailer run of any Series 1 through 11 figure.' },
      { type: 'p', text: 'The red tank top Hogan mail-away is the single most valuable figure in the Hasbro WWF line. It exists in smaller numbers than any other release, it documents a specific variant of the era\'s biggest star, and it is legitimately difficult to authenticate because the bagged packaging is fragile and rarely survives intact. Clean examples command prices that can leave regular Series 1 through 11 figures far behind.' },
      { type: 'callout', text: 'The mail-away figures are the authentication challenge of the Hasbro WWF line. Because they came in a bag rather than a blister card, "sealed" examples are genuinely rare. Ask for documentation, compare the plastic and paint to known examples, and cross-reference the comp history before you spend at mail-away premium prices.' },

      { type: 'h2', text: 'The condition question: what clean actually means here' },
      { type: 'p', text: 'These figures are 30 to 35 years old. A loose Hasbro WWF figure that shows no paint wear, has all its accessories, and retains tight joints is a different object than one with a faded tan, missing pieces, and a loose action feature. The spread between excellent loose and beat-up loose can be significant — and because these were children\'s figures designed to be played with, the beat-up version is far more common.' },
      { type: 'p', text: 'MOC collecting at this level requires patience and specificity. The card color tells you the series; the card condition tells you the grade. Bubbles can yellow and separate from the card over 30 years; the printing can fade; the card corners crush. A Series 11 green card figure in genuinely high-grade condition is a much rarer object than a Series 1 Hulk Hogan in the same grade, and the price gap reflects that.' },
      { type: 'p', text: 'For loose figures, condition assessment comes down to paint retention, accessory completeness, and joint tightness. The action features in these figures rely on internal springs that can weaken or break after 30 years. A figure whose gimmick no longer works is not the same collectible as one that functions — check before you buy.' },
      { type: 'callout', text: 'Accessories authenticate the figure. Each Hasbro WWF figure shipped with a character-specific accessory, and the loose figure market is full of examples missing their pieces. A Hulk Hogan without his belt, an Ultimate Warrior without his title, an Andre the Giant without his figure-appropriate accessories — these are incomplete, and buyers who know the line will price them accordingly. Learn the accessory list for the figure you\'re targeting before you pay complete-figure prices.' },

      { type: 'h2', text: 'Where to look for comps' },
      { type: 'p', text: 'The Hasbro WWF secondary market is active on eBay, with sold listings going back far enough to give you real price history on most figures. The spread between a poor example and a clean one is wider in this line than almost any other vintage wrestling release, because the age and the play-toy origin mean condition variation is enormous. Pull the comps on FigurePinner, filter by condition descriptor, and set a price target before you start bidding. A Series 11 MOC in clean condition is a different purchase decision than a loose Series 11 in played-with shape, and the sold data will show you exactly how much that difference costs.' },
    ],
  }

,

  {
    slug: 'marvel-legends-price-guide-2026',
    title: 'Marvel Legends Price Guide 2026: What Every Wave Is Actually Worth',
    metaTitle: 'Marvel Legends Price Guide 2026 — Current Values by Wave | FigurePinner',
    metaDescription: 'Sold-comp pricing on Marvel Legends from Toy Biz to today. BAF economics, Walgreens exclusives, HasLab values, and the figures actually worth hunting in 2026.',
    dek: 'Twelve years of Hasbro Marvel Legends has produced thousands of figures. Most are worth retail or less. A handful are worth real money. Here is which is which.',
    readingMinutes: 10,
    updated: '2026-06-18',
    body: [
      { type: 'p', text: 'Marvel Legends pricing splits cleanly into two eras and one uncomfortable truth. The Toy Biz era (2002-2006) produced some of the most articulated mass-market superhero figures ever made and a handful of genuinely scarce releases that now trade at multiples of original retail. The Hasbro era (2012-present) is enormous, well-distributed, and mostly priced within ten dollars of MSRP on the secondary market because Hasbro prints enough of everything to satisfy demand. The uncomfortable truth is that most Legends collectors overpay on the secondary market for figures that were simply at a store they did not visit.' },
      { type: 'p', text: 'MSRP hit $27.99 in September 2025, up from $24.99. That repricing shifted the entire secondary market calculus: figures that might have sold at $30-35 loose now face a different comparison against retail, and BAF waves where you need five or six figures to complete the build-a-figure are now $140-170 in new purchases. Understanding where secondary market prices sit relative to new retail matters in 2026 in a way it did not three years ago.' },

      { type: 'h2', text: 'Toy Biz era: the figures that actually cost money' },
      { type: 'p', text: 'The Toy Biz Marvel Legends run ended in 2006 when Hasbro acquired the license. In the years between, Toy Biz produced 14 standard waves plus the Legendary Riders series, Famous Covers, and specialty releases. The articulation was ahead of its time — 40+ points of articulation on figures that retail competitors were selling as 5-POA — and the character selection went deep. That combination created a collector base that never fully converted to Hasbro and still hunts the Toy Biz run specifically.' },
      { type: 'p', text: 'The rarest Toy Biz releases concentrate value in two places. The Series 6 Blue Variant Wasp — a running production change where a handful of cases shipped with a blue costume instead of the standard yellow — is the single highest-value variant in the Toy Biz run. Clean examples have sold above $3,500. The scarcity is real: it was a brief print run during a mid-wave change, and most collectors who got one either did not know what they had or opened it. Sealed examples are legitimately rare objects.' },
      { type: 'ul', items: [
        'Series 6 Blue Variant Wasp — $3,500+ sealed, $800-1,200 loose clean. The single highest-demand Toy Biz variant.',
        'Series 1 through 3 sealed cases — wave-complete sealed cases have sold in the $400-800 range depending on condition; individual sealed figures from the first waves command 3-4x original retail.',
        'Onslaught BAF (Series 8) — the first Hasbro-adjacent BAF transition period; complete assembled Onslaught figures have sold in the $180-350 range.',
        'Galactus (Famous Covers adjacent, 2004) — the 14-inch Galactus from the Legendary Riders era; assembled clean examples at $150-250.',
      ]},

      { type: 'h2', text: 'Hasbro BAF economics: the math nobody does before they start' },
      { type: 'p', text: 'The BAF — Build-A-Figure — is the structural mechanic that drives Hasbro wave purchasing. Each figure in a wave includes one piece of a larger figure; buy all six or seven figures in the wave and you can assemble a character that was never sold individually. This is smart product design and the reason collectors describe buying figures for the leg. You are not buying Shriek because you want Shriek. You are buying Shriek because the Zabu BAF is not complete without her piece.' },
      { type: 'p', text: 'The secondary market consequence is predictable. The most-wanted figure in a wave drives demand for the others. If collectors need every figure to complete the BAF, the weakest-wanted figure in the wave still has to move, so Hasbro has cover to include deeper-cut roster picks. And on the secondary market, BAF pieces trade individually — a missing piece is typically a 20-60% discount off the assembled figure price, with the head commanding the largest premium (often 50%+ of the total assembled value for popular BAFs).' },
      { type: 'callout', text: 'Before you buy a complete assembled BAF on the secondary market, price out the individual pieces. For many waves, buying the figures you want plus the specific BAF pieces you are missing from other sources comes out cheaper than buying an assembled BAF outright. The exception is when someone has already done this work and is selling a complete assembled figure at a discount to save you the assembly hassle.' },
      { type: 'p', text: 'The HasLab Sentinel is the most expensive single Marvel Legends release: a 24-inch jumbo figure that funded through Hasbro Pulse in 2021 at $349.99. Secondary market comps on complete Sentinels have settled around $480-680 depending on condition and whether all unlocked tiers are included. It is a significant purchase either way, which is exactly what HasLab is designed to be.' },

      { type: 'h2', text: 'Walgreens exclusives: the pharmacy problem' },
      { type: 'p', text: 'The Walgreens exclusive program for Marvel Legends began in 2015 and has since produced dozens of figures available only at Walgreens locations. In concept this is a reasonable retail exclusive arrangement. In practice it created shared trauma for an entire community. Walgreens does not distribute product evenly, does not restock predictably, and for several years had no online ordering option. Collectors hunting the original X-Factor Cyclops or the first Dazzler were at the mercy of which Walgreens near them happened to get the shipment.' },
      { type: 'p', text: 'The secondary market corrects for this distribution failure, which is why Walgreens exclusives that hit at the wrong time or in the wrong region can trade at 2-3x retail. The figures that command the largest premiums are the ones featuring characters with strong demand who had few or no other Legends releases at the time of the exclusive — characters where the Walgreens figure was the only option. A character with multiple Legends releases across different waves has secondary market price relief because collectors can choose which version to hunt.' },
      { type: 'ul', items: [
        'X-Factor Cyclops (2016) — the first major Walgreens exclusive to demonstrate the distribution problem; secondary market peaked well above retail, has come down somewhat as more Cyclops releases arrived.',
        'Dazzler (2017) — the roller-disco costume Dazzler is a specific character want for X-Men completionists and the only release of that costume at that scale; still commands a premium.',
        'Havok (X-Factor, 2018) — the black costume version; has sold consistently above retail since release because the character demand and the Walgreens friction combined.',
        "D'Spayre (2019) — lower character demand kept secondary market pricing closer to retail; demonstrates that not all Walgreens exclusives command a premium.",
      ]},

      { type: 'h2', text: 'Pulse exclusives and Fan Channel figures' },
      { type: 'p', text: 'Hasbro Pulse sells direct-to-collector exclusives and Fan Channel figures that do not go through standard retail. The Pulse exclusive model solves the scarcity problem by making figures available online, but creates its own version of collector anxiety: Fan Friday drops, bot-driven sell-outs, and the made-to-order vs. limited-run distinction that the community debates constantly. Made-to-order Pulse figures — produced to demand during a specified window — theoretically eliminate secondary market scarcity. In practice, the order window means collectors who miss it still have to pay secondary market prices.' },
      { type: 'p', text: 'The Pulse premium pricing (typically $34.99-44.99 versus $27.99 retail) also sets a higher floor for secondary market comparison. A Pulse exclusive that sells for $38 at retail has to be noticeably scarce or wanted to trade above $45 on the secondary market, because the markup over retail is already built in. Some do — SDCC and Fan Expo exclusives with specific convention-only packaging have their own collector premium beyond just the figure.' },

      { type: 'h2', text: 'The figures worth buying now and the ones to skip' },
      { type: 'p', text: 'The honest Legends secondary market assessment in 2026 is that most figures from 2018 forward are within $5-10 of original retail on the secondary market, and many older figures have been reissued or revisited enough that early-release premiums have compressed. The exceptions are figures with no reissue, strong character demand, and limited original distribution — that combination is rarer than collectors assume.' },
      { type: 'p', text: 'The Fin Fang Foom BAF wave (2007, first year of Hasbro) is the highest-value complete Hasbro wave. Assembled Fin Fang Foom figures have sold in the $265-400 range; the complete wave bought individually costs more than buying the assembled figure, which is unusual. The Series 6 Deadpool from the Toy Biz run — the first widely distributed Deadpool Legends figure — has sold in the $85-200 range for clean loose examples, and the character demand has not cooled.' },
      { type: 'callout', text: 'The fastest research move in Marvel Legends is checking whether a figure you want has been reissued, retooled, or re-released in a recent wave. Hasbro revisits popular characters regularly. If your target figure has a newer version at retail, the secondary market price on the older release will reflect that availability. If your target is the only Legends release of that character at that scale in that costume, the secondary market pricing will show the scarcity.' },
      { type: 'p', text: 'What I skip: any standard single-packed Hasbro figure from 2019 forward that is not a confirmed exclusive. These turn up at retail, go on clearance, and the secondary market premium almost never survives 18 months. The collectors paying $45 for a figure that retails at $27.99 and was widely distributed are going to see those comps compress. Pull the FigurePinner sold history before you buy — if the price trend is down over six months, wait.' },
    ],
  },

  {
    slug: 'most-valuable-wwe-elite-figures',
    title: 'Most Valuable WWE Elite Figures: The Resale Prices That Will Surprise You',
    metaTitle: 'Most Valuable WWE Elite Figures — Secondary Market Price Guide | FigurePinner',
    metaDescription: 'The WWE Elite figures worth real money on the secondary market. Ringside exclusives, convention variants, retired legends, and the True FX misses that somehow still command premiums.',
    dek: 'Mattel has been making Elite figures since 2010. Most are worth what you paid. A specific handful are worth a phone bill, a car payment, or more.',
    readingMinutes: 9,
    updated: '2026-06-18',
    body: [
      { type: 'p', text: 'The WWE Elite secondary market operates on two variables that do not always move together: character demand and distribution scarcity. A figure of a major star with wide retail distribution trades close to original retail because there are enough of them. A figure of a mid-card guy who got one Elite release and then had his rights lapse trades above retail because there is no other option. The overlap — a major star in a short-run exclusive format — is where the real money lives.' },
      { type: 'p', text: 'Mattel launched the Elite Collection in 2010 and the line has now exceeded 120 numbered waves plus a parallel track of Ringside Collectibles exclusives, Mattel Creations drops, Target exclusives, and convention-exclusive variants. Understanding which tier a figure came from is more important than the figure itself when assessing secondary market value.' },

      { type: 'h2', text: 'Ringside exclusives: the collector tier that actually holds value' },
      { type: 'p', text: 'Ringside Collectibles runs the exclusive program that produces the most consistently valuable WWE Elite variants. RSC exclusives are sold through ringsidecollectibles.com and at Ringside Fest, the annual convention that functions as the industry calendar event for wrestling figure collectors. Production on Ringside exclusives is deliberately limited — these are not mass-retail runs, and when they sell through, they are gone.' },
      { type: 'p', text: 'The figures that command the largest RSC premiums are attire-specific releases of major stars that cannot be replicated from the standard retail lineup. A specific entrance gear version of a Hall of Famer, or a championship-specific attire that only appeared in one match — these have no retail equivalent, and collectors who care about accuracy (which is everyone in this fandom) will pay secondary market prices rather than accept the retail version as a substitute.' },
      { type: 'ul', items: [
        'RSC-exclusive Attitude Era variants of Undertaker, Shawn Michaels, and Steve Austin — attire-specific releases that locked in a match or moment; consistently hold 1.5-2.5x original retail on the secondary market.',
        'Ringside Fest convention exclusives — sold in limited quantities at the event itself; figures that were never made available online or went up in very limited quantities post-event carry the highest premiums.',
        'Hall of Fame tribute editions — released in conjunction with the annual WWE Hall of Fame ceremony; character demand plus the ceremonial framing drives collector interest.',
      ]},

      { type: 'h2', text: 'Legends whose rights have lapsed' },
      { type: 'p', text: 'The most predictable value driver in WWE Elite is a legend whose talent agreement with WWE has ended, taking their likeness rights with it. When Mattel can no longer produce new figures of a performer, every existing Elite becomes the final version — there is no reissue coming, no updated sculpt, no new wave to satisfy demand. The secondary market prices the finality.' },
      { type: 'p', text: 'The names that generate the most activity in this category shift as talent relationships change. The pattern is consistent: an announcement that a legend is leaving WWE or a deal has not been renewed creates an immediate secondary market bump for their existing Elites. Collectors who have been watching the figure\'s comps and notice this correlation have a window before the broader market catches up. By the time it is widely discussed on r/wrestlefigs, the floor has already moved.' },
      { type: 'callout', text: 'The rights-lapse play is the most repeatable value opportunity in WWE Elite collecting. It requires knowing which performers are under what kind of agreements and watching the business side of wrestling as closely as the product side. Most collectors only watch the product side. The ones who watch both are consistently ahead on resale timing.' },

      { type: 'h2', text: 'True FX misfires that still sell: the strange economics of scarcity' },
      { type: 'p', text: 'Mattel introduced True FX face scanning technology around 2019, promising portrait accuracy that would finally make Elite figures look like the performers they depicted. The results have been inconsistent. A True FX miss — where the face scan produces something that looks vaguely like the person but with an expression that suggests mild food poisoning — has become a thread genre on its own. The community has documented the failures with forensic enthusiasm.' },
      { type: 'p', text: 'Here is the economics paradox: a True FX miss on a major star still sells, because the alternatives are older sculpts or nothing. A bad face scan of Becky Lynch is still the most accurate Becky Lynch figure available if it is the most recent one, and collectors who want their shelf to represent the current roster will buy it. The miss does suppress secondary market premiums — a widely-criticized True FX figure trades closer to retail than a well-received one — but it does not crater the market because there is no alternative product filling the same niche.' },

      { type: 'h2', text: 'The Target and Walmart exclusive tier' },
      { type: 'p', text: 'Major retailers run their own Elite exclusive programs, and the value dynamics differ meaningfully from Ringside. Target and Walmart exclusives are produced in larger quantities than RSC figures because they need to stock thousands of locations, but they are still not in the general retail planogram — they show up irregularly, ship to certain regions more heavily than others, and sell through at different speeds in different markets.' },
      { type: 'p', text: 'The Target Elite exclusives in the retro packaging — where current stars are presented on vintage-style packaging that references the classic Hasbro or LJN era — have been the most successful retail exclusive format of the last several years. The retro card is an additional collector argument beyond the figure itself: you are buying a figure AND a piece of nostalgic product design. These sell well at retail and hold their value better than standard-packaged exclusives of comparable figures.' },

      { type: 'h2', text: 'Which Elites are worth tracking right now' },
      { type: 'p', text: 'The figures generating secondary market activity in the current window are concentrated in a few categories. First-Elite releases of performers who have since become major stars — where the original figure was a mid-card buy at the time and is now the only Elite of a main-eventer. Attitude Era attire variants with licensing windows that look uncertain. And anything from the post-2020 period where a performer\'s exit from WWE came faster than collectors anticipated, leaving a small Elite footprint before the rights question became complicated.' },
      { type: 'p', text: 'The mistake is buying Elites of active main-eventers with wide retail distribution as investments. Cody Rhodes is getting Elites. Roman Reigns is getting Elites. The Rock returned and got Elites immediately. These are figures that will be reprinted and revisited as long as the performers are relevant to WWE programming, and the secondary market for the current wave version reflects that — you are not going to flip a standard retail Roman Reigns Elite for a meaningful premium when there are three other Roman Reigns Elites in production.' },
      { type: 'callout', text: 'The comp research move for WWE Elite is checking the figure\'s reissue history before you pay above retail. FigurePinner\'s sold-comp data shows whether a figure has a track record of holding value or compresses when the next version arrives. A figure\'s third or fourth release in a character\'s Elite history needs a specific argument for why this version is irreplaceable — attire accuracy, exclusive format, or lapsed rights — or the secondary market will not reward holding it.' },

      { type: 'h2', text: 'The BRG adjacent market: vintage comparison' },
      { type: 'p', text: 'Collectors deep enough into wrestling figures to be spending real money on Elites often have opinions about the LJN rubber figures and the Hasbro spring-action era. The comparison matters because it calibrates expectations. LJN Big Rubber Guys from the 1980s are a genuinely scarce collectible market — far fewer were produced, far fewer survived in collector condition, and the characters they cover are fixed by the era. The Elite market is permanently in production for as long as WWE programs.' },
      { type: 'p', text: 'That production permanence is the structural ceiling on WWE Elite values. No current Elite figure will ever be as scarce as a clean LJN André the Giant, because LJN stopped making figures decades ago and the production run is fixed. Elites can always theoretically be reissued. The exceptions are the situations described above: exclusives with defined production runs, rights-lapsed figures with no legal path to reissue, and figures from specific product lines that Mattel has discontinued. Those are the only Elites that develop genuinely fixed scarcity.' },
    ],
  },

  {
    slug: 'how-to-find-action-figure-values',
    title: 'How to Find What Your Action Figures Are Worth',
    metaTitle: 'Action Figure Sold Price Guide — How to Find What Yours Is Actually Worth | FigurePinner',
    metaDescription: 'An action figure sold price guide: the correct way to find what figures are actually worth. Why listed prices lie, why sold comps are the only number that matters, and where to find them.',
    dek: 'Listed prices are fiction. Sold prices are facts. Here is how to find the facts.',
    readingMinutes: 7,
    updated: '2026-06-18',
    body: [
      { type: 'p', text: 'The most common mistake in action figure valuation is looking at what figures are listed for rather than what they have actually sold for. These are different numbers, often by a large margin, and confusing them is how collectors end up overinsuring collections, making bad buy decisions, and getting taken at shows. The listed price is what a seller hopes to get. The sold price is what a buyer agreed to pay. Only one of those is real.' },

      { type: 'h2', text: 'Start with sold comps, not listings' },
      { type: 'p', text: 'eBay sold listings are the primary market data source for action figure values. Go to eBay, search for the figure, then filter to "Sold" listings. What you see is the actual transaction history — what real buyers paid for the same figure in the same condition in recent weeks. This is your comp data.' },
      { type: 'p', text: 'The reason to filter to sold rather than active listings is simple: anyone can list anything at any price. A figure listed at $500 that has not sold in 18 months is not worth $500. It is worth what someone will pay for it today, which the sold history will tell you. Active listings create anchoring bias — you see a high number and assume it reflects value. Sold listings puncture that assumption immediately.' },
      { type: 'callout', text: 'FigurePinner aggregates sold-comp data so you do not have to run this search manually for every figure you want to research. The sold history we surface is drawn from real transaction data and gives you a fast read on where a figure\'s market actually sits — not where sellers wish it did.' },

      { type: 'h2', text: 'The condition variables that change the number' },
      { type: 'p', text: 'Action figure values are not a single number. They are a range defined by condition, completeness, and packaging. The same figure can have a sold history that spans $15 to $150 depending on these variables, and mixing comp data across condition tiers is how you end up with a useless average.' },
      { type: 'p', text: 'The conditions that matter, in descending order of value: mint in sealed package (never opened, original packaging intact and undamaged); mint on card or mint in box (package opened but figure never removed, or condition clearly near-mint); complete loose with all accessories (figure removed from package but all accessories present and figure in excellent shape); loose without accessories (figure only, no packaging, no extras); played-with condition (paint wear, loose joints, missing pieces, visible play damage).' },
      { type: 'p', text: 'When you pull comps, filter to the condition you are actually researching. A mint-in-sealed-package comp has nothing to tell you about the value of a played-with loose figure. They are different objects with different markets. The mistake is taking the MOC number and applying it to your open loose figure, then being confused when no one will pay that price.' },

      { type: 'h2', text: 'What accessories actually do to value' },
      { type: 'p', text: 'Accessories are not afterthoughts. For many figures — particularly vintage lines — an accessory-complete example is worth meaningfully more than the same figure without its pieces. The spread can be 30-50% for figures from the Kenner, Hasbro, LJN, and similar eras where character-specific accessories were part of the product identity. A G.I. Joe figure without its weapons is an incomplete figure, and the secondary market prices it accordingly.' },
      { type: 'p', text: 'The accessory question matters most in vintage and specialty collector lines. For modern figures in mass-retail lines — a current Hasbro Marvel Legends, a recent WWE Elite — accessories are less central to the value calculation because the figure itself carries most of the appeal. But even here, a figure with all its accessories and the correct hands and swap-out parts is a cleaner object than one missing pieces, and the comp history will reflect it.' },

      { type: 'h2', text: 'Packaging condition for sealed and carded figures' },
      { type: 'p', text: 'If you are valuing carded or boxed figures, packaging condition is its own research problem. The package is part of the collectible. For vintage carded figures — think Kenner Star Wars, Hasbro WWF, LJN — the card can be worth as much as or more than the figure, and the card condition determines the ceiling on what the complete piece will sell for. Yellowed bubbles, bubble lift, crushed corners, sun fade, and price-tag residue all suppress value in ways that compound.' },
      { type: 'p', text: 'The collector shorthand for package grades runs from C-10 (absolute perfect) through C-6 (noticeable flaws but presentable) to lower grades that most serious buyers pass on for display-quality purchases. If you are trying to value a carded figure, pull comps specifically for that card grade. A C-9 vintage card is a different purchase than a C-7, and the comp history will show you the dollar difference.' },
      { type: 'callout', text: 'Professional grading through AFA (Action Figure Authority) adds a tamper-evident case and a standardized grade number that removes subjectivity from condition assessment. Graded figures sell for premiums in some lines — particularly high-value vintage pieces — because buyers trust the grade. Whether grading adds value on your specific figure depends on whether that figure\'s collector market relies on graded examples or prefers raw. Research the line before you pay to grade.' },

      { type: 'h2', text: 'How to read a price history' },
      { type: 'p', text: 'A single sold comp is data. Multiple comps over time are a trend. The trend is what you actually want to understand. A figure that sold for $120 six months ago and $80 last month is depreciating — something changed the market, whether a reissue, a character falling out of favor, or a surplus of supply hitting the market at once. A figure that sold for $40 a year ago and $95 last month is appreciating — demand is increasing faster than supply. These are different buying and selling decisions.' },
      { type: 'p', text: 'When I am evaluating whether to pay a secondary market price, I look at the last 10-15 sold comps and whether the average is going up, down, or flat. A flat average over 6 months with consistent volume means the market has found the price. A declining average means I wait. A rising average means I decide quickly or miss the window.' },

      { type: 'h2', text: 'What Google will and will not tell you' },
      { type: 'p', text: 'The first place most people go is a search engine, and the first results are price guide sites that publish static numbers. These guides are not useless — they can confirm a figure exists, tell you basic production information, and give you a rough tier — but they are lagging indicators at best. A price guide number from six months ago does not reflect what happened to the market after a character appeared in a streaming series, a figure got a wide-release reprint, or a rights situation changed. Static guides are the starting point, not the answer.' },
      { type: 'p', text: 'What Google will tell you: that a figure exists, what its production era was, whether it has variants, what the character looks like. What Google will not tell you: what someone paid for it last Tuesday. For the second question, you need transaction data, and that requires going to the source — sold listings on eBay and Whatnot, or databases like FigurePinner that aggregate that data so you can skip the manual search.' },

      { type: 'h2', text: 'The figure in front of you: a quick framework' },
      { type: 'p', text: 'When you have an unknown figure and need a fast valuation: identify the line and character first (manufacturer mark, copyright date, and character name on the figure or packaging), then search the sold history filtering for matching condition. If the figure is loose, note whether you have all accessories — if you do not know what accessories it came with, that is a separate research step. Compare your condition to the comps and set a range. The bottom of the range is a quick-sale price; the middle is a fair market price; the top is the premium end that requires the right buyer.' },
      { type: 'p', text: 'What makes a figure worth more than the comp average: better condition than the sold examples, accessories that are harder to find separately, original packaging in good shape, or a production variant (color, date stamp, country of origin) that the comps did not capture. What makes it worth less: condition below the sold examples, missing accessories, packaging damage, or a known reissue that has introduced supply to the market since the most recent comps.' },
      { type: 'callout', text: 'The fast move: search FigurePinner for the figure, check the sold-comp data, confirm your condition matches the comps you are looking at, and set your price. That sequence takes two minutes per figure and is more accurate than any static price guide for active collector lines.' },
    ],
  },

  // ─── Approved drafts merged 2026-06-19 (S37) — IDs 24, 25, 34 ───
  {
      slug: 'spawn-figures-guide',
      title: 'Spawn Figures: From McFarlane\'s 1994 Revolution to Today',
      metaTitle: 'Spawn Action Figures Collector Guide — Value, Series History | FigurePinner',
      metaDescription:
        'McFarlane\'s Spawn line didn\'t just make great figures — it created the adult-collector category. Here\'s the series history, what drives value, and where the market sits today.',
      dek: 'In 1994, Todd McFarlane sold 2.2 million Spawn figures in under three months. The hobby was never the same.',
      readingMinutes: 7,
      updated: '2026-06-19',
      body: [
        { type: 'p', text: 'Before Spawn, action figures were children\'s toys. They bent, broke, and got lost in the sofa cushions, designed for kids and priced for parents who weren\'t going to spend more than a Happy Meal cost. Todd McFarlane looked at that assumption in 1994 and ignored it. Series 1 shipped six figures, two vehicles, and a playset, packed in with actual comic books — not inserts, comics — and moved 2.2 million units in under three months. That number still makes most modern collector lines look quiet.' },
        { type: 'p', text: 'It proved a thing nobody had proven at retail price: adult collectors would pay up for better-made pieces, show up wave after wave, and build whole shelves around one property. Every premium line that came after — Marvel Legends, Black Series, NECA\'s deep cuts — is playing in a category Spawn opened.' },
  
        { type: 'h2', text: 'What made Series 1 different' },
        { type: 'p', text: 'The six figures in Series 1 — Spawn, Clown, Violator, Medieval Spawn, Tremor, and Chapel — were sculpted at a level the mass market had never seen at retail price. Articulation was secondary; presentation was the point. Each piece was packaged in hard clamshell plastic that held the figure away from the card, protecting the card itself and making the thing look like something to own, not something to play with on the carpet.' },
        { type: 'p', text: 'That design philosophy — protect the card, detail the sculpt, include a comic — communicated directly to adults. It said: this is yours. Collectors heard it loud. The Spawn line ran continuously for years, cycling through monster designs, angels, demons, movie tie-ins, and sport spawn variants across dozens of series. By the time the original run wound down, McFarlane Toys had become one of the largest toy manufacturers in the country.' },
        { type: 'callout', text: 'The template Spawn invented is now the industry default: premium retail price, clamshell packaging built to protect the card, accessories designed as display pieces instead of play features. The thing to know as a buyer is that this same packaging is now the line\'s biggest condition variable — see below.' },
  
        { type: 'h2', text: 'How the series run affects value today' },
        { type: 'p', text: 'The Spawn line produced figures across a long continuous run, with early series commanding the strongest premiums on the secondary market. Series 1 figures in sealed clamshell condition have aged well — that original six-figure cast, in box, draws consistent collector interest. But the comps are condition-dependent in a specific way: the hard plastic clamshell packaging yellows and cracks over time, and a yellowed or cracked bubble drops value substantially. Sealed, clear, and uncracked is the bar for a true MOC premium.' },
        { type: 'p', text: 'Mid-run series — roughly Series 5 through Series 15 — include some of the line\'s most visually extreme designs: the Curse of the Spawn figures, the Manga Spawn designs, the Movie Spawn tie-in. These attract variant hunters and horror-adjacent collectors. Values are more volatile in this range because the audience is narrower, but the pieces that connect land high when the right buyer shows up.' },
        { type: 'ul', items: [
          'Series 1 (1994) — the foundation. Six figures, original clamshell, comic included. Sealed and clear commands the strongest premiums.',
          'Series 5–15 — extreme sculpts, horror designs, movie variants. Niche buyers but passionate ones. Condition on the clamshell is the primary gate.',
          'Series 20+ — production ramped up, print runs increased, secondary values softer. The exception is figures tied to specific story arcs with narrower runs.',
          'Modern relaunch (2019–present) — McFarlane returned Spawn figures to retail. These are current production; they price at retail or slightly above on the secondary market with no vintage premium.',
        ]},
  
        { type: 'h2', text: 'The loose vs. sealed question for Spawn' },
        { type: 'p', text: 'The opener vs. MOC split feels different on Spawn than on most other lines. Part of what makes a Spawn Series 1 piece compelling as a shelf item is the original packaging — the clamshell design was intentional presentation art. An opener who removed the figure from that package has a great-looking piece of sculpture, but they\'ve given up something the format was designed to preserve.' },
        { type: 'p', text: 'That said, loose figures from early series in excellent condition find buyers too. Spawn figures were detail-painted and sculpted for display, not handled play. A Series 1 Violator in loose, complete condition with paint in solid shape is a compelling secondary-market pick. The MOC premium on early Spawn runs meaningfully higher than on many contemporaneous lines, but loose complete isn\'t worthless — it\'s a different buyer.' },
        { type: 'callout', text: 'The clamshell condition is the single biggest comp variable for sealed Spawn. Yellow, cracked, or crushed plastic cuts value significantly. If you\'re buying sealed, photograph the bubble from multiple angles before you commit.' },
  
        { type: 'h2', text: 'What drives the highest comps' },
        { type: 'p', text: 'The Spawn collector market runs on a few reliable value drivers. Original Series 1, sealed and clear, is the floor-setter — it\'s what most collectors think of first. But some of the strongest comps come from figures with narrower production: convention exclusives, retailer variants. The Spawn line had a long production history and a devoted collector base willing to pay for genuine scarcity.' },
        { type: 'p', text: 'Prototypes from the early Spawn run are legitimately rare and priced accordingly — these are collector-level items where provenance matters and documentation is expected. For collectors operating at standard secondary-market scale, early series in clean condition and comic-included state is the realistic sweet spot.' },
  
        { type: 'h2', text: 'Where the market is in 2026' },
        { type: 'p', text: 'The modern McFarlane Toys machine is still active and still making Spawn, which cuts both ways for the vintage market. New releases introduce new buyers to the character, and some of them chase the originals — a demand tailwind. But the same machine is the one r/McFarlaneFigures spends half its time complaining about: the chase-variant program, the platinum-edition lottery, the paint slop on a $20 retail figure. Todd is personally in that discourse, and "the company is the scalper now" is a take you will read on any given week. None of that touches a sealed 1994 Series 1 piece, but it shapes the mood collectors bring to the brand.' },
        { type: 'p', text: 'The secondary market for early Spawn is solid without being explosive. Series 1 prices have held at levels that reward patience and punish impulse. This is not the line where a newly discovered variant shocks the room or a convention chase sells out in ninety seconds — it is quiet and condition-driven. Which is exactly the kind of market where pulling the comp before you bid is the difference between a fair buy and overpaying for a yellowed bubble.' },
        { type: 'p', text: 'If you want to see what sealed Series 1 Spawn figures or mid-run condition pieces are actually selling for right now — not asking prices, sold comps — [[check FigurePinner|/]] for the current market data before you buy or price to sell.' },
      ],
    },
  
    {
      slug: 'mythic-legions-guide',
      title: 'Mythic Legions: Why Four Horsemen Figures Hold Value',
      metaTitle: 'Mythic Legions Collector Guide — Value, Waves, Scarcity | FigurePinner',
      metaDescription:
        'Mythic Legions from Four Horsemen Studios is modular, crowdfunded, and deliberately scarce. Here\'s why early waves hold value and how the collector-economics model works.',
      dek: 'Every wave closes. Every figure that sells out becomes a secondary-market piece. That\'s not an accident — it\'s the whole model.',
      readingMinutes: 7,
      updated: '2026-06-19',
      body: [
        { type: 'p', text: 'A mass-market line lives or dies on volume: the more units move, the happier the manufacturer, the retailer, and the licensor taking a cut. Four Horsemen Studios runs Mythic Legions on the inverse. They fund a wave through a crowdfunded pre-order campaign, produce to that funded count, and when the wave closes it closes. No restock, no reissue unless they explicitly announce one. The figure you slept on is gone, and the supply ceiling that got set in 2015 — or 2017, or 2019 — does not move.' },
        { type: 'p', text: 'That is why early-wave Mythic Legions appreciates instead of depreciating. It also comes with the tax every crowdfunded collector knows: these waves ship late. Twelve to eighteen months between "your card was charged" and "the box arrived" is normal for this line, and the backer forums have a decade of "where is my wave" threads to prove it. Collectors put up with it because the scarcity on the other end is real — but anyone telling you Mythic Legions is a frictionless hobby has never waited out a Store Horsemen production window.' },
  
        { type: 'h2', text: 'How the line started' },
        { type: 'p', text: 'Mythic Legions launched as a Kickstarter campaign in early 2015. The first wave funded around two dozen figures that expanded through stretch goals to roughly 34 unique figures plus weapons packs (exact counts vary by how you classify variants and weapons packs), and shipped to backers who had committed months before production. Four Horsemen Studios — the sculptors behind MOTU Classics and Matty Collector, among other high-profile lines — built the world from scratch: no license to manage, no character IP they didn\'t own. Knights, orcs, skeleton warriors, goblins, elves, demons. A complete fantasy universe in six-inch articulated form, with a modular parts system that made army-building and custom configurations genuinely addictive.' },
        { type: 'p', text: 'The line found its audience immediately. Collectors who had grown up with D&D, with MOTU, with fantasy illustration had been waiting for this kind of figure at this quality level at a price below the sixth-scale premium tier. Mythic Legions filled that space precisely.' },
  
        { type: 'h2', text: 'What makes these figures hold value' },
        { type: 'p', text: 'The value retention in Mythic Legions traces to three structural factors that don\'t show up in most modern lines.' },
        { type: 'ul', items: [
          'Hard supply ceiling — each wave is a closed production run, funded by the campaign. No reprint unless Four Horsemen explicitly announces it, and All-Stars reissue waves are communicated transparently so the market adjusts with information rather than surprise.',
          'Modular compatibility — figures share parts across waves. A head from 2015 fits a body from 2023. That interoperability keeps older figures relevant to active collectors building displays across multiple waves.',
          'No mass retail — Mythic Legions is not on Target pegs. No clearance, no overproduction signals, no price-to-move markdown pressure. Secondary market prices are not competing with a retail floor.',
          'Studio transparency — Four Horsemen publishes wave histories and All-Stars selections openly. Collectors trust the scarcity claims because the studio has a decade of consistent behavior to back them.',
        ]},
        { type: 'callout', text: 'The All-Stars waves are the clearest proof that scarcity here is managed, not manufactured. When Four Horsemen reissues a popular figure, they announce it. Collectors who bought at secondary-market prices on that figure absorb a temporary value hit — but the studio\'s transparency means they\'re not blindsided. That trust is part of what keeps the collector base loyal across years and campaigns.' },
  
        { type: 'h2', text: 'Wave history and the secondary market' },
        { type: 'p', text: 'The Mythic Legions 1.0 wave — the original 2015 Kickstarter campaign — is the early-series analog in this line. Figures from that first funding round that didn\'t appear in subsequent All-Stars reissues are the most reliably scarce. The Advent of Decay wave added the line\'s first female figures, and those hold strong secondary values because the character designs from that wave remain fan favorites years later.' },
        { type: 'p', text: 'Later waves added structural variety: the Coliseum wave introduced a new troll; Soul Spiller added an Ice Troll design that became a collector-favorite sculpt; Arethyr brought the first horses into the line. Each of these design firsts tends to hold value well because collectors who missed the wave and want the piece have exactly one option — the secondary market.' },
        { type: 'p', text: 'The line has continued through waves including Poxxus, Necronominus, Rising Sons, and Reign of the Beasts, with a 2026 Kickstarter for a roleplaying game extension also in the mix. Activity on the secondary market for recent waves is lighter because the initial campaign window is recent. The real premium shows on waves that shipped three or more years ago.' },
  
        { type: 'h2', text: 'Army building: why demand stays structurally high' },
        { type: 'p', text: 'One behavior specific to Mythic Legions collectors amplifies secondary demand: army building. The skeleton warriors, goblin soldiers, and human troopers in the line are designed to be bought in multiples. Collectors who want a display of a dozen skeletons need a dozen skeletons. That means demand for even troop-builder figures outpaces typical single-character demand, and a figure that looked abundant at wave close starts looking scarce once the army-builders have been through it.' },
        { type: 'p', text: 'Army-builder figures from sold-out waves are among the most reliably liquid secondary-market picks in the line. Not the grail money that a Wave 1 exclusive commands — but consistent volume at a premium over original price, because the demand driver doesn\'t go away.' },
  
        { type: 'h2', text: 'Getting into the line today' },
        { type: 'p', text: 'New collectors entering Mythic Legions in 2026 face a choice the original backers didn\'t: current campaign pricing vs. secondary market for older pieces. Campaign pricing runs at a meaningful discount to secondary market for popular figures. If a current wave interests you, backing at campaign is almost always the right call — you get the figure at production price and you take no secondary-market risk.' },
        { type: 'p', text: 'For older waves, the secondary market is the only path, and pricing reflects genuine scarcity. Do the comp work before committing to a Wave 1 or Advent of Decay piece. Know what the last five completed examples sold for, note the condition (boxes and original mailers are relevant here), and set your ceiling before you bid.' },
        { type: 'p', text: '[[FigurePinner|/]] tracks sold comps across collector lines to give you the actual market data before you buy or sell. Look up any Mythic Legions figure to see what recent sales actually say, not what the asking prices suggest.' },
      ],
    },
  
    {
      slug: 'ljn-wwf-value-guide',
      title: 'LJN WWF Figures: The Rubber Giants and What Clean Ones Cost',
      metaTitle: 'LJN WWF Wrestling Figures Value Guide — Condition & Pricing | FigurePinner',
      metaDescription:
        'LJN WWF Wrestling Superstars ran from 1984 to 1989 and built the Hulkamania generation\'s toy shelf. Condition is everything on these rubber figures — here\'s what drives value.',
      dek: 'Every LJN figure was played with hard. The clean ones are genuinely scarce now, and the market knows it.',
      readingMinutes: 7,
      updated: '2026-06-19',
      body: [
        { type: 'p', text: 'Picture a Saturday morning in 1985. Hulk Hogan is on every television set in America, Hulkamania is the dominant cultural force in professional wrestling, and the eight-inch rubber figure of the Hulkster is the toy every kid wanted on the shelf. LJN\'s WWF Wrestling Superstars line was the toy aisle analog to a Monday Night Main Event. Stiff, heavy, rubber-solid, and built for the kind of play that put every accessory in a different zip code.' },
        { type: 'p', text: 'That durability is a double-edged legacy. These figures survived because the rubber held up. They also wore, scratched, painted over with markers, and lost whatever accessories they came with before the first Christmas was over. Forty years later, the survivors that came through childhood with their paint intact and their details readable are the ones the market prices seriously. A beat-up LJN is a common shelf item. A clean one is a different conversation.' },
  
        { type: 'h2', text: 'The production run: 1984 to 1989' },
        { type: 'p', text: 'LJN signed a licensing agreement with the WWF in July 1984, and the line ran continuously until 1989. The figures shipped in multiple series over that window, roughly tracking the WWF\'s expansion from regional northeastern promotion to national television phenomenon. The roster grew to match — by the time the line ended, it covered the major stars of the golden era, from the original Series 1 headliners through mid-line additions as the roster evolved.' },
        { type: 'p', text: 'The production detail that drives the biggest premiums sits at the very end of the run. The final LJN release — Series 6, the Black Card Series — came on black backing cards instead of the standard yellow, and was actually manufactured by Grand Toys in Canada, not LJN. It mixed repackaged stars with genuinely new sculpts: the first LJN Ultimate Warrior, Big Bossman, Haku, and Warlord all debuted here. Crucially, it shipped to Canadian retail and US mail-order only, never hitting American store pegs — which is why clean black card examples are dramatically scarcer than their yellow-card equivalents.' },
        { type: 'callout', text: 'If you see an LJN figure on a black card, you are looking at the toughest find in the line. Series 6 had a fraction of the distribution of the main run, and the comps on clean black card pieces run well above the same wrestler in standard yellow-card packaging. Verify it\'s a genuine Grand Toys black card and not a reproduction before you pay the premium.' },
  
        { type: 'h2', text: 'Why condition is the entire story' },
        { type: 'p', text: 'Most vintage figure lines have condition as a major pricing factor. LJN takes it further — condition is essentially the only pricing factor for common figures, because figures in played-with state are widely available. The paint wear issue is structural: rubber absorbs impact differently than hard plastic, and the raised detail areas — faces, knee pads, belts, trunk text — were the first things to go with any handling. A Hulk Hogan LJN with readable face paint, intact trunk lettering, and solid color is not abundant. Most of them aren\'t.' },
        { type: 'ul', items: [
          'Paint-worn with rubbing on face and details — the most common grade. Typically prices at the floor of recent comps. These are the figures you find at flea markets and estate sales.',
          'Good shape with minor wear — decent face paint, most details readable, some age-appropriate softness on the rubber. The middle of the market for common figures.',
          'Excellent/near-mint paint — faces sharp, color solid, details intact. Meaningfully rarer and prices considerably above the worn grade.',
          'MOC (still on card) — the top of the market. LJN cards were retail blister cards not designed for preservation. Sealed examples have diminishing supply every year.',
        ]},
        { type: 'p', text: 'For collector-grade LJN figures, condition grading is everything. A Hulk Hogan in excellent paint in loose condition is a genuinely different comp category than the same figure in faded, rubbed shape, even though they\'re technically "the same figure." The data supports pricing them separately — and if you\'re selling, failing to document your figure\'s condition honestly is the fastest way to leave money on the table or generate a return dispute.' },
  
        { type: 'h2', text: 'Who drives the most value' },
        { type: 'p', text: 'The Hulkamania figure is the baseline everyone knows — Hulk Hogan in excellent painted condition draws consistent attention and the nostalgia driver here is enormous. The audience for this figure is the generation that watched Hogan at WrestleMania and wanted that figure under the Christmas tree. Those collectors are adults now with adult budgets, and their interest in clean Hogan LJNs is durable.' },
        { type: 'p', text: 'Andre the Giant is the other name that commands serious comp attention. The Andre figure was scaled properly larger than the rest of the line, and that physical presence plus WrestleMania III nostalgia keeps clean examples moving consistently. He is the figure most likely to anchor a collection next to Hogan.' },
        { type: 'p', text: 'Beyond the two headliners, value tracks the era\'s card logic: the bigger the name on the Saturday morning promos, the bigger the collector interest now. Macho Man Randy Savage, Rowdy Roddy Piper, and the Iron Sheik all draw real comp attention in clean condition. The Ultimate Warrior is a special case — his LJN debut came on the 1989 black card rather than the main yellow-card run, so a clean Warrior is chasing the scarcer Series 6 supply from the start, and the comps reflect it.' },
  
        { type: 'h2', text: 'The accessories question' },
        { type: 'p', text: 'LJN figures were not particularly accessory-heavy compared to later wrestling figure generations. Most came without accessories, save for a few that shipped with hats, canes, or entrance gear. But the figures that did come with accessories — and that still have them — are in a meaningfully better position at comp time. A figure that originally came with an entrance item and still has it is a complete example; the same figure without it is incomplete, even if the paint is excellent.' },
        { type: 'p', text: 'The completeness gap on LJN is smaller than on, say, a Mattel Elite with five accessories and a title belt. But it exists, and buyers paying top dollar for condition are going to ask. Know what your figure originally came with before you price it.' },
  
        { type: 'h2', text: 'What the secondary market looks like in 2026' },
        { type: 'p', text: 'LJN WWF is a stable, well-established secondary market with a loyal collector base and consistent eBay volume. It is not a line where a newly discovered variant shocks the market or a championship run triggers price spikes — it is quiet, data-driven, and condition-dependent. The Hulkamania generation\'s nostalgia for this line is reliable and isn\'t diminishing.' },
        { type: 'p', text: 'If you\'re buying LJN, the single most important move before committing to a price is pulling recent sold comps for that specific figure in that specific condition grade. The spread between a rough example and a clean one is significant enough that pricing by feel — or off the asking-price wall — will cost you real money in either direction. The data is there; use it.' },
        { type: 'p', text: '[[FigurePinner|/]] shows you LJN sold comps in real time so you can see what clean examples actually sell for before you negotiate. Look up any figure from the line and you\'ll have the sold-price data that the asking-price listings obscure.' },
      ],
    },

  // ─── McFarlane Sports Picks — S38 2026-06-20 ───
  {
    slug: 'mcfarlane-sports-picks-guide',
    title: 'McFarlane Sports Picks: The Variant Game Behind Every Figure',
    metaTitle: 'McFarlane Sports Picks Value Guide — Variants, Chases & Secondary Market | FigurePinner',
    metaDescription: 'McFarlane Sports Picks ran from 2001 to 2012 across NFL, MLB, NBA, NHL, and NASCAR. The line\'s entire secondary market runs on variants — here\'s how to read them.',
    dek: 'The base figure is the floor. The white jersey, the gold uniform, the chase variant you didn\'t know existed — that\'s where the real money is.',
    readingMinutes: 8,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'McFarlane Toys launched Sports Picks in 2001 with an NFL Series 1 that looked like nothing else in the sports collectible aisle. Six-inch figures with 12-plus points of articulation, game-accurate uniforms, sculpted face likenesses, and a retail price around $12.99. Not action figures in the child-toy sense — display pieces in the McFarlane tradition, just wearing jerseys instead of capes. They sold.' },
      { type: 'p', text: 'The line expanded quickly: MLB followed in 2002, NBA and NHL in 2003, NASCAR in 2004. At peak production McFarlane was running parallel series in five sports simultaneously, dropping multiple waves per year. The entire run ended around 2012 when the company shifted focus to DC Multiverse and other licenses. Eleven years of production across five sports left an enormous catalog — and buried inside that catalog is a variant structure that functions like a second, hidden product line that most casual buyers never found.' },

      { type: 'h2', text: 'How the variant system worked' },
      { type: 'p', text: 'Every Sports Picks series included variants — alternate versions of figures in the wave that shipped in reduced quantities. The mechanism changed across the line\'s run. Some variants swapped jersey color: a player whose team had alternate road uniforms, a throwback colorway, a home-vs-away split. Others changed equipment: different helmet decals, alternate glove colors, wristband presence or absence. A small tier — the true chases — were painted in a sepia or gold monochrome, deliberately scarce, and inserted into cases at ratios as low as 1-in-6 or lower.' },
      { type: 'p', text: 'The ratio is what drives the secondary market. A standard NFL Series 1 figure retailed at $12.99 and moved in predictable volume. The white jersey alternate of the same figure shipped in roughly a third of the cases. The gold chase variant of that same figure might have appeared once every two or three cases. Three versions of the same sculpt, three completely different secondary market prices.' },
      { type: 'callout', text: 'Cardboardconnection maintains variant guides for NFL (through Series 32) and MLB (through Series 31) that document every known variant, the case ratio where documented, and the jersey or paint change involved. Before you price any Sports Picks figure, verify whether a variant exists for that specific player in that wave — the difference between the base and the chase can be $15 vs. $95 on the same sculpt.' },

      { type: 'h2', text: 'What actually holds value in 2026' },
      { type: 'p', text: 'Sports Picks secondary market pricing runs on two variables that interact: player legacy and variant scarcity. A common-ratio figure of a retired journeyman is worth five dollars. A gold chase variant of a Hall of Famer from an early series is a different conversation.' },
      { type: 'ul', items: [
        'Early NFL series (1–6) — the first runs of iconic players before the variant print-run system was fully understood by the collector market. Sealed examples of chase variants from these waves carry the strongest premiums.',
        'MLB gold/sepia chases — Baseball figures with the monochrome chase deco. A Babe Ruth sepia chase has moved at $58; comparable base figures sit under $20.',
        'White jersey NFL variants — Road uniform alternates for marquee players. Randy Moss white jersey has sold around $95; base version under $20. Same sculpt, different case ratio, completely different comp.',
        'Rookie series figures of players who became stars — the year-1 Sports Picks of a player who won multiple championships afterward. These weren\'t scarce at release; they became scarce as interest concentrated.',
      ]},

      { type: 'h2', text: 'The sports licensing expiration problem' },
      { type: 'p', text: 'Sports figures carry a licensing risk structure that action figure collectors don\'t always account for. A McFarlane NFL figure requires two separate licenses: the NFL (the league) and the NFLPA (the players\' association). Lose either one and the figure stops being producible. The Sports Picks line ended in part because managing those dual-license costs across five sports simultaneously became economically untenable at the margins the line was generating.' },
      { type: 'p', text: 'This creates a collector dynamic similar to NECA\'s horror licenses, but with an additional layer: player likeness rights can complicate reissue possibilities independent of the line ending. A McFarlane figure of a player in a contested-rights situation is as final as it gets. The molds exist. The license doesn\'t.' },

      { type: 'h2', text: 'The condition variables nobody talks about' },
      { type: 'p', text: 'Sports Picks figures shipped in blister clamshell packaging similar to the Spawn line — designed for display, not archival preservation over two decades. The clamshell yellows. The card stock fades. A sealed Sports Picks figure from 2001 that sat near a window for ten years is not a mint sealed figure. Photo the clamshell from multiple angles before you commit.' },
      { type: 'p', text: 'Loose figures have their own hierarchy. The face paint on the sculpted likenesses is the most vulnerable detail — these portraits were painted at a $12.99 price point, not museum-quality. A figure with a sharp portrait is worth examining carefully. One with smeared or sunken face paint looks wrong on the shelf. Paint quality on the jersey details — the nameplate lettering, the number application — varies more in this line than in McFarlane\'s superhero work because the retail price demanded cost compression somewhere, and the portrait was usually not where they cut it.' },

      { type: 'h2', text: 'How to research before you buy' },
      { type: 'p', text: 'The research workflow is different here than for a typical action figure. Step one is always the variant guide for the sport and series — know whether a variant exists before you price the figure in front of you. A seller who doesn\'t know they have the white jersey variant is pricing at the base comp. That information asymmetry is where buyers who do the research win.' },
      { type: 'p', text: 'Step two is the comp data: what actually sold recently for that player, that series, that variant, in that condition. Sports Picks secondary market isn\'t always liquid. Some figures take weeks to find a comp. When the comp data is thin, the asking price wall is even less trustworthy than usual — sellers routinely anchor on guide-site numbers from 2015 that bear no relationship to what\'s actually moving.' },
      { type: 'callout', text: 'FigurePinner tracks sold comps on Sports Picks figures alongside the rest of the catalog. Pull the data before you commit to any price — the gap between asking and sold on vintage Sports Picks is wider than almost any other market on this site.' },

      { type: 'h2', text: 'Which sport to focus on' },
      { type: 'p', text: 'NFL is the most active secondary market by volume — enormous figure library, broad fan base, current comps. MLB has the deepest variant documentation and some of the line\'s most specific chases. NBA is thinner; the basketball collector figure market has consolidated around newer product. NHL is genuinely niche — the hockey Sports Picks collector is a specific person and there are fewer of them. NASCAR ended early in the run and is the most specialized market of the five.' },
      { type: 'p', text: 'Start with NFL or MLB, early series, know your variant ratios. The chase is the target — but verify the comp data before paying a premium off a guide number that hasn\'t been updated since Obama was in office.' },
    ],
  },


  {

    slug: 'marvel-legends-hub',
    title: 'Marvel Legends Price Guide: 938 Characters, 125 Waves, and What They Actually Cost',
    metaTitle: 'Marvel Legends Price Guide 2026 — Every Wave, BAF & Value | FigurePinner',
    metaDescription: 'Marvel Legends price guide covering 1,622 figures across 125 waves. Most valuable figures, BAF wave breakdowns, and real eBay sold comps — updated 2026.',
    dek: '1,622 releases. 938 characters. One Terrax leg that nobody wanted. Here is what the line actually costs right now.',
    readingMinutes: 12,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'Hasbro has been running Marvel Legends continuously since 2007 — long enough that the line has its own internal archaeology. The Toy Biz era before it (2002–2007) is a separate conversation about better articulation and worse paint at lower prices. The Hasbro era has 125 distinct waves in the FigurePinner database, 938 unique characters, and 1,622 individual releases. If you are trying to figure out what any of it is worth, the honest answer is: it depends heavily on which wave, which character, and whether the secondary market has moved on.' },
      { type: 'p', text: 'What follows is the actual pricing structure across the line — not a list of every figure, which would be useless, but the wave categories that drive secondary market behavior and the specific factors that separate a $12 peg-warmer from a $90 grail.' },

      { type: 'h2', text: 'How Marvel Legends pricing works' },
      { type: 'p', text: 'The baseline is retail: Hasbro has moved ML pricing from $19.99 in 2019 to $27.99–$29.99 as of 2025, with some Deluxe and HasLab figures in separate tiers. The secondary market divides into three zones. Below retail means nobody wanted it — Spider-Man repaint territory, common wave anchors, pegwarmers that show up on clearance at $12. At-retail or slight premium means normal demand, solid wave members, characters with fanbases that aren\'t massive. Above retail starts at $40 and can run to $200+ for genuinely scarce figures with large fanbases and no reissue in sight.' },
      { type: 'p', text: 'The BAF (Build-A-Figure) changes wave economics. Every figure in the wave carries a piece; the completed BAF only exists if you buy the entire wave — or find the piece separately. This is why wave members move at different prices. The wave anchor (the character everybody wants) and the BAF piece everybody needs hold value; the filler characters sell at discount for the piece. "I only bought him for the leg" is not a joke. It is a description of how people shop Marvel Legends.' },

      { type: 'h2', text: 'Most valuable Marvel Legends figures right now' },
      { type: 'p', text: 'The highest secondary market values cluster in three categories: early Toy Biz runs, Walgreens exclusives from 2014–2021, and made-to-order Pulse exclusives with limited windows.' },
      { type: 'ul', items: [
        'Walgreens exclusives (X-Men run, 2015–2021) — Dazzler, Multiple Man, Strong Guy, Psylocke, Gambit, and the entire core X-Men locked to a pharmacy chain. FigurePinner sold comps show these averaging $45–$95 depending on the figure. Gambit regularly clears $70 loose. Strong Guy hits $80–$110 in the window before a reissue is announced.',
        'Toy Biz Series 1–8 (2002–2006) — the original run before Hasbro. Series 1 Hulk in original packaging has moved above $120. These are genuinely old at this point; QC is not the Hasbro standard, but articulation depth is better than anything Hasbro shipped before 2021.',
        'HasLab Sentinel (2021) — $395 retail, funded at roughly 18,000 backers. Loose secondary market has stabilized around $280–$350 because the price anchor of the original makes anything below $250 feel like a deal even though it is still more money than three standard waves.',
        'Galactus BAF (2022) — the 32-inch HasLab Galactus remains the ceiling for the line in secondary market pricing. Funded examples in original box have sold above $500. It is the largest Marvel Legends figure produced.',
        'Deadpool wave figures with low print runs — certain Deadpool Corps figures from the 2016 wave that shipped in small cases have held $55–$85 loose because the demand for Deadpool variants across any format is inelastic.',
      ]},

      { type: 'h2', text: 'The Walgreens exclusive problem' },
      { type: 'p', text: 'The Walgreens exclusive era (roughly 2014–2021) left a specific scar on the Marvel Legends community that is worth understanding before you buy in that segment. Hasbro locked essential X-Men to a pharmacy distribution chain with inconsistent stock allocation, no online ordering option, and a chase-the-store hunting model that had collectors driving to six Walgreens locations to find a single Gambit. The figures themselves were frequently excellent — some of the best X-Men sculpts Hasbro produced in that period. The distribution was deliberately hostile, either by design or negligence.' },
      { type: 'p', text: 'The secondary market premium on Walgreens exclusives is not entirely about the figure quality. Some of it is paying for the hours of hunting someone else did. When Hasbro eventually released certain characters through other channels — Pulse exclusives, reissues — the prices on the originals dropped significantly. Strong Guy went from $110 to $55 within three months of a reissue announcement in 2023. If you are paying a large premium on a Walgreens exclusive, factor in the reissue risk.' },

      { type: 'h2', text: 'BAF wave breakdown: which waves hold value' },
      { type: 'p', text: 'The FigurePinner database covers 125 wave variants. Not all BAFs are equal. The factors that make a BAF wave hold secondary market value: the BAF character matters to collectors (Sentinel, Galactus, Sasquatch, Warlock — strong; generic Abomination repaint — not), the wave members include roster-demanded characters, and the wave has not been reissued.' },
      { type: 'p', text: 'The Terrax wave (2012) is the canonical example of a BAF that launched a secondary market career. Hope Summers was in that wave. So was Ghost Rider, Klaw, and Constrictor. The wave has never been reissued in its original form. Hope Summers sold comps in the FigurePinner database show a range of $12–$40 with a median around $27 — roughly 35% above the original $19.99 retail after fourteen years. The Terrax BAF itself moves between $45 and $80 for a complete assembled figure.' },
      { type: 'p', text: 'Waves worth tracking for current value: the X-Men 60th Anniversary wave (2023) because it included deep-cut characters with no prior ML releases; the Galactus HasLab wave members because they are linked to a funded collectible; any wave from 2014–2018 that included Walgreens-adjacent characters who were later not reissued.' },

      { type: 'h2', text: 'The Spider-Man repaint economy' },
      { type: 'p', text: 'Spider-Man has 24 distinct Marvel Legends releases in the FigurePinner database. Iron Man has 24. Captain America has 19. This is not an accident — Hasbro knows these characters move cases. The secondary market consequence is that most Spider-Man Legends are worth retail or below, because the supply is constant and the demand, while large, is matched to it. The exceptions are specific variants: the Pizza Spider-Man (Retro Kenner wave, 2022) moved above retail because the costume is specific and the nostalgia is precise. The black-suit version from the same wave did similarly. The "yet another classic red-and-blue with pinless hips" does not.' },
      { type: 'callout', text: 'FigurePinner tracks 24 Spider-Man ML releases. Pull the sold comps before buying any Spidey variant — the spread between the $10 peg-warmer version and the $55 Retro variant is entirely about which specific release you have, and they can look similar in a pile.' },

      { type: 'h2', text: 'Exclusives: Pulse vs. retail vs. HasLab' },
      { type: 'p', text: 'Hasbro Fan Channel (Pulse) exclusives moved the distribution model for collector-targeted ML figures starting around 2018. Made-to-order windows: Hasbro opens a preorder period, ships to everyone who ordered, closes production. No hunting, no scalping in theory. The secondary market effect is that Pulse exclusives from closed windows have reliable supply caps — once the preorder closed, no more were made. Prices on these hold better long-term than retail waves because you cannot walk into Target and find one on a Tuesday.' },
      { type: 'p', text: 'The debate in the ML community is whether Pulse exclusives killed the hunt or killed scalping. The answer is both, partially. Pulse Fan Friday reveals still sell out in minutes to bots. The made-to-order window system mitigates this more effectively — it is why Hasbro has leaned toward MTO for premium figures. If you are buying a Pulse MTO exclusive on the secondary market, you are paying a premium above what anyone paid at preorder pricing, which is already above retail wave pricing. Factor that in.' },

      { type: 'h2', text: 'What pinless means for value' },
      { type: 'p', text: 'Hasbro introduced pinless articulation across ML starting around 2021 — no visible pins at the elbows and knees, cleaner aesthetic. The community called it pinless. Hasbro called it an improvement. Whether it is depends on the figure: some joints are smoother and look better; some are loose and floppy within six months of opening. Pinless figures from 2021–2023 have a specific QC issue with thigh swivel durability that shows up in reviews but not in box photography.' },
      { type: 'p', text: 'For secondary market purposes, pinless is a mixed signal. Early pinless figures in good condition hold value well because they photograph better. Pinless figures with known joint issues lose secondary market interest faster than their pre-pinless equivalents, because "loose joints on an opened figure" is not a selling point. If you are buying loose pinless ML figures from 2021–2023, check the hips and thighs before you close the deal.' },

      { type: 'h2', text: 'The Toy Biz era: should you buy it in 2026' },
      { type: 'p', text: 'Toy Biz ran Marvel Legends from Series 1 (2002) through Series 15 and various themed waves before Hasbro took the license in 2007. The articulation on Toy Biz figures — up to 38 points on some releases — has not been matched by Hasbro in the standard retail tier. The paint and sculpt quality were inconsistent because the price point demanded cost compression. The result is figures that pose better than almost anything Hasbro has shipped, in paint apps that sometimes look rough by modern standards.' },
      { type: 'p', text: 'Secondary market pricing on Toy Biz is stable and has been for years. Series 1–4 in original carded packaging move between $45 and $150 depending on character. Loose examples of common characters are cheap — $8–$15 on most Series 5–10 figures. The premium is concentrated in first-release characters (Hulk, Iron Man, Captain America from Series 1) and in complete-with-all-accessories examples of figures that shipped with complex accessory loads. Old heads still rate Toy Biz articulation above Hasbro; if you are building a collection to pose and photograph, that argument has data behind it.' },

      { type: 'h2', text: 'How to check any figure\'s current price' },
      { type: 'p', text: 'The right methodology is eBay sold comps, not asking prices. The asking price wall on Marvel Legends is set by people who looked at a guide number from 2022 or who are testing the market at optimism pricing. What actually matters is what sold in the last 90 days, in what condition, and at what price. The spread between asking and sold on ML is regularly 40–60% on figures that have been sitting.' },
      { type: 'p', text: '[[FigurePinner|/]] aggregates eBay sold data for all 1,622 Marvel Legends releases in the database. Search any character or wave, see the actual sold median, and make decisions off what the market cleared rather than what sellers wish it would clear. The Terrax wave, the Walgreens exclusives, the Pulse MTO figures — all in there.' },

      { type: 'h2', text: 'Further reading' },
      { type: 'ul', items: [
        '[[Marvel Legends Price Guide 2026: What Every Wave Is Actually Worth|/guides/marvel-legends-price-guide-2026]] — wave-by-wave breakdown with specific comp data',
        '[[Marvel Legends: Where to Begin|/guides/marvel-legends-where-to-begin]] — entry point for new collectors choosing a first wave',
        '[[Hope Summers Marvel Legends: The Mutant Messiah Figure You Probably Overpaid For|/guides/hope-summers-marvel-legends-figure-guide]] — Terrax wave deep-dive',
        '[[Completing a Wave: The Completionist\'s Guide (and the BAF Trap)|/guides/completing-a-wave-completionist-guide]] — why the BAF math works against you',
      ]},
    ],
  }

  ,{
    slug: 'jakks-hub',
    title: 'Jakks Pacific WWE: A Collector\'s Guide to the Classic Superstars & Ruthless Aggression Years',
    metaTitle: 'Jakks WWE Figures Price Guide 2026 — Classic Superstars & Ruthless Aggression | FigurePinner',
    metaDescription: 'A collector\'s guide to Jakks Pacific WWE figures (1996-2009) — Classic Superstars legends, the Ruthless Aggression action era, the ToyFare grails, and real eBay sold comps.',
    dek: 'Jakks ran WWE figures from 1996 to 2009 — the Classic Superstars legends and the Ruthless Aggression action era. A collector\'s field guide to both.',
    readingMinutes: 9,
    updated: '2026-06-21',
    body: [
      { type: 'p', text: "Before Mattel took the WWE figure license in 2010, Jakks Pacific made them -- from 1996 all the way through 2009. The Jakks era splits cleanly in two: the Classic Superstars line, high-end legend sculpts that collectors treat as sacred, and Ruthless Aggression, the gimmick-driven action mainline that ran the Attitude-era and post-Attitude pegs. This is a collector's guide to both eras." },
      { type: 'h2', text: 'Classic Superstars: the sacred line' },
      { type: 'p', text: "Classic Superstars launched in 2004 and ran to 2009 -- high-end sculpts of WWF/WWE legends that became an instant fan favorite and the most revered line of the Jakks era. The reverence is real: modern Mattel lines still get measured against it, and not knowing Classic Superstars is a poser tell. The grails live here -- the ToyFare mail-away exclusives, made in roughly 100 units each. The Glow-in-the-Dark Undertaker, the Ultimate Warrior exclusive, and the 'Bloody Funk U' Terry Funk are the most valuable Jakks figures, and a rare Ultimate Warrior marble figurine has reached around $2,000." },
      { type: 'h2', text: 'Ruthless Aggression: the action era' },
      { type: 'p', text: "Ruthless Aggression was Jakks' premier mainline from 2002-03 through 2009, replacing the earlier Titan Tron Live and R-3 Tech lines. It is the action-feature era -- spring-loaded gimmicks, deco churn, and numbered series that built checklist culture. Most are affordable shelf figures; the value concentrates in the short-run series, the exclusives, and the early figures of wrestlers who became stars later. Deluxe Aggression is the upscale, accessory-heavy cut of the same line." },
      { type: 'h2', text: 'Jakks or Mattel?' },
      { type: 'p', text: "Whether Jakks or Mattel made the better WWE figures is the hobby's live debate. Jakks gets credit for the Classic Superstars sculpts and the Attitude-era nostalgia; Mattel for the Elite line's articulation and the modern adult-collector standard. There is no settled answer -- which is why each era gets its own shelf." },
      { type: 'h2', text: 'Further reading' },
      { type: 'ul', items: [
        '[[WWE Elite (Mattel) collector guide|/guides/wwe-elite-hub]] -- the modern Mattel era, face vs heel',
      ]},
    ],
  }

  ,{
    slug: 'wrestling-hub',
    title: 'Wrestling Figures Price Guide',
    metaTitle: 'Wrestling Figures Price Guide 2026 — Every Era, LJN to AEW, Real Comps | FigurePinner',
    metaDescription: 'The umbrella guide to wrestling action figures — LJN, Hasbro, Jakks Pacific, Mattel Elite and AEW/Jazwares, four decades of eras, the biggest grails, and real eBay sold comps.',
    dek: 'Four decades, five makers, one ring — from the LJN Big Rubber Guys to Mattel Elite and AEW, with real sold comps for every era.',
    readingMinutes: 8,
    updated: '2026-06-21',
    body: [
      { type: 'p', text: "Wrestling action figures have run through five distinct maker eras across forty years, and the secondary market for all of them is active at once. This is the umbrella guide: the era arc, the grails that cross every line, and the manufacturer-scoped hubs that go deeper. Whatever era you started in, start here, then dive into yours." },
      { type: 'h2', text: 'Where it started: LJN, 1984' },
      { type: 'p', text: "LJN signed the WWF license in July 1984 and ran it through 1989 — the 'Wrestling Superstars' line, the 8-inch solid-rubber 'Big Rubber Guys.' Unposeable by modern standards, but that is the point: they are the vintage prestige tier, and collectors chase them harder than almost anything modern. The scarcest is the final 'Series 6 / Black Card,' manufactured by Grand Toys in Canada and sold Canada-retail and US-mail-order only — never on US store pegs, so dramatically rarer than the yellow-card run." },
      { type: 'h2', text: 'Hasbro takes over: 1990–1994' },
      { type: 'p', text: "When LJN exited, Hasbro picked up the WWF license and launched the 'Real Wrestling Action' line — roughly eleven waves of 4-inch figures, each with a spring-loaded signature move, a more cartoony look, and a low price of entry. The premier wave covered twelve of the biggest names: Hulk Hogan, Macho Man, Andre the Giant, Jake Roberts, the Ultimate Warrior. The grails are the late-run, short-print cards — the 1-2-3 Kid leads them on the secondary market today." },
      { type: 'h2', text: 'The Jakks era: 1996–2009' },
      { type: 'p', text: "Jakks Pacific held the license from 1996 to 2009, and the era splits cleanly: Classic Superstars, the high-end legend sculpts collectors treat as sacred, and Ruthless Aggression, the gimmick-driven action mainline. The grails are the Classic Superstars ToyFare mail-away exclusives, made in roughly 100 units each. There is a whole hub for it." },
      { type: 'h2', text: 'Mattel Elite: 2010–now' },
      { type: 'p', text: "Mattel took the license in 2010 and turned wrestling figures into an adult-collector phenomenon: the Elite line with TrueFX faces and thirty-plus points of articulation, the budget Basic tier, and the premium Ultimate Edition. The crown grail of the whole hobby lives here — the unreleased Ultimate Warrior 'Granite' Defining Moments figure, valued around $20,000. There is a hub for the Elite era too." },
      { type: 'h2', text: 'The challenger: AEW / Jazwares, 2020–now' },
      { type: 'p', text: "Jazwares launched the AEW Unrivaled Collection in 2020 — 25 points of articulation and real 3D scans, opening with Cody, Kenny Omega, the Young Bucks and Chris Jericho. It is the modern challenger brand to Mattel's WWE, and its chase and Ringside-exclusive editions already drive real secondary value. A boutique and indie revival — Zombie Sailor, Chella, Boss Fight, Super7 — runs alongside it." },
      { type: 'h2', text: 'Further reading' },
      { type: 'ul', items: [
        '[[WWE Elite (Mattel) collector guide|/guides/wwe-elite-hub]] -- the modern Mattel era, face vs heel',
        '[[Jakks Pacific collector guide|/guides/jakks-hub]] -- Classic Superstars & Ruthless Aggression',
      ]},
    ],
  }


  ,{

    slug: 'wwe-elite-hub',
    title: 'WWE Elite: A Collector\'s Guide to the Squared Circle',
    metaTitle: 'WWE Elite Price Guide 2026 — Series, Tiers, Values & Rarity | FigurePinner',
    metaDescription: 'WWE Elite price guide — Mattel\'s tiers (Basic, Elite, Ultimate Edition), the sub-lines, the grails, and real eBay sold comps. Updated 2026.',
    dek: 'Sixteen years of Mattel\'s Elite line — the tiers, the sub-lines, and the grails the squared-circle faithful actually chase.',
    readingMinutes: 10,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'Mattel has been producing WWE Elite since 2010 — sixteen years of six-figure waves that now cover 365 distinct wrestlers across 127 series. Before Elite, Jakks Pacific ran the line. Before Jakks, there was LJN, then Hasbro, then a string of smaller manufacturers racing to put plastic wrestlers on pegs during the Attitude Era. The secondary market for all of it exists and is active. But Elite is where the real collector money moves right now, and it is the format that rewards knowing the difference between a series 12 peg-warmer and a series 90 Walgreen-exclusive variant that sold in two markets and three Walgreens locations.' },
      { type: 'p', text: 'FigurePinner tracks 805 Elite figures, plus 175 Elite Legends releases in a separate sub-line targeting the classic era. What follows is how the pricing structure actually works across both.' },

      { type: 'h2', text: 'How WWE Elite pricing works' },
      { type: 'p', text: 'Elite retail is currently $27.99–$29.99 per figure at Target, Walmart, and Amazon. Mattel has raised this three times since 2019; old-timers remember sub-$20 series prices and are still annoyed about it. The secondary market breaks into the same three zones as any action figure line: below retail (clearance wrestlers, superseded versions of active talent, anyone who left WWE before the wave shipped), at retail to slight premium (current talent with normal demand), and above retail (retired legends with no planned reissue, variants from low-distribution exclusives, early series with strong nostalgic value).' },
      { type: 'p', text: 'The wave structure matters more than people think. Each Elite series ships roughly six figures per case with specific case ratios — the "one per case" figure is the chase, intentionally scarce relative to the heavy hitters who get two or three slots. On secondary market, one-per-case figures from recent series run 40–80% above retail within weeks of hitting shelves. The same figures six months later, once the secondary supply normalizes, often collapse back toward retail. Buy the one-per-case immediately or wait it out.' },

      { type: 'h2', text: 'Most valuable WWE Elite figures right now' },
      { type: 'p', text: 'The highest secondary market values in the Elite line concentrate in four categories: early series figures from 2010–2014 featuring wrestlers who are now legends, Walgreens exclusives from the exclusive era, Target and Amazon exclusives with specific paint decos or accessories not in the standard release, and Elite Legends entries featuring deceased or retired talent who will never get another figure.' },
      { type: 'ul', items: [
        'Elite Legends with deceased wrestlers — Jake "The Snake" Roberts, Terry Funk, Dusty Rhodes, British Bulldog, Iron Sheik. These hold value indefinitely because no reissue is coming. FigurePinner sold comps show Terry Funk Elite Legends averaging $55–$85 depending on condition. Iron Sheik moved after his death in 2023.',
        'Early series CM Punk — CM Punk has 10 Elite releases in the FigurePinner database. The Series 12 Punk (2013 release, during the height of his first run) moves between $45 and $90 depending on the variant. The Series 63 release from his return is more available but still holds premium.',
        'The Rock across series — 9 Elite releases tracked; certain variants (black trunks, specific attire from specific matches) carry premiums that the "standard" Rock does not. Sold comps range from $22 to $75 depending on which one.',
        'Undertaker across his full run — 11 Elite releases. The Deadman gimmick variants (Ministry attire, Phenom 2000-era look) hold better than the American Badass period figures, which have always been less collected.',
        'Exclusive variants — Walmart exclusives, Target exclusives, and GameStop exclusives each have their own scarcity tier. The Amazon exclusives (specific accessories, gold-ring event attire) tend to hold value best because the distribution window is clearest.',
      ]},

      { type: 'h2', text: 'Elite vs. Elite Legends: two different markets' },
      { type: 'p', text: 'Mattel runs Elite and Elite Legends as distinct sub-lines with different pricing dynamics. Standard Elite covers current and recent talent across 127 series; the figures are in stores now and the secondary market is liquid. Elite Legends targets the classic 1980s–2000s era — Hulk Hogan, Ultimate Warrior, Ricky Steamboat, Dusty Rhodes, Jake Roberts — and skews older buyers who want their childhood wrestlers in modern articulation.' },
      { type: 'p', text: 'Elite Legends carries a structural premium that Elite does not. Ultimate Warrior has 6 releases in the database; Hogan has 6. Neither is getting new figures. Every year that passes, the demand from fans who grew up watching them in the 80s grows relative to supply. FigurePinner sold comps on Hogan Elite Legends average $35–$65 depending on series and condition. A "sealed in package" Hogan from the first Elite Legends wave runs above $100. That is a nostalgia premium, not a rarity premium — Mattel made plenty of them. The scarcity is the Hulkster not getting new figures until further notice.' },
      { type: 'callout', text: 'FigurePinner tracks 175 Elite Legends releases. The price spread between a loose opened Hogan and a sealed first-release Hogan is currently 60–90%. If you are buying to display loose, the value equation looks completely different.' },

      { type: 'h2', text: 'The articulation gap: why Elite exists' },
      { type: 'p', text: 'Mattel produces two tiers of WWE figures simultaneously: Basic (limited articulation, lower price point, mass retail) and Elite (20+ points of articulation, accessories, fabric elements on some releases). The Elite line exists specifically because the basic tier does not serve the collector market. You cannot pose a Basic Undertaker doing a sit-up. You can do it with Elite.' },
      { type: 'p', text: 'The articulation model for Elite has evolved across the 127 series. Early series (1–20) used a slightly different joint construction that some collectors rate as less durable than the current design. The shoulder joints on certain early figures are the weak point — they wear loose over time with posing. Series 40+ figures have a more consistent shoulder design. This is relevant for secondary market buying: early series figures in opened condition should have their shoulders checked before purchase. A figure that cannot hold a raised arm is worth significantly less than one with tight joints.' },

      { type: 'h2', text: 'John Cena has 22 Elite figures' },
      { type: 'p', text: 'John Cena leads the Elite character count at 22 distinct releases — more than Roman Reigns (18), Rey Mysterio (16), or Seth Rollins (15). This is not an accident: Mattel and WWE know Cena moves product, so he gets included in more waves. The secondary market consequence is that most Cena Elites are not valuable. The exceptions are variants with specific gear from specific matches, and early series releases from 2010–2012 when the character was at peak momentum. A Series 1 John Cena in original packaging sells for more than a Series 60 John Cena in identical condition — not because Series 60 is worse, but because the older one has been out of production longer and carries nostalgic premium.' },
      { type: 'p', text: 'The same logic applies to Roman Reigns, Randy Orton, and Triple H — all of whom have 10+ Elite releases. More figures means more options and more chances to get cheap, but it also means the specific variants that collectors actually want carry real premiums over the standard releases. Know which series you are buying.' },

      { type: 'h2', text: 'The vintage lines: Classic Superstars and Ruthless Aggression' },
      { type: 'p', text: 'The FigurePinner database covers 5,571 wrestling figures total — not just Elite. Before Mattel took the license in 2010, Jakks Pacific ran WWE through multiple sub-lines. Classic Superstars (364 figures in the database) was Jakks\'s retro line targeting the same demand that Elite Legends now serves. Ruthless Aggression (316 figures) was the main Jakks line from 2002–2008, covering the Attitude Era and early PG era in 6-inch scale.' },
      { type: 'p', text: 'Classic Superstars commands genuine secondary market premiums for characters who either died or retired before Mattel took the license and therefore have no Mattel equivalent. Terry Funk in Classic Superstars — no Elite equivalent existed until late in his life. Eddie Guerrero in Classic Superstars has moved steadily above its 2004 retail since his death in 2005. The sold comps on Guerrero Classic Superstars run $40–$90 depending on variant and condition. That is a twenty-year-old figure at double its original retail, held up purely by the impossibility of a new release.' },

      { type: 'h2', text: 'What to check before buying loose wrestling figures' },
      { type: 'p', text: 'Wrestling figures get played with. Not all collectors are collectors from day one — many were bought for kids, used heavily, and then sold on eBay as "collector items" fifteen years later with loose joints and missing accessories. Before buying any loose Elite or Classic Superstars figure, verify: joint tightness (especially shoulders and hips), belt and accessory completeness (many figures ship with belts that get lost), and head paint (eyes chip on figures that have been handled).' },
      { type: 'p', text: 'The accessories gap is real on secondary market. A John Cena Elite that shipped with a chain and a t-shirt accessory is worth materially less without those accessories — sometimes 20–30% less. Sellers frequently list figures as "complete" when they mean "I have no idea what came with this." Pull the original checklist before buying anything premium.' },

      { type: 'h2', text: 'Check any wrestler\'s current price' },
      { type: 'p', text: '[[FigurePinner|/]] tracks 805 Elite figures, 175 Elite Legends, 364 Classic Superstars, and 316 Ruthless Aggression figures with eBay sold comp data. Search any wrestler by name to see what their figures actually cleared — not asking prices, actual sales from the last 90 days. The difference between what a seller lists and what a buyer paid is 40–60% on most wrestling figures.' },

      { type: 'h2', text: 'Further reading' },
      // 2026-07-27: dropped 2 entries, to slugs wwe-elite-price-guide-2026 and
      // classic-superstars-vs-elite-legends. Neither guide has ever existed;
      // renderText() emits [[label|/path]] as a real <a href> with no existence
      // check, so both were live crawlable links into a 404. (Slugs written
      // bare, without the guides path prefix, so dead-link sweeps of this repo
      // do not flag this comment as a live reference.)
      { type: 'ul', items: [
        '[[Most Valuable WWE Figures: Elite, Classic Superstars, and Vintage|/guides/most-valuable-wwe-elite-figures]] — the figures actually worth money',
      ]},
    ],
  }
  ,{
    slug: 'star-wars-black-series-hub',
    title: 'Star Wars Black Series Price Guide: 838 Figures, Every Phase, and What They Actually Cost',
    metaTitle: 'Star Wars Black Series Price Guide 2026 -- Every Phase, Value & Rarity | FigurePinner',
    metaDescription: 'Star Wars Black Series price guide covering 838 figures across every phase. Most valuable figures, exclusive tiers, and real eBay sold comps -- updated 2026.',
    dek: '838 figures. 537 characters. Luke Skywalker has 21 of them. Here is what the Black Series actually costs in 2026.',
    readingMinutes: 10,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'Hasbro launched Star Wars Black Series in 2013 with an orange-carded 6-inch figure and a lot of goodwill from collectors who had been tolerating the 3.75-inch scale since 1977. Thirteen years later it is the dominant premium Star Wars format: 838 figures in the FigurePinner database, 537 unique characters, and a secondary market that ranges from $8 clearance Stormtroopers to $200+ HasLab Sail Barge figures that funded on sheer collector will.' },
      { type: 'p', text: 'The line has gone through distinct phases that collectors track like geological strata. Orange wave, blue wave, Force Awakens era, 40th Anniversary, Galaxy series. Each phase has different articulation standards, paint quality benchmarks, and secondary market behavior. Buying a Phase 1 orange-carded figure and a current Galaxy-series release is not the same transaction even if they cost the same at retail.' },

      { type: 'h2', text: 'How Black Series pricing works' },
      { type: 'p', text: 'Retail is currently $27.99 to $29.99 for standard Black Series, with Deluxe and vehicle sets above that tier. The secondary market breaks into three zones: below retail (overproduced or unpopular -- any army-builder stormtrooper variant beyond the first has this problem), at-retail or slight premium (normal demand for a current character), and above retail (scarcity plus demand -- usually an exclusive with a closed window, or an early-phase figure never reissued).' },
      { type: 'p', text: 'The exclusive tier is massive. The FigurePinner database counts 142 exclusive Black Series figures -- nearly one in six releases. Exclusives come from Target, Walmart, Amazon, GameStop, Fan Channel/Pulse, Celebration events, and the Disney parks. Park exclusives carry the highest premiums because supply is gated behind a theme park ticket. A Disney park Obi-Wan or Ahsoka moves significantly above retail because non-park attendees have no other option.' },

      { type: 'h2', text: 'Most valuable Star Wars Black Series figures right now' },
      { type: 'ul', items: [
        'HasLab Rancor (2021) -- funded at $349.99 retail, the HasLab Rancor with Luke and Gamorrean Guard accessories is the secondary market ceiling for standard Black Series. Loose with all accessories: above $280. Sealed: above $400.',
        'Disney park exclusives -- figures sold only at Hollywood Studios and Disneyland. Ahsoka Tano, specific clone variants, and park-run droids have moved $60-$120 on secondary market because supply is gated by geography and a park ticket.',
        '40th Anniversary line -- 56 figures in the database covering the original trilogy with special vintage-style packaging. The 40th Anniversary Darth Vader (2017) sealed has held above $70; the packaging format is specific and has not been reissued.',
        'Celebration and convention exclusives -- figures sold at Star Wars Celebration events. These carry event premiums that dissolve over time but hold for 12-18 months after the show.',
        'Phase 1 orange wave (2013) -- the first 10 figures of the line. Luke, Vader, R2-D2 from the original 2013 run in sealed packaging move between $45 and $90. Loose, they are mostly $12-$20.',
      ]},

      { type: 'h2', text: 'The Luke Skywalker problem' },
      { type: 'p', text: 'Luke Skywalker has 21 distinct Black Series releases. Obi-Wan Kenobi has 15. Darth Vader has 15. Boba Fett has 13. These are the core characters who get reissued whenever Hasbro needs a wave to ship -- Luke in X-wing pilot gear, Luke in Bespin, Luke in Jedi robes, Luke in black for Return of the Jedi. The secondary market consequence is predictable: most Luke figures are worth retail or below.' },
      { type: 'p', text: 'The exceptions are format-specific variants. The Carbonized Luke -- chrome-finish from the Carbonized sub-line -- holds above retail because the presentation is genuinely different. The 40th Anniversary Luke holds because the packaging is collectible. Most Luke figures are product, not collectibles. Know which version you have.' },

      { type: 'h2', text: 'Ahsoka Tano: the Black Series breakout character' },
      { type: 'p', text: 'Ahsoka Tano has 8 Black Series releases and the most secondary market momentum in the line right now. She was introduced in The Clone Wars, appeared in Rebels and The Mandalorian, then got her own live-action show -- every new property generates a new wave of buyers. Her Clone Wars-era white-and-blue look and her Rebels-era white-blade appearance have different fanbases and different price points.' },
      { type: 'p', text: 'Which version matters enormously. The Ahsoka from her 2023 Disney+ show is widely available near retail. Earlier animated-likeness versions, especially the first Clone Wars figure, move between $35 and $80 depending on condition and accessory completeness. Buying Ahsoka on secondary market without knowing which era you want is how you overpay.' },

      { type: 'h2', text: 'The Vintage Collection: 3.75-inch runs parallel' },
      { type: 'p', text: 'FigurePinner tracks 814 Vintage Collection figures -- nearly identical count to Black Series. The Vintage Collection is 3.75-inch scale with cardback styling that matches original Kenner. It is a completely separate market that runs parallel to Black Series. Some collectors are 6-inch only; some are 3.75-inch only; some buy both. The scales are incompatible on the same shelf.' },
      { type: 'p', text: 'Vintage Collection carries its own nostalgia premium for collectors who grew up with original Kenner figures in the late 1970s and 1980s. Sealed Vintage Collection figures on Kenner-style cards run notably higher than sealed Black Series for the same character, because the cardback format is the specific nostalgia object.' },
      { type: 'callout', text: 'FigurePinner tracks 4,222 Star Wars figures total -- Black Series, Vintage Collection, The Clone Wars, Power of the Force, and more. If you are hunting a specific character across all formats, every major line is in the database.' },

      { type: 'h2', text: 'Phase guide: what changed across Black Series eras' },
      { type: 'p', text: 'Orange wave (2013): the original 6-inch launch, solid articulation for the era, variable paint. Blue wave (2014-2015): refined construction, improved joints on some figures. Force Awakens era (2015-2018): sequel trilogy characters introduced, paint quality starts to diverge between basic and premium tiers. 40th Anniversary (2017): vintage packaging on current-construction figures. Galaxy series (2018-present): current standard, Deluxe tier introduced, photo real paint on premium releases.' },
      { type: 'p', text: 'Photo real paint -- the face-likeness process Hasbro introduced around 2019-2020 -- is the single biggest quality jump in the line. Pre-photo-real faces are stylized action-figure faces. Post-photo-real faces are noticeably accurate to actor likenesses. For human characters, a post-2019 release almost always looks better than any pre-2019 version of the same character, even if the older release is rarer.' },

      { type: 'h2', text: 'Check any Black Series figure price' },
      { type: 'p', text: '[[FigurePinner|/]] tracks all 838 Black Series figures plus the full Star Wars library with eBay sold comp data. Search any character to see actual sold prices -- not asking prices, not guide estimates, real cleared transactions from the last 90 days.' },

      // 2026-07-27: the entire "Further reading" block was removed -- all three
      // entries (star-wars-black-series-price-guide-2026,
      // star-wars-vintage-collection-price-guide, haslab-star-wars-price-guide)
      // pointed at guides that have never existed. The heading goes with them
      // rather than being left over an empty list.
    ],
  }

  ,{
    slug: 'dc-multiverse-hub',
    title: 'DC Multiverse Price Guide: 1,508 Figures, 457 Characters, and What They Actually Cost',
    metaTitle: 'DC Multiverse Price Guide 2026 -- Every Wave, Gold Label & Value | FigurePinner',
    metaDescription: 'DC Multiverse price guide covering 1,508 figures. Gold Label rarity, Batman variant guide, CnC wave breakdown, and real eBay sold comps -- updated 2026.',
    dek: '1,508 figures. 457 characters. Batman has 235 of them. Here is what McFarlane Toys DC Multiverse actually costs.',
    readingMinutes: 10,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'McFarlane Toys took over the DC license in 2020 and immediately started shipping waves at a pace that made the Mattel DC Universe Classics era look leisurely. The DC Multiverse line now covers 1,508 figures in the FigurePinner database across 457 unique characters. Batman accounts for 235 of those releases. Superman has 77. The Joker has 38. If you are trying to understand what any of it is worth, start with the tiering system -- because McFarlane built a deliberate scarcity structure into Multiverse from the beginning.' },
      { type: 'p', text: 'The line divides into two formal tiers: standard Multiverse and Gold Label. Gold Label is the scarcity tier -- limited production runs, retailer exclusives, and collector-targeted variants that McFarlane signals from the front of the package. Understanding this distinction is the single most important thing you can know about DC Multiverse secondary market pricing.' },

      { type: 'h2', text: 'Standard Multiverse vs. Gold Label' },
      { type: 'p', text: 'Standard Multiverse figures ship in normal retail quantities to Target, Walmart, Amazon, and specialty shops. The secondary market on most standard Multiverse releases is thin -- good figures at retail pricing, not scarce enough to generate real premiums above $10-$15 over MSRP for most characters. The exceptions are one-per-case chase figures and characters with high demand but limited production (villain-heavy waves with a single villain getting short-packed against five Batman variants).' },
      { type: 'p', text: 'Gold Label is a different animal. The FigurePinner database shows 365 Gold Label releases -- nearly a quarter of all Multiverse figures. Gold Label figures are exclusive to specific retailers or sold in limited windows: McFarlane store exclusives, Target exclusives, Walmart exclusives, Amazon exclusives, GameStop exclusives, and convention exclusives. The production run is stated to be lower. Secondary market premiums on Gold Label run 30-100% above retail within weeks of a figure going out of stock.' },
      { type: 'callout', text: 'FigurePinner tracks 365 Gold Label DC Multiverse figures separately from standard releases. Gold Label is where the secondary market action is -- most standard Multiverse is worth close to retail.' },

      { type: 'h2', text: 'Batman has 235 Multiverse releases' },
      { type: 'p', text: 'Batman leads the DC Multiverse character count at 235 distinct releases -- more than three times Superman (77) and more than six times the Joker (38). This is not a knock on McFarlane; DC Comics has published roughly 35,000 Batman stories since 1939 and there are genuinely dozens of distinct looks worth making. But the secondary market consequence is significant: most Batman Multiverse figures sell at retail or below. The supply is constant and the variants are many.' },
      { type: 'p', text: 'The valuable Batman releases are specific: Gold Label variants in limited production, the Batman Animated Series sub-line (which draws its own fandom separate from the main Multiverse line), and specific suit variants from major storylines that have collector demand beyond casual buyers. The "yet another blue-and-grey Batman" does not hold value. The Detective Comics #27 anniversary figure in Gold Label packaging does.' },

      { type: 'h2', text: 'Most valuable DC Multiverse figures right now' },
      { type: 'ul', items: [
        'Gold Label exclusives with limited windows -- McFarlane store-exclusive Gold Labels that sold out and closed. The aftermarket on these runs 40-90% above their original retail. Specific DC Direct and McFarlane Collector Edition figures with sub-2000 stated print runs.',
        'Batman Animated Series figures (Kenner-style and McFarlane-era) -- the Batman Animated Series has its own collector base that predates Multiverse entirely. The original Kenner Batman Animated (87 figures in the database) and the McFarlane Batman Animated Series rereleases both command premiums from collectors who grew up with the 1992 animated show.',
        'CnC (Collect-and-Connect) wave completions -- the Multiverse equivalent of a BAF. King Shark, Bane, and Steppenwolf CnC waves (27, 26, and 22 figures respectively in the database) generate the same BAF economics as Marvel Legends: wave members sell unevenly based on whether the buyer wants the figure or just the piece.',
        'DC Collectibles Batman Animated Series -- 69 figures in the database from the DC Collectibles (pre-McFarlane) run. These are an older collector item now; the Harley Quinn and Poison Ivy figures from this line have held the strongest secondary market values because the character designs are considered definitive.',
        'Super Powers vintage (1984-1986) -- 142 figures in the database. The original Kenner Super Powers line is a vintage collectible market entirely separate from modern Multiverse. Sealed Super Powers figures in good card condition move between $40 and $200 depending on character and condition.',
      ]},

      { type: 'h2', text: 'The Batman Animated Series as a separate market' },
      { type: 'p', text: 'The 1992 Batman: The Animated Series is one of the most beloved pieces of DC animation ever produced, and it has generated a collector market that runs across three different manufacturer eras. Kenner made the original figures (1992-1996, 87 figures in the database). DC Collectibles made a modern version (69 figures). McFarlane has made their own Animated Series releases as part of the broader Multiverse line.' },
      { type: 'p', text: 'Each era has different collector bases and different value drivers. Kenner originals are nostalgic artifacts from the early 1990s; the Mr. Freeze, Ra\'s al Ghul, and Talia figures from the Kenner run command real premiums ($35-$80 for good loose examples) because the line ended before completing the full villain roster. DC Collectibles versions are modern articulated figures with animated-accurate styling; the first-run figures hold value because the line was cancelled. McFarlane versions are widely available.' },

      { type: 'h2', text: 'DC Universe Classics: the pre-McFarlane premium line' },
      { type: 'p', text: 'Before McFarlane, Mattel ran DC Universe Classics (2007-2016) with 172 figures tracked in the FigurePinner database. DCUC is the predecessor to Multiverse in collector esteem and secondary market behavior. The Collect-and-Connect system (DCUC used the same BAF model) produced complete figures that are now genuinely old collectibles. Certain DCUC figures -- Vigilante, B\'wana Beast, Kamandi -- shipped in limited quantities to stores that nobody visited and now command $60-$120 loose because they are genuinely hard to find.' },
      { type: 'p', text: 'The DCUC vs. Multiverse comparison is a genuine collector debate. DCUC has deeper character selection in the obscure tier and a more consistent scale across releases. Multiverse has better paint applications, better face sculpts, and active retail availability. If you are building a comprehensive DC collection, you need both.' },

      { type: 'h2', text: 'Checking rarity before buying' },
      { type: 'p', text: 'The Gold Label designation on the package is the most reliable rarity signal in the Multiverse line, but it is not the only one. Check the UPC and look for the retailer-exclusive sticker -- a figure that says "McFarlane Toys Direct" or "Target Exclusive" in small text on the packaging has a different secondary market ceiling than a standard retail release. Loose secondary market Multiverse figures frequently do not list their Gold Label status; always cross-reference against the FigurePinner database before paying above-retail prices.' },

      { type: 'h2', text: 'Check any DC Multiverse figure price' },
      { type: 'p', text: '[[FigurePinner|/]] tracks all 1,508 DC Multiverse figures plus DC Universe Classics, Batman Animated Series, Super Powers, and the full DC catalog with eBay sold comp data. The Gold Label tier, the CnC wave figures, the animated-series sub-markets -- all covered with real sold prices.' },

      // 2026-07-27: the entire "Further reading" block was removed -- all three
      // entries (dc-multiverse-price-guide-2026,
      // batman-animated-series-figure-guide, dc-universe-classics-price-guide)
      // pointed at guides that have never existed. The heading goes with them
      // rather than being left over an empty list.
    ],
  }
  ,
  {
    slug: 'masters-of-the-universe-hub',
    title: 'Masters of the Universe Price Guide: 1,497 Figures Across 40 Years of Eternia',
    metaTitle: 'MOTU Price Guide 2026 -- Origins, Masterverse, Classics & Vintage Values | FigurePinner',
    metaDescription: 'Masters of the Universe price guide covering 1,497 figures across Origins, Masterverse, MOTUC, Super7, and 1982 vintage. Line-by-line value breakdown and real eBay sold comps -- updated 2026.',
    dek: '1,497 figures. 526 characters. Ten lines, three of them shipping right now, and a fandom that has been braced for cancellation since 2004. Here is what MOTU actually costs.',
    readingMinutes: 11,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'No fandom has been left at the altar more times than this one. The 200X line died in 2004 with the story half-told. Mattycollector ran the Classics line on a subscription model that crashed its own servers every sale day and trained an entire fandom to panic-buy. Super7 inherited the keys and immediately asked for $600 to crowdfund a Snake Mountain. Then Origins, the line that was supposed to bring He-Man back to a Walmart peg, got quietly exiled to Mattel Creations and online ordering. If you collect MOTU, your default emotional register is cautious hope braced for the next cancellation. The FigurePinner database tracks 1,497 of these figures across 526 characters and ten distinct lines -- and the value story is completely different depending on which line you are holding.' },
      { type: 'p', text: 'He-Man (84 releases) and Skeletor (77) dominate the character count the way Batman dominates DC Multiverse -- which means most He-Man and Skeletor figures are common and sell at or near retail. The money is in the supporting cast, the dead lines, and the vintage cards. Start with the line, not the character.' },

      { type: 'h2', text: 'The ten lines, and which ones hold value' },
      { type: 'p', text: 'MOTU is not one collection, it is ten overlapping ones. The database breaks down as: Origins (474), Classics/MOTUC (210), the 1982 vintage original (198), Masterverse (167), the 200X Mattel line (126), Eternia Minis (96), Super7 (94), Mondo (83), New Adventures of He-Man (38), and Mattel Chronicles (11). Each one has its own collector base and its own pricing physics.' },
      { type: 'callout', text: 'Origins is the biggest line by figure count (474) but the softest in secondary value -- it is the current retail line. MOTUC and 200X are the smaller, dead lines where the real premiums live. Count of figures is not a proxy for value.' },

      { type: 'h2', text: 'Origins: 474 figures and a retail collapse problem' },
      { type: 'p', text: 'Origins launched in 2020 as the 5.5-inch vintage-style line meant to put He-Man back on store pegs at a $15 price point. It is the largest MOTU line in the database at 474 figures, and for most collectors that is exactly the problem -- the supply is enormous and the distribution got worse, not better. Mattel moved more and more of the line to Mattel Creations and online-exclusive drops, and the fandom has a name for what happens next: the "can\'t find it in stores" death spiral. A line that lives online does not build casual collectors, and Origins\' secondary market reflects it. Most standard Origins figures sell loose for less than their original retail.' },
      { type: 'p', text: 'The exceptions are the Creations and convention exclusives and the deco variants -- the Origins-exclusives wave and the cross-line collaboration figures. Those move. A standard wave-five Beast Man does not. Before you pay a premium on a loose Origins figure, check whether it was a general-retail release or an online-exclusive, because that single fact sets the ceiling.' },

      { type: 'h2', text: 'MOTUC: the Mattycollector trauma line' },
      { type: 'p', text: 'Masters of the Universe Classics ran from 2008 to 2018, sold almost entirely through Mattycollector\'s subscription-and-sale-day model, and is the line most current collectors mean when they say "the good stuff." The database tracks 210 MOTUC figures. The sculpting was handled by the Four Horsemen -- the studio fans revere by name, and the reason MOTUC figures still look better than a lot of what shipped after. Because the line sold through a subscription with limited sale-day windows that routinely crashed the Mattycollector servers, supply on individual figures was genuinely constrained in a way Origins supply never has been.' },
      { type: 'p', text: 'That constraint shows up in the comps. The harder MOTUC figures -- late-run releases, the Club Grayskull subset, characters that sold out before fans could re-buy -- run real premiums loose and serious premiums sealed. This is the line where "I missed the sale day and have been paying for it ever since" is a genuine collector loss story, not a marketing line. I will be honest about where the data thins out: print runs on individual MOTUC figures were never officially published, so any specific scarcity claim you see is an estimate, not a number Mattel ever confirmed.' },

      { type: 'h2', text: 'The 1982 vintage line: 198 figures and the crotch-wash joke' },
      { type: 'p', text: 'The original 1982-1987 Mattel line -- 198 figures in the database -- is the vintage market underneath everything else. This is where carded-versus-loose splits the value in two: a loose vintage He-Man with his armor and weapon is a $20-$40 figure depending on condition, while the same figure carded in decent shape is a different order of magnitude. The fandom\'s favorite running joke lives here too: the "vintage taint," the flesh-tone crotch-wash paint application Mattel used on the figures, which the community has never stopped finding funny and never will.' },
      { type: 'p', text: 'Vintage MOTU value drivers are the usual vintage drivers: completeness (the right weapon, the right armor, the mini-comic), card condition for sealed examples, and the harder later-wave figures that shipped in lower quantities as the line wound down. The early core characters are common; the late-line and the New Adventures-adjacent vintage releases are where vintage scarcity actually lives.' },

      { type: 'h2', text: 'Masterverse, 200X, Super7, and the rest' },
      { type: 'ul', items: [
        'Masterverse (167) -- the 7-inch fully-articulated modern line, the current "premium" tier alongside Origins. Includes Filmation-deco figures and movie-tie-in releases. The fandom is watching it for slowdown signs, and the 2026 live-action movie figures draw equal parts excitement and "movie lines have killed us before" dread. Secondary value is still mostly retail-adjacent except for the exclusives.',
        '200X / Mattel 200X (126) -- the 2002-2004 line that died with its story half-told. Because the line was cancelled mid-run, the late-wave 200X figures that barely shipped are genuine grails for that sub-fandom, and the deeper-cut characters command real money. This is a dead-line premium, same economics as a cancelled DCUC wave.',
        'Super7 (94) -- the Club Grayskull and ReAction-adjacent era, including the infamous $600 Snake Mountain crowdfund. The fandom splits hard on Super7: gratitude for keeping the brand alive versus resentment over pricing and quality, and people who collect MOTU seriously will police you for flattening that era into hero-or-villain. Value is uneven and product-dependent.',
        'Mondo (83) -- the high-end 1/6-ish premium-collectible tier. Different buyer entirely, priced as display-piece collectibles rather than mass-market figures.',
        'New Adventures of He-Man (38) -- the space-future 1989 reboot. Defending the NA line is, in fandom terms, a hipster position; the figures are a niche-within-a-niche and priced accordingly, with a small but committed buyer base.',
        'Eternia Minis (96) and Mattel Chronicles (11) -- the blind-box and small-format tiers; collectible but low-dollar per unit.',
      ]},

      { type: 'h2', text: 'Knowing your lines is the price test' },
      { type: 'p', text: 'The single most common MOTU pricing mistake is treating a figure as "a He-Man figure" instead of "an Origins He-Man" or "a MOTUC He-Man" or "a 1982 vintage He-Man." Those are three completely different markets with three different price ceilings, and a loose figure stripped of its packaging often does not announce which line it came from. The poser tells in this fandom are exactly the value mistakes: confusing Origins with Classics with Masterverse, not knowing the Four Horsemen sculpted MOTUC, and -- the cardinal sin -- spelling it "Skeletore."' },

      { type: 'h2', text: 'Check any MOTU figure price' },
      { type: 'p', text: '[[FigurePinner|/]] tracks all 1,497 Masters of the Universe figures across Origins, Masterverse, MOTUC, the 1982 vintage line, 200X, Super7, Mondo, and the rest -- with eBay sold comp data, so you can tell an online-exclusive Origins figure from a general-retail one and a dead-line 200X grail from a common core character before you pay.' },

      { type: 'h2', text: 'Further reading' },
      { type: 'ul', items: [
        '[[Masters of the Universe Collecting Guide: Where to Start|/guides/motu-collecting-guide]] -- the line-by-line starter for new MOTU collectors',
      ]},
    ],
  }

  ,
  {
    slug: 'tmnt-hub',
    title: 'TMNT Price Guide: 1,182 Figures Across NECA, Playmates, and Super7',
    metaTitle: 'TMNT Price Guide 2026 -- NECA, Playmates, Super7 Ultimates & Values | FigurePinner',
    metaDescription: 'Teenage Mutant Ninja Turtles price guide covering 1,182 figures across NECA, Playmates, and Super7 Ultimates. Line-by-line value breakdown, Haulathon comps, and real eBay sold prices -- updated 2026.',
    dek: '1,182 figures. 605 characters. The hottest license in the hobby, three manufacturers who barely share a scale, and a Target drop day that gave an entire fandom PTSD. Here is what TMNT actually costs.',
    readingMinutes: 11,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'There is a phrase collectors use when a TMNT figure sells out in nine seconds and resells for triple before it ships: the turtle tax. TMNT is the hottest license in the action-figure hobby right now, and the consequence is that almost everything sells out and almost nothing sits. The FigurePinner database tracks 1,182 Turtles figures across 605 characters and three manufacturers who each serve a different slice of the fandom and barely agree on what scale a turtle should be. If you want to price any of them, the first question is never "which character" -- it is "which line, and which continuity."' },
      { type: 'p', text: 'The four turtles cluster tightly in the database: Raphael (33), Donatello (32), and Leonardo and Michelangelo (30 each). Shredder has 21, Casey Jones 20, Splinter 15. The deep cuts go a long way -- Usagi Yojimbo has 11 releases, The Last Ronin has 9. But character count is not the value story here. Manufacturer and continuity are.' },

      { type: 'h2', text: 'Three manufacturers, three completely different markets' },
      { type: 'p', text: 'NECA dominates the database with 449 figures in its main TMNT line (650 across all NECA sub-lines), Playmates has 339, and Super7 has 144 in its Ultimates line. These are not competing versions of the same product -- they are three separate collector markets. NECA serves the continuity factions (1987 cartoon, 1990 movies, Mirage comics, the cartoon-accurate cel-shaded look). Super7 serves vintage-toy nostalgia with the high-end Ultimates treatment. Playmates is the budget legacy holder that everyone scolds and everyone still buys.' },
      { type: 'callout', text: 'Calling a Super7 Ultimates figure "a NECA" is a poser tell. So is thinking Playmates is the collector line. The three lines do not share a scale -- NECA, Super7, and Playmates turtles do not stand comfortably on the same shelf, and that scale incompatibility is a genuine ongoing fandom complaint.' },

      { type: 'h2', text: 'NECA: the line that created Haulathon PTSD' },
      { type: 'p', text: 'NECA is the collector-tier TMNT line, and its signature is toon-accurate -- the cel-shaded deco that recreates the 1987 cartoon look. The database holds 449 figures in the core NECA line plus a 67-figure Ultimate sub-line. NECA serves each continuity faction separately: the toon line, the 1990 movie line, the Mirage black-and-white comic deco. Which one you want determines which figures even exist for you.' },
      { type: 'p', text: 'And then there is Haulathon. NECA distributes large Target-exclusive multipacks on specific drop days, and "Haulathon" has become shorthand for a particular kind of suffering: the app crashes, carts empty at checkout, bots clear stock before humans load the page, and the figures are then nearly impossible to find in actual stores. The secondary-market consequence is direct -- Haulathon-exclusive sets command real premiums because the in-store availability the price assumes never materialized. When you see a NECA TMNT set priced well above its stated retail, the reason is almost always that it was a Haulathon drop that nobody could actually buy at retail. NECA and Randy Falk discourse on social media is its own meta-topic in the fandom.' },

      { type: 'h2', text: 'Super7 Ultimates: premium, brittle, and worth the wait (mostly)' },
      { type: 'p', text: 'Super7 makes the Ultimates line -- 144 figures in the database -- the high-end, vintage-nostalgia tier. These are built and priced as premium collectibles, with the accessory-heavy "Ultimates" treatment that gives the line its name. Two things define the Super7 ownership experience and both affect resale. First, the wait: Super7 Ultimates ship on a long pre-order timeline, long enough that "I forgot I ordered this" is a running joke. Second, the joints: Super7 figures have a reputation for brittle plastic and stuck joints, and condition risk on loose examples is real.' },
      { type: 'p', text: 'Value-wise, sold-out Ultimates waves hold and climb -- the pre-order model means production is keyed to demand and the secondary market on a closed wave is thin. But because of the brittleness, loose-figure condition matters more here than in most modern lines. A loose Super7 turtle with intact joints is worth meaningfully more than one with the common ankle or shoulder breakage.' },

      { type: 'h2', text: 'Playmates: the line everyone scolds' },
      { type: 'p', text: 'Playmates has held the mass-market TMNT license since the original 1988 vintage line, and the database tracks 339 Playmates figures plus a 49-figure Mutant Mayhem sub-line tied to the 2023 movie. Playmates is the budget legacy holder, and the fandom\'s relationship with it is openly grumpy. The common complaint about modern Playmates reissues is blunt: "same figure, worse plastic, 2025 price." The reissues recycle old tooling at higher price points with cheaper materials, and collectors notice.' },
      { type: 'p', text: 'The value here splits hard between vintage and modern. Vintage Playmates (the 1988-1997 original run) is a real collectible market -- carded examples of the early waves and the harder-to-find later figures command vintage premiums, and condition-graded sealed pieces are a separate tier entirely. Modern Playmates retail figures are mostly worth retail or less, with the Mutant Mayhem line tracking the movie\'s commercial life. Do not pay collector prices for a modern Playmates basic figure; do take vintage Playmates seriously.' },

      { type: 'h2', text: 'The roster jokes are also value signals' },
      { type: 'p', text: '"Where\'s Casey" is a long-running fandom complaint -- core characters and obvious roster needs get skipped while lines go deep into one-off variants and obscure deep cuts. April O\'Neil variant fatigue is a related gripe. These are not just jokes; they are value information. When a line re-decos the same four turtles for the fifth time while a wanted character stays unmade, the unmade character\'s existing releases hold value and the fifth turtle re-deco does not. The deep cuts that the toon line keeps producing -- the Usagi Yojimbo and Last Ronin figures, the obscure mutants -- often outperform the core re-releases precisely because they were made once.' },

      { type: 'h2', text: 'Check any TMNT figure price' },
      { type: 'p', text: '[[FigurePinner|/]] tracks all 1,182 Teenage Mutant Ninja Turtles figures across NECA, the Ultimate sub-line, Super7 Ultimates, vintage and modern Playmates, and the Mutant Mayhem releases -- with eBay sold comp data, so you can tell a Haulathon-premium set from a standard retail release and a vintage Playmates collectible from a modern reissue before you pay the turtle tax.' },

      { type: 'h2', text: 'Further reading' },
      { type: 'ul', items: [
        '[[TMNT Collecting Guide: Where to Start|/guides/tmnt-collecting-guide]] -- the continuity-and-line breakdown for new Turtles collectors',
      ]},
    ],
  }

  ,
  {
    slug: 'transformers-hub',
    title: 'Transformers Price Guide: 1,592 Figures From G1 to Studio Series',
    metaTitle: 'Transformers Price Guide 2026 -- Masterpiece, Studio Series, G1 & Values | FigurePinner',
    metaDescription: 'Transformers price guide covering 1,592 figures across Masterpiece, Studio Series, Generations, and vintage G1. Line breakdown, Gold Plastic Syndrome warning, and real eBay sold comps -- updated 2026.',
    dek: '1,592 figures. 975 characters. The most lore-encrusted fandom in the hobby, a $400 Optimus problem, and a plastic disease that turns vintage gold to dust. Here is what Transformers actually costs.',
    readingMinutes: 11,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'Transformers collectors do not review robots. They review transformations. This is the most engineering-obsessed, self-documenting fandom in the hobby -- the kind of community where "shellformer" and "partsformer" are damning verdicts and "intuitive" is the highest compliment a transformation can earn (never "easy" -- saying a transformation is "easy" marks you as a tourist). The FigurePinner database tracks 1,592 Transformers figures across 975 characters, all of them Hasbro, spread across more than twenty distinct lines. Optimus Prime leads with 38 releases, Bumblebee 32, Megatron 29, Starscream 22. The Seekers joke -- "they will repaint Starscream into all of them" -- is visible right there in the data: Thundercracker (14) and Skywarp (11) are just Starscream repaints, and the fandom both mocks and buys every one.' },
      { type: 'p', text: 'Pricing Transformers means knowing the line and knowing one specific disease.' },

      { type: 'h2', text: 'Gold Plastic Syndrome: the vintage value-killer' },
      { type: 'p', text: 'Before anything else, if you are buying vintage G1 or early reissues, learn GPS -- Gold Plastic Syndrome. Certain gold-swirl plastic Hasbro and Takara used in the late 1980s and early 1990s degrades and crumbles with age, regardless of storage. Affected figures (specific Pretenders, certain Decepticon parts, the gold-plastic combiner pieces) can shatter under their own joint tension years later. This is not condition wear; it is a chemical time bomb baked into the plastic. A vintage figure with GPS-prone parts is worth a fraction of a clean example, and "looks fine in the photo" means nothing -- GPS parts fail suddenly. Always ask a vintage seller specifically about stress marks on gold parts.' },
      { type: 'callout', text: 'GPS is the single most important thing to check before paying vintage-G1 prices. The database tracks 126 G1 figures and 76 vintage-G1 reissues -- on the GPS-era pieces, the gold plastic condition sets the value, not the box.' },

      { type: 'h2', text: 'The lines, and where value concentrates' },
      { type: 'p', text: 'The modern Generations ecosystem is enormous and cited wave-by-wave: Studio Series leads the database at 236 figures, then the War for Cybertron trilogy (Siege, Earthrise, Kingdom -- 59, 47, and 50 figures) and its Legacy continuation (Legacy 64, Evolution 58, United 55). Universe (168), Generations (81), Combiner Wars (69), Power of the Primes (46), Titans Return (75). The complaint that comes with all of it is Legacy repaint fatigue -- the line re-releases the same molds in new decos faster than it makes never-made characters, and collectors track reuse-retool-pretool spotting as a sport.' },
      { type: 'p', text: 'Generations-Selects (48) is the Hasbro Pulse online-exclusive subset, and those carry secondary premiums when they sell out because the distribution was online-only. Shattered Glass (12) -- the evil-Autobots/heroic-Decepticons concept -- is a small, collector-targeted niche that holds value for the same scarcity reason.' },

      { type: 'h2', text: 'Masterpiece: the $400 Optimus problem' },
      { type: 'p', text: 'Masterpiece (MP) is the high-end, screen-or-toy-accurate flagship tier -- 171 figures in the database -- and it is where the real money lives and the real arguments happen. The philosophical war is cel-accurate (matching the cartoon) versus toy-accurate (matching the original toy), and it never resolves because both camps are right. A current MP Optimus can run $200-$400 at retail, and the discontinued ones climb hard. Takara-branded Masterpiece releases frequently get better decos than the Hasbro versions, which means the import-versus-domestic premium is a real pricing variable: the Takara version of the same character often commands more.' },
      { type: 'p', text: 'Here is where I will admit the data thins out: the third-party (3P) market -- Fans Toys, MMC, Magic Square and others making unlicensed "not-Grimlock" figures -- runs parallel to the official lines and is openly discussed in the fandom, but those figures are outside the FigurePinner database (we track licensed Hasbro releases). If you are pricing a 3P figure, the official-release comps here are a reference point, not a direct match. The 3P market has its own contraction-and-pricing dynamics that the licensed comps do not capture.' },

      { type: 'h2', text: 'Check any Transformers figure price' },
      { type: 'p', text: '[[FigurePinner|/]] tracks all 1,592 Hasbro Transformers figures across Masterpiece, Studio Series, the full War-for-Cybertron and Legacy waves, Combiner Wars, and vintage G1 -- with eBay sold comp data, so you can separate a GPS-risk vintage piece from a clean one and a sold-out Pulse exclusive from a peg-warming repaint before you pay.' },

      { type: 'h2', text: 'Further reading' },
      { type: 'ul', items: [
        '[[Transformers Collecting Guide: Where to Start|/guides/transformers-collecting-guide]] -- the line-by-line starter for new TF collectors',
      ]},
    ],
  }
  ,
  {
    slug: 'gi-joe-hub',
    title: 'G.I. Joe Price Guide: 1,178 Figures From ARAH to Classified',
    metaTitle: 'GI Joe Price Guide 2026 -- ARAH Vintage, Classified Series & Values | FigurePinner',
    metaDescription: 'G.I. Joe price guide covering 1,178 figures across vintage A Real American Hero, Classified Series, 25th Anniversary, and Super7. Line breakdown, o-ring values, and real eBay sold comps -- updated 2026.',
    dek: '1,178 figures. 792 characters. A 40-year spine of o-ring nostalgia, a 6-inch revival, and a community that treats Larry Hama filecards as scripture. Here is what G.I. Joe actually costs.',
    readingMinutes: 11,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'In the G.I. Joe fandom, the o-ring is an identity, not a spec. The original 1982-1994 A Real American Hero line built figures around an internal rubber o-ring that gave them their articulation, and four decades later that single design choice still defines who is a real collector and who is a tourist (calling the o-ring a defect is a poser tell). The FigurePinner database tracks 1,178 G.I. Joe figures across 792 characters and several distinct eras. ARAH dominates at 483 figures; the modern 6-inch Classified Series has 256; the 25th Anniversary line 140; the Super7 ReAction and collector subsets and the Collectors Club fill out the rest. Snake Eyes leads the character count at 30, Cobra Commander 29 -- and the Snake Eyes count is itself the running joke: the "Snake Eyes tax," where he gets five variants before your favorite character gets one. He is the line\'s Batman.' },
      { type: 'p', text: 'Larry Hama wrote the filecards, and name-dropping him is mandatory respect in this fandom. The lore is the product as much as the plastic.' },

      { type: 'h2', text: 'ARAH vintage: the 483-figure spine' },
      { type: 'p', text: 'The vintage A Real American Hero line (1982-1994) is the foundation of everything, with 483 figures in the database, and its pricing follows classic vintage rules with one Joe-specific wrinkle: completeness is brutal. ARAH figures came with small, easily-lost accessories and -- critically -- the o-ring itself perishes. A vintage Joe with a cracked or missing o-ring is a project, not a complete figure, and the value gap between a complete-with-accessories example and a "figure only, no gear" example is enormous. The filecard and the original weapons matter as much as the figure.' },
      { type: 'p', text: 'Army building drives a specific corner of ARAH value. Cobra troopers, Vipers, and B.A.T.s were meant to be bought in bulk to build a Cobra army, and the one-per-case ratios on certain trooper figures created genuine scarcity that persists on the secondary market. The repaint sub-teams -- Python Patrol, Tiger Force, Night Force -- are their own collecting targets, and the harder repaints command real premiums over the base figures.' },
      { type: 'callout', text: 'For vintage ARAH, "complete" means figure plus all original accessories plus an intact o-ring plus the filecard. Each missing element drops the value a tier. A loose figure with no gear is the floor, not the comp.' },

      { type: 'h2', text: 'Classified Series: the modern revival' },
      { type: 'p', text: 'Classified Series (2020-present, 256 figures) is the 6-inch modern line that finally gave Joes the same premium-collector treatment Marvel Legends gave superheroes. It is the current center of gravity for new collectors, and it has the modern-line pricing pattern: most standard retail figures sell at or near retail, while the Hasbro Pulse exclusives and convention pieces carry secondary premiums. The fandom anxiety attached to Classified is whether the line is winding down -- "Classified slowdown" is a recurring worry -- and that uncertainty makes fan-demanded characters that went Pulse-exclusive harder to get and pricier.' },
      { type: 'p', text: 'A real budget tension shapes the modern market: Hasbro runs both Classified (6-inch) and a retro o-ring line (the 3.75-inch Retro Collection, 31 figures in the database) at the same time, and collectors openly complain that Hasbro "can\'t fund both scales" well. The 25th Anniversary line (2007, 140 figures) was the previous collector golden age before Classified -- thinking serious Joe collecting started with Classified is a poser tell, and the 25th Anniversary figures have their own established secondary market.' },

      { type: 'h2', text: 'Super7 and the rest' },
      { type: 'ul', items: [
        'Super7 ReAction (117 figures) -- vintage-style 3.75-inch throwbacks in the Kenner-retro mold, plus a smaller 34-figure Super7 subset. Collectible but priced as nostalgia novelties rather than the premium tier; value is product-and-character dependent.',
        'Collectors Club (117 figures) -- the club-exclusive releases, often army-builder sets and convention figures with limited production. These run premiums when the specific set was scarce, and the club exclusives are a known checklist target.',
        '3.75 Retro Collection (31) -- the modern o-ring revival at mass retail. Mostly retail-priced, tracking the modern Hasbro distribution pattern.',
      ]},

      { type: 'h2', text: 'Check any G.I. Joe figure price' },
      { type: 'p', text: '[[FigurePinner|/]] tracks all 1,178 G.I. Joe figures across vintage ARAH, Classified Series, the 25th Anniversary line, Super7 ReAction, and the Collectors Club exclusives -- with eBay sold comp data, so you can tell a complete-with-o-ring vintage Cobra trooper from a gearless project figure and a Pulse-exclusive Classified release from a standard retail one before you pay.' },

      { type: 'h2', text: 'Further reading' },
      { type: 'ul', items: [
        '[[G.I. Joe: Classified vs. ARAH Collecting Guide|/guides/gi-joe-classified-vs-arah]] -- the scale-and-era breakdown for new Joe collectors',
      ]},
    ],
  }
  ,
  {
    slug: 'neca-hub',
    title: 'NECA Price Guide: 1,662 Figures Across Horror, Aliens, Predator, and More',
    metaTitle: 'NECA Price Guide 2026 -- Horror, Aliens, Predator, Ultimate Values | FigurePinner',
    metaDescription: 'NECA price guide covering 1,662 figures across horror, Aliens, Predator, sci-fi, Terminator, and TMNT. The Ultimate format, QC and breakage value impact, and real eBay sold comps -- updated 2026.',
    dek: '1,662 figures. 968 characters. The licenses nobody else would touch, the sculpts nobody else could match, and the QC roulette every owner has paid for. Here is what NECA actually costs.',
    readingMinutes: 11,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'The NECA deal is simple and every collector knows it going in: unmatched sculpts and licenses nobody else will touch, in exchange for QC roulette. "His hand fell off in the box" is a whole genre of post in the NECA community, and breakage first-aid -- the freezer trick to loosen a stuck joint, boil-and-pop to reseat a limb -- is assumed knowledge, not advanced technique. The FigurePinner database tracks 1,662 NECA figures across 968 characters and eight different fandoms, because NECA is not a single line -- it is a manufacturer that makes the figures the big companies consider too niche. Genre-movie love first, engineering second.' },
      { type: 'p', text: 'Because NECA spans so many licenses, the price story is really several stories under one brand. Jason Voorhees (17 releases) and the T-800 (18) and Godzilla (14) and Robocop (11) live in completely different sub-markets, but they share a brand-wide value logic worth understanding before you buy any of them.' },

      { type: 'h2', text: 'The Ultimate format is the value tier' },
      { type: 'p', text: 'The single most important NECA concept is the "Ultimate" format -- the window-box-with-flap packaging that comes loaded with swappable heads, hands, and accessories. The database tracks 297 figures in the Ultimate line plus related Ultimate sub-categories. "Ultimate-ize it" is a standing fan demand: when NECA releases a basic version of a character, collectors immediately ask for the deluxe Ultimate treatment. The practical pricing consequence is that Ultimate versions command meaningful premiums over the original basic releases of the same character, and a discontinued Ultimate from a popular franchise routinely sits at double its original retail. When NECA stops making something, it stops -- there is no Hasbro-style endless repack -- so a closed Ultimate run climbs.' },
      { type: 'callout', text: 'NECA figures do not get reissued the way mass-market lines do. When a license lapses or a run ends, it ends. That scarcity is exactly why a sold-out Ultimate from a lapsed license is one of the more reliable secondary-market climbers in the hobby.' },

      { type: 'h2', text: 'Horror, Aliens, Predator: the core franchises' },
      { type: 'p', text: 'NECA built its reputation on horror and sci-fi licenses with massive nostalgia footprints and almost no dedicated collector product before NECA showed up. The horror catalog (Friday the 13th, A Nightmare on Elm Street, Halloween, IT and more) is the brand\'s backbone, and the franchise figures hold value tightly because the fanbase is obsessive and the production runs are finite. The Aliens and Predator lines have their own deep collector base -- the database has dedicated NECA-Aliens (27) and NECA-Predator (25) sub-lines on top of the figures filed under the broader sci-fi and movies categories. The affectionate fandom joke is Predator and Alien repaint fatigue: NECA repaints these two franchises constantly, and collectors complain about it while buying every variant.' },
      { type: 'p', text: 'Randy Falk reveal interviews are appointment viewing in this fandom -- "Randy said maybe" can fuel a year of speculation about a figure that may never ship. The reveal-to-release gap and quiet cancellations are real sore points, and a figure that was revealed and then cancelled before release becomes a phantom grail. License-flex pride is the other side of it: "only NECA would make this" is said with genuine affection about the deep-cut licenses, and those obscure pieces (the one-off movie licenses, the video-game tie-ins -- 18 in the database) are the point, not a weakness.' },

      { type: 'h2', text: 'Condition is the NECA-specific price variable' },
      { type: 'p', text: 'Because of the QC reputation, loose-figure condition matters more for NECA than for almost any other brand. "NECA hands" -- loose wrist pegs and the reused-hand-sculpt meme -- is a brand-wide running joke, and the breakage is real: snapped ankles, stress-cracked joints, accessories that arrived broken. A loose NECA figure with all its swap parts, intact joints, and original accessories is worth substantially more than one missing a hand or with a repaired ankle. Being surprised by breakage is a poser tell here; experienced NECA collectors price the risk in. Do not confuse NECA with Mezco One:12 (the premium rival) or Trick or Treat Studios (the budget rival) -- different brands, different price tiers.' },

      { type: 'h2', text: 'Check any NECA figure price' },
      { type: 'p', text: '[[FigurePinner|/]] tracks all 1,662 NECA figures across horror, Aliens, Predator, Terminator, Godzilla, Robocop, TMNT, and the deep-cut movie and video-game licenses -- with eBay sold comp data, so you can tell an Ultimate from a basic release and a sold-out lapsed-license grail from a current-shelf figure before you pay.' },

      { type: 'h2', text: 'Further reading' },
      { type: 'ul', items: [
        '[[NECA Ultimate Starter Guide|/guides/neca-ultimate-starter-guide]] -- the format-and-license breakdown for new NECA collectors',
      ]},
    ],
  }
  ,
  {
    slug: 'mythic-legions-hub',
    title: 'Mythic Legions Price Guide: 342 Figures From the Four Horsemen',
    metaTitle: 'Mythic Legions Price Guide 2026 -- Four Horsemen Values & Wave Comps | FigurePinner',
    metaDescription: 'Mythic Legions price guide covering 342 figures from Four Horsemen Studios. The crowdfunded closed-run model, why figures hold value, and real eBay sold comps -- updated 2026.',
    dek: '342 figures. 303 characters. A crowdfunded fantasy line built by the studio that sculpted everything you love, sold in closed runs that never restock. Here is what Mythic Legions actually costs.',
    readingMinutes: 9,
    updated: '2026-06-20',
    body: [
      { type: 'p', text: 'Mythic Legions is the line the Four Horsemen make for themselves. The same studio that sculpted MOTU Classics, the modern DC and other licensed work the hobby reveres, launched their own original fantasy line on Kickstarter in early 2015, and it has grown into a deep, interchangeable-parts fantasy universe. The FigurePinner database tracks 342 Mythic Legions figures across 303 characters -- almost one figure per character, which tells you something important about the line\'s value structure: there is very little repaint padding. This is not a line that re-decos the same four heroes a dozen times.' },
      { type: 'p', text: 'The whole pricing model flows from one fact: this is a crowdfunded, closed-run line.' },

      { type: 'h2', text: 'The closed-run model is the entire value story' },
      { type: 'p', text: 'Mythic Legions sells primarily through pre-order and crowdfunding waves. You back the wave, the figures are produced to roughly match demand, and then -- unless the Four Horsemen explicitly announce an All-Stars reissue of a specific figure -- that figure does not come back. There is no perpetual retail availability, no endless Hasbro-style repack. When a wave closes, the secondary market is the only market. This is the structural reason Mythic Legions figures hold value better than almost any mass-retail line: supply is capped at the pre-order window, and demand from people who missed the window has nowhere else to go but resale.' },
      { type: 'callout', text: 'The All-Stars line is the one exception to "closed run, no restock" -- Four Horsemen reissue selected popular figures and parts through All-Stars. A figure available in All-Stars has a softer secondary market than one that has only ever shipped in a single closed wave. Check whether a figure was All-Stars-reissued before paying single-wave-scarcity prices.' },

      { type: 'h2', text: 'Why the parts system matters for value' },
      { type: 'p', text: 'Mythic Legions is built on a shared, interchangeable parts system -- armor, heads, weapons, and limbs swap across figures, and customizers ("builders") buy figures partly to harvest parts for original characters. This creates a value wrinkle you do not see in most lines: a figure can be worth more parted out than whole if it carries a sought-after head sculpt or armor piece, and loose accessory lots and individual parts have their own active secondary market. A complete, carded figure and a "torso and a few parts" lot are genuinely different products with different buyers.' },
      { type: 'p', text: 'I will be precise about where the public numbers get soft: the exact figure-and-wave counts across the line\'s history are debated even among collectors, and the early Kickstarter totals (the first wave funded somewhere around two dozen figures and grew via stretch goals) are general-knowledge baselines rather than numbers anyone has cleanly verified. What is solid is the FigurePinner database count -- 342 figures, 303 characters -- and the closed-run scarcity logic that governs the comps.' },

      { type: 'h2', text: 'Check any Mythic Legions figure price' },
      { type: 'p', text: '[[FigurePinner|/]] tracks all 342 Mythic Legions figures from the Four Horsemen across the crowdfunded waves and All-Stars reissues -- with eBay sold comp data, so you can tell a single-wave closed-run figure from an All-Stars reissue and price a complete figure against a parted-out lot before you pay.' },

      { type: 'h2', text: 'Further reading' },
      { type: 'ul', items: [
        '[[Mythic Legions Collecting Guide|/guides/mythic-legions-guide]] -- the wave-and-parts breakdown for new Mythic Legions collectors',
      ]},
    ],
  },

  {
    slug: 'free-action-figure-price-checker',
    title: 'The Free Action Figure Price Checker (No Login Wall, No Guessing)',
    metaTitle: 'Free Action Figure Price Checker — Real eBay Sold Data | FigurePinner',
    metaDescription:
      'A free action figure price checker built on real eBay sold comps, not active listings or a paywall. See the median, the sample size, and how to read the number before you buy or sell.',
    dek: 'Free is not the hard part. Honest is. Here is what a real price checker actually shows you.',
    readingMinutes: 5,
    updated: '2026-07-19',
    body: [
      { type: 'p', text: 'Search "action figure price checker free" and you get three kinds of results. A price-guide site locked behind an email wall. A static list nobody has touched in three years. Or a page of eBay active listings, sorted high to low, that tells you what sellers hope to get and nothing about what anyone actually paid. None of the three answer the question you actually asked.' },
      { type: 'p', text: 'A real price checker does one thing well: it shows completed sales for the exact figure, not a category of figures that look like it, and it tells you how many sales are behind the number. That is the entire trick, and it is also the reason most "checkers" skip it. Scraping a list of active listings is free. Building real sold-comp data is not, so most sites do not bother.' },

      { type: 'h2', text: 'What a free checker should actually show you' },
      { type: 'p', text: 'No account, no email gate, no card on file to see a median. Search a figure and the page should hand you the real sold price, the range around it, and the sale count the number is built on. On FigurePinner that is pulled from 22,500-plus figures across 16 fandoms, and the free version is the whole product, not a teaser for a paid one.' },
      { type: 'p', text: 'When I check a figure, the median is the second thing I look at. The first is the sale count, because a $40 median built on two sales and a $40 median built on forty are not the same fact, and a checker that will not show you which one you are looking at is hiding the part that matters most.' },

      { type: 'h2', text: 'A worked example, pulled live today' },
      { type: 'ul', items: [
        'Hulk Hogan, WWF Hasbro Series 1 — median $23.00 across 50 tracked sales.',
        'Batman, DC Multiverse (Arkham Asylum) — median $35.99 across 33 sales.',
        'Darth Vader, 6-inch Black Series (A New Hope) — median $28.00 across 30 sales.',
        'Seth Rollins, Ultimate Edition 30 — median $36.00 across 30 sales.',
        '"Stone Cold" Steve Austin, Elite 122 — median $33.98 across 30 sales.',
      ]},
      { type: 'callout', text: 'Every one of those runs 30-plus tracked sales, which is a liquid market — trust the median within a couple of dollars. The number gets noisy fast below that. A figure with three sales in 90 days does not have a price yet, it has a rumor, and a free checker that will not tell you the sample size is hoping you will not ask.' },

      { type: 'h2', text: 'Where a free checker hits a real wall' },
      { type: 'p', text: 'Honest limit, not a sales pitch: about 17 percent of the figures in FigurePinner\'s own catalog have zero tracked sold comps right now. That is not a bug in the tool. It is the market telling you something — a figure nobody has sold recently does not have a reliable price, free or paid, and any site that hands you a confident number for one is making it up. When a figure shows no comps, the correct move is patience or a wider search, not a guess dressed up as data.' },
      { type: 'p', text: 'The same honesty applies to condition. A median built from mixed loose-and-sealed sales is a free number that lies to you slower than a paywall does. [[Read a sold listing properly|/guides/read-ebay-sold-listings]] before you treat any single median as gospel across every condition it might cover.' },
      { type: 'p', text: 'Free only means something if the data behind it is real. [[Look up any figure|/]] and check the sale count before you check the price. A number with no sample size behind it is a guess wearing a nicer font.' },
    ],
  },

  {
    slug: 'whatnot-price-check-before-you-bid',
    title: 'How to Price-Check a Figure Before You Bid on Whatnot',
    metaTitle: 'Whatnot Action Figure Price Check — Know Your Number Before You Bid | FigurePinner',
    metaDescription:
      'The Whatnot countdown clock is built to make you decide fast. Here is how to check a figure\'s real sold price before the show starts, so the clock cannot talk you into overpaying.',
    dek: 'The clock hits zero in ten seconds. That is not when you want to start doing math.',
    readingMinutes: 5,
    updated: '2026-07-19',
    body: [
      { type: 'p', text: 'A Whatnot auction gives you a ten-second countdown, a seller talking over it, and a running list of other bidders you can see in real time. None of that is an accident. It is a format built to make you decide with your gut, and your gut is bad at remembering what a figure actually sold for last month.' },
      { type: 'p', text: 'eBay gives you time. You can sit with a listing for a day, pull comps, sleep on it. A live auction removes that buffer on purpose. Do the pricing work before the show starts, and there is nothing left to decide once the countdown hits except your ceiling number.' },

      { type: 'h2', text: 'Build your ceiling before the stream, not during it' },
      { type: 'p', text: 'If you know a seller is running a wrestling or Star Wars box break tonight, spend ten minutes beforehand pulling real sold medians for anything you might actually want. [[Search FigurePinner|/]] for each name on your list, note the median and the sale count, and write down a number you will not go past. That number is your ceiling. The show is where you execute the decision, not where you make it.' },

      { type: 'h2', text: 'Two numbers the room will not give you' },
      { type: 'p', text: 'The opening banter price is not a comp. A seller talking a figure up to "$80 easy, I have seen these go for way more" is a seller doing the job of a seller. What the last item in the same show closed for is not a comp either — it was a different figure with different demand, in a room that had already spent five minutes working itself up. Neither number is sold data. Both are designed to move you, not inform you.' },
      { type: 'p', text: 'The only number that counts is what real, completed eBay sales say the figure has actually gone for, recently, in the condition you are looking at. I do not care how confident a seller sounds mid-stream — a spoken price is not a comp, and neither is the item that closed two lots ago. The sold-comp median is the one number in the room that was not built to move you.' },
      { type: 'callout', text: 'Sample size still applies live. A figure with 30-plus tracked sales gives you a ceiling you can trust within a couple of dollars. A figure with two or three sales is genuinely thin, and thin markets are exactly where auction adrenaline does the most damage, because there is no solid number to check your bid against in the moment.' },

      { type: 'h2', text: 'The honest limit here' },
      { type: 'p', text: 'FigurePinner\'s sold data comes from eBay, not from Whatnot\'s own closed shows, so a figure that trades mostly on Whatnot may show thinner eBay comps than its real live-auction demand. Treat a thin eBay comp set on a Whatnot-heavy figure as a floor, not the whole picture, and set your ceiling a little looser than you would for a figure that trades everywhere.' },
      { type: 'p', text: '[[Pull the real sold median for anything on your watchlist|/]] before the next stream starts, and decide your ceiling in a quiet room, not a live one with someone else\'s excitement in your ear.' },
    ],
  },

  // ─── Bing-earning orphan recovery, 2026-08-02 (webaudit A1 map) ──────────────────────────
  {
    slug: 'afa-grading-action-figures-worth-it',
    title: 'Is AFA Grading Worth It? When to Pay, When to Skip It',
    metaTitle: 'Is AFA Grading Worth It for Action Figures? | FigurePinner',
    metaDescription:
      'AFA grading costs real money and takes real time. Here is when the premium it adds is worth paying for, and the much larger set of figures where it is a waste.',
    dek: 'A grading fee is a bet that the market pays more for a plastic slab than a sealed box. That bet only wins on specific figures.',
    readingMinutes: 6,
    updated: '2026-08-02',
    body: [
      { type: 'p', text: 'AFA (Action Figure Authority) will grade a sealed or carded figure, seal it in a hard plastic case, and put a number on it — usually 10 to 100, occasionally with qualifiers like Archival or Uncirculated. That number costs money to get, takes weeks to months depending on the service tier, and permanently locks the figure inside the case. Before any of that happens, it is worth asking the only question that actually matters: does grading make the figure worth more than it already was?' },
      { type: 'p', text: 'The honest answer is that grading helps a specific, narrow slice of the hobby and does very little for the rest of it. Knowing which slice you are in saves you a real amount of money.' },

      { type: 'h2', text: 'What grading actually does' },
      { type: 'p', text: 'A numeric AFA grade does two things for a buyer that raw condition claims cannot: it standardizes the assessment (a third party looked at this specific figure, not just the seller\'s word), and it locks the item so the grade cannot degrade between the sale and the buyer\'s hands. For a sealed vintage figure changing hands for real money, both of those are worth something to a buyer who was never going to inspect the item in person anyway.' },
      { type: 'p', text: 'What grading does not do is create value out of nothing. A common figure with a mountain of surviving sealed stock does not become scarce because it is in a graded case. The case adds a service fee and a standardized condition claim on top of whatever the figure was already worth. If the figure was not worth much sealed, it is still not worth much sealed-and-graded, minus the grading fee.' },
      { type: 'callout', text: 'The grading fee is not optional context, it is a real cost that has to clear before the figure is ahead. Standard-tier services commonly run somewhere in the $15 to $30 range per item depending on declared value and turnaround, with premium/expedited tiers costing meaningfully more. That has to come out of the sale price before grading was worth doing.' },

      { type: 'h2', text: 'When grading is worth it' },
      { type: 'ul', items: [
        'Genuine vintage scarcity — figures where the surviving sealed population is small and shrinking (people open the rest over time), and where the ungraded sealed comps already sell for real money. Grading a figure like this adds buyer confidence to an already-thin, already-valuable market.',
        'Grail-tier pieces you plan to sell, not display — if the entire point of owning the figure is eventual resale rather than looking at it on a shelf, a graded case is a selling tool. It removes the buyer\'s biggest objection (how do I know this is really sealed and undamaged) at the cost of the fee.',
        'High first-print or short-run releases with a documented collector premium — where the community already treats a graded example as the reference point for what "top condition" means for that specific release.',
        'Anything you are buying already graded at a fair spread over raw — if the graded premium in the market already exceeds what regrading or buying raw-and-grading yourself would cost, buying pre-graded from a reputable service is often the more efficient path.',
      ]},

      { type: 'h2', text: 'When it is a waste' },
      { type: 'p', text: 'Most modern retail figures are the wrong candidate. Anything still on shelves, anything with an active reissue or re-release, and anything where sealed examples are common rather than scarce will not clear the fee in added value. A modern mainline figure that sells sealed for $25 raw is not going to sell for meaningfully more graded — the case just adds a cost floor the buyer has to pay past, and most buyers of a $25 figure are not shopping in the graded-collectible market at all.' },
      { type: 'p', text: 'It is also a poor fit for anything you intend to open. Grading is a one-way door — a graded case is meant to stay sealed, and cracking it out to display or play with the figure destroys the thing you paid for. If there is any real chance you will want the figure out of the package eventually, do not grade it first.' },
      { type: 'callout', text: 'Before paying a grading fee on anything, check the sold comps for that exact figure already graded — most grading services\' population reports or completed eBay listings will show you whether graded examples of that release actually command a premium over raw sealed. If they do not, the fee buys you a nicer-looking box and nothing else.' },

      { type: 'h2', text: 'The test to run before you send anything in' },
      { type: 'p', text: 'Pull the real sold comps for the figure raw-and-sealed, then pull comps for the same figure already graded at a comparable grade tier. If the graded premium clearly exceeds the grading fee plus turnaround risk, it is worth doing. If the two numbers are close, or if you cannot find enough graded comps to know, treat that thin data as its own answer — a market too small to price reliably is not a market you should be paying a fee to enter.' },
      { type: 'p', text: '[[Look up any figure\'s real sold history|/]] before you decide whether it is a grading candidate. The comps will tell you far more honestly than a case with a number on it ever will.' },
    ],
  },

  {
    slug: 'most-valuable-wrestling-action-figures',
    title: 'The Most Valuable Wrestling Action Figures — Across Every Era',
    metaTitle: 'Most Valuable Wrestling Action Figures Ever Made | FigurePinner',
    metaDescription:
      'From vintage LJN rubber figures to modern Mattel Elite exclusives, here is what actually drives the highest wrestling figure prices — and the pattern behind every one of them.',
    dek: 'Different eras, different companies, same rule: the figures that carry the most money are the ones that got made the least.',
    readingMinutes: 7,
    updated: '2026-08-02',
    body: [
      { type: 'p', text: 'Ask ten wrestling figure collectors which figures are the "most valuable" and you will get ten different answers, because the question spans four decades, at least five major manufacturers, and collecting cultures that barely overlap. A vintage LJN buyer and a modern Mattel Elite chase-variant hunter are not competing for the same plastic, and the two markets do not move together.' },
      { type: 'p', text: 'What ties every high-value wrestling figure together, across every era, is not fame. It is the same rule that governs value in every collecting category: the figures worth the most are the ones where demand outran supply, permanently. Here is where that shows up.' },

      { type: 'h2', text: 'Vintage LJN (1984–1989) — the category vintage collectors chase first' },
      { type: 'p', text: 'LJN\'s rubber WWF Wrestling Superstars line is the foundation of the entire hobby\'s high end. These figures are 40 years old, made of a soft rubber compound that degrades — cracks, splits, loses paint — in a way modern plastic does not, and the surviving clean, complete population shrinks every year regardless of how many collectors want one. That combination — genuine age, genuine material fragility, and a fixed original print run that will never be added to — is the textbook scarcity case. The rarest characters and the cleanest surviving examples, especially with original accessories and belts, are where the vintage market\'s real money lives.' },
      { type: 'h2', text: 'Jakks Classic Superstars and the bridge era (1996–2010)' },
      { type: 'p', text: 'The Jakks era produced figures for a much wider character pool than LJN ever attempted — mid-card and tag-team wrestlers who never got a vintage figure at all sometimes only exist from this era. That matters because a character with exactly one figure made of them, even a mid-card name, can out-price a modern figure of a bigger star for the simple reason that collectors chasing that specific character have exactly one option and nowhere else to look.' },
      { type: 'h2', text: 'Modern Mattel Elite chase variants and exclusives' },
      { type: 'p', text: 'The active market has its own version of the same rule. Mattel\'s Elite line runs mainline releases in high volume, but chase variants — short-packed alternate paint or attire versions within a case — and true retail exclusives (convention-only, single-retailer, WrestleMania Axxess) are deliberately produced in smaller numbers. A chase figure that packed roughly one-in-six in a case, or an exclusive limited to a specific event\'s attendance, is the modern equivalent of the vintage scarcity story, just compressed into months instead of decades.' },
      { type: 'callout', text: 'The word "rare" gets attached to almost every wrestling figure listing regardless of whether it is true. The real signal is not the seller\'s language, it is sales frequency in the actual sold data. A figure with a thin, consistent sold history over months is genuinely scarce. A figure that never appears in sold listings at all might be scarce, or might simply be a figure nobody wants — those look identical until you check demand separately from supply.' },

      { type: 'h2', text: 'Why fame is the weakest predictor' },
      { type: 'p', text: 'The single biggest mistake new collectors make is assuming the biggest star has the most valuable figure. It is almost always backwards. A wrestler who headlined for decades — Hogan, Cena, Undertaker — got figures in nearly every wave of nearly every line for years, and that volume is exactly why their common mainline releases trade cheap. The companies made money printing them precisely because demand was high enough to support enormous supply, and enormous supply is the one thing that keeps a price down no matter how famous the name is.' },
      { type: 'p', text: 'The wrestlers whose figures carry real money tend to be the opposite case: short-tenured, cult-followed, or from an era or company that only ran one or two waves before the license changed or the company folded. Scarcity, not stardom, is the variable that decides the price.' },

      { type: 'h2', text: 'How to actually check before you buy or sell' },
      { type: 'p', text: 'None of the above is a substitute for pulling the actual sold comps on the specific figure you have or want. Era, manufacturer, and character explain why a figure tends to be valuable or common, but the real number comes from what buyers actually paid recently, in the condition you are looking at. [[Look up any wrestling figure\'s real sold history|/wrestling]] before you assume a name is worth what its fame suggests — the data settles it either way.' },
    ],
  },

  {
    slug: 'most-valuable-action-force-figures',
    title: 'The Most Valuable Action Force Figures — Palitoy\'s UK G.I. Joe',
    metaTitle: 'Most Valuable Action Force Figures | FigurePinner',
    metaDescription:
      'Action Force was Palitoy\'s UK line built on the same 3.75-inch scale as G.I. Joe, with its own exclusive characters. Here is what actually drives value across the vintage and modern lines.',
    dek: 'Same scale as G.I. Joe, same era of demand — but a smaller, UK-specific print run that makes scarcity a different equation entirely.',
    readingMinutes: 6,
    updated: '2026-08-02',
    body: [
      { type: 'p', text: 'Action Force is Palitoy\'s UK-market answer to the same 3.75-inch small-scale military-action-figure format that Hasbro built G.I. Joe: A Real American Hero around in the US. The original 1980s Palitoy line shared some tooling and characters with G.I. Joe but also ran its own exclusive figures never sold in the American market, and a more recent Valaverse-led revival has restarted the name for a modern collector audience. Both eras have their own distinct value drivers, and they do not track each other.' },

      { type: 'h2', text: 'The vintage Palitoy line (1980s)' },
      { type: 'p', text: 'The original UK Action Force line ran on a smaller, regionally-limited print scale than its US G.I. Joe counterpart — the entire toy market it sold into was one country instead of the US\'s much larger retail footprint. That alone means fewer of every figure exist today than the equivalent-era G.I. Joe release, before any character-specific scarcity is even considered.' },
      { type: 'ul', items: [
        'UK-exclusive characters carry the real premium — figures that were never released as part of the mainline US G.I. Joe catalog and only existed in the Palitoy line are the ones vintage UK-market collectors specifically hunt, because there is no substitute figure to chase instead.',
        'Card and packaging survival is a bigger factor than for G.I. Joe — UK carded vintage figures are scarcer in high grade than their US counterparts simply because fewer were produced and fewer collectors preserved them at the time.',
        'Vehicles and larger playsets follow the same rule at a steeper angle — bulkier items have a lower survival rate than individual carded figures, and complete, working examples with all original accessories are meaningfully harder to find than the figures themselves.',
      ]},
      { type: 'callout', text: 'A figure being "the UK version" of a G.I. Joe character is not automatically worth more — plenty of shared-tooling figures are common in both markets. The premium belongs specifically to the figures and characters that were unique to Action Force and never had a direct US release.' },

      { type: 'h2', text: 'The modern Valaverse revival' },
      { type: 'p', text: 'The relaunched Action Force line targets today\'s premium collector-figure market — higher articulation counts, more detailed sculpting, and a release cadence built around crowdfunding and limited convention drops rather than mass retail. That production model creates its own scarcity mechanics: early crowdfunded releases, convention exclusives, and low-print-run character variants can carry real secondary-market premiums almost immediately after release, well before any vintage-style aging effect comes into play.' },
      { type: 'p', text: 'The modern and vintage lines are effectively separate collecting hobbies wearing the same name. A vintage-focused UK collector and a modern Valaverse backer are not chasing the same shelf, and a figure\'s value in one line says nothing about value in the other.' },

      { type: 'h2', text: 'What actually moves the number' },
      { type: 'p', text: 'As with every collecting category on this site, the pattern is the same one regardless of era: exclusivity to a specific market or release, low surviving population, and genuine collector demand for that specific character or variant. Fame of the underlying character concept helps far less than whether that exact figure was made in a small run and stayed that way.' },
      { type: 'p', text: '[[Check the real sold history for any Action Force figure|/action-force]] before pricing one — vintage UK exclusives and modern limited variants both trade in genuinely thin markets where a guess and a real comp can be far apart.' },
    ],
  },

  {
    slug: 'most-valuable-g1-transformers',
    title: 'The Most Valuable G1 Transformers — What Actually Carries the Money',
    metaTitle: 'Most Valuable G1 Transformers Figures | FigurePinner',
    metaDescription:
      'G1 Transformers span mainline Hasbro releases, mail-away exclusives, and figures that only existed for one region or one catalog year. Here is what actually separates the common from the grail.',
    dek: 'The original 1984–1990 run is where Transformers collecting started — and where the widest gap between common and grail still lives.',
    readingMinutes: 7,
    updated: '2026-08-02',
    body: [
      { type: 'p', text: 'G1 — Generation 1, the original 1984 through 1990 Hasbro run — is the source material every later Transformers line (Masterpiece, Studio Series, Generations) is either reissuing, reimagining, or paying tribute to. It is also where the collecting market\'s widest value spread lives, because a single toy line running for six years across an era before the internet standardized information produced enormous variance in what actually survived in good shape.' },

      { type: 'h2', text: 'Mail-away and catalog exclusives — the top of the market' },
      { type: 'p', text: 'The G1 line\'s highest-value pieces are overwhelmingly the ones that were never available on a standard retail shelf at all. Mail-away premiums that required cutting proof-of-purchase seals and sending them in with a check, and figures sold only through specific retailer catalogs for one holiday season, had print runs governed by how many people actually completed the redemption process rather than how many the factory could sell. That is a fundamentally smaller and less predictable number than any mainline retail release, and it is the single biggest reason certain G1 figures command prices far above anything else in the line.' },
      { type: 'h2', text: 'Early-year mainline figures in genuinely complete condition' },
      { type: 'p', text: 'G1 predates the modern collecting habit of buying a second example specifically to keep sealed. Most G1 figures that exist today were bought to be played with by a child, and small accessories — guns, Nebulon-style attaching heads, rub-sign stickers, tech specs — are exactly the parts that get lost first. A genuinely complete example of an early-catalog-year figure, with every original small part present and the stickers not aged out, is scarcer than the character\'s fame alone would suggest, simply because completeness did not survive childhood.' },
      { type: 'h2', text: 'Regional exclusives and short international runs' },
      { type: 'p', text: 'Not every G1 figure sold in every market, and some releases were regionally limited to Japan, Europe, or specific years within a single territory. A figure that never had a wide US retail release is scarcer by default to the much larger pool of US-based collectors, the same dynamic that drives value in the vintage Action Force line relative to mainline G.I. Joe.' },
      { type: 'ul', items: [
        'Larger, more mechanically complex figures had a lower survival rate — more moving parts and more play-stress points means more that could break, and broken examples do not command grail prices regardless of the character.',
        'Original packaging survival is scarcer for G1 than almost any later line — vintage 1980s cardboard and blister packaging from a toy bought to be opened does not survive at the same rate collector-market toys from later decades do.',
        'Character prominence in the original cartoon still matters at the margin — an obscure figure with genuine print-run scarcity and zero name recognition has a real but smaller ceiling than a recognizable character with the same scarcity, because demand is part of the equation too, not just supply.',
      ]},
      { type: 'callout', text: 'A common trap: assuming every G1 figure is automatically valuable because the line is 40 years old. Age alone is not scarcity. Plenty of mainline G1 figures from the line\'s biggest sales years are genuinely common in loose condition and trade for modest sums — the grails are a specific, identifiable subset, not the whole catalog.' },

      { type: 'h2', text: 'Checking before you buy or sell' },
      { type: 'p', text: 'G1\'s combination of age, small original parts, and genuinely rare exclusives makes it one of the categories where the gap between an asking price and a real sold comp can be largest. [[Look up any G1 Transformers figure\'s real sold history|/transformers/g1]] before assuming a name or an "exclusive" label in a listing title means what it says — the sold data is the only honest check.' },
    ],
  },
]
