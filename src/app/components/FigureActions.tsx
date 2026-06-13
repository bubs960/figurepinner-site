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

export default function FigureActions({ figure_id, name, brand, line, genre }: Props) {
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
        if (data.warning) setVaultWarn(data)
      } else if (res.status === 409) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>

      {/* ── Vault gate (Pro upsell when free vault is full) ── */}
      {vaultGate && (
        <div className="fp-action-gate">
          <div className="fp-action-gate__title">Vault full ({vaultGate.limit} figures)</div>
          <div className="fp-action-gate__body">Upgrade to Pro for unlimited storage.</div>
          <a href={vaultGate.upgrade_url} className="btn btn-primary">Upgrade to Pro</a>
        </div>
      )}

      {/* ── Vault near-limit warning ── */}
      {vaultWarn?.warning && (
        <div className="fp-action-warn">
          {vaultWarn.remaining === 0
            ? 'Vault is now full.'
            : `${vaultWarn.remaining} vault spot${vaultWarn.remaining === 1 ? '' : 's'} left.`}
        </div>
      )}

      {/* ── Add to Collection (primary action) ── */}
      {!vaultGate && (
        vaultStatus === 'done' ? (
          <div className="fp-action-status">Added to Collection</div>
        ) : showVaultForm ? (
          <div className="fp-action-panel">
            <div className="fp-action-fields">
              <div className="fp-action-field">
                <label className="fp-action-label">What did you pay?</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={paidInput}
                  onChange={e => setPaidInput(e.target.value)}
                  className="fp-action-input"
                />
              </div>
              <div className="fp-action-field">
                <label className="fp-action-label">Condition</label>
                <select
                  value={conditionInput}
                  onChange={e => setConditionInput(e.target.value)}
                  className="fp-action-input"
                >
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="fp-action-cta-row">
              <button
                onClick={addToVault}
                disabled={vaultStatus === 'loading'}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {vaultStatus === 'loading' ? 'Loading' : 'Add to Collection'}
              </button>
              <button
                onClick={() => setShowVaultForm(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
            {vaultStatus === 'error' && <span className="fp-action-error">Something went wrong</span>}
          </div>
        ) : (
          <button
            onClick={() => setShowVaultForm(true)}
            className="btn btn-primary fp-action-trigger"
          >
            Add to Collection
          </button>
        )
      )}

      {/* ── Add to Want List (secondary) ── */}
      {wantStatus === 'done' ? (
        <div className="fp-action-status">Added to Want List</div>
      ) : showWantForm ? (
        <div className="fp-action-panel">
          <label className="fp-action-label">Target price (optional)</label>
          <div className="fp-action-cta-row">
            <input
              type="number"
              placeholder="$0"
              value={targetInput}
              onChange={e => setTargetInput(e.target.value)}
              className="fp-action-input"
            />
            <button
              onClick={addToWantlist}
              disabled={wantStatus === 'loading'}
              className="btn btn-primary"
            >
              {wantStatus === 'loading' ? 'Loading' : 'Add'}
            </button>
            <button
              onClick={() => setShowWantForm(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
          {wantStatus === 'error' && <span className="fp-action-error">Something went wrong</span>}
        </div>
      ) : (
        <button
          onClick={() => setShowWantForm(true)}
          className="btn btn-ghost fp-action-trigger"
        >
          Add to Want List
        </button>
      )}

      {/* ── Deal Alert (Pro-leaning) ── */}
      {alertGate ? (
        <div className="fp-action-gate">
          <div className="fp-action-gate__title">{alertGate.limit} alerts is the Free limit</div>
          <div className="fp-action-gate__body">Unlimited with Pro.</div>
          <a href={alertGate.upgrade_url} className="btn btn-primary">Upgrade to Pro</a>
        </div>
      ) : alertStatus === 'done' ? (
        <div className="fp-action-status">Alert set</div>
      ) : showAlertForm ? (
        <div className="fp-action-panel fp-action-panel--alert">
          <label className="fp-action-label">Alert me when price drops below ($)</label>
          <div className="fp-action-cta-row">
            <input
              type="number"
              placeholder="0"
              value={alertTargetInput}
              onChange={e => setAlertTargetInput(e.target.value)}
              className="fp-action-input"
              autoFocus
            />
            <button
              onClick={setAlert}
              disabled={alertStatus === 'loading'}
              className="btn btn-primary"
            >
              {alertStatus === 'loading' ? 'Loading' : 'Set Alert'}
            </button>
            <button
              onClick={() => setShowAlertForm(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
          {alertStatus === 'error' && <span className="fp-action-error">Something went wrong</span>}
        </div>
      ) : (
        <button
          onClick={() => setShowAlertForm(true)}
          className="btn btn-ghost fp-action-trigger"
          style={{
            borderColor: 'rgba(0,102,255,0.35)',
            color: 'var(--blue)',
            background: 'rgba(0,102,255,0.04)',
          }}
        >
          Set Deal Alert
        </button>
      )}

    </div>
  )
}
