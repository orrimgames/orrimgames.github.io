#!/usr/bin/env python3
"""
arbscan.py - read-only prediction-market arbitrage scanner.

Venues: Polymarket (gamma-api + clob, public) and Kalshi (trade-api v2, public).
Detects:
  1. intra-binary:   yes_ask + no_ask < 1 on one contract (crossed book)
  2. intra-event:    mutually-exclusive multi-outcome event, sum(all yes asks) < 1
  3. cross-venue:    same event on both venues, yes_ask(A) + no_ask(B) < 1 (and mirror)

All profit figures are NET of taker fees:
  Polymarket: fee = C * rate * p * (1-p)      (rate from market feeSchedule; 0 if fees disabled)
  Kalshi:     fee = ceil(0.07 * C * p * (1-p) * 100) / 100   (per trade, cents rounded up)

No auth, no orders, no keys. Public market data only.
"""
import argparse, json, math, re, sys, time, unicodedata
from collections import defaultdict

import requests

GAMMA = "https://gamma-api.polymarket.com"
CLOB = "https://clob.polymarket.com"
KALSHI = "https://api.elections.kalshi.com/trade-api/v2"

DATE_PAT = re.compile(
    r"(january|february|march|april|may|june|july|august|september|october|november|december"
    r"|\b20[0-9]{2}\b|\bq[1-4]\b|\bweek\b|\bday\b)", re.I)

UA = {"User-Agent": "arbscan/0.1 (read-only research)"}

def _parse_ids(v):
    """gamma clobTokenIds arrives as a JSON-encoded string; normalize to list."""
    if isinstance(v, str):
        try:
            return json.loads(v)
        except Exception:
            return []
    return v or []
S = requests.Session()
S.headers.update(UA)

# ---------------------------------------------------------------- fees

def poly_fee_per_contract(price, rate):
    return rate * price * (1.0 - price)

def kalshi_fee_per_contract(price):
    # ceil(0.07 * C * p * (1-p)) in cents, C=1
    return math.ceil(0.07 * price * (1.0 - price) * 100.0) / 100.0

# ---------------------------------------------------------------- polymarket

def poly_events(max_pages=40, sleep=0.12):
    out = []
    for page in range(max_pages):
        r = S.get(f"{GAMMA}/events", params={
            "limit": 100, "offset": page * 100,
            "active": "true", "closed": "false",
            "order": "volume24hr", "ascending": "false"}, timeout=30)
        if r.status_code == 422:  # gamma caps deep offsets; we've hit the tail
            break
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        out.extend(batch)
        if len(batch) < 100:
            break
        time.sleep(sleep)
    return out

def poly_normalize(events):
    """-> (binaries, multievents). Prices as floats, fees as per-contract rates."""
    binaries, multi = [], []
    for e in events:
        ms = [m for m in e.get("markets", []) if m.get("active") and not m.get("closed")
              and m.get("acceptingOrders", True) and m.get("enableOrderBook", True)]
        if not ms:
            continue
        legs = []
        for m in ms:
            try:
                bid = float(m.get("bestBid") or 0)
                ask = float(m.get("bestAsk") or 0)
            except (TypeError, ValueError):
                continue
            if not (0 < bid < 1 and 0 < ask < 1 and ask >= bid):
                continue
            fs = m.get("feeSchedule") or {}
            rate = float(fs.get("rate", 0) or 0) if m.get("feesEnabled") else 0.0
            legs.append({
                "venue": "polymarket",
                "event": e.get("title") or "",
                "label": m.get("groupItemTitle") or m.get("question") or "",
                "question": m.get("question") or "",
                "yes_bid": bid, "yes_ask": ask,
                "no_ask": round(1.0 - bid, 6), "no_bid": round(1.0 - ask, 6),
                "fee_rate": rate,
                "fee_fn": lambda p, r=rate: poly_fee_per_contract(p, r),
                "vol24": float(m.get("volume24hrClob") or m.get("volume24hr") or 0),
                "liq": float(m.get("liquidityClob") or m.get("liquidity") or 0),
                "end": e.get("endDate") or m.get("endDate") or "",
                "url": f"https://polymarket.com/event/{e.get('slug','')}",
                "slug": m.get("slug") or "",
                "tokens": _parse_ids(m.get("clobTokenIds")),
                "neg_risk": bool(e.get("negRisk")),
            })
        if not legs:
            continue
        if len(legs) == 1:
            binaries.append(legs[0])
        else:
            all_ms = e.get("markets", [])
            groups = [(m.get("groupItemTitle") or "") for m in ms]
            ladder = bool(groups) and all(DATE_PAT.search(g) for g in groups)
            multi.append({"title": e.get("title") or "", "legs": legs,
                          "neg_risk": bool(e.get("negRisk")),
                          "coverage": f"{len(legs)}/{len(all_ms)}",
                          "complete": len(legs) == len(all_ms) and not ladder,
                          "ladder": ladder,
                          "url": f"https://polymarket.com/event/{e.get('slug','')}"})
    return binaries, multi

