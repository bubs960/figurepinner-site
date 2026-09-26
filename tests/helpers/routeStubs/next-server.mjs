// Test-only stand-in for `next/server` (plain `node --test` cannot resolve
// the real one). Only the surface the tested route handlers use:
// NextResponse.json(body, init) and the NextRequest type (a plain Request).
export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers)
    if (!headers.has('content-type')) headers.set('content-type', 'application/json')
    return new Response(JSON.stringify(body), { status: init.status ?? 200, headers })
  }
}
export class NextRequest extends Request {}
