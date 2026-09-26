// Test-only stand-in for `@clerk/nextjs/server`. Tests set the signed-in
// user via globalThis.__fpTestAuth = { userId, isPro }.
function state() {
  return globalThis.__fpTestAuth ?? { userId: null, isPro: false }
}
export async function auth() {
  return { userId: state().userId ?? null }
}
export async function currentUser() {
  const s = state()
  return s.userId ? { id: s.userId, publicMetadata: { isPro: s.isPro === true } } : null
}
export async function clerkClient() {
  return { users: { getUser: async (id) => ({ id, publicMetadata: { isPro: state().isPro === true } }) } }
}
