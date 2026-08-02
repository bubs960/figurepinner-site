/**
 * Whatnot sellers — permission-first outreach list (S52+, scoped
 * WEB-EOC-2026-07-31.md, seller list delivered 2026-08-02).
 *
 * Every entry here has been explicitly approved by the seller before being
 * listed. Do NOT add a handle without a recorded approval — the source of
 * truth for who has approved is Bridge/WEB-WHATNOT-SELLERS-APPROVED-LOG.md,
 * not this file. This file is display data only; approval is a Steve-owned
 * decision made elsewhere.
 */

export interface WhatnotSeller {
  handle: string
  profileUrl: string
}

export const WHATNOT_SELLERS: WhatnotSeller[] = [
  { handle: 'jordanwillis5393', profileUrl: 'https://www.whatnot.com/user/jordanwillis5393' },
  { handle: 'therecreatorz',    profileUrl: 'https://www.whatnot.com/user/therecreatorz' },
  { handle: 'rareboi',          profileUrl: 'https://www.whatnot.com/user/rareboi' },
  { handle: 'fig_enactments',   profileUrl: 'https://www.whatnot.com/user/fig_enactments' },
  { handle: 'burgasonk',        profileUrl: 'https://www.whatnot.com/user/burgasonk' },
  { handle: 'lillysinc',        profileUrl: 'https://www.whatnot.com/user/lillysinc' },
]

// Steve's own Whatnot profile + referral invite — separate CTA, not part of
// the seller list (route.ts: the invite link only earns signup credit, no
// affiliate program exists for seller-URL commissions).
export const WHATNOT_INVITE = {
  handle: 'bubs960',
  profileUrl: 'https://www.whatnot.com/user/bubs960',
  inviteUrl: 'https://www.whatnot.com/invite/bubs960',
}
