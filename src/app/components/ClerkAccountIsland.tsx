'use client'

// Lazy loader for ClerkAccountIslandInner — the next/dynamic() call has to
// live in a 'use client' file (same constraint ClaimRitualLoader documents).
// ssr:false: the widget is session-dependent and public pages are static.

import dynamic from 'next/dynamic'

const ClerkAccountIsland = dynamic(() => import('./ClerkAccountIslandInner'), { ssr: false })

export default ClerkAccountIsland
