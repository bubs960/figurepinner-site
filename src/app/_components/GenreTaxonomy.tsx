'use client'
/**
 * GenreTaxonomy.tsx
 * Landing page genre/line selector — PRESENTATION ONLY.
 *
 * Data comes from src/data/genre-lines.ts (computed from the KB at build time
 * + validated editorial overlay) and is passed in by the server page. This
 * component used to own a hand-typed data array; it drifted until 36 of its
 * line tiles were broken at once (S20, 2026-06-11). Slugs and counts are
 * facts — they live with the KB now, never here.
 *
 * UX flow:
 *   1. User sees genre pills across the top (scrollable).
 *   2. Clicking a genre animates-in a grid of its product lines.
 *   3. Each line card links to the line hub page.
 *   4. "Browse all →" pill takes to the full genre page.
 */

import { useState } from 'react'
import type { GenreTab, LineTile } from '@/data/genre-lines'

interface GenreTaxonomyProps {
  genres: GenreTab[]
}

// ─── Genre monogram ───────────────────────────────────────────────────────────
// The genre's initial(s) in the display face on an accent-tinted tile.
// Matches the guides-page treatment for sitewide consistency.
function genreMonogram(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 ]/g, '').trim()
  // Multi-word → initials (e.g. "Power Rangers" → "PR", "G.I. Joe" → "GJ").
  const words = cleaned.split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return cleaned.slice(0, 2).toUpperCase()
}

function GenreMark({ name, accent, size }: { name: string; accent: string; size: number }) {
  return (
    <span
      aria-hidden
      style={{
        flexShrink: 0,
        width: size, height: size,
        borderRadius: Math.round(size * 0.28),
        background: `linear-gradient(150deg, ${accent} 0%, ${accent}99 100%)`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: size * 0.5, fontWeight: 800, letterSpacing: '0.01em',
        color: '#fff', lineHeight: 1,
      }}
    >
      {genreMonogram(name)}
    </span>
  )
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE_CONFIG = {
  hot:     { label: 'Hot',     bg: 'rgba(255,95,0,0.12)',   color: '#FF5F00', border: 'rgba(255,95,0,0.3)' },
  vintage: { label: 'Vintage', bg: 'rgba(255,184,0,0.1)',   color: '#FFB800', border: 'rgba(255,184,0,0.3)' },
  new:     { label: 'New',     bg: 'rgba(0,200,112,0.1)',   color: '#00C870', border: 'rgba(0,200,112,0.3)' },
  premium: { label: 'Premium', bg: 'rgba(200,160,255,0.1)', color: '#C89BFF', border: 'rgba(200,160,255,0.3)' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GenreTaxonomy({ genres }: GenreTaxonomyProps) {
  const [activeSlug, setActiveSlug] = useState<string>(genres[0]?.slug ?? '')
  if (!genres.length) return null
  const activeGenre = genres.find(g => g.slug === activeSlug) ?? genres[0]

  return (
    <div>
      {/* ── Genre pill selector ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        padding: '0 0 1rem',
        marginBottom: '1.75rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {genres.map(g => {
          const isActive = g.slug === activeGenre.slug
          return (
            <button
              key={g.slug}
              onClick={() => setActiveSlug(g.slug)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexShrink: 0,
                padding: '0.5rem 1rem',
                border: isActive ? `1px solid ${g.accent}` : '1px solid var(--border)',
                borderRadius: '9999px',
                background: isActive ? `${g.accent}18` : 'var(--s1)',
                color: isActive ? g.accent : 'var(--muted)',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <GenreMark name={g.name} accent={g.accent} size={18} />
              {g.name}
              <span style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: isActive ? g.accent : 'var(--dim)',
                letterSpacing: '0.04em',
              }}>
                {g.totalCount}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Active genre header ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <GenreMark name={activeGenre.name} accent={activeGenre.accent} size={36} />
          <div>
            <span style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}>
              {activeGenre.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--dim)', marginLeft: '0.5rem' }}>
              {activeGenre.totalCount} figures · {activeGenre.lines.length} lines
            </span>
          </div>
        </div>
        <a
          href={`/${activeGenre.slug}`}
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: activeGenre.accent,
            textDecoration: 'none',
            padding: '0.375rem 0.875rem',
            border: `1px solid ${activeGenre.accent}44`,
            borderRadius: '9999px',
            background: `${activeGenre.accent}0D`,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Browse All {activeGenre.name} →
        </a>
      </div>

      {/* ── Product line grid ────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '0.625rem',
      }}>
        {activeGenre.lines.map((line: LineTile) => {
          const badge = line.badge ? BADGE_CONFIG[line.badge] : null
          return (
            <a
              key={line.slug}
              href={`/${activeGenre.slug}/${line.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                padding: '0.875rem 1rem',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = `${activeGenre.accent}55`
                el.style.background = `${activeGenre.accent}08`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = 'var(--border)'
                el.style.background = 'var(--bg)'
              }}
            >
              {/* Top row: name + badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  lineHeight: 1.3,
                  flex: 1,
                  minWidth: 0,
                }}>
                  {line.name}
                </span>
                {badge && (
                  <span style={{
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '0.1875rem 0.5rem',
                    borderRadius: '9999px',
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                    flexShrink: 0,
                  }}>
                    {badge.label}
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.6875rem',
                color: 'var(--dim)',
              }}>
                <span style={{ fontWeight: 700, color: activeGenre.accent }}>{line.count} figs</span>
                {line.years && (
                  <>
                    <span>·</span>
                    <span>{line.years}</span>
                  </>
                )}
              </div>

              {/* Desc */}
              {line.desc && (
                <div style={{
                  fontSize: '0.6875rem',
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {line.desc}
                </div>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
