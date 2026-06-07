# Deploy now — thumbnail ship-blocker + condition split

**2 files changed:**
- `src/app/components/FigureThumb.tsx` (thumbnail fix, below)
- `src/app/figure/[figure_id]/_components/MarketPanel.tsx` (New/Used split, below)

## The bug (was the #1 visitor bounce signal, 23/50)
Search/genre/line card thumbnails rendered as blank dark boxes. Confirmed REAL
in a live browser (not a screenshot artifact). The image data loads fine; it just
never paints — stuck at `opacity:0`.

## Root cause
FigureThumb reveals the image on the React `onLoad` event. With `loading="lazy"`
+ Worker SSR, already-cached images fire the native `load` event BEFORE React
attaches `onLoad`, so `setLoaded(true)` never runs and the image stays invisible.

## Fix
Added a ref callback that checks `img.complete && naturalWidth > 0` on mount and
reveals immediately; `onLoad` still handles images that stream in later.

## Ship
```
cd "C:\Users\bubs9\figurepinner-site"
npx tsc --noEmit      # expect clean
npm run deploy        # CF Worker
```
Then confirm: open `figurepinner.com/search?q=hulk` — cards should now show photos,
not blank boxes.

---

## Also in this deploy: New/Used condition split (#3, top believe-test blocker, 16/50)
`MarketPanel.tsx` — the headline median (in ValueStrip) stays the anchor; the
market panel now shows **New $X / Used $Y** medians beneath it.
- New = brand new / sealed / MOC / MIB / MISB / mint.
- Used = pre-owned / loose AND untagged ("None") — your call: untagged secondhand
  sales count as Used rather than inflating New.
- Each pill shows only with ≥3 real sales; if neither bucket clears 3, falls back
  to one blended "All" median. Switched avg→median for consistency with the rest
  of the site.

Verify after deploy: a well-covered figure (e.g. `/wrestling/elite/hulk-hogan`)
shows New and/or Used medians with sold counts.

---

(Pro-removal changes from earlier this session are also staged in the same repo —
see `PRO-REMOVAL-DEPLOY-HANDOFF-2026-06-06.md`. All can ship in one deploy.)