def poly_book(token_id):
    """Confirm top-of-book live from the CLOB for a flagged hit."""
    r = S.get(f"{CLOB}/book", params={"token_id": token_id}, timeout=15)
    r.raise_for_status()
    b = r.json()
    asks = sorted(((float(x["price"]), float(x["size"])) for x in b.get("asks", [])))
    bids = sorted(((float(x["price"]), float(x["size"])) for x in b.get("bids", [])), reverse=True)
    return (asks[0] if asks else None), (bids[0] if bids else None)

# ---------------------------------------------------------------- kalshi

def kalshi_events(max_pages=25, sleep=0.12):
    out, cursor = [], ""
    for _ in range(max_pages):
        params = {"limit": 200, "with_nested_markets": "true", "status": "open"}
        if cursor:
            params["cursor"] = cursor
        r = S.get(f"{KALSHI}/events", params=params, timeout=30)
        r.raise_for_status()
        d = r.json()
        out.extend(d.get("events", []))
        cursor = d.get("cursor") or ""
        if not cursor:
            break
        time.sleep(sleep)
    return out

def _f(x):
    try:
        v = float(x)
        return v if math.isfinite(v) else 0.0
    except (TypeError, ValueError):
        return 0.0

def kalshi_normalize(events):
    binaries, multi = [], []
    for e in events:
        ms = [m for m in e.get("markets", []) if m.get("status") == "active"]
        legs = []
        for m in ms:
            ya, yb = _f(m.get("yes_ask_dollars")), _f(m.get("yes_bid_dollars"))
            na, nb = _f(m.get("no_ask_dollars")), _f(m.get("no_bid_dollars"))
            # Kalshi sometimes reports 0.0 on an empty side; derive from complement.
            if ya <= 0 and nb > 0: ya = round(1.0 - nb, 4)
            if na <= 0 and yb > 0: na = round(1.0 - yb, 4)
            if yb <= 0 and na > 0: yb = round(1.0 - na, 4)
            if nb <= 0 and ya > 0: nb = round(1.0 - ya, 4)
            if not (0 < ya <= 1 and 0 < yb < ya):
                continue
            legs.append({
                "venue": "kalshi",
                "event": e.get("title") or "",
                "label": m.get("yes_sub_title") or m.get("title") or "",
                "question": m.get("title") or "",
                "yes_bid": yb, "yes_ask": ya, "no_ask": na, "no_bid": nb,
                "ask_size": _f(m.get("yes_ask_size_fp")),
                "fee_rate": 0.07,
                "fee_fn": kalshi_fee_per_contract,
                "vol24": _f(m.get("volume_24h_fp")),
                "oi": _f(m.get("open_interest_fp")),
                "end": m.get("close_time") or "",
                "url": f"https://kalshi.com/markets/{m.get('ticker','')}",
                "ticker": m.get("ticker") or "",
            })
        if not legs:
            continue
        if len(legs) == 1:
            binaries.append(legs[0])
        elif e.get("mutually_exclusive"):
            multi.append({"title": e.get("title") or "", "legs": legs,
                          "coverage": f"{len(legs)}/{len(ms)}",
                          "complete": len(legs) == len(ms),
                          "ladder": False, "neg_risk": None,
                          "url": f"https://kalshi.com/events/{e.get('event_ticker','')}"})
    return binaries, multi

# ---------------------------------------------------------------- detectors

def scan_intra_binary(books, min_profit=0.0):
    hits = []
    for m in books:
        gross = 1.0 - (m["yes_ask"] + m["no_ask"])
        if gross <= min_profit:
            continue
        fees = m["fee_fn"](m["yes_ask"]) + m["fee_fn"](m["no_ask"])
        capital = m["yes_ask"] + m["no_ask"] + fees
        net = gross - fees
        hits.append({**m, "gross": gross, "fees": fees, "net": net,
                     "capital": capital, "roi": net / capital if capital > 0 else 0.0,
                     "kind": "intra-binary"})
    return hits

