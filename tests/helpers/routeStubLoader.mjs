/**
 * Test-only resolve hook: redirects the three framework imports route
 * handlers make (next/server, @clerk/nextjs/server, @opennextjs/cloudflare)
 * to tiny stubs in ./routeStubs/, so the REAL src/app/api/** route.ts
 * handlers can be imported under plain `node --test`. No source file is
 * touched; this is registered from the route test files themselves.
 */
const STUBS = {
  'next/server': new URL('./routeStubs/next-server.mjs', import.meta.url).href,
  '@clerk/nextjs/server': new URL('./routeStubs/clerk-server.mjs', import.meta.url).href,
  '@opennextjs/cloudflare': new URL('./routeStubs/opennext-cloudflare.mjs', import.meta.url).href,
}

export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS[specifier]
  if (stub) return { url: stub, shortCircuit: true }
  return nextResolve(specifier, context)
}
