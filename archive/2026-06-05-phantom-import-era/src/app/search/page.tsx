/**
 * /search — Public figure search page
 * Server component: reads ?q= from searchParams, hands off to client component.
 * No auth required — Clerk middleware only protects /app(.*).
 */

import type { Metadata } from 'next'
import SearchInterface from './_components/SearchInterface'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  if (q?.trim()) {
    return {
      title: `"${q}" — FigurePinner Search`,
      description: `Search results for ${q}. Find action figure prices, values, and collector info on FigurePinner.`,
      // Don't canonicalize query-specific pages — they're ephemeral
    }
  }
  return {
    title: 'Search Action Figures — FigurePinner',
    description: 'Search 20,000+ action figures. Find prices, values, and collector info for WWE, Marvel, Star Wars, and more.',
    alternates: { canonical: 'https://figurepinner.com/search' },
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const initialQuery = q?.trim() ?? ''

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav bar — minimal, same pattern as other pages */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,12,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 clamp(1rem, 5vw, 3rem)',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          height: 56,
          display: 'flex', alignItems: 'center', gap: '1.5rem',
        }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="7" fill="#FF5F00" />
              <circle cx="12" cy="13" r="4.5" stroke="#fff" strokeWidth="2.2" />
              <line x1="15.2" y1="16.2" x2="20" y2="21" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M20 9l2 2M24 8l-2 2M22 6l0 2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
              FigurePinner
            </span>
          </a>
          <div style={{ flex: 1 }} />
          <a href="/app" style={{ fontSize: '0.8125rem', color: 'var(--muted)', textDecoration: 'none', fontWeight: 500 }}>
            My Collection
          </a>
        </div>
      </nav>

      <SearchInterface initialQuery={initialQuery} />
    </main>
  )
}
