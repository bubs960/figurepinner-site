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
  searchParams: Promise<{ q?: string; genre?: string }>
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
  const { q, genre } = await searchParams
  const initialQuery = q?.trim() ?? ''
  // ?genre= prefilter (KB fandom slug) — set by the hero takeover's genre
  // pills (S54 D2). SearchInterface validates it against its GENRES list.
  const initialGenre = genre?.trim() || undefined

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteHeader />

      <SearchInterface initialQuery={initialQuery} initialGenre={initialGenre} totalLabel={TOTAL_FIGURES_LABEL} />
    </main>
  )
}
