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
import { getFigureById, deriveName } from '@/data/kb'

export default async function OpenDeepLink({
  params,
}: {
  params: Promise<{ figure_id: string }>
}) {
  const { figure_id } = await params

  // Validate the figure exists before redirecting
  const figure = getFigureById(figure_id)

  if (!figure) {
    // Unknown figure_id — redirect to search rather than 404
    redirect('/app')
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
  const figure = getFigureById(figure_id)
  if (!figure) return { robots: { index: false } }

  return {
    title: `${deriveName(figure)} — FigurePinner`,
    robots: { index: false, follow: false },
  }
}
