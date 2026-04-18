'use client'

import { useState } from 'react'

type Props = {
  figure_id: string
  name: string
  brand: string
  line: string
  genre: string
}

type Status = 'idle' | 'loading' | 'done' | 'error'

const CONDITIONS = ['Loose', 'Near Mint', 'MOC', 'Opened', 'Damaged']

export default function FigureActions({ figure_id, name, brand, line, genre }: Props) {
  const [vaultStatus, setVaultStatus] = useState<Status>('idle')
  const [wantStatus, setWantStatus] = useState<Status>('idle')
  const [paidInput, setPaidInput] = useState('')
  const [conditionInput, setConditionInput] = useState('Loose')
  const [targetInput, setTargetInput] = useState('')
  const [showVaultForm, setShowVaultForm] = useState(false)
  const [showWantForm, setShowWantForm] = useState(false)

  async function addToVault() {
    setVaultStatus('loading')
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figure_id,
          name,
          brand,
          line,
          genre,
          paid: paidInput ? parseFloat(paidInput) : 0,
          condition: conditionInput,
        }),
      })
      if (res.ok) {
        setVaultStatus('done')
        setShowVaultForm(false)
      } else if (res.status === 401) {
        window.location.href = '/sign-in'
      } else {
        setVaultStatus('error')
      }
    } catch {
      setVaultStatus('error')
    }
  }

  async function addToWantlist() {
    setWantStatus('loading')
    try {
      const res = await fetch('/api/wantlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figure_id,
          name,
          brand,
          line,
          genre,
          target_price: targetInput ? parseFloat(targetInput) : 0,
        }),
      })
      if (res.ok) {
        setWantStatus('done')
        setShowWantForm(false)
      } else if (res.status === 401) {
        window.location.href = '/sign-in'
      } else {
        setWantStatus('error')
      }
    } catch {
      setWantStatus('error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

      {/* Add to Collection */}
      {vaultStatus === 'done' ? (
        <div style={{ textAlign: 'center', padding: '0.625rem', fontSize: '0.8rem', color: 'var(--green)', fontWeight: '600' }}>
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
      )}

      {/* Add to Want List */}
      {wantStatus === 'done' ? (
        <div style={{ textAlign: 'center', padding: '0.625rem', fontSize: '0.8rem', color: 'var(--green)', fontWeight: '600' }}>
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

    </div>
  )
}
