'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

// BarcodeDetector is a browser API not yet in TypeScript's lib. Declare minimally.
declare class BarcodeDetector {
  constructor(opts?: { formats?: string[] })
  detect(source: HTMLVideoElement | HTMLImageElement): Promise<Array<{ rawValue: string; format: string }>>
}

interface SearchResult {
  figure_id?: string
  name: string
  brand: string
  line: string
  series: string
  genre: string
  year: number | null
  image?: string | null
  fandom_slug?: string
  line_slug?: string
  character_slug?: string
}

type ScanState = 'idle' | 'scanning' | 'found' | 'searching' | 'results' | 'not-found' | 'unsupported' | 'error'

export default function ScanPage() {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const rafRef      = useRef<number>(0)
  const detectorRef = useRef<BarcodeDetector | null>(null)
  const scanLocked  = useRef(false)

  const [state, setState]     = useState<ScanState>('idle')
  const [upc, setUpc]         = useState('')
  const [manualUpc, setManualUpc] = useState('')
  const [productTitle, setProductTitle] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  // Check BarcodeDetector support on mount
  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setState('unsupported')
    }
  }, [])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const searchFigurePinner = useCallback(async (query: string) => {
    setState('searching')
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&limit=12`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json() as { results: SearchResult[] }
      const found = data.results ?? []
      setResults(found)
      setState(found.length > 0 ? 'results' : 'not-found')
    } catch {
      setState('error')
      setErrorMsg('Search failed — try again')
    }
  }, [])

  const lookupUpc = useCallback(async (code: string) => {
    setUpc(code)
    stopCamera()
    setState('found')
    try {
      const res = await fetch(`/api/upc?upc=${encodeURIComponent(code)}`)
      if (!res.ok) {
        // UPC not in database — search by UPC directly
        await searchFigurePinner(code)
        return
      }
      const data = await res.json() as { title?: string; brand?: string }
      const query = data.title ?? code
      setProductTitle(query)
      await searchFigurePinner(query)
    } catch {
      await searchFigurePinner(code)
    }
  }, [stopCamera, searchFigurePinner])

  const startCamera = useCallback(async () => {
    if (!('BarcodeDetector' in window)) { setState('unsupported'); return }
    setState('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      detectorRef.current = new BarcodeDetector({
        formats: ['upc_a', 'upc_e', 'ean_13', 'ean_8', 'code_128', 'code_39'],
      })

      const scan = async () => {
        if (!videoRef.current || !detectorRef.current || scanLocked.current) return
        if (videoRef.current.readyState >= 2) {
          try {
            const codes = await detectorRef.current.detect(videoRef.current)
            if (codes.length > 0 && !scanLocked.current) {
              scanLocked.current = true
              await lookupUpc(codes[0].rawValue)
              return
            }
          } catch { /* continue scanning */ }
        }
        rafRef.current = requestAnimationFrame(scan)
      }
      rafRef.current = requestAnimationFrame(scan)
    } catch (e) {
      setState('error')
      setErrorMsg(String(e).includes('NotAllowed') ? 'Camera permission denied' : 'Camera error — try manual entry')
    }
  }, [lookupUpc])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = manualUpc.trim().replace(/\D/g, '')
    if (code.length < 8) return
    await lookupUpc(code)
  }

  const reset = () => {
    stopCamera()
    scanLocked.current = false
    setUpc('')
    setManualUpc('')
    setProductTitle('')
    setResults([])
    setErrorMsg('')
    setState('idle')
  }

  return (
    <div style={{ background: 'var(--fp-bg)', minHeight: '100vh', color: 'var(--fp-text)', fontFamily: 'var(--fp-font-body)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--nav-bg-translucent)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--fp-border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '1rem', textDecoration: 'none', color: 'var(--fp-text)' }}>
          FigurePinner
        </Link>
        <Link href="/search" style={{ fontSize: '0.8rem', color: 'var(--fp-dim)', textDecoration: 'none' }}>
          Search →
        </Link>
      </nav>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--fp-font-display)', fontSize: '2rem', marginBottom: '0.5rem' }}>SC</div>
          <h1 style={{
            fontFamily: 'var(--fp-font-display)',
            fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.375rem',
            letterSpacing: '-0.02em',
          }}>
            Scan a Figure
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--fp-dim)', margin: 0 }}>
            Point your camera at the barcode on the box to look up price history
          </p>
        </div>

        {/* UNSUPPORTED */}
        {state === 'unsupported' && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center',
          }}>
            <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.375rem' }}>
              Camera scan not supported in this browser
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--fp-dim)' }}>
              Use Chrome or Edge on Android/desktop for camera scanning.
              Or enter the barcode number below.
            </div>
          </div>
        )}

        {/* IDLE / START */}
        {state === 'idle' && (
          <button
            onClick={startCamera}
            style={{
              width: '100%', padding: '1rem',
              background: 'var(--fp-accent)', color: '#fff',
              border: 'none', borderRadius: 12,
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              marginBottom: '1.5rem',
            }}
          >
            Start Camera
          </button>
        )}

        {/* SCANNING — live camera */}
        {state === 'scanning' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              position: 'relative', borderRadius: 12, overflow: 'hidden',
              background: '#000', aspectRatio: '4/3',
              border: '2px solid var(--fp-accent)',
            }}>
              <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {/* Scan overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: '60%', height: '25%',
                  border: '2px solid rgba(255,255,255,0.7)',
                  borderRadius: 8,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                }} />
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--fp-dim)' }}>
              Align barcode within the frame · auto-detects
            </div>
            <button
              onClick={reset}
              style={{
                width: '100%', marginTop: '0.75rem',
                padding: '0.75rem', borderRadius: 10,
                border: '1px solid var(--fp-border)', background: 'transparent',
                color: 'var(--fp-dim)', cursor: 'pointer', fontSize: '0.875rem',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* FOUND / SEARCHING */}
        {(state === 'found' || state === 'searching') && (
          <div style={{
            background: 'var(--fp-surface-0)', border: '1px solid var(--fp-border)',
            borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--fp-text)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Barcode detected
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{upc}</div>
            {productTitle && (
              <div style={{ fontSize: '0.8rem', color: 'var(--fp-dim)', marginBottom: '0.5rem' }}>
                &ldquo;{productTitle}&rdquo;
              </div>
            )}
            {state === 'searching' && (
              <div style={{ fontSize: '0.8rem', color: 'var(--fp-dim)' }}>Searching FigurePinner…</div>
            )}
          </div>
        )}

        {/* RESULTS */}
        {state === 'results' && results.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--fp-dim)', marginBottom: '0.75rem', fontWeight: 600 }}>
              {results.length} match{results.length !== 1 ? 'es' : ''} found
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {results.map((r, i) => {
                const href = r.figure_id
                  ? `/figure/${r.figure_id}`
                  : (r.fandom_slug && r.line_slug && r.character_slug)
                    ? `/${r.fandom_slug}/${r.line_slug}/${r.character_slug}`
                    : '#'
                return (
                  <a key={r.figure_id ?? i} href={href} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--fp-surface-0)', border: '1px solid var(--fp-border)',
                    borderRadius: 10, textDecoration: 'none', color: 'inherit',
                  }}>
                    {r.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt="" width={48} height={48}
                        style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }}
                        loading="lazy"
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--fp-dim)' }}>
                        {r.brand} · {r.line}{r.series ? ` · Ser. ${r.series}` : ''}
                      </div>
                    </div>
                    <div style={{ color: 'var(--fp-dim)', flexShrink: 0 }}>→</div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* NOT FOUND */}
        {state === 'not-found' && (
          <div style={{
            background: 'var(--fp-surface-0)', border: '1px solid var(--fp-border)',
            borderRadius: 10, padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem',
          }}>
            <div style={{ fontFamily: 'var(--fp-font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>NO</div>
            <div style={{ fontWeight: 700, marginBottom: '0.375rem' }}>No match found</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--fp-dim)', marginBottom: '1rem' }}>
              {productTitle ? `We couldn't match "${productTitle}" to a figure in our catalog.` : "We couldn't match this barcode."}
            </div>
            <Link href={`/search${productTitle ? `?q=${encodeURIComponent(productTitle)}` : ''}`}
              style={{
                display: 'inline-block', padding: '0.6rem 1.25rem',
                background: 'var(--fp-accent)', color: '#fff',
                borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem',
              }}
            >
              Search manually →
            </Link>
          </div>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', textAlign: 'center',
            color: '#ef4444', fontSize: '0.875rem',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Reset button */}
        {(state === 'results' || state === 'not-found' || state === 'error') && (
          <button onClick={reset} style={{
            width: '100%', padding: '0.75rem',
            border: '1px solid var(--fp-border)', background: 'transparent',
            color: 'var(--fp-dim)', borderRadius: 10, cursor: 'pointer',
            fontSize: '0.875rem', marginBottom: '1.5rem',
          }}>
            ↩ Scan another
          </button>
        )}

        {/* Manual UPC entry — always visible as fallback */}
        {(state === 'idle' || state === 'unsupported' || state === 'not-found' || state === 'error') && (
          <form onSubmit={handleManualSubmit}>
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--fp-text)',
              marginBottom: '0.5rem',
            }}>
              Or enter barcode manually
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="012345678905"
                value={manualUpc}
                onChange={e => setManualUpc(e.target.value.replace(/\D/g, ''))}
                maxLength={14}
                style={{
                  flex: 1, padding: '0.75rem 1rem',
                  background: 'var(--fp-surface-0)', border: '1px solid var(--fp-border)',
                  borderRadius: 10, color: 'var(--fp-text)', fontSize: '0.9rem',
                  fontFamily: 'monospace', outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={manualUpc.length < 8}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: manualUpc.length >= 8 ? 'var(--fp-accent)' : 'var(--fp-surface-0)',
                  color: manualUpc.length >= 8 ? '#fff' : 'var(--fp-dim)',
                  border: '1px solid var(--fp-border)', borderRadius: 10,
                  fontWeight: 700, cursor: manualUpc.length >= 8 ? 'pointer' : 'default',
                  fontSize: '0.875rem', transition: 'all 0.15s',
                }}
              >
                Go
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
