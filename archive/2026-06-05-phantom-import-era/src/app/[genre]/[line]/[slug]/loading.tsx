// Skeleton shown instantly while the figure detail page fetches API data
export default function FigureLoading() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
        .sk { background: var(--s2); border-radius: 6px; animation: shimmer 1.4s ease-in-out infinite; }
        @media (max-width: 768px) {
          .sk-grid { grid-template-columns: 1fr !important; }
          .sk-right { order: -1; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div className="sk" style={{ width: 32, height: 18 }} />
        <div className="sk" style={{ width: 60, height: 28, borderRadius: 6 }} />
      </nav>

      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Hero skeleton */}
        <div className="sk-grid" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem', marginBottom: '1.75rem', alignItems: 'start' }}>
          <div className="sk" style={{ aspectRatio: '1', borderRadius: 12 }} />
          <div>
            <div className="sk" style={{ width: 100, height: 10, marginBottom: '0.75rem' }} />
            <div className="sk" style={{ width: '70%', height: 32, marginBottom: '0.5rem' }} />
            <div className="sk" style={{ width: '50%', height: 20, marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="sk" style={{ width: 72, height: 22, borderRadius: 9999 }} />
              <div className="sk" style={{ width: 72, height: 22, borderRadius: 9999 }} />
            </div>
          </div>
        </div>

        {/* Value strip skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="sk" style={{ height: 64, borderRadius: 10 }} />
          ))}
        </div>

        {/* Main content area */}
        <div className="sk-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
          <div>
            <div className="sk" style={{ height: 200, borderRadius: 12, marginBottom: '1rem' }} />
            <div className="sk" style={{ height: 160, borderRadius: 12 }} />
          </div>
          <div className="sk-right" style={{ position: 'sticky', top: '72px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="sk" style={{ width: '50%', height: 36 }} />
              <div className="sk" style={{ height: 44, borderRadius: 8 }} />
              <div className="sk" style={{ height: 36, borderRadius: 6 }} />
              <div className="sk" style={{ height: 36, borderRadius: 6 }} />
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
