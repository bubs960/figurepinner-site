'use client'

import { useEffect, useState } from 'react'
import { useOwnershipStatus } from '@/app/_lib/useOwnershipStatus'
import { addFigureToVault } from '@/app/_lib/vaultAdd'
import { useSessionHint } from '@/app/_lib/sessionHint'
import { goToSignInWithReturn, takePendingIntent } from '@/app/_lib/signInReturn'

type Props = {
  figure_id: string
  name: string
  brand: string
  line: string
  genre: string
  /** Hero photo URL for the Claiming Ritual spike's photo-flight (Session 1
   *  de-risk gate). Optional — pages that don't render a hero image (or that
   *  don't pass it) simply get no ritual flight, never an error.
   *  See ClaimRitual.tsx for the consumer. */
  imgSrc?: string | null
  /** "Grail Whisper" bench rider (P3 §3): a real, quality-gated enrichment
   *  fact for THIS figure (same gate as the page's own JSON-LD — see
   *  enrichedCopy.ts), or null for a Tier-2 figure with nothing real to say.
   *  Passed straight through into the figure:claimed event; ClaimRitual
   *  decides whether to show it. */
  whisper?: string | null
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

export default function FigureActions({ figure_id, name, brand, line, genre, imgSrc, whisper }: Props) {
  const { owned } = useOwnershipStatus(figure_id)
  const [vaultStatus, setVaultStatus] = useState<Status>('idle')

  // Reflect an already-owned figure on load — otherwise a revisit shows a
  // fresh "Add to Collection" button that would attempt a duplicate insert.
  useEffect(() => {
    if (owned) setVaultStatus('done')
  }, [owned])

  // Return-path replay (2026-09-03, engagement audit #1): the visitor clicked
  // a CTA while anonymous, signed in, and Clerk sent them back here via
  // redirect_url. Finish what they started: vault adds fire automatically
  // (the figure is what they asked to save); want/alert intents reopen the
  // form they were in, since both need a price the visitor hasn't typed yet.
  const hinted = useSessionHint()
  useEffect(() => {
    if (!hinted) return
    const intent = takePendingIntent(figure_id)
    if (!intent) return
    if (intent === 'vault') {
      if (vaultStatus === 'idle') void addToVault()
    } else if (intent === 'want') {
      setShowWantForm(true)
    } else {
      setShowAlertForm(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the hint flips; addToVault/setters are stable per render
  }, [hinted, figure_id])
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
    // Delegates the actual fetch + shared side effects (the 'fp_has_saved'
    // marker, the 'figure:claimed' event that useOwnershipStatus/ClaimPin/
    // ClaimRitual all listen for) to vaultAdd.ts, 2026-08-23 -- the SAME
    // helper the hero CTA now calls directly, so both paths stay identical
    // instead of two hand-copied fetches drifting apart.
    const result = await addFigureToVault({
      figure_id, name, brand, line, genre,
      paid: paidInput ? parseFloat(paidInput) : 0,
      condition: conditionInput,
      imgSrc,
      whisper,
    })

    if (result.status === 'unauthenticated') {
      goToSignInWithReturn(figure_id, 'vault')
      return
    }
    if (result.status === 'gated') {
      setVaultGate(result.gate)
      setVaultStatus('idle')
      setShowVaultForm(false)
      return
    }
    if (result.status === 'ok') {
      setVaultStatus('done')
      setShowVaultForm(false)
      if (result.warn) setVaultWarn(result.warn)
      return
    }
    if (result.status === 'duplicate') {
      setVaultStatus('done')
      setShowVaultForm(false)
      return
    }
    setVaultStatus('error')
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
        goToSignInWithReturn(figure_id, 'alert')
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
        goToSignInWithReturn(figure_id, 'want')
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

      {/* ── Vault limit reached (Pro not purchasable yet — no dead-end CTA) ── */}
      {vaultGate && (
        <div className="fp-action-gate">
          <div className="fp-action-gate__title">Vault full ({vaultGate.limit} figures)</div>
          <div className="fp-action-gate__body">You&apos;ve reached the free plan&apos;s storage limit.</div>
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

      {/* ── Deal Alert limit reached (Pro not purchasable yet — no dead-end CTA) ── */}
      {alertGate ? (
        <div className="fp-action-gate">
          <div className="fp-action-gate__title">{alertGate.limit} alerts is the Free limit</div>
          <div className="fp-action-gate__body">You&apos;ve reached the free plan&apos;s alert limit.</div>
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