def scan_intra_event(multis, min_profit=0.0, max_legs=60):
    hits = []
    for ev in multis:
        if not ev.get("complete", True):
            continue  # dropped legs or nested date ladder -> outcome space not provably covered
        legs = ev["legs"]
        # Tier 1 = negRisk (on-chain exactly-one guarantee). Tier 2 = semantic candidate:
        # 'mutually exclusive' per venue metadata usually means AT MOST one, so sum<1
        # is not mechanically an arb (implicit 'none of the above' resolves all NO).
        tier = 1 if ev.get("neg_risk") else 2
        if not (2 <= len(legs) <= max_legs):
            continue
        cost = sum(l["yes_ask"] for l in legs)
        gross = 1.0 - cost
        if gross <= min_profit:
            continue
        fees = sum(l["fee_fn"](l["yes_ask"]) for l in legs)
        capital = cost + fees
        net = gross - fees
        legs_out = []
        for l in legs:
            d = {"label": l["label"], "ask": l["yes_ask"], "fee": l["fee_rate"]}
            if l["venue"] == "polymarket":
                toks = l.get("tokens") or []
                d["token"] = toks[0] if toks else None
            else:
                d["ticker"] = l.get("ticker")
            legs_out.append(d)
        hits.append({"venue": legs[0]["venue"], "event": ev["title"],
                     "n_legs": len(legs), "gross": gross, "fees": fees,
                     "net": net, "capital": capital,
                     "roi": net / capital if capital > 0 else 0.0, "url": ev["url"],
                     "neg_risk": ev.get("neg_risk"), "coverage": ev.get("coverage"), "tier": tier,
                     "legs": legs_out,
                     "kind": "intra-event"})
    return sorted(hits, key=lambda h: -h["net"])

# ---- cross-venue matching

STOP = set("""the a an and or of in on for to will be by at from with is are was were
what who which when where how many much does do did it its this that over under
before after between during win won take takes get gets become becomes
year years month months day days vs""".split())

def norm_tokens(s):
    s = unicodedata.normalize("NFKD", s).lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    toks = [t for t in s.split() if t not in STOP and len(t) > 1]
    return set(toks)

def jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)

def scan_cross(poly_books, kalshi_books, min_sim=0.55, min_net=0.0):
    # inverted index on kalshi tokens -> candidate pairs only
    idx = defaultdict(list)
    k_toks = []
    for i, k in enumerate(kalshi_books):
        t = norm_tokens(k["event"] + " " + k["label"] + " " + k["question"])
        k_toks.append(t)
        for tok in t:
            idx[tok].append(i)
    hits = []
    for p in poly_books:
        pt = norm_tokens(p["event"] + " " + p["label"] + " " + p["question"])
        if not pt:
            continue
        cand = defaultdict(int)
        for tok in pt:
            for i in idx.get(tok, ()):
                cand[i] += 1
        for i, shared in cand.items():
            if shared < 3:
                continue
            sim = jaccard(pt, k_toks[i])
            if sim < min_sim:
                continue
            k = kalshi_books[i]
            for buy_yes, buy_no, direction in ((p, k, "YES@poly+NO@kalshi"),
                                               (k, p, "YES@kalshi+NO@poly")):
                gross = 1.0 - (buy_yes["yes_ask"] + buy_no["no_ask"])
                if gross <= 0:
                    continue
                fees = (buy_yes["fee_fn"](buy_yes["yes_ask"])
                        + buy_no["fee_fn"](buy_no["no_ask"]))
                net = gross - fees
                if net <= min_net:
                    continue
                capital = buy_yes["yes_ask"] + buy_no["no_ask"] + fees
                def side(leg, px_key):
                    d = {"venue": leg["venue"], "ask": leg[px_key], "fee": leg["fee_rate"]}
                    toks = leg.get("tokens") or []
                    if leg["venue"] == "polymarket":
                        d["token_yes"] = toks[0] if len(toks) > 0 else None
                        d["token_no"] = toks[1] if len(toks) > 1 else None
                    else:
                        d["ticker"] = leg.get("ticker")
                    return d
                hits.append({"kind": "cross-venue", "direction": direction,
                             "sim": round(sim, 3), "gross": gross, "fees": fees,
                             "net": net, "capital": capital,
                             "roi": net / capital if capital > 0 else 0.0,
                             "yes_leg": side(buy_yes, "yes_ask"),
                             "no_leg": side(buy_no, "no_ask"),
                             "poly": p["question"], "kalshi": k["question"],
                             "poly_url": p["url"], "kalshi_url": k["url"],
                             "poly_end": p["end"], "kalshi_end": k["end"]})
    hits.sort(key=lambda h: -h["net"])
    seen, out = set(), []
    for h in hits:
        key = (h["poly"][:40], h["kalshi"][:40], h["direction"])
        if key in seen:
            continue
        seen.add(key)
        out.append(h)
    return out

