'use client'

// Client component — onError handler requires hydration to fire.
// Imported by /figure/[figure_id]/page.tsx (server component).

import { useState } from 'react'

const GENRE_EMOJI: Record<string, string> = {
  'wrestling':                    '🤼',
  'marvel':                       '🦸',
  'star-wars':                    '⚔️',
  'dc':                           '🦇',
  'transformers':                 '🤖',
  'gijoe':                        '🪖',
  'masters-of-the-universe':      '⚡',
  'teenage-mutant-ninja-turtles': '🐢',
  'power-rangers':                '🦕',
  'indiana-jones':                '🎩',
  'ghostbusters':                 '👻',
  'mythic-legions':               '🗡️',
  'thundercats':                  '🐱',
  'action-force':                 '🎖️',
  'dungeons-dragons':             '🐉',
  'neca':                         '🎬',
  'spawn':                        '🦇',
}

type Props = {
  url: string | null
  name: string
  genre?: string
}

export default function FigureImage({ url, name, genre }: Props) {
  const [errored, setErrored] = useState(false)
  const emoji = (genre && GENRE_EMOJI[genre]) ?? '🤼'

  if (!url || errored) {
    return (
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px',
        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3rem', color: 'var(--muted)',
      }}>
        {emoji}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }}
        onError={() => setErrored(true)}
      />
    </div>
  )
}
