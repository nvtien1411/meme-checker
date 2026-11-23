# MEME CHECKER — BACKEND HANDOFF
### Feature-by-feature data contract · UI is built, this is what fills it

Every module below already exists in the frontend. Where the data is missing the UI
renders `not measured` — it never invents a value. This document says exactly what to
return and the UI fills itself in.

**Rule for every field:** `value` · `source` · `asOf` · `null` when unknown.
`null` must render as unknown, never as 0, never as pass, never as a warning.

---

## 0. What is live today

| Endpoint | Status | Supplies |
|---|---|---|
| `/api/analyze?address=&chain=` | **live** | market data, holders, contract security, exit depth, flow, deployer basics, 8 checks, verdict, provenance |

Everything else in this document is not yet wired. The UI for it exists.

---

## 1. BUNDLE INTELLIGENCE

**Purpose** — show that one group bought the creation block, who they are, and whether
they have started selling.

**User problem** — a bundle percentage says supply is concentrated. It does not say
whether that supply is about to hit the market. 18% held by four wallets with no sales
and 18% held by four wallets that sold half last launch are completely different trades.

**Free / VIP split**
- Free: wallet count, supply share, whether the group shares a funder, sell synchrony,
  exit window, confidence.
- VIP: every wallet, its funder, its record elsewhere, holding duration, sell history,
  the launch-to-distribution timeline, prior exit playbook.

### Required data

```
bundle = {
  detected:            boolean
  walletCount:         number
  supplyPct:           number        // sum of current holdings
  boughtPct:           number        // sum at launch block
  soldPct:             number        // of what they bought
  sharedFunderCount:   number        // how many share one funding source
  sellSynchrony:       number        // 0-1, share that sold inside one slot
  exitWindowSeconds:   number        // first sell -> 50% drawdown
  confidence:          "high"|"medium"|"low"
  launchSlot:          number
  wallets: [{
    address, funderAddress|null, firstSeenAt|null,
    boughtPct, boughtUsd|null, boughtAt,
    soldPct, soldUsd|null, firstSellAt|null, firstSellOffsetSec|null,
    holdHours|null, stillHoldsPct, status: "holding"|"sold"|"transferred",
    priorLaunchCount|null, priorRugCount|null
  }]
}
```

**How to compute**
- `detected` — ≥2 buy transactions in the same slot as the token creation. Non-negotiable:
  nobody outside the group can trade in that slot.
- `sellSynchrony` — group sells by `sellSlot`; share of wallets that appear in the single
  most common slot.
- `exitWindowSeconds` — first group sell → timestamp price is 50% below the post-launch
  high. Requires price ticks at transaction resolution.
- `priorRugCount` — for each wallet, count prior tokens where liquidity was removed or
  price fell 90% and stayed there. Needs your own accumulating index; no public API has it.

**Dependencies** — full launch-block transaction read, wallet age, funding trace 1 hop,
cross-token wallet index.

**Limits** — a private launch that never had a public block has no bundle to detect.
Wallets funded through an exchange cannot be linked past the withdrawal.

**Frontend** — `src/components/BundleIntel.tsx`, tab `Wallets`.
Add `enabled: true` to `forensics` in `AnalysisResult` and this renders.

---

## 2. SNIPER INTELLIGENCE

**Purpose** — identify wallets that bought within seconds of the open, and whether they
are still holding.

**User problem** — snipers are usually the first sellers. Knowing a sniper wallet has a
record of dumping in the first hour changes the position size.

### Required data

```
snipers = {
  count: number
  supplyPct: number
  sold: number              // wallets that have sold any
  transferred: number
  holding: number
  profitMultiple: number|null   // median cost basis vs current price
  wallets: [{
    address, boughtAt, boughtUsd, boughtPct,
    soldPct, firstSellOffsetSec|null, stillHoldsPct,
    status, avgEntryPrice|null, avgExitPrice|null,
    priorLaunchCount|null, priorRugCount|null, funderAddress|null
  }]
}
```

**How to compute** — first 10 seconds of trading after the pool opens. `profitMultiple`
is the median of `currentPrice / avgEntryPrice` across wallets still holding.

**Dependencies** — transaction stream with timestamps, wallet history index.

**Frontend** — `Wallets` tab, `Snipers` panel.

---

## 3. INSIDER & FRESH WALLET

**Purpose** — supply that was handed out rather than bought, and wallets created just
before launch.

**User problem** — a wallet that received supply has no cost basis. There is no price at
which it is forced to hold.

### Required data

```
insiders = {
  walletCount, supplyPct,
  wallets: [{
    address, receivedFrom, receivedAt, receivedPct,
    soldPct, stillHoldsPct, status,
    priorLaunchCount|null, priorRugCount|null
  }]
}

fresh = {
  count, supplyPct,
  wallets: [{
    address, firstSeenAt, hoursBeforeLaunch,
    funderAddress|null, boughtPct, stillHoldsPct
  }]
}
```

