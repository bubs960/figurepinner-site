// Global Cloudflare Workers type stubs — no export, keeps these in global scope.
// Full types: npm install -D @cloudflare/workers-types

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  run(): Promise<{ meta: { changes: number; last_row_id: number } }>
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
  first<T = Record<string, unknown>>(): Promise<T | null>
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>
  exec(query: string): Promise<void>
  // Sessions API (read replication): 'first-unconstrained' routes to any
  // instance (primary or replica), 'first-primary' to the primary, or a
  // bookmark string from a previous session's getBookmark().
  withSession(constraint?: 'first-unconstrained' | 'first-primary' | string): D1DatabaseSession
}

interface D1DatabaseSession {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>
  getBookmark(): string | null
}

interface AnalyticsEngineDataset {
  writeDataPoint(point: {
    indexes?: string[]
    blobs?: string[]
    doubles?: number[]
  }): void
}
