"""
price-range-sweep.py — validate the Tukey-fenced display range (FIX A) across a
broad basket of priced figures. Replicates FigureDetailContent's robustRange +
compBucket + headlineBucket logic and compares OLD (snapshot p10/p90) vs NEW
(fenced) range. Read-only; no writes. Throwaway analysis tool.
"""
import json, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

KB = "src/data/figures-reference-v2.slim.js"
R2 = "https://figurepinner-r2proxy.bubs960.workers.dev/price-summaries/{}.json"

def pctile(s, p):
    if not s: return None
    if len(s) == 1: return s[0]
    idx = (p/100)*(len(s)-1); lo=int(idx); hi=lo+1 if idx>lo else lo
    return s[lo] if lo==hi else s[lo]+(s[hi]-s[lo])*(idx-lo)

def fenced_high(prices):
    v = sorted(p for p in prices if p and p > 0)
    if len(v) < 4: return None
    q1, q3 = pctile(v,25), pctile(v,75)
    fence = q3 + 3*(q3-q1)
    within = [p for p in v if p <= fence]
    above = len(v) - len(within)
    if not above or not within: return None
    return (within[-1], (above, v[-1]))

def comp_bucket(c):
    ce = c.get("condition_effective")
    if ce in ("sealed","loose"): return ce
    cond = (c.get("condition") or "").lower()
    if not cond: return "unknown"
    if "new" in cond or "open box" in cond: return "sealed"
    if "used" in cond or "parts" in cond: return "loose"
    return "unknown"

def fetch(fid):
    try:
        req = urllib.request.Request(R2.format(fid), headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            return fid, json.loads(r.read())
    except Exception:
        return fid, None

def main():
    txt = open(KB, encoding="utf-8").read()
    fids = re.findall(r'"figure_id":"([^"]+)"', txt)
    total = len(fids)
    step = max(1, total//600)
    sample = fids[::step][:600]
    for x in ["fp_wrestling_mattel_elite_3_cody-rhodes_5c414e",
              "fp_dc_mcfarlane_multiverse_mcfarlane_batman_94f8aa",
              "fp_gi-joe_hasbro_classified-series_classified_cobra-commander_005bc6",
              "fp_gi-joe_hasbro_classified-series_classified_cobra-commander_e9d227"]:
        if x not in sample: sample.append(x)
    print(f"KB fids: {total} | sampling {len(sample)}", file=sys.stderr)

    rows = []
    with ThreadPoolExecutor(max_workers=16) as ex:
        for fid, d in ex.map(fetch, sample):
            if not d or (d.get("sold_count") or 0) < 4: continue
            seg = d.get("condition_segmentation") or "pooled"
            sealed, loose = d.get("sealed"), d.get("loose")
            if seg in ("split","sealed-only"): hb, hc = sealed, "sealed"
            elif seg == "loose-only": hb, hc = loose, "loose"
            else: hb, hc = None, None
            recent = d.get("recent") or []
            bucket_prices = [c["price"] for c in recent if (comp_bucket(c)==hc)] if hc else [c["price"] for c in recent]
            sb = sorted(p for p in bucket_prices if p and p>0)
            base_low = (hb or {}).get("p10") if hb else (pctile(sb,10) if len(sb)>=3 else None)
            base_high = (hb or {}).get("p90") if hb else (pctile(sb,90) if len(sb)>=3 else None)
            fh = fenced_high(bucket_prices)
            bites = fh and base_high and fh[0] < base_high
            nl = base_low
            nh = fh[0] if bites else base_high
            excl = fh[1] if bites else None
            old_low, old_high = base_low, base_high
            med = (hb or {}).get("median") if hb else d.get("median_sold")
            changed = old_high and nh and abs(nh-old_high) > 0.01
            rows.append(dict(fid=fid.split("_")[-1], line="_".join(fid.split("_")[1:4])[:26], seg=seg,
                             n=d.get("sold_count"), med=med, old_lo=old_low, old_hi=old_high,
                             new_lo=nl, new_hi=nh, excl=excl, changed=changed))

    rows.sort(key=lambda r: (r["old_hi"]/r["med"]) if (r["med"] and r["old_hi"]) else 0, reverse=True)
    print(f"\n{'line':26} {'seg':11} {'n':>3} {'med':>7} {'OLD range':>16} {'NEW range':>16}  note")
    print("-"*110)
    nchg = 0
    for r in rows:
        if r["changed"]: nchg += 1
        note = f"-{r['excl'][0]} up to ${r['excl'][1]:.0f}" if r["excl"] else ("" if not r["changed"] else "(clipped)")
        flag = " *" if r["changed"] else "  "
        def f(x): return f"${x:.2f}" if x is not None else "-"
        print(f"{r['line']:26} {r['seg']:11} {r['n']:>3} {f(r['med']):>7} "
              f"{f(r['old_lo'])+'-'+f(r['old_hi']):>16} {f(r['new_lo'])+'-'+f(r['new_hi']):>16}{flag}{note}")
    print("-"*110)
    print(f"priced figures: {len(rows)} | ranges CHANGED by fence: {nchg} | unchanged: {len(rows)-nchg}")

main()