**How to compute**
- insider — a transfer from the deployer wallet, or from a wallet that received from the
  deployer, with no matching purchase.
- fresh — wallet's first on-chain activity inside 7 days before launch.

**Frontend** — `Wallets` tab, `Insider supply` and `Fresh wallets` panels.

---

## 4. FUNDING ORIGIN (VIP)

**Purpose** — trace where the money came from.

**User problem** — three wallets with three different addresses look like three people.
Funded from one source inside eleven minutes, they are one.

### Required data

```
funding = {
  traces: [{
    wallet,
    hops: [{ from, to, amountUsd, at, kind: "transfer"|"withdrawal"|"swap" }],
    terminal: "cex"|"bridge"|"unknown",
    cexLabel|null
  }],
  sharedSources: [{
    source, walletCount, wallets: [], seedWindowSeconds,
    alsoFundedDeployer: boolean
  }]
}
```

**How to compute** — walk back from each wallet's first inbound transfer. 2 hops minimum,
3 preferred. Label a terminal as CEX only against a known hot-wallet list.

**Dependencies** — RPC with full transaction history, CEX hot-wallet labels.

**Limits** — ends at an exchange withdrawal. Beyond that the trail is gone by design.

**Frontend** — `Wallets` tab `Traced funding origins` gate, `deployers/[addr]` funding tree.

---

## 5. CALLER / KOL INTELLIGENCE

**Purpose** — decide whether an account is worth following.

**User problem** — the only question a follower has is "did this person sell into me".
Follower count answers nothing.

**Free / VIP split**
- Free: who posted, link to the post, timestamp, market cap at post, follower count.
- VIP: full history, win rate, median multiple, exit-against-call, lead time, smart followers.

### Required data

```
callers = {
  posts: [{
    handle, displayName, followers, postUrl, postedAt,
    wallet|null,
    priceAtPost, mcapAtPost,
    prePostRunUpPct|null,        // move in the 3 min before the post
    leadSeconds|null,            // wallet buy time - post time. negative = posted first
    postCallSoldPct|null,        // share of position sold after posting
    avgExitPrice|null,           // to compute exitVsCallPrice
    exitVsCallPrice|null,
    peakPrice|null, hoursToPeak|null, outcome: "won"|"flat"|"lost"
  }],
  aggregates: {
    calls, wins, deadCalls,
    winRate, medianMultiple, avgMultiple, best, worst
  },
  cabal: {
    score: 0-100|null, windowMinutes|null, handles: [],
    signals: [{ id, label, fired, evidence }]
  }
}
```

**How to compute**
- `exitVsCallPrice` — caller wallet's volume-weighted average exit ÷ price at the second
  the post went live. **Above 1.0 means they sold above what the post offered.** This is
  the single most valuable number in the product.
- `leadSeconds` — negative means they posted before buying, which means they did not
  believe their own call.
- `winRate` — share of calls that touched 2× at any point. Count only the first call per
  token; reposts are farming.
- `cabalScore` — number of mid-tier accounts (10k–60k followers) posting the same contract
  inside a short window, weighted by whether those accounts have posted together before.

**Dependencies** — X post index by contract or cashtag with second-level timestamps;
caller wallet matching; price history at transaction resolution.

**Limits** — matching an X account to a wallet is a guess unless the account publishes an
address. Never present a match as certain — carry a confidence field.

**Frontend** — `/callers`, `/callers/[handle]`, report tab `Callers`.

---

## 6. SMART FOLLOWER (VIP)

**Purpose** — count wallets that buy after a post, and whether those wallets are the exit.

**User problem** — this is the question the whole product exists for. If 45% of the
wallets that later sold bought *before* the post, the post was a bid, not a signal.

### Required data

```
followers = {
  post: { handle, postedAt, mint },
  buckets: [{ label, minutesFromPost, walletCount, pct }],
  wallets: [{
    address, boughtAt, secondsAfterPost,
    entryPrice, entryMcap, boughtUsd,
    soldPct, exitPrice|null, pnlPct|null,
    stillHolding, isRepeat: boolean, repeatCount|null,
    createdAt|null,                    // fresh follower detection
    funderAddress|null
  }],
  aggregates: {
    uniqueWallets, repeatWallets, medianEntrySeconds,
    beforePostShare, afterPostShare, underwaterShare
  },
  overlap: [{ otherHandle, sharedWallets, totalWallets }]
}
```

**How to compute**
- follower = bought within 60 minutes after the post, excluding wallets already holding
  before it.
- `beforePostShare` — of all wallets that bought in the 60 minutes either side, the share
  that bought before the post. This is the number that exposes the setup.
- `underwaterShare` — followers whose current price is below their entry.

