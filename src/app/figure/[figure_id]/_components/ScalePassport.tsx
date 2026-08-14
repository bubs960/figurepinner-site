// ScalePassport.tsx — "Documented Facts" for scale-passport figures (the 208+
// poured KB passport blocks; 8/13 tiering ruling). Same visual language as
// GoldenCorpusPassport, different bar:
//   - values + evidence-class badges come from the slim KB `passport` block
//   - receipts ("show source") resolve from the per-wave provenance sidecar
//     (src/data/figures-provenance/<sidecar>.json), loaded lazily per wave
//   - unresolved CORE fields render "Not yet documented"; unresolved stretch
//     rows are omitted (core absence is information, stretch absence is noise)
//   - pour-derived rows (closed whitelist, e.g. the base-figure included_items
//     row) render without an evidence badge — they're catalog derivations, not
//     evidence-locked claims, and must not borrow the sourced look
// Server component, no 'use client'; no Intl/date formatting (CLAUDE.md #8).
// Golden-corpus figures never reach this component — the mount point prefers
// GoldenCorpusPassport when a claims doc exists.

import type { KBFigure } from '@/data/kbTypes'
import {
  type FigureClaimsDoc,
  resolveEvidence,
} from '../_lib/goldenCorpus'
import { buildScalePassportGroups, type ScaleRow } from '../_lib/scalePassport'
import { evidenceBadge } from './GoldenCorpusPassport'

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Load this figure's claims doc from its wave sidecar. Render-safe: any
 *  failure (sidecar not yet synced, fid absent) degrades to values-only rows —
 *  the values themselves are still poured, gate-passed data. */
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

function ShowSource({ doc, quoteIds }: { doc: FigureClaimsDoc; quoteIds: string[] | undefined }) {
  const evidence = resolveEvidence(doc, quoteIds)
  if (evidence.length === 0) return null
  return (
    <details style={{ marginTop: '4px' }}>
      <summary style={{
        cursor: 'pointer', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '.06em',
        color: 'var(--dp-cyan)', listStyle: 'none',
      }}>
        SHOW SOURCE{evidence.length > 1 ? `S (${evidence.length})` : ''}
      </summary>
      <div style={{ marginTop: '6px', display: 'grid', gap: '6px' }}>
        {evidence.map(({ quote, source }) => (
          <div key={quote.quote_id} style={{
            padding: '8px 10px', borderRadius: '8px',
            background: 'rgba(78,205,230,.05)', border: '1px solid rgba(78,205,230,.2)',
            fontSize: '0.72rem', lineHeight: 1.5,
          }}>
            <div style={{ color: 'var(--dp-text)', fontStyle: 'italic' }}>&ldquo;{quote.text}&rdquo;</div>
            {source && (
              <div style={{ marginTop: '4px', color: 'var(--dp-muted)' }}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{ color: 'var(--dp-cyan)', textDecoration: 'underline' }}
                >
                  {hostname(source.url)}
                </a>
                {source.retrieved_at ? ` · retrieved ${source.retrieved_at}` : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </details>
  )
}

function RowBody({ row, doc, quoteIds }: { row: ScaleRow; doc: FigureClaimsDoc | null; quoteIds?: string[] }) {
  if (row.status === 'missing') {
    return <span style={{ color: 'var(--dp-muted)' }}>Not yet documented</span>
  }
  if (row.derived) {
    // Catalog-derived: plain value, no evidence badge, no show-source.
    return <span style={{ color: 'var(--dp-text)', fontWeight: 600 }}>{row.value}</span>
  }
  const badge = evidenceBadge(row.ec)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--dp-text)', fontWeight: 600, fontStyle: badge.inferred ? 'italic' : undefined }}>{row.value}</span>
        <span style={{
          fontSize: '0.58rem', fontWeight: 700, letterSpacing: '.05em',
          color: badge.color, border: `1px solid ${badge.color}`,
          borderRadius: '100px', padding: '1px 7px', whiteSpace: 'nowrap',
        }}>
          {badge.label}
        </span>
      </div>
      {doc && <ShowSource doc={doc} quoteIds={quoteIds} />}
    </div>
  )
}

export default async function ScalePassport({ fig, fullWave }: { fig: KBFigure; fullWave: KBFigure[] }) {
  const groups = buildScalePassportGroups(fig, fullWave)
  if (!groups) return null

  const doc = await loadSidecarDoc(fig)
  // field_path → quote ids, from the sidecar's evidence-locked claims.
  const quoteIdsByField = new Map<string, string[]>(
    (doc?.claims ?? [])
      .filter(c => c.status === 'resolved' && c.evidence_quote_ids?.length)
      .map(c => [c.field_path, c.evidence_quote_ids as string[]])
  )

  // The "expand a row" promise only appears when at least one rendered row
  // actually carries receipts — a quotes-free page must not advertise them.
  const hasAnyReceipts = doc != null && groups.some(g =>
    g.rows.some(r => r.status === 'resolved' && !r.derived && quoteIdsByField.has(r.key)))

  return (
    <div id="receipts" style={{ marginTop: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '.02em',
          fontSize: '1.375rem', margin: 0, color: 'var(--dp-text)',
        }}>
          Documented Facts
        </h2>
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: '100px',
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '.08em',
          background: 'rgba(78,205,230,.08)', border: '1px solid var(--dp-cyan)', color: 'var(--dp-cyan)',
        }}>
          SOURCED
        </span>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Facts below come from named sources with their evidence class shown
        {hasAnyReceipts ? ' — expand a row to see the exact quote it came from' : ''}. Fields we
        couldn&apos;t verify yet say so.
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
                <RowBody row={row} doc={doc} quoteIds={quoteIdsByField.get(row.key)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
