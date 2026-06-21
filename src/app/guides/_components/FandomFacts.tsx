'use client'

/**
 * FandomFacts — the lurking-villain easter egg (Gate 3). A small ORIGINAL glyph
 * (homage, never a trademarked face/logo) sits at the foot of the hub; click/tap
 * and it drops ONE true collector fact. Every fact is theme-supplied and sourced
 * from the verified COLLECTOR-FACT-LEDGER (no fabrication).
 *
 * Templatized (S40): facts + prompts + which glyph all come in as props from the
 * theme. MOTU = Skeletor skull + "Myaaah!" facts; GI Joe = an original hooded-cobra
 * sigil + Cobra Commander transmissions. Tiny, reduced-motion-safe, real <button>,
 * aria-live, never blocks content or touches LCP — flavor, cuttable.
 */

import { useState } from 'react'

function SkeletorGlyph() {
  return (
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
  )
}

function CobraGlyph() {
  return (
    <svg className="fh-skel-glyph" viewBox="0 0 40 44" width="34" height="38" aria-hidden="true" focusable="false">
      {/* ORIGINAL side-profile striking cobra — coiled body, flared hood, profile
          head facing left, forked tongue. Reads as a serpent (not a face); matches
          the hero centerpiece. NOT the trademarked Cobra-head mark. */}
      <path d="M22 19 C22 29 33 30 30 37 C27 43 14 43 9 38 C6 35 9 31 13 32" fill="none" stroke="#c0202a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 19 C14 18 9 13 10 8 L13 4 C15 2 18 1 22 2 C26 1 29 3 31 6 L33 12 C33 16 29 19 22 19 Z" fill="#c0202a" />
      <path d="M22 4 C16 2 9 3 6 8 C9 11 14 11 18 9 C20 8 22 6 22 4 Z" fill="#c0202a" />
      <circle cx="14" cy="6" r="1" fill="#0a0a08" />
      <path d="M6 8 L9 11 L10 8 Z" fill="#0a0a08" />
      <path d="M6 8 L2 9 M2 9 L0 8 M2 9 L0 10" stroke="#c0202a" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function MicGlyph() {
  return (
    <svg className="fh-skel-glyph" viewBox="0 0 40 44" width="34" height="38" aria-hidden="true" focusable="false">
      {/* original handheld microphone (the mic-drop) — generic, no logo/wordmark */}
      <rect x="12" y="3" width="16" height="23" rx="8" fill="#e8b94e" />
      <path d="M15 10 H25 M15 14 H25 M15 18 H25" stroke="#0c0e12" strokeWidth="1.2" opacity="0.5" />
      <path d="M20 26 V37" stroke="#c8a24a" strokeWidth="5" strokeLinecap="round" />
      <rect x="13" y="38" width="14" height="3.5" rx="1.75" fill="#e8b94e" />
    </svg>
  )
}

export default function FandomFacts({
  facts,
  promptIdle,
  promptMore,
  glyph,
}: {
  facts: string[]
  promptIdle: string
  promptMore: string
  glyph: 'skeletor' | 'cobra' | 'mic'
}) {
  const [idx, setIdx] = useState<number | null>(null)
  if (!facts.length) return null

  function speak() {
    // advance to a different fact each press
    setIdx(prev => {
      if (prev === null) return 0
      return Math.floor((prev + 1) % facts.length)
    })
  }

  return (
    <div className="fh-skel">
      <button type="button" className="fh-skel-btn" aria-expanded={idx !== null} onClick={speak}>
        {glyph === 'cobra' ? <CobraGlyph /> : glyph === 'mic' ? <MicGlyph /> : <SkeletorGlyph />}
        <span className="fh-skel-prompt">{idx === null ? promptIdle : promptMore}</span>
      </button>
      {idx !== null && (
        <p className="fh-skel-fact" aria-live="polite">{facts[idx]}</p>
      )}
    </div>
  )
}
