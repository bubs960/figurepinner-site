'use client'

// CfBeacon — wraps the Cloudflare Web Analytics RUM beacon so a flagged
// QA browser (see qaFlag.ts) sends zero pageviews. layout.tsx is a server
// component and can't read localStorage itself, so this client component
// makes the render decision instead.
//
// Defaults to NOT rendering the Script until the mount effect resolves the
// flag -- server-rendered HTML and the client's first hydration pass both
// render nothing, so there's no hydration mismatch (same pattern AdSlot.tsx
// already uses for its Pro-check). The decision resolves synchronously on
// mount, well before next/script's afterInteractive strategy would have
// fetched anything -- no real visitor's beacon is delayed in any way that
// matters.

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { isQaSession } from '../_lib/qaFlag'

export default function CfBeacon() {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    setShouldRender(!isQaSession())
  }, [])

  if (!shouldRender) return null

  return (
    <Script
      id="cf-web-analytics"
      strategy="afterInteractive"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={'{"token": "63401800264c480c94a7335a223f9db8"}'}
    />
  )
}
