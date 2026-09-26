// Test-only stand-in for `@opennextjs/cloudflare`'s getCloudflareContext:
// reads the same globalThis[Symbol.for('__cloudflare-context__')] slot the
// real one reads (the pattern tests/kvIncrementalCacheTtl.test.mjs uses).
export async function getCloudflareContext() {
  const ctx = globalThis[Symbol.for('__cloudflare-context__')]
  if (!ctx) throw new Error('test: no fake cloudflare context installed')
  return ctx
}
