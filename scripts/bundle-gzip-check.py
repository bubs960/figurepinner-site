#!/usr/bin/env python3
"""
bundle-gzip-check.py — estimate Worker bundle gzip vs the 10MB deploy limit.

WHY (S17, 2026-06-10): matcher self-gates per-line enrichment at 60% and
wallet tracks the 65% KB-cutover trigger (WALLET-TO-WEB-MATCHER-CEILING +
WEB-VERTICAL-ARCHITECTURE-SPEC). The KB is the only fast-moving part of the
bundle, so: estimate = gzip(KB) + calibrated non-KB overhead.

Calibration (2026-06-10, deploy cc1bb9b1):
  wrangler total gzip = 5,214,024 B (5091.82 KiB)
  KB gzip             = 2,751,809 B
  → non-KB overhead   = 2,462,215 B
Re-calibrate OVERHEAD whenever a deploy's wrangler-printed gzip differs from
this script's estimate by more than ~3% (framework upgrades shift it).

The EXACT number prints at every deploy (wrangler "Total Upload: ... gzip:").
This script exists so matcher/wallet can check WITHOUT deploying.

Usage:  python scripts/bundle-gzip-check.py
"""
import gzip, io, os, sys

KB_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'figures-reference-v2.js')
OVERHEAD = 2_462_215          # non-KB gzip bytes, calibrated 2026-06-10
LIMIT = 10 * 1024 * 1024      # CF Workers paid-plan compressed limit

def main():
    raw = open(KB_PATH, 'rb').read()
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode='wb', compresslevel=6) as g:
        g.write(raw)
    kb_gz = buf.tell()
    est = kb_gz + OVERHEAD
    pct = 100.0 * est / LIMIT
    print(f'KB raw:        {len(raw):>12,} B')
    print(f'KB gzip:       {kb_gz:>12,} B')
    print(f'non-KB (cal):  {OVERHEAD:>12,} B')
    print(f'est bundle gz: {est:>12,} B  ({pct:.1f}% of 10MB limit)')
    if pct >= 65:
        print('STATUS: >=65% — KB-CUTOVER TRIGGER FIRED (wallet/web spec). Do not apply large KB batches; start Phase A.')
        sys.exit(2)
    if pct >= 60:
        print('STATUS: >=60% — matcher per-line runs PAUSE per MATCHER-TO-WEB-BUNDLE-SEQUENCING.')
        sys.exit(1)
    print('STATUS: OK — headroom normal.')

if __name__ == '__main__':
    main()
