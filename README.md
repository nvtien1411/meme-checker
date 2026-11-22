# Meme Checker

Paste a contract address, get a verdict you can argue with: eight checks, each
showing the number behind it and where that number came from.

Solana · BNB Chain · Ethereum · Base · Robinhood Chain. No API key, no wallet
connection, no account required to check a token.

## Why it is shaped this way

The brief asked for Token Overview, Project Info, Narrative and Top 10 holders.
That is DexScreener plus a text box, and nobody opens a second tab for it. The
screens here lead with the question a trader actually asks — *what would cost me
money if I buy this* — and treat the reference data as supporting evidence.

The rule that shaped every component: **a missing value is never turned into a
number, a warning, or a pass.** Missing data renders as `unknown`, is excluded
from the score, and cannot be averaged away by other checks passing.

## The eight checks

| # | Check | Fails when |
|---|---|---|
| 1 | Can you sell it | Honeypot, or live freeze authority |
| 2 | Is the supply fixed | Mint authority live (hard fail under 30 days) |
| 3 | Can the liquidity be pulled | Under 50% of LP locked or burned |
| 4 | Does one wallet hold too much | >6% in one address (<30d), >15% (mature) |
| 5 | Is the supply one entity in disguise | ≥30% held by wallets sharing a funder |
| 6 | Has the creator done this before | Any prior token rugged |
| 7 | Is the trading real | Net selling beyond −20% by volume |
| 8 | Can you actually get out | Under $2,000 before 5% price impact |

Thresholds come from public checklists that traders and Bubblemaps' own guidance
converge on, not from a model. See `/faq` for the per-check caveat list.

Verdict bands: `NO RED FLAGS` → `WATCH` → `HIGH RISK` → `AVOID`. Any check
unanswered demotes out of `NO RED FLAGS`, because the strongest label on the page
must be the best-supported one.

## Data sources

All free, no key, verified against live endpoints:

- **DexScreener** — pairs, price, liquidity, volume, age, project links
- **GeckoTerminal** — trade tape, pool discovery (~30 rpm)
- **RugCheck** — Solana holders, authorities, creator history
- **GoPlus** — EVM contract security, honeypot, taxes, blacklists

Rate limiting is per-provider with a token bucket, a circuit breaker that skips a
provider after a 429 instead of retrying into it, and TTL caches. A wall-clock
budget (34s) makes optional stages degrade with a stated reason rather than
letting the host kill the request.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

No environment variables required. Optional:

```bash
SOLANA_RPC_URL=...   # private RPC for faster cluster tracing
```

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing, hero CA input |
| `/check` | Token checker with validation states |
| `/token/[chain]/[address]` | Analysis result (shareable, server-rendered) |
| `/pricing` | Free / Premium / Group, with "not built" stated plainly |
| `/login` | Auth form (not wired — says so) |
| `/dashboard` | History and plan (placeholder layout, labelled) |
| `/faq` | Per-check documentation and risk disclosure |

## Known limits

These are stated in the UI, not hidden:

- Wallet cluster tracing is **Solana only** and skipped for pairs older than 7 days
- **No X / social data** — narrative is a keyword classifier, marked `inferred`
- Exit math is **single-pool**; multi-pool routing and CEX depth are excluded
- Premium features are **not implemented**; nothing is gated behind them
- Accounts, saved history and billing are **not connected**

Design system, component inventory and handoff notes: [DESIGN.md](DESIGN.md).
