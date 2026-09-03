// deploy-status.mjs -- one place where the NON-FATAL post-deploy steps record
// what actually happened, so post-deploy-git-check.mjs can print it loudly.
//
// Why (2026-09-03 ops audit, risk 1): kv-purge-stale-isr, purge-cache and
// post-deploy-prewarm all exit 0 by design (the deploy is already live; a
// purge failure must not fail the chain), which meant a deploy could finish
// "green" with stale ISR HTML and an unpurged zone, the only evidence being
// scrollback nobody reads. Each step now calls recordStep(); the last step
// of the chain echoes the table. File lives under .open-next/ (gitignored,
// rewritten by every build) so a stale status can never outlive its build.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(ROOT, '.open-next', 'deploy-status.json')

export function recordStep(step, status, detail = '') {
  try {
    mkdirSync(path.dirname(FILE), { recursive: true })
    const cur = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {}
    cur[step] = { status, detail: String(detail).slice(0, 300), at: new Date().toISOString() }
    writeFileSync(FILE, JSON.stringify(cur, null, 2))
  } catch { /* never let bookkeeping fail a step */ }
}

export function readSteps() {
  try { return existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {} } catch { return {} }
}
