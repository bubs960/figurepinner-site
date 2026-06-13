"""Parse rendered figure-page HTML (dev) to verify the price-contradiction fix:
placard median/range/note + BidCheck column medians + their props. Read-only."""
import json, re, urllib.request

FIDS = {
    "CODY (loose-only, contaminated)": "fp_wrestling_mattel_elite_3_cody-rhodes_5c414e",
    "BATMAN (split, contaminated)":     "fp_dc_mcfarlane_multiverse_mcfarlane_batman_94f8aa",
    "COBRA (split)":                    "fp_gi-joe_hasbro_classified-series_classified_cobra-commander_005bc6",
}

def grab(html, key):
    # pull "key":<json-number|null|"str"> from the flight payload (first hit)
    m = re.search(r'\\?"' + key + r'\\?":\s*(-?\d+\.?\d*|null|\\?"[^"\\]*\\?")', html)
    return m.group(1).replace('\\"','').strip('"') if m else None

for label, fid in FIDS.items():
    req = urllib.request.Request(f"http://localhost:3000/figure/{fid}")
    html = urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "replace")
    print(f"\n=== {label} ===")
    # valuePricing fields
    print(f"  placard: median={grab(html,'median')}  low={grab(html,'low')}  high={grab(html,'high')}  "
          f"conf={grab(html,'confidence')}  cond={grab(html,'conditionLabel')}")
    note = re.search(r'Range excludes[^"<\\]+', html)
    print(f"  note: {note.group(0) if note else '(none)'}")
    # BidCheck props (segmentation + bucket medians fed in)
    print(f"  BidCheck props: seg={grab(html,'segmentation')}  sealedMedian={grab(html,'sealedMedian')}  "
          f"sealedCount={grab(html,'sealedCount')}  looseMedian={grab(html,'looseMedian')}  looseCount={grab(html,'looseCount')}")
    # BidCheck rendered column medians — locate each column by its sub-label,
    # then read the "Median $X" (or honest blank) inside that column block.
    for col, sub in (("New", "sealed / MOC"), ("Used", "loose / opened")):
        i = html.find(sub)
        seg = html[i:i + 700] if i >= 0 else ""
        clean = re.sub(r"<!--.*?-->", "", seg)          # strip React text separators
        clean = re.sub(r"<[^>]+>", " ", clean)          # strip tags
        m = re.search(r"Median\s*\$\s*([0-9][0-9.,]*)", clean)
        blank = "Not enough" in clean
        print(f"  BidCheck {col}: median={m.group(1) if m else None}  honest-blank={blank}")
