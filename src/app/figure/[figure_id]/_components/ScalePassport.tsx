// ScalePassport.tsx — "Documented Facts" for scale-passport figures (the 208+
// poured KB passport blocks; 8/13 tiering ruling). Same visual language as
// GoldenCorpusPassport, different bar:
//   - values come from the slim KB `passport` block, rendered plainly — no
//     verbatim source quotes or source links (WEBAUDIT-TO-WEB-SOURCE-DISPLAY-
//     REVIEW-SPEC-2026-08-30, Steve 8/30: never republish third-party
//     expressive text on any public surface). The per-wave provenance sidecar
//     is loaded read-only, only to check the gate below — never rendered.
//   - unresolved CORE fields render "Not yet documented"; unresolved stretch
//     rows are omitted (core absence is information, stretch absence is noise)
//   - a value that's substantially its own source quote (isVerbatimOverlap,
//     goldenCorpus.ts) also renders as "Not yet documented" — stopgap for the
//     2026-08-30 claim-value audit, see goldenCorpus.ts's module comment
// Server component, no 'use client'; no Intl/date formatting (CLAUDE.md #8).
// Golden-corpus figures never reach this component — the mount point prefers
// GoldenCorpusPassport when a claims doc exists.

import type { KBFigure } from '@/data/kbTypes'
import { type FigureClaimsDoc, isVerbatimOverlap } from '../_lib/goldenCorpus'
import { buildScalePassportGroups, type ScaleGroup, type ScaleRow } from '../_lib/scalePassport'

/** Load this figure's claims doc from its wave sidecar — read-only, purely to
 *  resolve quote text for the gate below. NOT a data source for rendering:
 *  ScalePassport's displayed values always come from the KB `passport` block
 *  (buildScalePassportGroups), never from this doc. Render-safe: any failure
 *  (sidecar not yet synced, fid absent) degrades to no gating data, same
 *  contract as goldenCorpus.ts's getGoldenCorpusClaims. */
async function loadSidecarDoc(fig: KBFigure): Promise<FigureClaimsDoc | null> {
  const sidecar = fig.passport?.sidecar
  if (!sidecar || !/^[a-z0-9-]+(--[a-z0-9-]+){2}$/.test(sidecar)) return null
  try {
    const mod = await import(`@/data/figures-provenance/${sidecar}.json`)
    const docs = (mod.default ?? mod) as Record<string, FigureClaimsDoc>
    return docs[fig.figure_id] ?? null
  } catch {
    return null
  }
}

/** Apply the verbatim-overlap gate, then re-sort so a newly-gated row sinks
 *  to the bottom of its group exactly like a naturally-missing one (same
 *  comparator buildScalePassportGroups already uses). */
function gateRows(rows: ScaleRow[], doc: FigureClaimsDoc | null, quoteIdsByField: Map<string, string[]>): ScaleRow[] {
  return rows
    .map(row => {
      if (row.status !== 'resolved' || !doc) return row
      const quoteIds = quoteIdsByField.get(row.key)
      if (!isVerbatimOverlap(doc, quoteIds, row.value)) return row
      return { ...row, status: 'missing' as const, value: undefined }
    })
    .sort((a, b) =>
      (a.status === 'missing' ? 1 : 0) - (b.status === 'missing' ? 1 : 0) ||
      a.key.localeCompare(b.key, undefined, { numeric: true })
    )
}

function RowBody({ row }: { row: ScaleRow }) {
  if (row.status === 'missing') {
    return <span style={{ color: 'var(--dp-muted)' }}>Not yet documented</span>
  }
  return <span style={{ color: 'var(--dp-text)', fontWeight: 600 }}>{row.value}</span>
}

export default async function ScalePassport({ fig, fullWave }: { fig: KBFigure; fullWave: KBFigure[] }) {
  const groups = buildScalePassportGroups(fig, fullWave)
  if (!groups) return null

  const doc = await loadSidecarDoc(fig)
  const quoteIdsByField = new Map<string, string[]>(
    (doc?.claims ?? [])
      .filter(c => c.status === 'resolved' && c.evidence_quote_ids?.length)
      .map(c => [c.field_path, c.evidence_quote_ids as string[]])
  )
  const gatedGroups: ScaleGroup[] = groups.map(g => ({ ...g, rows: gateRows(g.rows, doc, quoteIdsByField) }))

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
      {gatedGroups.map(group => (
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
