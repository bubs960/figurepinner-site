// Article idea backlog — the content engine's fuel.
// The daily draft routine reads this, picks the next ideas where `status: 'idea'`,
// researches + writes them with the action-figure-expert voice, and (on publish)
// the idea's slug moves into articles.ts. Flip `status` to 'drafted' / 'published'
// as ideas move through the pipeline so the routine never repeats a topic.
//
// Ranking: `priority` 1 = highest SEO/AdSense value (broad search intent, evergreen,
// strong voice fit). Tier roughly: 1 = pillar/how-to with real search volume,
// 2 = line/genre intros, 3 = niche/long-tail depth.
//
// `track`: 'wrestling' (core voice strength) | 'cross-genre' (lifts non-wrestling SEO)
// `flagship`: true = candidate for the weekly write-together showpiece (deeper,
// 1,500+ words, original research) rather than the daily auto-draft.

export type BacklogStatus = 'idea' | 'drafted' | 'published'
export type BacklogTrack = 'wrestling' | 'cross-genre'

export interface BacklogIdea {
  id: number
  title: string            // working title — the writer refines on draft
  slug: string             // intended URL slug
  angle: string            // the hook / what makes it non-thin (for the writer)
  track: BacklogTrack
  priority: 1 | 2 | 3
  flagship?: boolean
  status: BacklogStatus
}

