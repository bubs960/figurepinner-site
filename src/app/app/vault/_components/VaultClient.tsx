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
import type { VaultShelfItem, HuntItem } from '../_lib/vaultData'
import { shelfTotals } from '../_lib/vaultData'
import VaultStats from './VaultStats'
import VaultCase from './VaultCase'
import ShelfTicker from './ShelfTicker'
import ShareShelfButton from './ShareShelfButton'

export default function VaultClient({ items: initial, hunt }: { items: VaultShelfItem[]; hunt: HuntItem[] }) {
  const [items, setItems] = useState(initial)

  // Mirrors getVaultShelfData's server formula exactly (shelfTotals is the
  // one shared implementation) so the first paint matches the server totals;
  // recomputes on every optimistic edit. trend30d/topMovers are snapshot-time
  // facts attached per item at fetch — an inline paid/condition edit doesn't
  // change them, but a removed item correctly drops out of the movers list.
  const totals = useMemo(() => shelfTotals(items), [items])

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
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            <VaultStats figures={totals.figures} estValue={totals.estValue} paid={totals.paid} />
            <ShareShelfButton />
          </div>
        )}
      </div>

      {items.length > 0 && (
        <ShelfTicker
          estValue={totals.estValue}
          trend30d={totals.trend30d}
          coverage={totals.trend30dCoverage}
          figures={totals.figures}
          topMovers={totals.topMovers}
        />
      )}

      <VaultCase items={items} hunt={hunt} onPatch={patch} onRemove={remove} />
    </>
  )
}
