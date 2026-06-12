// Editorial guide articles — long-form, original, collector-voice content.
// Rendered by /guides/[slug]. This is original written content (not data-table
// pages) — the substance Google's reviewers read as a real content site, and
// the SEO surface that ranks for "how to price wrestling figures" etc.
//
// Voice: collector with better data (Meltzer credibility + Russo hooks), per
// FIGUREPINNER-CULTURE-VOICE-GUIDE. Body is an array of blocks rendered as
// semantic HTML by the route. Keep claims specific and accurate.

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'callout'; text: string }

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
  {
    slug: 'how-to-price-wrestling-figures',
    title: 'How to Price a Wrestling Figure (Without Getting Worked)',
    metaTitle: 'How to Price Wrestling Figures — Sold Comps Guide | FigurePinner',
    metaDescription:
      'Stop pricing off asking prices. Learn to value any wrestling figure using real eBay sold comps — condition, completeness, line, and the MOC-vs-loose premium that moves price.',
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
    {
      slug: 'condition-grading-for-collectors',
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
    }
]