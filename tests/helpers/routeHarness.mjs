import { register } from 'node:module'

// Must run before any route module is imported (use dynamic import() after this).
register('./routeStubLoader.mjs', import.meta.url)

const CF = Symbol.for('__cloudflare-context__')

/** Fake D1 that records every prepare() and answers all()/run() with canned data. */
export function fakeDb({ allResults = [], changes = 1 } = {}) {
  const calls = []
  return {
    calls,
    prepare(sql) {
      const stmt = {
        bind(...args) {
          calls.push({ sql, args })
          return stmt
        },
        async all() {
          return { results: allResults }
        },
        async run() {
          return { meta: { changes } }
        },
      }
      return stmt
    },
  }
}

export function installEnv(env) {
  globalThis[CF] = { env, ctx: {}, cf: {} }
}

export function setUser(userId, isPro = false) {
  globalThis.__fpTestAuth = { userId, isPro }
}

/** Install a fake Workers Cache API whose rate-limit counter already sits at `count`. */
export function installRateLimitCache(count) {
  globalThis.caches = {
    default: {
      async match() {
        return new Response(String(count))
      },
      async put() {},
    },
  }
}

export function clearRateLimitCache() {
  delete globalThis.caches
}

export function jsonReq(url, method, body, headers = {}) {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

export async function read(res) {
  return { status: res.status, body: await res.json(), headers: res.headers }
}
