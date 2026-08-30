// ScalePassport.tsx — "Documented Facts" for scale-passport figures (the 208+
// poured KB passport blocks; 8/13 tiering ruling). Same visual language as
// GoldenCorpusPassport, different bar:
//   - values come from the slim KB `passport` block, rendered plainly — no
//     verbatim source quotes or source links (WEBAUDIT-TO-WEB-SOURCE-DISPLAY-
//     REVIEW-SPEC-2026-08-30, Steve 8/30: never republish third-party
//     expressive text on any public surface). The per-wave provenance sidecar
//     stays internal — matcher's quality gates still read it.
//   - unresolved CORE fields render "Not yet documented"; unresolved stretch
//     rows are omitted (core absence is information, stretch absence is noise)
// Server component, no 'use client'; no Intl/date formatting (CLAUDE.md #8).
// Golden-corpus figures never reach this component — the mount point prefers
// GoldenCorpusPassport when a claims doc exists.

import type { KBFigure } from '@/data/kbTypes'
import { buildScalePassportGroups, type ScaleRow } from '../_lib/scalePassport'

function RowBody({ row }: { row: ScaleRow }) {
  if (row.status === 'missing') {
    return <span style={{ color: 'var(--dp-muted)' }}>Not yet documented</span>
  }
  return <span style={{ color: 'var(--dp-text)', fontWeight: 600 }}>{row.value}</span>
}

export default function ScalePassport({ fig, fullWave }: { fig: KBFigure; fullWave: KBFigure[] }) {
  const groups = buildScalePassportGroups(fig, fullWave)
  if (!groups) return null

  return (
    <div id="receipts" style={{ marginTop: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '.02em',
          fontSize: '1.375rem', margin: 0, color: 'var(--dp-text)',
        }}>
          Documented Facts
        </h2>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Fields we couldn&apos;t verify yet say so.
      </div>
      {groups.map(group => (
        <div key={group.title} style={{ marginBottom: '0.9rem' }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '.1em',
            color: 'var(--dp-muted)', marginBottom: '0.35rem',
          }}>
            {group.title.toUpperCase()}
          </div>
          <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden' }}>
            {group.rows.map(row => (
              <div key={row.key} style={{
                display: 'grid', gridTemplateColumns: 'minmax(100px,160px) 1fr', gap: '10px',
                padding: '9px 14px', borderTop: '1px solid rgba(255,255,255,.06)',
                fontSize: '0.8rem', alignItems: 'start',
              }}>
                <span style={{ color: 'var(--dp-muted)' }}>{row.label}</span>
                <RowBody row={row} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
