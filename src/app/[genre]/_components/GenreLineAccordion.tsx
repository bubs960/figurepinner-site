'use client'
/**
 * GenreLineAccordion.tsx
 * Client component — renders product-line accordion on genre pages.
 *
 * WHY client: the server renders all line/figure data into props.
 * The client manages which line is open, and only mounts <img> elements
 * for the open line — so image fetches are deferred until the user
 * actually wants to see a line. This is the primary page-speed fix.
 *
 * Initial state: first (largest) line is open.
 */

import { useState, useEffect } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FigureRow {
  figure_id: string
  href: string          // navigation link (/figure/[id] — wave-specific)
  canonicalUrl: string  // SEO canonical (/[fandom]/[line]/[char])
  name: string
  series: string | null
  exclusive: string | null
  imageUrl: string | null
}

export interface LineData {
  slug: string
  displayName: string
  figureCount: number   // capped count (rows in figures[])
  totalCount: number    // real KB total for this line
  figures: FigureRow[]
}

interface Props {
  lines: LineData[]
  accent: string
  genre: string         // slug for "See all in search" links
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function GenreLineAccordion({ lines, accent, genre }: Props) {
  const [openSlug, setOpenSlug] = useState<string>(lines[0]?.slug ?? '')

  // If the URL has a hash like #line-elite, open that line on mount
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#line-')) {
      const slug = hash.slice('#line-'.length)
      if (lines.some(l => l.slug === slug)) setOpenSlug(slug)
    }
  }, [lines])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {lines.map(line => {
        const isOpen = line.slug === openSlug
        return (
          <div
            key={line.slug}
            id={`line-${line.slug}`}
            style={{
              border: `1px solid ${isOpen ? accent + '55' : 'var(--border)'}`,
              borderRadius: '10px',
              overflow: 'hidden',
              background: isOpen ? `${accent}08` : 'var(--s1)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            {/* ── Accordion header ── */}
            <button
              onClick={() => setOpenSlug(isOpen ? '' : line.slug)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
              }}
            >
              {/* Left accent bar */}
              <div style={{
                width: '3px', height: '1.125rem', flexShrink: 0, borderRadius: '2px',
                background: isOpen ? accent : 'var(--s3)',
                transition: 'background 0.15s',
              }} />

              {/* Line name */}
              <span style={{
                fontSize: '0.9375rem',
                fontWeight: isOpen ? 700 : 500,
                color: isOpen ? 'var(--text)' : 'var(--muted)',
                flex: 1,
                transition: 'color 0.15s, font-weight 0.15s',
              }}>
                {line.displayName}
              </span>

              {/* Figure count */}
              <span style={{ fontSize: '0.75rem', color: 'var(--dim)', flexShrink: 0 }}>
                {line.totalCount > line.figureCount
                  ? `${line.totalCount.toLocaleString()}+ figures`
                  : `${line.figureCount.toLocaleString()} figures`
                }
              </span>

              {/* Chevron */}
              <svg
                width="14" height="14" viewBox="0 0 16 16" fill="none"
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                  opacity: 0.5,
                }}
              >
                <path d="M4 6l4 4 4-4" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* ── Figure grid — only mounted when open ── */}
            {isOpen && (
              <div style={{ padding: '0 1rem 1rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                  gap: '0.5rem',
                }}>
                  {line.figures.map(f => (
                    <FigureCard key={f.figure_id} figure={f} accent={accent} />
                  ))}
                </div>

                {/* "See all" link when capped → goes to the line hub page */}
                {line.totalCount > line.figureCount && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <a
                      href={`/${genre}/${line.slug}`}
                      style={{
                        fontSize: '0.8125rem',
                        color: accent,
                        textDecoration: 'none',
                        fontWeight: 600,
                        padding: '0.5rem 1rem',
                        border: `1px solid ${accent}44`,
                        borderRadius: '9999px',
                        background: `${accent}0A`,
                      }}
                    >
                      See all {line.totalCount.toLocaleString()} {line.displayName} figures →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── FigureCard ────────────────────────────────────────────────────────────────

function FigureCard({ figure, accent }: { figure: FigureRow; accent: string }) {
  return (
    <a
      href={figure.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.625rem 0.75rem',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        textDecoration: 'none',
        color: 'var(--text)',
        fontSize: '0.8125rem',
        transition: 'border-color 0.15s, background 0.15s',
        minWidth: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = accent + '66'
        el.style.background = accent + '0A'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--border)'
        el.style.background = 'var(--bg)'
      }}
    >
      {/* Thumbnail */}
      {figure.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={figure.imageUrl}
          alt=""
          width={36}
          height={36}
          style={{
            width: 36, height: 36,
            objectFit: 'contain',
            borderRadius: 4,
            flexShrink: 0,
            background: 'var(--s2)',
          }}
          loading="lazy"
        />
      ) : (
        <div style={{
          width: 36, height: 36,
          borderRadius: 4,
          flexShrink: 0,
          background: 'var(--s2)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.4">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <circle cx="8" cy="6" r="1.5" />
            <path d="M4 12c0-2.2 1.8-4 4-4s4 1.8 4 4" />
          </svg>
        </div>
      )}

      {/* Text */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontWeight: 500,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {figure.name}
        </div>
        {figure.exclusive && figure.exclusive !== 'None' && (
          <div style={{ fontSize: '0.68rem', color: accent, marginTop: 1, opacity: 0.85 }}>
            {figure.exclusive}
          </div>
        )}
        {figure.series && (
          <div style={{ fontSize: '0.68rem', color: 'var(--dim)', marginTop: 1 }}>
            Series {figure.series}
          </div>
        )}
      </div>
    </a>
  )
}
