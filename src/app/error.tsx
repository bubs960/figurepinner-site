'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Root error boundary (2026-08-25, WEBAUDIT-POSTDEPLOY-AUDIT-50D8DD0 finding
// #4): the repo had zero error.tsx/global-error.tsx anywhere in src/app, so
// any unhandled server-component throw was a raw framework error page --
// the cheap structural twin of the D1 graceful-degradation work shipped the
// same day (52a2f16). Catches errors in any page/layout below this one;
// does NOT catch an error thrown by this root layout itself (Next.js
// requirement — see global-error.tsx for that case).
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[error-boundary]', error.digest ?? '(no digest)', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        color: 'var(--text, #EEEEF5)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display, var(--font-bebas, sans-serif))',
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          letterSpacing: '0.04em',
          margin: 0,
        }}
      >
        Something went wrong
      </h1>
      <p style={{ color: 'var(--muted, #EEEEF5)', fontSize: '0.9375rem', maxWidth: 420, margin: 0 }}>
        This page hit an unexpected error. It&rsquo;s been logged — try again, or head back to the homepage.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 8,
            border: '1px solid var(--border, rgba(255,255,255,0.15))',
            background: 'var(--blue, #0066FF)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 8,
            border: '1px solid var(--border, rgba(255,255,255,0.15))',
            color: 'var(--text, #EEEEF5)',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.875rem',
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
