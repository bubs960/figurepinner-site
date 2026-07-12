'use client'

// ClaimRitualLoader.tsx — thin client-side wrapper so layout.tsx (a Server
// Component) can mount ClaimRitual via next/dynamic({ ssr:false }).
//
// Next.js App Router forbids `ssr:false` on a next/dynamic() call made
// directly inside a Server Component ("`ssr: false` is not allowed with
// `next/dynamic` in Server Components. Please move it into a Client
// Component.") — the dynamic() call itself has to live in a 'use client'
// file. This is that file; it has no behavior of its own beyond the import.

import dynamic from 'next/dynamic'

const ClaimRitual = dynamic(() => import('./ClaimRitual'), { ssr: false })

export default ClaimRitual
