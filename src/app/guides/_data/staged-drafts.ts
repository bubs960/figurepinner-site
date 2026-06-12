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
// 2026-06-11 (S19): all 12 drafts (ids 8-10, 12-16, 31, 17-18, 32) reviewed by web,
// fact-checked by standalone (ID 13 completion premium sourced from D1 comps: 388 fids,
// mean 2.36x, median >1.8x). Merged into articles.ts. Staging reset.
export const STAGED_DRAFTS: Article[] = []
