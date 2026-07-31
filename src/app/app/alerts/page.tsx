'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { genreMark } from '@/app/_lib/genreMarks'

type AlertItem = {
  id: string
  figure_id: string
  name: string
  brand: string | null
  line: string | null
  genre: string | null
  target_price: number
  is_active: number
  created_at: string
}

export default function AlertsPage() {
  const { isLoaded } = useUser()
  const [items, setItems] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    fetch('/api/alerts')
      .then(r => r.json())
      .then((d: { items: AlertItem[] }) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [isLoaded])

  async function removeAlert(id: string) {
    setDeleting(id)
    await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleting(null)
  }

  function onAlertCreated(item: AlertItem) {
    setItems(prev => [item, ...prev])
    setShowModal(false)
  }

  // Wait for Clerk to load
  if (!isLoaded) return <LoadingShimmer />

  const atFreeLimit = false

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)', marginBottom: '0.25rem' }}>
            DEAL ALERTS
          </h1>
          <p style={{ color: 'var(--text)', fontSize: '0.875rem' }}>
            {loading ? '—' : `${items.length} active alert${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={atFreeLimit}
          style={{
            background: atFreeLimit ? 'var(--s2)' : 'var(--blue)',
            color: atFreeLimit ? 'var(--muted)' : '#fff',
            border: 'none', cursor: atFreeLimit ? 'not-allowed' : 'pointer',
            padding: '0.625rem 1.25rem', borderRadius: '7px', fontSize: '0.875rem',
            fontWeight: '600', fontFamily: 'var(--font-ui)',
            opacity: atFreeLimit ? 0.6 : 1,
          }}
        >
          + New Alert
        </button>
      </div>


      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState onNew={() => setShowModal(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 110px 36px',
            padding: '0.5rem 1rem', gap: '1rem',
            fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em',
            color: 'var(--text)', textTransform: 'uppercase',
          }}>
            <span>Figure</span>
            <span style={{ textAlign: 'right' }}>Target Price</span>
            <span />
          </div>

          {items.map(alert => (
            <div key={alert.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 110px 36px',
              padding: '0.875rem 1rem', gap: '1rem',
              background: 'var(--s1)',
              border: '1px solid var(--border)',
              borderRadius: '8px', alignItems: 'center', fontSize: '0.875rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0, color: 'var(--muted)' }}>{genreMark(alert.genre, 'DA')}</span>
                <div style={{ minWidth: 0 }}>
                  <a
                    href={`/figure/${alert.figure_id}`}
                    style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                  >
                    {alert.name}
                  </a>
                  {alert.line && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{alert.line}</div>
                  )}
                </div>
              </div>
              <span style={{ textAlign: 'right', color: alert.target_price ? 'var(--text)' : 'var(--muted)', fontWeight: alert.target_price ? '600' : '400' }}>
                {alert.target_price ? `$${alert.target_price}` : '—'}
              </span>
              <button
                onClick={() => removeAlert(alert.id)}
                disabled={deleting === alert.id}
                style={{
                  background: 'none', border: '1px solid var(--border)', borderRadius: '5px',
                  color: 'var(--muted)', cursor: 'pointer', padding: '4px 6px',
                  fontSize: '0.75rem', fontFamily: 'var(--font-ui)',
                  opacity: deleting === alert.id ? 0.4 : 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewAlertModal
          onClose={() => setShowModal(false)}
          onCreated={onAlertCreated}
        />
      )}
    </div>
  )
}

function NewAlertModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (item: AlertItem) => void
}) {
  const [name, setName] = useState('')
  const [figureId, setFigureId] = useState('')
  const [line, setLine] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Escape closes, same as every other overlay in the app (7/26 overlay
  // audit — this modal was the only one without it).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Figure name is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figure_id: figureId.trim() || `manual-${Date.now()}`,
          name: name.trim(),
          line: line.trim() || undefined,
          target_price: targetPrice ? parseFloat(targetPrice) : 0,
        }),
      })
      if (res.status === 401) { window.location.href = '/sign-in'; return }
      if (!res.ok) { setError('Failed to create alert'); return }
      const { id } = await res.json() as { id: string }
      onCreated({
        id,
        figure_id: figureId.trim() || `manual-${Date.now()}`,
        name: name.trim(),
        brand: null,
        line: line.trim() || null,
        genre: null,
        target_price: targetPrice ? parseFloat(targetPrice) : 0,
        is_active: 1,
        created_at: new Date().toISOString(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '1rem',
    }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fp-new-alert-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px',
        padding: '2rem', width: '100%', maxWidth: '440px',
      }}>
        <h2 id="fp-new-alert-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.04em', marginBottom: '1.5rem' }}>
          NEW DEAL ALERT
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Figure Name *">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ultimate Warrior Defining Moments"
              style={inputStyle}
              autoFocus
            />
          </Field>
          <Field label="Line / Series">
            <input
              type="text"
              value={line}
              onChange={e => setLine(e.target.value)}
              placeholder="e.g. Mattel Elite"
              style={inputStyle}
            />
          </Field>
          <Field label="Target Price ($)">
            <input
              type="number"
              value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              style={inputStyle}
            />
          </Field>
          {error && <p style={{ color: '#FF4444', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', cursor: 'pointer', padding: '0.625rem',
                borderRadius: '7px', fontSize: '0.875rem', fontFamily: 'var(--font-ui)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1, background: 'var(--blue)', border: 'none', color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer', padding: '0.625rem',
                borderRadius: '7px', fontSize: '0.875rem', fontWeight: '600',
                fontFamily: 'var(--font-ui)', opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Create Alert'}
            </button>
          </div>
        </form>
        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
          Tip: Find a figure in search first, then add it to your Want List to auto-fill alerts.
        </p>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--s2)', border: '1px solid var(--border)',
  borderRadius: '7px', padding: '0.625rem 0.875rem', color: 'var(--text)',
  fontSize: '0.9rem', fontFamily: 'var(--font-body)', outline: 'none',
  boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text)', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function LoadingShimmer() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: '60px', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '8px', opacity: 0.5 }} />
      ))}
    </div>
  )
}

function ProGate() {
  return (
    <div style={{ maxWidth: '560px', margin: '4rem auto', textAlign: 'center' }}>
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem 2rem',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>DA</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
          DEAL ALERTS
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Set a target price for any figure. When eBay sold prices drop to your target, we&apos;ll email you immediately — so you can buy before the deal disappears.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem', textAlign: 'left' }}>
          {[
            'Email alert within minutes of price drop',
            'Unlimited alerts across all genres',
            'Works on any figure in our 18K+ database',
            'Pause or delete alerts anytime',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem' }}>
              <CheckIcon /> {f}
            </div>
          ))}
        </div>

        <div style={{
          display: 'block', background: 'var(--s2)', color: 'var(--muted)',
          padding: '0.875rem', borderRadius: '8px', fontSize: '0.875rem',
          fontWeight: '600', marginBottom: '0.625rem', border: '1px solid var(--border)',
        }}>
          Pro alerts return soon — held while we build out more verticals.
        </div>
        {/* Purchase copy ("Cancel anytime...") removed 2026-07-03 (Steve: hide
            dead-end Pro CTAs) — orphaned sales language under a returns-soon
            notice with nothing to buy. Restore with the Pro relaunch. */}
      </div>
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{
      textAlign: 'center', padding: '4rem 2rem',
      background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>DA</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        NO ACTIVE ALERTS
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '320px', margin: '0 auto 1.5rem' }}>
        Set a price alert on any figure and we&apos;ll notify you when it drops.
      </p>
      <button
        onClick={onNew}
        style={{
          background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
          padding: '0.625rem 1.5rem', borderRadius: '7px', fontSize: '0.875rem',
          fontWeight: '600', fontFamily: 'var(--font-ui)',
        }}
      >
        + Create Alert
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: '60px', background: 'var(--s1)', border: '1px solid var(--border)',
          borderRadius: '8px', opacity: 0.5,
        }} />
      ))}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--green)' }}>
      <circle cx="7" cy="7" r="6" fill="currentColor" fillOpacity="0.15" />
      <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