**Dependencies** — everything callers needs, plus per-wallet trade history after the post.

**Frontend** — `/smart-followers`, report tab `Callers`.

---

## 7. NARRATIVE INTELLIGENCE

**Purpose** — say whether an idea is new, recycled or saturated.

**User problem** — "the twelfth cat-with-a-hat in a week" is a different trade from the
first, and the chart looks identical.

### Required data

```
narrative = {
  cluster, keywords: [],
  copyIndex|null,             // 1 = original, 12 = twelfth in 7 days
  firstMover|null,
  organicScore|null,          // share of mentions with no contract address
  survivalMedianHours|null,
  priorInstances: [{
    address, symbol, peakMarketCap, hoursToPeak, hoursToMinus90, launchedAt
  }],
  mindshare7d|null, trend: "rising"|"peaking"|"cooling"|"stable"|null,
  saturation: { similarTokens7d, newTokens24h }|null
}
```

**How to compute**
- `copyIndex` — count tokens in the same cluster launched in the trailing 7 days, ranked
  by launch time. Needs a cluster taxonomy; start with keyword matching on the description.
- `organicScore` — of mentions of this token in the window, the share that contain no
  contract address and no buy link.

**Dependencies** — description text from DexScreener/GeckoTerminal, a matter of keyword
clustering, and social mention count.

**Limits** — clustering by keyword is crude. Label it heuristic.

**Frontend** — `/narratives`, report tab `Narrative`.

---

## 8. DEPLOYER HISTORY

**Purpose** — every prior launch, and how each ended.

**User problem** — "has this dev done it before" is answerable, and almost nobody answers it.

### Required data

```
deployer = {
  address, firstSeenAt,
  launches: [{
    mint, symbol, chain, launchedAt,
    peakMarketCap, currentMarketCap|null,
    drawdownPct|null,
    status: "live"|"rugged"|"abandoned",
    rugFlag: "confirmed"|"reported"|"suspected"|null,
    signals: [],               // what fired before the collapse
    bundlePct|null, insiderPct|null
  }],
  priorRugCount, priorLaunchCount,
  fundingSource|null,
  sharedWalletsAcrossLaunches: [{ address, appearanceCount, role }]
}
```

**Dependencies** — an index of deployer → tokens, built by reading creation transactions.
No public API provides this; it is the core of your own database.

**Frontend** — `/deployers`, `/deployers/[addr]`.

---

## 9. WALLET INTELLIGENCE

**Purpose** — one address, all its appearances, everywhere.

### Required data

```
wallet = {
  address, label|null, firstSeenAt,
  role: "deployer"|"bundler"|"sniper"|"insider"|"smart"|"follower"|"unclassified",
  appearances: [{ mint, symbol, chain, pct, boughtPct, soldPct, status, firstSellAt }],
  trades: [{ at, kind, mint, symbol, amountUsd, price, pctOfSupply }],
  stats: { priorLaunches, priorRugs, medianHoldHours, winRate|null, pnlUsd|null },
  funding: { source|null, sharedWith: [] },
  related: [{ address, reason, confidence }]
}
```

**Rule** — the same address must return the same record everywhere it appears. A wallet
that shows 3.1% on one page and 7.4% on another destroys trust in every number.

**Frontend** — `/wallets`, `/wallets/[addr]`.

---

## 10. SMART MONEY

```
smartMoney = {
  holders: [{ address, priorLaunches, priorRugs, entryPrice, entryUsd, pct, stillHolding, pnlPct|null }],
  netFlow: { entered24h, exited24h, stillHolding, net },
  entryPriceMedian|null,
  classification: "observed"|"heuristic"   // be honest about how wallets qualify
}
```

**Limits** — a "smart wallet" is a wallet with a profitable history, which is a backward
measure. Experienced wallets trade rugs on purpose and leave first.

**Frontend** — `/wallets` smart panel, report tab `Holders`.

---

## Honest scope note for the frontend

Six modules are **demo data**, labelled `DEMO` at every figure: bundle, snipers, insiders,
fresh wallets, callers, smart followers, narrative history. The layout, gating and empty
states are real. The numbers are not, and the UI says so on every panel that uses them.

When you ship one of these, set `enabled: true` (wallet layer) or `available: true`
(callers / narrative) on the corresponding object in `AnalysisResult` and the demo layer
is replaced automatically — no frontend change needed.

---

## Where the code lives

| Concern | File |
|---|---|
| Data contract | `src/lib/types.ts` |
| Demo dataset | `src/lib/demo.ts` |
| Free/VIP switch | `src/lib/viewer.tsx` |
| Gate component | `src/components/ui.tsx` → `Gated` |
| Bundle module | `src/components/BundleIntel.tsx` |
| Report tabs | `src/components/report.tsx` |
| Live pipeline | `src/lib/analyze.ts`, `src/lib/providers/*` |
