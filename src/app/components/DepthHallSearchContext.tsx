'use client'

// Split out of DepthHallHero.tsx on 2026-09-02 (speed sweep, finding 4): HeroSearch
// imported this one context from DepthHallHero, which dragged the whole 42 KB
// homepage hero component (and its CSS module) into the sitewide header chunk
// on every anonymous page. The context is the only thing the two share.
import { createContext } from 'react'

/** Set by DepthHallHero; called by HeroSearch when the search overlay opens/closes
 *  so the hall can pause its animation behind an active search. */
export const DepthHallSearchActiveContext = createContext<(active: boolean) => void>(() => {})
