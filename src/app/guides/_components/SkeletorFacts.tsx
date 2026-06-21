'use client'

/**
 * SkeletorFacts — the lurking-Skeletor easter egg (Gate 3). A small original
 * skull glyph (homage, NOT Skeletor's trademarked face) sits at the foot of the
 * hub; click/tap and he drops ONE true collector fact with a "Myaaah!" sign-off.
 *
 * Every fact is sourced from the verified COLLECTOR-FACT-LEDGER (no fabrication,
 * never references the 2026 movie). Tiny, tasteful, reduced-motion-safe, never
 * blocks content or touches LCP — flavor, cuttable. Real <button>, aria-live.
 */

import { useState } from 'react'

const FACTS = [
  "The vintage Castle Grayskull was pea-green and black — and Mattel's spray-paint job was so sloppy no two are quite alike. Collectors call that a feature. Myaaah!",
  'Masters of the Universe Classics? Mattycollector web exclusives, born 2008 — King Grayskull went first, at SDCC. Miss the drop and you paid the aftermarket tax. MYAAAH!',
  "The 200X line ran two seasons on Cartoon Network, 2002 to 2004, then Mattel pulled the plug. 'The cancelled one,' they call it. I'd have done worse. Myaaah!",
  'The Four Horsemen sculpted the Classics line. Real artisans. Even I respect the craft. ...Myaaah.',
  "Filmation's cartoon ran 130 episodes, 1983 to '85 — and every one ended with me losing. Re-examine your priorities, He-Man. Myaaah!",
]

export default function SkeletorFacts() {
  const [idx, setIdx] = useState<number | null>(null)

  function speak() {
    // advance to a different fact each press
    setIdx(prev => {
      if (prev === null) return 0
      let next = Math.floor((prev + 1) % FACTS.length)
      return next
    })
  }

  return (
    <div className="fh-skel">
      <button type="button" className="fh-skel-btn" aria-expanded={idx !== null} onClick={speak}>
        <svg className="fh-skel-glyph" viewBox="0 0 40 44" width="34" height="38" aria-hidden="true" focusable="false">
          {/* original ominous skull homage — not the trademarked Skeletor face */}
          <path d="M20 2 C9 2 3 10 3 20 C3 27 7 31 9 33 L9 39 C9 41 11 42 13 42 L27 42 C29 42 31 41 31 39 L31 33 C33 31 37 27 37 20 C37 10 31 2 20 2 Z" fill="#10130c" stroke="#6f9b3a" strokeWidth="1.4" />
          <ellipse cx="13" cy="20" rx="4.4" ry="5" fill="#6f9b3a" />
          <ellipse cx="27" cy="20" rx="4.4" ry="5" fill="#6f9b3a" />
          <circle cx="13" cy="20" r="1.6" fill="#0a0d06" />
          <circle cx="27" cy="20" r="1.6" fill="#0a0d06" />
          <path d="M20 26 L17 31 L23 31 Z" fill="#3a2f20" />
          <path d="M14 36 V40 M18 36 V41 M22 36 V41 M26 36 V40" stroke="#0a0d06" strokeWidth="1.3" />
        </svg>
        <span className="fh-skel-prompt">{idx === null ? 'Skeletor knows things…' : 'Tell me more, fool.'}</span>
      </button>
      {idx !== null && (
        <p className="fh-skel-fact" aria-live="polite">{FACTS[idx]}</p>
      )}
    </div>
  )
}
