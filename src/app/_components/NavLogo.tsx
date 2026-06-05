import Link from 'next/link'

/** Site wordmark for sticky navs. White text on dark — never grey. */
export default function NavLogo() {
  return (
    <Link href="/" style={{
      fontWeight: 800, fontSize: '1rem',
      textDecoration: 'none', color: 'var(--fp-text)',
      fontFamily: 'var(--fp-font-display)', letterSpacing: '0.02em',
    }}>
      FigurePinner
    </Link>
  )
}
