# Figure Page v4 — Builder Handoff

2026-08-13 · desktop + mobile designs for figurepinner.com figure pages
For Claude Code: these are static design references — lift exact values (colors, spacing, type) into the Next.js components. Sample data throughout; wire to KB + price snapshots.

## Files

- **Figure Page v4 Design Polish.dc.html** — desktop (1200px container). Cyan pill notes annotate each design decision; ignore them in build (they're the review layer — everything else ships).
- **Figure Page v4 Mobile.dc.html** — deliberate phone design (430px), not just responsive wrapping. Different section ORDER than desktop (see below).

## Design tokens

- bg `#09090F` · panel gradient `linear-gradient(160deg,#16131f 0%,#0b0a12 65%)` · ink/cream `#f2e8d5`
- gold `#f5c462` / amber `#e0a83e` · green `#4ec98c` · cyan `#4ecde6` · pink `#e05a7a` (pink = SOURCES DISAGREE ONLY)
- muted text `rgba(242,232,213,.55)` · faint `.35` · hairline `rgba(242,232,213,.08)`
- Display face: Bebas Neue (H1/H2/prices); body: system stack
- Section rhythm: 56px between sections (desktop), 26px (mobile)
- Chips: 100px radius, 1px colored border, transparent fill, 9.5–10px 700

## Page structure (desktop order)

1. Breadcrumb (BreadcrumbList schema)
2. Hero grid: vitrine photo card (cream frame + case-light beam clip-path) + At a Glance card (left, 380px) | chips + Bebas H1 + price block + CTAs (right)
3. Price block: two buckets each with confidence chip (HIGH ≥8 comps / MEDIUM 4–7 / LOW <4) + 90-day delta; weekly-median bar sparkline with date bounds, last bar gold
4. CTAs 2:1 — TRACK (gold gradient fill) primary, EBAY SOLDS (outline) secondary
5. Sold listings table + summary row incl. "N excluded — why" link to #receipts
6. "Why this one still moves" collector prose
7. #receipts — Documented Facts: evidence badges (PRIMARY/green, SINGLE SOURCE/gold, CORROBORATED/green, INFERRED/amber+italic value, SOURCES DISAGREE/pink, unresolved = muted text no badge); first receipt expanded by default; packaging row REMOVED per product decision
8. Same wave · BAF map cards (with live median prices on cards)
9. "Every version of [character]" horizontal rail — cream photo tiles, current figure gold-ringed, "See all N →"
10. Browse / Track / Learn hub cards (LEARN = guides/articles surface)
11. Ad slot (970×250 desktop / 320×100 mobile) + extension CTA banner

## Mobile deltas

- Order: breadcrumb → chips/H1 → PRICE BLOCK (first!) → photo vitrine → At a Glance → comps → prose → receipts → version rail (edge-bleed swipe) → related 2-up → hub cards stacked → ad
- Sticky bottom CTA bar (fixed, gradient scrim): TRACK — FREE (flex 2) + EBAY SOLDS (flex 1.4); body needs ~96px bottom padding
- Receipts = single stacked list, label above value, tap badge to expand source quote

## Liquid background (both files, toggleable)

Fixed decorative layer, z-0, pointer-events none, behind a z-1 content wrapper on an overflow-hidden page root:
- 3 blurred radial blobs (blur 90px desktop / 70px mobile): gold `rgba(224,168,62,.10)`, cyan `rgba(78,205,230,.07)`, violet `rgba(90,60,160,.09)`; keyframe drift 46–58s ease-in-out infinite, transform-only (translate/scale/rotate), willChange:transform
- 2 caustic sheen bands: thin diagonal linear-gradients, mix-blend screen, blur 5–8px, 26–38s translateX/skew loop
- Vignette on top: radial-gradient transparent 55% → rgba(9,9,15,.85) keeps edges dark for contrast
- Respect prefers-reduced-motion: pause animations
- Keyframes in the file: fpBlobA/B/C + fpSheen

## Build notes

- All numbers/comps/versions are SAMPLE — wire to snapshots; confidence chip thresholds above
- Evidence badges map 1:1 to matcher figure-claims-2 classes (see design-explorations/figure-page-v3/evidence-badges.html in repo)
- No packaging field — dropped deliberately
- Version rail data needs the character_slug join
