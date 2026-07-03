/**
 * /coming-soon — RETIRED (S52, 2026-07-03). Redirects home.
 *
 * This was the pre-launch landing page ("opening to the public when we hit
 * 60% coverage" + waitlist form). The site launched 2026-06-02 and the
 * middleware gate that routed visitors here was removed entirely, so the page
 * was orphaned — reachable only by direct URL, and its copy contradicted the
 * live site (coverage is ~90%, the app is public). Anyone landing on an old
 * link now gets the real site instead of a stale pitch.
 *
 * The original page is preserved verbatim in page.tsx.disabled (same pattern
 * as /pro) in case a pre-launch surface is ever wanted for a new vertical.
 * A second, older static copy also exists at repo-root coming-soon/ (not
 * routed by Next) — flagged to Steve as a delete candidate, not touched here.
 */

import { redirect } from 'next/navigation'

export default function ComingSoonPage() {
  redirect('/')
}
