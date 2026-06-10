import type { Article } from './articles'
// Drafts awaiting Steve's review. The daily content engine appends here; Steve
// moves approved articles into articles.ts and deploys, then this file is emptied.
// Empty = nothing pending review.
//
// 2026-06-06: batch of 3 (ids 6, 7, 29) reviewed, fact-verified, merged into
// articles.ts, backlog flipped to published. Staging reset.
// 2026-06-07: batch of 3 staged (ids 8, 9, 10) — pricing-thin-comp-figures,
// chase-variants-explained, when-to-buy-or-wait. Fees/ratios web-verified. Awaiting review.
// 2026-06-08: batch of 3 appended (ids 12, 13, 14) — spot-a-reissue,
// accessories-and-figure-value, collecting-on-a-budget. eBay FVF (14.9%+$0.40)
// and Whatnot (8%+2.9%+$0.30) web-verified. Awaiting review.
// 2026-06-09: batch of 3 appended (ids 15, 16, 31) — condition-grading-for-collectors,
// transformers-collecting-guide, valuable-wwe-elite-series. Fees/prices kept qualitative
// or web-verified (Studio Series Deluxe ~$37-50, Voyager ~$50-60 retail). Awaiting review.
// 2026-06-10: batch of 3 appended (ids 17, 18, 32) — gi-joe-classified-vs-arah,
// motu-collecting-guide, jakks-aggression-value-guide. Line-history facts web-verified
// (Classified 2020 launch ~$19.99, Origins 2020, Masterverse 2021, Deluxe Aggression 2005);
// all dollar values otherwise qualitative. Awaiting review.
// ⚠️ 12 total drafts staged (ids 8-10, 12-16, 31, 17-18, 32) — FOUR unreviewed batches
// piling up. Steve: review oldest batch first.
export const STAGED_DRAFTS: Article[] = [
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
      { type: 'p', text: 'The scarcity gradient is steep: complete loose examples are more common than mint-on-card, but far rarer than bare figures once you account for all the accessories that went missing over the years. The market prices that gradient accordingly. Complete routinely commands 40–80% more than incomplete for the same figure in the same condition — and for specific pieces, the gap is wider.' },
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

      { type: 'h2', text: 'Ruthless Aggression: the era’s workhorse line' },
      { type: 'p', text: 'The Ruthless Aggression mainline launched in 2003, named for the on-screen era it covered, and ran as the backbone of WWE figure retail for the rest of the decade. The figures stood around seven inches with the era’s standard articulation — shoulders, elbows, hips, knees — and Jakks produced them in enormous quantities across dozens of numbered series plus a sprawl of sublines, multipacks, and exclusives.' },
      { type: 'p', text: 'That production scale is the single most important fact about pricing this line. The roster coverage was exhaustive and the print runs were huge, so the floor — midcard names from heavily shipped series — remains genuinely cheap, loose or carded. The value is not in the line. It is in specific figures the market decided to want.' },

      { type: 'h2', text: 'Deluxe Aggression: the articulation tier' },
      { type: 'p', text: 'Deluxe Aggression debuted in 2005 as the premium-articulation counterpart — bulkier figures with significantly more poseability, opening with a Series 1 lineup of Batista, John Cena, Kurt Angle, Randy Orton, Rey Mysterio, and Triple H. It was the era’s answer to the collector who wanted figures that could actually hit a Pedigree, and it ran for years alongside the mainline.' },
      { type: 'p', text: 'On the secondary market, Deluxe Aggression behaves like a parallel track rather than a strictly more valuable one. The same rule applies — the wrestler drives the price — but the deluxe format adds a wrinkle: these figures came loaded with larger builds and distinctive sculpts that some collectors specifically chase, and carded examples in clean condition are thinner on the ground than the mainline equivalents.' },

      { type: 'h2', text: 'The rule: value follows the name, not the line' },
      { type: 'p', text: 'Forget series numbers for a moment. The Jakks-era market is a roster market, and the premiums concentrate in predictable places:' },
      { type: 'ul', items: [
        'Wrestlers who died or left the spotlight — figures of names with no modern Mattel refresh carry scarcity the catalog never planned, because demand has nowhere else to go.',
        'First-figure releases — the earliest Jakks figure of a star who later became an icon is the one that climbs, the same dynamic as a rookie card.',
        'Late-series and short-shipped waves — as retail interest cooled toward the end of the Jakks license, cases shipped lighter, and those later series are quietly the scarcest in the run.',
        'Exclusives and chase variants — ring-gear variants, retailer exclusives, and limited releases that bypassed the giant mainline print runs.',
        'MOC condition on A-list names — loose commons stay cheap, but clean carded examples of the era’s top stars are where the real spread between loose and carded shows up.',
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
]
