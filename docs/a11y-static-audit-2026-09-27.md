# Accessibility static audit — 2026-09-27

Scope: static read of `src/app/**/*.tsx`, `src/app/components/**`, plus the CSS
those files use (`globals.css`, `DepthHallHero.module.css`). Base: `main` @ `509f922`.
Method: grep sweeps + reading the matched code. **Nothing here was rendered.**
Anything that needs a browser is in the last section and is NOT asserted.

Ranking: **Impact** H/M/L (who is blocked and how often) × **Cost** S (<1h, one
file) / M (a few files or needs design input) / L (cross-cutting).

## Summary — ranked

| # | Impact | Cost | Area | Issue | Location |
|---|---|---|---|---|---|
| 1 | H | S | nav | Focus ring removed on header buttons, replaced only by an 8%-white background tint | `src/app/components/SiteHeader.tsx:201-205`, `:245-249` |
| 2 | H | S | homepage / search | Primary search inputs set inline `outline: 'none'`, which beats the global `:focus-visible` ring (`globals.css:301`) | `src/app/components/HeroSearch.tsx:586`, `src/app/search/_components/SearchInterface.tsx:399`, `src/app/guides/_components/GuidesStickySearch.tsx:120` |
| 3 | M | S | forms (`/app/alerts`) | `<label>` in `Field` has no `htmlFor` and does not wrap the input → labels not programmatically associated; inputs rely on placeholder | `src/app/app/alerts/page.tsx:300-307` (used by inputs at `:233`, `:243`, `:252`) |
| 4 | M | S | PriceBlock | Price trend conveyed by colour + ▲/▼ glyph; glyph is read by SR as "black up-pointing triangle" with no "up/down" word | `src/app/figure/[figure_id]/_components/PriceBlock.tsx:78` |
| 5 | M | S | figure page (BidCheck) | `outline: none` on inputs; `:focus` replacement is a gold border + 16%-alpha shadow — present but faint (see browser list) | `src/app/figure/[figure_id]/_components/BidCheck.tsx:163-165`, `:244` |
| 6 | M | M | homepage hero (DepthHallHero) | Inspect dialog: overlay `div` with `onClick` closes it; inner panel `div onClick={stopPropagation}`. Click-to-dismiss is fine only if Esc + a real close button exist — static read did not confirm an Esc handler on this dialog | `src/app/components/DepthHallHero.tsx:558-565` |
| 7 | L | S | `/search` | Filter/chip `button` at `:630` has no `aria-pressed` / selected state exposed (visual state only) | `src/app/search/_components/SearchInterface.tsx:630` |
| 8 | L | S | globals | `.fp-action-input` `outline: none`, replacement is border-colour change only (`:focus` not `:focus-visible`) | `src/app/globals.css:365-371` |
| 9 | L | S | app (logged-in) | Further inline `outline: none` on inputs; replacement not verified | `src/app/app/page.tsx:148`, `src/app/app/alerts/page.tsx:296`, `src/app/app/wantlist/page.tsx:193`, `src/app/app/vault/page.tsx:427`, `src/app/scan/page.tsx:377`, `src/app/admin/news/_components/NewsForm.tsx:17` |
| 10 | L | S | figure page | `FigureThumb` shimmer skeleton `animation: infinite` with no reduced-motion guard | `src/app/components/FigureThumb.tsx:92-95` |
| 11 | L | S | homepage / search | Spinner `hero-spin` infinite with no reduced-motion guard (essential-motion exemption arguably applies; low priority) | `src/app/components/HeroSearch.tsx:922-923` |

## Proposed fix per item (one line each)

1. Replace `outline: none` with `outline: 2px solid var(--blue); outline-offset: 2px;` inside the `:focus-visible` selector only (keep the bg tint on `:hover`).
2. Remove inline `outline: 'none'` from the `<input>` and add a `:focus-within` ring on the wrapper (the pattern `globals.css:1893 .fp-search-box:focus-within` already exists — reuse it).
3. Give `Field` an `id` prop: `<label htmlFor={id}>` + `id={id}` on the child input (or wrap the input inside the `<label>`).
4. Wrap the glyph in `aria-hidden` and add visually-hidden text: `<span className="sr-only">{up ? 'up' : 'down'}</span>`.
5. Move the rule to `:focus-visible` and raise the ring to an opaque 2px outline; keep the border tint.
6. Confirm/add `onKeyDown` Esc → `setSelected(null)` and a visible `<button aria-label="Close">`; return focus to the opening card.
7. Add `aria-pressed={active}` to toggle chips.
8. Add `.fp-action-input:focus-visible { outline: 2px solid var(--blue); outline-offset: 1px; }`.
9. Same as 2/8: delete inline `outline: 'none'` or pair it with a wrapper `:focus-within` ring. Admin page is lowest priority.
10. Add `@media (prefers-reduced-motion: reduce) { animation: none }` for `fp-thumb-shimmer` (inline style needs a class to be overridable).
11. Optional: same media guard, or slow the spin; keep a static "Loading…" label.

