'use client'

import { useState } from 'react'
import ProUpgradeButton from '../../components/ProUpgradeButton'

const FREE_FEATURES = [
  'Unlimited figure lookups',
  '100 searches/month',
  'Current median price + 30-day range',
  '25 vault slots',
  '3 price alerts',
  '5 List Its per month',
  'Show Mode (basic)',
  'Community support',
]

const PRO_FEATURES = [
  { label: 'Everything in Free', highlight: false },
  { label: 'Unlimited searches', highlight: true },
  { label: '90 / 180-day price charts + trend', highlight: true },
  { label: 'Unlimited vault', highlight: true },
  { label: 'Unlimited price alerts', highlight: true },
  { label: 'Unlimited List It', highlight: true },
  { label: 'Export to CSV / Excel', highlight: true },
  { label: 'Arbitrage alerts', highlight: true },
  { label: '6-hour Scout refresh (vs 24h)', highlight: true },
  { label: 'Enhanced Show Mode analytics', highlight: false },
  { label: 'Ad-free website', highlight: false },
  { label: 'Pro badge', highlight: false },
  { label: 'Priority email support', highlight: false },
]

export default function ProPricingCards() {
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual')

  return (
    <section style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>

      {/* Billing toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '0' }}>
        <div style={{
          display: 'inline-flex', background: 'var(--s1)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '3px', gap: '3px',
        }}>
          <ToggleBtn active={billing === 'annual'} onClick={() => setBilling('annual')}>
            Annual&nbsp;<span style={{
              fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em',
              background: 'rgba(0,200,112,0.15)', color: 'var(--green)',
              padding: '1px 6px', borderRadius: '100px', marginLeft: '4px',
            }}>37% off</span>
          </ToggleBtn>
          <ToggleBtn active={billing === 'monthly'} onClick={() => setBilling('monthly')}>
            Monthly
          </ToggleBtn>
        </div>
      </div>

      {/* Cards */}
      <style>{`@media (max-width: 640px) { .fp-pro-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="fp-pro-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Free card */}
        <div style={{
          background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.5rem' }}>FREE</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>$0</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>Forever free. No card needed.</div>
          <a href="/sign-up" style={{
            display: 'block', textAlign: 'center', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '0.625rem', borderRadius: '6px', fontSize: '0.875rem',
            fontWeight: '600', textDecoration: 'none', marginBottom: '1.75rem',
          }}>
            Create Free Account
          </a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                <CheckIcon color="var(--muted)" /> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Pro card */}
        <div style={{
          background: 'var(--s1)', border: '2px solid var(--blue)', borderRadius: '12px', padding: '2rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'var(--blue)', color: '#fff', fontSize: '0.7rem', fontWeight: '700',
            letterSpacing: '0.08em', padding: '0.25rem 0.625rem', borderRadius: '100px',
          }}>
            {billing === 'annual' ? 'BEST VALUE' : 'MONTHLY'}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--blue)', marginBottom: '0.5rem' }}>PRO</div>

          {billing === 'annual' ? (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>$29.99</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>per year — less than one figure</div>
              <div style={{ color: 'var(--green)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '1.5rem' }}>Save 37% vs monthly</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>$3.99</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>per month, cancel anytime</div>
            </>
          )}

          <div style={{ marginBottom: '1.75rem' }}>
            <ProUpgradeButton size="sm" billing={billing} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {PRO_FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: f.highlight ? 'var(--text)' : 'var(--muted)' }}>
                <CheckIcon color={f.highlight ? 'var(--green)' : 'var(--muted)'} /> {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '1.25rem' }}>
        No credit card required for free account. Cancel Pro anytime.
      </p>
    </section>
  )
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--blue)' : 'transparent',
        color: active ? '#fff' : 'var(--muted)',
        border: 'none',
        borderRadius: '6px',
        padding: '0.5rem 1.125rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {children}
    </button>
  )
}

function CheckIcon({ color = 'var(--green)' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color }}>
      <circle cx="7" cy="7" r="6" fill="currentColor" fillOpacity="0.15" />
      <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
