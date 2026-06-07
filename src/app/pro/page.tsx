/**
 * /pro — TEMPORARILY DISABLED (2026-06-06, Steve).
 *
 * The Pro tier (CSV/Excel export + ad-free) is held until the GrailPulse
 * ecosystem has at least 3 verticals. With no ads live and a single vertical,
 * a paid tier built on "remove ads that don't exist" + single-vertical export
 * is too thin to sell and reads as hollow to collectors.
 *
 * This page redirects to home so visitors never see the half-baked pricing.
 * The full original page is preserved verbatim in `page.tsx.disabled` — restore
 * with a single rename (and re-add the Footer link + CtaRail card + sitemap
 * entry) when the 3rd vertical ships. Backend Stripe routes are left intact.
 */
import { redirect } from 'next/navigation'

export default function ProPage() {
  redirect('/')
}
