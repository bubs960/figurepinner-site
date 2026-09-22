/**
 * Constant-time string comparison for secrets and signatures. Bails early only
 * on a length mismatch (secret length is not sensitive); otherwise inspects
 * every character, so response time does not reveal the matching prefix.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
