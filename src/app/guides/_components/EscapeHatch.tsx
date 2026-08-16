// EscapeHatch — Phase 5 of the guides conversion redesign (design brief: "Ends
// with the 'Not seeing yours? Search all 1,432 ->' escape hatch (repeated after
// every tile surface — the current page's biggest leak is teaching visitors
// their figure isn't tracked)."). Server component — TrackedLink carries the
// funnel wiring, no client boundary needed here.

import TrackedLink from '@/app/components/TrackedLink'

export default function EscapeHatch({ totalFigs }: { totalFigs: number }) {
  if (totalFigs <= 0) return null
  return (
    <div
      style={{
        margin: '0.75rem 0',
        padding: '0.6rem 0.85rem',
        border: '1px dashed rgba(78,205,230,.3)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '0.8rem', color: 'rgba(242,232,213,.65)' }}>Not seeing yours?</span>
      <TrackedLink
        href="/search"
        funnelEvent="search_submit"
        funnelDetail={{ target: 'escape_hatch' }}
        style={{ fontSize: '0.8rem', color: '#4ecde6', fontWeight: 600, textDecoration: 'none' }}
      >
        Search all {totalFigs.toLocaleString('en-US')} →
      </TrackedLink>
    </div>
  )
}
