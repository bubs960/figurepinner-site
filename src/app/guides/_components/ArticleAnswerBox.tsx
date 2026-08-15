'use client'

// ArticleAnswerBox — Phase 2 of the guides conversion redesign
// (design-explorations/guides-conversion-v1/README.md §"Plain article": "Answer-first
// box ('THE SHORT VERSION') gives the method's conclusion + a search prompt in
// viewport 1, before the editorial."). Real search form, not a lookalike box, same
// contract as GuidesStickySearch (webaudit build condition #1).

import { trackFunnel } from '@/app/_lib/funnelClient'

export default function ArticleAnswerBox({ shortVersion }: { shortVersion: string }) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      aria-label="Check a figure's value — free"
      onSubmit={() => trackFunnel('search_submit', { target: 'hero' })}
      style={{
        margin: '0 0 2.5rem',
        background: 'linear-gradient(160deg,#16131f,#0b0a12 65%)',
        border: '1px solid rgba(245,196,98,.35)',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
      }}
    >
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.16em', color: '#e0a83e', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
        The short version
      </div>
      <div style={{ fontSize: '0.95rem', lineHeight: 1.55, color: '#f2e8d5', marginBottom: '0.9rem' }}>
        {shortVersion}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input
          type="search"
          name="q"
          placeholder="Which figure do you have?"
          aria-label="Which figure do you have?"
          style={{
            background: '#09090F',
            border: '1px solid rgba(242,232,213,.15)',
            borderRadius: '10px',
            padding: '0.7rem 0.85rem',
            fontSize: '0.9rem',
            color: '#f2e8d5',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(180deg,#f5c462,#dd9f2e)',
            color: '#1a1408',
            border: 'none',
            borderRadius: '10px',
            padding: '0.8rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          SEE ITS REAL VALUE — FREE
        </button>
      </div>
    </form>
  )
}
