# Archive: Phantom Import Era (2026-06-05)

This is a snapshot of the src/ directory as of the bceb185 mess.

## What happened
Multiple sessions added imports for components that never existed
(BreadcrumbJsonLd, ProBadge, MobileActionBar, GenreNewsRail, etc.).
Build was broken. A "fix" commit (bceb185) removed the phantom imports
but also gutted R2 price fetching, ISR, and design components.

## Live site at time of archive
CF Worker version: d253387f-02e9-474b-abd1-268c2b669014
(This is the version Steve rolled back to — the real working baseline)

## Do not use this code
Start from the live CF Worker version instead.
