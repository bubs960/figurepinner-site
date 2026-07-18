#!/usr/bin/env bash
# One-time BOUNDED ISR-cache pre-warm for the INDEXING PROGRAM Part B curated
# set. R8 amended attack-order item 3: Googlebot response time (1.38s avg
# measured 2026-07-18) is a cold-cache coverage problem, not per-request
# slowness -- see WEB-TO-STANDALONE-INDEXING-PROGRAM-PARTS-ACD-2026-07-18.md
# Part C. NOT a recurring cron -- a rolling refill of the full ~22K catalog
# would cost millions of KV writes/month; this runs bounded batches
# (--offset/--limit) so each one can be cost-checked before the next.
#
# Uses curl, not Node fetch/PowerShell -- verified 2026-07-18/19 that
# Cloudflare's edge here blocks Node's fetch (undici) and PowerShell's HTTP
# client with 403 regardless of User-Agent, but this exact curl build passes
# with a browser UA (TLS/ALPN fingerprint difference, not UA-string gating --
# confirmed by testing identical UA strings across both clients). This is
# almost certainly the SAME gap a real bulk-scraper could exploit --
# Data Defense Layer 2's rate limiter (100 req/min/IP on figure-page HTML,
# middleware.ts) is what actually stops that, not Bot Fight. Flagged
# separately, not fixed by this script.
#
# Usage:
#   node --import ./scripts/register-ts-loader.mjs scripts/gen-curated-url-list.mjs /tmp/curated-urls.tsv
#   scripts/prewarm-curl-runner.sh /tmp/curated-urls.tsv <offset> <limit> [delay_seconds] [out_csv]
set -euo pipefail

LIST_FILE="${1:?usage: prewarm-curl-runner.sh <list-file> <offset> <limit> [delay_seconds] [out_csv]}"
OFFSET="${2:?offset required}"
LIMIT="${3:?limit required}"
DELAY="${4:-0.7}"
OUT_CSV="${5:-prewarm-results-${OFFSET}-$((OFFSET + LIMIT)).csv}"
BASE="https://figurepinner.com"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

TOTAL=$(wc -l < "$LIST_FILE")
echo "Curated list: $TOTAL URLs total. This run: offset=$OFFSET limit=$LIMIT delay=${DELAY}s -> out=$OUT_CSV"

echo "figure_id,path,status,x_fp_edge,cf_cache_status,time_total_s" > "$OUT_CSV"

cold=0; warm=0; err=0; n=0
# sed range extraction, not `tail | head` -- head closing early on a long tail
# stream sends tail a SIGPIPE, which `pipefail` turns into a fatal exit 141.
sed -n "$((OFFSET + 1)),$((OFFSET + LIMIT))p" "$LIST_FILE" | while IFS=$'\t' read -r fid path; do
  n=$((n + 1))
  resp=$(curl -s -D - -o /dev/null --max-time 20 -A "$UA" \
    -w '\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\n' \
    "${BASE}${path}" 2>/dev/null || echo "HTTP_STATUS:000")
  status=$(echo "$resp" | grep -o 'HTTP_STATUS:[0-9]*' | tail -1 | cut -d: -f2)
  time_total=$(echo "$resp" | grep -o 'TIME_TOTAL:[0-9.]*' | tail -1 | cut -d: -f2)
  edge=$(echo "$resp" | grep -i '^x-fp-edge:' | tr -d '\r' | cut -d' ' -f2 || true)
  cfcache=$(echo "$resp" | grep -i '^cf-cache-status:' | tr -d '\r' | cut -d' ' -f2 || true)
  echo "${fid},${path},${status:-000},${edge:-},${cfcache:-},${time_total:-}" >> "$OUT_CSV"
  if [ "${status:-000}" = "000" ] || [ "${status:-200}" -ge 400 ] 2>/dev/null; then err=$((err+1))
  elif [ "$edge" = "MISS" ]; then cold=$((cold+1))
  elif [ "$edge" = "HIT" ]; then warm=$((warm+1))
  fi
  if [ $((n % 25)) -eq 0 ]; then
    echo "$n/$LIMIT — cold(MISS)=$cold already-warm(HIT)=$warm errors=$err"
  fi
  sleep "$DELAY"
done

# Tally from the CSV itself (the while-loop above runs in a pipe subshell,
# so its cold/warm/err counters don't survive past `done`).
final_cold=$(tail -n +2 "$OUT_CSV" | awk -F',' '$4=="MISS"' | wc -l)
final_warm=$(tail -n +2 "$OUT_CSV" | awk -F',' '$4=="HIT"' | wc -l)
final_err=$(tail -n +2 "$OUT_CSV" | awk -F',' '$3=="000" || $3+0>=400' | wc -l)
echo "Done. cold(MISS)=$final_cold already-warm(HIT)=$final_warm errors=$final_err -> $OUT_CSV"
