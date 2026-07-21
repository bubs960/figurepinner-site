'use client'

import { useEffect, useState } from 'react'

// Client-only live countdown for a guide article block (e.g. a convention panel
// start time). Server renders nothing time-dependent — first client render
// computes the real delta, so there's no SSR/CSR mismatch to worry about.

function splitRemaining(ms: number) {
  const clamped = Math.max(0, ms)
  const totalSeconds = Math.floor(clamped / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

const UNIT_STYLE: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '3.5rem' }
const NUM_STYLE: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '1.9rem', lineHeight: 1, color: 'var(--text)' }
const UNIT_LABEL_STYLE: React.CSSProperties = { fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '0.35rem' }

export default function CountdownTimer({ label, targetIso }: { label: string; targetIso: string }) {
  const target = new Date(targetIso).getTime()
  // null until mount — avoids a server-rendered "0d 0h 0m 0s" flash before hydration.
  const [remainingMs, setRemainingMs] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setRemainingMs(target - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  const isLive = remainingMs !== null && remainingMs <= 0
  const { days, hours, minutes, seconds } = splitRemaining(remainingMs ?? 0)

  return (
    <div style={{
      margin: '0 0 1.5rem', padding: '1.25rem 1.5rem',
      background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      {remainingMs === null ? (
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>&nbsp;</div>
      ) : isLive ? (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--blue)' }}>Happening now — check back for reveals</div>
      ) : (
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <div style={UNIT_STYLE}><span style={NUM_STYLE}>{days}</span><span style={UNIT_LABEL_STYLE}>days</span></div>
          <div style={UNIT_STYLE}><span style={NUM_STYLE}>{hours}</span><span style={UNIT_LABEL_STYLE}>hrs</span></div>
          <div style={UNIT_STYLE}><span style={NUM_STYLE}>{minutes}</span><span style={UNIT_LABEL_STYLE}>min</span></div>
          <div style={UNIT_STYLE}><span style={NUM_STYLE}>{seconds}</span><span style={UNIT_LABEL_STYLE}>sec</span></div>
        </div>
      )}
    </div>
  )
}
