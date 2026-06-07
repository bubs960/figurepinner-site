# Deploy handoff — Pro removed (public surfaces) + 2 relays filed

**Date:** 2026-06-06 (web S11) · **Action needed from you:** tsc + deploy

## What changed (4 files — "public surfaces only" scope you chose)
1. `src/app/components/Footer.tsx` — removed the `Pro` footer link.
2. `src/app/figure/[figure_id]/_components/CtaRail.tsx` — removed the 3rd "Pro" CTA
   card; rail is now 2 cards (grid is count-driven, auto-restores).
3. `src/app/pro/page.tsx` — now `redirect('/')`. Original page preserved verbatim
   at `src/app/pro/page.tsx.disabled` (1-rename restore).
4. `src/app/sitemap.ts` — removed `/pro` entry.

Backend left INTACT: `api/stripe/*`, `lib/proStatus.ts`, vault export gate. Reversible.

## To ship
```
cd "C:\Users\bubs9\figurepinner-site"
npx tsc --noEmit        # expect clean
npm run deploy          # CF Worker (NOT git push)
```
Then spot-check: footer has no Pro link, a figure page shows 2 CTA cards,
`figurepinner.com/pro` redirects to home.

## Known follow-up (NOT done — out of scope this session)
Logged-in app still shows upgrade CTAs (AppShell "Go Pro", vault/wantlist/alerts/
settings gates, FigureActions "Upgrade to Pro →") that now lead to a redirected
/pro. Only signed-in free users see these. Do the "public + app CTAs" pass when ready.

## Also this session (no deploy needed)
- `/go/` affiliate "leak" = NOT a leak. Routing is intact; was the already-fixed
  bceb185 regression. Tell wallet to close that flag.
- 2 Bridge relays filed: matcher (clean sold-dates → unblocks W9 chart),
  pipeline (run photo-upload.py → unblocks gallery + owner photos).
- Pulled 9 full-res photos from your McMahon listing → `ebay-photos-147348084744.md`.
