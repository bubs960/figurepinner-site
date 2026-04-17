import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'FigurePinner — Action Figure Price Intelligence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090F',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 900,
            height: 600,
            background: 'radial-gradient(ellipse at center, rgba(0,102,255,0.18) 0%, rgba(0,102,255,0.06) 45%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {/* Icon mark */}
          <div
            style={{
              width: 56,
              height: 56,
              background: '#0066FF',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-1px',
            }}
          >
            FP
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#EEEEF5',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Figure<span style={{ color: '#0066FF' }}>Pinner</span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#666E8A',
            marginBottom: 48,
            letterSpacing: '0.02em',
          }}
        >
          Action Figure Price Intelligence
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 48,
            alignItems: 'center',
          }}
        >
          {[
            { num: '20K+', label: 'Figures', color: '#0066FF' },
            { num: '96%', label: 'Coverage', color: '#00C870' },
            { num: '17', label: 'Genres', color: '#FF5F00' },
          ].map(({ num, label, color }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div style={{ fontSize: 40, fontWeight: 900, color, letterSpacing: '0.04em' }}>
                {num}
              </div>
              <div style={{ fontSize: 16, color: '#3A3D52', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 18,
            color: '#3A3D52',
            letterSpacing: '0.06em',
          }}
        >
          figurepinner.com
        </div>
      </div>
    ),
    { ...size }
  )
}
