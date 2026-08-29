/**
 * Data-free KB helpers — Phase 7 Tier A surface (2026-08-29).
 *
 * Import from HERE (never from kb.ts) when a module needs only derivation
 * helpers or the KBFigure type: kb.ts `require()`s the 18.9MB slim KB array at
 * module top, so any import of it — even for a pure helper — pulls the full
 * array into the worker bundle transitively.
 *
 * Everything here re-exports from kbTypes.ts, which has no data import by
 * construction (guarded by tests/kbHelpersDataFree.test.mjs).
 *
 * NOT here on purpose: `prettyFigureUrl` / `hasUniquePrettyFigureUrl` read a
 * module-init collision map built from the full KB — they stay in kb.ts until
 * the committed pretty-path ledger sidecar lands (matcher ACK'd 8/24).
 */

export {
  deriveName,
  deriveEmbeddedLine,
  figurePageTitle,
  figureUrl,
  isNumericWave,
  titleCaseValue,
} from './kbTypes'
export type { KBFigure } from './kbTypes'
