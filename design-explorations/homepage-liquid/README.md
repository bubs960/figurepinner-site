# Homepage Liquid Layer — Builder Handoff

2026-08-13 · extends the Figure Page v4 liquid background to the homepage for visual continuity
Companion drop to figure-page-v4-handoff (same token set — a figure-page visitor and a homepage visitor see the same water).

## Files

- **Homepage Liquid Layer Desktop.dc.html** — liquid layer under the real Depth Hall hero (mounted live via dc-import) + stand-in below-fold lanes. The lanes are demo scaffolding only — real homepage content ships unchanged.
- **Homepage Liquid Layer Mobile.dc.html** — 430px. Hero is a labeled static stand-in (the shipped Depth Hall hero is unchanged); the layer itself is the deliverable.
- **Homepage Depth Hall.dc.html + support.js** — included so the desktop file's hero import resolves when opened locally.

## The one removable wrapper

Everything ships inside a single div:

```html
<div id="fp-liquid-layer" aria-hidden="true"
     style="position:absolute; left:0; right:0; top:<HERO_HEIGHT>; bottom:0;
            z-index:0; pointer-events:none; overflow:hidden;">
  … 3 blobs + sheen band(s) + vignette …
</div>
```

Delete that div (or feature-flag its render) and the homepage is byte-identical to today. Content sits in a sibling `position:relative; z-index:1` wrapper.

## Hard constraints (must survive to production)

1. Decorative layer only: `z-index:0`, `pointer-events:none`, `aria-hidden="true"`; all content above it at z-1.
2. Transform-only animation — translate/scale/rotate exclusively. `filter: blur()` is a STATIC style, never animated; no opacity/filter keyframes. `will-change: transform` on each animated node.
3. `prefers-reduced-motion: reduce` pauses every animation in the layer (`#fp-liquid-layer * { animation-play-state: paused !important; }`).
4. NOTHING sits above or alters the hero's LCP element — the layer starts BELOW the hero (see next section) and adds zero nodes inside it.
5. Feature-flag + CWV-gate before ship (INP/LCP unchanged with flag on, or it doesn't ship).

## Interaction with Depth Hall Hero (paint-cost investigation)

The hero already runs live SVG filters (feTurbulence/feSpecularLighting liquid sheen) plus its own blobs — the open paint-cost investigation. The liquid layer avoids compounding that by **zero spatial overlap**:

- The layer is positioned `top: <hero height>` (820px in the desktop demo; use the hero's real rendered height / `100vh` equivalent in build), so at load — when the hero fills the viewport — the layer has **no pixels in the viewport at all**. Nothing new composites during LCP or while the hero's filters are painting.
- No blob, sheen band, or vignette ever intersects the hero's filter region; the two systems never stack blend modes or blurs on the same pixels.
- The hero keeps its own background (it paints fully opaque), so even the layer's top edge never shows through it.
- Result: the layer's GPU cost begins only when the user scrolls past the hero, where the page is currently flat `#09090F` — worst case it replaces "nothing" rather than adding to the hero's bill. If the CWV gate still flags it, an IntersectionObserver can mount the layer lazily at first scroll (progressive enhancement; zero cost at load).

## Exact values (identical to Figure Page v4 — no deltas)

- Page bg `#09090F`
- Blobs (radial-gradient circles, `border-radius:50%`):
  - gold `radial-gradient(circle at 38% 35%, rgba(224,168,62,.10), rgba(224,168,62,.03) 55%, transparent 72%)` — fpBlobA 46s
  - cyan `radial-gradient(circle at 60% 40%, rgba(78,205,230,.07), rgba(78,205,230,.02) 55%, transparent 72%)` — fpBlobB 58s
  - violet `radial-gradient(circle at 50% 50%, rgba(90,60,160,.09), rgba(90,60,160,.025) 55%, transparent 75%)` — fpBlobC 52s
- Blur: 90px desktop / 70px mobile (static filter)
- Sheen bands: thin diagonal linear-gradients (gold band peak `rgba(255,246,218,.06)`, cyan band `rgba(78,205,230,.04)`), `mix-blend-mode:screen`, blur 6–8px desktop / 5px mobile, fpSheen 26s + 38s-reverse (mobile: one gold band only — small screens don't need two)
- Vignette: `radial-gradient(120% 90% at 50% 30%, transparent 55%, rgba(9,9,15,.85) 100%)` (mobile `140% 70% at 50% 25%`)
- Keyframes: fpBlobA/B/C + fpSheen exactly as in the v4 files. NOTE: the Depth Hall hero already defines its own `fpBlobA/B/C/fpSheen` with different content — in build, namespace the layer's keyframes (e.g. `fpLqBlobA`) or scope them to the layer's stylesheet to avoid collision. (In these demo files the layer's versions are the active ones.)

Deltas from v4: none in color/blur/timing. Only positional: layer starts below the hero instead of `inset:0` (constraint #4), and mobile runs one sheen band instead of two (viewport width; second band is invisible at 430px anyway).

## Post-review note — visibility variant (optional, flag-gated)

At exact v4 opacities the layer reads correctly on content-dense figure pages but is near-subliminal on the homepage's emptier below-fold. If the A/B shows no lift, test a single variant: multiply the three blob alphas ×1.5 (gold .15/.045, cyan .105/.03, violet .135/.038) — everything else identical. This is the ONE sanctioned delta; do not touch blur, timing, or the vignette.

## Conversion notes (why this helps, not just looks)

- The vignette darkens page edges and the blobs sit in the gutters — figure-card lanes and the search area stay the brightest pixels on screen, which is the direction we're pushing for click-through.
- The layer gives the below-fold region (currently flat black) the same "alive" quality that made the hero test well — reducing the visual cliff at the fold that reads as "the page ended," which is a scroll-abandonment driver.
- Nothing in the layer competes with the search glow: no blob is parked behind the hero search, and sheen bands are body-region only.