# ---------------------------------------------------------------- report

def fmt_cents(x):
    return f"{x*100:+.2f}c"

def run_scan(args):
    t0 = time.time()
    pe = poly_events()
    ke = kalshi_events()
    pb, pm = poly_normalize(pe)
    kb, km = kalshi_normalize(ke)
    stats = (f"polymarket: {len(pe)} events -> {len(pb)} binary + {len(pm)} multi | "
             f"kalshi: {len(ke)} events -> {len(kb)} binary + {len(km)} mutual-excl multi")

    ib = scan_intra_binary(pb + kb, args.min_profit)
    ie = scan_intra_event(pm + km, args.min_profit)
    xv = scan_cross(pb, kb, min_net=0.0)
    dt = time.time() - t0

    print(f"[scan] {stats}")
    print(f"[scan] took {dt:.1f}s\n")

    print(f"== intra-binary (yes+no < $1, crossed book): {len(ib)} hits")
    for h in sorted(ib, key=lambda x: -x["net"])[:args.top]:
        print(f"  {h['venue']:10s} {h['question'][:70]}  gross {fmt_cents(h['gross'])} "
              f"fees {fmt_cents(-h['fees'])} net {fmt_cents(h['net'])}  {h['url']}")

    seen_urls = set()
    ie = [h for h in ie if not (h["url"] in seen_urls or seen_urls.add(h["url"]))]
    t1 = [h for h in ie if h.get("tier") == 1]
    t2 = [h for h in ie if h.get("tier") == 2]
    print(f"\n== intra-event multi-outcome (sum asks < $1): {len(ie)} hits "
          f"(tier1 mechanical: {len(t1)}, tier2 semantic-candidate: {len(t2)})")
    for h in ie[:args.top]:
        print(f"  T{h.get('tier','?')} {h['venue']:10s} [{h['n_legs']} legs cov {h.get('coverage','?')}] {h['event'][:52]}  "
              f"gross {fmt_cents(h['gross'])} fees {fmt_cents(-h['fees'])} net {fmt_cents(h['net'])}")
        print(f"      {h['url']}")

    print(f"\n== cross-venue (net of fees): {len(xv)} hits")
    for h in xv[:args.top]:
        print(f"  sim={h['sim']:.2f} {h['direction']}  gross {fmt_cents(h['gross'])} "
              f"fees {fmt_cents(-h['fees'])} net {fmt_cents(h['net'])}")
        print(f"    poly:   {h['poly'][:80]}")
        print(f"    kalshi: {h['kalshi'][:80]}")
        print(f"    ends:   {h['poly_end'][:10]} vs {h['kalshi_end'][:10]}")
        print(f"    {h['poly_url']}")
        print(f"    {h['kalshi_url']}")

    if args.json:
        def clean(h):
            return {k: v for k, v in h.items() if k != "fee_fn"}
        # attach event slugs for browser live re-check
        for h in ie:
            h["event_slug"] = h["url"].rsplit("/", 1)[-1]
        doc = {
            "meta": {
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "ts": time.time(),
                "scan_seconds": round(dt, 1),
                "schema": 2,
                "stats": stats,
                "fee_models": {
                    "polymarket": "taker fee = rate*p*(1-p) per share, rate from market feeSchedule (0-0.07, geopolitics 0)",
                    "kalshi": "taker fee = ceil(0.07*p*(1-p)*100)/100 per contract",
                },
                "sources": {
                    "polymarket": "gamma-api.polymarket.com + clob.polymarket.com (public)",
                    "kalshi": "api.elections.kalshi.com/trade-api/v2 (public)",
                },
            },
            "intra_binary": [clean(h) for h in ib],
            "intra_event": ie,
            "cross": xv,
        }
        with open(args.json, "w") as f:
            json.dump(doc, f, indent=1)
    return ib, ie, xv

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--loop", type=int, default=0, help="seconds between scans (0 = single scan)")
    ap.add_argument("--min-profit", type=float, default=0.0, help="min gross edge (dollars per $1)")
    ap.add_argument("--top", type=int, default=15)
    ap.add_argument("--json", default="")
    args = ap.parse_args()
    while True:
        print(f"\n########## scan @ {time.strftime('%Y-%m-%d %H:%M:%S %Z')} ##########")
        try:
            run_scan(args)
        except Exception as e:
            print(f"[scan] ERROR: {e!r}", file=sys.stderr)
        if args.loop <= 0:
            break
        time.sleep(args.loop)

if __name__ == "__main__":
    main()
