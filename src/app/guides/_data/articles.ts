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
        'Vintage (LJN 1984–89, Hasbro WWF 1990–94) — driven by nostalgia and scarcity. The 80s/90s kids who owned these are now in their peak earning years, and that demand is not going away. LJN rubber figures in clean shape carry serious premiums.',
        'Jakks era (1996–2010) — the bridge generation. Ruthless Aggression and Deluxe Aggression have devoted collectors and surprisingly strong comps on the right names.',
        'Mattel Elite (2010–present) — the modern standard. Deep, ongoing, and where most active trading happens. Chase variants, exclusives, and early series numbers carry the value here.',
      ]},
      { type: 'p', text: 'Knowing the era tells you who is buying and why. A vintage Hasbro buyer is buying 1991 back. An Elite buyer is completing a current run. Different emotion, different price behavior.' },

      { type: 'h2', text: 'Rule four: scarcity is a number, not a vibe' },
      { type: 'p', text: '"Rare" is the most abused word in the hobby. Everything is "rare" in a listing title. Scarcity that actually moves price is specific and measurable: a chase variant that packed out at roughly 1-in-6, a retailer exclusive, a convention figure, a short-printed series. If you cannot point to why a figure is scarce, assume it is not, and price it like the common version it probably is.' },
      { type: 'callout', text: 'The honest scarcity signal is sales frequency. A figure with four sales in 90 days is liquid — you know the price. A figure with one sale in a year is genuinely scarce, but it also means the next sale could land anywhere. Thin markets are volatile in both directions.' },

      { type: 'h2', text: 'Putting it together' },
      { type: 'p', text: 'Pricing a figure is four questions, in order. What did the last several actually sell for? What condition were those, and does it match mine? What line and era is this, and who buys it? And is there a real, specific scarcity reason it should sell above the common version? Answer those honestly and you will price like someone who has been doing this for years.' },
      { type: 'p', text: 'That is exactly what FigurePinner does for you on every figure page — real eBay sold comps, median, range, and how many sales backed the number, so you are working from the truth instead of the wishlist. Look up any figure and you will see the sold data first. The whole point is that you never have to take an asking price at face value again.' },
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
    title: 'Completing a Wave: The Completionist’s Guide (and the BAF Trap)',
    metaTitle: 'How to Complete an Action Figure Wave — Completionist Guide | FigurePinner',
    metaDescription:
      'The smart way to finish a figure wave without overpaying for the last piece. How Build-a-Figure waves work, why the final figure costs the most, and how to plan completion with sold data.',
    dek: 'The last figure in the wave is the one that costs you. Here is how to finish the set without getting taken.',
    readingMinutes: 7,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'Every collector knows the feeling. You have eleven of the twelve. The shelf looks almost right — and that "almost" is louder than the eleven you already own. Your brain will not let it go. That itch is real, it has a name, and the entire toy industry is built to exploit it. Understanding how completion actually works is how you finish sets you love without paying grail money for a figure that should cost twenty bucks.' },
      { type: 'p', text: 'This is the completionist’s guide: how waves are built, where the cost hides, and how to plan a finish instead of panic-buying the last piece.' },

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

      { type: 'h2', text: 'The completionist’s actual playbook' },
      { type: 'p', text: 'Finishing a wave well is about sequencing and patience, not speed. The collectors who complete sets without bleeding money follow roughly the same approach.' },
      { type: 'h3', text: 'Buy the hard one first, not last' },
      { type: 'p', text: 'This is the counterintuitive move that saves the most money. The shortpacked figure only gets more expensive as more collectors get deep into the set and start hunting the same final piece. If you know going in which figure is the chase, buy it early when it is just another figure on the peg — before it becomes everyone’s last piece.' },
      { type: 'h3', text: 'Know the case ratio before you start' },
      { type: 'p', text: 'A wave where every figure packs evenly is a wave you can complete at a steady pace. A wave with a known shortpack is one where you move on that figure the moment you see it. Walking in knowing which is which changes the whole hunt.' },
      { type: 'h3', text: 'Decide loose-vs-sealed before you buy, not during' },
      { type: 'p', text: 'Completing a wave MOC is a different budget and a different difficulty than completing it loose, and mixing the two leaves you with a shelf that looks inconsistent. Pick the lane up front. The opener finishing a loose set and the MOC collector finishing a sealed run are playing two different games — and the sealed game is almost always the more expensive one.' },

      { type: 'h2', text: 'Use the data to plan the finish' },
      { type: 'p', text: 'The single biggest completionist mistake is paying the panic price for the last figure when a little patience would have gotten it cheaper. Sold comps tell you whether the price you are seeing is the real market or just the finish-the-set tax. A figure with steady sales at a stable number is one you can wait on. A figure with almost no comps and wild swings is one to grab when a fair one appears, because the next fair one might not come soon.' },
      { type: 'callout', text: 'Completion percentage is satisfying to watch climb — but the last 10% is where collectors overspend. Let the comps, not the itch, set your ceiling on the final piece.' },

      { type: 'h2', text: 'The bottom line' },
      { type: 'p', text: 'The drive to complete a set is one of the best parts of collecting and one of the easiest to get exploited. Waves are engineered so the last figure costs the most, and BAFs are engineered so you buy figures you never wanted. None of that is a reason to stop — it is a reason to plan. Buy the hard piece early, know your case ratios, pick your lane, and let sold data set your limit on the finish.' },
      { type: 'p', text: 'FigurePinner is built for exactly this. Track your wave, watch your completion percentage climb, and check the real sold comps on the figures you still need — so when you finally close out the set, you finished it on your terms instead of the seller’s.' },
    ],
  },

  {
    slug: 'star-wars-black-series-starter-guide',
    title: 'Star Wars Black Series: A Collector’s Starting Point',
    metaTitle: 'Star Wars Black Series Collecting Guide for Beginners | FigurePinner',
    metaDescription:
      'New to the 6-inch Star Wars Black Series? A collector’s guide to the packaging eras, what drives value, exclusives and reissues, and how to start collecting without overpaying.',
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
        'Red line (2015–2020) — the long-running era most collectors picture; the bulk of the line’s depth was built here.',
        'The current numbered Galaxy collection — figures sorted into individual collections, the packaging you will find at retail now.',
      ]},
      { type: 'p', text: 'A new collector does not need to memorize this, but recognizing orange packaging on a secondary listing — and understanding why it commands more — is the difference between paying a fair early-era premium and overpaying out of ignorance.' },

      { type: 'h2', text: 'What actually drives Black Series value' },
      { type: 'p', text: 'The line is enormous, so most figures are affordable and easy to find. Value concentrates in a few predictable places, and learning them protects you from the two beginner mistakes: overpaying for a common figure and underpaying attention to a genuinely scarce one.' },
      { type: 'ul', items: [
        'Early-era figures — the orange and blue waves were produced in smaller numbers before the line’s popularity exploded. Clean early figures, especially the marquee characters, carry real premiums.',
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
      'A beginner’s guide to collecting Marvel Legends — the ToyBiz and Hasbro eras, how Build-a-Figure waves work, what drives value, and how to start a focused collection with real sold data.',
    dek: 'Twenty-plus years deep, hundreds of figures, and one mechanic designed to make you buy more than you meant to. Start smart.',
    readingMinutes: 7,
    updated: '2026-06-06',
    body: [
      { type: 'p', text: 'Marvel Legends is the deepest superhero figure line ever made and, for a new collector, the most overwhelming. It has been running for more than two decades, across two different manufacturers, with a Build-a-Figure system specifically engineered to get you to buy figures you did not plan on. That depth is the appeal — almost every character you care about exists, often in several versions — but it is also the trap. A little orientation goes a long way.' },
      { type: 'p', text: 'Here is the starting point: the two eras, how the BAF works, what carries value, and how to collect a line this big without it collecting your wallet.' },

      { type: 'h2', text: 'The two eras: ToyBiz and Hasbro' },
      { type: 'p', text: 'Marvel Legends began in 2002 under ToyBiz, as a spin-off of the Spider-Man Classics line, and the early ToyBiz figures established the line’s identity: comic-accurate, six-inch, heavily detailed, with elaborate bases and packaging. ToyBiz ran the line for sixteen series before the license changed hands. On January 1, 2007, Hasbro took over Marvel Legends, and Hasbro has produced the line ever since — a far longer run than ToyBiz, and the source of the overwhelming majority of figures in the wild today.' },
      { type: 'p', text: 'For a new collector, the era matters for two reasons. ToyBiz-era figures have a distinct sculpting style and a vintage-collector following, and the better ToyBiz pieces carry real premiums. Hasbro-era figures are where almost all current and recent collecting happens, with deeper articulation and an ongoing release cadence you can actually keep up with.' },

      { type: 'h2', text: 'The Build-a-Figure, explained' },
      { type: 'p', text: 'The defining mechanic of Marvel Legends is the Build-a-Figure, and you cannot understand the line’s pricing without it. ToyBiz introduced the BAF in 2005 with series 9 — fittingly, the first one was Galactus, the devourer of worlds. Each figure in a wave includes one piece of a larger bonus figure; buy the whole assortment and you can assemble a character that is not sold on its own. Hasbro kept the mechanic, and it remains central to the line.' },
      { type: 'callout', text: 'The BAF is why a Marvel Legends wave is priced as a set, not as individual figures. The least popular figure in a wave is often packed with the most-wanted BAF piece — which means that "boring" figure sells out anyway, because completionists need the limb. Understanding this saves you from overpaying for a single BAF piece later.' },
      { type: 'ul', items: [
        'A complete loose BAF on the secondary market carries a premium — you are paying for someone else having bought the whole wave.',
        'Individual BAF pieces trade on their own, and the piece packed with the popular figure is usually the one that holds collectors up.',
        'Buying the full wave at retail as it drops is almost always the cheapest path to the complete BAF.',
      ]},

      { type: 'h2', text: 'What drives Marvel Legends value' },
      { type: 'p', text: 'With hundreds of figures in circulation, most Marvel Legends are affordable — the line’s depth keeps the floor low. Value concentrates in familiar places, and a few of them are specific to this line.' },
      { type: 'ul', items: [
        'ToyBiz-era figures — the early sculpts with a dedicated collector base; the strong ones carry vintage-style premiums.',
        'Build-a-Figure completeness — a loose figure with its correct BAF piece is worth more than one without; complete assembled BAFs command their own price.',
        'Exclusives and two-packs — retailer exclusives, convention figures, and boxed sets print in lower numbers.',
        'X-Men and fan-favorite teams — team-based collecting drives demand; collectors completing a roster pay up for the figures that finish it.',
        'No-reissue characters — like most modern lines, Hasbro reissues popular characters, which caps prices; the figures it has not revisited stay scarcer.',
      ]},

      { type: 'h2', text: 'How to start a line this big' },
      { type: 'p', text: 'Nobody collects all of Marvel Legends, and trying is how new collectors burn out and overspend. The collectors who enjoy the line pick a lane: a single team (the X-Men are the classic choice), a single character’s variants, a specific era, or the figures from films and shows they love. A focused display is more satisfying and dramatically cheaper than chasing everything, and it gives you a clear answer to "do I need this one?"' },
      { type: 'p', text: 'Buy current waves at retail when you can — that is the price floor — and reserve secondary-market spending for the specific older or exclusive figures your collection actually needs. Before any of those purchases, check the real sold comps. Marvel Legends has a notably wide gap between asking and sold prices, especially on figures labeled "rare" that may simply be pre-reissue. Look the figure up on FigurePinner first, and you will know whether the price in front of you is the market or the wishlist.' },
    ],
  },

  {
    slug: 'keep-or-sell-a-figure',
    title: 'Keep It or Sell It? A Collector’s Decision Framework',
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
      { type: 'p', text: 'If a figure survived the sentiment check as a possible sell, now you need its real number. Not the active listings — those are asking prices, what sellers hope to get. The number that matters is what the last several actually sold for. On eBay, that means filtering to Sold Items, pulling the most recent five to ten comps in your figure’s condition, throwing out the obvious outliers, and taking the median of what is left.' },
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
        'Real-world catalysts — a Hall of Fame induction, a return, or sadly a death can spike a wrestler’s figures fast. If a figure already ran up on news, you may be looking at a temporary peak, not a new floor.',
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
      { type: 'p', text: 'A sold price is meaningless until you know what condition sold. The community’s opener-versus-MOC split is also a pricing fault line, and a figure can carry wildly different numbers depending on which side of it the sale was on.' },
      { type: 'ul', items: [
        'MOC / sealed sales sit at the top and are the thinnest, most volatile slice of comps.',
        'Loose-complete sales are the workhorse baseline — the cleanest read on a figure’s everyday value.',
        'Loose-incomplete sales sit well below complete ones, because a missing belt or accessory routinely knocks off a third or more.',
      ]},
      { type: 'p', text: 'If you have a loose figure, comparing it to MOC sold listings is not optimism, it is a mistake — and it is exactly how people convince themselves their shelf is worth triple what it is. Filter to your condition and price against the right comparison, not the flattering one.' },

      { type: 'h2', text: 'The four sales that lie to you' },
      { type: 'p', text: 'Even after you have the right figure in the right condition, individual sales can still mislead. Four patterns to flag and usually throw out:' },
      { type: 'ul', items: [
        'Bundle sales — that $240 was four figures in one lot. The listing photo is a crowd shot and the title says "lot." It tells you nothing about a single figure’s value. Discard it.',
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
        'Supreme Collection — the premium tier, introduced in 2022, positioned as AEW’s answer to high-end collector formats with typically two figures per series. This is where the deluxe accessories and the higher price point live.',
      ]},
      { type: 'callout', text: 'When you pull comps on an AEW figure, identify the line first. A Supreme figure and a standard Unrivaled figure of the same wrestler are different products at different price points — comparing one against the other is how people misprice the whole line.' },

      { type: 'h2', text: 'The exclusives that actually matter' },
      { type: 'p', text: 'Like every modern line, AEW has retailer and online exclusives, and the usual scarcity rules apply — a genuinely sold-out exclusive commands a premium, a quietly restocked one does not. But the AEW line has one exclusive story that stands out for a reason that has nothing to do with pack ratios.' },
      { type: 'p', text: 'AEW secured a merchandise deal that allowed Jazwares to produce Owen Hart figures — something WWE was unable to do for years following the legal disputes after his death. For a generation of collectors, an Owen Hart figure was simply not a thing you could buy new. That makes those releases significant beyond the usual exclusive math: they fill a gap the dominant brand could not.' },
      { type: 'p', text: 'Sting is the other name to know. His arrival in AEW produced multiple figures across all three lines, capturing different eras of his look — which means there is real depth (and real collecting) just within the Sting subset.' },

      { type: 'h2', text: 'How the AEW market behaves' },
      { type: 'p', text: 'AEW figures trade differently from WWE in a few predictable ways, and understanding them keeps you from misreading the comps.' },
      { type: 'ul', items: [
        'The roster is younger and more volatile. Wrestler value tracks the push — a star getting featured TV time moves their figure, and a departure or a cooled-off run softens it. AEW’s roster turns over faster than WWE’s legends-heavy catalog.',
        'Chase and rare editions exist within series, so check whether the figure you are pricing is the standard release or the variant before you trust a comp.',
        'Print runs run smaller than WWE’s mainline at the same tier, which can make desirable figures dry up faster — but also makes the market thinner and the comps choppier. Fewer sales means more price uncertainty.',
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
]