## Per family — findings and clean checks

### Homepage / DepthHallHero
- Items 2, 6, 11 above.
- **Clean:** animated blobs/stars/liquid/marquee (`.tickerTrack`) are all frozen under `@media (prefers-reduced-motion: reduce)` at `DepthHallHero.module.css:659-665`; SMIL `<animate>` is handled in JS via `matchMedia` (`DepthHallHero.tsx:115-176`). Homepage room styles also guard (`src/app/page.tsx:938`). `SpotlightVitrine.tsx:33`, `:256` guarded. `HeroSearch` placeholder cycling guarded (`:346-349`).
- **Clean:** dialog has `role="dialog" aria-modal="true" aria-label` (`DepthHallHero.tsx:559-561`); hero images have `alt={`${name} action figure`}` (`:476`, `:569`).
- Headings: `src/app/page.tsx` h1 `:1069` → h2 `:1128/1189/1241/1266` — no skip.

### Figure page (`src/app/figure/[figure_id]/`)
- Items 4, 5.
- **Clean:** HeroBand `alt` is meaningful (`HeroBand.tsx:266`), RelatedRow `alt` (`RelatedRow.tsx:179`). Decorative `alt=""` strips NOT flagged per the 9/18 ruling in `tests/figureImageAlt.test.mjs`.
- **Clean:** comps toggle is a real `<button type="button" aria-expanded>` (`MarketPanel.tsx:229-236`).
- Headings: single h1 (`HeroBand.tsx`), h2s via `SectionH2.tsx` and passports — no static skip found; actual order depends on conditional rendering (browser list).

### Line hubs (`src/app/[genre]/[line]/_lib/lineHub.tsx`, `[genre]/page.tsx`, character hub)
- No issues found statically. h1 `:598` → h2 `:695/733`. Thumbs pass `alt` (`lineHub.tsx:870`, `characterHub.tsx:452`, `:759`, `[genre]/page.tsx:900`). Reduced-motion guarded (file contains the media query).

### Guides
- Item 2 (`GuidesStickySearch.tsx:120`) — note the input is inside a `<label>` and has `aria-label`, so naming is fine; only focus visibility is at issue.
- **Clean:** all guide thumbnails have meaningful `alt` (`HeroesVillainsBand.tsx:26`, `FandomHubInteractive.tsx:178`, `FandomLineSections.tsx:93`, `MostCheckedRail.tsx:29`, `red-white-blue/page.tsx:202`).

### /search
- Items 2, 7.
- **Clean:** input has `aria-label` (`SearchInterface.tsx:393`), clear button labelled (`:1175`), result thumbs `alt` (`:799`), single h1 (`:353`).

### PriceBlock / MarketPanel
- Item 4. MarketPanel: no issues statically.

### Ads (`src/app/components/AdSlot.tsx`)
- **Clean:** visible "Advertisement" label (`:320`) and `title="Advertisement"` on the iframe (`:333`).
- Third-party creative content inside the iframe is out of our control (browser list).

### Nav (`src/app/components/SiteHeader.tsx`)
- Item 1.
- **Clean:** search trigger has `aria-label`, `aria-haspopup="dialog"`, `aria-expanded` (`:343-350`); overlay implements a focus trap and focus return (comment + code at `:257-260` onward).

### Sweep results with zero hits
- `div`/`span`/`li` with `onClick` acting as a control: only `DepthHallHero.tsx:558`/`:565` (item 6); none elsewhere in `src/app`.
- `<img>` / `<Image>` without any `alt` attribute: none (every raw `<img>` match either carries `alt` or is `FigureThumb`/`FigureThumbStatic`, which forward an `alt` prop).

## Needs a browser check (not asserted)
- Colour contrast of: `--muted` text on `--s1`; gold `GuidesStickySearch` text `#1a1408` on the `#f5c462→#dd9f2e` gradient; BidCheck placeholder `rgba(242,232,213,.38)`; PriceBlock `#4ec98c` / `#e05a7a` on the shelf background; "Advertisement" label.
- Visibility of the SiteHeader `:focus-visible` bg tint and the BidCheck 16% focus shadow (item 1/5 severity depends on this).
- Whether `.fp-search-box:focus-within` (`globals.css:1893`) already draws a visible ring around HeroSearch — if so, item 2 downgrades for the homepage.
- Real tab order through the homepage hero cards, inspect dialog, and figure-page tabs (`AboutTabs.tsx:85/103` — check arrow-key/`role="tab"` pattern).
- Rendered heading outline on a figure page with all conditional sections present.
- Esc behaviour of the DepthHallHero inspect dialog (item 6).
- Third-party ad creatives (focus traps, autoplay).

## Gate context
Report only; no source changes. `npm test` on unmodified main in this sandbox: 488 tests / 480 pass / 1 fail / 7 todo — the fail is `tests/googleIndexTier.test.mjs` subtest 5 reading `C:/Users/bubs9/.../INDEX-VALUE-CENSUS-2026-07-18.csv` (Windows-only path; sandbox problem, not fixed).
