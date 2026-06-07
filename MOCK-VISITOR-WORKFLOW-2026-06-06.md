# Mock Visitor Workflow — Round 2 (2026-06-06)

Goal: feed web chat what it can't see itself (the rendered site through a
visitor's eyes). Last run gave a score; this run should give **reasons**.

---

## For each reviewer, capture 3 things (this is the whole ask)
1. **Figure / page tested** (URL or name)
2. **Did you bounce? Where?** — which zone: nav, hero image, price strip,
   lore/story, market panel (eBay sales), CTAs, footer
3. **One-line reason** — what triggered the wince or the trust drop
   (e.g. "price felt made-up", "page looked empty", "thumbnail ugly",
   "didn't believe the comp count", "didn't know what to do next")

A tagged reason list converts straight into fixes. A number alone does not.

---

## Key areas to pay attention to (the 6 that matter most)

1. **The 10-second believe test.** Land cold on a figure page. Do you trust the
   price enough to use it before a Whatnot bid? If not — what's missing?

2. **Zero-comp / no-data pages.** Many figures have NO sold data yet. What does
   that page make you feel — "broken site" or "they're honest, I'll come back"?
   What would keep you from bouncing?

3. **First impression / credibility.** Does this read like a real price tool or a
   scraped data dump? Name the exact thing that makes it feel cheap, if it does.

4. **Mobile.** Most collectors check prices on their phone mid-show. Is the page
   usable one-handed? Does the price strip / market panel survive a small screen?

5. **"What do I do next?"** After seeing a price, is the next step obvious
   (search eBay, save it, browse the line) — or is it a dead end?

6. **Names & data that look wrong.** Garbled figure names, wrong line/series,
   broken or stock-photo images, prices that look impossible. Flag any that
   make you distrust everything else on the page.

---

## ~50 reviewer personas to run through

Spread across trust level, device, intent, and fandom on purpose. Bias the
*figures you test* toward ones real visitors actually search (demo figures,
Reddit-landing figures, A-listers) — not random long-tail, or you'll just
re-discover the data gap.

### Trust & skepticism range (1–8)
1. Hardcore skeptic — assumes every price site is wrong until proven
2. PriceCharting loyalist — already uses a competitor, comparing
3. Burned-before buyer — got ripped on a flip, distrusts comps
4. Trusting newcomer — takes the number at face value, easily misled
5. Data nerd — wants methodology, sample size, date ranges
6. "Just tell me the number" — no patience for nuance
7. eBay power-seller — knows real sold prices cold, will catch errors
8. Casual nostalgia browser — not buying, just curious what his old figure's worth

### Device & context (9–16)
9. Phone, one-handed, mid-Whatnot-show, 10 seconds to decide
10. Phone, lying in bed, slow scrolling
11. Desktop, multiple tabs, comparison shopping
12. Old Android, slow connection — does it even load?
13. iPad, lurking on couch
14. Phone in a store aisle, deciding whether to buy in person
15. Desktop power user, keyboard-only, no mouse
16. Screen-reader / accessibility user

### Intent (17–26)
17. "What's my childhood figure worth?" (selling soon)
18. Buyer checking if a Whatnot bid is fair
19. Seller pricing a lot before listing
20. Insurance / collection valuation
21. Gift-buyer, knows nothing about figures
22. Grader deciding if a figure's worth slabbing
23. Flipper hunting underpriced inventory
24. Want-list builder tracking grails over time
25. Researcher settling an argument ("is this rare?")
26. Estate-sale evaluator dumping a whole collection

### Fandom / catalog coverage (27–38)
27. WWE/wrestling diehard (your core — Mattel Elite, Jakks)
28. AEW / NJPW indie-wrestling fan
29. Vintage LJN / Hasbro WWF collector
30. Star Wars Black Series completist
31. Star Wars Vintage Collection (Kenner) old-school
32. Marvel Legends builder (BAF waves)
33. Transformers (Generations / WFC)
34. G.I. Joe Classified + vintage ARAH
35. TMNT (NECA + vintage Playmates)
36. MOTU (Masterverse + Origins + vintage)
37. NECA horror (Jason, Freddy, etc.)
38. Hot Toys / high-end 1:6 collector

### Edge cases that break sites (39–50)
39. Searches a figure with ZERO comps — what happens?
40. Searches a figure with only 1–2 comps (sparse)
41. Lands on a figure with a garbled/auto-generated name
42. Lands on a page with a broken or stock-photo image
43. Searches a typo / misspelled figure name
44. Searches a figure that isn't in the catalog at all
45. Hits a brand-new wave (likely missing images/prices)
46. Clicks "Find it on eBay" — does the link work + look right?
47. Tries to save a figure without an account (the gate)
48. Lands on a guide article from Google, never sees a figure page
49. Skims only the homepage, never clicks in — does it explain itself?
50. Comes from a Reddit link cold, no context — does the page earn a second click?

---

## After the run
Drop results here (figure + bounce point + reason). Web chat will split findings
into **web-fixable now** (copy, layout, trust cues, empty-states, mobile) vs
**data-blocked** (sparse comps = matcher/pipeline) so effort goes where it pays.
