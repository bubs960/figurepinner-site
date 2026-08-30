/**
 * /open/[figure_id] — Universal deep-link handler
 *
 * This route exists so that AASA / assetlinks.json can point to /open/*
 * instead of /figure/* directly. This gives us a clean handoff point:
 *
 * - Native app installed → iOS/Android intercepts the URL and opens the app
 *   before this page ever loads. The app handles the figure_id directly.
 *
 * - No app installed → this page renders and immediately redirects to the
 *   web figure detail page at /figure/<figure_id>, with an app install CTA.
 *
 * The redirect is a hard 302 so search engines follow it to the canonical URL.
 * We set noindex so this route doesn't compete with /figure/* in search.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getFigureById } from '@/data/kbDb'
import { deriveName } from '@/data/kbHelpers'

export default async function OpenDeepLink({
  params,
}: {
  params: Promise<{ figure_id: string }>
}) {
  const { figure_id } = await params

  // Validate the figure exists before redirecting
  // Tier B: D1 read. On a D1 blip, treat like an unknown fid — this route is
  // a noindex deep-link shim; redirecting to /search is the safe degrade.
  const figure = await getFigureById(figure_id).catch(() => null)

  if (!figure) {
    // Unknown figure_id — redirect to search rather than 404. (Was '/app',
    // which auth-walls anonymous visitors at Clerk sign-in — a deep link with
    // a stale fid dead-ended at a login form. S52.)
    redirect('/search')
  }

  // Redirect to canonical web URL — app would have intercepted before this
  redirect(`/figure/${figure_id}`)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ figure_id: string }>
}): Promise<Metadata> {
  const { figure_id } = await params
  const figure = await getFigureById(figure_id).catch(() => null)
  if (!figure) return { robots: { index: false } }

  return {
    title: { absolute: `${deriveName(figure)} — FigurePinner` },
    robots: { index: false, follow: false },
  }
}
