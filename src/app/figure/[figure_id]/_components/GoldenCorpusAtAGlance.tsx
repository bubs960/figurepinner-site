// GoldenCorpusAtAGlance.tsx — compact under-photo card filling the hero's left
// column (Steve, 2026-08-13: the space under the vitrine sat empty while the
// right column ran long). Renders ONLY when a golden-corpus claims doc exists
// for the figure — same gate as the passport section; every value here is one
// of its receipt-backed claims, restated at a glance. Server component.

import { type FigureClaimsDoc } from '../_lib/goldenCorpus'

function claimValue(doc: FigureClaimsDoc, fieldPath: string): string | null {
  const c = doc.claims.find(c => c.field_path === fieldPath)
  return c?.status === 'resolved' && c.value ? c.value : null
}

function claimValues(doc: FigureClaimsDoc, prefix: string): string[] {
  return doc.claims
    .filter(c => c.field_path.startsWith(prefix) && c.status === 'resolved' && c.value)
    .map(c => c.value as string)
}

export default function GoldenCorpusAtAGlance({ doc }: { doc: FigureClaimsDoc }) {
  const included = claimValues(doc, 'included_items')
  const bafTarget = claimValue(doc, 'wave_context.baf_target')
  const bafPiece = claimValue(doc, 'wave_context.baf_piece')
  const sku = claimValue(doc, 'identity_bonus.manufacturer_sku')
  const msrp = claimValue(doc, 'identity_bonus.original_retail_price')

  const rows: Array<{ label: string; value: string }> = [
    ...(included.length ? [{ label: 'In the box', value: included.join(' · ') }] : []),
    ...(bafTarget && bafPiece ? [{ label: 'Build-a-Figure', value: `${bafTarget} — ${bafPiece}` }] : []),
    ...(msrp ? [{ label: 'Original retail', value: msrp }] : []),
    ...(sku ? [{ label: 'SKU', value: sku }] : []),
  ]
  if (rows.length === 0) return null

  return (
    <div style={{
      marginTop: '18px',
      border: '1px solid var(--shelf-line-gold, rgba(224,168,62,0.2))',
      borderRadius: '12px',
      padding: '14px 16px 12px',
      background: 'linear-gradient(180deg, rgba(224,168,62,0.05), rgba(224,168,62,0.012) 70%, transparent)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '8px', marginBottom: '10px',
      }}>
        <span style={{
          fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'var(--shelf-gold, #e0a83e)',
        }}>
          At a Glance
        </span>
        <span style={{
          fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.06em',
          color: 'var(--shelf-gold-hi, #f5c462)',
          border: '1px solid rgba(224,168,62,0.4)', borderRadius: '100px',
          padding: '2px 8px', whiteSpace: 'nowrap',
        }}>
          SOURCED ↓
        </span>
      </div>
      {rows.map(r => (
        <div key={r.label} style={{
          display: 'grid', gridTemplateColumns: '96px 1fr', gap: '10px',
          padding: '6px 0', borderTop: '1px solid rgba(242,232,213,0.06)',
          fontSize: '0.78rem', alignItems: 'baseline',
        }}>
          <span style={{ color: 'rgba(242,232,213,0.55)' }}>{r.label}</span>
          <span style={{ color: 'var(--shelf-cream, #f2e8d5)', fontWeight: 600, lineHeight: 1.45 }}>{r.value}</span>
        </div>
      ))}
      <div style={{ marginTop: '8px', fontSize: '0.62rem', color: 'rgba(242,232,213,0.45)', lineHeight: 1.5 }}>
        Every fact sourced — receipts in the passport section below.
      </div>
    </div>
  )
}
