import { SignIn } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your FigurePinner account.',
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      {/* Wordmark */}
      <a href="/" style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.75rem',
        letterSpacing: '0.04em',
        color: 'var(--text)',
        textDecoration: 'none',
        marginBottom: '2rem',
      }}>
        FIGURE<span style={{ color: 'var(--blue)' }}>PINNER</span>
      </a>

      <SignIn
        appearance={{
          variables: {
            colorBackground: '#111318',
            colorInputBackground: '#181B23',
            colorInputText: '#EEEEF5',
            colorText: '#EEEEF5',
            colorTextSecondary: '#666E8A',
            colorPrimary: '#0066FF',
            colorDanger: '#FF4444',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
          },
          elements: {
            card: {
              border: '1px solid #2A2D3A',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            headerTitle: {
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.5rem',
              letterSpacing: '0.05em',
            },
            formButtonPrimary: {
              background: '#0066FF',
              fontWeight: '600',
            },
            footerActionLink: {
              color: '#0066FF',
            },
          },
        }}
      />
    </main>
  )
}
