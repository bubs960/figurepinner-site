'use client'

import { useEffect } from 'react'

// Last-resort error boundary (2026-08-25, WEBAUDIT-POSTDEPLOY-AUDIT-50D8DD0
// finding #4) — catches an error thrown by the ROOT LAYOUT itself, which
// error.tsx cannot (Next.js requirement: global-error.tsx replaces the
// entire document, including <html>/<body>, so it must supply its own and
// cannot assume layout.tsx's fonts/providers/globals.css ever mounted).
// Deliberately minimal and self-contained, not styled via the app's design
// tokens — this is the fallback for when something upstream of those tokens
// already failed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#09090F', color: '#EEEEF5' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '3rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Something went wrong</h1>
          <p style={{ opacity: 0.8, fontSize: '0.9375rem', maxWidth: 420, margin: 0 }}>
            FigurePinner hit an unexpected error loading this page. Try again, or come back in a moment.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: 8,
              border: 'none',
              background: '#0066FF',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
