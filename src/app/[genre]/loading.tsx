// loading.tsx — Genre page skeleton
// Shown during navigation to /[genre] while the page SSRs

export default function GenreLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
      <style>{`
        @keyframes fp-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .fp-skel {
          background: linear-gradient(90deg, var(--s2) 25%, var(--s1) 50%, var(--s2) 75%);
          background-size: 1200px 100%;
          animation: fp-shimmer 1.4s infinite linear;
          border-radius: 4px;
        }
      `}</style>

      {/* Nav skeleton */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div className="fp-skel" style={{ width: 140, height: 18 }} />
        <div className="fp-skel" style={{ width: 72, height: 28, borderRadius: 6 }} />
      </nav>

      {/* Breadcrumb */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0.875rem 1.5rem' }}>
        <div className="fp-skel" style={{ width: 120, height: 14 }} />
      </div>

      {/* Hero skeleton */}
      <header style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem 2.5rem', borderBottom: '1px solid var(--border)' }}>
        <div className="fp-skel" style={{ width: 48, height: 3, borderRadius: 2, marginBottom: '1.25rem' }} />
        <div className="fp-skel" style={{ width: '55%', height: 44, marginBottom: '1rem' }} />
        <div className="fp-skel" style={{ width: '70%', height: 16, marginBottom: '0.5rem' }} />
        <div className="fp-skel" style={{ width: '50%', height: 16, marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div className="fp-skel" style={{ width: 80, height: 24 }} />
          <div className="fp-skel" style={{ width: 80, height: 24 }} />
          <div className="fp-skel" style={{ width: 110, height: 24, borderRadius: 100 }} />
          <div className="fp-skel" style={{ width: 110, height: 24, borderRadius: 100 }} />
        </div>
      </header>

      {/* Figure grid skeletons — two line sections */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {[12, 8].map((count, si) => (
          <section key={si} style={{ marginBottom: '3.5rem' }}>
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 3, height: 18, background: 'var(--border)', borderRadius: 2 }} />
                <div className="fp-skel" style={{ width: 160, height: 18 }} />
              </div>
              <div className="fp-skel" style={{ width: 60, height: 14 }} />
            </div>
            {/* Card grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.5rem' }}>
              {Array.from({ length: count }, (_, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.625rem 0.75rem',
                  background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 8,
                }}>
                  <div className="fp-skel" style={{ width: 36, height: 36, borderRadius: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fp-skel" style={{ height: 13, marginBottom: '0.375rem', width: '80%' }} />
                    <div className="fp-skel" style={{ height: 11, width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
