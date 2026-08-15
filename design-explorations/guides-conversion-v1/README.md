# Guides Redesign — Conversion Handoff

Templates: **Fandom Hub** + **Plain Article**. Mobile is the primary artifact (91% of crawl/visits); desktop adapts.
Goal hierarchy: (1) search_submit, (2) figure-page click-through, (3) TRACK signup, (4) eBay affiliate exit.
Reference pages reviewed live: `/guides/wwe-elite-hub`, `/guides/how-to-price-wrestling-figures`.

**⚠ ALL numbers, prices, counts, and dates in these mockups are SAMPLE data. Never copy into production.**

## Files
- `hub-mobile.dc.html` — primary
- `hub-desktop.dc.html`
- `article-mobile.dc.html` — primary
- `article-desktop.dc.html`

## Section-by-section rationale

### Both templates
- **Sticky search (mobile: bottom bar / desktop: header chip).** The persistent conversion path the current pages lack entirely. Mobile bar hides via IntersectionObserver whenever the ad slot or footer is on screen — it never overlaps or competes with the single ad. Respects `safe-area-inset-bottom`. One component, both templates.
- **Mid-page conversion breaks.** A slim search moment after every 2–3 sections (hub) / after each rule section (article). Fandom voice frames the ask on hubs ("Got one on the shelf? Don't guess the price."). Fixes: reader can currently finish either page without ever being asked to convert.
- **TRACK strip.** The retention hook, currently absent from all guide surfaces. Green accent (distinct from gold = search), placed after the reader has seen prices move.
- **More-guides demoted** to a plain text list — guide→guide recirculation must not outrank guide→figure surfaces.
- **Single ad slot, bottom, unchanged** (constraint #2).

### Fandom hub
- **Answer-first hero.** Kicker + title + one-line lore kept (identity/trust), compressed so the ANSWER CARD ("What's your Elite worth? Free · real sold comps · 10 seconds") lands in viewport 1. The value prop is finally stated as a direct ask.
- **Most-checked rail replaces the Babyfaces/Heels grail wall** as the first tile surface. Demand-ranked tiles match what value-checkers actually look up — a visitor's common figure can appear here; it never appears in a price-ranked grail wall. Ends with the "Not seeing yours? Search all 1,432 →" escape hatch (repeated after every tile surface — the current page's biggest leak is teaching visitors their figure isn't tracked).
  - *Babyfaces/Heels is genuinely fun fandom identity — if the owner wants it kept, it moves below the library as culture, not as the primary tile surface.*
- **The card:** whole row = the link, price is the dominant glyph (Bebas gold), sold-count shown per row for honesty. Filter chips kept.
- **Sub-line library:** kept as the SEO/browse spine, tightened to 3 grail tiles per line, "VIEW ALL N →" promoted to a full-width gold button (was a text link competing with 6 tiles). Conversion breaks slot in after lines 3 and 7.
- **FAQ:** every figure named in an answer becomes a figure-page link (Granite Warrior, CM Punk SES, Bret Hart…). Currently zero links in five answers.

### Plain article
- **Answer-first box** ("THE SHORT VERSION") gives the method's conclusion + a search prompt in viewport 1, before the editorial.
- **Rule-one copy order:** the "on eBay, the toggle is Sold Items" how-to must lead INTO the product ("we pull the sold comps for you") rather than exporting the reader to eBay's search box unmonetized. Copy edit, not a layout change — flagging because it's the single worst leak on the article template.
- **Comp cards:** whole card = figure-page link, live median dominant; eBay exit demoted to a small secondary link below the card (kept — it's the affiliate revenue, but it must not outweigh the figure page).
- **End CTA** upgraded from text link to a button-grade block + track hook.

## Funnel-event map (all existing vocabulary — no allowlist additions required)
| Element | Event |
|---|---|
| Hero answer card / mid-page breaks / sticky bar / end CTA search | `search_submit` |
| Search results tapped from any of the above | `search_result_click` |
| Most-checked tiles, card rows, grail tiles, FAQ figure links, comp cards | `figure_view` (destination; attribute via referrer/utm-free path param) |
| Comp card's small eBay link | `ebay_exit` |
| TRACK strip / "track it free" | `figure_track_cta_click` |
| Page load | `landing` |

Optional (owner sign-off, allowlist addition): a `guide_cta_source` **property** on `search_submit` (values: hero, break, sticky, end) to tell which surface converts. If properties aren't supported, ship without it — totals still measure the redesign.

## Phased build order (cheapest → highest-impact first)
1. **Sticky mobile search bar** (one component, both templates, no layout surgery). Expected: largest single lift on search_submit.
2. **Article answer-first box + end-CTA upgrade + Rule-one copy reorder** (copy + two blocks).
3. **Hub hero answer card** (compress hero, insert card).
4. **Mid-page conversion breaks** (one component, repeated).
5. **"Not seeing yours?" escape hatches + FAQ figure links** (links only).
6. **Comp-card dominance flip** (card = figure link, eBay demoted).
7. **The card row redesign + sold counts.**
8. **Most-checked rail** (needs lookup-demand data feed — the only item with a backend dependency).
9. **TRACK strip** (depends on track-signup surface existing on guides).
10. **Sub-line library tightening** (3 tiles + promoted View-all).

## Flagged for owner sign-off
- **Ad placement:** unchanged (bottom, single). RECOMMENDATION only: on the hub, an in-library placement (after sub-line 5) would likely out-earn bottom-of-page on a page this long — needs your sign-off + CWV re-check; NOT part of the base design.
- **Babyfaces/Heels wall:** replaced by Most-checked rail in the base design; say the word and it returns below the library.
- **`guide_cta_source` property** on search_submit (see funnel map).
- **Rule-one copy reorder** on the article (edits published editorial copy).

## Core Web Vitals notes
- No raster above the fold: hero + answer card are pure CSS. Mockup thumbnails are CSS placeholders; production tile images are all below-fold and `loading="lazy"`.
- Sticky bar is CSS + one IntersectionObserver; backdrop-blur only on the fixed bar/header (compositor-friendly).
- All atmosphere = CSS radial gradients; all motion behind `prefers-reduced-motion` (mockups ship none).

## Pre-registered success metrics (decide before shipping)
Primary:
- **guides landing → search_submit rate** (expect the largest move; sticky bar + answer-first).
- **guides landing → figure_view rate** (rail + card + comp-card dominance).
Secondary:
- guides landing → figure_track_cta_click rate (baseline is 0 — any signal is new).
- guides landing → ebay_exit rate (should hold or rise slightly; a collapse means the demotion went too far).
Guardrails:
- Ad revenue per guide session (must not fall — sticky bar hides when ad visible).
- Bing landings per day on guide URLs (layout-only change; a drop suggests accidental content loss).

Measure per-template (hub vs article) — the two start from different baselines.
