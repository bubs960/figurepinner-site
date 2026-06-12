/**
 * /search — Public figure search page
 * Server component: reads ?q= from searchParams, hands off to client component.
 * No auth required — Clerk middleware only protects /app(.*).
 */

import type { Metadata } from 'next'
import SearchInterface from './_components/SearchInterface'
import { TOTAL_FIGURES_LABEL } from '@/data/kb-stats'
import SiteHeader from '@/app/components/SiteHeader'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  if (q?.trim()) {
    return {
      title: `"${q}" — Search`,
      description: `Search results for ${q}. Find action figure prices, values, and collector info on FigurePinner.`,
      // Don't canonicalize query-specific pages — they're ephemeral
    }
  }
  return {
    title: 'Search Action Figures',
    description: `Search ${TOTAL_FIGURES_LABEL} action figures. Find prices, values, and collector info for WWE, Marvel, Star Wars, and more.`,
    alternates: { canonical: 'https://figurepinner.com/search' },
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const initialQuery = q?.trim() ?? ''

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteHeader />

      <SearchInterface initialQuery={initialQuery} totalLabel={TOTAL_FIGURES_LABEL} />
    </main>
  )
}