export const BACKLOG: BacklogIdea[] = [
  // ───────────────────────── TIER 1 — PILLAR / HOW-TO (highest value) ─────────────────────────
  { id: 1, title: 'How to Tell If a Figure Is Worth Keeping or Selling', slug: 'keep-or-sell-a-figure', angle: 'A decision framework: sentiment vs comps vs trajectory. Teaches the curate stage of collecting.', track: 'wrestling', priority: 1, status: 'published' },
  { id: 2, title: 'Loose vs. MOC: What the Price Gap Actually Is (By Line)', slug: 'loose-vs-moc-price-gap', angle: 'The opener/collector divide as a pricing fact. Data-neutral on the culture, specific on the premium.', track: 'wrestling', priority: 1, flagship: true, status: 'idea' },
  { id: 3, title: 'How to Read an eBay Sold Listing Like a Pro', slug: 'read-ebay-sold-listings', angle: 'Outliers, shill bids, bundle sales, condition mismatches — how to clean a comp set.', track: 'cross-genre', priority: 1, status: 'published' },
  { id: 4, title: 'The Beginner Mistakes That Cost New Collectors the Most Money', slug: 'beginner-collector-mistakes', angle: 'Overpaying for "rare", buying incomplete, ignoring reissues, chasing investment. Evergreen.', track: 'cross-genre', priority: 1, status: 'published' },
  { id: 5, title: 'Are Action Figures a Good Investment? An Honest Answer', slug: 'are-action-figures-a-good-investment', angle: 'The non-hype take. What actually appreciates, what doesn’t, why "investment" is the wrong frame.', track: 'cross-genre', priority: 1, flagship: true, status: 'idea' },
  { id: 6, title: 'How to Store and Display Figures Without Killing Their Value', slug: 'store-and-display-figures', angle: 'Sun-fade, plastic degradation, sticker shock, display cases. Loose + MOC both covered.', track: 'cross-genre', priority: 1, status: 'published' },
  { id: 7, title: 'What "Rare" Actually Means in Action Figure Collecting', slug: 'what-rare-actually-means', angle: 'Short prints vs chase vs exclusive vs reissue. Demolishes the most abused word in the hobby.', track: 'cross-genre', priority: 1, status: 'published' },
  { id: 8, title: 'How to Price a Figure With Almost No Sold Comps', slug: 'pricing-thin-comp-figures', angle: 'Thin-market volatility, adjacent comps, condition laddering. The hardest pricing case.', track: 'cross-genre', priority: 1, status: 'idea' },
  { id: 9, title: 'Chase Variants Explained: Odds, Value, and How to Spot Them', slug: 'chase-variants-explained', angle: 'Pack ratios, how to authenticate a chase, why deco-only chases get faked.', track: 'cross-genre', priority: 1, status: 'idea' },
  { id: 10, title: 'When to Buy a Figure and When to Wait', slug: 'when-to-buy-or-wait', angle: 'Release-day premiums, reissue risk, seasonal price dips, the post-holiday glut.', track: 'cross-genre', priority: 1, status: 'idea' },
  { id: 11, title: 'The Real Cost of Flipping Figures (Fees, Shipping, Time)', slug: 'real-cost-of-flipping-figures', angle: 'eBay/Whatnot fees, shipping, the time tax. Why the "profit" is smaller than it looks.', track: 'cross-genre', priority: 1, flagship: true, status: 'idea' },
  { id: 12, title: 'How to Spot a Reissue Before You Overpay', slug: 'spot-a-reissue', angle: 'The single biggest modern-figure value killer. Reading Hasbro/Mattel reissue signals.', track: 'cross-genre', priority: 1, status: 'idea' },
  { id: 13, title: 'Accessories and Why They Make or Break a Figure’s Price', slug: 'accessories-and-figure-value', angle: 'Loose-incomplete = 30-50% of complete. Which accessories carry the money.', track: 'cross-genre', priority: 1, status: 'idea' },
  { id: 14, title: 'How to Build a Collection on a Budget', slug: 'collecting-on-a-budget', angle: 'Pick a lane, buy the floor, patience over FOMO. Anti-burnout collecting.', track: 'cross-genre', priority: 1, status: 'idea' },
  { id: 15, title: 'Grading and Condition: What Collectors Actually Care About', slug: 'condition-grading-for-collectors', angle: 'Why figures don’t use card-style numeric grading; the loose/complete/MOC/sealed ladder.', track: 'cross-genre', priority: 1, status: 'idea' },

  // ───────────────────────── TIER 2 — LINE / GENRE INTROS (SEO breadth) ─────────────────────────
  { id: 16, title: 'Transformers Collecting: Masterpiece vs Studio Series vs Generations', slug: 'transformers-collecting-guide', angle: 'Three lines, three buyers, three price tiers. Where a beginner starts.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 17, title: 'G.I. Joe Classified vs A Real American Hero: Which to Collect', slug: 'gi-joe-classified-vs-arah', angle: 'Modern 6-inch vs vintage 3.75. Two completely different markets and collectors.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 18, title: 'Masters of the Universe: Origins, Masterverse, and Vintage MOTU', slug: 'motu-collecting-guide', angle: 'The nostalgia engine of the 80s, three modern entry points, vintage value drivers.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 19, title: 'NECA Ultimate Line: A Horror & Film Collector’s Starting Point', slug: 'neca-ultimate-starter-guide', angle: 'Why NECA owns horror/movie figures; what makes an Ultimate worth it.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 20, title: 'McFarlane DC Multiverse: The Budget Superhero Line Explained', slug: 'mcfarlane-dc-multiverse-guide', angle: 'Cheap, deep, divisive QC. What holds value and what pegwarms.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 21, title: 'TMNT Collecting: NECA, Playmates Vintage, and Super7', slug: 'tmnt-collecting-guide', angle: 'Vintage Playmates nostalgia vs NECA premium vs Super7 ReAction.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 22, title: 'Star Wars Vintage Collection vs Black Series: Which Is For You', slug: 'swvc-vs-black-series', angle: '3.75 carded nostalgia vs 6-inch premium. The two pillars of SW collecting.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 23, title: 'Power Rangers Lightning Collection: A Collector’s Guide', slug: 'power-rangers-lightning-collection-guide', angle: 'The line that finally treated Rangers as collector figures. Value drivers + exclusives.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 24, title: 'Spawn Figures: From McFarlane’s 1994 Revolution to Today', slug: 'spawn-figures-guide', angle: 'The line that invented the adult-collector category. Vintage Series 1-35 value.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 25, title: 'Mythic Legions: Why Four Horsemen Figures Hold Value', slug: 'mythic-legions-guide', angle: 'Modular, crowdfunded, scarcity-by-design. The collector-economics case study.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 26, title: 'Thundercats Figures: Super7 Ultimates and LJN Vintage', slug: 'thundercats-figures-guide', angle: 'LJN vintage value parallels wrestling LJN; Super7 modern revival.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 27, title: 'Ghostbusters Collecting: Plasma Series and Kenner Real Ghostbusters', slug: 'ghostbusters-collecting-guide', angle: 'Vintage Kenner RGB nostalgia vs modern Plasma Series.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 28, title: 'Indiana Jones Figures: Adventure Series and Vintage Kenner', slug: 'indiana-jones-figures-guide', angle: 'Small but passionate line; Kenner vintage scarcity.', track: 'cross-genre', priority: 2, status: 'idea' },
  { id: 29, title: 'AEW Figures: Jazwares and the Wrestling Alternative to WWE', slug: 'aew-figures-guide', angle: 'The first real competitor to Mattel WWE in years. Unrivaled line, exclusives, value.', track: 'wrestling', priority: 2, status: 'published' },
  { id: 30, title: 'Marvel Legends X-Men: Building the Definitive Team Shelf', slug: 'marvel-legends-xmen-guide', angle: 'The flagship team-collecting use case; which figures finish a roster and cost the most.', track: 'cross-genre', priority: 2, flagship: true, status: 'idea' },

  // ───────────────────────── TIER 2 — WRESTLING DEPTH (core voice) ─────────────────────────
  { id: 31, title: 'WWE Elite Series Numbers That Are Worth the Most', slug: 'valuable-wwe-elite-series', angle: 'Early series, chase variants, retired exclusives. Which Elites buck the cheap-floor rule.', track: 'wrestling', priority: 2, status: 'idea' },
  { id: 32, title: 'Jakks Ruthless Aggression vs Deluxe Aggression: A Value Guide', slug: 'jakks-aggression-value-guide', angle: 'The bridge-generation figures now climbing. Name-dependent value.', track: 'wrestling', priority: 2, status: 'idea' },
  { id: 33, title: 'Hasbro WWF Figures: The Complete Era Value Breakdown', slug: 'hasbro-wwf-value-breakdown', angle: 'Early vs late series print runs; European exclusives; the action-feature line.', track: 'wrestling', priority: 2, status: 'idea' },
  { id: 34, title: 'LJN WWF: The Rubber Giants and What Clean Ones Cost', slug: 'ljn-wwf-value-guide', angle: 'Condition is the whole comp. The Hulkamania nostalgia engine.', track: 'wrestling', priority: 2, status: 'idea' },
  { id: 35, title: 'Wrestling Figure Grails: The Ones Every Collector Chases', slug: 'wrestling-figure-grails', angle: 'Named grails across eras and why. Nostalgia + scarcity case studies.', track: 'wrestling', priority: 2, flagship: true, status: 'idea' },
  { id: 36, title: 'Mattel WWE Defining Moments: Premium Line, Real Resale?', slug: 'wwe-defining-moments-value', angle: 'Premium retail; which moments hold and which sit at retail.', track: 'wrestling', priority: 2, status: 'idea' },
  { id: 37, title: 'Classic Superstars: Jakks’ Tribute to the WWF Golden Era', slug: 'jakks-classic-superstars-guide', angle: 'Vintage subjects, less-vintage production. An interesting value middle ground.', track: 'wrestling', priority: 2, status: 'idea' },
  { id: 38, title: 'How Wrestler Pushes and Deaths Move Figure Prices', slug: 'how-wrestling-events-move-figure-prices', angle: 'Real-world events as price catalysts. The data behind the spike.', track: 'wrestling', priority: 2, flagship: true, status: 'idea' },
  { id: 39, title: 'Building a Complete WWE Elite Wave: A Completionist Plan', slug: 'complete-wwe-elite-wave', angle: 'Case ratios, the chase figure, loose-vs-MOC lane. Wrestling-specific completion.', track: 'wrestling', priority: 2, status: 'idea' },
  { id: 40, title: 'WCW Figures: The Forgotten Market That’s Quietly Climbing', slug: 'wcw-figures-value-guide', angle: 'Toy Biz/OSFTM WCW nostalgia for the Monday Night Wars generation.', track: 'wrestling', priority: 2, status: 'idea' },

  // ───────────────────────── TIER 3 — NICHE / LONG-TAIL DEPTH ─────────────────────────
  { id: 41, title: 'Build-a-Figure Waves Ranked: Which BAFs Are Worth Chasing', slug: 'best-build-a-figure-waves', angle: 'BAF economics across Marvel Legends history; which complete BAFs hold value.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 42, title: 'Convention Exclusives: Are SDCC and NYCC Figures Worth It?', slug: 'convention-exclusives-worth-it', angle: 'The exclusive premium vs the reissue-as-shared-exclusive trap.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 43, title: 'Retailer Exclusives: Target, Walmart, and the Hunt', slug: 'retailer-exclusives-guide', angle: 'Why exclusives print lower; the fig-hunt culture around restock days.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 44, title: 'Army Builders: Why Collectors Buy the Same Figure Ten Times', slug: 'army-builder-figures', angle: 'Structural demand for troopers/droids; display economics.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 45, title: 'How to Photograph Figures for a Sale That Actually Sells', slug: 'photograph-figures-for-sale', angle: 'Lighting, background, accessory shots, the trust signal of honest photos.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 46, title: 'Writing an eBay Listing That Beats the Comps', slug: 'write-a-better-ebay-listing', angle: 'Title keywords, condition honesty, the loose/complete language collectors search.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 47, title: 'Shipping Action Figures So They Arrive Mint', slug: 'shipping-figures-safely', angle: 'Bubble, box rigidity, MOC protection, insurance thresholds.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 48, title: 'The Psychology of the "One More to Complete the Set" Itch', slug: 'completion-psychology', angle: 'Zeigarnik effect, the completion premium, how to enjoy it without overspending.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 49, title: 'Pegwarmers: Why Some Figures Never Sell (and What It Means)', slug: 'pegwarmers-explained', angle: 'Overproduction signals; what a pegwarmer tells you about a line’s health.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 50, title: 'Prototypes and Test Shots: The Extreme End of Collecting', slug: 'prototypes-and-test-shots', angle: 'Pre-production rarity; authentication; why these are a different game.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 51, title: 'Custom Figures and Kitbashes: Art, Value, and Disclosure', slug: 'custom-figures-and-kitbashes', angle: 'Fan-modified value; the ethics of selling customs as customs.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 52, title: 'How to Insure a Valuable Action Figure Collection', slug: 'insuring-a-figure-collection', angle: 'The legacy stage; documentation, appraisal via comps, rider vs policy.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 53, title: 'Passing On a Collection: What Happens to the Figures', slug: 'passing-on-a-collection', angle: 'The legacy stage. Cataloging, valuation for heirs, selling vs keeping.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 54, title: 'Whatnot for Figure Collectors: How the Auctions Really Work', slug: 'whatnot-for-collectors', angle: 'Live-auction psychology, scarcity urgency, how to not overbid mid-stream.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 55, title: 'The Smell of the Toy Aisle: Why Nostalgia Drives This Hobby', slug: 'nostalgia-drives-collecting', angle: 'The emotional core. Named memories, the demographic value engine.', track: 'cross-genre', priority: 3, flagship: true, status: 'idea' },
  { id: 56, title: 'Sealed vs Opened: The 40% Premium Question, Line by Line', slug: 'sealed-vs-opened-premium', angle: 'Where the MOC premium is biggest and smallest, with the reasoning.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 57, title: 'How Reissues Quietly Crash a Figure’s Resale Value', slug: 'reissues-crash-value', angle: 'Case studies of figures that dropped on reannouncement. Buyer protection.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 58, title: 'The Difference Between a Variant and a Whole New Figure', slug: 'variant-vs-new-figure', angle: 'Deco variants, repaints, re-tools. What collectors will pay separately for.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 59, title: 'Mint on Card: How to Protect and Why It Matters', slug: 'mint-on-card-protection', angle: 'Card protectors, corner crush, the preservation-grade premium.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 60, title: 'Bootleg vs Bootleg: Knockoffs, KO Customs, and Gray-Market Figures', slug: 'bootlegs-and-knockoffs', angle: 'The full counterfeit taxonomy beyond just faked accessories.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 61, title: 'Vintage Star Wars Kenner: The Line That Built the Hobby', slug: 'vintage-star-wars-kenner', angle: '1977-85 Kenner; the rocket-Fett legend; why this era set "keep it sealed" culture.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 62, title: 'Mego 8-Inch Figures: The Original Collector Category', slug: 'mego-figures-guide', angle: '1972-83 Mego, the bankruptcy scarcity story, the 2018 revival.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 63, title: 'How Print Runs Decide What a Modern Figure Is Worth', slug: 'print-runs-and-value', angle: 'Case-pack ratios, shortpacks, the math behind day-one scarcity.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 64, title: 'Seasonal Figure Pricing: When the Market Goes Up and Down', slug: 'seasonal-figure-pricing', angle: 'Post-holiday glut, tax-refund buying, SDCC hype, the collector calendar.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 65, title: 'Reading Feedback: How to Vet an eBay Figure Seller', slug: 'vet-an-ebay-seller', angle: 'Account age, feedback patterns, stock-photo red flags on grails.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 66, title: 'The Math of "Complete in Box" vs "Complete Loose"', slug: 'cib-vs-complete-loose', angle: 'Three condition tiers and the real spread between them.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 67, title: 'Super7 ReAction Figures: Retro Style, Modern Market', slug: 'super7-reaction-guide', angle: 'The Kenner-homage format; licensing breadth; what holds value.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 68, title: 'Hot Toys and the Premium Tier: Worth the $200+?', slug: 'hot-toys-premium-tier', angle: 'The sixth-scale premium market; resale reality; who it’s for.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 69, title: 'Diamond Select and the Mid-Tier Collector Lines', slug: 'diamond-select-guide', angle: 'The often-overlooked middle market; where value hides.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 70, title: 'How to Start Collecting a Line That’s Already 200 Figures Deep', slug: 'starting-a-deep-line', angle: 'The pick-a-lane strategy applied to any overwhelming line.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 71, title: 'Why Two Figures of the Same Character Cost Wildly Different Amounts', slug: 'same-character-different-price', angle: 'Era, maker, line, scarcity. The Hogan-across-eras case study.', track: 'wrestling', priority: 3, status: 'idea' },
  { id: 72, title: 'The Attitude Era Figure Market: Nostalgia Hits Its Stride', slug: 'attitude-era-figure-market', angle: 'The Jakks-era collectors aging into spending. A demographic forecast.', track: 'wrestling', priority: 3, status: 'idea' },
  { id: 73, title: 'NWO and Faction Figures: Collecting the Storylines', slug: 'nwo-faction-figures', angle: 'Story-driven collecting; completing a faction roster.', track: 'wrestling', priority: 3, status: 'idea' },
  { id: 74, title: 'Women’s Wrestling Figures: A Growing Collector Market', slug: 'womens-wrestling-figures', angle: 'The expanding roster and its collector base; scarcity of early releases.', track: 'wrestling', priority: 3, status: 'idea' },
  { id: 75, title: 'Ring and Playset Accessories: The Overlooked Value', slug: 'wrestling-rings-and-playsets', angle: 'Rings, cages, announce tables. The display ecosystem and its market.', track: 'wrestling', priority: 3, status: 'idea' },
  { id: 76, title: 'Entrance Gear and Why It Adds Real Money', slug: 'entrance-gear-value', angle: 'The accessory premium applied to wrestling specifically.', track: 'wrestling', priority: 3, status: 'idea' },
  { id: 77, title: 'Mattel Retro Series: Hasbro Nostalgia on Modern Bodies', slug: 'mattel-retro-series-guide', angle: 'The line built to scratch the Hasbro itch; value vs the originals.', track: 'wrestling', priority: 3, status: 'idea' },
  { id: 78, title: 'Major Bendies and Big Rubber Guys: The Collector-Made Lines', slug: 'major-figures-guide', angle: 'Cardona/Myers collector-first lines; limited-run scarcity model.', track: 'wrestling', priority: 3, status: 'idea' },
  { id: 79, title: 'How to Complete a Vintage Hasbro WWF Set in 2026', slug: 'complete-hasbro-wwf-set', angle: 'A real completion plan for a finite vintage line; the chase figures.', track: 'wrestling', priority: 3, status: 'idea' },
  { id: 80, title: 'The First Figure You Ever Owned: A Collector’s Origin Stories', slug: 'first-figure-origin-stories', angle: 'Community-emotion piece; the discovery stage of the lifecycle.', track: 'wrestling', priority: 3, status: 'idea' },
  { id: 81, title: 'Star Wars Black Series Reissues: The Reannouncement Trap', slug: 'black-series-reissue-trap', angle: 'Line-specific reissue cadence and how it caps prices.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 82, title: 'Marvel Legends Two-Packs and Boxed Sets: Value Hideouts', slug: 'marvel-legends-boxed-sets', angle: 'Lower print runs; team sets; which hold value.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 83, title: 'Transformers Masterpiece: When a Figure Is Worth $300', slug: 'transformers-masterpiece-value', angle: 'The premium TF tier; engineering as value; resale reality.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 84, title: 'G.I. Joe ARAH File Cards and Complete-Figure Value', slug: 'gi-joe-arah-completeness', angle: 'The accessory-and-filecard completion standard unique to ARAH.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 85, title: 'Vintage MOTU: Why He-Man Figures Still Command Premiums', slug: 'vintage-motu-value', angle: 'The 80s nostalgia engine; condition + completeness drivers.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 86, title: 'How NECA Builds Scarcity Into Horror Figures', slug: 'neca-scarcity-model', angle: 'Limited licenses, discontinued molds; the horror-season demand spike.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 87, title: 'Reading a Figure’s Price History Like a Chart', slug: 'reading-price-history', angle: 'Trend lines, spikes, the difference between a blip and a real move.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 88, title: 'The Difference Between Median, Average, and Last Sold', slug: 'median-average-last-sold', angle: 'Why median beats average for figure pricing; outlier resistance.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 89, title: 'When a "Deal" Is Actually a Warning Sign', slug: 'when-a-deal-is-a-warning', angle: 'Below-comp pricing as a fake/scam/swap signal. Buyer protection.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 90, title: 'How to Catalog a Collection You’ve Never Inventoried', slug: 'catalog-your-collection', angle: 'The organize stage; valuation via comps; the vault concept.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 91, title: 'Trade Bait: When a Figure Is Worth More in Trade Than Cash', slug: 'trade-bait-strategy', angle: 'Trade economics; using comps to value both sides fairly.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 92, title: 'The Pre-Order Decision: Lock In or Wait for Comps?', slug: 'pre-order-decision', angle: 'Pre-order premiums vs post-release dips; reissue risk.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 93, title: 'Yellowing, Fading, and Plastic Rot: Condition Killers Explained', slug: 'condition-killers-explained', angle: 'The chemistry of figure degradation and how to prevent it.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 94, title: 'How Many Comps Do You Need to Trust a Price?', slug: 'how-many-comps-to-trust', angle: 'One sale is an anecdote, five is a market. Statistical intuition for collectors.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 95, title: 'Collecting by Sculptor: When the Artist Drives the Value', slug: 'collecting-by-sculptor', angle: 'The Four Horsemen / McFarlane auteur premium.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 96, title: 'The Beginner’s Glossary: 30 Collector Terms Decoded', slug: 'collector-glossary', angle: 'MOC, BAF, chase, pegwarmer, grail, kitbash. SEO-rich reference page.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 97, title: 'Why Some Lines Hold Value and Others Collapse', slug: 'why-lines-hold-or-collapse', angle: 'Overproduction, license loss, fanbase size. Line-health forecasting.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 98, title: 'The Honest Guide to Selling Your Childhood Collection', slug: 'selling-childhood-collection', angle: 'The emotional + practical reality; comp-based valuation; where to sell.', track: 'cross-genre', priority: 3, flagship: true, status: 'idea' },
  { id: 99, title: 'Display Cases, Lighting, and Building a Collection Room', slug: 'building-a-collection-room', angle: 'The identity/display drive made physical; UV protection; the showcase.', track: 'cross-genre', priority: 3, status: 'idea' },
  { id: 100, title: 'From Discovery to Legacy: The Seven Stages of a Collector', slug: 'seven-stages-of-a-collector', angle: 'The full emotional lifecycle as a narrative pillar piece.', track: 'cross-genre', priority: 3, flagship: true, status: 'idea' },
]

// Helper the daily routine uses: next N ideas not yet drafted/published,
// highest priority first, then lowest id (stable ordering).
export function nextIdeas(n: number, excludeFlagship = true): BacklogIdea[] {
  return BACKLOG
    .filter((i) => i.status === 'idea' && (!excludeFlagship || !i.flagship))
    .sort((a, b) => a.priority - b.priority || a.id - b.id)
    .slice(0, n)
}
