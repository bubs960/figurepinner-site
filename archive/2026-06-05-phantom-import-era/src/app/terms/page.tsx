import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'FigurePinner Terms of Service — rules for using the site and Chrome extension.',
  robots: { index: true, follow: false },
  alternates: { canonical: 'https://figurepinner.com/terms' },
}

export default function TermsPage() {
  const updated = 'April 2024'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.04em', color: 'var(--text)', textDecoration: 'none' }}>
          FIGUREPINNER
        </a>
        <a href="/app" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>Back to app</a>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          TERMS OF SERVICE
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '3rem' }}>
          Last updated: {updated}
        </p>

        <ProseSection title="Acceptance of Terms">
          <p>By accessing figurepinner.com or installing the FigurePinner Chrome Extension, you agree to be bound by these Terms of Service. If you do not agree, do not use FigurePinner. These terms apply to all visitors, registered users, and Pro subscribers.</p>
        </ProseSection>

        <ProseSection title="Description of Service">
          <p>FigurePinner provides action figure price intelligence tools, including a web application, Chrome browser extension, figure database, and collection tracking features. FigurePinner aggregates publicly available eBay sold listing data to generate price estimates. These estimates are for informational purposes only and are not guarantees of value.</p>
        </ProseSection>

        <ProseSection title="Accounts">
          <p>You must create an account to access certain features. You are responsible for maintaining the security of your account credentials. You may not share your account with others or create accounts to circumvent usage limits. We reserve the right to suspend or terminate accounts that violate these terms.</p>
          <p>You must be at least 13 years old to create an account. If you are between 13 and 18, you must have parental consent.</p>
        </ProseSection>

        <ProseSection title="Acceptable Use">
          <p>You agree not to:</p>
          <ul>
            <li>Use FigurePinner for any unlawful purpose</li>
            <li>Scrape, crawl, or systematically download content from FigurePinner without our written permission</li>
            <li>Attempt to reverse engineer, decompile, or extract our matching algorithms or figure database</li>
            <li>Use automated tools to access FigurePinner at volumes that strain our infrastructure</li>
            <li>Misrepresent figure values to deceive other collectors or buyers</li>
            <li>Circumvent any rate limits, access controls, or Pro tier restrictions</li>
          </ul>
        </ProseSection>

        <ProseSection title="Price Data Accuracy & Disclaimer">
          <p>FigurePinner price estimates are derived from eBay sold listing data and are provided &ldquo;as is.&rdquo; We make no warranties regarding accuracy, completeness, or fitness for a particular purpose. Actual market prices may differ.</p>
          <p><strong>FigurePinner is not a financial advisor.</strong> Do not make significant purchasing or selling decisions based solely on FigurePinner data. Always verify prices with current market data before transacting.</p>
          <p>We are not responsible for any losses, missed opportunities, or damages arising from reliance on our price data.</p>
        </ProseSection>

        <ProseSection title="Affiliate Links">
          <p id="affiliate">FigurePinner participates in the eBay Partner Network. When you click &ldquo;Find It →&rdquo; or similar links, you may be redirected to eBay through an affiliate link. If you make a purchase, FigurePinner may earn a commission at no extra cost to you.</p>
          <p>Affiliate relationships do not influence which figures we include in our database, our price estimates, or our matching results. We disclose affiliate links in accordance with FTC guidelines.</p>
        </ProseSection>

        <ProseSection title="Intellectual Property">
          <p>FigurePinner&apos;s software, design, and compiled figure database are owned by Bubs960 Collectibles. You may not copy, reproduce, or redistribute our software or database.</p>
          <p>Action figure names, characters, and trademarks are the property of their respective owners (Mattel, Hasbro, McFarlane Toys, etc.). FigurePinner references these names for nominative fair use purposes — to identify the products our users collect. We are not affiliated with or endorsed by any toy manufacturer.</p>
        </ProseSection>

        <ProseSection title="Pro Subscriptions">
          <p>Pro tier subscriptions are billed monthly or annually. Subscriptions auto-renew unless cancelled. You may cancel at any time; cancellation takes effect at the end of the current billing period. We do not offer refunds for partial billing periods.</p>
          <p>We reserve the right to modify Pro features or pricing with reasonable notice. If we make material changes that reduce your Pro benefits, we will offer a prorated refund or the option to cancel.</p>
        </ProseSection>

        <ProseSection title="Termination">
          <p>We may suspend or terminate your access to FigurePinner at any time for violations of these terms, illegal activity, or at our discretion. You may delete your account at any time through the Settings page.</p>
        </ProseSection>

        <ProseSection title="Limitation of Liability">
          <p>To the maximum extent permitted by law, FigurePinner and Bubs960 Collectibles shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. Our total liability to you for any claims arising from these terms shall not exceed the amount you paid us in the 12 months preceding the claim (or $10 if you are a free user).</p>
        </ProseSection>

        <ProseSection title="Governing Law">
          <p>These terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration rather than in court, except that you may bring claims in small claims court for disputes within its jurisdiction.</p>
        </ProseSection>

        <ProseSection title="Changes to Terms">
          <p>We may update these terms at any time. We will notify registered users of material changes by email or in-app notification. Your continued use of FigurePinner after changes constitutes acceptance of the updated terms.</p>
        </ProseSection>

        <ProseSection title="Contact">
          <p>
            Questions about these terms? Contact us:<br />
            <a href="mailto:legal@figurepinner.com">legal@figurepinner.com</a>
          </p>
        </ProseSection>

      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.5rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--dim)' }}>
          © {new Date().getFullYear()} FigurePinner ·{' '}
          <a href="/" style={{ color: 'var(--dim)' }}>Home</a> ·{' '}
          <a href="/about" style={{ color: 'var(--dim)' }}>About</a> ·{' '}
          <a href="/privacy" style={{ color: 'var(--dim)' }}>Privacy</a> ·{' '}
          <a href="/pro" style={{ color: 'var(--dim)' }}>Pro</a>
        </p>
      </footer>
    </div>
  )
}

function ProseSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        fontSize: '1.125rem', fontWeight: '700',
        color: 'var(--text)', marginBottom: '1rem',
        paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: '1.7' }}>
        {children}
      </div>
    </section>
  )
}
