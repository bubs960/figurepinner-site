// CollectionPanel.tsx — Zone 5: eBay CTA + own/want + details
// Wraps existing FigureActions (client component)

import FigureActions from '@/app/components/FigureActions'
import { formatCurrency } from '../_lib/figureFormatters'

interface CollectionPanelProps {
  figureId: string
  figureName: string
  brand: string
  line: string
  genre: string
  ebaySearchUrl: string
  median: number | null
  compCount: number
  scale: string | null
  series: number | null
  packSize: number
  exclusiveTo: string | null
  isPro: boolean
}

export default function CollectionPanel({
  figureId, figureName, brand, line, genre, ebaySearchUrl,
  median, compCount, scale, series, packSize, exclusiveTo, isPro,
}: CollectionPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Price summary + eBay CTA */}
      <div style={{
        background: 'var(--fp-surface-0)',
        border: '1px solid var(--fp-border)',
        borderRadius: 'var(--fp-radius)',
        padding: '1.25rem',
      }}>
        {/* Price */}
        <div style={{ marginBottom: '1rem' }}>
          {median != null ? (
            <>
              <div style={{
                fontFamily: 'var(--fp-font-display)',
                fontSize: '2.25rem', letterSpacing: '0.02em',
                color: 'var(--fp-text)', lineHeight: 1,
              }}>
                {formatCurrency(median)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--fp-dim)', marginTop: '0.25rem' }}>
                median sold · {compCount} comps
              </div>
            </>
          ) : (
            <div style={{
              fontFamily: 'var(--fp-font-display)',
              fontSize: '1.1rem', color: 'var(--fp-dim)',
            }}>
              No price data yet
            </div>
          )}
        </div>

        {/* eBay CTA */}
        <a
          href={ebaySearchUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            background: 'var(--fp-ebay)', color: '#fff',
            padding: '0.8rem', borderRadius: 'var(--fp-radius-sm)',
            fontSize: '0.875rem', fontWeight: '700', textDecoration: 'none',
            marginBottom: '0.375rem',
          }}
        >
          Find It on eBay
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.5h8M6.5 2.5l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <div style={{ fontSize: '0.7rem', color: 'var(--fp-muted)', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--fp-text)', fontWeight: 600 }}>Free for you</strong>
          {' · '}We earn a small commission from eBay
        </div>

        {/* Own / Want buttons */}
        <FigureActions
          figure_id={figureId}
          name={figureName}
          brand={brand}
          line={line}
          genre={genre}
          isPro={isPro}
        />
      </div>

      {/* Quick facts */}
      <div style={{
        background: 'var(--fp-surface-0)',
        border: '1px solid var(--fp-border)',
        borderRadius: 'var(--fp-radius)',
        padding: '1rem',
      }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.1em',
          color: 'var(--fp-dim)', textTransform: 'uppercase', marginBottom: '0.75rem',
        }}>
          Details
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Row label="Brand" value={brand} />
          <Row label="Line" value={line} />
          {series != null && <Row label="Series" value={String(series)} />}
          {scale && <Row label="Scale" value={scale} />}
          {packSize > 1 && <Row label="Pack" value={`${packSize}-pack`} />}
          {exclusiveTo && exclusiveTo !== 'None' && <Row label="Exclusive" value={exclusiveTo} />}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      gap: '0.5rem', fontSize: '0.8rem',
    }}>
      <span style={{ color: 'var(--fp-dim)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--fp-muted)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
