# Degen UX — frontend decisions and backend handoff

## What we could observe

- On the live WAGMI homepage, the first viewport is led by one explicit outcome — “Stop being exit liquidity” — and one wallet action. Below it, the product explains the pain (bad habits, missed exits), shows the scan and coach, then adds narrative and the paid gate. Take that directness and progressive proof; do not copy WAGMI’s copy, colors, or layout.
- WAGMI’s live H1 measured about 58 px in the inspected viewport. Meme Checker’s home now leads with “Before you ape, check who’s holding” and immediately offers the CA scanner.
- Direct X search returned HTTP 403. These are public search-indexed posts, not representative research or independently audited claims. Treat each as a feature hypothesis and keep the source/method visible.
- **Bundle retention matters more than entry count alone:** [Stitch](https://x.com/stitchdegen/status/2119916835001008430) and [Bitecong](https://x.com/bitecong/status/2117837969822462451) discuss how many launch bundlers/snipers remain in a token. [Bubblemaps’ $BULL thread](https://x.com/bubblemaps/status/2048709081440170075) describes a cluster that sold in small chunks while retaining a reported 30% of supply. These are case studies, not proof of common ownership in other tokens.
- **Wallet relationships need receipts:** [Specter](https://x.com/SpecterAnalyst/status/2055268971918586318) describes tracking repeat wallet links across launches. The useful product primitive is a navigable funding/transaction graph with confidence and timestamps, not a definitive “cabal” badge.
- **A caller’s PnL is not a follower’s PnL:** [Pump.fun](https://x.com/Pumpfun/status/2118773994522624338) says it aligned callouts with buys to improve accuracy/transparency. [Dethective’s analysis](https://x.com/dethective/status/2119832365971243380) says it used Pump.fun’s follower realized PnL data and reports losses among a sample of paid callers; this is the author’s dataset and methodology, not a market-wide audit. [Seelffff’s replay](https://x.com/seelffff/status/2118021466977394698) tests leaderboards against late entry, slippage, hold time, and dependence on the best trade. Product implication: show the call timestamp, follower entry/exit window, sample size and slippage assumptions; never imply a profitable caller makes a call copyable.

## Priorities

1. **First screen (Free)** — one dominant CA action; demo examples explicitly labeled; explain chain support without competing cards. State the scan outcome in plain language and put the evidence immediately below it.
2. **Exit size (Free)** — surface the existing pool-based price-impact estimate near liquidity and keep assumptions visible. It is not a guaranteed fill or sellability test. If missing, show `Not measured`.
3. **Bundle retention (Free summary, Pro evidence)** — distinguish `% at launch` and `% of supply still in labeled wallets`, use separate denominators and timestamps, and link to wallet evidence. Pro: median time to first sell among observed sellers, with seller count. Do not infer beneficial ownership from transfers alone.
4. **Call timeline / caller credibility (Pro evidence)** — show post, buy and sell together only when available, with attribution confidence and evidence links. Include follower outcomes by time window, sample count and slippage assumptions. Shared timing or funding alone is not proof of coordination. No PnL leaderboard based on tiny samples.

## Backend fields — not implemented

- Bundle cohorts: mint, wallet ID, inclusion reason, observed at, launch supply, snapshot supply, launch units, snapshot balance units, first observed sell or null, funding evidence references
- Call evidence: X post URL, published at, wallet attribution source and confidence, buy and sell transaction IDs/timestamps, first sell or null, position remaining when known
- Follower replay: call ID, sample size, entry delay, size, fees/slippage assumptions, realized PnL at each window, open/closed status
- Missing data is null/unknown, not zero; demo datasets are labeled and must not be used as live signals
