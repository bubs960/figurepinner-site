'use client'

// ClaimPin.tsx — ambient graft from the Claiming Ritual spec ("Under Glass"
// donor idea): a small brass corner pin on every figure-page hero. Empty
// outline for everyone; solid gold + glow the instant the figure is in the
// signed-in visitor's collection. Patches the ritual's one weakness
// (browsing-only visitors see nothing) with a persistent "this one's mine"
// cue, reusing the same ownership check FigureActions uses so the two never
// disagree. Purely decorative — aria-hidden, no pointer interaction.

import { useOwnershipStatus } from '@/app/_lib/useOwnershipStatus'

const PIN_PATH = 'M14.6 2.6 21.4 9.4 19.8 11l-.9-.3-4 4 .3 2.6-1.6 1.6-4-4-5.2 5.2-1.4-1.4L8.2 13.5l-4-4L5.8 8l2.6.3 4-4-.3-.9 2.5-.8Z'

export default function ClaimPin({ figureId }: { figureId: string }) {
  const { owned } = useOwnershipStatus(figureId)

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: '0.75rem',
        right: '0.75rem',
        zIndex: 2,
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: owned
          ? 'linear-gradient(180deg, #fff0d0, var(--shelf-gold-hi, #f5c462))'
          : 'rgba(9,9,15,0.55)',
        border: owned ? 'none' : '1px solid rgba(224,168,62,0.35)',
        boxShadow: owned
          ? '0 3px 10px rgba(0,0,0,0.45), 0 0 14px rgba(224,168,62,0.55)'
          : 'none',
        transition: 'background .4s ease, box-shadow .4s ease, border-color .4s ease',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill={owned ? '#1a1206' : 'none'}
        stroke={owned ? 'none' : 'rgba(224,168,62,0.7)'}
        strokeWidth="1.5"
      >
        <path d={PIN_PATH} />
      </svg>
    </div>
  )
}
