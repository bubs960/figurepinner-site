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

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <div className="sk-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem', alignItems: 'start' }}>

          {/* Left */}
          <div>
            <div className="sk" style={{ width: 120, height: 12, marginBottom: '0.625rem' }} />
            <div className="sk" style={{ width: '80%', height: 36, marginBottom: '0.5rem' }} />
            <div className="sk" style={{ width: '60%', height: 36, marginBottom: '1.5rem' }} />

            {/* Price cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="sk" style={{ height: 72, borderRadius: 10 }} />
              ))}
            </div>

            {/* History block */}
            <div className="sk" style={{ height: 160, borderRadius: 12, marginBottom: '1.5rem' }} />
          </div>

          {/* Right */}
          <div className="sk-right" style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Image */}
            <div className="sk" style={{ aspectRatio: '1', borderRadius: 12 }} />
            {/* Actions card */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="sk" style={{ height: 20, width: '50%' }} />
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
