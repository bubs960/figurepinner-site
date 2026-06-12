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
}

export default function CollectionPanel({
  figureId, figureName, brand, line, genre, ebaySearchUrl,
  median, compCount, scale, series, packSize, exclusiveTo,
}: CollectionPanelProps) {
  return (
    <div className="fp-cpanel" style={{ display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fpCpanelIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
        .fp-cpanel { animation: fpCpanelIn .7s cubic-bezier(.22,.61,.36,1) both; }
        .fp-cpanel-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 0 rgba(255,255,255,.22) inset, 0 8px 22px rgba(224,168,62,.3);
        }
        .fp-cpanel-spec > * + * {
          border-top: 1px solid var(--shelf-line, rgba(242,232,213,.08));
          padding-top: 0.625rem;
        }
        @media (prefers-reduced-motion: reduce) {
          .fp-cpanel { animation: none; }
          .fp-cpanel-cta { transition: none; }
          .fp-cpanel-cta:hover { transform: none; }
        }
      `}</style>

      {/* The placard — hairline gold frame, glass tint, thin lit top edge */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--shelf-line-gold, rgba(224,168,62,.20))',
        borderRadius: '16px',
        background: 'linear-gradient(180deg, rgba(224,168,62,.05), rgba(224,168,62,.015) 60%, transparent)',
        padding: '1.375rem 1.375rem 1.125rem',
      }}>
        {/* thin lit edge, echoes the display-case light strip */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(245,196,98,.55), transparent)',
        }} />

        {/* Price summary — modest, numbers support */}
        <div style={{ marginBottom: '1.125rem' }}>
          {median != null ? (
            <>
              <div style={{
                fontFamily: 'var(--fp-font-display)',
                fontSize: '1.75rem', letterSpacing: '0.02em',
                color: 'var(--shelf-gold-hi, #f5c462)', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {formatCurrency(median)}
              </div>
              <div style={{
                fontSize: '0.625rem', fontWeight: 500,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
                marginTop: '0.375rem',
              }}>
                median sold · {compCount} comps
              </div>
            </>
          ) : (
            <div style={{
              fontFamily: 'var(--fp-font-body)',
              fontSize: '0.95rem', fontWeight: 400,
              color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
            }}>
              No price data yet
            </div>
          )}
        </div>

        {/* eBay CTA — gold filled, dark text, the one loud thing */}
        <a
          data-ebay-inline-cta
          href={ebaySearchUrl}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="fp-cpanel-cta"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            background: 'linear-gradient(180deg, var(--shelf-gold-hi, #f5c462), var(--shelf-gold, #e0a83e))',
            color: '#1a1206',
            padding: '0.7rem 1.25rem', borderRadius: '99px',
            fontFamily: 'var(--fp-font-body)',
            fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.01em',
            textDecoration: 'none',
            boxShadow: '0 1px 0 rgba(255,255,255,.22) inset, 0 4px 14px rgba(224,168,62,.18)',
            transition: 'transform .2s, box-shadow .2s',
            marginBottom: '0.5rem',
          }}
        >
          Find It on eBay
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.5h8M6.5 2.5l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <div style={{
          fontSize: '0.7rem', fontWeight: 300,
          color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
          textAlign: 'center', marginBottom: '1rem', lineHeight: 1.5,
        }}>
          <strong style={{ color: 'var(--shelf-cream, #f2e8d5)', fontWeight: 500 }}>Free for you</strong>
          {' · '}We earn a small commission from eBay
        </div>

        {/* Own / Want buttons */}
        <FigureActions
          figure_id={figureId}
          name={figureName}
          brand={brand}
          line={line}
          genre={genre}
        />

        {/* Quick facts — sleek spec list, hairline-divided */}
        <div style={{
          marginTop: '1.25rem', paddingTop: '1rem',
          borderTop: '1px solid var(--shelf-line, rgba(242,232,213,.08))',
        }}>
          <div style={{
            fontSize: '0.625rem', fontWeight: 500, letterSpacing: '0.24em',
            color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
            textTransform: 'uppercase', marginBottom: '0.875rem',
          }}>
            Details
          </div>
          <div className="fp-cpanel-spec" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <Row label="Brand" value={brand} />
            <Row label="Line" value={line} />
            {series != null && <Row label="Series" value={String(series)} />}
            {scale && <Row label="Scale" value={scale} />}
            {packSize > 1 && <Row label="Pack" value={`${packSize}-pack`} />}
            {exclusiveTo && exclusiveTo !== 'None' && <Row label="Exclusive" value={exclusiveTo} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: '0.625rem', fontWeight: 500,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
      }}>
        {label}
      </div>
      <div style={{
        marginTop: '0.1875rem',
        fontSize: '0.9375rem', fontWeight: 500,
        color: 'var(--shelf-cream, #f2e8d5)',
        lineHeight: 1.35,
      }}>
        {value}
      </div>
    </div>
  )
}
