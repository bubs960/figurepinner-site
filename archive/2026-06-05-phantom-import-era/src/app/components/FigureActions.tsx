'use client'

import { useState } from 'react'

type Props = {
  figure_id: string
  name: string
  brand: string
  line: string
  genre: string
  isPro?: boolean
}

type Status = 'idle' | 'loading' | 'done' | 'error'

const CONDITIONS = ['Loose', 'Near Mint', 'MOC', 'Opened', 'Damaged']

type GatePayload = {
  error: string
  message: string
  limit: number
  current: number
  upgrade_url: string
}

type WarnPayload = {
  warning?: string
  message?: string
  remaining?: number
  upgrade_url?: string
}

export default function FigureActions({ figure_id, name, brand, line, genre, isPro = false }: Props) {
  const [vaultStatus, setVaultStatus] = useState<Status>('idle')
  const [wantStatus, setWantStatus] = useState<Status>('idle')
  const [alertStatus, setAlertStatus] = useState<Status>('idle')
  const [paidInput, setPaidInput] = useState('')
  const [conditionInput, setConditionInput] = useState('Loose')
  const [targetInput, setTargetInput] = useState('')
  const [alertTargetInput, setAlertTargetInput] = useState('')
  const [showVaultForm, setShowVaultForm] = useState(false)
  const [showWantForm, setShowWantForm] = useState(false)
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [vaultGate, setVaultGate] = useState<GatePayload | null>(null)
  const [vaultWarn, setVaultWarn] = useState<WarnPayload | null>(null)
  const [alertGate, setAlertGate] = useState<GatePayload | null>(null)

  async function addToVault() {
    setVaultStatus('loading')
    setVaultGate(null)
    setVaultWarn(null)
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figure_id, name, brand, line, genre,
          paid: paidInput ? parseFloat(paidInput) : 0,
          condition: conditionInput,
        }),
      })
      if (res.status === 401) {
        window.location.href = '/sign-in'
        return
      }
      if (res.status === 402) {
        const data = await res.json() as GatePayload
        setVaultGate(data)
        setVaultStatus('idle')
        setShowVaultForm(false)
        return
      }
      if (res.ok) {
        const data = await res.json() as WarnPayload
        setVaultStatus('done')
        setShowVaultForm(false)
        // Show near-limit warning if API returned one
        if (data.warning) setVaultWarn(data)
      } else if (res.status === 409) {
        // Already in vault — treat as success (idempotent)
        setVaultStatus('done')
        setShowVaultForm(false)
      } else {
        setVaultStatus('error')
      }
    } catch {
      setVaultStatus('error')
    }
  }

  async function setAlert() {
    setAlertStatus('loading')
    setAlertGate(null)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figure_id, name, brand, line, genre,
          target_price: alertTargetInput ? parseFloat(alertTargetInput) : 0,
        }),
      })
      if (res.status === 401) {
        window.location.href = '/sign-in'
        return
      }
      if (res.status === 402) {
        const data = await res.json() as GatePayload
        setAlertGate(data)
        setAlertStatus('idle')
        setShowAlertForm(false)
        return
      }
      if (res.ok) {
        setAlertStatus('done')
        setShowAlertForm(false)
      } else {
        setAlertStatus('error')
      }
    } catch {
      setAlertStatus('error')
    }
  }

  async function addToWantlist() {
    setWantStatus('loading')
    try {
      const res = await fetch('/api/wantlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figure_id, name, brand, line, genre,
          target_price: targetInput ? parseFloat(targetInput) : 0,
        }),
      })
      if (res.ok) {
        setWantStatus('done')
        setShowWantForm(false)
      } else if (res.status === 401) {
        window.location.href = '/sign-in'
      } else if (res.status === 409) {
        // Already in wantlist — treat as success (idempotent)
        setWantStatus('done')
        setShowWantForm(false)
      } else {
        setWantStatus('error')
      }
    } catch {
      setWantStatus('error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

      {/* ── Vault gate CTA ── */}
      {vaultGate && (
        <div style={{
          border: '1px solid rgba(0,102,255,0.3)', borderRadius: '8px', padding: '0.875rem',
          background: 'rgba(0,102,255,0.06)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text)', marginBottom: '0.375rem' }}>
            Vault full ({vaultGate.limit} figures)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
            Upgrade to Pro for unlimited storage.
          </div>
          <a href={vaultGate.upgrade_url} style={{
            display: 'inline-block', background: 'var(--blue)', color: '#fff',
            padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.8rem',
            fontWeight: '700', textDecoration: 'none',
          }}>
            Upgrade to Pro →
          </a>
        </div>
      )}

      {/* ── Vault near-limit warning ── */}
      {vaultWarn?.warning && (
        <div style={{
          border: '1px solid rgba(255,184,0,0.3)', borderRadius: '6px', padding: '0.625rem 0.875rem',
          background: 'rgba(255,184,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
            {vaultWarn.remaining === 0
              ? 'Vault is now full.'
              : `${vaultWarn.remaining} vault spot${vaultWarn.remaining === 1 ? '' : 's'} left.`}
          </span>
          <a href="/pro" style={{ fontSize: '0.72rem', color: 'var(--blue)', fontWeight: '600', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Upgrade →
          </a>
        </div>
      )}

      {/* ── Add to Collection ── */}
      {!vaultGate && (
        vaultStatus === 'done' ? (
          <div style={{ textAlign: 'center', padding: '0.625rem', fontSize: '0.8rem', color: 'var(--fp-success, var(--green))', fontWeight: '600' }}>
            ✓ Added to Collection
          </div>
        ) : showVaultForm ? (
          <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>What did you pay?</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={paidInput}
                  onChange={e => setPaidInput(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--s2)', border: '1px solid var(--border)',
                    borderRadius: '5px', color: 'var(--text)', padding: '0.375rem 0.5rem',
                    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Condition</label>
                <select
                  value={conditionInput}
                  onChange={e => setConditionInput(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--s2)', border: '1px solid var(--border)',
                    borderRadius: '5px', color: 'var(--text)', padding: '0.375rem 0.5rem',
                    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                  }}
                >
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={addToVault}
                disabled={vaultStatus === 'loading'}
                style={{
                  flex: 1, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
                  padding: '0.5rem 0.875rem', borderRadius: '5px', fontSize: '0.8rem', fontWeight: '600',
                }}
              >
                {vaultStatus === 'loading' ? '…' : 'Add to Collection'}
              </button>
              <button
                onClick={() => setShowVaultForm(false)}
                style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', padding: '0.5rem 0.625rem', borderRadius: '5px', color: 'var(--muted)', fontSize: '0.8rem' }}
              >
                ✕
              </button>
            </div>
            {vaultStatus === 'error' && <span style={{ fontSize: '0.75rem', color: '#FF4444' }}>Something went wrong</span>}
          </div>
        ) : (
          <button
            onClick={() => setShowVaultForm(true)}
            style={{
              display: 'block', width: '100%', textAlign: 'center', border: '1px solid var(--border)',
              background: 'none', color: 'var(--text)', padding: '0.625rem', borderRadius: '6px',
              fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer',
            }}
          >
            + Add to Collection
          </button>
        )
      )}

      {/* ── Add to Want List ── */}
      {wantStatus === 'done' ? (
        <div style={{ textAlign: 'center', padding: '0.625rem', fontSize: '0.8rem', color: 'var(--fp-success, var(--green))', fontWeight: '600' }}>
          ✓ Added to Want List
        </div>
      ) : showWantForm ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Target price (optional)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="$0"
              value={targetInput}
              onChange={e => setTargetInput(e.target.value)}
              style={{
                flex: 1, background: 'var(--s2)', border: '1px solid var(--border)',
                borderRadius: '5px', color: 'var(--text)', padding: '0.375rem 0.5rem',
                fontSize: '0.875rem', outline: 'none',
              }}
            />
            <button
              onClick={addToWantlist}
              disabled={wantStatus === 'loading'}
              style={{
                background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
                padding: '0.375rem 0.875rem', borderRadius: '5px', fontSize: '0.8rem', fontWeight: '600',
              }}
            >
              {wantStatus === 'loading' ? '…' : 'Add to Want List'}
            </button>
            <button
              onClick={() => setShowWantForm(false)}
              style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', padding: '0.375rem 0.5rem', borderRadius: '5px', color: 'var(--muted)', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          </div>
          {wantStatus === 'error' && <span style={{ fontSize: '0.75rem', color: '#FF4444' }}>Something went wrong</span>}
        </div>
      ) : (
        <button
          onClick={() => setShowWantForm(true)}
          style={{
            display: 'block', width: '100%', textAlign: 'center', border: '1px solid var(--border)',
            background: 'none', color: 'var(--text)', padding: '0.625rem', borderRadius: '6px',
            fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer',
          }}
        >
          ⭐ Add to Want List
        </button>
      )}

      {/* ── Deal Alert — free gets 3, Pro gets unlimited ── */}
      {alertGate ? (
        // Hit the free alert limit — show upgrade CTA
        <div style={{
          border: '1px solid rgba(0,102,255,0.3)', borderRadius: '8px', padding: '0.875rem',
          background: 'rgba(0,102,255,0.06)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text)', marginBottom: '0.375rem' }}>
            {alertGate.limit} alerts is the Free limit
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
            Unlimited with Pro.
          </div>
          <a href={alertGate.upgrade_url} style={{
            display: 'inline-block', background: 'var(--blue)', color: '#fff',
            padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.8rem',
            fontWeight: '700', textDecoration: 'none',
          }}>
            Upgrade to Pro →
          </a>
        </div>
      ) : alertStatus === 'done' ? (
        <div style={{ textAlign: 'center', padding: '0.625rem', fontSize: '0.8rem', color: 'var(--fp-success, var(--green))', fontWeight: '600' }}>
          🔔 Alert set
        </div>
      ) : showAlertForm ? (
        <div style={{ border: '1px solid rgba(0,102,255,0.35)', borderRadius: '6px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,102,255,0.04)' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Alert me when price drops below ($)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="0"
              value={alertTargetInput}
              onChange={e => setAlertTargetInput(e.target.value)}
              style={{
                flex: 1, background: 'var(--s2)', border: '1px solid var(--border)',
                borderRadius: '5px', color: 'var(--text)', padding: '0.375rem 0.5rem',
                fontSize: '0.875rem', outline: 'none',
              }}
              autoFocus
            />
            <button
              onClick={setAlert}
              disabled={alertStatus === 'loading'}
              style={{
                background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer',
                padding: '0.375rem 0.875rem', borderRadius: '5px', fontSize: '0.8rem', fontWeight: '600',
              }}
            >
              {alertStatus === 'loading' ? '…' : 'Set Alert'}
            </button>
            <button
              onClick={() => setShowAlertForm(false)}
              style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', padding: '0.375rem 0.5rem', borderRadius: '5px', color: 'var(--muted)', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          </div>
          {alertStatus === 'error' && <span style={{ fontSize: '0.75rem', color: '#FF4444' }}>Something went wrong</span>}
        </div>
      ) : (
        <button
          onClick={() => setShowAlertForm(true)}
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            border: '1px solid rgba(0,102,255,0.35)', background: 'rgba(0,102,255,0.06)',
            color: 'var(--blue)', padding: '0.625rem', borderRadius: '6px',
            fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
          }}
        >
          🔔 Set Deal Alert{!isPro ? ' (free: 3 max)' : ''}
        </button>
      )}

    </div>
  )
}
