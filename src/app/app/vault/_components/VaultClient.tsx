'use client'
// VaultClient — owns the single source of truth for the case (the items array)
// so the masthead stats and the glass case never disagree. Quick-edits land
// here (optimistic local state + PATCH/DELETE to /api/vault); the totals are
// derived from the same array, so an inline paid edit or a removed figure
// re-values the header instantly — no reload, no router.refresh round-trip.
//
// The masthead's left column (eyebrow + title) lives here too because the
// stats sit in the same flex row and must share the live count.

import { useMemo, useState } from 'react'
import type { VaultShelfItem } from '../_lib/vaultData'
import VaultStats from './VaultStats'
import VaultCase from './VaultCase'

export default function VaultClient({ items: initial }: { items: VaultShelfItem[] }) {
  const [items, setItems] = useState(initial)

  // Mirrors getVaultShelfData's server formula exactly so the first paint
  // matches the server totals; recomputes on every optimistic edit.
  const totals = useMemo(() => ({
    figures: items.length,
    estValue: items.reduce((s, i) => s + (i.median ?? i.paid ?? 0), 0),
    paid: items.reduce((s, i) => s + (i.paid ?? 0), 0),
  }), [items])

  function patch(rowId: string, body: { paid?: number; condition?: string }) {
    setItems(prev => prev.map(i => i.rowId === rowId ? { ...i, ...body } : i))
    fetch(`/api/vault/${rowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  }

  function remove(rowId: string) {
    setItems(prev => prev.filter(i => i.rowId !== rowId))
    // Optimistic state is authoritative; the DELETE persists and the next
    // navigation re-reads D1. No router.refresh — it would re-run the
    // count-up for a change the user just watched happen.
    fetch(`/api/vault/${rowId}`, { method: 'DELETE' }).catch(() => {})
  }

  return (
    <>
      <div className="vlt-mast-row">
        <div>
          <span className="vlt-eyebrow">Your shelf, cataloged</span>
          <h1>The Vault</h1>
        </div>
        {items.length > 0 && (
          <VaultStats figures={totals.figures} estValue={totals.estValue} paid={totals.paid} />
        )}
      </div>

      <VaultCase items={items} onPatch={patch} onRemove={remove} />
    </>
  )
}
