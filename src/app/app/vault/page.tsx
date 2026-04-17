import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'My Collection',
  robots: { index: false, follow: false },
}

// Placeholder collection items — replace with real API data once endpoint is confirmed
const PLACEHOLDER_ITEMS = [
  { id: '1', name: 'Rey Mysterio Elite 100', line: 'Mattel Elite', genre: 'wrestling', slug: 'rey-mysterio-elite-100', avg_price: 34, paid: 18, condition: 'Loose' },
  { id: '2', name: 'CM Punk Elite Return', line: 'Mattel Elite', genre: 'wrestling', slug: 'cm-punk-elite-return', avg_price: 67, paid: 55, condition: 'MOC' },
  { id: '3', name: 'Roman Reigns Acknowledge Me', line: 'Mattel Elite', genre: 'wrestling', slug: 'roman-reigns-acknowledge-me', avg_price: 28, paid: 22, condition: 'Loose' },
  { id: '4', name: 'Bret Hart Defining Moments', line: 'Mattel Elite', genre: 'wrestling', slug: 'bret-hart-defining-moments', avg_price: 112, paid: 85, condition: 'MOC' },
]

const totalPaid = PLACEHOLDER_ITEMS.reduce((s, i) => s + i.paid, 0)
const totalValue = PLACEHOLDER_ITEMS.reduce((s, i) => s + i.avg_price, 0)
const totalGain = totalValue - totalPaid

export default function VaultPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)', marginBottom: '0.25rem' }}>
            MY COLLECTION
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            {PLACEHOLDER_ITEMS.length} figures tracked
          </p>
        </div>
        <button style={{
          background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
          padding: '0.625rem 1.25rem', borderRadius: '7px', fontSize: '0.875rem',
          fontWeight: '600', fontFamily: 'var(--font-ui)',
        }}>
          + Add Figure
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
        <SummaryCard label="TOTAL PAID" value={`$${totalPaid}`} />
        <SummaryCard label="CURRENT VALUE" value={`$${totalValue}`} highlight />
        <SummaryCard
          label="TOTAL GAIN"
          value={`${totalGain >= 0 ? '+' : ''}$${totalGain}`}
          color={totalGain >= 0 ? 'var(--green)' : '#FF4444'}
        />
      </div>

      {/* Collection grid */}
      {PLACEHOLDER_ITEMS.length === 0
        ? <EmptyState />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 90px 90px 80px 36px',
              padding: '0.5rem 1rem', gap: '1rem',
              fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em',
              color: 'var(--muted)', textTransform: 'uppercase',
            }}>
              <span>Figure</span>
              <span>Condition</span>
              <span style={{ textAlign: 'right' }}>Paid</span>
              <span style={{ textAlign: 'right' }}>Avg Value</span>
              <span style={{ textAlign: 'right' }}>Gain</span>
              <span />
            </div>

            {PLACEHOLDER_ITEMS.map(item => {
              const gain = item.avg_price - item.paid
              const gainPct = Math.round((gain / item.paid) * 100)
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 90px 90px 80px 36px',
                    padding: '0.875rem 1rem',
                    gap: '1rem',
                    background: 'var(--s1)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                  }}
                >
                  <div>
                    <a
                      href={`/${item.genre}/mattel-elite/${item.slug}`}
                      style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: '500' }}
                    >
                      {item.name}
                    </a>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{item.line}</div>
                  </div>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                    fontSize: '0.75rem', fontWeight: '600',
                    background: item.condition === 'MOC' ? 'rgba(0,200,112,0.12)' : 'rgba(255,255,255,0.06)',
                    color: item.condition === 'MOC' ? 'var(--green)' : 'var(--muted)',
                    width: 'fit-content',
                  }}>
                    {item.condition}
                  </span>
                  <span style={{ textAlign: 'right', color: 'var(--muted)' }}>${item.paid}</span>
                  <span style={{ textAlign: 'right', fontWeight: '600' }}>${item.avg_price}</span>
                  <span style={{
                    textAlign: 'right', fontWeight: '600',
                    color: gain >= 0 ? 'var(--green)' : '#FF4444',
                  }}>
                    {gain >= 0 ? '+' : ''}{gainPct}%
                  </span>
                  <button style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: '5px',
                    color: 'var(--muted)', cursor: 'pointer', padding: '4px 6px',
                    fontSize: '0.75rem', fontFamily: 'var(--font-ui)',
                  }}>
                    ···
                  </button>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}

function SummaryCard({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div style={{
      background: 'var(--s1)', border: `1px solid ${highlight ? 'var(--blue)' : 'var(--border)'}`,
      borderRadius: '10px', padding: '1rem 1.25rem',
    }}>
      <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.375rem' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', letterSpacing: '0.02em', color: color ?? 'var(--text)' }}>
        {value}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center', padding: '4rem 2rem',
      background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px',
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        YOUR VAULT IS EMPTY
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
        Add figures to your collection to track their value over time.
      </p>
      <button style={{
        background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
        padding: '0.625rem 1.5rem', borderRadius: '7px', fontSize: '0.875rem',
        fontWeight: '600', fontFamily: 'var(--font-ui)',
      }}>
        + Add Your First Figure
      </button>
    </div>
  )
}
